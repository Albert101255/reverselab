import lief
from app.parsers.base_parser import BaseParser
from app.detectors.file_detector import FileDetector
from app.analysis.disassembler import DisassemblerEngine

class PEParser(BaseParser):
    def parse(self, file_bytes: bytes, filename: str) -> dict:
        pe = lief.PE.parse(list(file_bytes))
        
        headers = []
        sections = []
        imports = []
        exports = []
        functions = []
        
        if pe:
            # DOS Header
            dos = pe.dos_header
            headers.extend([
                {"field": "e_magic", "offset": "0x00", "hex_value": hex(dos.magic), "decoded_value": "MZ Signature", "description": "Magic number for MS-DOS executable"},
                {"field": "e_lfanew", "offset": "0x3C", "hex_value": hex(dos.addressof_new_exeheader), "decoded_value": str(dos.addressof_new_exeheader), "description": "Offset to PE Header"}
            ])

            # PE Header
            hdr = pe.header
            headers.extend([
                {"field": "Machine", "offset": "PE+0x04", "hex_value": hex(int(hdr.machine)), "decoded_value": str(hdr.machine), "description": "Target CPU architecture"},
                {"field": "NumberOfSections", "offset": "PE+0x06", "hex_value": hex(hdr.numberof_sections), "decoded_value": str(hdr.numberof_sections), "description": "Number of sections in file"},
                {"field": "TimeDateStamp", "offset": "PE+0x08", "hex_value": hex(hdr.time_date_stamp), "decoded_value": str(hdr.time_date_stamp), "description": "Epoch timestamp of build"}
            ])

            # Optional Header
            opt = pe.optional_header
            headers.extend([
                {"field": "AddressOfEntryPoint", "offset": "Opt+0x10", "hex_value": hex(opt.addressof_entrypoint), "decoded_value": hex(opt.addressof_entrypoint), "description": "Execution start address RVA"},
                {"field": "ImageBase", "offset": "Opt+0x1C", "hex_value": hex(opt.imagebase), "decoded_value": hex(opt.imagebase), "description": "Preferred loading address in memory"}
            ])

            # Sections
            for sec in pe.sections:
                sec_bytes = bytes(sec.content)
                sec_entropy = FileDetector.calculate_entropy(sec_bytes)
                
                perms = []
                if sec.has_characteristic(lief.PE.SECTION_CHARACTERISTICS.MEM_READ): perms.append("R")
                if sec.has_characteristic(lief.PE.SECTION_CHARACTERISTICS.MEM_WRITE): perms.append("W")
                if sec.has_characteristic(lief.PE.SECTION_CHARACTERISTICS.MEM_EXECUTE): perms.append("X")
                
                sections.append({
                    "name": sec.name,
                    "virtual_address": hex(sec.virtual_address),
                    "raw_offset": hex(sec.pointerto_raw_data),
                    "raw_size": sec.sizeof_raw_data,
                    "virtual_size": sec.virtual_size,
                    "permissions": "".join(perms) if perms else "None",
                    "entropy": sec_entropy
                })

            # Imports
            for imp in pe.imports:
                func_names = [f.name for f in imp.entries if f.name]
                imports.append({
                    "library": imp.name,
                    "functions": func_names[:50]
                })

            # Exports
            if pe.has_exports:
                exp = pe.get_export()
                for f in exp.entries:
                    exports.append({
                        "name": f.name if f.name else f"Ordinal_{f.ordinal}",
                        "address": hex(f.address),
                        "ordinal": f.ordinal
                    })

            entry_point_val = hex(opt.imagebase + opt.addressof_entrypoint)
            
            # Disassemble .text section
            code_bytes = b""
            text_sec = pe.get_section(".text")
            if text_sec:
                code_bytes = bytes(text_sec.content)
            elif len(pe.sections) > 0:
                code_bytes = bytes(pe.sections[0].content)

            disasm = DisassemblerEngine.disassemble(
                code_bytes,
                opt.imagebase + opt.addressof_entrypoint,
                arch="x86-64" if pe.optional_header.magic == lief.PE.PE_TYPE.PE32_PLUS else "x86",
                bitness=64 if pe.optional_header.magic == lief.PE.PE_TYPE.PE32_PLUS else 32
            )

            functions.append({
                "name": "entry",
                "address": entry_point_val,
                "size": len(code_bytes),
                "calls": [imp["functions"][0] for imp in imports if imp["functions"]] if imports else [],
                "references": [],
                "instructions": disasm
            })

            return {
                "format": "PE32+" if pe.optional_header.magic == lief.PE.PE_TYPE.PE32_PLUS else "PE32",
                "platform": "Windows",
                "architecture": "x86-64" if pe.optional_header.magic == lief.PE.PE_TYPE.PE32_PLUS else "x86",
                "bitness": 64 if pe.optional_header.magic == lief.PE.PE_TYPE.PE32_PLUS else 32,
                "endianness": "Little Endian",
                "entry_point": entry_point_val,
                "image_base": hex(opt.imagebase),
                "headers": headers,
                "sections": sections,
                "imports": imports,
                "exports": exports,
                "functions": functions,
                "disassembly_preview": disasm
            }

        return {}

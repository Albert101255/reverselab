try:
    import lief
    LIEF_AVAILABLE = True
except ImportError:
    lief = None
    LIEF_AVAILABLE = False

from app.parsers.base_parser import BaseParser
from app.detectors.file_detector import FileDetector
from app.analysis.disassembler import DisassemblerEngine

class ELFParser(BaseParser):
    def parse(self, file_bytes: bytes, filename: str) -> dict:
        elf = lief.ELF.parse(list(file_bytes)) if LIEF_AVAILABLE else None
        
        headers = []
        sections = []
        imports = []
        exports = []
        functions = []

        if elf:
            hdr = elf.header
            headers.extend([
                {"field": "e_ident[EI_MAG]", "offset": "0x00", "hex_value": "7F 45 4C 46", "decoded_value": ".ELF Signature", "description": "ELF magic bytes identifier"},
                {"field": "e_class", "offset": "0x04", "hex_value": hex(int(hdr.identity_class)), "decoded_value": str(hdr.identity_class).split('.')[-1], "description": "File architecture class (32/64-bit)"},
                {"field": "e_machine", "offset": "0x12", "hex_value": hex(int(hdr.machine_type)), "decoded_value": str(hdr.machine_type).split('.')[-1], "description": "Target processor architecture"},
                {"field": "e_entry", "offset": "0x18", "hex_value": hex(hdr.entrypoint), "decoded_value": hex(hdr.entrypoint), "description": "Program entry point address"}
            ])

            bitness = 64 if hdr.identity_class == lief.ELF.Header.CLASS.ELF64 else 32
            arch_str = str(hdr.machine_type).split('.')[-1]

            # Sections
            for sec in elf.sections:
                sec_bytes = bytes(sec.content)
                sec_entropy = FileDetector.calculate_entropy(sec_bytes)
                
                perms = []
                if sec.has(lief.ELF.Section.FLAGS.ALLOC): perms.append("R")
                if sec.has(lief.ELF.Section.FLAGS.WRITE): perms.append("W")
                if sec.has(lief.ELF.Section.FLAGS.EXECINSTR): perms.append("X")

                sections.append({
                    "name": sec.name if sec.name else "<unnamed>",
                    "virtual_address": hex(sec.virtual_address),
                    "raw_offset": hex(sec.offset),
                    "raw_size": sec.size,
                    "virtual_size": sec.virtual_address,
                    "permissions": "".join(perms) if perms else "None",
                    "entropy": sec_entropy
                })

            # Imports & Dynamic Symbols
            for imp in elf.imported_functions:
                imports.append({
                    "library": "libc.so / Dynamic",
                    "functions": [imp.name]
                })

            # Exports / Dynamic Symbols
            for exp in elf.exported_functions:
                exports.append({
                    "name": exp.name,
                    "address": hex(exp.value),
                    "ordinal": None
                })

            # Disassemble .text section
            code_bytes = b""
            text_sec = elf.get_section(".text")
            if text_sec:
                code_bytes = bytes(text_sec.content)
            elif len(elf.sections) > 0:
                code_bytes = bytes(elf.sections[0].content)

            disasm = DisassemblerEngine.disassemble(
                code_bytes,
                hdr.entrypoint,
                arch=arch_str,
                bitness=bitness
            )

            functions.append({
                "name": "main",
                "address": hex(hdr.entrypoint),
                "size": len(code_bytes),
                "calls": [exp.name for exp in elf.exported_functions[:5]],
                "references": [],
                "instructions": disasm
            })

            return {
                "format": f"ELF{bitness}",
                "platform": "Linux / Unix",
                "architecture": arch_str,
                "bitness": bitness,
                "endianness": "Little Endian" if hdr.identity_data == lief.ELF.Header.ELF_DATA.LSB else "Big Endian",
                "entry_point": hex(hdr.entrypoint),
                "image_base": "0x00000000",
                "headers": headers,
                "sections": sections,
                "imports": imports,
                "exports": exports,
                "functions": functions,
                "disassembly_preview": disasm
            }

        return {}

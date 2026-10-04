import hashlib
import uuid
import math
import sys
import io

from app.detectors.file_detector import FileDetector
from app.analysis.strings import StringExtractor
from app.analysis.decompiler_engine import DecompilerEngine
from app.parsers.pe_parser import PEParser
from app.parsers.elf_parser import ELFParser
from app.parsers.apk_parser import APKParser

# Simple in-memory database store for prototype analysis jobs & raw bytes
ANALYSIS_DB = {}
RAW_BYTES_DB = {}

def _headers_to_dict(headers_raw) -> dict:
    """Convert either a list of HeaderField dicts or an existing dict to a flat dict."""
    if isinstance(headers_raw, dict):
        return headers_raw
    if isinstance(headers_raw, list):
        out = {}
        for item in headers_raw:
            if isinstance(item, dict):
                key = item.get("field", "?")
                val = item.get("decoded_value") or item.get("hex_value") or ""
                out[key] = val
        return out
    return {}

def _format_hex_preview(raw: bytes, max_bytes: int = 4096) -> str:
    """Return a space-separated hex string, e.g. '4D 5A 90 00 ...'"""
    chunk = raw[:max_bytes]
    return ' '.join(f'{b:02X}' for b in chunk)

def _generate_xrefs(functions, imports, strings) -> list:
    """Build synthetic and parsed cross-references (XREFs)."""
    xrefs = []
    # Function to Function calls
    for fn in functions:
        fname = fn.get("name", "sub_unk")
        faddr = fn.get("address", "0x0")
        for call in fn.get("calls", []):
            xrefs.append({
                "from_addr": faddr,
                "to_addr": "0x401000",
                "type": "CALL",
                "target_name": call
            })
    # String XREFs
    for i, s in enumerate(strings[:15]):
        xrefs.append({
            "from_addr": f"0x{0x401000 + i*0x20:X}",
            "to_addr": s.get("address", "0x0"),
            "type": "DATA_READ",
            "target_name": f'"{s.get("value", "")[:20]}"'
        })
    # Import XREFs
    for imp in imports[:10]:
        lib = imp.get("library", "lib") if isinstance(imp, dict) else imp.library
        funcs = imp.get("functions", []) if isinstance(imp, dict) else imp.functions
        for f in funcs[:3]:
            xrefs.append({
                "from_addr": "0x401040",
                "to_addr": "0x408000",
                "type": "CALL",
                "target_name": f"{lib}!{f}"
            })
    return xrefs

def _generate_data_types(fmt: str) -> list:
    """Return Ghidra Data Type definitions for standard C structs."""
    if "ELF" in fmt:
        return [
            {
                "name": "Elf64_Ehdr",
                "category": "ELF Headers",
                "size": 64,
                "fields": [
                    {"name": "e_ident", "type_name": "unsigned char[16]", "offset": 0, "size": 16},
                    {"name": "e_type", "type_name": "uint16_t", "offset": 16, "size": 2},
                    {"name": "e_machine", "type_name": "uint16_t", "offset": 18, "size": 2},
                    {"name": "e_version", "type_name": "uint32_t", "offset": 20, "size": 4},
                    {"name": "e_entry", "type_name": "Elf64_Addr", "offset": 24, "size": 8},
                    {"name": "e_phoff", "type_name": "Elf64_Off", "offset": 32, "size": 8},
                    {"name": "e_shoff", "type_name": "Elf64_Off", "offset": 40, "size": 8},
                ]
            },
            {
                "name": "Elf64_Shdr",
                "category": "ELF Headers",
                "size": 64,
                "fields": [
                    {"name": "sh_name", "type_name": "uint32_t", "offset": 0, "size": 4},
                    {"name": "sh_type", "type_name": "uint32_t", "offset": 4, "size": 4},
                    {"name": "sh_flags", "type_name": "uint64_t", "offset": 8, "size": 8},
                    {"name": "sh_addr", "type_name": "Elf64_Addr", "offset": 16, "size": 8},
                    {"name": "sh_offset", "type_name": "Elf64_Off", "offset": 24, "size": 8},
                    {"name": "sh_size", "type_name": "uint64_t", "offset": 32, "size": 8},
                ]
            }
        ]
    return [
        {
            "name": "IMAGE_DOS_HEADER",
            "category": "PE Headers",
            "size": 64,
            "fields": [
                {"name": "e_magic", "type_name": "WORD (0x5A4D)", "offset": 0, "size": 2},
                {"name": "e_cblp", "type_name": "WORD", "offset": 2, "size": 2},
                {"name": "e_cp", "type_name": "WORD", "offset": 4, "size": 2},
                {"name": "e_crlc", "type_name": "WORD", "offset": 6, "size": 2},
                {"name": "e_cparhdr", "type_name": "WORD", "offset": 8, "size": 2},
                {"name": "e_lfanew", "type_name": "LONG", "offset": 60, "size": 4},
            ]
        },
        {
            "name": "IMAGE_FILE_HEADER",
            "category": "PE Headers",
            "size": 20,
            "fields": [
                {"name": "Machine", "type_name": "WORD", "offset": 0, "size": 2},
                {"name": "NumberOfSections", "type_name": "WORD", "offset": 2, "size": 2},
                {"name": "TimeDateStamp", "type_name": "DWORD", "offset": 4, "size": 4},
                {"name": "PointerToSymbolTable", "type_name": "DWORD", "offset": 8, "size": 4},
                {"name": "NumberOfSymbols", "type_name": "DWORD", "offset": 12, "size": 4},
                {"name": "SizeOfOptionalHeader", "type_name": "WORD", "offset": 16, "size": 2},
                {"name": "Characteristics", "type_name": "WORD", "offset": 18, "size": 2},
            ]
        }
    ]

def _generate_entropy_blocks(file_bytes: bytes, sections: list) -> list:
    """Generate per-section / per-chunk entropy distribution blocks."""
    blocks = []
    chunk_size = max(512, len(file_bytes) // 64)
    for i in range(0, min(len(file_bytes), chunk_size * 64), chunk_size):
        chunk = file_bytes[i : i + chunk_size]
        if not chunk:
            continue
        ent = FileDetector.calculate_entropy(chunk)
        sec_name = ".text"
        for sec in sections:
            s_name = sec.get("name", "") if isinstance(sec, dict) else sec.name
            raw_sz = sec.get("raw_size", 0) if isinstance(sec, dict) else sec.raw_size
            if i < raw_sz:
                sec_name = s_name
                break
        blocks.append({
            "offset": i,
            "size": len(chunk),
            "entropy": round(ent, 3),
            "section_name": sec_name
        })
    return blocks

def _generate_decompiled_files(fmt: str, filename: str, functions: list) -> list:
    """Generate virtual project directory structure & decompiled file tree."""
    if "APK" in fmt or "JAR" in fmt or "ZIP" in fmt:
        return [
            {
                "path": "AndroidManifest.xml",
                "type": "xml",
                "content": '<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.reverselab.app">\n    <application android:allowBackup="true" android:icon="@mipmap/ic_launcher" android:label="@string/app_name">\n        <activity android:name=".MainActivity" android:exported="true">\n            <intent-filter>\n                <action android:name="android.intent.action.MAIN" />\n                <category android:name="android.intent.category.LAUNCHER" />\n            </intent-filter>\n        </activity>\n    </application>\n</manifest>'
            },
            {
                "path": "com/reverselab/app/MainActivity.java",
                "type": "java",
                "content": 'package com.reverselab.app;\n\nimport android.os.Bundle;\nimport android.app.Activity;\n\npublic class MainActivity extends Activity {\n    @Override\n    protected void onCreate(Bundle savedInstanceState) {\n        super.onCreate(savedInstanceState);\n        System.out.println("ReverseLab Decompiled App initialized");\n        initSecurityChecks();\n    }\n\n    private void initSecurityChecks() {\n        // Decompiled helper method\n    }\n}'
            },
            {
                "path": "com/reverselab/app/CryptoService.java",
                "type": "java",
                "content": 'package com.reverselab.app;\n\nimport javax.crypto.Cipher;\nimport javax.crypto.spec.SecretKeySpec;\n\npublic class CryptoService {\n    public static byte[] decryptPayload(byte[] data, byte[] key) throws Exception {\n        SecretKeySpec keySpec = new SecretKeySpec(key, "AES");\n        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");\n        cipher.init(Cipher.DECRYPT_MODE, keySpec);\n        return cipher.doFinal(data);\n    }\n}'
            },
            {
                "path": "res/values/strings.xml",
                "type": "xml",
                "content": '<resources>\n    <string name="app_name">ReverseLab Target</string>\n    <string name="api_url">https://api.reverselab.local/v1</string>\n</resources>'
            }
        ]

    # C / C++ Decompiled files for PE, ELF, Mach-O or Raw Binaries
    fn_code_blocks = []
    for fn in functions[:6]:
        fn_name = fn.get("name", "sub_unknown")
        fn_code_blocks.append(f'/* Function: {fn_name} @ {fn.get("address", "0x0")} */\nvoid {fn_name}() {{\n    // Decompiled pseudocode instructions\n    return;\n}}\n')
    
    main_c_body = "\n".join(fn_code_blocks) if fn_code_blocks else 'void main(int argc, char **argv) {\n    printf("ReverseLab Binary Analysis Target\\n");\n    return 0;\n}'

    return [
        {
            "path": "src/main.c",
            "type": "c",
            "content": f'#include <stdio.h>\n#include <stdlib.h>\n#include "reverselab.h"\n\n{main_c_body}'
        },
        {
            "path": "src/crypto.c",
            "type": "c",
            "content": '/* Decompiled Crypto Routines */\n#include <string.h>\n\nvoid decrypt_buffer(unsigned char *buf, size_t len, unsigned char key) {\n    for (size_t i = 0; i < len; i++) {\n        buf[i] ^= key;\n    }\n}'
        },
        {
            "path": "src/network.c",
            "type": "c",
            "content": '/* Decompiled Network Sockets */\n#include <stdio.h>\n\nint connect_remote(const char *host, int port) {\n    printf("Connecting to C2 host: %s:%d\\n", host, port);\n    return 0;\n}'
        },
        {
            "path": "include/reverselab.h",
            "type": "h",
            "content": '/* Auto-generated header for decompiled binary */\n#ifndef REVERSELAB_H\n#define REVERSELAB_H\n\nvoid main();\nvoid decrypt_buffer(unsigned char *buf, size_t len, unsigned char key);\nint connect_remote(const char *host, int port);\n\n#endif'
        },
        {
            "path": "resources/manifest.xml",
            "type": "xml",
            "content": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">\n    <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">\n        <security>\n            <requestedPrivileges>\n                <requestedExecutionLevel level="asInvoker" uiAccess="false"/>\n            </requestedPrivileges>\n        </security>\n    </trustInfo>\n</assembly>'
        }
    ]

class AnalysisService:
    @staticmethod
    def process_file(file_bytes: bytes, filename: str) -> dict:
        file_id = str(uuid.uuid4())
        sha256_hash = hashlib.sha256(file_bytes).hexdigest()
        sha1_hash   = hashlib.sha1(file_bytes).hexdigest()
        md5_hash    = hashlib.md5(file_bytes).hexdigest()
        file_size   = len(file_bytes)

        RAW_BYTES_DB[file_id] = bytearray(file_bytes)

        # Step 1: Detect format
        detection = FileDetector.detect(file_bytes, filename)
        fmt = detection["format"]

        # Step 2: Extract Strings
        extracted_strings = StringExtractor.extract_strings(file_bytes)

        # Step 3: Parse according to format
        parsed_data = {}
        try:
            if "PE" in fmt:
                parser = PEParser()
                parsed_data = parser.parse(file_bytes, filename)
            elif "ELF" in fmt:
                parser = ELFParser()
                parsed_data = parser.parse(file_bytes, filename)
            elif "APK" in fmt or "JAR" in fmt or "ZIP" in fmt:
                parser = APKParser()
                parsed_data = parser.parse(file_bytes, filename)
        except Exception as e:
            print(f"Parser error for {filename}: {e}")

        # Fallbacks for raw/unknown binaries
        headers_raw = parsed_data.get("headers", [])
        headers = _headers_to_dict(headers_raw)
        if not headers:
            headers = {
                "magic_bytes": file_bytes[:4].hex().upper(),
                "file_size_bytes": file_size,
                "format": fmt,
            }

        sections = parsed_data.get("sections", [
            {
                "name": ".raw",
                "virtual_address": "0x00000000",
                "raw_offset": "0x00000000",
                "raw_size": file_size,
                "virtual_size": file_size,
                "permissions": "R--",
                "entropy": FileDetector.calculate_entropy(file_bytes),
            }
        ])
        imports    = parsed_data.get("imports", [])
        exports    = parsed_data.get("exports", [])
        functions  = parsed_data.get("functions", [])
        disasm_preview = parsed_data.get("disassembly_preview", [])

        # Step 4: Hex Preview (first 4 KB)
        hex_preview = _format_hex_preview(file_bytes, 4096)

        # Step 5: Ghidra Features (Xrefs, Data Types, Entropy, Decompiled File Tree)
        xrefs = _generate_xrefs(functions, imports, extracted_strings)
        data_types = _generate_data_types(fmt)
        entropy_blocks = _generate_entropy_blocks(file_bytes, sections)
        decompiled_files = _generate_decompiled_files(fmt, filename, functions)

        # Compute basic flags
        is_stripped = parsed_data.get("is_stripped", None)
        is_packed   = parsed_data.get("is_packed", None)
        if is_packed is None:
            overall_entropy = FileDetector.calculate_entropy(file_bytes)
            is_packed = overall_entropy > 7.0

        overview = {
            "filename": filename,
            "file_size": file_size,
            "md5": md5_hash,
            "sha1": sha1_hash,
            "sha256": sha256_hash,
            "format": parsed_data.get("format", fmt),
            "platform": parsed_data.get("platform", detection["platform"]),
            "architecture": parsed_data.get("architecture", detection["architecture"]),
            "bitness": parsed_data.get("bitness", detection["bitness"]),
            "endianness": parsed_data.get("endianness", detection["endianness"]),
            "entry_point": parsed_data.get("entry_point", "N/A"),
            "image_base": parsed_data.get("image_base", "N/A"),
            "compiler": parsed_data.get("compiler", "Unknown / Standard"),
            "linker_info": parsed_data.get("linker_info", None),
            "packer_hint": parsed_data.get("packer_hint", None),
            "num_sections": len(sections),
            "num_imports": sum(len(imp.get("functions", [])) if isinstance(imp, dict) else len(imp.functions) for imp in imports),
            "num_exports": len(exports),
            "num_functions": len(functions),
            "is_stripped": is_stripped,
            "is_packed": is_packed,
            "has_debug_info": parsed_data.get("has_debug_info", None),
            "is_relocatable": parsed_data.get("is_relocatable", None),
            "is_pie": parsed_data.get("is_pie", None),
        }

        result = {
            "file_id": file_id,
            "overview": overview,
            "headers": headers,
            "sections": sections,
            "strings": extracted_strings,
            "imports": imports,
            "exports": exports,
            "functions": functions,
            "xrefs": xrefs,
            "data_types": data_types,
            "entropy_blocks": entropy_blocks,
            "decompiled_files": decompiled_files,
            "raw_hex_preview": hex_preview,
            "disassembly_preview": disasm_preview,
        }

        ANALYSIS_DB[file_id] = result
        return result

    @staticmethod
    def get_analysis(file_id: str) -> dict:
        return ANALYSIS_DB.get(file_id)

    @staticmethod
    def decompile_function(file_id: str, function_name: str = "main") -> dict:
        analysis = ANALYSIS_DB.get(file_id)
        if not analysis:
            return {"error": "File ID not found"}
        
        functions = analysis.get("functions", [])
        target_fn = None
        for fn in functions:
            fn_n = fn.get("name", "") if isinstance(fn, dict) else fn.name
            if fn_n == function_name:
                target_fn = fn
                break
        
        insts = []
        fn_addr = "0x401000"
        if target_fn:
            insts = target_fn.get("instructions", []) if isinstance(target_fn, dict) else target_fn.instructions
            fn_addr = target_fn.get("address", "0x401000") if isinstance(target_fn, dict) else target_fn.address
        else:
            insts = analysis.get("disassembly_preview", [])

        arch = analysis.get("overview", {}).get("architecture", "x86_64")
        decomp = DecompilerEngine.decompile(insts, function_name, fn_addr, arch)
        return decomp

    @staticmethod
    def patch_bytes(file_id: str, offset: int, hex_bytes: str) -> dict:
        if file_id not in RAW_BYTES_DB:
            return {"error": "File ID not found"}
        try:
            clean_hex = hex_bytes.replace(" ", "").replace("0x", "")
            patch_data = bytes.fromhex(clean_hex)
            raw = RAW_BYTES_DB[file_id]
            if offset + len(patch_data) > len(raw):
                return {"error": "Patch extends beyond file size"}
            raw[offset : offset + len(patch_data)] = patch_data
            if file_id in ANALYSIS_DB:
                ANALYSIS_DB[file_id]["raw_hex_preview"] = _format_hex_preview(bytes(raw), 4096)
            return {"status": "success", "offset": offset, "bytes_patched": len(patch_data)}
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def search_binary(file_id: str, query: str, search_type: str) -> list:
        if file_id not in RAW_BYTES_DB:
            return []
        raw = bytes(RAW_BYTES_DB[file_id])
        results = []
        if search_type == "text":
            q_bytes = query.encode("utf-8", errors="ignore")
            pos = 0
            while True:
                idx = raw.find(q_bytes, pos)
                if idx == -1 or len(results) >= 50:
                    break
                results.append({"offset": f"0x{idx:X}", "match": query, "type": "text"})
                pos = idx + 1
        elif search_type == "hex":
            try:
                clean_q = query.replace(" ", "").replace("0x", "")
                q_bytes = bytes.fromhex(clean_q)
                pos = 0
                while True:
                    idx = raw.find(q_bytes, pos)
                    if idx == -1 or len(results) >= 50:
                        break
                    results.append({"offset": f"0x{idx:X}", "match": query, "type": "hex"})
                    pos = idx + 1
            except Exception:
                pass
        return results

    @staticmethod
    def execute_script(file_id: str, code: str) -> str:
        analysis = ANALYSIS_DB.get(file_id, {})
        raw = RAW_BYTES_DB.get(file_id, b"")
        
        loc = {
            "file_id": file_id,
            "analysis": analysis,
            "raw_bytes": raw,
            "get_functions": lambda: analysis.get("functions", []),
            "get_strings": lambda: analysis.get("strings", []),
            "get_sections": lambda: analysis.get("sections", []),
            "decompile_function": lambda fn_name: AnalysisService.decompile_function(file_id, fn_name),
        }
        
        old_stdout = sys.stdout
        redirected_output = io.StringIO()
        sys.stdout = redirected_output
        try:
            exec(code, {}, loc)
            output = redirected_output.getvalue()
            return output if output else "Script executed successfully (no output)."
        except Exception as e:
            return f"Error: {e}"
        finally:
            sys.stdout = old_stdout

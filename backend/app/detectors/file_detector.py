import os
import math

class FileDetector:
    @staticmethod
    def detect(file_bytes: bytes, filename: str = "") -> dict:
        if len(file_bytes) < 4:
            return {
                "format": "Unknown / Raw Binary",
                "platform": "Unknown",
                "architecture": "Unknown",
                "bitness": 0,
                "endianness": "Unknown"
            }

        magic_2 = file_bytes[:2]
        magic_4 = file_bytes[:4]

        # PE Binary (MZ header)
        if magic_2 == b'MZ':
            is_64 = False
            # Check PE signature offset at 0x3C
            if len(file_bytes) >= 0x40:
                pe_offset = int.from_bytes(file_bytes[0x3C:0x40], 'little')
                if len(file_bytes) >= pe_offset + 24 and file_bytes[pe_offset:pe_offset+4] == b'PE\x00\x00':
                    machine = int.from_bytes(file_bytes[pe_offset+4:pe_offset+6], 'little')
                    # 0x8664 = x64, 0x14c = i386, 0xAA64 = ARM64
                    arch = "x86-64" if machine == 0x8664 else ("x86" if machine == 0x14c else ("ARM64" if machine == 0xAA64 else "x86"))
                    bitness = 64 if machine in [0x8664, 0xAA64] else 32
                    return {
                        "format": f"PE{bitness}",
                        "platform": "Windows",
                        "architecture": arch,
                        "bitness": bitness,
                        "endianness": "Little Endian"
                    }
            return {
                "format": "PE",
                "platform": "Windows",
                "architecture": "x86-64",
                "bitness": 64,
                "endianness": "Little Endian"
            }

        # ELF Binary (\x7fELF)
        if magic_4 == b'\x7fELF':
            bitness = 64 if file_bytes[4] == 2 else 32
            endian = "Little Endian" if file_bytes[5] == 1 else "Big Endian"
            
            # Machine ID at offset 0x12
            machine_id = int.from_bytes(file_bytes[0x12:0x14], 'little' if endian == "Little Endian" else 'big')
            arch_map = {
                0x03: "x86",
                0x3E: "x86-64",
                0x28: "ARM",
                0xB7: "ARM64",
                0xF7: "WebAssembly"
            }
            arch = arch_map.get(machine_id, "x86-64" if bitness == 64 else "x86")
            
            return {
                "format": f"ELF{bitness}",
                "platform": "Linux / Unix",
                "architecture": arch,
                "bitness": bitness,
                "endianness": endian
            }

        # WASM (\x00asm)
        if magic_4 == b'\x00asm':
            return {
                "format": "WebAssembly (.wasm)",
                "platform": "WebAssembly / Multiplatform",
                "architecture": "wasm32",
                "bitness": 32,
                "endianness": "Little Endian"
            }

        # DEX (dex\n)
        if magic_4 == b'dex\n':
            return {
                "format": "Dalvik Executable (.dex)",
                "platform": "Android",
                "architecture": "Dalvik Bytecode",
                "bitness": 32,
                "endianness": "Little Endian"
            }

        # ZIP / APK / JAR (PK\x03\x04)
        if magic_4 == b'PK\x03\x04':
            ext = os.path.splitext(filename)[1].lower() if filename else ""
            fmt = "APK Container" if ext == ".apk" else ("JAR Archive" if ext == ".jar" else "ZIP Package")
            platform = "Android" if ext == ".apk" else ("Java Virtual Machine" if ext == ".jar" else "Universal Container")
            return {
                "format": fmt,
                "platform": platform,
                "architecture": "Bytecode / Archive",
                "bitness": 32,
                "endianness": "Little Endian"
            }

        # Java Class (CA FE BA BE)
        if magic_4 == b'\xca\xfe\xba\xbe':
            return {
                "format": "Java Class File (.class)",
                "platform": "Java Virtual Machine",
                "architecture": "JVM Bytecode",
                "bitness": 32,
                "endianness": "Big Endian"
            }

        return {
            "format": "Unknown / Raw Binary",
            "platform": "Generic",
            "architecture": "Unknown",
            "bitness": 64,
            "endianness": "Little Endian"
        }

    @staticmethod
    def calculate_entropy(data: bytes) -> float:
        if not data:
            return 0.0
        entropy = 0.0
        length = len(data)
        occ = [0] * 256
        for b in data:
            occ[b] += 1
        for count in occ:
            if count > 0:
                p = count / length
                entropy -= p * math.log2(p)
        return round(entropy, 3)

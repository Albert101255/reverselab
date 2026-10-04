try:
    import capstone
    CAPSTONE_AVAILABLE = True
except ImportError:
    CAPSTONE_AVAILABLE = False

class DisassemblerEngine:
    @staticmethod
    def disassemble(code_bytes: bytes, base_address: int, arch: str = "x86-64", bitness: int = 64) -> list:
        instructions = []
        if not CAPSTONE_AVAILABLE or not code_bytes:
            return DisassemblerEngine._fallback_disassemble(code_bytes, base_address)

        try:
            if "x86" in arch.lower():
                c_arch = capstone.CS_ARCH_X86
                c_mode = capstone.CS_MODE_64 if bitness == 64 else capstone.CS_MODE_32
            elif "arm" in arch.lower():
                if "64" in arch or bitness == 64:
                    c_arch = capstone.CS_ARCH_ARM64
                    c_mode = capstone.CS_MODE_ARM
                else:
                    c_arch = capstone.CS_ARCH_ARM
                    c_mode = capstone.CS_MODE_ARM
            else:
                c_arch = capstone.CS_ARCH_X86
                c_mode = capstone.CS_MODE_64

            md = capstone.Cs(c_arch, c_mode)
            # Limit disassembly to first 250 instructions for initial view
            for i, insn in enumerate(md.disasm(code_bytes[:4096], base_address)):
                bytes_str = " ".join([f"{b:02X}" for b in insn.bytes])
                instructions.append({
                    "address": f"0x{insn.address:X}",
                    "bytes": bytes_str,
                    "mnemonic": insn.mnemonic,
                    "operands": insn.op_str
                })
                if len(instructions) >= 200:
                    break
        except Exception as e:
            print(f"Capstone error: {e}")
            return DisassemblerEngine._fallback_disassemble(code_bytes, base_address)

        return instructions

    @staticmethod
    def _fallback_disassemble(code_bytes: bytes, base_address: int) -> list:
        # Graceful fallback if Capstone is missing or fails
        instructions = []
        offset = 0
        limit = min(len(code_bytes), 256)
        while offset < limit:
            chunk = code_bytes[offset:offset+4]
            bytes_str = " ".join([f"{b:02X}" for b in chunk])
            instructions.append({
                "address": hex(base_address + offset),
                "bytes": bytes_str,
                "mnemonic": "db",
                "operands": f"0x{chunk.hex()}"
            })
            offset += 4
        return instructions

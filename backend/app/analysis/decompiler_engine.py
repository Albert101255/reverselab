import re
from typing import List, Dict, Any

SECURITY_APIS = {
    "IsDebuggerPresent": "Anti-Debugging (Process Debug Check)",
    "CheckRemoteDebuggerPresent": "Anti-Debugging (Remote Debug Check)",
    "VirtualAlloc": "Memory Allocation (Executable Page / Shellcode)",
    "VirtualProtect": "Memory Permission Modification (Self-Modifying Code)",
    "CreateRemoteThread": "Process Injection (Remote Thread Creation)",
    "WriteProcessMemory": "Process Injection (Memory Writing)",
    "RegOpenKeyExA": "Persistence (Windows Registry Read)",
    "RegSetValueExA": "Persistence (Windows Registry Write)",
    "WSAStartup": "Networking (Winsock Initialization)",
    "socket": "Networking (Raw Socket Creation)",
    "connect": "Networking (C2 Connection)",
    "InternetOpenA": "Networking (WinINet HTTP Connection)",
    "URLDownloadToFileA": "Networking (Payload Downloader)",
    "WinExec": "Process Execution (Cmd/Powershell Launch)",
    "CreateProcessA": "Process Execution (Child Process Launch)",
    "ptrace": "Linux Anti-Debugging (PTRACE_TRACEME)",
    "mmap": "Memory Allocation (PROT_EXEC Page)",
    "system": "Command Execution (Shell Execution)"
}

class DecompilerEngine:
    @staticmethod
    def decompile(instructions: list, function_name: str = "main", address: str = "0x401000", arch: str = "x86_64") -> dict:
        """
        Decompile assembly instructions into:
        1. High-level C pseudocode (AST Control Flow)
        2. Ghidra P-Code IR microcode
        3. Stack frame variable table
        4. Security & API Heuristics
        """
        pseudocode_lines = []
        pcode_list = []
        stack_vars = {}
        heuristics = []
        calls_found = []

        # Header block
        pseudocode_lines.append(f"/* ============================================================")
        pseudocode_lines.append(f" * Decompiled by ReverseLab Ghidra P-Code Engine v2.0")
        pseudocode_lines.append(f" * Function: {function_name} @ {address} ({arch})")
        pseudocode_lines.append(f" * ============================================================ */")
        pseudocode_lines.append("")

        # Variable identification scan
        reg_map = {}
        var_counter = 0

        for i, inst in enumerate(instructions):
            mnem = inst.get("mnemonic", "").lower()
            ops = inst.get("operands", "")
            addr = inst.get("address", f"0x{0x401000 + i*4:X}")

            # Check for stack variables (e.g. rbp-0x8 or rsp+0x10)
            stack_match = re.search(r'\[(rbp|rsp|ebp|esp)\s*([\+\-]\s*0x[0-9a-fA-F]+|\d+)\]', ops)
            if stack_match:
                offset_str = stack_match.group(2)
                if offset_str not in stack_vars:
                    v_name = f"var_{len(stack_vars)*4 + 4:x}h"
                    stack_vars[offset_str] = {
                        "name": v_name,
                        "offset": offset_str,
                        "type": "int32_t" if "4" in offset_str or "8" in offset_str else "uint64_t",
                        "size": 4,
                    }

            # Check for API calls and heuristics
            if mnem in ["call", "bl", "jal"]:
                target = ops.strip()
                calls_found.append(target)
                for api_name, desc in SECURITY_APIS.items():
                    if api_name.lower() in target.lower():
                        heuristics.append({
                            "address": addr,
                            "api": api_name,
                            "category": desc,
                        })

            # Generate P-Code IR translation
            pcode_list.append(DecompilerEngine._translate_pcode(addr, mnem, ops))

        # Function signature declaration
        args_str = "int argc, char **argv" if function_name == "main" else "void *param_1"
        return_type = "int" if function_name == "main" else "void"
        pseudocode_lines.append(f"{return_type} {function_name}({args_str})")
        pseudocode_lines.append("{")

        # Declare local stack variables
        if stack_vars:
            pseudocode_lines.append("    /* Local Stack Frame Variables */")
            for v in stack_vars.values():
                pseudocode_lines.append(f"    {v['type']:<12} {v['name']};")
            pseudocode_lines.append("")

        # High-level control flow reconstruction
        in_if_block = False
        for i, inst in enumerate(instructions):
            mnem = inst.get("mnemonic", "").lower()
            ops = inst.get("operands", "")
            addr = inst.get("address", "")

            # Translate assembly statements into C AST constructs
            if mnem == "mov" or mnem == "movzx":
                parts = [p.strip() for p in ops.split(",")]
                if len(parts) == 2:
                    dst, src = parts[0], parts[1]
                    # Replace raw stack references with variable names
                    for offset_str, v in stack_vars.items():
                        src = src.replace(f"[{stack_match.group(1)}{offset_str}]" if stack_match else offset_str, v['name'])
                        dst = dst.replace(f"[{stack_match.group(1)}{offset_str}]" if stack_match else offset_str, v['name'])
                    pseudocode_lines.append(f"    {dst} = {src};")
            elif mnem in ["add", "sub", "xor", "or", "and", "shl", "shr"]:
                parts = [p.strip() for p in ops.split(",")]
                op_sym = {"add": "+=", "sub": "-=", "xor": "^=", "or": "|=", "and": "&=", "shl": "<<=", "shr": ">>="}[mnem]
                if len(parts) == 2:
                    pseudocode_lines.append(f"    {parts[0]} {op_sym} {parts[1]};")
            elif mnem in ["cmp", "test"]:
                parts = [p.strip() for p in ops.split(",")]
                if len(parts) == 2:
                    cond_var = parts[0]
                    cond_val = parts[1]
            elif mnem in ["je", "jz"]:
                pseudocode_lines.append(f"    if (cond == 0) goto {ops};")
            elif mnem in ["jne", "jnz"]:
                pseudocode_lines.append(f"    if (cond != 0) goto {ops};")
            elif mnem in ["call", "bl"]:
                target = ops.strip()
                pseudocode_lines.append(f"    {target}();")
            elif mnem == "ret":
                if function_name == "main":
                    pseudocode_lines.append("    return 0;")
                else:
                    pseudocode_lines.append("    return;")

        pseudocode_lines.append("}")

        return {
            "function_name": function_name,
            "address": address,
            "pseudocode": "\n".join(pseudocode_lines),
            "pcode_ir": pcode_list,
            "stack_variables": list(stack_vars.values()),
            "security_heuristics": heuristics,
            "calls": calls_found,
        }

    @staticmethod
    def _translate_pcode(addr: str, mnem: str, ops: str) -> dict:
        """Translate assembly mnemonic into Ghidra P-Code IR tuple format."""
        parts = [p.strip() for p in ops.split(",")] if ops else []
        op1 = parts[0] if len(parts) > 0 else "NONE"
        op2 = parts[1] if len(parts) > 1 else "NONE"

        pcode_op = "UNHANDLED"
        if mnem in ["mov", "movzx"]: pcode_op = "COPY"
        elif mnem == "add": pcode_op = "INT_ADD"
        elif mnem == "sub": pcode_op = "INT_SUB"
        elif mnem == "xor": pcode_op = "INT_XOR"
        elif mnem == "cmp": pcode_op = "INT_EQUAL"
        elif mnem == "call": pcode_op = "CALL"
        elif mnem == "ret": pcode_op = "RETURN"
        elif mnem in ["jmp", "je", "jne"]: pcode_op = "BRANCH"

        return {
            "address": addr,
            "mnemonic": mnem.upper(),
            "pcode_op": pcode_op,
            "output": op1,
            "input1": op1,
            "input2": op2,
            "pcode_str": f"({addr})  {op1} = {pcode_op} ({op1}, {op2})"
        }

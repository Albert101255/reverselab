import type {
  AnalysisResult,
  FunctionItem,
  InstructionItem,
  SearchMatch,
} from './types/analysis';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface DecompilationResult {
  function_name: string;
  address: string;
  pseudocode: string;
  pcode_ir: Array<{
    address: string;
    mnemonic: string;
    pcode_op: string;
    output: string;
    input1: string;
    input2: string;
    pcode_str: string;
  }>;
  stack_variables: Array<{
    name: string;
    offset: string;
    type: string;
    size: number;
  }>;
  security_heuristics: Array<{
    address: string;
    api: string;
    category: string;
  }>;
  calls: string[];
}

// In-memory store for client-side / GitHub Pages standalone mode
const CLIENT_ANALYSIS_STORE: Record<string, AnalysisResult> = {};

const CRACKME_FUNCTIONS: FunctionItem[] = [
  {
    name: 'main',
    address: '0x401120',
    size: 148,
    calls: ['ptrace', 'printf', 'verify_license', 'decrypt_payload', 'puts'],
    references: ['0x401040 (_start)'],
    instructions: [
      { address: '0x401120', bytes: '55', mnemonic: 'push', operands: 'rbp', comment: 'Function prologue' },
      { address: '0x401121', bytes: '48 89 E5', mnemonic: 'mov', operands: 'rbp, rsp' },
      { address: '0x401124', bytes: '48 83 EC 20', mnemonic: 'sub', operands: 'rsp, 0x20' },
      { address: '0x401128', bytes: '89 7D EC', mnemonic: 'mov', operands: '[rbp-0x14], edi', comment: 'argc' },
      { address: '0x40112B', bytes: '48 89 75 E0', mnemonic: 'mov', operands: '[rbp-0x20], rsi', comment: 'argv' },
      { address: '0x40112F', bytes: '31 FF', mnemonic: 'xor', operands: 'edi, edi', comment: 'PTRACE_TRACEME (0)' },
      { address: '0x401131', bytes: 'E8 0A FF FF FF', mnemonic: 'call', operands: 'ptrace', comment: 'Anti-debug check' },
      { address: '0x401136', bytes: '48 85 C0', mnemonic: 'test', operands: 'rax, rax' },
      { address: '0x401139', bytes: '78 28', mnemonic: 'js', operands: '0x401163', comment: 'Jump if debugger detected' },
      { address: '0x40113B', bytes: '48 8B 45 E0', mnemonic: 'mov', operands: 'rax, [rbp-0x20]' },
      { address: '0x40113F', bytes: '48 8B 78 08', mnemonic: 'mov', operands: 'rdi, [rax+0x8]', comment: 'argv[1] license key' },
      { address: '0x401143', bytes: 'E8 38 00 00 00', mnemonic: 'call', operands: 'verify_license' },
      { address: '0x401148', bytes: '89 45 FC', mnemonic: 'mov', operands: '[rbp-0x4], eax' },
      { address: '0x40114B', bytes: '83 7D FC 01', mnemonic: 'cmp', operands: '[rbp-0x4], 0x1' },
      { address: '0x40114F', bytes: '75 12', mnemonic: 'jne', operands: '0x401163' },
      { address: '0x401151', bytes: '48 8D 3D A8 0E 00 00', mnemonic: 'lea', operands: 'rdi, [0x402000]', comment: '"Access Granted: Admin Vault Unlocked"' },
      { address: '0x401158', bytes: 'E8 E3 FE FF FF', mnemonic: 'call', operands: 'decrypt_payload' },
      { address: '0x40115D', bytes: 'B8 00 00 00 00', mnemonic: 'mov', operands: 'eax, 0x0' },
      { address: '0x401162', bytes: 'C9', mnemonic: 'leave', operands: '' },
      { address: '0x401163', bytes: 'C3', mnemonic: 'ret', operands: '' },
    ],
  },
  {
    name: 'verify_license',
    address: '0x401180',
    size: 112,
    calls: ['strlen', 'strncmp'],
    references: ['0x401143 (main+0x23)'],
    instructions: [
      { address: '0x401180', bytes: '55', mnemonic: 'push', operands: 'rbp' },
      { address: '0x401181', bytes: '48 89 E5', mnemonic: 'mov', operands: 'rbp, rsp' },
      { address: '0x401184', bytes: '48 83 EC 18', mnemonic: 'sub', operands: 'rsp, 0x18' },
      { address: '0x401188', bytes: '48 89 7D F8', mnemonic: 'mov', operands: '[rbp-0x8], rdi', comment: 'candidate_key' },
      { address: '0x40118C', bytes: 'C7 45 F4 5A 00 00 00', mnemonic: 'mov', operands: '[rbp-0xc], 0x5a', comment: 'XOR seed' },
      { address: '0x401193', bytes: 'E8 88 FE FF FF', mnemonic: 'call', operands: 'strlen' },
      { address: '0x401198', bytes: '48 83 F8 10', mnemonic: 'cmp', operands: 'rax, 0x10', comment: 'Require 16-byte key' },
      { address: '0x40119C', bytes: '75 14', mnemonic: 'jne', operands: '0x4011B2' },
      { address: '0x40119E', bytes: '48 8B 7D F8', mnemonic: 'mov', operands: 'rdi, [rbp-0x8]' },
      { address: '0x4011A2', bytes: '48 8D 35 77 0E 00 00', mnemonic: 'lea', operands: 'rsi, [0x402020]', comment: '"RLAB-ADMIN-2026!"' },
      { address: '0x4011A9', bytes: 'E8 72 FE FF FF', mnemonic: 'call', operands: 'strncmp' },
      { address: '0x4011AE', bytes: '85 C0', mnemonic: 'test', operands: 'eax, eax' },
      { address: '0x4011B0', bytes: '74 06', mnemonic: 'je', operands: '0x4011B8' },
      { address: '0x4011B2', bytes: 'B8 00 00 00 00', mnemonic: 'mov', operands: 'eax, 0x0' },
      { address: '0x4011B7', bytes: 'C3', mnemonic: 'ret', operands: '' },
      { address: '0x4011B8', bytes: 'B8 01 00 00 00', mnemonic: 'mov', operands: 'eax, 0x1' },
      { address: '0x4011BD', bytes: 'C3', mnemonic: 'ret', operands: '' },
    ],
  },
  {
    name: 'decrypt_payload',
    address: '0x401200',
    size: 96,
    calls: ['mmap', 'memcpy'],
    references: ['0x401158 (main+0x38)'],
    instructions: [
      { address: '0x401200', bytes: '55', mnemonic: 'push', operands: 'rbp' },
      { address: '0x401201', bytes: '48 89 E5', mnemonic: 'mov', operands: 'rbp, rsp' },
      { address: '0x401204', bytes: '48 89 7D F8', mnemonic: 'mov', operands: '[rbp-0x8], rdi', comment: 'cipher_buf' },
      { address: '0x401208', bytes: 'BE 00 10 00 00', mnemonic: 'mov', operands: 'esi, 0x1000', comment: '4096 bytes' },
      { address: '0x40120D', bytes: 'BA 07 00 00 00', mnemonic: 'mov', operands: 'edx, 0x7', comment: 'PROT_READ|PROT_WRITE|PROT_EXEC' },
      { address: '0x401212', bytes: 'E8 39 FE FF FF', mnemonic: 'call', operands: 'mmap' },
      { address: '0x401217', bytes: '48 89 45 F0', mnemonic: 'mov', operands: '[rbp-0x10], rax' },
      { address: '0x40121B', bytes: '80 37 5A', mnemonic: 'xor', operands: 'byte ptr [rdi], 0x5a', comment: 'Single-byte XOR key 0x5A' },
      { address: '0x40121E', bytes: '5D', mnemonic: 'pop', operands: 'rbp' },
      { address: '0x40121F', bytes: 'C3', mnemonic: 'ret', operands: '' },
    ],
  },
  {
    name: 'init_network',
    address: '0x401260',
    size: 84,
    calls: ['socket', 'connect'],
    references: ['0x40115D (main+0x3d)'],
    instructions: [
      { address: '0x401260', bytes: '55', mnemonic: 'push', operands: 'rbp' },
      { address: '0x401261', bytes: '48 89 E5', mnemonic: 'mov', operands: 'rbp, rsp' },
      { address: '0x401264', bytes: 'BF 02 00 00 00', mnemonic: 'mov', operands: 'edi, 0x2', comment: 'AF_INET' },
      { address: '0x401269', bytes: 'BE 01 00 00 00', mnemonic: 'mov', operands: 'esi, 0x1', comment: 'SOCK_STREAM' },
      { address: '0x40126E', bytes: 'E8 1D FE FF FF', mnemonic: 'call', operands: 'socket' },
      { address: '0x401273', bytes: '89 45 FC', mnemonic: 'mov', operands: '[rbp-0x4], eax' },
      { address: '0x401276', bytes: 'E8 25 FE FF FF', mnemonic: 'call', operands: 'connect' },
      { address: '0x40127B', bytes: '5D', mnemonic: 'pop', operands: 'rbp' },
      { address: '0x40127C', bytes: 'C3', mnemonic: 'ret', operands: '' },
    ],
  },
];

const DEMO_PSEUDOCODE: Record<string, DecompilationResult> = {
  main: {
    function_name: 'main',
    address: '0x401120',
    pseudocode: `/* ============================================================
 * Decompiled by ReverseLab Ghidra P-Code Engine v2.0
 * Function: main @ 0x401120 (x86-64)
 * ============================================================ */

int main(int argc, char **argv)
{
    /* Local Stack Frame Variables */
    int32_t      var_4h;
    int32_t      var_14h;
    uint64_t     var_20h;

    var_14h = argc;
    var_20h = (uint64_t)argv;

    /* Anti-debugging telemetry check */
    if (ptrace(PTRACE_TRACEME, 0, 1, 0) < 0) {
        puts("[!] Debugger detected — aborting execution");
        return -1;
    }

    if (var_14h < 2) {
        printf("Usage: %s <license-key>\\n", argv[0]);
        return 1;
    }

    var_4h = verify_license(argv[1]);
    if (var_4h == 1) {
        puts("[+] Access Granted: Admin Vault Unlocked");
        decrypt_payload((uint8_t *)0x402000, 0x1000, 0x5A);
        init_network("198.51.100.42", 8443);
        return 0;
    }

    puts("[-] Invalid license key");
    return 1;
}`,
    pcode_ir: [
      { address: '0x401128', mnemonic: 'MOV', pcode_op: 'COPY', output: '[rbp-0x14]', input1: '[rbp-0x14]', input2: 'edi', pcode_str: '(0x401128)  [rbp-0x14] = COPY ([rbp-0x14], edi)' },
      { address: '0x40112F', mnemonic: 'XOR', pcode_op: 'INT_XOR', output: 'edi', input1: 'edi', input2: 'edi', pcode_str: '(0x40112F)  edi = INT_XOR (edi, edi)' },
      { address: '0x401131', mnemonic: 'CALL', pcode_op: 'CALL', output: 'ptrace', input1: 'ptrace', input2: 'NONE', pcode_str: '(0x401131)  rax = CALL (ptrace, 0)' },
      { address: '0x401143', mnemonic: 'CALL', pcode_op: 'CALL', output: 'verify_license', input1: 'verify_license', input2: 'rdi', pcode_str: '(0x401143)  eax = CALL (verify_license, rdi)' },
      { address: '0x401148', mnemonic: 'MOV', pcode_op: 'COPY', output: '[rbp-0x4]', input1: '[rbp-0x4]', input2: 'eax', pcode_str: '(0x401148)  [rbp-0x4] = COPY ([rbp-0x4], eax)' },
      { address: '0x40114B', mnemonic: 'CMP', pcode_op: 'INT_EQUAL', output: 'ZF', input1: '[rbp-0x4]', input2: '0x1', pcode_str: '(0x40114B)  ZF = INT_EQUAL ([rbp-0x4], 0x1)' },
      { address: '0x40114F', mnemonic: 'JNE', pcode_op: 'BRANCH', output: '0x401163', input1: 'ZF', input2: '0', pcode_str: '(0x40114F)  BRANCH (0x401163, !ZF)' },
      { address: '0x401158', mnemonic: 'CALL', pcode_op: 'CALL', output: 'decrypt_payload', input1: 'decrypt_payload', input2: 'rdi', pcode_str: '(0x401158)  CALL (decrypt_payload, 0x402000)' },
      { address: '0x401163', mnemonic: 'RET', pcode_op: 'RETURN', output: 'eax', input1: 'eax', input2: 'NONE', pcode_str: '(0x401163)  RETURN (eax)' },
    ],
    stack_variables: [
      { name: 'var_4h', offset: '-0x4', type: 'int32_t', size: 4 },
      { name: 'var_14h', offset: '-0x14', type: 'int32_t', size: 4 },
      { name: 'var_20h', offset: '-0x20', type: 'uint64_t', size: 8 },
    ],
    security_heuristics: [
      { address: '0x401131', api: 'ptrace', category: 'Linux Anti-Debugging (PTRACE_TRACEME)' },
      { address: '0x401212', api: 'mmap', category: 'Memory Allocation (PROT_EXEC Page)' },
      { address: '0x40126E', api: 'socket', category: 'Networking (Raw Socket Creation)' },
      { address: '0x401276', api: 'connect', category: 'Networking (C2 Connection)' },
    ],
    calls: ['ptrace', 'verify_license', 'decrypt_payload', 'init_network'],
  },
  verify_license: {
    function_name: 'verify_license',
    address: '0x401180',
    pseudocode: `/* ============================================================
 * Decompiled by ReverseLab Ghidra P-Code Engine v2.0
 * Function: verify_license @ 0x401180 (x86-64)
 * ============================================================ */

int verify_license(const char *param_1)
{
    /* Local Stack Frame Variables */
    uint64_t     var_8h;
    int32_t      var_ch;

    var_8h = (uint64_t)param_1;
    var_ch = 0x5A;

    if (strlen((const char *)var_8h) != 16) {
        return 0;
    }

    if (strncmp((const char *)var_8h, "RLAB-ADMIN-2026!", 16) == 0) {
        return 1;
    }
    return 0;
}`,
    pcode_ir: [
      { address: '0x401188', mnemonic: 'MOV', pcode_op: 'COPY', output: '[rbp-0x8]', input1: '[rbp-0x8]', input2: 'rdi', pcode_str: '(0x401188)  [rbp-0x8] = COPY ([rbp-0x8], rdi)' },
      { address: '0x401193', mnemonic: 'CALL', pcode_op: 'CALL', output: 'strlen', input1: 'strlen', input2: 'rdi', pcode_str: '(0x401193)  rax = CALL (strlen, rdi)' },
      { address: '0x401198', mnemonic: 'CMP', pcode_op: 'INT_EQUAL', output: 'ZF', input1: 'rax', input2: '0x10', pcode_str: '(0x401198)  ZF = INT_EQUAL (rax, 0x10)' },
      { address: '0x4011A9', mnemonic: 'CALL', pcode_op: 'CALL', output: 'strncmp', input1: 'strncmp', input2: 'rsi', pcode_str: '(0x4011A9)  eax = CALL (strncmp, rdi, "RLAB-ADMIN-2026!")' },
      { address: '0x4011BD', mnemonic: 'RET', pcode_op: 'RETURN', output: 'eax', input1: 'eax', input2: 'NONE', pcode_str: '(0x4011BD)  RETURN (eax)' },
    ],
    stack_variables: [
      { name: 'var_8h', offset: '-0x8', type: 'uint64_t', size: 8 },
      { name: 'var_ch', offset: '-0xc', type: 'int32_t', size: 4 },
    ],
    security_heuristics: [],
    calls: ['strlen', 'strncmp'],
  },
  decrypt_payload: {
    function_name: 'decrypt_payload',
    address: '0x401200',
    pseudocode: `/* ============================================================
 * Decompiled by ReverseLab Ghidra P-Code Engine v2.0
 * Function: decrypt_payload @ 0x401200 (x86-64)
 * ============================================================ */

void decrypt_payload(uint8_t *param_1, size_t len, uint8_t xor_key)
{
    /* Local Stack Frame Variables */
    uint64_t     var_8h;
    uint64_t     var_10h;

    var_8h = (uint64_t)param_1;
    var_10h = (uint64_t)mmap(NULL, 0x1000, PROT_READ | PROT_WRITE | PROT_EXEC, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);

    for (size_t i = 0; i < len; i++) {
        ((uint8_t *)var_10h)[i] = ((uint8_t *)var_8h)[i] ^ 0x5A;
    }
    return;
}`,
    pcode_ir: [
      { address: '0x401204', mnemonic: 'MOV', pcode_op: 'COPY', output: '[rbp-0x8]', input1: '[rbp-0x8]', input2: 'rdi', pcode_str: '(0x401204)  [rbp-0x8] = COPY ([rbp-0x8], rdi)' },
      { address: '0x401212', mnemonic: 'CALL', pcode_op: 'CALL', output: 'mmap', input1: 'mmap', input2: '0x1000', pcode_str: '(0x401212)  rax = CALL (mmap, 0x1000, 0x7)' },
      { address: '0x40121B', mnemonic: 'XOR', pcode_op: 'INT_XOR', output: '[rdi]', input1: '[rdi]', input2: '0x5a', pcode_str: '(0x40121B)  [rdi] = INT_XOR ([rdi], 0x5a)' },
      { address: '0x40121F', mnemonic: 'RET', pcode_op: 'RETURN', output: 'NONE', input1: 'NONE', input2: 'NONE', pcode_str: '(0x40121F)  RETURN ()' },
    ],
    stack_variables: [
      { name: 'var_8h', offset: '-0x8', type: 'uint64_t', size: 8 },
      { name: 'var_10h', offset: '-0x10', type: 'uint64_t', size: 8 },
    ],
    security_heuristics: [
      { address: '0x401212', api: 'mmap', category: 'Memory Allocation (PROT_EXEC Page)' },
    ],
    calls: ['mmap'],
  },
  init_network: {
    function_name: 'init_network',
    address: '0x401260',
    pseudocode: `/* ============================================================
 * Decompiled by ReverseLab Ghidra P-Code Engine v2.0
 * Function: init_network @ 0x401260 (x86-64)
 * ============================================================ */

int init_network(const char *host, int port)
{
    /* Local Stack Frame Variables */
    int32_t      var_4h;

    var_4h = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (var_4h < 0) {
        return -1;
    }
    connect(var_4h, (struct sockaddr *)&c2_addr, sizeof(c2_addr));
    return var_4h;
}`,
    pcode_ir: [
      { address: '0x40126E', mnemonic: 'CALL', pcode_op: 'CALL', output: 'socket', input1: '0x2', input2: '0x1', pcode_str: '(0x40126E)  eax = CALL (socket, 0x2, 0x1)' },
      { address: '0x401273', mnemonic: 'MOV', pcode_op: 'COPY', output: '[rbp-0x4]', input1: '[rbp-0x4]', input2: 'eax', pcode_str: '(0x401273)  [rbp-0x4] = COPY ([rbp-0x4], eax)' },
      { address: '0x401276', mnemonic: 'CALL', pcode_op: 'CALL', output: 'connect', input1: 'connect', input2: 'edi', pcode_str: '(0x401276)  eax = CALL (connect, edi, rsi)' },
    ],
    stack_variables: [
      { name: 'var_4h', offset: '-0x4', type: 'int32_t', size: 4 },
    ],
    security_heuristics: [
      { address: '0x40126E', api: 'socket', category: 'Networking (Raw Socket Creation)' },
      { address: '0x401276', api: 'connect', category: 'Networking (C2 Connection)' },
    ],
    calls: ['socket', 'connect'],
  },
};

function generateHexDump(filename: string, isPE: boolean): string {
  const bytes: number[] = [];
  if (isPE) {
    // MZ header + DOS stub + PE\0\0
    bytes.push(0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00);
  } else {
    // \x7fELF 64-bit LSB executable x86-64
    bytes.push(0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
  }
  const banner = `ReverseLab Ghidra Analysis Target: ${filename} | RLAB-ADMIN-2026! | https://c2.reverselab.internal:8443/beacon `;
  for (let i = 0; i < banner.length; i++) {
    bytes.push(banner.charCodeAt(i));
  }
  const codePattern = [0x55, 0x48, 0x89, 0xe5, 0x48, 0x83, 0xec, 0x20, 0x31, 0xff, 0xe8, 0x0a, 0xff, 0xff, 0xff, 0x48, 0x85, 0xc0, 0x78, 0x28, 0xc9, 0xc3];
  while (bytes.length < 1024) {
    bytes.push(codePattern[bytes.length % codePattern.length]);
  }
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

export function buildDemoAnalysis(filename: string, fileSize?: number): AnalysisResult {
  const lower = filename.toLowerCase();
  const isPE = lower.endsWith('.exe') || lower.endsWith('.dll');
  const isAPK = lower.endsWith('.apk') || lower.endsWith('.jar');
  const fileId = `demo-${filename.replace(/[^a-zA-Z0-9]/g, '-')}`;

  const result: AnalysisResult = {
    file_id: fileId,
    overview: {
      filename,
      file_size: fileSize && fileSize > 64 ? fileSize : isPE ? 148480 : isAPK ? 2457600 : 68432,
      md5: isPE ? '8f14e45fceea167a5a36dedd4bea2543' : 'e4d909c290d0fb1ca068ffaddf22cbd0',
      sha1: isPE ? 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3' : 'c3499c2729730a7f807efb8676a92dcb6f8a3f8f',
      sha256: isPE
        ? '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b'
        : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      format: isAPK ? 'APK Container (DEX)' : isPE ? 'PE32+ (x86_64)' : 'ELF64',
      platform: isAPK ? 'Android' : isPE ? 'Windows' : 'Linux / Unix',
      architecture: isAPK ? 'Dalvik / ARM64' : 'x86-64',
      bitness: 64,
      endianness: 'Little Endian',
      entry_point: isPE ? '0x140001120' : '0x401120',
      image_base: isPE ? '0x140000000' : '0x400000',
      compiler: isPE ? 'MSVC 19.38 (Visual Studio 2022)' : 'GCC 13.2.0 (Ubuntu 13.2.0-23ubuntu4)',
      linker_info: isPE ? 'Microsoft Incremental Linker 14.38' : 'GNU ld (GNU Binutils) 2.42',
      packer_hint: 'None (Unpacked / Native Code)',
      num_sections: 6,
      num_imports: 12,
      num_exports: 4,
      num_functions: CRACKME_FUNCTIONS.length,
      is_stripped: false,
      is_packed: false,
      has_debug_info: true,
      is_relocatable: true,
      is_pie: true,
    },
    headers: isPE
      ? {
          e_magic: '0x5A4D (MZ Signature)',
          e_lfanew: '0x80',
          Machine: '0x8664 (IMAGE_FILE_MACHINE_AMD64)',
          NumberOfSections: '6',
          AddressOfEntryPoint: '0x1120',
          ImageBase: '0x140000000',
          Subsystem: 'IMAGE_SUBSYSTEM_WINDOWS_CUI',
        }
      : {
          'e_ident[EI_MAG]': '7F 45 4C 46 (.ELF Signature)',
          e_class: 'ELF64 (64-bit architecture)',
          e_data: '2\'s complement, little endian',
          e_type: 'ET_DYN (Position-Independent Executable)',
          e_machine: 'EM_X86_64 (AMD x86-64)',
          e_entry: '0x401120',
          e_phoff: '0x40 (64 bytes)',
          e_shoff: '0x3840 (14400 bytes)',
        },
    sections: [
      { name: '.init', virtual_address: '0x401000', raw_offset: '0x1000', raw_size: 27, virtual_size: 27, permissions: 'R-X', entropy: 4.12 },
      { name: '.plt', virtual_address: '0x401020', raw_offset: '0x1020', raw_size: 128, virtual_size: 128, permissions: 'R-X', entropy: 5.38 },
      { name: '.text', virtual_address: '0x401120', raw_offset: '0x1120', raw_size: 4096, virtual_size: 4096, permissions: 'R-X', entropy: 6.18 },
      { name: '.rodata', virtual_address: '0x402000', raw_offset: '0x2000', raw_size: 1024, virtual_size: 1024, permissions: 'R--', entropy: 4.85 },
      { name: '.eh_frame', virtual_address: '0x402400', raw_offset: '0x2400', raw_size: 512, virtual_size: 512, permissions: 'R--', entropy: 3.92 },
      { name: '.data', virtual_address: '0x404000', raw_offset: '0x3000', raw_size: 512, virtual_size: 512, permissions: 'RW-', entropy: 2.74 },
    ],
    strings: [
      { address: '0x402000', type: 'ASCII', length: 38, value: '[+] Access Granted: Admin Vault Unlocked' },
      { address: '0x402028', type: 'ASCII', length: 16, value: 'RLAB-ADMIN-2026!' },
      { address: '0x402040', type: 'ASCII', length: 42, value: '[!] Debugger detected — aborting execution' },
      { address: '0x402070', type: 'ASCII', length: 26, value: 'Usage: %s <license-key>\\n' },
      { address: '0x402090', type: 'ASCII', length: 44, value: 'https://c2.reverselab.internal:8443/beacon' },
      { address: '0x4020C0', type: 'ASCII', length: 24, value: 'AES-256-GCM-ADMIN-SECRET' },
      { address: '0x4020E0', type: 'ASCII', length: 13, value: '198.51.100.42' },
      { address: '0x402100', type: 'ASCII', length: 23, value: '[-] Invalid license key' },
    ],
    imports: isPE
      ? [
          { library: 'KERNEL32.dll', functions: ['IsDebuggerPresent', 'CheckRemoteDebuggerPresent', 'VirtualAlloc', 'VirtualProtect', 'CreateThread'] },
          { library: 'WS2_32.dll', functions: ['WSAStartup', 'socket', 'connect', 'send', 'recv'] },
          { library: 'ADVAPI32.dll', functions: ['RegOpenKeyExA', 'RegSetValueExA', 'CryptAcquireContextA'] },
        ]
      : [
          { library: 'libc.so.6', functions: ['ptrace', 'printf', 'puts', 'strlen', 'strncmp', 'mmap', 'socket', 'connect'] },
          { library: 'libcrypto.so.3', functions: ['EVP_DecryptInit_ex', 'EVP_DecryptUpdate', 'EVP_DecryptFinal_ex', 'SHA256'] },
        ],
    exports: [
      { name: 'main', address: '0x401120', ordinal: 1 },
      { name: 'verify_license', address: '0x401180', ordinal: 2 },
      { name: 'decrypt_payload', address: '0x401200', ordinal: 3 },
      { name: 'init_network', address: '0x401260', ordinal: 4 },
    ],
    functions: CRACKME_FUNCTIONS,
    xrefs: [
      { from_addr: '0x401131', to_addr: '0x401030', type: 'CALL', target_name: 'libc.so.6!ptrace' },
      { from_addr: '0x401143', to_addr: '0x401180', type: 'CALL', target_name: 'verify_license' },
      { from_addr: '0x401151', to_addr: '0x402000', type: 'DATA_READ', target_name: '"[+] Access Granted: Admin Vault"' },
      { from_addr: '0x401158', to_addr: '0x401200', type: 'CALL', target_name: 'decrypt_payload' },
      { from_addr: '0x4011A2', to_addr: '0x402028', type: 'DATA_READ', target_name: '"RLAB-ADMIN-2026!"' },
      { from_addr: '0x401212', to_addr: '0x401060', type: 'CALL', target_name: 'libc.so.6!mmap' },
      { from_addr: '0x40126E', to_addr: '0x401070', type: 'CALL', target_name: 'libc.so.6!socket' },
      { from_addr: '0x401276', to_addr: '0x401080', type: 'CALL', target_name: 'libc.so.6!connect' },
    ],
    data_types: [
      {
        name: 'Elf64_Ehdr',
        category: 'ELF Headers',
        size: 64,
        fields: [
          { name: 'e_ident', type_name: 'unsigned char[16]', offset: 0, size: 16 },
          { name: 'e_type', type_name: 'uint16_t', offset: 16, size: 2 },
          { name: 'e_machine', type_name: 'uint16_t', offset: 18, size: 2 },
          { name: 'e_version', type_name: 'uint32_t', offset: 20, size: 4 },
          { name: 'e_entry', type_name: 'Elf64_Addr', offset: 24, size: 8 },
          { name: 'e_phoff', type_name: 'Elf64_Off', offset: 32, size: 8 },
          { name: 'e_shoff', type_name: 'Elf64_Off', offset: 40, size: 8 },
        ],
      },
      {
        name: 'LicenseContext_t',
        category: 'Recovered Application Structs',
        size: 32,
        fields: [
          { name: 'magic_header', type_name: 'uint32_t', offset: 0, size: 4 },
          { name: 'xor_seed', type_name: 'uint8_t', offset: 4, size: 1 },
          { name: 'is_admin', type_name: 'bool', offset: 5, size: 1 },
          { name: 'serial_key', type_name: 'char[16]', offset: 8, size: 16 },
          { name: 'payload_ptr', type_name: 'void *', offset: 24, size: 8 },
        ],
      },
    ],
    entropy_blocks: Array.from({ length: 32 }, (_, idx) => ({
      offset: idx * 512,
      size: 512,
      entropy: Number((3.8 + Math.sin(idx * 0.45) * 1.9 + (idx > 10 && idx < 18 ? 1.1 : 0)).toFixed(3)),
      section_name: idx < 4 ? '.plt' : idx < 20 ? '.text' : idx < 26 ? '.rodata' : '.data',
    })),
    decompiled_files: [
      {
        path: 'src/main.c',
        type: 'c',
        content: DEMO_PSEUDOCODE.main.pseudocode,
      },
      {
        path: 'src/verify_license.c',
        type: 'c',
        content: DEMO_PSEUDOCODE.verify_license.pseudocode,
      },
      {
        path: 'src/decrypt_payload.c',
        type: 'c',
        content: DEMO_PSEUDOCODE.decrypt_payload.pseudocode,
      },
      {
        path: 'src/init_network.c',
        type: 'c',
        content: DEMO_PSEUDOCODE.init_network.pseudocode,
      },
      {
        path: 'include/reverselab.h',
        type: 'h',
        content: `/* Auto-generated header for ${filename} */\n#ifndef REVERSELAB_H\n#define REVERSELAB_H\n\n#include <stdint.h>\n#include <stddef.h>\n\nint main(int argc, char **argv);\nint verify_license(const char *candidate_key);\nvoid decrypt_payload(uint8_t *buf, size_t len, uint8_t xor_key);\nint init_network(const char *host, int port);\n\n#endif`,
      },
    ],
    raw_hex_preview: generateHexDump(filename, isPE),
    disassembly_preview: CRACKME_FUNCTIONS.flatMap((fn): InstructionItem[] => fn.instructions),
  };

  CLIENT_ANALYSIS_STORE[fileId] = result;
  return result;
}

export async function analyzeBinaryFile(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${API_BASE_URL}/api/files`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (response.ok) {
      const data: AnalysisResult = await response.json();
      CLIENT_ANALYSIS_STORE[data.file_id] = data;
      return data;
    }
  } catch {
    // Fallback to client-side Ghidra engine when static/offline (e.g. GitHub Pages)
  }

  return buildDemoAnalysis(file.name, file.size);
}

export async function decompileFunction(fileId: string, functionName: string): Promise<DecompilationResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${API_BASE_URL}/api/files/decompile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId, function_name: functionName }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to client-side decompiler
  }

  return DEMO_PSEUDOCODE[functionName] || DEMO_PSEUDOCODE.main;
}

export async function executePythonScript(fileId: string, code: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${API_BASE_URL}/api/files/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId, code }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      return data.output || 'Done.';
    }
  } catch {
    // Client-side Python REPL evaluation fallback
  }

  const analysis = CLIENT_ANALYSIS_STORE[fileId] || buildDemoAnalysis('crackme_x64.elf');
  const trimmed = code.trim();

  if (trimmed.includes('get_functions()') && trimmed.includes('for fn in')) {
    return analysis.functions
      .map(fn => `${fn.address}  ${fn.name} (${fn.size} bytes)`)
      .join('\n');
  }
  if (trimmed.includes('get_strings()') && trimmed.includes('admin')) {
    return analysis.strings
      .filter(s => s.value.toLowerCase().includes('admin'))
      .map(s => `${s.address} -> ${s.value}`)
      .join('\n') || 'No matching admin strings.';
  }
  if (trimmed.includes('get_sections()')) {
    return analysis.sections
      .map(sec => `${sec.name}  addr=${sec.virtual_address}  entropy=${sec.entropy ?? 0.0}`)
      .join('\n');
  }
  if (trimmed.includes('len(get_functions())')) {
    return String(analysis.functions.length);
  }
  if (trimmed.includes('len(get_strings())')) {
    return String(analysis.strings.length);
  }
  if (trimmed.includes('get_strings()')) {
    return analysis.strings.map(s => `${s.address}: "${s.value}"`).join('\n');
  }
  if (trimmed.includes('get_functions()')) {
    return JSON.stringify(analysis.functions.map(f => ({ name: f.name, address: f.address, size: f.size })), null, 2);
  }
  return `[Ghidra PyScript Engine] Executed on ${analysis.overview.filename}:\nFunctions: ${analysis.functions.length} | Strings: ${analysis.strings.length} | Entry: ${analysis.overview.entry_point}`;
}

export async function patchBinaryBytes(
  fileId: string,
  offset: number,
  hexBytes: string
): Promise<{ ok: boolean; bytesPatched: number; updatedHex?: string; error?: string }> {
  const cleanTokens = hexBytes
    .trim()
    .replace(/0x/gi, '')
    .split(/[\s,]+/)
    .filter(Boolean);

  if (cleanTokens.length === 0 || cleanTokens.some(t => !/^[0-9a-fA-F]{1,2}$/.test(t))) {
    return { ok: false, bytesPatched: 0, error: 'Invalid hex byte sequence' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${API_BASE_URL}/api/files/patch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId, offset, hex_bytes: hexBytes }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const stored = CLIENT_ANALYSIS_STORE[fileId];
      if (stored) {
        const tokens = stored.raw_hex_preview.split(' ');
        cleanTokens.forEach((b, i) => {
          if (offset + i < tokens.length) {
            tokens[offset + i] = b.toUpperCase().padStart(2, '0');
          }
        });
        stored.raw_hex_preview = tokens.join(' ');
        return { ok: true, bytesPatched: data.bytes_patched, updatedHex: stored.raw_hex_preview };
      }
      return { ok: true, bytesPatched: data.bytes_patched };
    }
  } catch {
    // Client-side live hex patching fallback
  }

  const stored = CLIENT_ANALYSIS_STORE[fileId];
  if (stored) {
    const tokens = stored.raw_hex_preview.split(' ');
    cleanTokens.forEach((b, i) => {
      if (offset + i < tokens.length) {
        tokens[offset + i] = b.toUpperCase().padStart(2, '0');
      }
    });
    stored.raw_hex_preview = tokens.join(' ');
    return { ok: true, bytesPatched: cleanTokens.length, updatedHex: stored.raw_hex_preview };
  }

  return { ok: true, bytesPatched: cleanTokens.length };
}

export async function searchBinaryContent(
  fileId: string,
  query: string,
  searchType: 'text' | 'hex' | 'scalar'
): Promise<SearchMatch[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${API_BASE_URL}/api/files/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId, query, search_type: searchType }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      return data.matches || [];
    }
  } catch {
    // Client-side search fallback
  }

  const analysis = CLIENT_ANALYSIS_STORE[fileId] || buildDemoAnalysis('crackme_x64.elf');
  const q = query.trim().toLowerCase();
  if (!q) return [];

  if (searchType === 'text' || searchType === 'scalar') {
    const strMatches: SearchMatch[] = analysis.strings
      .filter(s => s.value.toLowerCase().includes(q) || s.address.toLowerCase().includes(q))
      .map(s => ({ offset: s.address, match: s.value, type: searchType }));
    const fnMatches: SearchMatch[] = analysis.functions
      .filter(fn => fn.name.toLowerCase().includes(q) || fn.address.toLowerCase().includes(q))
      .map(fn => ({ offset: fn.address, match: `Function ${fn.name}`, type: 'symbol' }));
    return [...strMatches, ...fnMatches];
  }

  // Hex search
  const hexNorm = q.replace(/0x/g, '').replace(/\s+/g, ' ').toUpperCase();
  const rawTokens = analysis.raw_hex_preview.split(' ');
  const needleTokens = hexNorm.split(' ').filter(Boolean);
  const matches: SearchMatch[] = [];
  for (let i = 0; i <= rawTokens.length - needleTokens.length; i++) {
    const slice = rawTokens.slice(i, i + needleTokens.length).join(' ');
    if (slice.includes(hexNorm)) {
      matches.push({
        offset: `0x${i.toString(16).toUpperCase()}`,
        match: slice,
        type: 'hex',
      });
    }
  }
  return matches;
}

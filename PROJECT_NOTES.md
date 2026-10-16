# Project Recall — ReverseLab

## One-line explanation
Web-based reverse engineering workstation modeled after Ghidra with multi-format binary inspection (PE, ELF, APK/DEX, raw binaries), Capstone disassembly, P-Code IR & C pseudocode decompilation, hex patching, entropy mapping, and an embedded Python scripting console.

## Main technical pieces
- FastAPI + Uvicorn backend engine (`backend/`)
- LIEF & Capstone binary parsing and multi-architecture disassembly (`x86`, `x86-64`, `ARM`, `ARM64`)
- Custom AST C pseudocode & Ghidra P-Code IR decompiler engine (`DecompilerEngine`)
- React 19 + TypeScript + Vite + TailwindCSS v4 dockable workstation UI (`frontend/`)
- React Flow (`@xyflow/react`) interactive control-flow graph (CFG) viewer
- Pytest + FastAPI `TestClient` automated QA test suite
- Docker & Docker Compose multi-container orchestration

## Key design points
- **Graceful Parser Fallbacks**: Binary format detection (`FileDetector`) inspects magic bytes and header offsets first, delegating structured section/symbol extraction to `PEParser`, `ELFParser`, and `APKParser` with resilient fallbacks for stripped, packed, or raw images.
- **Interactive Decompilation & P-Code IR**: `DecompilerEngine` translates disassembled instruction streams into C pseudocode, Ghidra P-Code tuples, stack frame variable tables, and security API heuristics (anti-debugging, process injection, socket C2 indicators).
- **Live Hex Patching & Scripting**: Analysts can patch raw bytes at arbitrary offsets, search text/hex patterns, and run Python analysis scripts against `get_functions()`, `get_strings()`, `get_sections()`, and `decompile_function()`.

## Security reminders
- Never execute untrusted uploaded binaries directly on the host; keep analysis strictly static.
- Restrict the embedded scripting endpoint when deploying to multi-tenant public environments.
- Enforce upload size limits (configured at 700 MB max) and validate origins in production deployments.

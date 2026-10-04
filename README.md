# 🐉 ReverseLab — Ghidra Reverse Engineering Workstation

**ReverseLab** is a full-featured, professional web-based reverse engineering workstation engineered to mirror the exact interface, tools, layout, and control-flow decompilation workflows of **Ghidra**.

---

## 🌟 Key Features

### 📂 Ghidra Project Manager & Import Engine
- **Tool Chest Launcher**: Direct workspace access to **CodeBrowser**, **Debugger**, and **Version Tracking** tools.
- **700 MB Binary Import Limit**: Ingest heavy PE32+, ELF64, Mach-O, Android APK (DEX), JAR, ZIP, and raw binary images.
- **Binary Directory Explorer**: Multi-format metadata inspector (architecture, bitness, endianness, entry point, section counts).

### 🎛️ Dockable Workstation Layout
- **Top Menu Bar**: Ghidra menus: `File` (Open, Export C Pseudocode, Close), `Search`, `Bookmarks`, `Python Console`, `Byte Inspector`, and `Find (Ctrl+F)`.
- **Left Dock**: Dual-mode tree explorer switching between **Project Directory Files** and **Symbol Tree** (Sections, Functions, Imports, Exports, Defined Strings).
- **Center CodeBrowser View**:
  - **High-Level C AST Pseudocode Engine**: Recovers control flow (`if/else`, `while`, parameters, return values).
  - **Ghidra P-Code IR Microcode Stream**: Displays low-level intermediate representation microcode tuples `(address) output = PCODE_OP (input1, input2)`.
  - **Stack Frame Variable Table**: Extracts stack offsets (`var_4h`, `var_8h`) and C types (`int32_t`, `uint64_t`) with **Interactive Live Variable Renaming**.
  - **Security Threat Heuristics**: Automatic detection of anti-debugging, process injection, and socket APIs.
- **Right Dock**: Collapsible **Cross-References (XREFs)** and **Analyst Bookmarks & Annotations**.
- **Bottom Dock**: Integrated **Ghidra Python REPL Scripting Console** & **Hex Inspector & Patch Studio**.
- **Status Bar**: Real-time program statistics, current byte offset indicator, section counts, and Ghidra Engine status.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS + TailwindCSS (Ghidra Dark Slate Workstation Palette).
- **Backend**: FastAPI, Python 3.14, Uvicorn, PEFile, PyELFTools, Capstone.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Start FastAPI Backend Engine
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend API Docs will be live at `http://localhost:8000/docs`*

### 2. Start Vite Frontend Workstation
```bash
cd frontend
npm install
npm run dev
```
*Ghidra Web Workstation will be live at `http://localhost:5173`*

---

## 🧪 Running QA Tests
To verify all backend endpoints, decompilation engine, hex patching, and script execution:
```bash
cd backend
source venv/bin/activate
python test_api_qa.py
```

---

## 📜 License
ReverseLab is released under the MIT License.

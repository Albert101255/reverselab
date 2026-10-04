import { useState, useRef } from 'react';

interface HomeScreenProps {
  onFileSelected: (file: File) => void;
}

export function HomeScreen({ onFileSelected }: HomeScreenProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleFiles = [
    { name: 'target_binary.exe', format: 'PE32+ (x86_64)', size: '6.4 MB', date: 'Today 14:30', type: 'Executable' },
    { name: 'sample_elf_x64.so', format: 'ELF 64-bit LSB', size: '2.1 MB', date: 'Today 12:15', type: 'Library' },
    { name: 'app-release.apk', format: 'Android APK (DEX)', size: '18.5 MB', date: 'Yesterday', type: 'Package' },
  ];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const createDummyFile = (filename: string) => {
    const dummyContent = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const blob = new Blob([dummyContent], { type: 'application/octet-stream' });
    const file = new File([blob], filename, { type: 'application/octet-stream' });
    onFileSelected(file);
  };

  return (
    <div className="h-screen bg-dark-900 flex flex-col font-sans text-[#abb2bf] overflow-hidden select-none">
      
      {/* ── Ghidra Project Window Titlebar ── */}
      <div className="h-7 bg-dark-700 border-b border-dark-600 flex items-center px-3 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-white">Ghidra Project Manager</span>
          <span className="text-[11px] text-[#5c6370]">| Project: ReverseLab_Workspace (Active)</span>
        </div>
        <div className="text-[10px] text-[#5c6370] font-mono">Ghidra v11.1 Native Workspace</div>
      </div>

      {/* ── Ghidra Project Toolbar ── */}
      <div className="px-4 py-2 bg-dark-800 border-b border-dark-600 flex items-center gap-2 shrink-0 font-mono text-[11px]">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 bg-accent-blue hover:bg-blue-600 text-white rounded-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          📂 Import File... (Ins)
        </button>
        <div className="h-4 w-px bg-dark-600 mx-1" />
        <button className="px-3 py-1 bg-dark-700 hover:bg-sel-hover border border-dark-600 text-[#abb2bf] rounded-sm">
          📁 New Folder
        </button>
        <button className="px-3 py-1 bg-dark-700 hover:bg-sel-hover border border-dark-600 text-[#abb2bf] rounded-sm">
          🔍 Search Project
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* ── Main Body: Tool Chest & Project File Tree ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Ghidra Tool Chest (Plugins Launcher) */}
        <div className="w-64 bg-dark-800 border-r border-dark-600 p-4 flex flex-col justify-between shrink-0">
          <div>
            <div className="text-[11px] font-bold text-[#e5c07b] uppercase tracking-wider mb-3">
              Ghidra Tool Chest
            </div>

            {/* CodeBrowser Tool Card */}
            <div className="bg-dark-700 border border-dark-600 rounded p-3 mb-3 hover:border-accent-blue transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-dark-900 border border-dark-600 rounded flex items-center justify-center text-xl text-[#4fc1ff] group-hover:scale-110 transition-transform">
                  🐉
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white">CodeBrowser</div>
                  <div className="text-[10px] text-[#5c6370]">Reverse Engineering & Decompiler</div>
                </div>
              </div>
            </div>

            {/* Debugger Tool Card */}
            <div className="bg-dark-700 border border-dark-600 rounded p-3 mb-3 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-dark-900 border border-dark-600 rounded flex items-center justify-center text-xl text-[#e5c07b]">
                  🐛
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#abb2bf]">Debugger</div>
                  <div className="text-[10px] text-[#5c6370]">GDB / LLDB Breakpoints</div>
                </div>
              </div>
            </div>

            {/* Version Tracking Card */}
            <div className="bg-dark-700 border border-dark-600 rounded p-3 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-dark-900 border border-dark-600 rounded flex items-center justify-center text-xl text-[#c586c0]">
                  🔀
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#abb2bf]">Version Tracking</div>
                  <div className="text-[10px] text-[#5c6370]">Binary Patch Diffing</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-[#5c6370] border-t border-dark-600 pt-3">
            ReverseLab Universal Disassembler
          </div>
        </div>

        {/* Right side: Drag and Drop & Project Directory */}
        <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto bg-dark-900">
          
          {/* Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all
              ${dragOver ? 'border-accent-blue bg-accent-blue/10 scale-[1.01]' : 'border-dark-600 bg-dark-800 hover:border-dark-500'}
            `}
          >
            <div className="w-14 h-14 bg-dark-700 border border-dark-600 rounded-full flex items-center justify-center text-2xl text-[#4fc1ff] mb-3">
              🐉
            </div>
            <div className="text-[14px] font-bold text-white mb-1">
              Drop any compiled binary here to analyze in Ghidra CodeBrowser
            </div>
            <div className="text-[11px] text-[#5c6370]">
              Supports PE (.exe, .dll), ELF, Mach-O, APK, JAR, ZIP & Raw Binaries (Up to 700 MB)
            </div>
          </div>

          {/* Project File Tree Table */}
          <div className="bg-dark-800 border border-dark-600 rounded flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-dark-700 border-b border-dark-600 font-bold text-[12px] text-white flex items-center justify-between">
              <span>Active Project Binary Directory (/ReverseLab_Workspace)</span>
              <span className="text-[11px] font-normal text-[#5c6370]">Click sample binary to launch</span>
            </div>
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="bg-dark-900 border-b border-dark-600 text-[#5c6370] text-[10px] uppercase">
                  <th className="py-2 px-4">Program File Name</th>
                  <th className="py-2 px-4">Format / Arch</th>
                  <th className="py-2 px-4">File Size</th>
                  <th className="py-2 px-4">Type</th>
                  <th className="py-2 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {sampleFiles.map(f => (
                  <tr key={f.name} className="border-b border-dark-700 hover:bg-sel-hover">
                    <td className="py-2 px-4 text-[#4fc1ff] font-bold">{f.name}</td>
                    <td className="py-2 px-4 text-[#4ec9b0]">{f.format}</td>
                    <td className="py-2 px-4 text-[#b5cea8]">{f.size}</td>
                    <td className="py-2 px-4 text-[#c586c0]">{f.type}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => createDummyFile(f.name)}
                        className="px-3 py-0.5 bg-accent-blue hover:bg-blue-600 text-white rounded text-[10px] font-sans font-semibold"
                      >
                        Analyze in Ghidra
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-dark-800 border-t border-dark-600 flex items-center px-4 justify-between shrink-0 text-[10px] text-[#5c6370]">
        <span>Ghidra Engine Standby</span>
        <span>Local Workspace: /home/albert/.gemini/antigravity/scratch/reverselab</span>
      </div>
    </div>
  );
}

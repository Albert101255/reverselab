import { useState, useEffect, useRef } from 'react';
import type { DecompiledFile, FunctionItem } from '../../types/analysis';
import { API_BASE_URL } from '../../api';

interface DecompilerPanelProps {
  filename: string;
  fileId?: string;
  functions?: FunctionItem[];
  activeFile?: DecompiledFile | null;
}

const KEYWORDS = new Set([
  'void','int','char','if','else','return','exit','for','while','do','struct','typedef',
  'unsigned','long','short','static','const','NULL','true','false','mmap','munmap','open',
  'close','fprintf','perror','import','package','class','public','private','protected',
  'final','extends','implements','new','try','catch','int32_t','uint64_t','goto','COPY',
  'INT_ADD','INT_SUB','INT_XOR','INT_EQUAL','CALL','RETURN','BRANCH'
]);

function tokenize(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];

  if (line.trimStart().startsWith('//') || line.trimStart().startsWith('/*') || line.trimStart().startsWith('*') || line.trimStart().startsWith('<!--')) {
    return [<span key="c" className="text-code-comment">{line}</span>];
  }

  const regex = /(\s+|"[^"]*"|0x[0-9a-fA-F]+|-?\d+\.\d+|-?\d+|[a-zA-Z_][a-zA-Z0-9_]*|[^\s\w])/g;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(line)) !== null) {
    const tok = match[0];

    if (/^\s+$/.test(tok)) {
      parts.push(<span key={i}>{tok}</span>);
    } else if (/"[^"]*"/.test(tok)) {
      parts.push(<span key={i} className="text-code-str">{tok}</span>);
    } else if (/^0x[0-9a-fA-F]+$/.test(tok) || /^-?\d+$/.test(tok)) {
      parts.push(<span key={i} className="text-code-num">{tok}</span>);
    } else if (KEYWORDS.has(tok)) {
      parts.push(<span key={i} className="text-code-mnem">{tok}</span>);
    } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tok)) {
      parts.push(<span key={i} className="text-code-func">{tok}</span>);
    } else {
      parts.push(<span key={i} className="text-[#cccccc]">{tok}</span>);
    }
    i++;
  }

  return parts;
}

export function DecompilerPanel({ filename, fileId, functions = [], activeFile }: DecompilerPanelProps) {
  const [selectedFnName, setSelectedFnName] = useState<string>('main');
  const [viewMode, setViewMode] = useState<'pseudocode' | 'pcode' | 'variables' | 'heuristics'>('pseudocode');
  const [decompData, setDecompData] = useState<any>(null);
  const [loadedKey, setLoadedKey] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [varRenames, setVarRenames] = useState<Record<string, string>>({});
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [newVarName, setNewVarName] = useState('');
  const taRef = useRef<HTMLDivElement>(null);

  const currentKey = fileId ? `${fileId}:${selectedFnName}` : '';
  const loading = Boolean(fileId && loadedKey !== currentKey);

  // Fetch decompilation from backend engine when function or file changes
  useEffect(() => {
    if (!fileId) return;
    const key = `${fileId}:${selectedFnName}`;
    fetch(`${API_BASE_URL}/api/files/decompile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId, function_name: selectedFnName }),
    })
      .then(res => res.json())
      .then(data => {
        setDecompData(data);
      })
      .catch(err => console.error('Decompilation error:', err))
      .finally(() => setLoadedKey(key));
  }, [fileId, selectedFnName]);

  const defaultTitle = filename ? `${filename}::${selectedFnName}` : 'main.c';
  const rawPseudocode = activeFile ? activeFile.content : (decompData?.pseudocode || `void ${selectedFnName}() {\n    // Decompiling...\n}`);

  // Apply user variable renaming overrides
  let displayCode = rawPseudocode;
  Object.entries(varRenames).forEach(([oldName, newName]) => {
    if (newName.trim()) {
      const reg = new RegExp(`\\b${oldName}\\b`, 'g');
      displayCode = displayCode.replace(reg, newName);
    }
  });

  const lines = displayCode.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRenameSubmit = () => {
    if (renameTarget && newVarName.trim()) {
      setVarRenames(prev => ({ ...prev, [renameTarget]: newVarName.trim() }));
      setRenameTarget(null);
      setNewVarName('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 font-mono text-[12px] text-[#cccccc]">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-dark-800 border-b border-dark-700 shrink-0 select-none">
        
        {/* View Mode Switcher */}
        <div className="flex items-center border border-dark-600 rounded-sm overflow-hidden text-[11px]">
          {[
            { id: 'pseudocode', label: '📄 High-Level C' },
            { id: 'pcode',      label: '⚙️ Ghidra P-Code IR' },
            { id: 'variables',  label: '📊 Stack Frame' },
            { id: 'heuristics', label: '🛡️ API Heuristics' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id as any)}
              className={`px-3 py-0.5 transition-colors ${
                viewMode === m.id ? 'bg-accent-blue text-white font-bold' : 'text-[#858585] hover:bg-sel-hover'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Function Switcher Dropdown */}
        {!activeFile && functions.length > 0 && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[11px] text-[#858585]">Target Routine:</span>
            <select
              value={selectedFnName}
              onChange={e => setSelectedFnName(e.target.value)}
              className="bg-dark-700 border border-dark-600 text-[11px] text-[#4fc1ff] px-2 py-0.5 rounded outline-none"
            >
              {functions.map(fn => (
                <option key={fn.address} value={fn.name}>
                  {fn.name} ({fn.address})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-[11px] px-3 py-0.5 border border-dark-600 text-[#cccccc] hover:bg-sel-hover rounded-sm transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Pseudocode'}
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="px-4 py-1.5 bg-dark-700 border-b border-dark-700 shrink-0 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ec9b0" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>
            Decompiled <span className="text-[#9cdcfe] font-bold">{activeFile ? activeFile.path : defaultTitle}</span> via ReverseLab Ghidra P-Code Engine
          </span>
        </div>
        {loading && <span className="text-[#4fc1ff] animate-pulse">Running AST Control Flow Decompiler...</span>}
      </div>

      {/* ── View Mode Panels ── */}
      <div className="flex-1 overflow-auto bg-dark-900">

        {/* 1. Pseudocode View */}
        {viewMode === 'pseudocode' && (
          <div ref={taRef} className="h-full select-text p-0">
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line: string, i: number) => (
                  <tr key={i} className="hover:bg-sel-hover group">
                    <td className="w-12 text-right pr-4 py-0.5 text-[11px] text-[#555] select-none border-r border-dark-700 align-top shrink-0 sticky left-0 bg-dark-900 group-hover:bg-sel-hover">
                      {i + 1}
                    </td>
                    <td className="pl-5 py-0.5 whitespace-pre leading-5">
                      {tokenize(line)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Ghidra P-Code IR Microcode View */}
        {viewMode === 'pcode' && (
          <div className="p-4 space-y-1">
            <div className="text-[11px] text-[#858585] mb-2 font-bold uppercase tracking-wider">
              Ghidra P-Code Intermediate Representation (IR)
            </div>
            {decompData?.pcode_ir?.length > 0 ? (
              decompData.pcode_ir.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 py-1 border-b border-dark-800 hover:bg-sel-hover px-2 rounded">
                  <span className="text-[#7ec8a0] w-24 shrink-0">{p.address}</span>
                  <span className="text-[#c586c0] w-16 shrink-0 font-bold">{p.mnemonic}</span>
                  <span className="text-[#4fc1ff] w-28 shrink-0">{p.pcode_op}</span>
                  <span className="text-[#ce9178] font-mono">{p.pcode_str}</span>
                </div>
              ))
            ) : (
              <div className="text-[#666] py-8 text-center">No P-Code IR stream available for this function.</div>
            )}
          </div>
        )}

        {/* 3. Stack Frame & Variable Table View */}
        {viewMode === 'variables' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] font-bold text-[#4fc1ff]">Stack Frame Variables</span>
              <span className="text-[11px] text-[#858585]">Click variable to rename</span>
            </div>
            <table className="w-full text-left border-collapse border border-dark-600 bg-dark-800 rounded">
              <thead>
                <tr className="bg-dark-700 text-[#858585] text-[11px]">
                  <th className="py-2 px-3">Stack Offset</th>
                  <th className="py-2 px-3">Variable Name</th>
                  <th className="py-2 px-3">Inferred C Type</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {decompData?.stack_variables?.length > 0 ? (
                  decompData.stack_variables.map((v: any) => {
                    const currentName = varRenames[v.name] || v.name;
                    return (
                      <tr key={v.offset} className="border-b border-dark-700 hover:bg-sel-hover">
                        <td className="py-1.5 px-3 text-[#7ec8a0]">{v.offset}</td>
                        <td className="py-1.5 px-3 text-[#9cdcfe] font-bold">{currentName}</td>
                        <td className="py-1.5 px-3 text-[#dcdcaa]">{v.type}</td>
                        <td className="py-1.5 px-3">
                          <button
                            onClick={() => { setRenameTarget(v.name); setNewVarName(currentName); }}
                            className="px-2 py-0.5 bg-dark-700 border border-dark-600 hover:bg-sel-hover text-[#4fc1ff] text-[10px] rounded"
                          >
                            Rename Variable
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#666]">No stack variables identified.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Security & API Heuristics View */}
        {viewMode === 'heuristics' && (
          <div className="p-4">
            <div className="text-[12px] font-bold text-[#f44747] mb-3">
              Decompiled Security & API Threat Heuristics
            </div>
            {decompData?.security_heuristics?.length > 0 ? (
              <div className="space-y-2">
                {decompData.security_heuristics.map((h: any, idx: number) => (
                  <div key={idx} className="bg-dark-800 border border border-dark-600 rounded p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[#9cdcfe] font-bold">{h.api}()</div>
                      <div className="text-[#858585] text-[11px]">{h.category}</div>
                    </div>
                    <span className="text-[#7ec8a0] font-mono text-[11px]">{h.address}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-[#666] border border-dark-600 rounded bg-dark-800">
                No sensitive/malicious API calls flagged in this routine.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rename Variable Modal */}
      {renameTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-600 rounded p-4 w-96 space-y-3">
            <div className="text-[12px] font-bold text-white">Rename Stack Variable</div>
            <div className="text-[11px] text-[#858585]">
              Renaming <span className="text-[#4fc1ff]">{renameTarget}</span> across decompiled pseudocode:
            </div>
            <input
              type="text"
              value={newVarName}
              onChange={e => setNewVarName(e.target.value)}
              placeholder="e.g. hFile or buffer"
              className="w-full bg-dark-900 border border-dark-600 px-3 py-1.5 text-white rounded text-[12px] outline-none focus:border-accent-blue"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRenameTarget(null)}
                className="px-3 py-1 bg-dark-700 text-[#cccccc] rounded text-[11px]"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                className="px-3 py-1 bg-accent-blue text-white rounded text-[11px] font-bold"
              >
                Apply Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

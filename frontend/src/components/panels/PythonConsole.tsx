import { useState, useRef, useEffect } from 'react';
import { executePythonScript } from '../../api';

interface PythonConsoleProps {
  fileId: string;
}

const PRESET_SCRIPTS = [
  { label: 'List Functions', code: 'for fn in get_functions():\n    print(f"{fn[\'address\']}  {fn[\'name\']} ({fn[\'size\']} bytes)")' },
  { label: 'Find Admin Strings', code: 'for s in get_strings():\n    if "admin" in s["value"].lower():\n        print(f"{s[\'address\']} -> {s[\'value\']}")' },
  { label: 'List Sections', code: 'for sec in get_sections():\n    print(f"{sec[\'name\']}  addr={sec[\'virtual_address\']}  entropy={sec.get(\'entropy\', 0.0)}")' },
];

export function PythonConsole({ fileId }: PythonConsoleProps) {
  const [history, setHistory] = useState<Array<{ type: 'cmd' | 'out' | 'err'; text: string }>>([
    { type: 'out', text: 'Ghidra PyScript REPL v1.0. Python environment connected.' },
    { type: 'out', text: 'Helper globals: get_functions(), get_strings(), get_sections(), raw_bytes' }
  ]);
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleRun = async (codeToRun?: string) => {
    const code = codeToRun || inputCode;
    if (!code.trim() || loading) return;

    setHistory(prev => [...prev, { type: 'cmd', text: `>>> ${code}` }]);
    if (!codeToRun) setInputCode('');
    setLoading(true);

    try {
      const output = await executePythonScript(fileId, code);
      setHistory(prev => [...prev, { type: 'out', text: output }]);
    } catch (err) {
      setHistory(prev => [...prev, { type: 'err', text: `Execution failed: ${err}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border-t border-dark-600 font-mono text-[11px]">
      {/* Console toolbar */}
      <div className="px-3 py-1 bg-dark-800 border-b border-dark-600 flex items-center gap-2 shrink-0 select-none">
        <span className="text-[#4fc1ff] font-bold">Python Script Console</span>
        <div className="ml-auto flex items-center gap-2">
          {PRESET_SCRIPTS.map(p => (
            <button
              key={p.label}
              onClick={() => handleRun(p.code)}
              className="px-2 py-0.5 bg-dark-700 hover:bg-sel-hover border border-dark-600 text-[#cccccc] rounded-sm text-[10px]"
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setHistory([])}
            className="px-2 py-0.5 bg-dark-700 hover:bg-sel-hover border border-dark-600 text-[#858585] hover:text-[#cccccc] rounded-sm text-[10px]"
          >
            Clear Log
          </button>
        </div>
      </div>

      {/* Console output window */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {history.map((item, i) => (
          <div key={i} className="whitespace-pre-wrap leading-4">
            {item.type === 'cmd' && <span className="text-[#4ec9b0]">{item.text}</span>}
            {item.type === 'out' && <span className="text-[#cccccc]">{item.text}</span>}
            {item.type === 'err' && <span className="text-[#f44747]">{item.text}</span>}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Console input bar */}
      <div className="p-2 bg-dark-800 border-t border-dark-600 flex items-center gap-2">
        <span className="text-[#4ec9b0] font-bold">&gt;&gt;&gt;</span>
        <input
          type="text"
          value={inputCode}
          onChange={e => setInputCode(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleRun(); }}
          placeholder="Enter Python command... e.g. print(len(get_functions()))"
          className="flex-1 bg-dark-900 border border-dark-600 px-2 py-1 text-[#cccccc] focus:outline-none focus:border-accent-blue rounded-sm"
        />
        <button
          onClick={() => handleRun()}
          disabled={loading}
          className="px-3 py-1 bg-accent-blue text-white hover:bg-blue-600 rounded-sm font-sans text-[11px]"
        >
          {loading ? 'Running...' : 'Execute'}
        </button>
      </div>
    </div>
  );
}

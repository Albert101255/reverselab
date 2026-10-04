import { useMemo, useState } from 'react';
import type { ImportItem, ExportItem } from '../../types/analysis';

interface ImportsExportsViewerProps {
  imports: ImportItem[];
  exports: ExportItem[];
}

export function ImportsExportsViewer({ imports, exports: exps }: ImportsExportsViewerProps) {
  const [activeTab, setTab] = useState<'imports' | 'exports'>('imports');
  const [search, setSearch] = useState('');

  const filteredImports = useMemo(() => {
    if (!search.trim()) return imports;
    const q = search.toLowerCase();
    return imports.filter(lib =>
      lib.library.toLowerCase().includes(q) ||
      lib.functions.some(f => f.toLowerCase().includes(q))
    );
  }, [imports, search]);

  const filteredExports = useMemo(() => {
    if (!search.trim()) return exps;
    const q = search.toLowerCase();
    return exps.filter(e => e.name.toLowerCase().includes(q) || e.address.toLowerCase().includes(q));
  }, [exps, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-dark-800 border-b border-dark-700 shrink-0">
        <div className="flex border border-dark-600 rounded-sm overflow-hidden">
          {(['imports', 'exports'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-0.5 text-[11px] capitalize transition-colors ${activeTab === t ? 'bg-accent-blue text-white' : 'text-[#858585] hover:bg-sel-hover'}`}>
              {t} ({t === 'imports' ? imports.reduce((s, l) => s + l.functions.length, 0) : exps.length})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] text-[#858585]">Filter:</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="function or library…"
            className="bg-dark-700 border border-dark-600 text-[11px] font-mono text-[#cccccc] px-2 py-0.5 rounded-sm outline-none w-52 placeholder-[#555]" />
        </div>
      </div>

      {/* IMPORTS */}
      {activeTab === 'imports' && (
        <div className="flex-1 overflow-y-auto">
          {/* Column header */}
          <div className="grid grid-cols-[200px_1fr] px-4 py-1 bg-dark-800 border-b border-dark-700 sticky top-0 select-none">
            <span className="text-[10px] uppercase text-[#666] tracking-wider">Library</span>
            <span className="text-[10px] uppercase text-[#666] tracking-wider">Function</span>
          </div>
          {filteredImports.map(lib =>
            lib.functions.map((fn, i) => (
              <div key={`${lib.library}-${fn}-${i}`}
                className="grid grid-cols-[200px_1fr] px-4 py-0.5 hover:bg-sel-hover border-b border-dark-700/40 font-mono text-[12px]">
                {i === 0
                  ? <span className="text-code-str">{lib.library}</span>
                  : <span />
                }
                <span className="text-code-func">{fn}</span>
              </div>
            ))
          )}
          {filteredImports.length === 0 && (
            <div className="px-4 py-8 text-[#555] text-center">No imports found.</div>
          )}
        </div>
      )}

      {/* EXPORTS */}
      {activeTab === 'exports' && (
        <div className="flex-1 overflow-y-auto">
          {/* Column header */}
          <div className="grid grid-cols-[200px_140px_80px_1fr] px-4 py-1 bg-dark-800 border-b border-dark-700 sticky top-0 select-none">
            <span className="text-[10px] uppercase text-[#666] tracking-wider">Name</span>
            <span className="text-[10px] uppercase text-[#666] tracking-wider">Address</span>
            <span className="text-[10px] uppercase text-[#666] tracking-wider">Ordinal</span>
            <span className="text-[10px] uppercase text-[#666] tracking-wider">Notes</span>
          </div>
          {filteredExports.map((exp, i) => (
            <div key={i} className="grid grid-cols-[200px_140px_80px_1fr] px-4 py-0.5 hover:bg-sel-hover border-b border-dark-700/40 font-mono text-[12px]">
              <span className="text-code-label">{exp.name}</span>
              <span className="text-code-addr">{exp.address}</span>
              <span className="text-code-num">{exp.ordinal ?? '—'}</span>
              <span className="text-[#666] text-[11px]">{exp.notes ?? ''}</span>
            </div>
          ))}
          {filteredExports.length === 0 && (
            <div className="px-4 py-8 text-[#555] text-center">No exports found.</div>
          )}
        </div>
      )}
    </div>
  );
}

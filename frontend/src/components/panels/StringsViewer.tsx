import { useMemo, useState } from 'react';
import type { StringItem } from '../../types/analysis';

interface StringsViewerProps {
  strings: StringItem[];
}

export function StringsViewer({ strings }: StringsViewerProps) {
  const [search, setSearch]   = useState('');
  const [typeFilter, setType] = useState<'all' | 'utf8' | 'utf16'>('all');
  const [minLen, setMinLen]   = useState(4);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return strings.filter(s => {
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (s.value.length < minLen) return false;
      if (q && !s.value.toLowerCase().includes(q) && !s.address.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [strings, search, typeFilter, minLen]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-dark-800 border-b border-dark-700 shrink-0 flex-wrap">
        <div className="flex items-center gap-1 border border-dark-600 rounded-sm overflow-hidden">
          {(['all', 'utf8', 'utf16'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-2 py-0.5 text-[11px] transition-colors ${typeFilter === t ? 'bg-accent-blue text-white' : 'text-[#858585] hover:bg-sel-hover'}`}>
              {t === 'all' ? 'All' : t === 'utf8' ? 'ASCII' : 'UTF-16'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#858585]">Min len:</span>
          <input
            type="number" value={minLen} min={1} max={100}
            onChange={e => setMinLen(Number(e.target.value))}
            className="w-12 bg-dark-700 border border-dark-600 text-[11px] font-mono text-[#cccccc] px-2 py-0.5 rounded-sm outline-none text-center"
          />
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] text-[#858585]">Filter:</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="search strings…"
            className="bg-dark-700 border border-dark-600 text-[11px] font-mono text-[#cccccc] px-2 py-0.5 rounded-sm outline-none w-48 placeholder-[#555]" />
        </div>

        <span className="text-[11px] text-[#666]">{filtered.length} / {strings.length}</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[130px_60px_50px_1fr] px-4 py-1 bg-dark-800 border-b border-dark-700 shrink-0 select-none">
        <th className="text-[10px] uppercase text-[#666] tracking-wider">Address</th>
        <th className="text-[10px] uppercase text-[#666] tracking-wider">Type</th>
        <th className="text-[10px] uppercase text-[#666] tracking-wider">Len</th>
        <th className="text-[10px] uppercase text-[#666] tracking-wider">String Value</th>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto font-mono text-[12px]">
        {filtered.map((s, i) => (
          <div key={i} className="grid grid-cols-[130px_60px_50px_1fr] px-4 py-0.5 hover:bg-sel-hover border-b border-dark-700/40">
            <span className="text-code-addr">{s.address}</span>
            <span className="text-[#858585] text-[10px] pt-0.5">{s.type}</span>
            <span className="text-code-num">{s.value.length}</span>
            <span className="text-code-str truncate" title={s.value}>"{s.value}"</span>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="px-4 py-8 text-[#555] text-center">No strings match the current filter.</div>
        )}
      </div>
    </div>
  );
}

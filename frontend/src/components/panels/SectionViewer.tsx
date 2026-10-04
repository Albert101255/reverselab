import type { SectionItem } from '../../types/analysis';

interface SectionViewerProps {
  sections: SectionItem[];
}

function entropyColor(e: number) {
  if (e < 0.5) return 'text-[#6a9955]';
  if (e < 4.0) return 'text-code-addr';
  if (e < 6.0) return 'text-code-mnem';
  if (e < 7.0) return 'text-code-str';
  return 'text-red-400';
}

function EntropyBar({ value }: { value: number }) {
  const pct = Math.min(value / 8, 1) * 100;
  let color = '#4ec9b0';
  if (value >= 7) color = '#f87171';
  else if (value >= 6) color = '#ce9178';
  else if (value >= 4) color = '#dcdcaa';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-dark-700 rounded-sm overflow-hidden min-w-[60px]">
        <div className="h-full rounded-sm" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className={`text-[11px] font-mono w-8 ${entropyColor(value)}`}>{value.toFixed(2)}</span>
    </div>
  );
}

export function SectionViewer({ sections }: SectionViewerProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Panel title */}
      <div className="px-4 py-2.5 border-b border-dark-700 bg-dark-800 shrink-0">
        <span className="text-[11px] font-semibold text-[#cccccc]">Memory Map</span>
        <span className="text-[11px] text-[#666] ml-2">— {sections.length} sections</span>
      </div>

      {/* Table header */}
      <div className="grid gap-2 px-4 py-1.5 bg-dark-800 border-b border-dark-700 shrink-0 select-none"
        style={{ gridTemplateColumns: '100px 130px 110px 90px 90px 80px 1fr' }}>
        {['Name', 'Virt. Addr', 'Raw Offset', 'Raw Size', 'Virt Size', 'Perms', 'Entropy'].map(h => (
          <span key={h} className="text-[10px] uppercase text-[#666] tracking-wider">{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto font-mono text-[12px]">
        {sections.map((sec, i) => (
          <div key={i}
            className="grid gap-2 px-4 py-1.5 hover:bg-sel-hover border-b border-dark-700/40 items-center"
            style={{ gridTemplateColumns: '100px 130px 110px 90px 90px 80px 1fr' }}>

            <span className="text-[#4ec9b0] font-semibold">{sec.name || '<unnamed>'}</span>
            <span className="text-code-addr">{sec.virtual_address}</span>
            <span className="text-code-num">{sec.raw_offset}</span>
            <span className="text-[#cccccc]">{sec.raw_size}</span>
            <span className="text-[#cccccc]">{sec.virtual_size ?? '—'}</span>
            <span className="flex gap-0.5">
              {(sec.permissions ?? '---').split('').map((p, pi) => (
                <span key={pi} className={`${p !== '-' ? 'text-code-mnem font-semibold' : 'text-[#555]'}`}>{p}</span>
              ))}
            </span>
            <EntropyBar value={sec.entropy ?? 0} />
          </div>
        ))}

        {sections.length === 0 && (
          <div className="px-4 py-8 text-[#555] text-center">No sections found.</div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-4 py-2 border-t border-dark-700 bg-dark-800 shrink-0">
        <span className="text-[10px] text-[#555] uppercase tracking-wider">Entropy legend:</span>
        {[
          { label: '< 0.5  normal text/data',    color: 'text-[#6a9955]' },
          { label: '4–6  compressed',             color: 'text-code-mnem' },
          { label: '6–7  encrypted/packed',       color: 'text-code-str' },
          { label: '≥ 7   highly packed',         color: 'text-red-400' },
        ].map(it => (
          <span key={it.label} className={`text-[10px] ${it.color}`}>{it.label}</span>
        ))}
      </div>
    </div>
  );
}

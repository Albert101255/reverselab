import { useMemo, useState } from 'react';

interface HexViewerProps {
  rawHex: string;
  onSelectOffset?: (offset: number) => void;
}

const BYTES_PER_ROW = 16;

export function HexViewer({ rawHex, onSelectOffset }: HexViewerProps) {
  const [offsetBase, setOffsetBase] = useState<'hex' | 'dec'>('hex');
  const [search, setSearch]         = useState('');
  const [hovered, setHovered]       = useState<number | null>(null);

  const bytes = useMemo(() => {
    const tokens = rawHex.replace(/\s+/g, ' ').trim().split(' ');
    return tokens.filter(t => /^[0-9a-fA-F]{2}$/.test(t));
  }, [rawHex]);

  const rows = useMemo(() => {
    const out: { offset: number; hex: string[]; ascii: string }[] = [];
    for (let i = 0; i < bytes.length; i += BYTES_PER_ROW) {
      const chunk = bytes.slice(i, i + BYTES_PER_ROW);
      const ascii = chunk
        .map(b => {
          const v = parseInt(b, 16);
          return v >= 0x20 && v < 0x7f ? String.fromCharCode(v) : '.';
        })
        .join('');
      out.push({ offset: i, hex: chunk, ascii });
    }
    return out;
  }, [bytes]);

  const matchedOffsets = useMemo(() => {
    if (!search.trim()) return new Set<number>();
    const q = search.toLowerCase();
    const matched = new Set<number>();
    for (let i = 0; i <= bytes.length - q.replace(/\s/g, '').length / 2; i++) {
      const slice = bytes.slice(i, i + 16).join(' ').toLowerCase();
      if (slice.includes(q)) {
        for (let j = i; j < Math.min(i + 16, bytes.length); j++) matched.add(j);
      }
    }
    return matched;
  }, [bytes, search]);

  const fmtOffset = (n: number) =>
    offsetBase === 'hex'
      ? `0x${n.toString(16).padStart(8, '0').toUpperCase()}`
      : n.toString(10).padStart(10, ' ');

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-dark-800 border-b border-dark-700 shrink-0">
        <div className="flex items-center gap-1 border border-dark-600 rounded-sm overflow-hidden">
          {(['hex', 'dec'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setOffsetBase(mode)}
              className={`px-2 py-0.5 text-[11px] font-mono transition-colors ${offsetBase === mode ? 'bg-accent-blue text-white' : 'text-[#858585] hover:bg-sel-hover'}`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] text-[#858585]">Search hex:</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="4D 5A…"
            className="bg-dark-700 border border-dark-600 text-[11px] font-mono text-[#cccccc] px-2 py-0.5 rounded-sm outline-none w-36 placeholder-[#555]"
          />
        </div>

        <span className="text-[11px] text-[#666]">{bytes.length} bytes ({(bytes.length / 1024).toFixed(1)} KB)</span>
      </div>

      {/* Column header */}
      <div className="flex items-center bg-dark-800 border-b border-dark-700 px-4 py-1 shrink-0 font-mono text-[10px] uppercase text-[#666] tracking-wider select-none">
        <span className="w-36">Offset</span>
        <div className="flex gap-1 mr-4">
          {Array.from({ length: BYTES_PER_ROW }, (_, i) => (
            <span key={i} className="w-6 text-center">{i.toString(16).toUpperCase().padStart(2,'0')}</span>
          ))}
        </div>
        <span>ASCII</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto font-mono text-[12px] select-text">
        {rows.map(row => (
          <div
            key={row.offset}
            className="flex items-center px-4 py-0.5 hover:bg-sel-hover border-b border-dark-700/40"
          >
            {/* Offset */}
            <span className="w-36 text-code-addr text-[11px] shrink-0">{fmtOffset(row.offset)}</span>

            {/* Hex bytes */}
            <div className="flex gap-1 mr-4">
              {row.hex.map((b, i) => {
                const globalIdx = row.offset + i;
                const isHovered  = hovered === globalIdx;
                const isMatched  = matchedOffsets.has(globalIdx);
                return (
                  <span
                    key={i}
                    onClick={() => onSelectOffset?.(globalIdx)}
                    onMouseEnter={() => setHovered(globalIdx)}
                    onMouseLeave={() => setHovered(null)}
                    className={`w-6 text-center text-[11px] rounded-sm cursor-pointer transition-colors
                      ${isMatched  ? 'bg-accent-blue/40 text-white' : ''}
                      ${isHovered  ? 'bg-sel-hover text-accent-cyan' : 'text-[#cccccc]'}
                    `}
                  >
                    {b.toUpperCase()}
                  </span>
                );
              })}
              {/* Padding */}
              {row.hex.length < BYTES_PER_ROW &&
                Array.from({ length: BYTES_PER_ROW - row.hex.length }).map((_, i) => (
                  <span key={`pad-${i}`} className="w-6" />
                ))
              }
            </div>

            {/* ASCII */}
            <div className="flex">
              {row.ascii.split('').map((ch, i) => {
                const globalIdx = row.offset + i;
                const isHovered  = hovered === globalIdx;
                const isMatched  = matchedOffsets.has(globalIdx);
                return (
                  <span
                    key={i}
                    onMouseEnter={() => setHovered(globalIdx)}
                    onMouseLeave={() => setHovered(null)}
                    className={`w-[9px] text-center text-[11px] cursor-default transition-colors
                      ${ch === '.' ? 'text-[#555]' : ''}
                      ${isMatched  ? 'text-code-str' : ''}
                      ${isHovered  ? 'text-accent-cyan' : ''}
                      ${!ch || (ch !== '.' && !isMatched && !isHovered) ? 'text-code-str' : ''}
                    `}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import type { EntropyBlock, SectionItem } from '../../types/analysis';

interface EntropyVisualizerProps {
  entropyBlocks?: EntropyBlock[];
  sections: SectionItem[];
}

export function EntropyVisualizer({ entropyBlocks = [], sections }: EntropyVisualizerProps) {
  return (
    <div className="flex flex-col h-full bg-dark-900 font-mono text-[12px] p-4 text-[#cccccc]">
      <div className="flex items-center justify-between mb-3 border-b border-dark-600 pb-2">
        <div>
          <span className="text-[13px] font-bold text-[#4fc1ff]">Section Entropy Analysis</span>
          <span className="text-[11px] text-[#858585] ml-3">
            Measures byte randomness (0.0 = uniform / 8.0 = encrypted / packed)
          </span>
        </div>
      </div>

      {/* Per Section Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {sections.map(sec => {
          const ent = sec.entropy ?? 0;
          const isPacked = ent > 7.0;
          return (
            <div key={sec.name} className="bg-dark-800 border border-dark-600 rounded p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#4ec9b0] text-[13px]">{sec.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  isPacked ? 'bg-[#5a1d1d] text-[#f44747]' : 'bg-dark-700 text-[#7ec8a0]'
                }`}>
                  {isPacked ? 'HIGH (PACKED)' : 'NORMAL'}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-[11px] text-[#858585]">Entropy:</span>
                <span className="text-[14px] font-bold text-[#dcdcaa]">{ent.toFixed(3)} / 8.0</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-dark-700 h-2 rounded overflow-hidden mt-2">
                <div
                  className={`h-full ${isPacked ? 'bg-[#f44747]' : 'bg-[#4fc1ff]'}`}
                  style={{ width: `${(ent / 8.0) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Entropy Timeline Canvas / Blocks */}
      <div className="flex-1 bg-dark-800 border border-dark-600 rounded p-4 flex flex-col">
        <div className="text-[11px] text-[#858585] mb-2 font-bold uppercase tracking-wider">
          Binary Entropy Distribution Heatmap
        </div>
        <div className="flex-1 flex flex-wrap gap-1 overflow-y-auto content-start">
          {entropyBlocks.map((b, i) => {
            const h = b.entropy;
            // Color scale from cyan (low entropy) to purple/red (high entropy)
            const color = h > 7.2 ? '#f44747' : h > 6.0 ? '#c586c0' : h > 4.0 ? '#4fc1ff' : '#4ec9b0';
            return (
              <div
                key={i}
                title={`Offset: 0x${b.offset.toString(16)} | Section: ${b.section_name} | Entropy: ${b.entropy}`}
                className="w-4 h-8 rounded-sm hover:scale-125 transition-transform cursor-pointer"
                style={{ backgroundColor: color, opacity: 0.3 + (h / 8.0) * 0.7 }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

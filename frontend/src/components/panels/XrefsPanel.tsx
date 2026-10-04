import type { XrefItem } from '../../types/analysis';

interface XrefsPanelProps {
  xrefs?: XrefItem[];
  onNavigateAddress?: (addr: string) => void;
}

export function XrefsPanel({ xrefs = [], onNavigateAddress }: XrefsPanelProps) {
  return (
    <div className="flex flex-col h-full bg-dark-900 font-mono text-[12px] p-4 text-[#cccccc]">
      <div className="flex items-center justify-between mb-3 border-b border-dark-600 pb-2">
        <span className="text-[13px] font-bold text-[#4fc1ff]">Cross References (XREFs)</span>
        <span className="text-[11px] text-[#858585]">{xrefs.length} references detected</span>
      </div>

      <div className="flex-1 overflow-auto border border-dark-600 rounded bg-dark-800">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-dark-700 border-b border-dark-600 text-[#858585] text-[11px]">
              <th className="py-1.5 px-3 font-normal">From Address</th>
              <th className="py-1.5 px-3 font-normal">Reference Type</th>
              <th className="py-1.5 px-3 font-normal">To Target Address</th>
              <th className="py-1.5 px-3 font-normal">Symbol / String Name</th>
            </tr>
          </thead>
          <tbody>
            {xrefs.map((ref, idx) => (
              <tr
                key={idx}
                onClick={() => onNavigateAddress?.(ref.from_addr)}
                className="border-b border-dark-700 hover:bg-sel-hover cursor-pointer"
              >
                <td className="py-1 px-3 text-[#7ec8a0]">{ref.from_addr}</td>
                <td className="py-1 px-3">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    ref.type === 'CALL' ? 'bg-[#094771] text-[#9cdcfe]' :
                    ref.type === 'DATA_READ' ? 'bg-[#3b2d54] text-[#c586c0]' : 'bg-dark-700 text-[#858585]'
                  }`}>
                    {ref.type}
                  </span>
                </td>
                <td className="py-1 px-3 text-[#7ec8a0]">{ref.to_addr}</td>
                <td className="py-1 px-3 text-[#ce9178] truncate max-w-xs">{ref.target_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

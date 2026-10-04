import { useState } from 'react';
import type { DataTypeStruct } from '../../types/analysis';

interface DataTypeManagerProps {
  dataTypes?: DataTypeStruct[];
}

const PRIMITIVES = [
  { name: 'byte', size: 1, type: 'uint8_t' },
  { name: 'word', size: 2, type: 'uint16_t' },
  { name: 'dword', size: 4, type: 'uint32_t' },
  { name: 'qword', size: 8, type: 'uint64_t' },
  { name: 'float', size: 4, type: 'float' },
  { name: 'double', size: 8, type: 'double' },
  { name: 'pointer', size: 8, type: 'void*' },
  { name: 'string', size: 0, type: 'char[]' },
];

export function DataTypeManager({ dataTypes = [] }: DataTypeManagerProps) {
  const [selectedStruct, setSelectedStruct] = useState<DataTypeStruct | null>(dataTypes[0] || null);

  return (
    <div className="flex h-full bg-dark-900 text-[#cccccc] font-mono text-[12px]">
      {/* Struct tree sidebar */}
      <div className="w-64 bg-dark-800 border-r border-dark-600 flex flex-col shrink-0">
        <div className="px-3 py-1.5 bg-dark-700 border-b border-dark-600 text-[10px] uppercase font-semibold text-[#858585] tracking-wider">
          Data Type Manager
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {/* Primitives category */}
          <div className="px-3 py-1 text-[11px] font-bold text-[#4ec9b0] flex items-center justify-between">
            <span>Built-in Primitives</span>
            <span className="text-[10px] text-[#666]">{PRIMITIVES.length}</span>
          </div>
          {PRIMITIVES.map(p => (
            <div key={p.name} className="pl-6 pr-3 py-0.5 hover:bg-sel-hover cursor-pointer text-[11px] flex justify-between text-[#9cdcfe]">
              <span>{p.name}</span>
              <span className="text-[#666] font-mono">{p.size ? `${p.size}B` : 'var'}</span>
            </div>
          ))}

          {/* C Headers category */}
          <div className="px-3 py-1 mt-3 text-[11px] font-bold text-[#c586c0] flex items-center justify-between">
            <span>Structure Templates</span>
            <span className="text-[10px] text-[#666]">{dataTypes.length}</span>
          </div>
          {dataTypes.map(st => (
            <div
              key={st.name}
              onClick={() => setSelectedStruct(st)}
              className={`pl-6 pr-3 py-0.5 hover:bg-sel-hover cursor-pointer text-[11px] flex justify-between ${
                selectedStruct?.name === st.name ? 'bg-sel-bg text-white' : 'text-[#cccccc]'
              }`}
            >
              <span>{st.name}</span>
              <span className="text-[#666]">{st.size}B</span>
            </div>
          ))}
        </div>
      </div>

      {/* Struct detail view */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedStruct ? (
          <>
            <div className="px-4 py-2 bg-dark-800 border-b border-dark-600 flex items-center justify-between">
              <div>
                <span className="text-[13px] font-bold text-[#4fc1ff]">{selectedStruct.name}</span>
                <span className="text-[11px] text-[#858585] ml-3">Category: {selectedStruct.category}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 bg-dark-700 border border-dark-600 rounded text-[#ce9178]">
                Size: {selectedStruct.size} bytes
              </span>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-dark-600 text-[#858585]">
                    <th className="py-1 px-2 font-normal">Offset</th>
                    <th className="py-1 px-2 font-normal">Field Name</th>
                    <th className="py-1 px-2 font-normal">Type</th>
                    <th className="py-1 px-2 font-normal">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStruct.fields.map(f => (
                    <tr key={f.name} className="border-b border-dark-700 hover:bg-sel-hover">
                      <td className="py-1 px-2 text-[#7ec8a0]">0x{f.offset.toString(16).padStart(4, '0').toUpperCase()}</td>
                      <td className="py-1 px-2 text-[#9cdcfe]">{f.name}</td>
                      <td className="py-1 px-2 text-[#dcdcaa]">{f.type_name}</td>
                      <td className="py-1 px-2 text-[#b5cea8]">{f.size}B</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#666]">
            Select a C structure from the left tree to inspect field layouts
          </div>
        )}
      </div>
    </div>
  );
}

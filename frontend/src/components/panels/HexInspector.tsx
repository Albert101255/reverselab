import { useState } from 'react';
import { patchBinaryBytes } from '../../api';

interface HexInspectorProps {
  fileId: string;
  selectedByteOffset: number;
  rawHex: string;
  onPatchSuccess?: (updatedHex?: string) => void;
}

export function HexInspector({ fileId, selectedByteOffset, rawHex, onPatchSuccess }: HexInspectorProps) {
  const [patchHex, setPatchHex] = useState('90 90');
  const [patchMsg, setPatchMsg] = useState('');
  const [patching, setPatching] = useState(false);

  // Extract selected byte value if available
  const hexTokens = rawHex.split(' ');
  const byteVal = parseInt(hexTokens[selectedByteOffset] || '0', 16);

  const int8 = (byteVal << 24) >> 24;
  const uint8 = byteVal & 0xff;
  const ascii = byteVal >= 32 && byteVal <= 126 ? String.fromCharCode(byteVal) : '.';

  const handleApplyPatch = async () => {
    if (!patchHex.trim() || patching) return;
    setPatching(true);
    setPatchMsg('');
    try {
      const res = await patchBinaryBytes(fileId, selectedByteOffset, patchHex);
      if (res.ok) {
        setPatchMsg(`Patched ${res.bytesPatched} byte(s) successfully!`);
        onPatchSuccess?.(res.updatedHex);
      } else {
        setPatchMsg(`Error: ${res.error || 'Patch failed'}`);
      }
    } catch (err) {
      setPatchMsg(`Patch failed: ${err}`);
    } finally {
      setPatching(false);
    }
  };

  return (
    <div className="flex h-full bg-dark-900 text-[#cccccc] font-mono text-[11px] p-3 gap-4">
      {/* Byte Data Inspector */}
      <div className="w-64 bg-dark-800 border border-dark-600 rounded p-3 flex flex-col justify-between">
        <div>
          <div className="text-[12px] font-bold text-[#4fc1ff] border-b border-dark-600 pb-1 mb-2">
            Byte Inspector
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#858585]">Offset:</span>
              <span className="text-[#7ec8a0]">0x{selectedByteOffset.toString(16).padStart(8, '0').toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#858585]">Hex Byte:</span>
              <span className="text-[#ce9178]">0x{hexTokens[selectedByteOffset] || '00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#858585]">ASCII:</span>
              <span className="text-[#b5cea8]">'{ascii}'</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#858585]">int8 / uint8:</span>
              <span className="text-[#dcdcaa]">{int8} / {uint8}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#858585]">int16 (LE):</span>
              <span className="text-[#dcdcaa]">{uint8 | (0x00 << 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#858585]">int32 (LE):</span>
              <span className="text-[#dcdcaa]">{uint8}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#858585]">Architecture:</span>
              <span className="text-[#9cdcfe]">x86_64 (Little Endian)</span>
            </div>
          </div>
        </div>
        <div className="text-[10px] text-[#666] border-t border-dark-600 pt-2 mt-2">
          Click any byte in Byte View to update inspector.
        </div>
      </div>

      {/* Hex Patching Studio */}
      <div className="flex-1 bg-dark-800 border border-dark-600 rounded p-3 flex flex-col">
        <div className="text-[12px] font-bold text-[#c586c0] border-b border-dark-600 pb-1 mb-2">
          Interactive Binary Patch Studio
        </div>
        <div className="space-y-3 flex-1">
          <div>
            <label className="block text-[11px] text-[#858585] mb-1">Target Offset (Hex or Dec):</label>
            <input
              type="text"
              readOnly
              value={`0x${selectedByteOffset.toString(16).toUpperCase()}`}
              className="w-full bg-dark-900 border border-dark-600 px-2 py-1 text-[#7ec8a0] rounded"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#858585] mb-1">Replacement Hex Bytes (space separated, e.g. 90 90 NOPs):</label>
            <input
              type="text"
              value={patchHex}
              onChange={e => setPatchHex(e.target.value)}
              placeholder="e.g. 90 90 or C3"
              className="w-full bg-dark-900 border border-dark-600 px-2 py-1 text-[#ce9178] rounded focus:border-accent-blue focus:outline-none"
            />
          </div>
          <button
            onClick={handleApplyPatch}
            disabled={patching}
            className="px-4 py-1.5 bg-accent-blue hover:bg-blue-600 text-white rounded font-sans text-[11px] font-semibold transition-colors"
          >
            {patching ? 'Applying Patch...' : 'Apply Hex Patch'}
          </button>
          {patchMsg && (
            <div className={`text-[11px] mt-2 ${patchMsg.startsWith('Error') ? 'text-[#f44747]' : 'text-[#4ec9b0]'}`}>
              {patchMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

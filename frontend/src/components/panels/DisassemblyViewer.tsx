import { useMemo, useState } from 'react';
import type { InstructionItem, FunctionItem } from '../../types/analysis';

interface DisassemblyViewerProps {
  instructions: InstructionItem[];
  functions: FunctionItem[];
  selectedFunction: FunctionItem | null;
}

// Simple operand syntax coloring
function colorizeOperands(operands: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const tokens = operands.split(/([,\s]+)/);

  tokens.forEach((tok, i) => {
    if (/^0x[0-9a-fA-F]+$/.test(tok)) {
      parts.push(<span key={i} className="text-code-num">{tok}</span>);
    } else if (/^-?\d+$/.test(tok)) {
      parts.push(<span key={i} className="text-code-num">{tok}</span>);
    } else if (/^".*"$/.test(tok)) {
      parts.push(<span key={i} className="text-code-str">{tok}</span>);
    } else if (/^[re]?[abcdsb][xhlp]$|^r\d+[dw]?$|^[xy]mm\d+$/i.test(tok)) {
      parts.push(<span key={i} className="text-code-oper">{tok}</span>);
    } else {
      parts.push(<span key={i} className="text-[#cccccc]">{tok}</span>);
    }
  });
  return parts;
}

function FunctionHeader({ fn }: { fn: FunctionItem }) {
  return (
    <div className="mt-4 mb-1">
      <div className="text-code-comment font-mono text-[12px] px-4">
        {'// ─────────────────────────────────────────────────────────────'}
      </div>
      <div className="text-code-comment font-mono text-[12px] px-4">
        {'// FUNCTION'}
      </div>
      <div className="flex items-center gap-3 px-4 py-0.5">
        <span className="text-code-comment font-mono text-[12px]">//</span>
        <span className="text-[#4ec9b0] font-mono text-[12px]">void</span>
        <span className="text-code-func font-mono text-[12px] font-semibold">{fn.name}</span>
        <span className="text-[#cccccc] font-mono text-[12px]">(void)</span>
      </div>
      <div className="flex items-center gap-3 px-4 py-0.5">
        <span className="text-code-comment font-mono text-[12px]">//  Address: {fn.address}</span>
      </div>
      <div className="text-code-comment font-mono text-[12px] px-4">
        {'// ─────────────────────────────────────────────────────────────'}
      </div>
    </div>
  );
}

export function DisassemblyViewer({ instructions, functions, selectedFunction }: DisassemblyViewerProps) {
  const [jumpFn, setJumpFn]     = useState<string>('');
  const [searchQuery, setSearch] = useState('');

  const displayInstructions = useMemo(() => {
    const base = selectedFunction?.instructions?.length
      ? selectedFunction.instructions
      : instructions;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(ins =>
      ins.address.toLowerCase().includes(q) ||
      ins.mnemonic.toLowerCase().includes(q) ||
      ins.operands.toLowerCase().includes(q) ||
      (ins.comment ?? '').toLowerCase().includes(q)
    );
  }, [instructions, selectedFunction, searchQuery]);

  const currentFn = selectedFunction ?? null;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-dark-800 border-b border-dark-700 shrink-0">
        {/* Jump to function */}
        {functions.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#858585]">Jump:</span>
            <select
              value={jumpFn}
              onChange={e => setJumpFn(e.target.value)}
              className="bg-dark-700 border border-dark-600 text-[#cccccc] text-[11px] font-mono px-2 py-0.5 rounded-sm outline-none"
            >
              <option value="">— select function —</option>
              {functions.map(fn => (
                <option key={fn.address} value={fn.name}>{fn.name} ({fn.address})</option>
              ))}
            </select>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[11px] text-[#858585]">Filter:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearch(e.target.value)}
            placeholder="mnemonic / address…"
            className="bg-dark-700 border border-dark-600 text-[11px] font-mono text-[#cccccc] px-2 py-0.5 rounded-sm outline-none w-44 placeholder-[#555]"
          />
          <span className="text-[10px] text-[#666]">{displayInstructions.length} instructions</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center bg-dark-800 border-b border-dark-700 px-4 py-1 shrink-0 select-none">
        <span className="w-28 text-[10px] uppercase text-[#666] tracking-wider">Address</span>
        <span className="w-28 text-[10px] uppercase text-[#666] tracking-wider">Bytes</span>
        <span className="w-24 text-[10px] uppercase text-[#666] tracking-wider">Mnemonic</span>
        <span className="flex-1 text-[10px] uppercase text-[#666] tracking-wider">Operands</span>
        <span className="w-48 text-[10px] uppercase text-[#666] tracking-wider text-right">Comment</span>
      </div>

      {/* Listing */}
      <div className="flex-1 overflow-y-auto font-mono text-[12px] select-text">
        {/* Function header if viewing a specific function */}
        {currentFn && <FunctionHeader fn={currentFn} />}

        {displayInstructions.length === 0 && (
          <div className="px-4 py-8 text-[#555] text-center text-[12px]">
            No instructions available for this view.
          </div>
        )}

        {displayInstructions.map((ins, idx) => (
          <div
            key={idx}
            className="flex items-center px-4 py-0.5 hover:bg-sel-hover border-b border-dark-700/40 group"
          >
            {/* Address */}
            <span className="w-28 text-code-addr shrink-0">{ins.address}</span>

            {/* Raw bytes */}
            <span className="w-28 text-[#555] shrink-0 text-[11px] truncate">{ins.bytes}</span>

            {/* Mnemonic */}
            <span className="w-24 text-code-mnem font-semibold shrink-0">{ins.mnemonic.toUpperCase()}</span>

            {/* Operands */}
            <span className="flex-1 text-[#cccccc]">
              {colorizeOperands(ins.operands)}
            </span>

            {/* Comment */}
            {ins.comment && (
              <span className="w-48 text-code-comment text-right truncate text-[11px]">; {ins.comment}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

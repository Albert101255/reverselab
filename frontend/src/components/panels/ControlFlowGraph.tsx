import type { FunctionItem } from '../../types/analysis';

interface ControlFlowGraphProps {
  selectedFunction: FunctionItem | null;
}

/**
 * Simple ASCII / block-based control flow graph.
 * For a real CFG we would need the backend to return basic blocks.
 * This shows a placeholder that explains what's needed.
 */
export function ControlFlowGraph({ selectedFunction }: ControlFlowGraphProps) {
  if (!selectedFunction) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#555] select-none">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 opacity-40">
          <rect x="3" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="8.5" y="16" width="7" height="5" rx="1" />
          <line x1="6.5" y1="8" x2="6.5" y2="11" />
          <line x1="6.5" y1="11" x2="12" y2="11" />
          <line x1="17.5" y1="8" x2="17.5" y2="11" />
          <line x1="17.5" y1="11" x2="12" y2="11" />
          <line x1="12" y1="11" x2="12" y2="16" />
        </svg>
        <div className="text-[13px] text-[#666]">No function selected</div>
        <div className="text-[11px] text-[#555] mt-1">Click a function in the Symbol Tree or Listing view</div>
      </div>
    );
  }

  const instrs = selectedFunction.instructions ?? [];
  if (instrs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#555] select-none">
        <div className="text-[13px] text-[#666]">No instruction data available for this function</div>
        <div className="text-[11px] text-[#555] mt-1">
          Upgrade to deep-analysis mode for full CFG decomposition
        </div>
      </div>
    );
  }

  // Build naive basic blocks: new block starts after any branch / call / ret
  const BRANCH_MNEMONICS = new Set(['jmp','je','jne','jz','jnz','jg','jge','jl','jle','ja','jae','jb','jbe','jo','jno','js','jns','jp','jnp','call','ret','retn','jrcxz','jcxz','jecxz','loop','loope','loopne','br','b','bl','blx','bx']);
  
  const blocks: typeof instrs[] = [];
  let cur: typeof instrs = [];

  for (const ins of instrs) {
    cur.push(ins);
    if (BRANCH_MNEMONICS.has(ins.mnemonic.toLowerCase())) {
      blocks.push(cur);
      cur = [];
    }
  }
  if (cur.length) blocks.push(cur);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-dark-700 bg-dark-800 shrink-0 flex items-center gap-3">
        <span className="text-[11px] font-semibold text-[#cccccc]">Function Graph</span>
        <span className="text-code-func font-mono text-[11px]">{selectedFunction.name}</span>
        <span className="text-[11px] text-[#666]">— {blocks.length} basic block{blocks.length !== 1 ? 's' : ''}, {instrs.length} instructions</span>
      </div>

      {/* Block flow (vertical) */}
      <div className="flex-1 overflow-y-auto overflow-x-auto p-4">
        <div className="flex flex-col items-start gap-0">
          {blocks.map((block, bi) => (
            <div key={bi} className="flex flex-col items-center">
              {/* Block box */}
              <div className="bg-dark-800 border border-dark-600 rounded-sm w-80 shadow-sm">
                {/* Block header */}
                <div className="flex items-center gap-2 px-3 py-1 bg-dark-700 border-b border-dark-600">
                  <span className="text-[10px] uppercase text-[#666] tracking-wider font-semibold">Block {bi + 1}</span>
                  <span className="text-code-addr font-mono text-[10px]">{block[0]?.address}</span>
                </div>

                {/* Instructions */}
                <div className="px-3 py-1.5 font-mono text-[11px]">
                  {block.map((ins, ii) => {
                    const isBranch = BRANCH_MNEMONICS.has(ins.mnemonic.toLowerCase());
                    return (
                      <div key={ii} className="flex items-center gap-2 py-0.5">
                        <span className="w-20 text-code-addr text-[10px] shrink-0">{ins.address.slice(-4)}</span>
                        <span className={`w-16 font-semibold shrink-0 ${isBranch ? 'text-code-str' : 'text-code-mnem'}`}>
                          {ins.mnemonic.toUpperCase()}
                        </span>
                        <span className="text-code-oper truncate">{ins.operands}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Arrow down (except last block) */}
              {bi < blocks.length - 1 && (
                <div className="flex flex-col items-center text-[#555] my-1">
                  <div className="w-px h-3 bg-dark-500" />
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="#4a4a4a">
                    <path d="M0 0 L5 6 L10 0 Z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

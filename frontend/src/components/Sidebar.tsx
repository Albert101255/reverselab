import { useState } from 'react';
import type { AnalysisResult, FunctionItem, DecompiledFile } from '../types/analysis';

interface SidebarProps {
  analysis: AnalysisResult;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onFunctionClick: (fn: FunctionItem) => void;
  onSectionClick: () => void;
  onSelectDecompiledFile?: (file: DecompiledFile) => void;
}

function TreeSection({
  label,
  count,
  children,
  defaultOpen = false,
  onHeaderClick,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onHeaderClick?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <div
        className="flex items-center gap-1 px-2 py-0.5 hover:bg-sel-hover cursor-pointer select-none group"
        onClick={() => { setOpen(o => !o); onHeaderClick?.(); }}
      >
        <span className="text-[10px] text-[#858585] w-3 shrink-0">{open ? '▾' : '▸'}</span>
        <span className="text-[12px] text-[#cccccc] font-medium">{label}</span>
        <span className="text-[10px] text-[#666] ml-1">({count})</span>
      </div>
      {open && <div className="pl-4">{children}</div>}
    </div>
  );
}

function TreeLeaf({
  label,
  badge,
  color = '#cccccc',
  onClick,
  icon = '▪',
}: {
  label: string;
  badge?: string;
  color?: string;
  onClick?: () => void;
  icon?: string;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-0.5 hover:bg-sel-hover cursor-pointer select-none"
    >
      <span className="text-[10px] text-[#858585] shrink-0 font-mono">{icon}</span>
      <span className="text-[11px] font-mono truncate" style={{ color }}>{label}</span>
      {badge && <span className="ml-auto text-[10px] text-[#666] shrink-0">{badge}</span>}
    </div>
  );
}

export function SymbolTree({
  analysis,
  onNavigate,
  onFunctionClick,
  onSectionClick,
  onSelectDecompiledFile,
}: SidebarProps) {
  const [viewMode, setViewMode] = useState<'symbols' | 'files'>('files');
  const { sections, functions, imports, exports: exps, strings, decompiled_files = [] } = analysis;
  const o = analysis.overview;

  return (
    <div className="w-64 bg-dark-800 flex flex-col overflow-hidden shrink-0 border-r border-dark-600">
      {/* File identity block */}
      <div className="px-3 py-3 border-b border-dark-600 shrink-0">
        <div className="text-[12px] font-mono font-bold text-[#9cdcfe] truncate">{o.filename}</div>
        <div className="text-[10px] text-[#858585] mt-1 flex items-center gap-2">
          <span className="px-1.5 py-0 bg-dark-700 border border-dark-600 rounded-sm font-mono text-[#4ec9b0]">{o.format}</span>
          <span>{o.architecture}</span>
        </div>
      </div>

      {/* ── Mode selector header ── */}
      <div className="flex bg-dark-900 border-b border-dark-600 shrink-0">
        <button
          onClick={() => setViewMode('files')}
          className={`flex-1 py-1.5 text-[11px] font-mono border-r border-dark-600 transition-colors ${
            viewMode === 'files' ? 'bg-dark-800 text-white font-bold border-b-2 border-b-accent-blue' : 'text-[#858585] hover:text-white'
          }`}
        >
          📂 Project Files
        </button>
        <button
          onClick={() => setViewMode('symbols')}
          className={`flex-1 py-1.5 text-[11px] font-mono transition-colors ${
            viewMode === 'symbols' ? 'bg-dark-800 text-white font-bold border-b-2 border-b-accent-blue' : 'text-[#858585] hover:text-white'
          }`}
        >
          ⚡ Symbol Tree
        </button>
      </div>

      {/* Scrollable Explorer Body */}
      <div className="flex-1 overflow-y-auto py-1">
        {viewMode === 'files' ? (
          <div className="py-1">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[#666] font-semibold border-b border-dark-700/50 mb-1">
              Decompiled Source & Resources ({decompiled_files.length})
            </div>
            {decompiled_files.map(df => {
              const icon = df.type === 'java' ? '☕' : df.type === 'c' || df.type === 'h' ? '📄' : '⚙️';
              const color = df.type === 'java' ? '#ce9178' : df.type === 'c' ? '#4fc1ff' : '#dcdcaa';
              return (
                <TreeLeaf
                  key={df.path}
                  label={df.path}
                  badge={df.type.toUpperCase()}
                  color={color}
                  icon={icon}
                  onClick={() => {
                    onSelectDecompiledFile?.(df);
                    onNavigate('decompiler');
                  }}
                />
              );
            })}
          </div>
        ) : (
          <>
            {/* Sections */}
            <TreeSection label="Sections" count={sections.length} onHeaderClick={onSectionClick}>
              {sections.map(sec => (
                <TreeLeaf
                  key={sec.name}
                  label={sec.name || '<unnamed>'}
                  badge={sec.permissions}
                  color="#4ec9b0"
                  onClick={onSectionClick}
                />
              ))}
            </TreeSection>

            {/* Functions */}
            {functions.length > 0 && (
              <TreeSection label="Functions" count={functions.length} defaultOpen={true}>
                {functions.map(fn => (
                  <TreeLeaf
                    key={fn.address}
                    label={fn.name}
                    badge={`0x${parseInt(fn.address).toString(16).toUpperCase()}`}
                    color="#4fc1ff"
                    onClick={() => onFunctionClick(fn)}
                  />
                ))}
              </TreeSection>
            )}

            {/* Imports */}
            <TreeSection label="Imports" count={o.num_imports} onHeaderClick={() => onNavigate('symbols')}>
              {imports.slice(0, 40).map(imp => (
                <div key={imp.library}>
                  <div className="flex items-center gap-1 px-2 py-0.5 hover:bg-sel-hover cursor-pointer select-none" onClick={() => onNavigate('symbols')}>
                    <span className="text-[10px] text-[#555] w-3 shrink-0">▸</span>
                    <span className="text-[11px] font-mono text-[#ce9178] truncate">{imp.library}</span>
                    <span className="text-[10px] text-[#555] ml-auto shrink-0">{imp.functions.length}</span>
                  </div>
                </div>
              ))}
              {imports.length > 40 && (
                <div className="px-4 py-0.5 text-[10px] text-[#666] italic">…and {imports.length - 40} more</div>
              )}
            </TreeSection>

            {/* Exports */}
            {exps.length > 0 && (
              <TreeSection label="Exports" count={exps.length} onHeaderClick={() => onNavigate('symbols')}>
                {exps.slice(0, 30).map(exp => (
                  <TreeLeaf
                    key={exp.address}
                    label={exp.name}
                    badge={exp.address}
                    color="#c586c0"
                    onClick={() => onNavigate('symbols')}
                  />
                ))}
              </TreeSection>
            )}

            {/* Strings */}
            <TreeSection label="Strings" count={strings.length} onHeaderClick={() => onNavigate('strings')}>
              {strings.slice(0, 20).map((s, i) => (
                <TreeLeaf
                  key={i}
                  label={`"${s.value.slice(0, 28)}${s.value.length > 28 ? '…' : ''}"`}
                  badge={s.address}
                  color="#ce9178"
                  onClick={() => onNavigate('strings')}
                />
              ))}
              {strings.length > 20 && (
                <div className="px-4 py-0.5 text-[10px] text-[#666] italic">…and {strings.length - 20} more</div>
              )}
            </TreeSection>
          </>
        )}
      </div>

      {/* SHA-256 footer */}
      <div className="px-3 py-2 border-t border-dark-600 shrink-0">
        <div className="text-[9px] text-[#555] font-mono truncate" title={analysis.overview.sha256}>
          SHA256: {analysis.overview.sha256.slice(0, 16)}…
        </div>
      </div>
    </div>
  );
}

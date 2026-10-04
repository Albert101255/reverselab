import { useState } from 'react';
import type { AnalysisResult, FunctionItem, DecompiledFile } from '../types/analysis';
import { SymbolTree } from './Sidebar';
import { RightDock }  from './RightDock';
import { OverviewPanel }        from './panels/OverviewPanel';
import { DisassemblyViewer }    from './panels/DisassemblyViewer';
import { SectionViewer }        from './panels/SectionViewer';
import { HexViewer }            from './panels/HexViewer';
import { StringsViewer }        from './panels/StringsViewer';
import { ImportsExportsViewer } from './panels/ImportsExportsViewer';
import { HeaderViewer }         from './panels/HeaderViewer';
import { DecompilerPanel }      from './panels/DecompilerPanel';
import { ControlFlowGraph }     from './panels/ControlFlowGraph';
import { DataTypeManager }      from './panels/DataTypeManager';
import { XrefsPanel }           from './panels/XrefsPanel';
import { EntropyVisualizer }    from './panels/EntropyVisualizer';
import { BookmarksPanel }       from './panels/BookmarksPanel';
import type { BookmarkItem }    from './panels/BookmarksPanel';
import { PythonConsole }        from './panels/PythonConsole';
import { HexInspector }         from './panels/HexInspector';
import { SearchModal }          from './SearchModal';

interface WorkspaceProps {
  analysis: AnalysisResult;
  onNewFile: () => void;
}

const TABS = [
  { id: 'overview',    label: 'Program Info'    },
  { id: 'listing',     label: 'Listing'         },
  { id: 'decompiler',  label: 'Decompiler'      },
  { id: 'datatypes',   label: 'Data Types'      },
  { id: 'xrefs',       label: 'XREFs'           },
  { id: 'bookmarks',   label: 'Bookmarks'       },
  { id: 'entropy',     label: 'Entropy Map'     },
  { id: 'sections',    label: 'Memory Map'      },
  { id: 'hex',         label: 'Byte View'       },
  { id: 'strings',     label: 'Defined Strings' },
  { id: 'symbols',     label: 'Symbol Table'    },
  { id: 'headers',     label: 'Structure'       },
  { id: 'cfg',         label: 'Function Graph'  },
];

export function Workspace({ analysis, onNewFile }: WorkspaceProps) {
  const [activeTab, setActiveTab]                     = useState('overview');
  const [selectedFn, setSelectedFn]                   = useState<FunctionItem | null>(null);
  const [selectedDecompiledFile, setSelectedDecompiledFile] = useState<DecompiledFile | null>(null);
  const [bottomDrawer, setBottomDrawer]               = useState<'console' | 'inspector' | null>('console');
  const [selectedOffset, setSelectedOffset]           = useState<number>(0);
  const [isSearchOpen, setIsSearchOpen]               = useState(false);
  const [bookmarks, setBookmarks]                     = useState<BookmarkItem[]>([
    {
      id: 'bm-1',
      address: '0x401000',
      category: 'Analysis',
      comment: 'Primary entry point main routine',
      author: 'Ghidra Engine',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'bm-2',
      address: '0x401050',
      category: 'Vulnerability',
      comment: 'Unbounded strcpy buffer copy detected',
      author: 'Security Analyzer',
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);

  const handleFunctionClick = (fn: FunctionItem) => {
    setSelectedFn(fn);
    setActiveTab('listing');
  };

  const handleSectionClick = () => setActiveTab('sections');

  const handleNavigateAddress = (addr: string) => {
    setActiveTab('listing');
    try {
      const num = parseInt(addr.replace('0x', ''), 16);
      if (!isNaN(num)) setSelectedOffset(num);
    } catch {}
  };

  const handleAddBookmark = (newBm: Omit<BookmarkItem, 'id' | 'timestamp'>) => {
    const bm: BookmarkItem = {
      ...newBm,
      id: `bm-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setBookmarks(prev => [bm, ...prev]);
  };

  const handleExportPseudocode = () => {
    const code = selectedDecompiledFile ? selectedDecompiledFile.content : `/* Decompiled ${analysis.overview.filename} */\nvoid main(int argc, char** argv) {\n    // ReverseLab exported pseudocode\n}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.overview.filename}_decompiled.c`;
    a.click();
  };

  const o = analysis.overview;

  return (
    <div className="h-screen bg-dark-900 flex flex-col overflow-hidden text-[#cccccc] font-sans">

      {/* ── Top Ghidra Menu bar ── */}
      <div className="h-7 bg-dark-700 border-b border-dark-600 flex items-center px-3 gap-1 shrink-0 select-none">
        <span className="text-[12px] font-bold text-white mr-4">ReverseLab</span>
        
        {/* Menu items */}
        <div className="flex items-center gap-1">
          <div className="relative group">
            <span className="text-[12px] text-[#cccccc] px-2 py-0.5 hover:bg-sel-hover rounded-sm cursor-pointer">File</span>
            <div className="absolute left-0 top-full hidden group-hover:block bg-dark-800 border border-dark-600 shadow-xl py-1 z-50 w-48 font-mono text-[11px]">
              <div onClick={onNewFile} className="px-3 py-1 hover:bg-sel-hover cursor-pointer">Open Binary...</div>
              <div onClick={handleExportPseudocode} className="px-3 py-1 hover:bg-sel-hover cursor-pointer">Export C Pseudocode</div>
              <div onClick={onNewFile} className="px-3 py-1 hover:bg-sel-hover cursor-pointer border-t border-dark-700 text-[#f44747]">Close Project</div>
            </div>
          </div>

          <span
            onClick={() => setIsSearchOpen(true)}
            className="text-[12px] text-[#cccccc] px-2 py-0.5 hover:bg-sel-hover rounded-sm cursor-pointer"
          >
            Search
          </span>

          <span
            onClick={() => setActiveTab('bookmarks')}
            className="text-[12px] text-[#cccccc] px-2 py-0.5 hover:bg-sel-hover rounded-sm cursor-pointer"
          >
            Bookmarks
          </span>

          <span
            onClick={() => setBottomDrawer(bottomDrawer === 'console' ? null : 'console')}
            className="text-[12px] text-[#cccccc] px-2 py-0.5 hover:bg-sel-hover rounded-sm cursor-pointer"
          >
            Python Console
          </span>

          <span
            onClick={() => setBottomDrawer(bottomDrawer === 'inspector' ? null : 'inspector')}
            className="text-[12px] text-[#cccccc] px-2 py-0.5 hover:bg-sel-hover rounded-sm cursor-pointer"
          >
            Byte Inspector
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="text-[11px] px-2.5 py-0.5 bg-dark-800 border border-dark-600 text-[#4fc1ff] hover:bg-sel-hover rounded-sm transition-colors flex items-center gap-1 font-mono"
          >
            🔍 Find (Ctrl+F)
          </button>
          <button
            onClick={onNewFile}
            className="text-[11px] px-3 py-0.5 border border-dark-500 text-[#cccccc] hover:bg-sel-hover rounded-sm transition-colors"
          >
            Close Binary
          </button>
        </div>
      </div>

      {/* ── File breadcrumb bar ── */}
      <div className="h-7 bg-dark-800 border-b border-dark-600 flex items-center px-4 gap-3 shrink-0 select-none">
        <span className="font-mono text-[12px] text-[#9cdcfe] font-bold">{o.filename}</span>
        <span className="text-[#555]">·</span>
        <span className="text-[11px] text-[#858585]">{o.format}</span>
        <span className="text-[#555]">·</span>
        <span className="text-[11px] text-[#858585]">{o.architecture}</span>
        <span className="text-[#555]">·</span>
        <span className="text-[11px] text-[#858585]">{o.bitness}-bit</span>
        <span className="text-[#555]">·</span>
        <span className="text-[11px] text-[#858585]">{o.endianness}</span>
        <span className="text-[#555]">·</span>
        <span className="text-[11px] text-[#7ec8a0] font-mono">Entry: {o.entry_point}</span>
      </div>

      {/* ── Main Workspace Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar Dock (Project Files & Symbol Tree) */}
        <SymbolTree
          analysis={analysis}
          activeTab={activeTab}
          onNavigate={setActiveTab}
          onFunctionClick={handleFunctionClick}
          onSectionClick={handleSectionClick}
          onSelectDecompiledFile={setSelectedDecompiledFile}
        />

        {/* Vertical divider */}
        <div className="w-px bg-dark-600 shrink-0" />

        {/* Content Area + Bottom Drawer */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="h-8 bg-dark-800 border-b border-dark-600 flex items-end overflow-x-auto shrink-0 select-none">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-3.5 h-full text-[12px] shrink-0 border-r border-dark-600 transition-colors font-mono
                  ${activeTab === tab.id
                    ? 'bg-dark-900 text-[#ffffff] font-semibold border-b-2 border-b-accent-blue'
                    : 'bg-dark-800 text-[#858585] hover:text-[#cccccc] hover:bg-sel-hover'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Panel Content */}
          <div className="flex-1 overflow-y-auto overflow-x-auto bg-dark-900">
            {activeTab === 'overview'   && <OverviewPanel analysis={analysis} />}
            {activeTab === 'listing'    && <DisassemblyViewer instructions={analysis.disassembly_preview} functions={analysis.functions} selectedFunction={selectedFn} />}
            {activeTab === 'decompiler' && <DecompilerPanel filename={o.filename} fileId={analysis.file_id} functions={analysis.functions} activeFile={selectedDecompiledFile} />}
            {activeTab === 'datatypes'  && <DataTypeManager dataTypes={analysis.data_types} />}
            {activeTab === 'xrefs'      && <XrefsPanel xrefs={analysis.xrefs} onNavigateAddress={handleNavigateAddress} />}
            {activeTab === 'bookmarks'  && <BookmarksPanel bookmarks={bookmarks} onAddBookmark={handleAddBookmark} onNavigateAddress={handleNavigateAddress} />}
            {activeTab === 'entropy'    && <EntropyVisualizer entropyBlocks={analysis.entropy_blocks} sections={analysis.sections} />}
            {activeTab === 'sections'   && <SectionViewer sections={analysis.sections} />}
            {activeTab === 'hex'        && <HexViewer rawHex={analysis.raw_hex_preview} onSelectOffset={setSelectedOffset} />}
            {activeTab === 'strings'    && <StringsViewer strings={analysis.strings} />}
            {activeTab === 'symbols'    && <ImportsExportsViewer imports={analysis.imports} exports={analysis.exports} />}
            {activeTab === 'headers'    && <HeaderViewer headers={analysis.headers} />}
            {activeTab === 'cfg'        && <ControlFlowGraph selectedFunction={selectedFn} />}
          </div>

          {/* ── Ghidra Bottom Dock (Python Console & Inspector) ── */}
          {bottomDrawer && (
            <div className="h-56 bg-dark-800 border-t border-dark-600 flex flex-col shrink-0">
              <div className="h-6 bg-dark-700 border-b border-dark-600 flex items-center px-3 justify-between select-none">
                <div className="flex gap-4">
                  <button
                    onClick={() => setBottomDrawer('console')}
                    className={`text-[11px] font-bold font-mono ${bottomDrawer === 'console' ? 'text-[#4fc1ff]' : 'text-[#858585] hover:text-white'}`}
                  >
                    Ghidra Python Console
                  </button>
                  <button
                    onClick={() => setBottomDrawer('inspector')}
                    className={`text-[11px] font-bold font-mono ${bottomDrawer === 'inspector' ? 'text-[#c586c0]' : 'text-[#858585] hover:text-white'}`}
                  >
                    Hex Inspector & Patch Studio
                  </button>
                </div>
                <button
                  onClick={() => setBottomDrawer(null)}
                  className="text-[#858585] hover:text-white text-xs px-1"
                >
                  ✕ Close Dock
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                {bottomDrawer === 'console' && <PythonConsole fileId={analysis.file_id} />}
                {bottomDrawer === 'inspector' && (
                  <HexInspector
                    fileId={analysis.file_id}
                    selectedByteOffset={selectedOffset}
                    rawHex={analysis.raw_hex_preview}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Dock (XREFs & Bookmarks) */}
        <RightDock
          xrefs={analysis.xrefs}
          bookmarks={bookmarks}
          onNavigateAddress={handleNavigateAddress}
        />
      </div>

      {/* ── Ghidra Status bar ── */}
      <div className="h-6 bg-accent-blue flex items-center px-4 gap-4 shrink-0 select-none text-[11px] text-white">
        <span className="font-semibold">{o.format}</span>
        <span className="text-white/40">|</span>
        <span>{o.architecture}</span>
        <span className="text-white/40">|</span>
        <span>{o.num_sections} sections</span>
        <span className="text-white/40">|</span>
        <span>{o.num_imports} imports</span>
        <span className="text-white/40">|</span>
        <span>{o.num_exports} exports</span>
        <span className="text-white/40">|</span>
        <span>{(o.file_size / 1024).toFixed(1)} KB</span>
        <div className="ml-auto flex gap-3 font-mono text-[10px]">
          <span className="bg-blue-700/60 px-1.5 py-0.5 rounded">Offset: 0x{selectedOffset.toString(16).padStart(8, '0').toUpperCase()}</span>
          <span className="bg-blue-700/60 px-1.5 py-0.5 rounded">Ghidra Core Connected</span>
        </div>
      </div>

      {/* Search Tool Modal */}
      <SearchModal
        fileId={analysis.file_id}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateAddress={handleNavigateAddress}
      />
    </div>
  );
}

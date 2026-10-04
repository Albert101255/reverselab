import { useState } from 'react';
import type { XrefItem } from '../types/analysis';
import type { BookmarkItem } from './panels/BookmarksPanel';

interface RightDockProps {
  xrefs?: XrefItem[];
  bookmarks?: BookmarkItem[];
  onNavigateAddress?: (addr: string) => void;
}

export function RightDock({ xrefs = [], bookmarks = [], onNavigateAddress }: RightDockProps) {
  const [activeTab, setActiveTab] = useState<'xrefs' | 'bookmarks'>('xrefs');
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div
        onClick={() => setCollapsed(false)}
        className="w-7 bg-dark-800 border-l border-dark-600 flex flex-col items-center py-4 cursor-pointer hover:bg-sel-hover select-none shrink-0"
      >
        <span className="text-[10px] font-bold text-[#4fc1ff] writing-vertical transform rotate-90 whitespace-nowrap">
          Ghidra Xrefs & Bookmarks ◀
        </span>
      </div>
    );
  }

  return (
    <div className="w-72 bg-dark-800 border-l border-dark-600 flex flex-col shrink-0 overflow-hidden font-mono text-[11px] text-[#abb2bf]">
      {/* Header toolbar */}
      <div className="h-7 bg-dark-700 border-b border-dark-600 flex items-center px-2 justify-between shrink-0 select-none">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('xrefs')}
            className={`text-[11px] font-bold ${activeTab === 'xrefs' ? 'text-[#4fc1ff]' : 'text-[#5c6370] hover:text-white'}`}
          >
            XREFs ({xrefs.length})
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`text-[11px] font-bold ${activeTab === 'bookmarks' ? 'text-[#c586c0]' : 'text-[#5c6370] hover:text-white'}`}
          >
            Bookmarks ({bookmarks.length})
          </button>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-[#5c6370] hover:text-white text-xs px-1"
        >
          ▶
        </button>
      </div>

      {/* Dock Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'xrefs' ? (
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-semibold text-[#5c6370] mb-2">
              Cross References (Calls / Data)
            </div>
            {xrefs.map((ref, idx) => (
              <div
                key={idx}
                onClick={() => onNavigateAddress?.(ref.from_addr)}
                className="bg-dark-900 border border-dark-700 p-2 rounded hover:bg-sel-hover cursor-pointer"
              >
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#7ec8a0] font-bold">{ref.from_addr}</span>
                  <span className="text-[#4fc1ff] font-semibold">{ref.type}</span>
                </div>
                <div className="text-[#ce9178] truncate text-[11px] mt-0.5">{ref.target_name}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-semibold text-[#5c6370] mb-2">
              Analyst Bookmarks & Annotations
            </div>
            {bookmarks.map(bm => (
              <div
                key={bm.id}
                onClick={() => onNavigateAddress?.(bm.address)}
                className="bg-dark-900 border border-dark-700 p-2 rounded hover:bg-sel-hover cursor-pointer space-y-1"
              >
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#7ec8a0] font-bold">{bm.address}</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold ${
                    bm.category === 'Vulnerability' ? 'bg-[#5a1d1d] text-[#f44747]' : 'bg-[#094771] text-[#9cdcfe]'
                  }`}>
                    {bm.category}
                  </span>
                </div>
                <div className="text-white text-[11px]">{bm.comment}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

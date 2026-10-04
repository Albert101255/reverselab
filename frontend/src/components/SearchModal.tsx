import { useState } from 'react';
import type { SearchMatch } from '../types/analysis';
import { API_BASE_URL } from '../api';

interface SearchModalProps {
  fileId: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigateAddress?: (offset: string) => void;
}

export function SearchModal({ fileId, isOpen, onClose, onNavigateAddress }: SearchModalProps) {
  const [searchType, setSearchType] = useState<'text' | 'hex' | 'scalar'>('text');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [searching, setSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim() || searching) return;
    setSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId, query, search_type: searchType }),
      });
      const data = await res.json();
      setResults(data.matches || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-xl bg-dark-800 border border-dark-600 rounded-sm shadow-2xl flex flex-col font-mono text-[12px] text-[#cccccc]">
        {/* Header */}
        <div className="bg-dark-700 px-4 py-2 border-b border-dark-600 flex items-center justify-between select-none">
          <span className="font-semibold text-white">Ghidra Search Tool</span>
          <button onClick={onClose} className="text-[#858585] hover:text-white text-lg">×</button>
        </div>

        {/* Search types */}
        <div className="flex border-b border-dark-600 bg-dark-900">
          {[
            { id: 'text', label: 'Text / Strings' },
            { id: 'hex', label: 'Hex Sequence' },
            { id: 'scalar', label: 'Scalars / Constants' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSearchType(t.id as any)}
              className={`flex-1 py-1.5 text-[11px] border-r border-dark-600 ${
                searchType === t.id ? 'bg-dark-800 text-white font-bold border-b-2 border-b-accent-blue' : 'text-[#858585] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              placeholder={
                searchType === 'text' ? 'e.g. admin or /bin/sh' :
                searchType === 'hex' ? 'e.g. 48 89 e5 or 55 48 89' : 'e.g. 0x400000 or 4096'
              }
              className="flex-1 bg-dark-900 border border-dark-600 px-3 py-1.5 text-white rounded focus:border-accent-blue focus:outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-1.5 bg-accent-blue hover:bg-blue-600 text-white rounded font-sans text-[11px] font-semibold"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Results table */}
          <div className="h-48 border border-dark-600 rounded bg-dark-900 overflow-y-auto">
            {results.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-dark-700 text-[#858585] text-[10px] uppercase">
                    <th className="py-1 px-3">Offset</th>
                    <th className="py-1 px-3">Type</th>
                    <th className="py-1 px-3">Matched Data</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((m, idx) => (
                    <tr
                      key={idx}
                      onClick={() => { onNavigateAddress?.(m.offset); onClose(); }}
                      className="border-b border-dark-800 hover:bg-sel-hover cursor-pointer"
                    >
                      <td className="py-1 px-3 text-[#7ec8a0]">{m.offset}</td>
                      <td className="py-1 px-3 text-[#9cdcfe]">{m.type}</td>
                      <td className="py-1 px-3 text-[#ce9178] truncate max-w-xs">{m.match}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex items-center justify-center text-[#666]">
                {searching ? 'Searching memory buffer...' : 'Enter query and press Search'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

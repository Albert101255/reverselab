import { useState } from 'react';

export interface BookmarkItem {
  id: string;
  address: string;
  category: 'Note' | 'Warning' | 'Vulnerability' | 'Analysis' | 'Patch';
  comment: string;
  author: string;
  timestamp: string;
}

interface BookmarksPanelProps {
  bookmarks: BookmarkItem[];
  onAddBookmark: (bm: Omit<BookmarkItem, 'id' | 'timestamp'>) => void;
  onNavigateAddress?: (addr: string) => void;
}

export function BookmarksPanel({ bookmarks, onAddBookmark, onNavigateAddress }: BookmarksPanelProps) {
  const [addr, setAddr] = useState('0x401000');
  const [cat, setCat] = useState<BookmarkItem['category']>('Vulnerability');
  const [comment, setComment] = useState('');
  const [author, setAuthor] = useState('Analyst');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addr.trim() || !comment.trim()) return;
    onAddBookmark({
      address: addr.trim(),
      category: cat,
      comment: comment.trim(),
      author: author.trim() || 'Analyst',
    });
    setComment('');
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 font-mono text-[12px] p-4 text-[#cccccc]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-dark-600 pb-2">
        <span className="text-[13px] font-bold text-[#4fc1ff]">Ghidra Bookmarks & Comments Manager</span>
        <span className="text-[11px] text-[#858585]">{bookmarks.length} bookmarked locations</span>
      </div>

      {/* Add Bookmark Form */}
      <form onSubmit={handleSubmit} className="bg-dark-800 border border-dark-600 rounded p-3 mb-4 space-y-3">
        <div className="text-[11px] font-bold text-[#4ec9b0]">Add New Bookmark / Line Comment</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label className="block text-[10px] text-[#858585]">Address (Hex)</label>
            <input
              type="text"
              value={addr}
              onChange={e => setAddr(e.target.value)}
              className="w-full bg-dark-900 border border-dark-600 px-2 py-1 text-[#7ec8a0] rounded outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#858585]">Category</label>
            <select
              value={cat}
              onChange={e => setCat(e.target.value as any)}
              className="w-full bg-dark-900 border border-dark-600 px-2 py-1 text-[#4fc1ff] rounded outline-none"
            >
              <option value="Vulnerability">⚠️ Vulnerability</option>
              <option value="Warning">⚡ Warning</option>
              <option value="Analysis">🔍 Analysis Note</option>
              <option value="Patch">🛠️ Patch Location</option>
              <option value="Note">📝 Note</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[#858585]">Analyst / Tag</label>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="w-full bg-dark-900 border border-dark-600 px-2 py-1 text-[#cccccc] rounded outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#858585]">Comment</label>
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="e.g. Buffer overflow risk in strcpy"
              className="w-full bg-dark-900 border border-dark-600 px-2 py-1 text-white rounded outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-3 py-1 bg-accent-blue hover:bg-blue-600 text-white rounded font-sans text-[11px] font-semibold"
        >
          Save Bookmark
        </button>
      </form>

      {/* Bookmarks Table */}
      <div className="flex-1 overflow-auto border border-dark-600 rounded bg-dark-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-dark-700 text-[#858585] text-[11px] border-b border-dark-600">
              <th className="py-1.5 px-3">Address</th>
              <th className="py-1.5 px-3">Category</th>
              <th className="py-1.5 px-3">Analyst</th>
              <th className="py-1.5 px-3">Comment / Annotation</th>
              <th className="py-1.5 px-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {bookmarks.length > 0 ? (
              bookmarks.map(bm => (
                <tr
                  key={bm.id}
                  onClick={() => onNavigateAddress?.(bm.address)}
                  className="border-b border-dark-700 hover:bg-sel-hover cursor-pointer"
                >
                  <td className="py-1.5 px-3 text-[#7ec8a0] font-bold">{bm.address}</td>
                  <td className="py-1.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      bm.category === 'Vulnerability' ? 'bg-[#5a1d1d] text-[#f44747]' :
                      bm.category === 'Warning' ? 'bg-[#5a481d] text-[#dcdcaa]' : 'bg-[#094771] text-[#9cdcfe]'
                    }`}>
                      {bm.category}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-[#ce9178]">{bm.author}</td>
                  <td className="py-1.5 px-3 text-white">{bm.comment}</td>
                  <td className="py-1.5 px-3 text-[#858585] text-[10px]">{bm.timestamp}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#666]">
                  No bookmarks created yet. Add comments above to mark interesting memory offsets.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

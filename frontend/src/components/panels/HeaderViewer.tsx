interface HeaderViewerProps {
  headers: Record<string, string | number | boolean | null | undefined>;
}

function groupHeaders(raw: Record<string, unknown>): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};

  const GROUPS: [string, string[]][] = [
    ['DOS Header',  ['e_magic','e_cblp','e_cp','e_crlc','e_cparhdr','e_minalloc','e_maxalloc','e_ss','e_sp','e_lfarlc','e_lfanew']],
    ['NT Headers',  ['signature','machine','number_of_sections','time_date_stamp','size_of_optional_header','characteristics']],
    ['Optional',    ['magic','address_of_entry_point','image_base','section_alignment','file_alignment','size_of_image','size_of_headers','checksum','subsystem','dll_characteristics']],
    ['ELF Header',  ['e_type','e_machine','e_version','e_entry','e_phoff','e_shoff','e_flags','e_ehsize','e_phentsize','e_phnum','e_shentsize','e_shnum','e_shstrndx']],
    ['Mach-O',      ['magic','cputype','cpusubtype','filetype','ncmds','sizeofcmds','flags']],
  ];

  const placed = new Set<string>();

  GROUPS.forEach(([groupName, keys]) => {
    const matched: Record<string, unknown> = {};
    keys.forEach(k => {
      // match case-insensitive, or snake_case/camelCase variants
      const matchKey = Object.keys(raw).find(rk => rk.toLowerCase().replace(/[^a-z0-9]/g,'') === k.replace(/[^a-z0-9]/g,''));
      if (matchKey !== undefined) {
        matched[matchKey] = raw[matchKey];
        placed.add(matchKey);
      }
    });
    if (Object.keys(matched).length > 0) out[groupName] = matched;
  });

  // Everything else in "Other"
  const other: Record<string, unknown> = {};
  Object.keys(raw).forEach(k => {
    if (!placed.has(k)) other[k] = raw[k];
  });
  if (Object.keys(other).length > 0) out['Other Fields'] = other;

  return out;
}

function formatValue(v: unknown): { display: string; mono: boolean } {
  if (v === null || v === undefined) return { display: '—', mono: false };
  if (typeof v === 'boolean') return { display: v ? '✓ true' : '✗ false', mono: false };
  if (typeof v === 'number') {
    if (Number.isInteger(v) && v > 9) {
      return { display: `${v}  (0x${v.toString(16).toUpperCase()})`, mono: true };
    }
    return { display: String(v), mono: true };
  }
  return { display: String(v), mono: true };
}

export function HeaderViewer({ headers }: HeaderViewerProps) {
  const groups = groupHeaders(headers as Record<string, unknown>);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Panel title */}
      <div className="px-4 py-2.5 border-b border-dark-700 bg-dark-800 shrink-0 sticky top-0 z-10">
        <span className="text-[11px] font-semibold text-[#cccccc]">Binary Structure</span>
        <span className="text-[11px] text-[#666] ml-2">— raw header fields</span>
      </div>

      {Object.entries(groups).map(([groupName, fields]) => (
        <div key={groupName} className="mb-0">
          {/* Group header */}
          <div className="px-4 py-1.5 bg-dark-800 border-b border-dark-600 border-t border-t-dark-700 sticky top-8 z-10">
            <span className="text-[10px] uppercase tracking-widest text-[#666] font-semibold">{groupName}</span>
          </div>

          {/* Field rows */}
          {Object.entries(fields).map(([key, value]) => {
            const { display, mono } = formatValue(value);
            return (
              <div key={key} className="flex items-start px-4 py-1.5 border-b border-dark-700/40 hover:bg-sel-hover">
                <span className="w-56 text-[11px] text-[#858585] shrink-0 select-none">{key}</span>
                <span className={`flex-1 text-[12px] text-[#cccccc] ${mono ? 'font-mono' : ''}`}>{display}</span>
              </div>
            );
          })}
        </div>
      ))}

      {Object.keys(groups).length === 0 && (
        <div className="px-4 py-8 text-[#555] text-center">No header fields available.</div>
      )}
    </div>
  );
}

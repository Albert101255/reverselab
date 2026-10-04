import type { AnalysisResult } from '../../types/analysis';

interface OverviewPanelProps {
  analysis: AnalysisResult;
}

function Row({ k, v, mono = false }: { k: string; v: string | number; mono?: boolean }) {
  return (
    <tr className="border-b border-dark-700 hover:bg-sel-hover">
      <td className="py-1.5 px-4 text-[11px] text-[#858585] w-52 align-top select-none">{k}</td>
      <td className={`py-1.5 px-4 text-[12px] text-[#cccccc] ${mono ? 'font-mono' : ''}`}>{v}</td>
    </tr>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={2} className="pt-4 pb-1 px-4">
        <div className="text-[10px] uppercase tracking-widest text-[#666] font-semibold border-b border-dark-700 pb-1">{label}</div>
      </td>
    </tr>
  );
}

export function OverviewPanel({ analysis }: OverviewPanelProps) {
  const o = analysis.overview;

  const formatSize = (bytes: number) => {
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="p-0">
      {/* Panel title */}
      <div className="px-4 py-2.5 border-b border-dark-700 bg-dark-800">
        <span className="text-[11px] font-semibold text-[#cccccc]">Program Information</span>
      </div>

      <div className="flex">
        {/* Left column */}
        <table className="flex-1 border-r border-dark-700 self-start">
          <tbody>
            <SectionHeading label="File" />
            <Row k="Name"       v={o.filename}              />
            <Row k="Size"       v={formatSize(o.file_size)} />
            <Row k="Format"     v={o.format}                />
            <Row k="MD5"        v={o.md5}    mono           />
            <Row k="SHA-1"      v={o.sha1}   mono           />
            <Row k="SHA-256"    v={o.sha256} mono           />

            <SectionHeading label="Architecture" />
            <Row k="CPU"        v={o.architecture}        />
            <Row k="Bitness"    v={`${o.bitness}-bit`}    />
            <Row k="Endianness" v={o.endianness}          />
            <Row k="Entry Point" v={o.entry_point} mono   />
          </tbody>
        </table>

        {/* Right column */}
        <table className="flex-1 self-start">
          <tbody>
            <SectionHeading label="Summary" />
            <Row k="Sections"  v={o.num_sections}  />
            <Row k="Imports"   v={o.num_imports}   />
            <Row k="Exports"   v={o.num_exports}   />
            <Row k="Strings"   v={analysis.strings.length} />
            <Row k="Functions" v={analysis.functions.length} />

            <SectionHeading label="Flags" />
            <Row k="Stripped"       v={o.is_stripped       ? '✓ Yes' : '✗ No'} />
            <Row k="Packed / Obfusc" v={o.is_packed        ? '✓ Likely' : '✗ No'} />
            <Row k="Debug Info"     v={o.has_debug_info    ? '✓ Present' : '✗ Absent'} />
            <Row k="Relocatable"    v={o.is_relocatable    ? '✓ Yes' : '✗ No'} />
            <Row k="Position-Indep" v={o.is_pie            ? '✓ Yes (PIE)' : '✗ No'} />

            {o.packer_hint && (
              <>
                <SectionHeading label="Packer" />
                <Row k="Hint" v={o.packer_hint} />
              </>
            )}

            {o.linker_info && (
              <>
                <SectionHeading label="Linker" />
                <Row k="Info" v={o.linker_info} />
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

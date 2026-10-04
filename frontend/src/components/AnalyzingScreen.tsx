import { useEffect, useRef, useState } from 'react';

interface AnalyzingScreenProps {
  filename: string;
}

const STAGES = [
  { ms: 400,  text: 'Opening file stream…' },
  { ms: 500,  text: 'Reading raw bytes into buffer…' },
  { ms: 500,  text: 'Scanning magic bytes for format identification…' },
  { ms: 600,  text: 'Detected file format — parsing primary header…' },
  { ms: 700,  text: 'Resolving target architecture and bitness…' },
  { ms: 700,  text: 'Iterating section / segment table…' },
  { ms: 600,  text: 'Extracting import descriptor table…' },
  { ms: 600,  text: 'Extracting export address table…' },
  { ms: 500,  text: 'Scanning .rodata and .data for string references…' },
  { ms: 900,  text: 'Running Capstone disassembler on code sections…' },
  { ms: 600,  text: 'Computing section entropy (packed / encrypted regions)…' },
  { ms: 500,  text: 'Building cross-reference call graph…' },
  { ms: 400,  text: 'Generating hex dump preview (first 4 KB)…' },
  { ms: 350,  text: 'Serialising analysis result…' },
  { ms: 300,  text: 'Done.' },
];

export function AnalyzingScreen({ filename }: AnalyzingScreenProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    STAGES.forEach((stage, i) => {
      const t = setTimeout(() => {
        const now = new Date();
        const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        setLines(prev => [...prev, `[${ts}]  ${stage.text}`]);
        setProgress(Math.round(((i + 1) / STAGES.length) * 98));
      }, elapsed);
      timers.push(t);
      elapsed += stage.ms;
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="h-screen bg-dark-900 flex flex-col">
      {/* Title bar */}
      <div className="h-7 bg-dark-700 border-b border-dark-600 flex items-center px-4 shrink-0">
        <span className="text-[12px] text-[#cccccc]">ReverseLab — Analyzing</span>
      </div>

      {/* Dialog box */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-xl bg-dark-800 border border-dark-600 rounded-sm shadow-lg">
          {/* Header */}
          <div className="bg-dark-700 border-b border-dark-600 px-4 py-2">
            <div className="text-[12px] font-semibold text-[#cccccc]">Auto Analyze</div>
          </div>

          {/* File info */}
          <div className="px-4 pt-4 pb-2 border-b border-dark-600">
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-[#858585]">File:</span>
              <span className="font-mono text-[#9cdcfe]">{filename}</span>
            </div>
          </div>

          {/* Log output */}
          <div className="h-52 overflow-y-auto px-4 py-2 font-mono text-[11px] bg-dark-900 border-b border-dark-600">
            {lines.map((line, i) => (
              <div key={i} className="leading-5">
                <span className="text-[#6a9955]">{line.slice(0, 10)}</span>
                <span className="text-[#cccccc]">{line.slice(10)}</span>
              </div>
            ))}
            {lines.length > 0 && lines[lines.length - 1] !== '[Done.]' && (
              <div className="leading-5 text-[#858585]">
                <span className="inline-block w-2 h-3 bg-[#858585] animate-pulse align-middle ml-0.5" />
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Progress bar */}
          <div className="px-4 py-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] text-[#858585]">Progress</span>
              <span className="text-[11px] font-mono text-[#858585]">{progress}%</span>
            </div>
            <div className="h-4 bg-dark-700 border border-dark-600 rounded-sm overflow-hidden">
              <div
                className="h-full bg-accent-blue transition-all duration-300 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="h-6 bg-accent-blue flex items-center px-4 shrink-0">
        <span className="text-[11px] text-white">Analyzing {filename}…</span>
      </div>
    </div>
  );
}

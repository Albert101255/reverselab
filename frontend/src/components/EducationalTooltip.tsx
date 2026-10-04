import React from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  term: string;
  explanation: string;
  beginnerMode: boolean;
  children: React.ReactNode;
}

export const EducationalTooltip: React.FC<TooltipProps> = ({ term, explanation, beginnerMode, children }) => {
  if (!beginnerMode) return <>{children}</>;

  return (
    <div className="relative group inline-flex items-center gap-1 cursor-help">
      {children}
      <HelpCircle className="w-3.5 h-3.5 text-accent-cyan opacity-80 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2.5 bg-dark-800 text-xs text-gray-200 rounded-lg border border-accent-cyan/30 shadow-xl shadow-cyan-950/40 z-50 pointer-events-none">
        <div className="font-semibold text-accent-cyan mb-1">{term}</div>
        <div>{explanation}</div>
      </div>
    </div>
  );
};

import type { FunctionItem } from '../../types/analysis';

interface Props {
  functions: FunctionItem[];
  onSelectFunction: (fn: FunctionItem) => void;
}

export const FunctionViewer = ({ functions, onSelectFunction }: Props) => {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-100 mb-1">Discovered Subroutines & Functions</h2>
        <p className="text-xs text-gray-400">Identified function entry points and code block sizes</p>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-dark-900/80 text-gray-400 font-mono border-b border-dark-700">
            <tr>
              <th className="p-3">Function Name</th>
              <th className="p-3">Entry Address</th>
              <th className="p-3">Code Size</th>
              <th className="p-3">API Calls</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700 font-mono">
            {functions.map((fn, i) => (
              <tr key={i} className="hover:bg-dark-700/50 transition-colors">
                <td className="p-3 font-semibold text-accent-cyan">{fn.name}</td>
                <td className="p-3 text-emerald-400">{fn.address}</td>
                <td className="p-3 text-gray-300">{fn.size} B</td>
                <td className="p-3 text-gray-400 font-sans">{fn.calls.join(', ') || 'None'}</td>
                <td className="p-3">
                  <button
                    onClick={() => onSelectFunction(fn)}
                    className="px-2.5 py-1 rounded bg-accent-blue/20 text-accent-cyan border border-accent-blue/40 text-[11px] font-sans hover:bg-accent-blue/30"
                  >
                    Disassemble
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

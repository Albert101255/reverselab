import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { Workspace } from './components/Workspace';
import { AnalyzingScreen } from './components/AnalyzingScreen';
import type { AnalysisResult } from './types/analysis';
import { API_BASE_URL } from './api';

export function App() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/files`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let detailMsg = `Analysis server error (${response.status})`;
        try {
          const errData = await response.json();
          if (errData.detail) detailMsg = errData.detail;
        } catch (_) {}
        throw new Error(detailMsg);
      }

      const data: AnalysisResult = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'We could not analyze this file. Please verify backend API status.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setAnalysisResult(null);
    setError(null);
  };

  if (analyzing) {
    return <AnalyzingScreen filename={file?.name ?? 'unknown'} />;
  }

  if (error) {
    return (
      <div className="h-screen bg-dark-900 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-dark-800 border border-dark-600 rounded-sm shadow-lg">
          <div className="bg-dark-700 border-b border-dark-600 px-4 py-2">
            <span className="text-[12px] font-semibold text-[#cccccc]">Analysis Error</span>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-red-400 text-lg leading-none mt-0.5">✕</span>
              <p className="text-[12px] text-[#cccccc] leading-relaxed">{error}</p>
            </div>
            <div className="border-t border-dark-600 pt-4 flex justify-end">
              <button
                onClick={handleReset}
                className="px-4 py-1.5 text-[12px] bg-dark-700 border border-dark-500 text-[#cccccc] hover:bg-dark-600 transition-colors rounded-sm"
              >
                Back to Open File
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (analysisResult) {
    return <Workspace analysis={analysisResult} onNewFile={handleReset} />;
  }

  return <HomeScreen onFileSelected={handleFileSelected} />;
}

export default App;

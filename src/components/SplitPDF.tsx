'use client';

import { useState } from 'react';
import { Scissors, AlertCircle } from 'lucide-react';
import { splitPDF, splitPDFIntoPages, downloadPDF } from '@/lib/pdf-operations';

interface SplitPDFProps {
  pdfBuffer: ArrayBuffer | null;
  pageCount: number;
  fileName: string;
}

export default function SplitPDF({ pdfBuffer, pageCount, fileName }: SplitPDFProps) {
  const [mode, setMode] = useState<'range' | 'all'>('range');
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(pageCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (startPage < 1 || startPage > pageCount) {
      setError(`Start page must be between 1 and ${pageCount}`);
      return false;
    }
    if (endPage < startPage || endPage > pageCount) {
      setError(`End page must be between ${startPage} and ${pageCount}`);
      return false;
    }
    setError('');
    return true;
  };

  const handleSplit = async () => {
    if (!pdfBuffer) return;
    if (mode === 'range' && !validate()) return;
    setLoading(true);

    try {
      if (mode === 'all') {
        const pages = await splitPDFIntoPages(pdfBuffer);
        for (let i = 0; i < pages.length; i++) {
          const baseName = fileName.replace('.pdf', '');
          downloadPDF(pages[i], `${baseName}_page${i + 1}.pdf`);
          // Small delay between downloads
          await new Promise((r) => setTimeout(r, 300));
        }
      } else {
        const result = await splitPDF(pdfBuffer, startPage, endPage);
        const baseName = fileName.replace('.pdf', '');
        downloadPDF(result, `${baseName}_pages${startPage}-${endPage}.pdf`);
      }
    } catch (err) {
      console.error('Split failed:', err);
      setError('Failed to split PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!pdfBuffer) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Scissors size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Open a PDF first to use the split tool</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['range', 'all'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
              mode === m
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {m === 'range' ? 'Extract Range' : 'Split All Pages'}
          </button>
        ))}
      </div>

      {mode === 'range' ? (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Extract pages {startPage}–{endPage} from your {pageCount}-page PDF
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Page</label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={startPage}
                onChange={(e) => { setStartPage(Number(e.target.value)); setError(''); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Page</label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={endPage}
                onChange={(e) => { setEndPage(Number(e.target.value)); setError(''); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          This will download <strong>{pageCount} separate PDF files</strong>, one for each page.
          Your browser may ask permission for multiple downloads.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <button
        onClick={handleSplit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
      >
        <Scissors size={16} />
        {loading ? 'Processing...' : mode === 'range' ? 'Extract Pages' : 'Split into Pages'}
      </button>
    </div>
  );
}

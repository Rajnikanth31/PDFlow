'use client';

import { useState } from 'react';
import { FileText, Copy, Check, Download, RefreshCw } from 'lucide-react';

interface OCRToolProps {
  pdfBuffer: ArrayBuffer | null;
  currentPage: number;
  fileName: string;
}

export default function OCRTool({ pdfBuffer, currentPage, fileName }: OCRToolProps) {
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scope, setScope] = useState<'current' | 'all'>('current');

  const handleExtract = async () => {
    if (!pdfBuffer) return;
    setLoading(true);
    setCopied(false);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const task = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
      const pdf = await task.promise;
      let fullText = '';

      const start = scope === 'current' ? currentPage : 1;
      const end = scope === 'current' ? currentPage : pdf.numPages;

      for (let i = start; i <= end; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageText = textContent.items.map((it: any) => it.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }

      setExtractedText(fullText.trim());
    } catch (err) {
      console.error(err);
      alert('Failed to extract text from document.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace('.pdf', '')}_extracted_text.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!pdfBuffer) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">Open a PDF first to extract text</p>
      </div>
    );
  }

  const wordCount = extractedText ? extractedText.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setScope('current')}
          className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
            scope === 'current'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Page {currentPage} Only
        </button>
        <button
          onClick={() => setScope('all')}
          className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
            scope === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Pages
        </button>
      </div>

      <button
        onClick={handleExtract}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold shadow-sm"
      >
        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Extracting Text...' : `Extract Text (${scope === 'current' ? `Page ${currentPage}` : 'All Pages'})`}
      </button>

      {extractedText && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{wordCount} Words Found</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
              >
                <Download size={12} /> .TXT
              </button>
            </div>
          </div>

          <textarea
            readOnly
            value={extractedText}
            rows={10}
            className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none resize-none leading-relaxed text-gray-700"
          />
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Minimize2, Check, ArrowDown, FileText } from 'lucide-react';
import { downloadPDF } from '@/lib/pdf-operations';

interface CompressPDFProps {
  pdfBuffer: ArrayBuffer | null;
  fileName: string;
  onPDFUpdate: (buffer: ArrayBuffer) => void;
}

export default function CompressPDF({ pdfBuffer, fileName, onPDFUpdate }: CompressPDFProps) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{
    originalSize: number;
    compressedSize: number;
    savedPercent: number;
  } | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleCompress = async () => {
    if (!pdfBuffer) return;
    setLoading(true);
    setStats(null);

    try {
      const formData = new FormData();
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      formData.append('file', blob, fileName);

      const res = await fetch('/api/pdf/compress', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Compression failed');

      const origSize = Number(res.headers.get('X-Original-Size')) || pdfBuffer.byteLength;
      const compSize = Number(res.headers.get('X-Compressed-Size')) || (await res.clone().arrayBuffer()).byteLength;
      const buf = await res.arrayBuffer();

      const savedPercent = Math.max(0, Math.round(((origSize - compSize) / origSize) * 100));

      setStats({
        originalSize: origSize,
        compressedSize: compSize,
        savedPercent,
      });

      onPDFUpdate(buf);
    } catch (err) {
      console.error(err);
      alert('Failed to compress PDF. The document might already be heavily compressed.');
    } finally {
      setLoading(false);
    }
  };

  if (!pdfBuffer) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Minimize2 size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Open a PDF first to compress it</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-700">
        <strong>Smart Optimization:</strong> Compresses internal streams, generates compact object streams, and linearizes for lightning-fast loading without losing visual clarity.
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600 truncate">
          <FileText size={16} className="text-blue-500 shrink-0" />
          <span className="truncate">{fileName}</span>
        </div>
        <span className="text-xs font-semibold text-gray-700 shrink-0">
          {formatSize(pdfBuffer.byteLength)}
        </span>
      </div>

      {stats && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
            <Check size={16} /> Compression Successful!
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-green-100 text-xs">
            <div>
              <p className="text-gray-400">Before</p>
              <p className="font-bold text-gray-700">{formatSize(stats.originalSize)}</p>
            </div>
            <div>
              <p className="text-gray-400">After</p>
              <p className="font-bold text-green-700">{formatSize(stats.compressedSize)}</p>
            </div>
            <div>
              <p className="text-gray-400">Reduction</p>
              <p className="font-bold text-green-600 flex items-center justify-center gap-0.5">
                <ArrowDown size={12} /> {stats.savedPercent}%
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleCompress}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
      >
        <Minimize2 size={16} />
        {loading ? 'Compressing...' : 'Compress PDF'}
      </button>

      {stats && (
        <button
          onClick={() => {
            if (pdfBuffer) {
              downloadPDF(new Uint8Array(pdfBuffer), `compressed_${fileName}`);
            }
          }}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-xs font-medium"
        >
          Download Compressed PDF
        </button>
      )}
    </div>
  );
}

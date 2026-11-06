'use client';

import { useState } from 'react';
import { Type, Image as ImageIcon, Droplets, RotateCw, Trash2 } from 'lucide-react';
import {
  addTextToPDF,
  addWatermark,
  rotatePDF,
  deletePagesFromPDF,
  downloadPDF,
} from '@/lib/pdf-operations';

interface PDFToolsProps {
  pdfBuffer: ArrayBuffer | null;
  pageCount: number;
  currentPage: number;
  fileName: string;
  onPDFUpdate: (buffer: ArrayBuffer) => void;
}

export default function PDFTools({
  pdfBuffer,
  pageCount,
  currentPage,
  fileName,
  onPDFUpdate,
}: PDFToolsProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'watermark' | 'rotate' | 'delete'>('text');
  const [loading, setLoading] = useState(false);

  // Text tool state
  const [textContent, setTextContent] = useState('');
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(50);
  const [fontSize, setFontSize] = useState(14);
  const [textColor, setTextColor] = useState('#000000');

  // Watermark state
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);

  // Rotate state
  const [rotateAngle, setRotateAngle] = useState<90 | 180 | 270>(90);
  const [rotateTarget, setRotateTarget] = useState<'current' | 'all'>('current');

  // Delete state
  const [pagesToDelete, setPagesToDelete] = useState('');

  const withBuffer = async (fn: (buf: ArrayBuffer) => Promise<Uint8Array>) => {
    if (!pdfBuffer) return;
    setLoading(true);
    try {
      const result = await fn(pdfBuffer);
      const newBuffer = result.buffer as ArrayBuffer;
      onPDFUpdate(newBuffer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddText = () => {
    if (!textContent.trim()) return;
    const hex = textColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    withBuffer((buf) =>
      addTextToPDF(buf, textContent, currentPage - 1, textX, textY, fontSize, { r, g, b })
    );
  };

  const handleWatermark = () => {
    if (!watermarkText.trim()) return;
    withBuffer((buf) => addWatermark(buf, watermarkText, watermarkOpacity));
  };

  const handleRotate = () => {
    const indices =
      rotateTarget === 'all'
        ? Array.from({ length: pageCount }, (_, i) => i)
        : [currentPage - 1];
    withBuffer((buf) => rotatePDF(buf, indices, rotateAngle));
  };

  const handleDelete = () => {
    if (!pagesToDelete.trim()) return;
    const indices = pagesToDelete
      .split(',')
      .map((s) => parseInt(s.trim()) - 1)
      .filter((n) => !isNaN(n) && n >= 0 && n < pageCount);
    if (indices.length === 0) return;
    if (indices.length >= pageCount) {
      alert("You can't delete all pages!");
      return;
    }
    withBuffer((buf) => deletePagesFromPDF(buf, indices));
  };

  const tabs = [
    { key: 'text', icon: Type, label: 'Add Text' },
    { key: 'watermark', icon: Droplets, label: 'Watermark' },
    { key: 'rotate', icon: RotateCw, label: 'Rotate' },
    { key: 'delete', icon: Trash2, label: 'Delete Pages' },
  ] as const;

  if (!pdfBuffer) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">Open a PDF to use editing tools</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1.5">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs rounded-lg font-medium transition-colors ${
              activeTab === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {activeTab === 'text' && (
          <>
            <p className="text-xs text-gray-500">Adding to page {currentPage}</p>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter text to add..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">X Position</label>
                <input type="number" value={textX} onChange={(e) => setTextX(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Y Position</label>
                <input type="number" value={textY} onChange={(e) => setTextY(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                <input type="number" value={fontSize} min={6} max={72} onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Color</label>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                  className="w-full h-9 border border-gray-200 rounded-lg cursor-pointer" />
              </div>
            </div>
            <button onClick={handleAddText} disabled={loading || !textContent.trim()}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors">
              {loading ? 'Adding...' : 'Add Text'}
            </button>
          </>
        )}

        {activeTab === 'watermark' && (
          <>
            <input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Watermark text (e.g. CONFIDENTIAL)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Opacity: {Math.round(watermarkOpacity * 100)}%
              </label>
              <input type="range" min={0.05} max={0.8} step={0.05} value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                className="w-full accent-blue-600" />
            </div>
            <button onClick={handleWatermark} disabled={loading || !watermarkText.trim()}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors">
              {loading ? 'Applying...' : 'Apply Watermark'}
            </button>
          </>
        )}

        {activeTab === 'rotate' && (
          <>
            <div className="flex gap-2">
              {([90, 180, 270] as const).map((deg) => (
                <button key={deg} onClick={() => setRotateAngle(deg)}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                    rotateAngle === deg ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {deg}°
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {(['current', 'all'] as const).map((t) => (
                <button key={t} onClick={() => setRotateTarget(t)}
                  className={`flex-1 py-2 text-xs rounded-lg font-medium transition-colors ${
                    rotateTarget === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {t === 'current' ? `Page ${currentPage} only` : 'All Pages'}
                </button>
              ))}
            </div>
            <button onClick={handleRotate} disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors">
              {loading ? 'Rotating...' : 'Rotate Pages'}
            </button>
          </>
        )}

        {activeTab === 'delete' && (
          <>
            <p className="text-xs text-gray-500">Your PDF has {pageCount} pages</p>
            <input value={pagesToDelete} onChange={(e) => setPagesToDelete(e.target.value)}
              placeholder="e.g. 2, 4, 7"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-400">Enter page numbers separated by commas</p>
            <button onClick={handleDelete} disabled={loading || !pagesToDelete.trim()}
              className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors">
              {loading ? 'Deleting...' : 'Delete Pages'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

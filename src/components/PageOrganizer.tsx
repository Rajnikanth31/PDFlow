'use client';

import { useState, useEffect, useRef } from 'react';
import { RotateCw, Trash2, Copy, GripVertical, Check, RefreshCw } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';

interface PageItem {
  id: string;
  originalIndex: number;
  rotation: number;
  thumbnailUrl: string;
}

interface PageOrganizerProps {
  pdfBuffer: ArrayBuffer | null;
  onPDFUpdate: (buffer: ArrayBuffer) => void;
}

export default function PageOrganizer({ pdfBuffer, onPDFUpdate }: PageOrganizerProps) {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Generate page thumbnails
  useEffect(() => {
    if (!pdfBuffer) {
      setPages([]);
      return;
    }

    let cancelled = false;

    const renderThumbnails = async () => {
      setLoading(true);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const task = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
        const pdf = await task.promise;
        const pageItems: PageItem[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.25 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
            pageItems.push({
              id: `${i}-${Math.random().toString(36).slice(2)}`,
              originalIndex: i - 1,
              rotation: 0,
              thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8),
            });
          }
        }

        if (!cancelled) {
          setPages(pageItems);
        }
      } catch (err) {
        console.error('Failed to generate thumbnails:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    renderThumbnails();

    return () => {
      cancelled = true;
    };
  }, [pdfBuffer]);

  const handleRotate = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleDelete = (index: number) => {
    if (pages.length <= 1) {
      alert("A PDF must contain at least one page.");
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicate = (index: number) => {
    setPages((prev) => {
      const copy = [...prev];
      const item = { ...prev[index], id: Math.random().toString(36).slice(2) };
      copy.splice(index + 1, 0, item);
      return copy;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === toIndex) return;

    setPages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleApplyChanges = async () => {
    if (!pdfBuffer || pages.length === 0) return;
    setApplying(true);
    try {
      const sourceDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      for (const p of pages) {
        const [copiedPage] = await newDoc.copyPages(sourceDoc, [p.originalIndex]);
        if (p.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRotation + p.rotation) % 360));
        }
        newDoc.addPage(copiedPage);
      }

      const savedBytes = await newDoc.save();
      onPDFUpdate(savedBytes.buffer as ArrayBuffer);
      alert('Page organization applied! Document updated in editor.');
    } catch (err) {
      console.error(err);
      alert('Failed to apply page changes.');
    } finally {
      setApplying(false);
    }
  };

  if (!pdfBuffer) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">Open a PDF first to organize pages</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Drag to reorder • Rotate • Duplicate • Delete
        </p>
        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {pages.length} Pages
        </span>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400 text-xs">
          <RefreshCw size={20} className="animate-spin text-blue-500" />
          Loading page thumbnails...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {pages.map((p, index) => (
            <div
              key={p.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragLeave={() => setDragOverIndex(null)}
              className={`group relative rounded-xl border bg-white p-2 flex flex-col items-center transition-all cursor-grab shadow-sm ${
                dragOverIndex === index
                  ? 'border-blue-500 ring-2 ring-blue-100 scale-105'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Badge & Drag handle */}
              <div className="w-full flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                  #{index + 1}
                </span>
                <GripVertical size={12} className="text-gray-300" />
              </div>

              {/* Thumbnail */}
              <div className="w-full aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
                <img
                  src={p.thumbnailUrl}
                  alt={`Page ${index + 1}`}
                  style={{ transform: `rotate(${p.rotation}deg)` }}
                  className="max-h-full max-w-full object-contain transition-transform duration-200"
                />
              </div>

              {/* Controls */}
              <div className="w-full flex items-center justify-center gap-1.5 mt-2 pt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleRotate(index)}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Rotate 90°"
                >
                  <RotateCw size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicate(index)}
                  className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                  title="Duplicate page"
                >
                  <Copy size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete page"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleApplyChanges}
        disabled={applying || loading || pages.length === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold shadow-sm"
      >
        <Check size={14} />
        {applying ? 'Applying Changes...' : 'Apply Organization to Document'}
      </button>
    </div>
  );
}

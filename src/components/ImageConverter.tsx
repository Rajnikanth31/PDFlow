'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, FileText, Download, Upload, ArrowRight, X } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { downloadPDF } from '@/lib/pdf-operations';

interface ImageConverterProps {
  pdfBuffer: ArrayBuffer | null;
  fileName: string;
  onPDFUpdate: (buffer: ArrayBuffer) => void;
}

export default function ImageConverter({
  pdfBuffer,
  fileName,
  onPDFUpdate,
}: ImageConverterProps) {
  const [tab, setTab] = useState<'imgToPdf' | 'pdfToImg'>('imgToPdf');
  const [imageFiles, setImageFiles] = useState<{ file: File; id: string; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportingProgress, setExportingProgress] = useState<string | null>(null);

  // Dropzone for images
  const onDrop = (accepted: File[]) => {
    const valid = accepted.filter((f) => f.type.startsWith('image/'));
    const mapped = valid.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2),
      preview: URL.createObjectURL(file),
    }));
    setImageFiles((prev) => [...prev, ...mapped]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: true,
  });

  const removeImage = (id: string) => {
    setImageFiles((prev) => prev.filter((img) => img.id !== id));
  };

  // Convert Images to PDF
  const handleImagesToPdf = async () => {
    if (imageFiles.length === 0) return;
    setLoading(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of imageFiles) {
        const buffer = await item.file.arrayBuffer();
        let image;
        if (item.file.type === 'image/png') {
          image = await pdfDoc.embedPng(buffer);
        } else {
          image = await pdfDoc.embedJpg(buffer);
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      onPDFUpdate(pdfBytes.buffer as ArrayBuffer);
      alert('Images converted to PDF and loaded into editor!');
    } catch (err) {
      console.error(err);
      alert('Failed to convert images to PDF. Please ensure all images are valid JPG or PNG files.');
    } finally {
      setLoading(false);
    }
  };

  // Convert PDF to Images
  const handlePdfToImages = async () => {
    if (!pdfBuffer) return;
    setLoading(true);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const task = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
      const pdf = await task.promise;
      const baseName = fileName.replace('.pdf', '');

      for (let i = 1; i <= pdf.numPages; i++) {
        setExportingProgress(`Rendering page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High-DPI 2x scale
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
          const dataUrl = canvas.toDataURL('image/png');

          // Download image
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `${baseName}_page_${i}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          await new Promise((r) => setTimeout(r, 250));
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to export PDF pages as images.');
    } finally {
      setLoading(false);
      setExportingProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab('imgToPdf')}
          className={`flex-1 py-2 text-xs rounded-lg font-medium transition-colors ${
            tab === 'imgToPdf'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Images to PDF
        </button>
        <button
          onClick={() => setTab('pdfToImg')}
          className={`flex-1 py-2 text-xs rounded-lg font-medium transition-colors ${
            tab === 'pdfToImg'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          PDF to Images
        </button>
      </div>

      {tab === 'imgToPdf' ? (
        <div className="space-y-3">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-2 text-gray-400" size={24} />
            <p className="text-xs font-medium text-gray-600">
              Drag & drop photos or click to select
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WebP supported</p>
          </div>

          {imageFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{imageFiles.length} Images Selected</span>
                <button
                  onClick={() => setImageFiles([])}
                  className="text-red-500 hover:underline text-[11px]"
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {imageFiles.map((img, index) => (
                  <div
                    key={img.id}
                    className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-50 flex items-center justify-center"
                  >
                    <img
                      src={img.preview}
                      alt={img.file.name}
                      className="max-h-full max-w-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1 rounded">
                      {index + 1}
                    </span>
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleImagesToPdf}
            disabled={loading || imageFiles.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold shadow-sm"
          >
            <FileText size={14} />
            {loading ? 'Converting...' : `Convert ${imageFiles.length} Images to PDF`}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
            <ImageIcon size={32} className="mx-auto mb-2 text-blue-500 opacity-80" />
            <h4 className="text-xs font-semibold text-gray-800 mb-1">
              Export PDF Pages as PNG Images
            </h4>
            <p className="text-[11px] text-gray-500">
              Renders all pages in crystal clear 2x resolution and downloads them as images.
            </p>
          </div>

          {exportingProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
              {exportingProgress}
            </div>
          )}

          <button
            onClick={handlePdfToImages}
            disabled={!pdfBuffer || loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold shadow-sm"
          >
            <Download size={14} />
            {loading ? 'Exporting Images...' : 'Export Pages as PNG'}
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, X, GripVertical, Merge } from 'lucide-react';
import { mergePDFs, downloadPDF } from '@/lib/pdf-operations';

export default function MergePDF() {
  const [files, setFiles] = useState<{ file: File; id: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles = accepted
      .filter((f) => f.type === 'application/pdf')
      .map((file) => ({ file, id: Math.random().toString(36).slice(2) }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setLoading(true);
    try {
      const buffers = await Promise.all(files.map((f) => f.file.arrayBuffer()));
      const merged = await mergePDFs(buffers);
      downloadPDF(merged, 'merged.pdf');
    } catch (err) {
      console.error('Merge failed:', err);
      alert('Failed to merge PDFs. Make sure the files are valid and not password protected.');
    } finally {
      setLoading(false);
    }
  };

  // Drag-to-reorder
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (fromIndex === toIndex) return;
    const updated = [...files];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFiles(updated);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-5">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-3 text-gray-400" size={28} />
        <p className="text-sm font-medium text-gray-600">
          {isDragActive ? 'Drop PDFs here...' : 'Drag & drop PDF files here'}
        </p>
        <p className="text-xs text-gray-400 mt-1">or click to browse — multiple files supported</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Merge Order — drag to reorder
          </p>
          {files.map(({ file, id }, index) => (
            <div
              key={id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragLeave={() => setDragOverIndex(null)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab ${
                dragOverIndex === index
                  ? 'border-blue-400 bg-blue-50 scale-[1.01]'
                  : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold flex-shrink-0">
                {index + 1}
              </span>
              <FileText size={16} className="text-blue-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={() => removeFile(id)}
                className="text-gray-300 hover:text-red-400 flex-shrink-0 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleMerge}
        disabled={files.length < 2 || loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
      >
        <Merge size={16} />
        {loading ? 'Merging...' : `Merge ${files.length} PDFs`}
      </button>

      {files.length < 2 && files.length > 0 && (
        <p className="text-xs text-center text-amber-600">Add at least 2 PDFs to merge</p>
      )}
    </div>
  );
}

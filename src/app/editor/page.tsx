'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Upload, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Download, Lock, Unlock,
  PenTool, Scissors, Merge, Settings, RotateCcw
} from 'lucide-react';
import dynamic from 'next/dynamic';

import MergePDF from '@/components/MergePDF';
import SplitPDF from '@/components/SplitPDF';
import PDFTools from '@/components/PDFTools';
import PasswordDialog from '@/components/PasswordDialog';
import SignatureCanvas from '@/components/SignatureCanvas';
import {
  addPasswordToPDF,
  removePasswordFromPDF,
  isPDFEncrypted,
  addImageToPDF,
  getPDFPageCount,
  downloadPDF,
} from '@/lib/pdf-operations';

// Dynamically import PDF viewer to avoid SSR issues
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), { ssr: false });

type SidebarTab = 'tools' | 'merge' | 'split';

export default function EditorPage() {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('document.pdf');
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('tools');
  const [passwordMode, setPasswordMode] = useState<'add' | 'remove' | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [loading, setLoading] = useState(false);
  // Stored password if file was unlocked on open
  const [currentFilePassword, setCurrentFilePassword] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPDF = useCallback(async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const count = await getPDFPageCount(buffer);
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
      setPdfBuffer(buffer);
      setPdfUrl(url);
      setPageCount(count);
      setCurrentPage(1);
      setFileName(file.name);
    } catch (err) {
      console.error('Error loading PDF:', err);
      alert('Failed to load PDF file.');
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles[0]) await loadPDF(acceptedFiles[0]);
  }, [loadPDF]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    noClick: !!pdfUrl,
  });

  const handlePDFUpdate = (buffer: ArrayBuffer) => {
    setPdfBuffer(buffer);
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
    setPdfUrl(url);
  };

  const handleRemovePasswordClick = async () => {
    if (!pdfBuffer) return;
    setLoading(true);
    try {
      // Attempt removal using any remembered password or empty password
      const result = await removePasswordFromPDF(pdfBuffer, currentFilePassword);
      handlePDFUpdate(result.buffer as ArrayBuffer);
      setCurrentFilePassword('');
      alert('Password removed! The PDF is now unlocked in the editor. You can download it anytime using the Download button.');
    } catch {
      // If direct removal requires user input, then open dialog
      setPasswordMode('remove');
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (password: string, ownerPassword?: string) => {
    if (!pdfBuffer) return;
    setLoading(true);
    try {
      let result: Uint8Array;
      if (passwordMode === 'add') {
        result = await addPasswordToPDF(pdfBuffer, password, ownerPassword);
        handlePDFUpdate(result.buffer as ArrayBuffer);
        alert('Password protection added! Click Download when you are ready to save the file.');
      } else {
        result = await removePasswordFromPDF(pdfBuffer, password || currentFilePassword);
        handlePDFUpdate(result.buffer as ArrayBuffer);
        setCurrentFilePassword('');
        alert('Password removed! The PDF is now unlocked in the editor. You can download it anytime using the Download button.');
      }
    } catch {
      alert(
        passwordMode === 'remove'
          ? 'Incorrect password or unable to remove protection.'
          : 'Failed to protect the PDF.'
      );
    } finally {
      setLoading(false);
      setPasswordMode(null);
    }
  };

  const handleSignatureSave = async (dataUrl: string) => {
    if (!pdfBuffer) return;
    setShowSignature(false);
    setLoading(true);
    try {
      const res = await fetch(dataUrl);
      const imageBlob = await res.blob();
      const imageBuffer = await imageBlob.arrayBuffer();
      const result = await addImageToPDF(
        pdfBuffer, imageBuffer, 'png',
        currentPage - 1, 50, 50, 200, 80
      );
      handlePDFUpdate(result.buffer as ArrayBuffer);
    } catch (err) {
      console.error(err);
      alert('Failed to embed signature.');
    } finally {
      setLoading(false);
    }
  };

  const sidebarTabs = [
    { key: 'tools', icon: Settings, label: 'Edit' },
    { key: 'merge', icon: Merge, label: 'Merge' },
    { key: 'split', icon: Scissors, label: 'Split' },
  ] as const;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm">PDFlow</h1>
              <p className="text-xs text-gray-400">Modern PDF Studio</p>
            </div>
          </div>
        </div>

        {/* Open File button */}
        <div className="p-4 border-b border-gray-100">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && loadPDF(e.target.files[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Upload size={15} /> Open PDF
          </button>
          {fileName && pdfUrl && (
            <p className="text-xs text-gray-400 mt-2 truncate text-center" title={fileName}>
              {fileName}
            </p>
          )}
        </div>

        {/* Sidebar Tab Nav */}
        <div className="flex border-b border-gray-100">
          {sidebarTabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setSidebarTab(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                sidebarTab === key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {sidebarTab === 'tools' && (
            <div className="space-y-5">
              {/* Password tools */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
                  Security
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => setPasswordMode('add')}
                    disabled={!pdfBuffer}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Lock size={15} className="text-blue-500" /> Add Password
                  </button>
                  <button
                    onClick={handleRemovePasswordClick}
                    disabled={!pdfBuffer}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Unlock size={15} className="text-orange-500" /> Remove Password
                  </button>
                  <button
                    onClick={() => setShowSignature(true)}
                    disabled={!pdfBuffer}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <PenTool size={15} className="text-green-500" /> Add Signature
                  </button>
                </div>
              </div>

              {/* PDF Editing Tools */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
                  Edit Tools
                </p>
                <PDFTools
                  pdfBuffer={pdfBuffer}
                  pageCount={pageCount}
                  currentPage={currentPage}
                  fileName={fileName}
                  onPDFUpdate={handlePDFUpdate}
                />
              </div>

              {/* Download */}
              {pdfBuffer && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
                    Export
                  </p>
                  <button
                    onClick={() => {
                      if (pdfBuffer) {
                        const bytes = new Uint8Array(pdfBuffer);
                        downloadPDF(bytes, fileName);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Download size={15} className="text-gray-500" /> Download PDF
                  </button>
                </div>
              )}
            </div>
          )}

          {sidebarTab === 'merge' && <MergePDF />}

          {sidebarTab === 'split' && (
            <SplitPDF
              pdfBuffer={pdfBuffer}
              pageCount={pageCount}
              fileName={fileName}
            />
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        {pdfUrl && (
          <div className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-4 shadow-sm">
            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600 min-w-[80px] text-center">
                Page {currentPage} of {pageCount}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage >= pageCount}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="w-px h-5 bg-gray-200" />

            {/* Zoom controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-sm text-gray-600 min-w-[48px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(3, s + 0.1))}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => setScale(1)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Reset zoom"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {loading && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              )}
              <button
                onClick={() => {
                  if (pdfBuffer) {
                    const bytes = new Uint8Array(pdfBuffer);
                    downloadPDF(bytes, fileName);
                  }
                }}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold shadow-sm"
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        )}

        {/* PDF Viewer Area */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6" {...getRootProps()}>
          <input {...getInputProps()} />
          {pdfUrl ? (
            <PDFViewer
              fileUrl={pdfUrl}
              scale={scale}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPasswordSuccess={(pw) => setCurrentFilePassword(pw)}
            />
          ) : (
            <div className={`h-full flex items-center justify-center ${isDragActive ? 'bg-blue-50' : ''}`}>
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Upload size={36} className="text-blue-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  {isDragActive ? 'Drop your PDF here' : 'Open a PDF to get started'}
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  Drag & drop a PDF file here, or use the button in the sidebar
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                  {['✅ View & Navigate', '🔒 Password Protection', '✍️ E-Signatures',
                    '🔀 Merge PDFs', '✂️ Split PDFs', '💧 Watermarks',
                    '🔄 Rotate Pages', '🗑️ Delete Pages', '📝 Add Text'].map((f) => (
                    <span key={f} className="bg-white px-2.5 py-1 rounded-full border border-gray-200">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {passwordMode && (
        <PasswordDialog
          mode={passwordMode}
          onConfirm={handlePassword}
          onClose={() => setPasswordMode(null)}
        />
      )}
      {showSignature && (
        <SignatureCanvas
          onSave={handleSignatureSave}
          onClose={() => setShowSignature(false)}
        />
      )}
    </div>
  );
}

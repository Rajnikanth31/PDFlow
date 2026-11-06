'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Upload, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Download, Lock, Unlock,
  PenTool, Scissors, Merge, Settings, RotateCcw,
  Layers, Minimize2, Image as ImageIcon, FileSearch,
  Sun, Moon
} from 'lucide-react';
import dynamic from 'next/dynamic';

import MergePDF from '@/components/MergePDF';
import SplitPDF from '@/components/SplitPDF';
import PDFTools from '@/components/PDFTools';
import PageOrganizer from '@/components/PageOrganizer';
import CompressPDF from '@/components/CompressPDF';
import ImageConverter from '@/components/ImageConverter';
import OCRTool from '@/components/OCRTool';
import PasswordDialog from '@/components/PasswordDialog';
import SignatureCanvas from '@/components/SignatureCanvas';
import {
  addPasswordToPDF,
  removePasswordFromPDF,
  addImageToPDF,
  getPDFPageCount,
  downloadPDF,
} from '@/lib/pdf-operations';

// Dynamically import PDF viewer to avoid SSR issues
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), { ssr: false });

type SidebarTab = 'tools' | 'organize' | 'compress' | 'convert' | 'extract' | 'merge' | 'split';

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
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  const handlePDFUpdate = async (buffer: ArrayBuffer) => {
    setPdfBuffer(buffer);
    const count = await getPDFPageCount(buffer);
    setPageCount(count);
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
    setPdfUrl(url);
  };

  const handleRemovePasswordClick = async () => {
    if (!pdfBuffer) return;
    setLoading(true);
    try {
      const result = await removePasswordFromPDF(pdfBuffer, currentFilePassword);
      await handlePDFUpdate(result.buffer as ArrayBuffer);
      setCurrentFilePassword('');
      alert('Password removed! The PDF is now unlocked in the editor. You can download it anytime using the Download button.');
    } catch {
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
        await handlePDFUpdate(result.buffer as ArrayBuffer);
        alert('Password protection added! Click Download when you are ready to save the file.');
      } else {
        result = await removePasswordFromPDF(pdfBuffer, password || currentFilePassword);
        await handlePDFUpdate(result.buffer as ArrayBuffer);
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
      await handlePDFUpdate(result.buffer as ArrayBuffer);
    } catch (err) {
      console.error(err);
      alert('Failed to embed signature.');
    } finally {
      setLoading(false);
    }
  };

  const sidebarTabs = [
    { key: 'tools', icon: Settings, label: 'Edit' },
    { key: 'organize', icon: Layers, label: 'Organize' },
    { key: 'compress', icon: Minimize2, label: 'Compress' },
    { key: 'convert', icon: ImageIcon, label: 'Convert' },
    { key: 'extract', icon: FileSearch, label: 'OCR' },
    { key: 'merge', icon: Merge, label: 'Merge' },
    { key: 'split', icon: Scissors, label: 'Split' },
  ] as const;

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside className={`w-80 border-r flex flex-col shadow-sm transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <FileText size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight">PDFlow</h1>
              <p className="text-[11px] text-gray-400">All-in-One PDF Studio</p>
            </div>
          </div>

          {/* Dark mode button */}
          <button
            onClick={() => setIsDarkMode((prev) => !prev)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              isDarkMode ? 'text-amber-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Open File button */}
        <div className={`p-3.5 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && loadPDF(e.target.files[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-xs font-semibold shadow-sm"
          >
            <Upload size={14} /> Open PDF
          </button>
          {fileName && pdfUrl && (
            <p className="text-[11px] text-gray-400 mt-2 truncate text-center" title={fileName}>
              {fileName}
            </p>
          )}
        </div>

        {/* Sidebar Tab Nav */}
        <div className={`grid grid-cols-7 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
          {sidebarTabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setSidebarTab(key)}
              title={label}
              className={`flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors border-b-2 ${
                sidebarTab === key
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'text-gray-400 hover:text-gray-600 border-transparent'
              }`}
            >
              <Icon size={14} />
              <span className="truncate max-w-[40px]">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sidebarTab === 'tools' && (
            <div className="space-y-4">
              {/* Security Tools */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Security & Signing
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setPasswordMode('add')}
                    disabled={!pdfBuffer}
                    className="flex flex-col items-center justify-center gap-1 p-2 text-[11px] text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors disabled:opacity-40"
                  >
                    <Lock size={14} className="text-blue-500" />
                    <span>Lock</span>
                  </button>
                  <button
                    onClick={handleRemovePasswordClick}
                    disabled={!pdfBuffer}
                    className="flex flex-col items-center justify-center gap-1 p-2 text-[11px] text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-xl transition-colors disabled:opacity-40"
                  >
                    <Unlock size={14} className="text-orange-500" />
                    <span>Unlock</span>
                  </button>
                  <button
                    onClick={() => setShowSignature(true)}
                    disabled={!pdfBuffer}
                    className="flex flex-col items-center justify-center gap-1 p-2 text-[11px] text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition-colors disabled:opacity-40"
                  >
                    <PenTool size={14} className="text-green-500" />
                    <span>Sign</span>
                  </button>
                </div>
              </div>

              {/* Editing Tools */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Document Tools
                </p>
                <PDFTools
                  pdfBuffer={pdfBuffer}
                  pageCount={pageCount}
                  currentPage={currentPage}
                  fileName={fileName}
                  onPDFUpdate={handlePDFUpdate}
                />
              </div>
            </div>
          )}

          {sidebarTab === 'organize' && (
            <PageOrganizer pdfBuffer={pdfBuffer} onPDFUpdate={handlePDFUpdate} />
          )}

          {sidebarTab === 'compress' && (
            <CompressPDF
              pdfBuffer={pdfBuffer}
              fileName={fileName}
              onPDFUpdate={handlePDFUpdate}
            />
          )}

          {sidebarTab === 'convert' && (
            <ImageConverter
              pdfBuffer={pdfBuffer}
              fileName={fileName}
              onPDFUpdate={handlePDFUpdate}
            />
          )}

          {sidebarTab === 'extract' && (
            <OCRTool
              pdfBuffer={pdfBuffer}
              currentPage={currentPage}
              fileName={fileName}
            />
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
          <div className={`px-4 py-2.5 flex items-center gap-4 border-b transition-colors shadow-sm ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-gray-100 text-gray-700'
          }`}>
            {/* Page navigation */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs min-w-[75px] text-center font-medium">
                Page {currentPage} of {pageCount}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage >= pageCount}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className={`w-px h-5 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`} />

            {/* Zoom controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs min-w-[44px] text-center font-medium">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(3, s + 0.1))}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => setScale(1)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Reset zoom"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {loading && (
                <div className="flex items-center gap-2 text-xs text-blue-500 font-medium">
                  <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-xs font-semibold shadow-sm"
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        )}

        {/* PDF Viewer Area */}
        <div
          className={`flex-1 overflow-auto p-6 transition-colors ${
            isDarkMode ? 'bg-slate-950' : 'bg-gray-100'
          }`}
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          {pdfUrl ? (
            <PDFViewer
              fileUrl={pdfUrl}
              scale={scale}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPasswordSuccess={(pw) => setCurrentFilePassword(pw)}
              isDarkMode={isDarkMode}
            />
          ) : (
            <div className={`h-full flex items-center justify-center ${isDragActive ? 'bg-blue-50/50' : ''}`}>
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <Upload size={36} />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  {isDragActive ? 'Drop your PDF here' : 'Drop your PDF to start'}
                </h2>
                <p className="text-gray-400 text-xs mb-6">
                  Drag & drop any PDF or click Open PDF to edit, organize, compress, unlock, or sign.
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-[11px] text-gray-500">
                  {[
                    '🔒 Password Remover',
                    '🗜️ Compressor',
                    '🗂️ Page Organizer',
                    '🖼️ Images ⇄ PDF',
                    '⬛ Redaction',
                    '✍️ E-Signatures',
                    '🔍 In-Doc Search',
                    '📄 OCR Extraction',
                    '🔀 Merge & Split',
                  ].map((f) => (
                    <span
                      key={f}
                      className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm"
                    >
                      {f}
                    </span>
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

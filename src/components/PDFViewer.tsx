'use client';

import { useEffect, useRef, useState } from 'react';
import { Lock, Search, ChevronDown, ChevronUp, X, Moon, Sun } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  scale: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPasswordSuccess?: (password: string) => void;
  isDarkMode?: boolean;
}

export default function PDFViewer({
  fileUrl,
  scale,
  currentPage,
  onPageChange,
  onPasswordSuccess,
  isDarkMode = false,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<unknown>(null);
  const [rendering, setRendering] = useState(false);
  const [passwordCallback, setPasswordCallback] = useState<((pw: string) => void) | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ page: number; count: number }[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const [searching, setSearching] = useState(false);

  // Global Ctrl+F listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;
    setPasswordCallback(null);
    setPasswordError(false);
    setPasswordInput('');
    setSearchResults([]);
    setSearchQuery('');

    const loadPdf = async () => {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const loadingTask = pdfjsLib.getDocument({ url: fileUrl });
      loadingTask.onPassword = (callback: (password: string) => void, reason: number) => {
        if (!cancelled) {
          setPasswordCallback(() => callback);
          if (reason === 2) {
            setPasswordError(true);
          }
        }
      };

      const pdf = await loadingTask.promise;
      if (!cancelled) {
        setPdfDoc(pdf);
        setPasswordCallback(null);
      }
    };

    loadPdf().catch((err) => {
      if (!cancelled) {
        console.error('PDF load error:', err);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  // Render page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      setRendering(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const page = await (pdfDoc as any).getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'RenderingCancelledException') {
          console.error('Render error:', err);
        }
      } finally {
        setRendering(false);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  // Search logic across all pages
  const handleSearch = async () => {
    if (!pdfDoc || !searchQuery.trim()) return;
    setSearching(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = pdfDoc as any;
      const results: { page: number; count: number }[] = [];
      const q = searchQuery.toLowerCase();

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageText = textContent.items.map((it: any) => it.str).join(' ').toLowerCase();
        const matches = (pageText.match(new RegExp(q, 'g')) || []).length;
        if (matches > 0) {
          results.push({ page: i, count: matches });
        }
      }

      setSearchResults(results);
      setSearchIndex(0);
      if (results.length > 0) {
        onPageChange(results[0].page);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleNextMatch = () => {
    if (searchResults.length === 0) return;
    const next = (searchIndex + 1) % searchResults.length;
    setSearchIndex(next);
    onPageChange(searchResults[next].page);
  };

  const handlePrevMatch = () => {
    if (searchResults.length === 0) return;
    const prev = (searchIndex - 1 + searchResults.length) % searchResults.length;
    setSearchIndex(prev);
    onPageChange(searchResults[prev].page);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordCallback && passwordInput) {
      setPasswordError(false);
      passwordCallback(passwordInput);
      if (onPasswordSuccess) {
        onPasswordSuccess(passwordInput);
      }
    }
  };

  const totalMatches = searchResults.reduce((acc, r) => acc + r.count, 0);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-full py-6">
      {/* Floating In-Document Search Bar */}
      {showSearch && (
        <div className="fixed top-20 right-8 z-30 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl p-2.5 flex items-center gap-2">
          <Search size={15} className="text-gray-400 ml-1.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search text in document..."
            className="text-xs border-0 outline-none w-48 text-gray-700 bg-transparent"
            autoFocus
          />
          {searching ? (
            <span className="text-[10px] text-gray-400 px-1">Searching...</span>
          ) : searchResults.length > 0 ? (
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              P.{searchResults[searchIndex]?.page} ({searchIndex + 1}/{searchResults.length})
            </span>
          ) : searchQuery ? (
            <span className="text-[10px] text-gray-400 px-1">0 matches</span>
          ) : null}

          <div className="flex items-center gap-0.5 border-l border-gray-200 pl-1.5">
            <button
              onClick={handlePrevMatch}
              disabled={searchResults.length === 0}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30"
              title="Previous match"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={handleNextMatch}
              disabled={searchResults.length === 0}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30"
              title="Next match"
            >
              <ChevronDown size={14} />
            </button>
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {rendering && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Rendering...
        </div>
      )}

      {passwordCallback ? (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center border border-gray-100 my-auto">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={22} />
          </div>
          <h3 className="font-bold text-gray-800 text-base mb-1">Password Protected</h3>
          <p className="text-xs text-gray-500 mb-4">Enter the password to view this document</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError(false);
              }}
              placeholder="Enter document password"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {passwordError && (
              <p className="text-xs text-red-500">Incorrect password. Please try again.</p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Unlock Document
            </button>
          </form>
        </div>
      ) : (
        <div
          className={`shadow-2xl rounded-sm overflow-hidden transition-all duration-300 ${
            isDarkMode ? 'bg-slate-900 invert-[0.9] hue-rotate-180 ring-1 ring-slate-800' : 'bg-white'
          }`}
        >
          <canvas ref={canvasRef} className="block" />
        </div>
      )}
    </div>
  );
}

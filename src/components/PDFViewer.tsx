'use client';

import { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  scale: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPasswordSuccess?: (password: string) => void;
}

export default function PDFViewer({
  fileUrl,
  scale,
  currentPage,
  onPageChange,
  onPasswordSuccess,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<unknown>(null);
  const [rendering, setRendering] = useState(false);
  const [passwordCallback, setPasswordCallback] = useState<((pw: string) => void) | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;
    setPasswordCallback(null);
    setPasswordError(false);
    setPasswordInput('');

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

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-6">
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
        <div className="shadow-2xl rounded-sm overflow-hidden bg-white">
          <canvas ref={canvasRef} className="block" />
        </div>
      )}
    </div>
  );
}

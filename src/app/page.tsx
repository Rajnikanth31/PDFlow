import Link from 'next/link';
import {
  FileText, Upload, Lock, Scissors, Merge,
  PenTool, Droplets, RotateCw, ArrowRight, Code2,
  Minimize2, Layers, Image as ImageIcon, EyeOff, Search
} from 'lucide-react';

const features = [
  { icon: Lock, title: 'Unlock & Protect', desc: 'Remove passwords or add AES security to documents', color: 'bg-purple-100 text-purple-600' },
  { icon: Minimize2, title: 'Smart Compression', desc: 'Optimize and shrink file size without losing quality', color: 'bg-emerald-100 text-emerald-600' },
  { icon: Layers, title: 'Page Organizer', desc: 'Visual thumbnail grid — drag to reorder, duplicate & rotate', color: 'bg-blue-100 text-blue-600' },
  { icon: ImageIcon, title: 'Images ⇄ PDF', desc: 'Convert JPG/PNG to PDF or export pages as images', color: 'bg-amber-100 text-amber-600' },
  { icon: EyeOff, title: 'Redact & Whiteout', desc: 'Black out or white out sensitive private information', color: 'bg-red-100 text-red-600' },
  { icon: PenTool, title: 'E-Signatures', desc: 'Draw and embed custom signatures directly on PDFs', color: 'bg-green-100 text-green-600' },
  { icon: Search, title: 'In-Document Search', desc: 'Fast Ctrl+F search across all pages with jump navigation', color: 'bg-cyan-100 text-cyan-600' },
  { icon: Merge, title: 'Merge & Split', desc: 'Combine multiple PDFs or extract custom page ranges', color: 'bg-orange-100 text-orange-600' },
  { icon: Droplets, title: 'Watermarks', desc: 'Add custom text watermarks with adjustable opacity', color: 'bg-sky-100 text-sky-600' },
  { icon: RotateCw, title: 'Rotate & Delete', desc: 'Rotate individual pages or bulk delete unwanted pages', color: 'bg-yellow-100 text-yellow-600' },
  { icon: FileText, title: 'Text Extraction (OCR)', desc: 'Extract selectable text, copy or download as .txt', color: 'bg-indigo-100 text-indigo-600' },
  { icon: FileText, title: 'Add Annotations', desc: 'Insert custom text stamps anywhere on any page', color: 'bg-pink-100 text-pink-600' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Nav */}
      <nav className="border-b border-white/60 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-lg">PDFlow</span>
          </div>
          <a
            href="https://github.com/Rajnikanth31/PDFlow"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <Code2 size={16} /> GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-medium px-3.5 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          100% Free & Private — Works in your browser
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-5 leading-tight">
          PDF tools that just<br />
          <span className="text-blue-600">Flow</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
          View, organize, compress, unlock, redact, convert, sign, and edit PDFs — all in one modern studio with zero clutter.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/editor"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg shadow-blue-200"
          >
            <Upload size={20} /> Open PDFlow Studio
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon size={18} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1.5 text-sm">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        Built with <span className="text-blue-500 font-medium">Next.js</span>,{' '}
        <span className="text-blue-500 font-medium">PDF.js</span>, and{' '}
        <span className="text-blue-500 font-medium">pdf-lib</span> •{' '}
        <a href="https://github.com/Rajnikanth31/PDFlow" className="hover:underline">Open Source</a>
      </footer>
    </div>
  );
}

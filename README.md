# PDFlow 📄✨

> **The Fast, Private, In-Browser PDF Studio.** View, edit, organize, compress, convert, watermark, e-sign, redact, protect, and remove passwords from PDFs with zero cloud tracking.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🚀 Features

### 🗂️ Document Manipulation & Organization
- 📄 **High-Definition Viewer:** Smooth rendering powered by Mozilla PDF.js with zoom, fit-width, and quick page navigation.
- 🗂️ **Visual Page Organizer:** Draggable thumbnail grid of all pages — reorder, rotate individual pages, duplicate, or delete with one click.
- 🔀 **Merge PDFs:** Drag-and-drop to reorder and combine multiple PDF files into a single document.
- ✂️ **Split & Extract:** Extract custom page ranges or split all pages into individual documents.

### 🔒 Security & Privacy
- 🔓 **Password Remover & Decryptor:** Decrypt protected PDFs (AES-128, AES-256, and RC4) and strip restrictive permissions with full content fidelity.
- 🔒 **Password Protection:** Encrypt PDF files with standard AES encryption to restrict unauthorized access.
- ⬛ **Redaction & Whiteout:** Permanently black out or white out sensitive private information (SSNs, phone numbers, addresses).

### 🛠️ Utilities & Optimization
- 🗜️ **Smart PDF Compressor:** Linearize and compress internal content streams to shrink file size without losing visual clarity.
- 🖼️ **Images to PDF:** Select multiple JPG, PNG, or WebP images and compile them into a neat multi-page PDF.
- 📷 **PDF to Images:** Export PDF pages as high-resolution PNG images.
- ✍️ **E-Signatures:** Draw custom signatures on a canvas and embed them directly onto any page.
- 💧 **Watermarks:** Add customizable text watermarks across all pages with adjustable rotation and opacity.
- 📝 **Text Annotations:** Add custom text stamps with adjustable font size, position, and colors.
- 🔍 **In-Document Search (`Ctrl + F`):** Real-time text search across all pages with jump-to-match navigation.
- 📄 **Text Extraction (OCR):** Extract all selectable text, word count analysis, copy to clipboard, or export to `.txt`.
- 🌙 **Dark Mode:** Comfortable dark reading mode with inverted PDF view for late-night editing.
- 💾 **Download On Demand:** All edits happen in real time in the editor — download your document only when you're ready.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **PDF Engine:** [PDF.js](https://mozilla.github.io/pdf.js/) & [pdf-lib](https://pdf-lib.js.org/)
- **Optimization & Decryption:** QPDF Engine
- **Icons:** [Lucide Icons](https://lucide.dev/)

---

## 📦 Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Rajnikanth31/PDFlow.git
   cd PDFlow
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Privacy First

PDFlow operates with privacy by design. Document rendering and client operations happen entirely in your browser without uploading files to external third-party cloud trackers.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

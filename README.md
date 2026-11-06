# PDFlow 📄✨

> **Fast, private, in-browser PDF studio.** View, edit, merge, split, watermark, e-sign, protect, and remove passwords from PDFs with zero tracking.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🚀 Features

- 📄 **Fast Document Viewer:** High-definition page rendering powered by PDF.js with smooth zoom and page navigation.
- 🔓 **Password Remover & Decryptor:** Decrypt protected PDFs (AES-128, AES-256, and RC4) and strip restrictive permissions with full content fidelity.
- 🔒 **Password Protection:** Encrypt PDF files with standard AES encryption to restrict unauthorized access.
- 🔀 **Merge PDFs:** Drag-and-drop to reorder and combine multiple PDF files into a single document.
- ✂️ **Split & Extract:** Extract page ranges or split all pages into individual documents.
- ✍️ **E-Signatures:** Draw custom signatures on a canvas and embed them directly onto any page.
- 💧 **Watermarks:** Add customizable text watermarks across all pages with adjustable rotation and opacity.
- 📝 **Text Annotations:** Add custom text stamps with adjustable font size, position, and colors.
- 🔄 **Page Rotation & Deletion:** Rotate individual pages or whole documents, and delete unwanted pages.
- 💾 **Download On Demand:** All edits happen in real time in the editor — download your document only when you're ready.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **PDF Engine:** [PDF.js](https://mozilla.github.io/pdf.js/) & [pdf-lib](https://pdf-lib.js.org/)
- **Decryption Engine:** QPDF + Pure JS Fallbacks
- **Icons:** [Lucide Icons](https://lucide.dev/)

---

## 📦 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn

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

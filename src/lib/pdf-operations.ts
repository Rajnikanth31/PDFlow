import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { isEncrypted as checkIsEncrypted, decryptPDF } from '@pdfsmaller/pdf-decrypt';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';

/**
 * Merge multiple PDF files into one
 */
export async function mergePDFs(pdfFiles: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const pdfBytes of pdfFiles) {
    const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return mergedPdf.save();
}

/**
 * Split a PDF into individual pages or a range
 */
export async function splitPDF(
  pdfBytes: ArrayBuffer,
  startPage: number,
  endPage: number
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  const pageCount = pdf.getPageCount();

  const start = Math.max(0, startPage - 1);
  const end = Math.min(pageCount - 1, endPage - 1);

  const copiedPages = await newPdf.copyPages(
    pdf,
    Array.from({ length: end - start + 1 }, (_, i) => i + start)
  );
  copiedPages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

/**
 * Split a PDF into individual page files
 */
export async function splitPDFIntoPages(pdfBytes: ArrayBuffer): Promise<Uint8Array[]> {
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = pdf.getPageCount();
  const pages: Uint8Array[] = [];

  for (let i = 0; i < pageCount; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(copiedPage);
    pages.push(await newPdf.save());
  }

  return pages;
}

/**
 * Add password protection to a PDF (AES-256 standard encryption)
 */
export async function addPasswordToPDF(
  pdfBytes: ArrayBuffer,
  userPassword: string,
  ownerPassword?: string
): Promise<Uint8Array> {
  const bytes = new Uint8Array(pdfBytes);
  const encrypted = await encryptPDF(bytes, userPassword, {
    ownerPassword: ownerPassword || userPassword,
    algorithm: 'AES-256',
  });
  return encrypted;
}

/**
 * Remove password / decrypt an encrypted PDF
 */
export async function removePasswordFromPDF(
  pdfBytes: ArrayBuffer,
  password = ''
): Promise<Uint8Array> {
  // 1. Try server-side QPDF engine first (full AES-128, AES-256, RC4 stream decryption)
  try {
    const formData = new FormData();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    formData.append('file', blob, 'document.pdf');
    formData.append('password', password);

    const res = await fetch('/api/pdf/decrypt', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return new Uint8Array(buffer);
    }

    if (res.status === 401) {
      throw new Error('Incorrect password');
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'Incorrect password') {
      throw err;
    }
    console.warn('API decrypt failed, attempting client fallback:', err);
  }

  const bytes = new Uint8Array(pdfBytes);

  // 2. Try client-side decryptPDF (supports AES-256 and RC4)
  if (password && password.trim()) {
    try {
      const decrypted = await decryptPDF(bytes, password);
      return decrypted;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('password') && !msg.toLowerCase().includes('unsupported')) {
        throw err;
      }
    }
  }

  // 3. Fallback: Strip encryption dictionary via pdf-lib
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (pdf.context.trailerInfo as any).Encrypt;
  return await pdf.save();
}

/**
 * Add text watermark to all pages of a PDF
 */
export async function addWatermark(
  pdfBytes: ArrayBuffer,
  text: string,
  opacity = 0.3
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) / 8;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity,
      rotate: degrees(45),
    });
  }

  return pdf.save();
}

/**
 * Rotate pages in a PDF
 */
export async function rotatePDF(
  pdfBytes: ArrayBuffer,
  pageIndices: number[],
  angle: 90 | 180 | 270
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdf.getPages();

  for (const index of pageIndices) {
    if (index < pages.length) {
      const page = pages[index];
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angle) % 360));
    }
  }

  return pdf.save();
}

/**
 * Delete specific pages from a PDF
 */
export async function deletePagesFromPDF(
  pdfBytes: ArrayBuffer,
  pageIndicesToRemove: number[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = pdf.getPageCount();
  const newPdf = await PDFDocument.create();

  const keepIndices = Array.from({ length: pageCount }, (_, i) => i).filter(
    (i) => !pageIndicesToRemove.includes(i)
  );

  const copiedPages = await newPdf.copyPages(pdf, keepIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

/**
 * Add an image to a specific page of a PDF
 */
export async function addImageToPDF(
  pdfBytes: ArrayBuffer,
  imageBytes: ArrayBuffer,
  imageType: 'jpeg' | 'png',
  pageIndex: number,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdf.getPages();

  if (pageIndex >= pages.length) throw new Error('Page index out of range');

  const image =
    imageType === 'png' ? await pdf.embedPng(imageBytes) : await pdf.embedJpg(imageBytes);

  pages[pageIndex].drawImage(image, { x, y, width, height });

  return pdf.save();
}

/**
 * Add a text annotation/stamp to a PDF page
 */
export async function addTextToPDF(
  pdfBytes: ArrayBuffer,
  text: string,
  pageIndex: number,
  x: number,
  y: number,
  fontSize = 12,
  color = { r: 0, g: 0, b: 0 }
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  if (pageIndex >= pages.length) throw new Error('Page index out of range');

  pages[pageIndex].drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(color.r, color.g, color.b),
  });

  return pdf.save();
}

/**
 * Check whether a PDF is encrypted
 */
export async function isPDFEncrypted(pdfBytes: ArrayBuffer): Promise<boolean> {
  try {
    const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Boolean((pdf as any).isEncrypted);
  } catch {
    return false;
  }
}

/**
 * Get page count from PDF bytes.
 */
export async function getPDFPageCount(pdfBytes: ArrayBuffer): Promise<number> {
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  return pdf.getPageCount();
}

/**
 * Convert ArrayBuffer to base64 data URL
 */
export function uint8ArrayToDataUrl(bytes: Uint8Array, mimeType = 'application/pdf'): string {
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Trigger browser download of a Uint8Array as a file
 */
export function downloadPDF(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';

const execFileAsync = promisify(execFile);

function findQpdfPath(): string | null {
  // Check local qpdf-dist directory first
  const projectRoot = process.cwd();
  const distDir = path.join(projectRoot, 'qpdf-dist');
  if (fs.existsSync(distDir)) {
    const findExe = (dir: string): string | null => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          const res = findExe(fullPath);
          if (res) return res;
        } else if (file.name.toLowerCase() === 'qpdf.exe' || file.name === 'qpdf') {
          return fullPath;
        }
      }
      return null;
    };
    const found = findExe(distDir);
    if (found) return found;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const password = (formData.get('password') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // 1. Try QPDF if executable is found
    const qpdfPath = findQpdfPath();
    if (qpdfPath) {
      const tempDir = os.tmpdir();
      const id = Math.random().toString(36).slice(2);
      const inPath = path.join(tempDir, `in_${id}.pdf`);
      const outPath = path.join(tempDir, `out_${id}.pdf`);

      fs.writeFileSync(inPath, Buffer.from(bytes));

      const args = [
        password ? `--password=${password}` : '--password=',
        '--decrypt',
        inPath,
        outPath,
      ];

      try {
        await execFileAsync(qpdfPath, args);
        const decryptedBytes = fs.readFileSync(outPath);

        return new NextResponse(decryptedBytes, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="unlocked_${file.name}"`,
          },
        });
      } catch (err: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stderr = (err as any)?.stderr?.toString() || '';
        if (stderr.toLowerCase().includes('invalid password') || stderr.toLowerCase().includes('password')) {
          return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
        }
      } finally {
        if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }
    }

    // 2. Fall back to @pdfsmaller/pdf-decrypt (AES-256 and RC4)
    try {
      const decrypted = await decryptPDF(bytes, password);
      return new NextResponse(Buffer.from(decrypted), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="unlocked_${file.name}"`,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('not encrypted')) {
        return NextResponse.json({ error: 'This PDF is not encrypted' }, { status: 400 });
      }
      if (msg.toLowerCase().includes('password')) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      }
      return NextResponse.json(
        { error: msg || 'Failed to decrypt document. Please verify the password.' },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error('Decryption route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

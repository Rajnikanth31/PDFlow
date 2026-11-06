import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

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

  // Fallback to system PATH
  return 'qpdf';
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const password = (formData.get('password') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    const qpdfPath = findQpdfPath();
    if (!qpdfPath) {
      return NextResponse.json({ error: 'QPDF engine not available' }, { status: 500 });
    }

    const tempDir = os.tmpdir();
    const id = Math.random().toString(36).slice(2);
    const inPath = path.join(tempDir, `in_${id}.pdf`);
    const outPath = path.join(tempDir, `out_${id}.pdf`);

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(inPath, Buffer.from(arrayBuffer));

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
      return NextResponse.json(
        { error: 'Failed to decrypt document. Please verify the password.' },
        { status: 400 }
      );
    } finally {
      if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    }
  } catch (err) {
    console.error('Decryption route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function findQpdfPath(): string {
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
  return 'qpdf';
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    const qpdfPath = findQpdfPath();
    const tempDir = os.tmpdir();
    const id = Math.random().toString(36).slice(2);
    const inPath = path.join(tempDir, `in_${id}.pdf`);
    const outPath = path.join(tempDir, `out_${id}.pdf`);

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(inPath, Buffer.from(arrayBuffer));

    // QPDF optimization args: compress streams, generate object streams, linearize for fast web view
    const args = [
      '--linearize',
      '--object-streams=generate',
      '--stream-data=compress',
      '--recompress-flate',
      inPath,
      outPath,
    ];

    try {
      await execFileAsync(qpdfPath, args);
      const compressedBytes = fs.readFileSync(outPath);

      return new NextResponse(compressedBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="compressed_${file.name}"`,
          'X-Original-Size': String(arrayBuffer.byteLength),
          'X-Compressed-Size': String(compressedBytes.length),
        },
      });
    } catch {
      // Fallback if extreme compression fails: standard compress
      try {
        await execFileAsync(qpdfPath, ['--stream-data=compress', inPath, outPath]);
        const compressedBytes = fs.readFileSync(outPath);
        return new NextResponse(compressedBytes, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="compressed_${file.name}"`,
          },
        });
      } catch (e: unknown) {
        console.error('QPDF fallback failed:', e);
        return NextResponse.json({ error: 'Compression failed' }, { status: 500 });
      }
    } finally {
      if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    }
  } catch (err) {
    console.error('Compression route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

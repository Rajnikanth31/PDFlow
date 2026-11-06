import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PDFlow — Fast, Private In-Browser PDF Studio',
  description:
    'Free, privacy-friendly online PDF editor. View, edit, merge, split, remove passwords, add encryption, watermarks, e-signatures, and more.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

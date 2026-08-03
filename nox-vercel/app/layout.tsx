import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nox Chat',
  description: 'Modern chat with AI help and View Once photos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

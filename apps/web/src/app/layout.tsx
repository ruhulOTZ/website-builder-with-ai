import { getAllFontVariables } from '@repo/design-system';
import { type Metadata } from 'next';

import { Toaster } from '@/components/ui/sonner';

import './globals.css';

export const metadata: Metadata = {
  title: 'Website Builder',
  description: 'AI-powered multi-page website builder',
};

// All TYPOGRAPHY_PAIRINGS fonts are pre-loaded on the root so the brief
// form's typography preview renders accurately. next/font tree-shakes
// unused fonts at build time — the bundle only includes fonts whose
// CSS variables are actually referenced.
const fontVariables = getAllFontVariables();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

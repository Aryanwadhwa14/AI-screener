import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'GFI AI Resume Screener — Dual-Role Candidate Ranking',
  description: 'AI-assisted resume screening, structured extraction, deterministic dual-role scoring, and explainable ranking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#020203] text-[#F4F4F6] antialiased selection:bg-[#FF5729]/30 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

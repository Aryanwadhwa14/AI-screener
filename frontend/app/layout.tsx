import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'ScreenAI ATS — AI Resume Screening & Evaluation Platform',
  description: 'Production-grade AI candidate screening, deterministic multi-role scoring, and verifiable evidence provenance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-zinc-800 selection:text-zinc-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

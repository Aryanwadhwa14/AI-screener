import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-muted selection:text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

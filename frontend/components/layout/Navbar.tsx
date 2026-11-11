'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { IconUpload } from '@/components/ui/icons';

interface NavbarProps {
  onOpenUpload: () => void;
}

export default function Navbar({ onOpenUpload }: NavbarProps) {
  const pathname = usePathname();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await api.getHealth();
        if (isMounted) setIsBackendHealthy(res.status === 'healthy');
      } catch {
        if (isMounted) setIsBackendHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/rankings/lca', label: 'LCA Consultant' },
    { href: '/rankings/uiux', label: 'UI/UX Designer' },
    { href: '/methodology', label: 'Methodology' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-[#09090b]/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-2">
              Growth For Impact
              <span className="text-[11px] font-normal text-zinc-500">•</span>
              <span className="text-xs font-normal text-zinc-300">Resume Screener</span>
            </span>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1 border-l border-zinc-800 pl-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-white border border-zinc-700/80'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Health Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded border border-zinc-800 bg-[#0e0e11] text-[11px] font-mono text-zinc-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBackendHealthy === null
                  ? 'bg-amber-400 animate-pulse'
                  : isBackendHealthy
                  ? 'bg-emerald-400'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {isBackendHealthy === null
                ? 'Connecting...'
                : isBackendHealthy
                ? 'System Online'
                : 'Offline'}
            </span>
          </div>

          {/* Upload Button */}
          <Button onClick={onOpenUpload} size="sm" className="gap-1.5 font-medium">
            <IconUpload size={14} />
            <span>Upload Resume</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

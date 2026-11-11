'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { IconUpload, IconBriefcase, IconUsers, IconLayers } from '@/components/ui/icons';

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
    { href: '/', label: 'Candidates', icon: IconUsers },
    { href: '/rankings/lca', label: 'Sustainability & LCA', icon: IconBriefcase },
    { href: '/rankings/uiux', label: 'Product & UI/UX', icon: IconBriefcase },
    { href: '/methodology', label: 'Screening Engine', icon: IconLayers },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & ATS Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-zinc-100 text-zinc-950 font-black text-xs tracking-tighter">
              AI
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                ScreenAI
              </span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                ATS
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1 border-l border-zinc-800/80 pl-5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-zinc-200' : 'text-zinc-500'} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Health Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/40 text-[11px] font-mono text-zinc-400">
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
                ? 'Engine Active'
                : 'Offline'}
            </span>
          </div>

          {/* Screen Resume CTA */}
          <Button onClick={onOpenUpload} size="sm" className="gap-1.5 font-medium">
            <IconUpload size={14} />
            <span>Screen Resume</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

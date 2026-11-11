'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & ATS Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground font-black text-xs tracking-tighter shadow-sm">
              AI
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-foreground group-hover:opacity-80 transition-opacity">
                ScreenAI
              </span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-muted text-muted-foreground border">
                ATS
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1 border-l pl-5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-secondary text-secondary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-foreground' : 'text-muted-foreground'} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Health Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md border bg-muted/30 text-[11px] font-mono text-muted-foreground">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBackendHealthy === null
                  ? 'bg-amber-500 animate-pulse'
                  : isBackendHealthy
                  ? 'bg-emerald-500'
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

          {/* Dark / Light Mode Toggle */}
          <ThemeToggle />

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

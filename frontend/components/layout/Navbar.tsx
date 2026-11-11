'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

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
    <header className="sticky top-0 z-40 w-full border-b border-[#1f1f28] bg-[#020203]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF5729] to-[#b3340f] flex items-center justify-center shadow-lg shadow-[#FF5729]/20 group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                GFI Resume Screener
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#FF5729]/15 text-[#FF5729] border border-[#FF5729]/30">
                  Dual-Role
                </span>
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#14141a] text-white border border-[#272733]'
                      : 'text-[#8B8D98] hover:text-white hover:bg-[#0d0d11]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Health Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono border border-[#1f1f28] bg-[#0d0d11]">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendHealthy === null
                  ? 'bg-amber-400 animate-pulse'
                  : isBackendHealthy
                  ? 'bg-emerald-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-[#8B8D98]">
              {isBackendHealthy === null
                ? 'Connecting...'
                : isBackendHealthy
                ? 'Backend Online'
                : 'Backend Offline'}
            </span>
          </div>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#FF5729] hover:bg-[#E0481D] text-white text-sm font-medium transition-all shadow-md shadow-[#FF5729]/25 hover:shadow-lg active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload Resume</span>
          </button>
        </div>
      </div>
    </header>
  );
}


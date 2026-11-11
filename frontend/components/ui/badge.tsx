import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'info';
}

export function Badge({
  className = '',
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-tight transition-colors';

  const variants = {
    default: 'bg-zinc-800 text-zinc-200 border border-zinc-700/60',
    secondary: 'bg-zinc-900 text-zinc-400 border border-zinc-800',
    outline: 'text-zinc-300 border border-zinc-700/80',
    success: 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60',
    warning: 'bg-amber-950/40 text-amber-300 border border-amber-800/60',
    destructive: 'bg-rose-950/40 text-rose-300 border border-rose-800/60',
    info: 'bg-blue-950/40 text-blue-300 border border-blue-800/60',
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}


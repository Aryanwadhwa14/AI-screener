import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      default: 'bg-[#FF5729] text-white hover:bg-[#E0481D] shadow-sm',
      secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/60',
      outline: 'border border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-200 hover:text-white',
      ghost: 'hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-100',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
      subtle: 'bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 border border-zinc-800',
    };

    const sizes = {
      default: 'h-8 px-3.5 py-1.5',
      sm: 'h-7 px-2.5 text-[11px]',
      lg: 'h-10 px-5 text-sm',
      icon: 'h-8 w-8 p-0',
    };

    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';


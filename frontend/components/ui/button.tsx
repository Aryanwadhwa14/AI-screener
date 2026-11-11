import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      default: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 shadow-sm font-semibold',
      secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700/80 border border-zinc-700/50',
      outline: 'border border-zinc-800 bg-transparent hover:bg-zinc-900 hover:text-zinc-100 text-zinc-300',
      ghost: 'hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-100',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
      subtle: 'bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 border border-zinc-800/80',
    };

    const sizes = {
      default: 'h-8 px-3 py-1.5',
      sm: 'h-7 px-2.5 text-[11px]',
      lg: 'h-9 px-4 text-xs',
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

import * as React from 'react';

export function Progress({
  value = 0,
  max = 100,
  className = '',
  indicatorClassName = '',
}: {
  value?: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={`relative h-2 w-full overflow-hidden rounded-full bg-zinc-800 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div
        className={`h-full w-full flex-1 bg-zinc-200 transition-all duration-300 ${indicatorClassName}`}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
}


'use client';

import * as React from 'react';

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({
  value,
  onValueChange,
  defaultValue,
  children,
  className = '',
}: {
  value?: string;
  onValueChange?: (val: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const activeValue = value !== undefined ? value : internalValue;
  const handleChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleChange }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900/80 p-1 text-zinc-400 border border-zinc-800 ${className}`}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className = '',
  disabled = false,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used inside Tabs');
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => ctx.onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? 'bg-zinc-800 text-zinc-100 shadow-sm'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className = '',
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used inside Tabs');
  if (ctx.value !== value) return null;

  return <div className={`mt-3 focus-visible:outline-none ${className}`}>{children}</div>;
}


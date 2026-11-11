import * as React from 'react';

export function Table({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={`w-full caption-bottom text-xs text-left ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`[&_tr]:border-b border-zinc-800 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-b border-zinc-800/60 transition-colors hover:bg-zinc-800/40 data-[state=selected]:bg-zinc-800/60 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className = '', children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`h-9 px-3 text-left align-middle font-medium text-zinc-400 [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ className = '', children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`p-3 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>
      {children}
    </td>
  );
}


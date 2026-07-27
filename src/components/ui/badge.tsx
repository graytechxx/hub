import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-indigo-100 text-indigo-800 border-indigo-200',
    secondary: 'border-transparent bg-zinc-100 text-zinc-800 border-zinc-200',
    destructive: 'border-transparent bg-rose-100 text-rose-800 border-rose-200',
    outline: 'text-zinc-700 border-zinc-300',
    success: 'border-transparent bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'border-transparent bg-amber-100 text-amber-800 border-amber-200',
    info: 'border-transparent bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };

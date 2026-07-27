import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border cursor-pointer';

    const variants = {
      default: 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-xs',
      destructive: 'bg-rose-600 text-white border-transparent hover:bg-rose-700 shadow-xs',
      outline: 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 shadow-2xs',
      secondary: 'bg-zinc-100 text-zinc-900 border-zinc-200 hover:bg-zinc-200',
      ghost: 'border-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
      link: 'border-transparent text-indigo-600 underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-6 text-sm',
      icon: 'h-8 w-8 p-0',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };

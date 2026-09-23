import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-hover',
      secondary: 'bg-canvas text-graphite-900 border border-border hover:bg-card',
      outline: 'border border-primary text-primary hover:bg-primary/10',
      ghost: 'text-graphite-600 hover:bg-canvas hover:text-graphite-900',
      danger: 'bg-red-500 text-white hover:bg-red-600',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 h-[38px] px-4 py-2',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

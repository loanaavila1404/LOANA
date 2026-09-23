import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && <label className="text-sm font-medium text-graphite-900">{label}</label>}
        <input
          type={type}
          className={cn(
            'flex h-[38px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

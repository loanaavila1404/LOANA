import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && <label className="text-sm font-medium text-graphite-900">{label}</label>}
        <select
          className={cn(
            'flex h-[38px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-graphite-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';

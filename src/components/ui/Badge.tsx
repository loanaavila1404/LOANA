import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-canvas text-graphite-900 border border-border',
      success: 'bg-green-100 text-green-800 border border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      danger: 'bg-red-100 text-red-800 border border-red-200',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold h-[22px] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

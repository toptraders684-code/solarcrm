import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple';
}

const variantClasses: Record<string, string> = {
  default: 'bg-primary/10 text-primary',
  secondary: 'bg-surface-container text-on-surface-variant',
  destructive: 'bg-error/10 text-error',
  outline: 'border border-outline-variant text-on-surface-variant',
  success: 'bg-primary/10 text-primary',
  warning: 'bg-tertiary-container/30 text-on-tertiary-container',
  info: 'bg-secondary-container text-on-secondary-fixed-variant',
  purple: 'bg-purple-100 text-purple-700',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export const badgeVariants = (opts?: { variant?: string }) =>
  cn(
    'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
    variantClasses[opts?.variant ?? 'default']
  );

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const variants: Record<string, string> = {
      primary: 'signature-gradient text-white shadow-md hover:opacity-90 hover:shadow-lg',
      secondary: 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high',
      ghost: 'text-on-surface-variant hover:bg-surface-container',
      danger: 'bg-error/10 text-error hover:bg-error hover:text-white',
      outline: 'border border-outline-variant text-on-surface-variant hover:bg-surface-container',
    };

    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-8 py-3 text-sm',
      icon: 'h-9 w-9',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant!], sizes[size!], className)}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// Re-export buttonVariants stub for compat
export const buttonVariants = (_opts?: unknown) => '';

import { cn } from '@/lib/utils';
import { toTitleCase } from '@/utils/formatters';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'purple';

const STATUS_MAP: Record<string, BadgeVariant> = {
  new: 'info',
  in_progress: 'warning',
  converted: 'success',
  closed: 'secondary',
  pending_approval: 'warning',
  active: 'success',
  inactive: 'secondary',
  approved: 'success',
  rejected: 'destructive',
  uploaded: 'success',
  pending: 'warning',
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary',
  secondary: 'bg-surface-container text-on-surface-variant',
  destructive: 'bg-error/10 text-error',
  success: 'bg-primary/10 text-primary',
  warning: 'bg-tertiary-container/30 text-on-tertiary-container',
  info: 'bg-secondary-container text-on-secondary-fixed-variant',
  purple: 'bg-purple-100 text-purple-700',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = STATUS_MAP[status] ?? 'secondary';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
        variantClasses[variant],
        className
      )}
    >
      {toTitleCase(status)}
    </span>
  );
}

import { Badge } from '@/components/ui/badge';
import { toTitleCase } from '@/utils/formatters';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple';

const STATUS_MAP: Record<string, BadgeVariant> = {
  // Lead statuses
  new: 'info',
  in_progress: 'warning',
  converted: 'success',
  closed: 'secondary',
  // User statuses
  pending_approval: 'warning',
  active: 'success',
  inactive: 'secondary',
  // Transaction statuses
  approved: 'success',
  rejected: 'destructive',
  // Document statuses
  uploaded: 'success',
  pending: 'warning',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = STATUS_MAP[status] ?? 'secondary';
  return (
    <Badge variant={variant} className={className}>
      {toTitleCase(status)}
    </Badge>
  );
}

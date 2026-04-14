import { cn } from '@/lib/utils';

interface PageWrapperProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ title, subtitle, actions, children, className }: PageWrapperProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface font-headline">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-on-surface-variant/70">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

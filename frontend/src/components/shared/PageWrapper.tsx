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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

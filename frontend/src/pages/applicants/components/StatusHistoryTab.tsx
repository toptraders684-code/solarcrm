import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { applicantsService } from '@/services/applicants.service';
import { formatDate } from '@/utils/formatters';

interface StatusHistoryTabProps { applicantId: string; }

export function StatusHistoryTab({ applicantId }: StatusHistoryTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['status-history', applicantId],
    queryFn: () => applicantsService.getStatusHistory(applicantId),
  });

  const history = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-surface-container-low animate-pulse" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/40 gap-3">
        <Clock size={36} className="opacity-30" />
        <p className="text-sm font-semibold">No status updates yet</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-2">
      {history.map((entry, idx) => (
        <div
          key={entry.id}
          className="flex items-center gap-4 rounded-xl border border-surface-container-low px-5 py-3.5 bg-surface-container-lowest"
        >
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-primary' : 'bg-on-surface-variant/30'}`} />
            {idx < history.length - 1 && <div className="w-px h-4 bg-surface-container-low" />}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-bold ${idx === 0 ? 'text-primary' : 'text-on-surface'}`}>
              {entry.status}
            </span>
            {idx === 0 && (
              <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-primary/60 bg-primary/10 px-1.5 py-0.5 rounded">
                Current
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
            <span className="text-xs font-semibold text-on-surface-variant/70">{entry.changedBy?.name ?? '—'}</span>
            <span className="text-[11px] text-on-surface-variant/50">{formatDate(entry.changedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

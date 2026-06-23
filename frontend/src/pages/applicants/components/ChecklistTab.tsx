import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { applicantsService } from '@/services/applicants.service';
import { formatDate } from '@/utils/formatters';
import type { ApplicantChecklist, Applicant } from '@/types';
import { useAuthStore } from '@/store/authStore';

interface ChecklistTabProps { applicantId: string; applicant: Applicant; focusStage?: number; }

export function ChecklistTab({ applicantId, applicant, focusStage }: ChecklistTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const discom = applicant.discom ?? '';
  const projectType = applicant.projectType ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['applicant-checklist', applicantId, discom, projectType],
    queryFn: () => applicantsService.getChecklist(applicantId, discom, projectType),
  });

  const items = data?.data ?? [];

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) =>
      applicantsService.updateChecklistItem(applicantId, itemId, { isCompleted }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicant-checklist', applicantId] }),
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed to update checklist'),
  });

  const canEdit = user && ['admin', 'operations_staff', 'field_technician'].includes(user.role);

  const grouped = items.reduce((acc: Record<string, ApplicantChecklist[]>, item) => {
    const phase = item.masterItem?.phaseName ?? 'General';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(item);
    return acc;
  }, {});

  const phaseDisplayOrder = (phaseItems: ApplicantChecklist[]) =>
    phaseItems[0]?.masterItem?.phaseOrder ?? 99;

  const completedCount = items.filter((i) => i.isCompleted).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Expand the phase for focusStage when data loads (or focusStage changes)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const togglePhase = (phase: string) =>
    setExpanded((prev) => ({ ...prev, [phase]: !prev[phase] }));

  const stageToFocus = focusStage ?? applicant.stage;
  const prevFocusRef = useRef<number | null>(null);
  useEffect(() => {
    if (items.length === 0) return;
    if (prevFocusRef.current === stageToFocus) return;
    prevFocusRef.current = stageToFocus;
    const phasesToOpen: Record<string, boolean> = {};
    items.forEach((item) => {
      if (item.masterItem?.phaseOrder === stageToFocus) {
        phasesToOpen[item.masterItem.phaseName ?? 'General'] = true;
      }
    });
    if (Object.keys(phasesToOpen).length > 0) {
      setExpanded((prev) => ({ ...prev, ...phasesToOpen }));
    }
  }, [items, stageToFocus]);

  return (
    <div className="space-y-4">
      {/* Fixed DISCOM + Project Type — set from lead, not editable here */}
      <div className="bg-surface-container-lowest rounded-xl px-4 py-3 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">DISCOM</span>
          <span className="text-xs font-semibold text-on-surface">{discom ? discom.toUpperCase() : '—'}</span>
        </div>
        <div className="h-4 w-px bg-outline-variant/20" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">Project Type</span>
          <span className="text-xs font-semibold text-on-surface capitalize">{projectType || '—'}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-surface-container-lowest rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-on-surface">{completedCount} / {totalCount} completed</span>
                <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full signature-gradient rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {Object.entries(grouped).sort(([, a], [, b]) => phaseDisplayOrder(a) - phaseDisplayOrder(b)).map(([phase, phaseItems]) => {
            const sorted = [...phaseItems].sort(
              (a, b) => (a.masterItem?.itemOrder ?? 0) - (b.masterItem?.itemOrder ?? 0)
            );
            const phaseDone  = sorted.filter((i) => i.isCompleted).length;
            const phaseTotal = sorted.length;
            const phaseProgress = phaseTotal > 0 ? (phaseDone / phaseTotal) * 100 : 0;
            const isOpen = !!expanded[phase];

            return (
              <div key={phase} className="rounded-xl border border-surface-container-low overflow-hidden">
                {/* Phase header — clickable to collapse */}
                <button
                  onClick={() => togglePhase(phase)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-surface-container-lowest hover:bg-surface-container transition-colors"
                >
                  <span className="flex-shrink-0 text-on-surface-variant/50">
                    {isOpen
                      ? <ChevronDown size={16} />
                      : <ChevronRight size={16} />}
                  </span>
                  <span className="flex-1 text-left text-[11px] font-black uppercase tracking-widest text-on-surface-variant/70">
                    {phase}
                  </span>
                  {/* Per-phase progress bar + count */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full signature-gradient rounded-full transition-all"
                          style={{ width: `${phaseProgress}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${phaseDone === phaseTotal ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                      {phaseDone}/{phaseTotal}
                    </span>
                    {phaseDone === phaseTotal && phaseTotal > 0 && (
                      <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Phase items */}
                {isOpen && (
                  <div className="px-4 py-3 space-y-2 bg-surface/50">
                    {sorted.map((item) => (
                      <div
                        key={item.masterItemId}
                        className={`flex items-start gap-3 p-4 rounded-xl transition-all ${
                          item.isCompleted
                            ? 'bg-primary/5 border border-primary/20'
                            : 'bg-surface-container-lowest border border-surface-container-low hover:border-primary/20'
                        }`}
                      >
                        <button
                          disabled={!canEdit || toggleMutation.isPending}
                          onClick={() =>
                            toggleMutation.mutate({
                              itemId: item.masterItemId,
                              isCompleted: !item.isCompleted,
                            })
                          }
                          className="mt-0.5 flex-shrink-0"
                        >
                          {item.isCompleted
                            ? <CheckCircle2 size={18} className="text-primary" />
                            : <Circle size={18} className="text-on-surface-variant/30 hover:text-on-surface-variant" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${item.isCompleted ? 'text-on-surface-variant/50 line-through' : 'text-on-surface'}`}>
                            {item.masterItem?.itemText}
                            {item.masterItem?.isMandatory && (
                              <span className="ml-1 text-error text-xs no-underline not-italic">*</span>
                            )}
                          </p>
                          {item.isCompleted && item.completedAt && (
                            <p className="text-xs text-on-surface-variant/50 mt-0.5">
                              Completed {formatDate(item.completedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {items.length === 0 && (
            <p className="text-sm text-on-surface-variant/50 text-center py-8">
              No checklist items found for {discom.toUpperCase()} / {projectType}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

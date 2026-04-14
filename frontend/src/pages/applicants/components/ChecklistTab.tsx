import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applicantsService } from '@/services/applicants.service';
import { formatDate } from '@/utils/formatters';
import type { ApplicantChecklist, Applicant } from '@/types';
import { useAuthStore } from '@/store/authStore';

const DISCOMS = ['tpcodl', 'tpnodl', 'tpsodl', 'tpwodl'];
const PROJECT_TYPES = ['residential', 'commercial'];

interface ChecklistTabProps { applicantId: string; applicant: Applicant; }

export function ChecklistTab({ applicantId, applicant }: ChecklistTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [selectedDiscom, setSelectedDiscom] = useState<string>(applicant.discom ?? 'tpcodl');
  const [selectedProjectType, setSelectedProjectType] = useState<string>(applicant.projectType ?? 'residential');

  const { data, isLoading } = useQuery({
    queryKey: ['applicant-checklist', applicantId, selectedDiscom, selectedProjectType],
    queryFn: () => applicantsService.getChecklist(applicantId, selectedDiscom, selectedProjectType),
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

  const completedCount = items.filter((i) => i.isCompleted).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* DISCOM + Project Type selector */}
      <div className="bg-surface-container-lowest rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest whitespace-nowrap">DISCOM</span>
          <Select value={selectedDiscom} onValueChange={setSelectedDiscom}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DISCOMS.map((d) => <SelectItem key={d} value={d} className="text-xs">{d.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest whitespace-nowrap">Project Type</span>
          <Select value={selectedProjectType} onValueChange={setSelectedProjectType}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-xs text-on-surface-variant/60">
          Checklist for <strong className="text-on-surface">{selectedDiscom.toUpperCase()}</strong> / <strong className="text-on-surface capitalize">{selectedProjectType}</strong>
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

          {Object.entries(grouped).map(([phase, phaseItems]) => (
            <div key={phase}>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-3">{phase}</p>
              <div className="space-y-2">
                {[...phaseItems]
                  .sort((a, b) => (a.masterItem?.itemOrder ?? 0) - (b.masterItem?.itemOrder ?? 0))
                  .map((item) => (
                    <div key={item.masterItemId} className={`flex items-start gap-3 p-4 rounded-xl transition-all ${item.isCompleted ? 'bg-primary/5 border border-primary/20' : 'bg-surface-container-lowest border border-surface-container-low hover:border-primary/20'}`}>
                      <button
                        disabled={!canEdit || toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate({ itemId: item.masterItemId, isCompleted: !item.isCompleted })}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {item.isCompleted
                          ? <CheckCircle2 size={18} className="text-primary" />
                          : <Circle size={18} className="text-on-surface-variant/30 hover:text-on-surface-variant" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${item.isCompleted ? 'text-on-surface-variant/50 line-through' : 'text-on-surface'}`}>
                          {item.masterItem?.itemText}
                          {item.masterItem?.isMandatory && <span className="ml-1 text-error text-xs no-underline not-italic">*</span>}
                        </p>
                        {item.isCompleted && item.completedAt && (
                          <p className="text-xs text-on-surface-variant/50 mt-0.5">Completed {formatDate(item.completedAt)}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-sm text-on-surface-variant/50 text-center py-8">
              No checklist items found for {selectedDiscom.toUpperCase()} / {selectedProjectType}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

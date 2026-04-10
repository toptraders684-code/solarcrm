import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { applicantsService } from '@/services/applicants.service';
import { formatDate } from '@/utils/formatters';
import type { ApplicantChecklist, Applicant } from '@/types';
import { useAuthStore } from '@/store/authStore';

const DISCOMS = ['tpcodl', 'tpnodl', 'tpsodl', 'tpwodl'];
const PROJECT_TYPES = ['residential', 'commercial'];

interface ChecklistTabProps {
  applicantId: string;
  applicant: Applicant;
}

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-checklist', applicantId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || 'Failed to update checklist');
    },
  });

  const canEdit = user && ['admin', 'operations_staff', 'field_technician'].includes(user.role);

  // Group by phase
  const grouped = items.reduce((acc: Record<string, ApplicantChecklist[]>, item) => {
    const phase = item.masterItem?.phaseName ?? 'General';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(item);
    return acc;
  }, {});

  const completedCount = items.filter((i) => i.isCompleted).length;
  const totalCount = items.length;

  return (
    <div className="space-y-4">
      {/* DISCOM + Project Type selector */}
      <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">DISCOM</Label>
          <Select value={selectedDiscom} onValueChange={setSelectedDiscom}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISCOMS.map((d) => (
                <SelectItem key={d} value={d} className="text-xs">
                  {d.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Project Type</Label>
          <Select value={selectedProjectType} onValueChange={setSelectedProjectType}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs capitalize">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center text-xs text-muted-foreground">
          Showing checklist for <span className="font-semibold mx-1 text-foreground">{selectedDiscom.toUpperCase()}</span> / <span className="font-semibold mx-1 text-foreground capitalize">{selectedProjectType}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-between bg-brand-50 rounded-lg p-3">
            <span className="text-sm font-medium text-brand-700">
              {completedCount} / {totalCount} items completed
            </span>
            <div className="h-2 w-40 bg-brand-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {Object.entries(grouped).map(([phase, phaseItems]) => (
            <div key={phase}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{phase}</h3>
              <div className="space-y-2">
                {[...phaseItems]
                  .sort((a, b) => (a.masterItem?.itemOrder ?? 0) - (b.masterItem?.itemOrder ?? 0))
                  .map((item) => (
                    <div
                      key={item.masterItemId}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        item.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <button
                        disabled={!canEdit || toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate({ itemId: item.masterItemId, isCompleted: !item.isCompleted })}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {item.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                          {item.masterItem?.itemText}
                          {item.masterItem?.isMandatory && (
                            <span className="ml-1 text-xs text-red-500 no-underline">*</span>
                          )}
                        </p>
                        {item.isCompleted && item.completedAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Completed {formatDate(item.completedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No checklist items found for {selectedDiscom.toUpperCase()} / {selectedProjectType}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

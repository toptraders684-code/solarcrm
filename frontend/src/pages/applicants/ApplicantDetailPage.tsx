import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Pencil, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StageProgressBar } from './components/StageProgressBar';
import { DocumentsTab } from './components/DocumentsTab';
import { ChecklistTab } from './components/ChecklistTab';
import { FinanceTab } from './components/FinanceTab';
import { DiscomTab } from './components/DiscomTab';
import { ProcurementTab } from './components/ProcurementTab';
import { DetailsTab } from './components/DetailsTab';
import { EditApplicantSheet } from './components/EditApplicantSheet';
import { StatusHistoryTab } from './components/StatusHistoryTab';
import { applicantsService } from '@/services/applicants.service';
import { formatDate, getStageName, toTitleCase, formatCapacity } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

const PROJECT_STATUSES = [
  'Active',
  'On Hold',
  'Material Ordered',
  'Installation Scheduled',
  'Installation Complete',
  'Inspection Pending',
  'Subsidy Pending',
  'Completed',
  'Cancelled',
];

export default function ApplicantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [pendingStatus, setPendingStatus] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['applicant', id],
    queryFn: () => applicantsService.getApplicant(id!),
    enabled: !!id,
  });

  const applicant = data?.data;

  // Required data fields that must be filled before advancing each stage
  const STAGE_REQUIRED: Record<number, { field: string; label: string }[]> = {
    3: [{ field: 'portalApplicationDate', label: 'Portal Application Date' }],
    4: [{ field: 'mrtDate', label: 'MRT Date' }],
    5: [{ field: 'inspectionDate', label: 'Inspection Date' }, { field: 'inspectionResult', label: 'Inspection Result' }],
    7: [{ field: 'discomRefNo', label: 'DISCOM Reference No.' }],
    9: [{ field: 'netMeterSerialNo', label: 'Net Meter Serial No.' }],
  };
  const missingFields = applicant
    ? (STAGE_REQUIRED[applicant.stage] ?? []).filter((r) => !(applicant as any)[r.field])
    : [];

  // Stage 1→2 needs Site Survey checklist (phaseOrder 2); stage 2→3 needs Document Collection (phaseOrder 1); others align directly
  const STAGE_TO_PHASE: Record<number, number> = { 1: 2, 2: 1 };
  const checklistPhase = applicant ? (STAGE_TO_PHASE[applicant.stage] ?? applicant.stage) : 0;

  // Fetch checklist to know mandatory incomplete items for the current stage
  const { data: checklistData } = useQuery({
    queryKey: ['applicant-checklist', id, applicant?.discom, applicant?.projectType],
    queryFn: () => applicantsService.getChecklist(id!, applicant!.discom, applicant!.projectType),
    enabled: !!applicant,
  });
  const mandatoryIncomplete = (checklistData?.data ?? []).filter(
    (item) => item.masterItem?.isMandatory && item.masterItem?.phaseOrder === checklistPhase && !item.isCompleted
  );

  // Which tab to focus when an advance error points to specific fields/checklist
  const DISCOM_FIELD_LABELS = ['Portal Application Date', 'MRT Date', 'Inspection Date', 'Inspection Result', 'DISCOM Reference No.', 'Net Meter Serial No.'];

  const statusMutation = useMutation({
    mutationFn: (status: string) => applicantsService.updateProjectStatus(id!, status),
    onSuccess: (_, status) => {
      toast.success(`Status updated to "${status}"`);
      queryClient.invalidateQueries({ queryKey: ['applicant', id] });
      queryClient.invalidateQueries({ queryKey: ['status-history', id] });
      setPendingStatus('');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const advanceMutation = useMutation({
    mutationFn: () => applicantsService.advanceStage(id!),
    onSuccess: () => {
      toast.success(`Advanced to: ${getStageName((applicant?.stage ?? 0) + 1)}`);
      queryClient.invalidateQueries({ queryKey: ['applicant', id] });
      setAdvanceOpen(false);
    },
    onError: (err: any) => {
      const raw = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? '';
      const errText: string = Array.isArray(raw) ? raw[0] : raw;
      const stageName = getStageName(applicant?.stage ?? 0);
      const nextName  = getStageName((applicant?.stage ?? 0) + 1);

      let userMsg = errText;
      let targetTab = 'checklist';

      if (errText.includes('Fill in required fields') || DISCOM_FIELD_LABELS.some((f) => errText.includes(f))) {
        userMsg = `To advance to "${nextName}", fill in: ${errText.replace('Fill in required fields before advancing: ', '')}`;
        targetTab = 'discom';
      } else if (errText.includes('checklist')) {
        userMsg = `Complete all mandatory checklist items for "${stageName}" before advancing to "${nextName}".`;
        targetTab = 'checklist';
      } else if (errText.includes('final stage')) {
        userMsg = 'This project is already at the final stage.';
      } else if (errText) {
        userMsg = errText;
      } else {
        userMsg = `Cannot advance from "${stageName}" — check required fields and checklist.`;
      }

      toast.error(userMsg, { duration: 6000 });
      setAdvanceOpen(false);
      setActiveTab(targetTab);
    },
  });

  if (isLoading) {
    return (
      <PageWrapper title="Project Details">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </PageWrapper>
    );
  }

  if (!applicant) return null;

  const canAdvance = user && ['admin', 'operations_staff'].includes(user.role) && applicant.stage < 11;
  const canEdit = user && ['admin', 'operations_staff'].includes(user.role);

  return (
    <PageWrapper
      title={applicant.customerName}
      subtitle={`Project Code: ${applicant.applicantCode}`}
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/applicants')}>
            <ArrowLeft size={14} />Back
          </Button>
          {canEdit && (
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil size={14} />Edit Details
            </Button>
          )}
          {canAdvance && (
            <Button size="sm" onClick={() => setAdvanceOpen(true)}>
              <ChevronRight size={14} />Advance Stage
            </Button>
          )}
        </div>
      }
    >
      {/* Stage Progress Bar */}
      <StageProgressBar currentStage={applicant.stage} />

      {/* Meta info strip */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-fixed-variant rounded-lg text-xs font-bold uppercase">
          {applicant.discom.toUpperCase()}
        </span>
        <span className="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-lg text-xs font-semibold capitalize">
          {applicant.projectType}
        </span>
        {applicant.systemCapacityKw && (
          <span className="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-lg text-xs font-semibold">
            {formatCapacity(applicant.systemCapacityKw)}
          </span>
        )}
        <span className="text-xs text-on-surface-variant/60">Assigned: {applicant.assignedStaff?.name ?? '—'}</span>
        <span className="text-xs text-on-surface-variant/60">Stage updated: {formatDate(applicant.stageUpdatedAt)}</span>

        {/* Status update — pushed to right */}
        <div className="ml-auto flex items-center gap-2">
          {applicant.projectStatus && !pendingStatus && (
            <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">
              {applicant.projectStatus}
            </span>
          )}
          {canEdit && (
            <>
              <Select
                value={pendingStatus || applicant.projectStatus || ''}
                onValueChange={setPendingStatus}
              >
                <SelectTrigger className="h-8 text-xs w-48">
                  <SelectValue placeholder="Set project status…" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!pendingStatus || pendingStatus === applicant.projectStatus || statusMutation.isPending}
                loading={statusMutation.isPending}
                onClick={() => pendingStatus && statusMutation.mutate(pendingStatus)}
              >
                Update
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="discom">DISCOM Application</TabsTrigger>
          <TabsTrigger value="procurement">Procurement</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="status-history">Status History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <DetailsTab applicant={applicant} />
        </TabsContent>

        <TabsContent value="discom" className="mt-4">
          <DiscomTab applicant={applicant} />
        </TabsContent>

        <TabsContent value="procurement" className="mt-4">
          <ProcurementTab applicant={applicant} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsTab applicantId={id!} discom={applicant.discom} applicant={applicant} />
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          <ChecklistTab applicantId={id!} applicant={applicant} focusStage={checklistPhase} />
        </TabsContent>

        <TabsContent value="finance" className="mt-4">
          <FinanceTab applicantId={id!} />
        </TabsContent>

        <TabsContent value="status-history" className="mt-4">
          <StatusHistoryTab applicantId={id!} />
        </TabsContent>
      </Tabs>

      <EditApplicantSheet open={editOpen} onOpenChange={setEditOpen} applicant={applicant} />

      <ConfirmDialog
        open={advanceOpen}
        onOpenChange={setAdvanceOpen}
        title={`Advance to Stage ${(applicant.stage ?? 0) + 1}: ${getStageName(applicant.stage + 1)}?`}
        description={
          <div className="space-y-3 text-sm">
            <p className="text-on-surface-variant">
              Moving from <strong>{getStageName(applicant.stage)}</strong> → <strong>{getStageName(applicant.stage + 1)}</strong>
            </p>
            {(missingFields.length > 0 || mandatoryIncomplete.length > 0) ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-black uppercase tracking-widest text-error/80">Blocking items</p>
                {missingFields.map((f) => (
                  <div key={f.field} className="flex items-center gap-2 text-error text-xs font-medium">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{f.label} not filled — go to <strong>DISCOM Application</strong> tab</span>
                  </div>
                ))}
                {mandatoryIncomplete.map((item) => (
                  <div key={item.masterItemId} className="flex items-center gap-2 text-error text-xs font-medium">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{item.masterItem?.itemText} — go to <strong>Checklist</strong> tab</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                <CheckCircle2 size={13} className="shrink-0" />
                All required fields and mandatory checklist items are complete.
              </div>
            )}
          </div>
        }
        confirmLabel="Advance Stage"
        confirmDisabled={missingFields.length > 0 || mandatoryIncomplete.length > 0}
        onConfirm={() => advanceMutation.mutate()}
        loading={advanceMutation.isPending}
      />
    </PageWrapper>
  );
}

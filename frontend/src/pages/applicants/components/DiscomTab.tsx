import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, X, Save, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { applicantsService } from '@/services/applicants.service';
import { formatDate, getStageName } from '@/utils/formatters';
import type { Applicant } from '@/types';
import { useAuthStore } from '@/store/authStore';

function sv(v: string | undefined | null): string | undefined { return v || undefined; }

const STAGE_GUIDANCE: Record<number, { title: string; nextLabel: string; fields: string[] }> = {
  3: { title: 'Documents collected — ready to submit portal application?', nextLabel: 'Mark Portal Application Submitted (→ Stage 4)', fields: ['portalApplicationDate'] },
  4: { title: 'Portal application submitted — has MRT been completed?', nextLabel: 'Mark MRT Done (→ Stage 5)', fields: ['mrtDate'] },
  5: { title: 'MRT done — has JE inspection been completed?', nextLabel: 'Mark JE Inspection Done (→ Stage 6)', fields: ['inspectionDate', 'inspectionResult'] },
  6: { title: 'JE inspection done — has DISCOM approval been received?', nextLabel: 'Mark Approval Received (→ Stage 7)', fields: [] },
  7: { title: 'DISCOM approval received — ready to procure material?', nextLabel: 'Mark Material Procurement Started (→ Stage 8)', fields: ['discomRefNo'] },
  9: { title: 'Installation done — has net meter been applied?', nextLabel: 'Mark Net Meter Applied (→ Stage 10)', fields: ['netMeterSerialNo'] },
};

const REQUIRED_FIELD_LABELS: Record<string, string> = {
  portalApplicationDate: 'Portal Application Date',
  mrtDate: 'MRT Date',
  inspectionDate: 'Inspection Date',
  inspectionResult: 'Inspection Result',
  netMeterSerialNo: 'Net Meter Serial No.',
  discomRefNo: 'DISCOM Reference No.',
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-surface-container-low last:border-0">
      <span className="text-xs text-on-surface-variant/60 font-medium">{label}</span>
      <span className="text-sm font-semibold text-on-surface text-right">{children || '—'}</span>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

interface DiscomTabProps { applicant: Applicant; }

export function DiscomTab({ applicant }: DiscomTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [advanceOpen, setAdvanceOpen] = useState(false);

  const canEdit = user && ['admin', 'operations_staff'].includes(user.role);
  const guidance = STAGE_GUIDANCE[applicant.stage];

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const startEdit = () => {
    setForm({
      portalApplicationDate: applicant.portalApplicationDate ? applicant.portalApplicationDate.slice(0, 10) : '',
      jeName: applicant.jeName ?? '',
      jeContact: applicant.jeContact ?? '',
      mrtDate: applicant.mrtDate ? applicant.mrtDate.slice(0, 10) : '',
      inspectionDate: applicant.inspectionDate ? applicant.inspectionDate.slice(0, 10) : '',
      inspectionResult: applicant.inspectionResult ?? '',
      netMeterSerialNo: applicant.netMeterSerialNo ?? '',
      discomRefNo: applicant.discomRefNo ?? '',
    });
    setEditing(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = {};
      Object.entries(form).forEach(([k, v]) => { payload[k] = v === '' ? null : v; });
      return applicantsService.updateApplicant(applicant.id, payload as any);
    },
    onSuccess: () => {
      toast.success('DISCOM Application details saved');
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      setEditing(false); setForm({});
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to save'),
  });

  const advanceMutation = useMutation({
    mutationFn: () => applicantsService.advanceStage(applicant.id),
    onSuccess: () => {
      toast.success(`Advanced to: ${getStageName(applicant.stage + 1)}`);
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      setAdvanceOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Cannot advance — check mandatory checklist items');
      setAdvanceOpen(false);
    },
  });

  const missingFields = guidance?.fields.filter((f) => !(applicant as any)[f]) ?? [];

  return (
    <div className="space-y-4">
      {/* Stage Action Panel */}
      {guidance && canEdit && applicant.stage < 11 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold uppercase mb-2 inline-block">
                Stage {applicant.stage} — {getStageName(applicant.stage)}
              </span>
              <p className="text-sm text-on-surface font-medium">{guidance.title}</p>
              {missingFields.length > 0 && (
                <div className="mt-2 space-y-1">
                  {missingFields.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-on-surface-variant/70">
                      <Circle size={10} />
                      <span>Fill in <strong>{REQUIRED_FIELD_LABELS[f]}</strong> before advancing</span>
                    </div>
                  ))}
                </div>
              )}
              {missingFields.length === 0 && guidance.fields.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-primary mt-1">
                  <CheckCircle2 size={11} />
                  <span>Required fields filled — ready to advance</span>
                </div>
              )}
            </div>
            <Button size="sm" onClick={() => setAdvanceOpen(true)} disabled={advanceMutation.isPending} className="shrink-0">
              <ChevronRight size={14} />{guidance.nextLabel}
            </Button>
          </div>
        </div>
      )}

      {/* DISCOM Details */}
      <div className="bg-surface-container-lowest rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">DISCOM Portal Application</h4>
          {canEdit && !editing && (
            <Button size="sm" variant="secondary" onClick={startEdit}><Pencil size={12} />Edit</Button>
          )}
          {editing && (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setEditing(false); setForm({}); }} disabled={saveMutation.isPending}>
                <X size={12} />Cancel
              </Button>
              <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
                <Save size={12} />Save
              </Button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <F label="Portal Application Date"><Input type="date" value={form.portalApplicationDate ?? ''} onChange={(e) => set('portalApplicationDate', e.target.value)} /></F>
            <F label="JE Name"><Input value={form.jeName ?? ''} onChange={(e) => set('jeName', e.target.value)} placeholder="Junior Engineer name" /></F>
            <F label="JE Contact"><Input maxLength={10} value={form.jeContact ?? ''} onChange={(e) => set('jeContact', e.target.value)} placeholder="10-digit mobile" /></F>
            <F label="MRT Date"><Input type="date" value={form.mrtDate ?? ''} onChange={(e) => set('mrtDate', e.target.value)} /></F>
            <F label="Inspection Date"><Input type="date" value={form.inspectionDate ?? ''} onChange={(e) => set('inspectionDate', e.target.value)} /></F>
            <F label="Inspection Result">
              <Select value={sv(form.inspectionResult)} onValueChange={(v) => set('inspectionResult', v)}>
                <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <div className="md:col-span-2">
              <F label="DISCOM Reference No. (Approval Ref)"><Input value={form.discomRefNo ?? ''} onChange={(e) => set('discomRefNo', e.target.value)} placeholder="e.g. TPCODL/2024/001234" /></F>
            </div>
            <div className="md:col-span-2">
              <F label="Net Meter Serial No."><Input value={form.netMeterSerialNo ?? ''} onChange={(e) => set('netMeterSerialNo', e.target.value)} placeholder="e.g. NM-2024-001234" /></F>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow label="Portal Application Date">
              {applicant.portalApplicationDate ? <span className="text-primary">{formatDate(applicant.portalApplicationDate)}</span> : null}
            </InfoRow>
            <InfoRow label="JE Name">{applicant.jeName}</InfoRow>
            <InfoRow label="JE Contact">{applicant.jeContact}</InfoRow>
            <InfoRow label="MRT Date">
              {applicant.mrtDate ? <span className="text-primary">{formatDate(applicant.mrtDate)}</span> : null}
            </InfoRow>
            <InfoRow label="Inspection Date">
              {applicant.inspectionDate ? <span className="text-primary">{formatDate(applicant.inspectionDate)}</span> : null}
            </InfoRow>
            <InfoRow label="Inspection Result">
              {applicant.inspectionResult ? (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  applicant.inspectionResult === 'passed' ? 'bg-primary/10 text-primary' :
                  applicant.inspectionResult === 'failed' ? 'bg-error/10 text-error' :
                  'bg-surface-container text-on-surface-variant'
                }`}>{applicant.inspectionResult}</span>
              ) : null}
            </InfoRow>
            <InfoRow label="DISCOM Ref No.">{applicant.discomRefNo}</InfoRow>
            <InfoRow label="Net Meter Serial No.">{applicant.netMeterSerialNo}</InfoRow>
          </div>
        )}
      </div>

      {/* Site Survey Summary */}
      <div className="bg-surface-container-lowest rounded-xl p-6">
        <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50 mb-4">Site Survey Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <InfoRow label="Survey Date">{applicant.surveyDate ? formatDate(applicant.surveyDate) : null}</InfoRow>
          <InfoRow label="Surveyed By">{applicant.surveyedBy}</InfoRow>
          <InfoRow label="Roof Area">{applicant.roofAreaSqft ? `${applicant.roofAreaSqft} sqft` : null}</InfoRow>
          <InfoRow label="Recommended Capacity">{applicant.recommendedCapacityKw ? `${applicant.recommendedCapacityKw} kW` : null}</InfoRow>
          {applicant.shadowAnalysis && <InfoRow label="Shadow Analysis">{applicant.shadowAnalysis}</InfoRow>}
        </div>
      </div>

      <ConfirmDialog
        open={advanceOpen}
        onOpenChange={setAdvanceOpen}
        title={`Advance to Stage ${applicant.stage + 1}?`}
        description={`This will move the project to "${getStageName(applicant.stage + 1)}". All mandatory checklist items for the current stage must be complete.`}
        confirmLabel="Advance Stage"
        onConfirm={() => advanceMutation.mutate()}
        loading={advanceMutation.isPending}
      />
    </div>
  );
}

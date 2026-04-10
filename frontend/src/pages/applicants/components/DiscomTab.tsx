import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, X, Save, Loader2, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { applicantsService } from '@/services/applicants.service';
import { formatDate, getStageName } from '@/utils/formatters';
import type { Applicant } from '@/types';
import { useAuthStore } from '@/store/authStore';

// ── Defined outside component to prevent focus loss ──
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function sv(v: string | undefined | null): string | undefined {
  return v || undefined;
}

// Which fields are relevant at each DISCOM-related stage, and what the user should fill before advancing
const STAGE_GUIDANCE: Record<number, { title: string; nextLabel: string; fields: string[] }> = {
  3: {
    title: 'Documents collected — ready to submit portal application?',
    nextLabel: 'Mark Portal Application Submitted (→ Stage 4)',
    fields: ['portalApplicationDate'],
  },
  4: {
    title: 'Portal application submitted — has MRT been completed?',
    nextLabel: 'Mark MRT Done (→ Stage 5)',
    fields: ['mrtDate'],
  },
  5: {
    title: 'MRT done — has JE inspection been completed?',
    nextLabel: 'Mark JE Inspection Done (→ Stage 6)',
    fields: ['inspectionDate', 'inspectionResult'],
  },
  6: {
    title: 'JE inspection done — has DISCOM approval been received?',
    nextLabel: 'Mark Approval Received (→ Stage 7)',
    fields: [],
  },
  7: {
    title: 'DISCOM approval received — ready to procure material?',
    nextLabel: 'Mark Material Procurement Started (→ Stage 8)',
    fields: ['discomRefNo'],
  },
  9: {
    title: 'Installation done — has net meter been applied?',
    nextLabel: 'Mark Net Meter Applied (→ Stage 10)',
    fields: ['netMeterSerialNo'],
  },
};

const REQUIRED_FIELD_LABELS: Record<string, string> = {
  portalApplicationDate: 'Portal Application Date',
  mrtDate: 'MRT Date',
  inspectionDate: 'Inspection Date',
  inspectionResult: 'Inspection Result',
  netMeterSerialNo: 'Net Meter Serial No.',
  discomRefNo: 'DISCOM Reference No. (Approval Reference)',
};

const INSPECTION_RESULT_LABELS: Record<string, string> = {
  passed: 'Passed',
  failed: 'Failed',
  pending: 'Pending',
};

interface DiscomTabProps {
  applicant: Applicant;
}

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

  const cancelEdit = () => {
    setEditing(false);
    setForm({});
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = {};
      Object.entries(form).forEach(([k, v]) => {
        payload[k] = v === '' ? null : v;
      });
      return applicantsService.updateApplicant(applicant.id, payload as any);
    },
    onSuccess: () => {
      toast.success('DISCOM Application details saved');
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      setEditing(false);
      setForm({});
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || 'Failed to save';
      toast.error(msg);
    },
  });

  const advanceMutation = useMutation({
    mutationFn: () => applicantsService.advanceStage(applicant.id),
    onSuccess: () => {
      toast.success(`Advanced to: ${getStageName(applicant.stage + 1)}`);
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      setAdvanceOpen(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || 'Cannot advance — check mandatory checklist items';
      toast.error(msg);
      setAdvanceOpen(false);
    },
  });

  // Check which recommended fields are missing for the current stage
  const missingFields = guidance?.fields.filter((f) => !(applicant as any)[f]) ?? [];

  return (
    <div className="space-y-4">

      {/* ── Stage Action Panel (only for DISCOM-related stages) ── */}
      {guidance && canEdit && applicant.stage < 11 && (
        <Card className="border-brand-200 bg-brand-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="info" className="text-xs">Stage {applicant.stage} — {getStageName(applicant.stage)}</Badge>
                </div>
                <p className="text-sm text-brand-800 font-medium">{guidance.title}</p>
                {missingFields.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {missingFields.map((f) => (
                      <div key={f} className="flex items-center gap-1.5 text-xs text-amber-700">
                        <Circle className="w-3 h-3" />
                        <span>Fill in <strong>{REQUIRED_FIELD_LABELS[f]}</strong> below before advancing</span>
                      </div>
                    ))}
                  </div>
                )}
                {missingFields.length === 0 && guidance.fields.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-green-700 mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Required fields filled — ready to advance</span>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => setAdvanceOpen(true)}
                disabled={advanceMutation.isPending}
                className="shrink-0"
              >
                <ChevronRight className="w-4 h-4 mr-1" />
                {guidance.nextLabel}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── DISCOM Application Details card ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm">DISCOM Portal Application</CardTitle>
          {canEdit && !editing && (
            <Button size="sm" variant="outline" onClick={startEdit}>
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          )}
          {editing && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saveMutation.isPending}>
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  : <Save className="w-3 h-3 mr-1" />}
                Save
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F label="Portal Application Date">
                <Input type="date" value={form.portalApplicationDate ?? ''} onChange={(e) => set('portalApplicationDate', e.target.value)} />
              </F>
              <F label="JE Name">
                <Input value={form.jeName ?? ''} onChange={(e) => set('jeName', e.target.value)} placeholder="Junior Engineer name" />
              </F>
              <F label="JE Contact">
                <Input maxLength={10} value={form.jeContact ?? ''} onChange={(e) => set('jeContact', e.target.value)} placeholder="10-digit mobile" />
              </F>
              <F label="MRT Date">
                <Input type="date" value={form.mrtDate ?? ''} onChange={(e) => set('mrtDate', e.target.value)} />
              </F>
              <F label="Inspection Date">
                <Input type="date" value={form.inspectionDate ?? ''} onChange={(e) => set('inspectionDate', e.target.value)} />
              </F>
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
                <F label="DISCOM Reference No. (Approval Ref)">
                  <Input value={form.discomRefNo ?? ''} onChange={(e) => set('discomRefNo', e.target.value)} placeholder="e.g. TPCODL/2024/001234" />
                </F>
              </div>
              <div className="md:col-span-2">
                <F label="Net Meter Serial No.">
                  <Input value={form.netMeterSerialNo ?? ''} onChange={(e) => set('netMeterSerialNo', e.target.value)} placeholder="e.g. NM-2024-001234" />
                </F>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoRow label="Portal Application Date">
                {applicant.portalApplicationDate
                  ? <span className="text-green-700 font-medium">{formatDate(applicant.portalApplicationDate)}</span>
                  : <Dash />}
              </InfoRow>
              <InfoRow label="JE Name">{applicant.jeName ?? <Dash />}</InfoRow>
              <InfoRow label="JE Contact">{applicant.jeContact ?? <Dash />}</InfoRow>
              <InfoRow label="MRT Date">
                {applicant.mrtDate
                  ? <span className="text-green-700 font-medium">{formatDate(applicant.mrtDate)}</span>
                  : <Dash />}
              </InfoRow>
              <InfoRow label="Inspection Date">
                {applicant.inspectionDate
                  ? <span className="text-green-700 font-medium">{formatDate(applicant.inspectionDate)}</span>
                  : <Dash />}
              </InfoRow>
              <InfoRow label="Inspection Result">
                {applicant.inspectionResult ? (
                  <Badge
                    variant={
                      applicant.inspectionResult === 'passed' ? 'success'
                      : applicant.inspectionResult === 'failed' ? 'destructive'
                      : 'secondary'
                    }
                    className="text-xs"
                  >
                    {INSPECTION_RESULT_LABELS[applicant.inspectionResult] ?? applicant.inspectionResult}
                  </Badge>
                ) : <Dash />}
              </InfoRow>
              <InfoRow label="DISCOM Ref No. (Approval)">{applicant.discomRefNo ?? <Dash />}</InfoRow>
              <InfoRow label="Net Meter Serial No.">{applicant.netMeterSerialNo ?? <Dash />}</InfoRow>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Site Survey Summary ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Site Survey Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <InfoRow label="Survey Date">
            {applicant.surveyDate ? formatDate(applicant.surveyDate) : <Dash />}
          </InfoRow>
          <InfoRow label="Surveyed By">{applicant.surveyedBy ?? <Dash />}</InfoRow>
          <InfoRow label="Roof Area">
            {applicant.roofAreaSqft ? `${applicant.roofAreaSqft} sqft` : <Dash />}
          </InfoRow>
          <InfoRow label="Recommended Capacity">
            {applicant.recommendedCapacityKw ? `${applicant.recommendedCapacityKw} kW` : <Dash />}
          </InfoRow>
          {applicant.shadowAnalysis && (
            <div className="md:col-span-2">
              <InfoRow label="Shadow Analysis">{applicant.shadowAnalysis}</InfoRow>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advance stage confirm dialog */}
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

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

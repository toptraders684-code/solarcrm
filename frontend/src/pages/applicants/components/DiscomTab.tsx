import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, X, Save, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateSelectPicker } from '@/components/ui/date-select-picker';
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

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const req = label.endsWith(' *');
  const text = req ? label.slice(0, -2) : label;
  return (
    <div>
      <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
        {text}{req && <span className="text-error"> *</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-[10px] text-error font-semibold">{error}</p>}
    </div>
  );
}

const MOBILE_RE = /^[6-9]\d{9}$/;

function validateDiscom(section: Section, form: Record<string, any>): Record<string, string> {
  const e: Record<string, string> = {};
  if (section === 'discom') {
    if (form.jeContact && !MOBILE_RE.test(form.jeContact)) e.jeContact = 'Must be a valid 10-digit mobile number';
    if (form.roofAreaSqft !== '' && form.roofAreaSqft !== undefined && Number(form.roofAreaSqft) <= 0)
      e.roofAreaSqft = 'Must be greater than 0';
  }
  if (section === 'discomDetails') {
    if (form.discomMobileNo && !MOBILE_RE.test(form.discomMobileNo)) e.discomMobileNo = 'Must be a valid 10-digit mobile number';
  }
  if (section === 'survey') {
    if (form.roofAreaSqft !== '' && form.roofAreaSqft !== undefined && Number(form.roofAreaSqft) <= 0)
      e.roofAreaSqft = 'Must be greater than 0';
    if (form.recommendedCapacityKw !== '' && form.recommendedCapacityKw !== undefined && Number(form.recommendedCapacityKw) <= 0)
      e.recommendedCapacityKw = 'Must be greater than 0';
  }
  return e;
}

type Section = 'discom' | 'discomDetails' | 'survey' | null;

function SectionActions({ isEditing, canEdit, saving, editDisabled, onEdit, onCancel, onSave }: {
  isEditing: boolean; canEdit: boolean; saving: boolean; editDisabled: boolean;
  onEdit: () => void; onCancel: () => void; onSave: () => void;
}) {
  if (!canEdit) return null;
  if (isEditing) {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onCancel} disabled={saving}><X size={12} />Cancel</Button>
        <Button size="sm" onClick={onSave} loading={saving}><Save size={12} />Save</Button>
      </div>
    );
  }
  return (
    <Button size="sm" variant="secondary" onClick={onEdit} disabled={editDisabled}><Pencil size={12} />Edit</Button>
  );
}

interface DiscomTabProps { applicant: Applicant; }

export function DiscomTab({ applicant }: DiscomTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [editingSection, setEditingSection] = useState<Section>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [advanceOpen, setAdvanceOpen] = useState(false);

  const canEdit = user && ['admin', 'operations_staff'].includes(user.role);
  const guidance = STAGE_GUIDANCE[applicant.stage];

  const set = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const touch = (key: string, val: any) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const errs = validateDiscom(editingSection, { ...form, [key]: val });
    setErrors((prev) => { const n = { ...prev }; if (errs[key]) n[key] = errs[key]; else delete n[key]; return n; });
  };

  const fieldClass = (key: string) => {
    if (errors[key]) return 'border-error';
    if (touched[key] && form[key] !== '' && form[key] !== null && form[key] !== undefined) return 'border-primary';
    return '';
  };

  const startEdit = (section: Section) => {
    if (section === 'discom') {
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
    } else if (section === 'discomDetails') {
      setForm({
        mnreApplicationNo: applicant.mnreApplicationNo ?? '',
        discomApplicationNo: applicant.discomApplicationNo ?? '',
        mnreSubmitDate: applicant.mnreSubmitDate ? applicant.mnreSubmitDate.slice(0, 10) : '',
        discomDivision: applicant.discomDivision ?? '',
        discomSubDivision: applicant.discomSubDivision ?? '',
        discomSection: applicant.discomSection ?? '',
        discomContactPerson: applicant.discomContactPerson ?? '',
        discomMobileNo: applicant.discomMobileNo ?? '',
      });
    } else if (section === 'survey') {
      setForm({
        surveyDate: applicant.surveyDate ? applicant.surveyDate.slice(0, 10) : '',
        surveyedBy: applicant.surveyedBy ?? '',
        roofAreaSqft: applicant.roofAreaSqft ?? '',
        recommendedCapacityKw: applicant.recommendedCapacityKw ?? '',
        shadowAnalysis: applicant.shadowAnalysis ?? '',
      });
    }
    setErrors({});
    setTouched({});
    setEditingSection(section);
  };

  const cancelEdit = () => { setEditingSection(null); setForm({}); setErrors({}); setTouched({}); };

  const saveMutation = useMutation({
    mutationFn: () => {
      const errs = validateDiscom(editingSection, form);
      if (Object.keys(errs).length > 0) { setErrors(errs); return Promise.reject(null); }
      const payload: Record<string, any> = {};
      Object.entries(form).forEach(([k, v]) => { payload[k] = v === '' ? null : v; });
      return applicantsService.updateApplicant(applicant.id, payload as any);
    },
    onSuccess: () => {
      toast.success('Details saved');
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      cancelEdit();
    },
    onError: (err: any) => {
      if (err === null) return;
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to save');
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
            <Button
              size="sm"
              onClick={() => setAdvanceOpen(true)}
              disabled={advanceMutation.isPending || missingFields.length > 0}
              title={missingFields.length > 0 ? 'Fill in all required fields before advancing' : undefined}
              className="shrink-0"
            >
              <ChevronRight size={14} />{guidance.nextLabel}
            </Button>
          </div>
        </div>
      )}

      {/* ── DISCOM Portal Application ─────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">DISCOM Portal Application</h4>
          <SectionActions isEditing={editingSection === 'discom'} canEdit={!!canEdit} saving={saveMutation.isPending} editDisabled={editingSection !== null} onEdit={() => startEdit('discom')} onCancel={cancelEdit} onSave={() => saveMutation.mutate()} />
        </div>

        {editingSection === 'discom' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <F label="Portal Application Date"><DateSelectPicker value={form.portalApplicationDate ?? ''} onChange={(v) => { set('portalApplicationDate', v); touch('portalApplicationDate', v); }} placeholder="Select date" /></F>
            <F label="JE Name"><Input value={form.jeName ?? ''} onChange={(e) => set('jeName', e.target.value)} onBlur={(e) => touch('jeName', e.target.value)} placeholder="Junior Engineer name" className={fieldClass('jeName')} /></F>
            <F label="JE Contact" error={errors.jeContact}>
              <Input maxLength={10} value={form.jeContact ?? ''} onChange={(e) => set('jeContact', e.target.value.replace(/\D/g, ''))} onBlur={(e) => touch('jeContact', e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" className={fieldClass('jeContact')} />
            </F>
            <F label="MRT Date"><DateSelectPicker value={form.mrtDate ?? ''} onChange={(v) => { set('mrtDate', v); touch('mrtDate', v); }} placeholder="Select date" /></F>
            <F label="Inspection Date"><DateSelectPicker value={form.inspectionDate ?? ''} onChange={(v) => { set('inspectionDate', v); touch('inspectionDate', v); }} placeholder="Select date" /></F>
            <F label="Inspection Result">
              <Select value={sv(form.inspectionResult)} onValueChange={(v) => { set('inspectionResult', v); touch('inspectionResult', v); }}>
                <SelectTrigger className={fieldClass('inspectionResult')}><SelectValue placeholder="Select result" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <div className="md:col-span-2">
              <F label="DISCOM Reference No. (Approval Ref)"><Input value={form.discomRefNo ?? ''} onChange={(e) => set('discomRefNo', e.target.value)} onBlur={(e) => touch('discomRefNo', e.target.value)} placeholder="e.g. TPCODL/2024/001234" className={fieldClass('discomRefNo')} /></F>
            </div>
            <div className="md:col-span-2">
              <F label="Net Meter Serial No."><Input value={form.netMeterSerialNo ?? ''} onChange={(e) => set('netMeterSerialNo', e.target.value)} onBlur={(e) => touch('netMeterSerialNo', e.target.value)} placeholder="e.g. NM-2024-001234" className={fieldClass('netMeterSerialNo')} /></F>
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

      {/* ── DISCOM Details ────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">DISCOM Details</h4>
          <SectionActions isEditing={editingSection === 'discomDetails'} canEdit={!!canEdit} saving={saveMutation.isPending} editDisabled={editingSection !== null} onEdit={() => startEdit('discomDetails')} onCancel={cancelEdit} onSave={() => saveMutation.mutate()} />
        </div>

        {editingSection === 'discomDetails' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <F label="MNRE Application No (PMSURYA GARH)">
              <Input value={form.mnreApplicationNo ?? ''} onChange={(e) => set('mnreApplicationNo', e.target.value)} onBlur={(e) => touch('mnreApplicationNo', e.target.value)} placeholder="MNRE application number" className={fieldClass('mnreApplicationNo')} />
            </F>
            <F label="DISCOM Application No (Reference No)">
              <Input value={form.discomApplicationNo ?? ''} onChange={(e) => set('discomApplicationNo', e.target.value)} onBlur={(e) => touch('discomApplicationNo', e.target.value)} placeholder="DISCOM reference number" className={fieldClass('discomApplicationNo')} />
            </F>
            <F label="MNRE Application Submit Date">
              <DateSelectPicker value={form.mnreSubmitDate ?? ''} onChange={(v) => { set('mnreSubmitDate', v); touch('mnreSubmitDate', v); }} placeholder="Select date" />
            </F>
            <F label="DISCOM Division Name">
              <Input value={form.discomDivision ?? ''} onChange={(e) => set('discomDivision', e.target.value)} onBlur={(e) => touch('discomDivision', e.target.value)} placeholder="Division name" className={fieldClass('discomDivision')} />
            </F>
            <F label="DISCOM Sub Division Name">
              <Input value={form.discomSubDivision ?? ''} onChange={(e) => set('discomSubDivision', e.target.value)} onBlur={(e) => touch('discomSubDivision', e.target.value)} placeholder="Sub division name" className={fieldClass('discomSubDivision')} />
            </F>
            <F label="DISCOM Section">
              <Input value={form.discomSection ?? ''} onChange={(e) => set('discomSection', e.target.value)} onBlur={(e) => touch('discomSection', e.target.value)} placeholder="Section name" className={fieldClass('discomSection')} />
            </F>
            <F label="DISCOM Contact Person Name">
              <Input value={form.discomContactPerson ?? ''} onChange={(e) => set('discomContactPerson', e.target.value)} onBlur={(e) => touch('discomContactPerson', e.target.value)} placeholder="Contact person name" className={fieldClass('discomContactPerson')} />
            </F>
            <F label="DISCOM Mobile No" error={errors.discomMobileNo}>
              <Input maxLength={10} value={form.discomMobileNo ?? ''} onChange={(e) => set('discomMobileNo', e.target.value.replace(/\D/g, ''))} onBlur={(e) => touch('discomMobileNo', e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" className={fieldClass('discomMobileNo')} />
            </F>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow label="MNRE Application No">{applicant.mnreApplicationNo}</InfoRow>
            <InfoRow label="DISCOM Application No">{applicant.discomApplicationNo}</InfoRow>
            <InfoRow label="MNRE Submit Date">{applicant.mnreSubmitDate ? formatDate(applicant.mnreSubmitDate) : null}</InfoRow>
            <InfoRow label="DISCOM Division">{applicant.discomDivision}</InfoRow>
            <InfoRow label="DISCOM Sub Division">{applicant.discomSubDivision}</InfoRow>
            <InfoRow label="DISCOM Section">{applicant.discomSection}</InfoRow>
            <InfoRow label="Contact Person">{applicant.discomContactPerson}</InfoRow>
            <InfoRow label="DISCOM Mobile No">{applicant.discomMobileNo}</InfoRow>
          </div>
        )}
      </div>

      {/* ── Site Survey Summary ───────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">Site Survey Summary</h4>
          <SectionActions isEditing={editingSection === 'survey'} canEdit={!!canEdit} saving={saveMutation.isPending} editDisabled={editingSection !== null} onEdit={() => startEdit('survey')} onCancel={cancelEdit} onSave={() => saveMutation.mutate()} />
        </div>

        {editingSection === 'survey' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <F label="Survey Date"><DateSelectPicker value={form.surveyDate ?? ''} onChange={(v) => { set('surveyDate', v); touch('surveyDate', v); }} placeholder="Select survey date" /></F>
            <F label="Surveyed By"><Input value={form.surveyedBy ?? ''} onChange={(e) => set('surveyedBy', e.target.value)} onBlur={(e) => touch('surveyedBy', e.target.value)} placeholder="Staff name" className={fieldClass('surveyedBy')} /></F>
            <F label="Roof Area (sqft)" error={errors.roofAreaSqft}>
              <Input type="number" min={1} value={form.roofAreaSqft ?? ''} onChange={(e) => set('roofAreaSqft', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('roofAreaSqft', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 500" className={fieldClass('roofAreaSqft')} />
            </F>
            <F label="Recommended Capacity (kW)" error={errors.recommendedCapacityKw}>
              <Input type="number" min={1} step={0.1} value={form.recommendedCapacityKw ?? ''} onChange={(e) => set('recommendedCapacityKw', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('recommendedCapacityKw', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 5" className={fieldClass('recommendedCapacityKw')} />
            </F>
            <div className="md:col-span-2">
              <F label="Shadow Analysis Notes"><Input value={form.shadowAnalysis ?? ''} onChange={(e) => set('shadowAnalysis', e.target.value)} onBlur={(e) => touch('shadowAnalysis', e.target.value)} placeholder="Describe shading conditions" className={fieldClass('shadowAnalysis')} /></F>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow label="Survey Date">{applicant.surveyDate ? formatDate(applicant.surveyDate) : null}</InfoRow>
            <InfoRow label="Surveyed By">{applicant.surveyedBy}</InfoRow>
            <InfoRow label="Roof Area">{applicant.roofAreaSqft ? `${applicant.roofAreaSqft} sqft` : null}</InfoRow>
            <InfoRow label="Recommended Capacity">{applicant.recommendedCapacityKw ? `${applicant.recommendedCapacityKw} kW` : null}</InfoRow>
            {applicant.shadowAnalysis && <InfoRow label="Shadow Analysis">{applicant.shadowAnalysis}</InfoRow>}
          </div>
        )}
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

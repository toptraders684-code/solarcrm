import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, X, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateSelectPicker } from '@/components/ui/date-select-picker';
import { applicantsService } from '@/services/applicants.service';
import { masterService } from '@/services/master.service';
import { formatDate, toTitleCase, formatCapacity } from '@/utils/formatters';
import type { Applicant } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { ProjectActivityTimeline } from './ProjectActivityTimeline';

type Section = 'personal' | 'address' | 'installation' | 'survey' | 'discom' | 'finance' | null;

function sv(v: any): string | undefined { return v || undefined; }

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-container-low last:border-0">
      <span className="text-xs text-on-surface-variant/60 font-medium flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-on-surface text-right">{children ?? '—'}</span>
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

// ── Validation rules ─────────────────────────────────────────────────────────
const MOBILE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_RE = /^\d{6}$/;

function validate(section: Section, form: Record<string, any>): Record<string, string> {
  const e: Record<string, string> = {};
  if (section === 'personal') {
    if (form.email && !EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address';
    if (form.whatsappNumber && !MOBILE_RE.test(form.whatsappNumber)) e.whatsappNumber = 'Must be a valid 10-digit mobile number';
    if (form.alternateMobile && !MOBILE_RE.test(form.alternateMobile)) e.alternateMobile = 'Must be a valid 10-digit mobile number';
  }
  if (section === 'address') {
    if (!form.addressStateId) e.addressStateId = 'State is required';
    if (!form.addressDistrictId) e.addressDistrictId = 'District is required';
    if (form.addressPincode && !PINCODE_RE.test(form.addressPincode)) e.addressPincode = 'Must be exactly 6 digits';
    if (form.gpsLatitude !== '' && form.gpsLatitude !== undefined) {
      const lat = Number(form.gpsLatitude);
      if (isNaN(lat) || lat < -90 || lat > 90) e.gpsLatitude = 'Latitude must be between -90 and 90';
    }
    if (form.gpsLongitude !== '' && form.gpsLongitude !== undefined) {
      const lng = Number(form.gpsLongitude);
      if (isNaN(lng) || lng < -180 || lng > 180) e.gpsLongitude = 'Longitude must be between -180 and 180';
    }
  }
  if (section === 'installation') {
    if (form.systemCapacityKw !== '' && form.systemCapacityKw !== undefined && Number(form.systemCapacityKw) <= 0)
      e.systemCapacityKw = 'Must be greater than 0';
    if (form.sanctionedLoadKw !== '' && form.sanctionedLoadKw !== undefined && Number(form.sanctionedLoadKw) <= 0)
      e.sanctionedLoadKw = 'Must be greater than 0';
  }
  if (section === 'survey') {
    if (form.roofAreaSqft !== '' && form.roofAreaSqft !== undefined && Number(form.roofAreaSqft) <= 0)
      e.roofAreaSqft = 'Must be greater than 0';
    if (form.recommendedCapacityKw !== '' && form.recommendedCapacityKw !== undefined && Number(form.recommendedCapacityKw) <= 0)
      e.recommendedCapacityKw = 'Must be greater than 0';
  }
  if (section === 'discom') {
    if (form.jeContact && !MOBILE_RE.test(form.jeContact)) e.jeContact = 'Must be a valid 10-digit mobile number';
  }
  if (section === 'finance') {
    if (form.loanAmount !== '' && form.loanAmount !== undefined && Number(form.loanAmount) < 0)
      e.loanAmount = 'Loan amount cannot be negative';
  }
  return e;
}

const SECTION_FIELDS: Record<string, string[]> = {
  personal: ['dateOfBirth', 'gender', 'email', 'whatsappNumber', 'alternateMobile'],
  address: ['addressHouse', 'addressStreet', 'addressVillage', 'addressStateId', 'addressDistrictId', 'addressPincode', 'gpsLatitude', 'gpsLongitude'],
  installation: ['systemCapacityKw', 'sanctionedLoadKw', 'roofType', 'existingConsumerNo', 'discomRefNo'],
  survey: ['surveyDate', 'surveyedBy', 'roofAreaSqft', 'recommendedCapacityKw', 'shadowAnalysis'],
  discom: ['portalApplicationDate', 'jeName', 'jeContact', 'mrtDate', 'inspectionDate', 'inspectionResult', 'netMeterSerialNo'],
  finance: ['financeMode', 'bankName', 'loanAmount', 'loanSanctionedDate', 'overpaymentRule'],
};

function FieldsProgress({ applicant, section }: { applicant: any; section: string }) {
  const fields = SECTION_FIELDS[section] ?? [];
  const filled = fields.filter((f) => { const v = applicant[f]; return v !== null && v !== undefined && v !== ''; }).length;
  const empty = fields.length - filled;
  return (
    <span className="flex items-center gap-3 flex-shrink-0">
      <span className="flex items-center gap-1 text-[10px] font-black text-primary">
        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
        {filled} filled
      </span>
      {empty > 0 && (
        <span className="flex items-center gap-1 text-[10px] font-black text-on-surface-variant/40">
          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30 inline-block" />
          {empty} empty
        </span>
      )}
    </span>
  );
}

function AccordionCard({
  title, summary, children, isOpen, isEditing, canEdit, saving, editDisabled, onToggle, onEdit, onCancel, onSave,
}: {
  title: string; summary?: React.ReactNode; children: React.ReactNode;
  isOpen: boolean; isEditing: boolean; canEdit: boolean; saving: boolean; editDisabled: boolean;
  onToggle: () => void; onEdit: () => void; onCancel: () => void; onSave: () => void;
}) {
  return (
    <div className="rounded-xl border border-surface-container-low overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 bg-surface-container-lowest hover:bg-surface-container transition-colors text-left"
      >
        <span className="flex-shrink-0 text-on-surface-variant/40">
          {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>
        <span className="flex-1 text-[11px] font-black uppercase tracking-widest text-on-surface-variant/70">{title}</span>
        {!isOpen && summary}
        {isOpen && canEdit && (
          <span onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={onCancel} disabled={saving}><X size={12} />Cancel</Button>
                <Button size="sm" onClick={onSave} loading={saving}><Save size={12} />Save</Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={onEdit} disabled={editDisabled}><Pencil size={12} />Edit</Button>
            )}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="px-5 py-4 bg-surface/50 border-t border-surface-container-low">{children}</div>
      )}
    </div>
  );
}

interface DetailsTabProps { applicant: Applicant; }

export function DetailsTab({ applicant }: DetailsTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [editingSection, setEditingSection] = useState<Section>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const canEdit = (section: Section): boolean => {
    if (!user) return false;
    if (['admin', 'operations_staff'].includes(user.role)) return true;
    if (user.role === 'finance_manager' && section === 'finance') return true;
    return false;
  };


  const set = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const touch = (key: string, val: any) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const errs = validate(editingSection, { ...form, [key]: val });
    setErrors((prev) => { const n = { ...prev }; if (errs[key]) n[key] = errs[key]; else delete n[key]; return n; });
  };

  const fieldClass = (key: string) => {
    if (errors[key]) return 'border-error';
    if (touched[key] && form[key] !== '' && form[key] !== null && form[key] !== undefined) return 'border-primary';
    return '';
  };

  const toggleSection = (section: string) => {
    if (editingSection === section) return;
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const { data: statesData } = useQuery({
    queryKey: ['states'],
    queryFn: () => masterService.getStates(),
    enabled: editingSection === 'address',
  });
  const states = statesData?.data ?? [];

  const { data: districtsData } = useQuery({
    queryKey: ['districts', form.addressStateId],
    queryFn: () => masterService.getDistricts(form.addressStateId),
    enabled: editingSection === 'address' && !!form.addressStateId,
  });
  const districts = districtsData?.data ?? [];

  const startEdit = (section: Section) => {
    if (section === 'personal') {
      setForm({
        dateOfBirth: applicant.dateOfBirth ? applicant.dateOfBirth.slice(0, 10) : '',
        gender: applicant.gender ?? '',
        email: applicant.email ?? '',
        whatsappNumber: applicant.whatsappNumber ?? '',
        alternateMobile: applicant.alternateMobile ?? '',
      });
    } else if (section === 'address') {
      setForm({
        addressHouse: applicant.addressHouse ?? '',
        addressStreet: applicant.addressStreet ?? '',
        addressVillage: applicant.addressVillage ?? '',
        addressStateId: applicant.addressStateId ?? '',
        addressDistrictId: applicant.addressDistrictId ?? '',
        addressPincode: applicant.addressPincode ?? '',
        gpsLatitude: applicant.gpsLatitude ?? '',
        gpsLongitude: applicant.gpsLongitude ?? '',
      });
    } else if (section === 'installation') {
      setForm({
        systemCapacityKw: applicant.systemCapacityKw ?? '',
        sanctionedLoadKw: applicant.sanctionedLoadKw ?? '',
        roofType: applicant.roofType ?? '',
        existingConsumerNo: applicant.existingConsumerNo ?? '',
        discomRefNo: applicant.discomRefNo ?? '',
      });
    } else if (section === 'survey') {
      setForm({
        surveyDate: applicant.surveyDate ? applicant.surveyDate.slice(0, 10) : '',
        surveyedBy: applicant.surveyedBy ?? '',
        roofAreaSqft: applicant.roofAreaSqft ?? '',
        recommendedCapacityKw: applicant.recommendedCapacityKw ?? '',
        shadowAnalysis: applicant.shadowAnalysis ?? '',
      });
    } else if (section === 'discom') {
      setForm({
        portalApplicationDate: applicant.portalApplicationDate ? applicant.portalApplicationDate.slice(0, 10) : '',
        jeName: applicant.jeName ?? '',
        jeContact: applicant.jeContact ?? '',
        mrtDate: applicant.mrtDate ? applicant.mrtDate.slice(0, 10) : '',
        inspectionDate: applicant.inspectionDate ? applicant.inspectionDate.slice(0, 10) : '',
        inspectionResult: applicant.inspectionResult ?? '',
        netMeterSerialNo: applicant.netMeterSerialNo ?? '',
      });
    } else if (section === 'finance') {
      setForm({
        financeMode: applicant.financeMode ?? '',
        bankName: applicant.bankName ?? '',
        loanAmount: applicant.loanAmount ?? '',
        loanSanctionedDate: applicant.loanSanctionedDate ? applicant.loanSanctionedDate.slice(0, 10) : '',
        overpaymentRule: applicant.overpaymentRule ?? 'warn',
      });
    }
    setErrors({});
    setTouched({});
    setExpanded((prev) => ({ ...prev, [section as string]: true }));
    setEditingSection(section);
  };

  const cancelEdit = () => { setEditingSection(null); setForm({}); setErrors({}); setTouched({}); };

  const saveMutation = useMutation({
    mutationFn: () => {
      const errs = validate(editingSection, form);
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
      if (err === null) return; // validation error already shown inline
      toast.error(err?.response?.data?.error?.message || 'Failed to save');
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-2">

        {/* Personal Information */}
        <AccordionCard title="Personal Information"
          summary={<FieldsProgress applicant={applicant} section="personal" />}
          isOpen={!!expanded['personal']} isEditing={editingSection === 'personal'}
          canEdit={canEdit('personal')} saving={saveMutation.isPending} editDisabled={editingSection !== null}
          onToggle={() => toggleSection('personal')} onEdit={() => startEdit('personal')}
          onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
          {editingSection === 'personal' ? (
            <div className="space-y-4">
              <F label="Date of Birth">
                <DateSelectPicker value={form.dateOfBirth ?? ''} onChange={(v) => { set('dateOfBirth', v); touch('dateOfBirth', v); }} className={fieldClass('dateOfBirth')} />
              </F>
              <F label="Gender">
                <Select value={sv(form.gender)} onValueChange={(v) => set('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="Email" error={errors.email}>
                <Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} onBlur={(e) => touch('email', e.target.value)} placeholder="customer@email.com" className={fieldClass('email')} />
              </F>
              <F label="WhatsApp Number" error={errors.whatsappNumber}>
                <Input maxLength={10} value={form.whatsappNumber ?? ''} onChange={(e) => set('whatsappNumber', e.target.value.replace(/\D/g, ''))} onBlur={(e) => touch('whatsappNumber', e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" className={fieldClass('whatsappNumber')} />
              </F>
              <F label="Alternate Mobile" error={errors.alternateMobile}>
                <Input maxLength={10} value={form.alternateMobile ?? ''} onChange={(e) => set('alternateMobile', e.target.value.replace(/\D/g, ''))} onBlur={(e) => touch('alternateMobile', e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" className={fieldClass('alternateMobile')} />
              </F>
            </div>
          ) : (
            <>
              <InfoRow label="Date of Birth">{formatDate(applicant.dateOfBirth)}</InfoRow>
              <InfoRow label="Gender">{applicant.gender ? toTitleCase(applicant.gender) : null}</InfoRow>
              <InfoRow label="Email">{applicant.email}</InfoRow>
              <InfoRow label="WhatsApp">{applicant.whatsappNumber}</InfoRow>
              <InfoRow label="Alternate Mobile">{applicant.alternateMobile}</InfoRow>
            </>
          )}
        </AccordionCard>

        {/* Address */}
        <AccordionCard title="Address"
          summary={<FieldsProgress applicant={applicant} section="address" />}
          isOpen={!!expanded['address']} isEditing={editingSection === 'address'}
          canEdit={canEdit('address')} saving={saveMutation.isPending} editDisabled={editingSection !== null}
          onToggle={() => toggleSection('address')} onEdit={() => startEdit('address')}
          onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
          {editingSection === 'address' ? (
            <div className="space-y-4">
              <F label="House / Plot No."><Input value={form.addressHouse ?? ''} onChange={(e) => set('addressHouse', e.target.value)} onBlur={(e) => touch('addressHouse', e.target.value)} placeholder="House or plot number" className={fieldClass('addressHouse')} /></F>
              <F label="Street / Lane"><Input value={form.addressStreet ?? ''} onChange={(e) => set('addressStreet', e.target.value)} onBlur={(e) => touch('addressStreet', e.target.value)} placeholder="Street name" className={fieldClass('addressStreet')} /></F>
              <F label="Village / Town"><Input value={form.addressVillage ?? ''} onChange={(e) => set('addressVillage', e.target.value)} onBlur={(e) => touch('addressVillage', e.target.value)} placeholder="Village or town" className={fieldClass('addressVillage')} /></F>
              <F label="State *" error={errors.addressStateId}>
                <Select value={sv(form.addressStateId)} onValueChange={(v) => { set('addressStateId', v); set('addressDistrictId', ''); touch('addressStateId', v); }}>
                  <SelectTrigger className={fieldClass('addressStateId')}><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{states.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="District *" error={errors.addressDistrictId}>
                <Select value={sv(form.addressDistrictId)} onValueChange={(v) => { set('addressDistrictId', v); touch('addressDistrictId', v); }} disabled={!form.addressStateId}>
                  <SelectTrigger className={fieldClass('addressDistrictId')}><SelectValue placeholder={form.addressStateId ? 'Select district' : 'Select state first'} /></SelectTrigger>
                  <SelectContent>{districts.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="Pincode" error={errors.addressPincode}>
                <Input maxLength={6} value={form.addressPincode ?? ''} onChange={(e) => set('addressPincode', e.target.value.replace(/\D/g, ''))} onBlur={(e) => touch('addressPincode', e.target.value.replace(/\D/g, ''))} placeholder="6-digit pincode" className={fieldClass('addressPincode')} />
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F label="GPS Latitude" error={errors.gpsLatitude}>
                  <Input type="number" step="any" value={form.gpsLatitude ?? ''} onChange={(e) => set('gpsLatitude', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('gpsLatitude', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 20.296" className={fieldClass('gpsLatitude')} />
                </F>
                <F label="GPS Longitude" error={errors.gpsLongitude}>
                  <Input type="number" step="any" value={form.gpsLongitude ?? ''} onChange={(e) => set('gpsLongitude', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('gpsLongitude', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 85.824" className={fieldClass('gpsLongitude')} />
                </F>
              </div>
            </div>
          ) : (
            <>
              <InfoRow label="House / Plot">{applicant.addressHouse}</InfoRow>
              <InfoRow label="Street">{applicant.addressStreet}</InfoRow>
              <InfoRow label="Village">{applicant.addressVillage}</InfoRow>
              <InfoRow label="State">{applicant.addressState?.name}</InfoRow>
              <InfoRow label="District">{applicant.addressDistrict?.name}</InfoRow>
              <InfoRow label="Pincode">{applicant.addressPincode}</InfoRow>
              {applicant.gpsLatitude && <InfoRow label="GPS">{applicant.gpsLatitude}, {applicant.gpsLongitude}</InfoRow>}
            </>
          )}
        </AccordionCard>

        {/* Survey Information */}
        <AccordionCard title="Survey Information"
          summary={<FieldsProgress applicant={applicant} section="survey" />}
          isOpen={!!expanded['survey']} isEditing={editingSection === 'survey'}
          canEdit={canEdit('survey')} saving={saveMutation.isPending} editDisabled={editingSection !== null}
          onToggle={() => toggleSection('survey')} onEdit={() => startEdit('survey')}
          onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
          {editingSection === 'survey' ? (
            <div className="space-y-4">
              <F label="Survey Date">
                <DateSelectPicker value={form.surveyDate ?? ''} onChange={(v) => { set('surveyDate', v); touch('surveyDate', v); }} placeholder="Select survey date" />
              </F>
              <F label="Surveyed By"><Input value={form.surveyedBy ?? ''} onChange={(e) => set('surveyedBy', e.target.value)} onBlur={(e) => touch('surveyedBy', e.target.value)} placeholder="Staff member name" className={fieldClass('surveyedBy')} /></F>
              <F label="Roof Area (sqft)" error={errors.roofAreaSqft}>
                <Input type="number" min={1} value={form.roofAreaSqft ?? ''} onChange={(e) => set('roofAreaSqft', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('roofAreaSqft', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 500" className={fieldClass('roofAreaSqft')} />
              </F>
              <F label="Recommended Capacity (kW)" error={errors.recommendedCapacityKw}>
                <Input type="number" min={1} step={0.1} value={form.recommendedCapacityKw ?? ''} onChange={(e) => set('recommendedCapacityKw', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('recommendedCapacityKw', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 5" className={fieldClass('recommendedCapacityKw')} />
              </F>
              <F label="Shadow Analysis Notes"><Input value={form.shadowAnalysis ?? ''} onChange={(e) => set('shadowAnalysis', e.target.value)} onBlur={(e) => touch('shadowAnalysis', e.target.value)} placeholder="Describe shading conditions" className={fieldClass('shadowAnalysis')} /></F>
            </div>
          ) : (
            <>
              <InfoRow label="Survey Date">{formatDate(applicant.surveyDate)}</InfoRow>
              <InfoRow label="Surveyed By">{applicant.surveyedBy}</InfoRow>
              <InfoRow label="Roof Area">{applicant.roofAreaSqft ? `${applicant.roofAreaSqft} sqft` : null}</InfoRow>
              <InfoRow label="Recommended Capacity">{formatCapacity(applicant.recommendedCapacityKw)}</InfoRow>
              {applicant.shadowAnalysis && <InfoRow label="Shadow Analysis">{applicant.shadowAnalysis}</InfoRow>}
            </>
          )}
        </AccordionCard>

        {/* Installation Details */}
        <AccordionCard title="Installation Details"
          summary={<FieldsProgress applicant={applicant} section="installation" />}
          isOpen={!!expanded['installation']} isEditing={editingSection === 'installation'}
          canEdit={canEdit('installation')} saving={saveMutation.isPending} editDisabled={editingSection !== null}
          onToggle={() => toggleSection('installation')} onEdit={() => startEdit('installation')}
          onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
          {editingSection === 'installation' ? (
            <div className="space-y-4">
              <F label="System Capacity (kW)" error={errors.systemCapacityKw}>
                <Input type="number" min={0.1} step={0.1} value={form.systemCapacityKw ?? ''} onChange={(e) => set('systemCapacityKw', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('systemCapacityKw', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 5" className={fieldClass('systemCapacityKw')} />
              </F>
              <F label="Sanctioned Load (kW)" error={errors.sanctionedLoadKw}>
                <Input type="number" min={0.1} step={0.1} value={form.sanctionedLoadKw ?? ''} onChange={(e) => set('sanctionedLoadKw', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('sanctionedLoadKw', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 3" className={fieldClass('sanctionedLoadKw')} />
              </F>
              <F label="Roof Type">
                <Select value={sv(form.roofType)} onValueChange={(v) => { set('roofType', v); touch('roofType', v); }}>
                  <SelectTrigger className={fieldClass('roofType')}><SelectValue placeholder="Select roof type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rcc">RCC / Concrete</SelectItem>
                    <SelectItem value="metal">Metal / Tin Sheet</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="Consumer No. (DISCOM)"><Input value={form.existingConsumerNo ?? ''} onChange={(e) => set('existingConsumerNo', e.target.value)} onBlur={(e) => touch('existingConsumerNo', e.target.value)} placeholder="Existing consumer number" className={fieldClass('existingConsumerNo')} /></F>
              <F label="DISCOM Ref No."><Input value={form.discomRefNo ?? ''} onChange={(e) => set('discomRefNo', e.target.value)} onBlur={(e) => touch('discomRefNo', e.target.value)} placeholder="e.g. TPCODL/2024/001234" className={fieldClass('discomRefNo')} /></F>
            </div>
          ) : (
            <>
              <InfoRow label="System Capacity">{formatCapacity(applicant.systemCapacityKw)}</InfoRow>
              <InfoRow label="Sanctioned Load">{formatCapacity(applicant.sanctionedLoadKw)}</InfoRow>
              <InfoRow label="Roof Type">{applicant.roofType ? toTitleCase(applicant.roofType) : null}</InfoRow>
              <InfoRow label="Consumer No.">{applicant.existingConsumerNo}</InfoRow>
              <InfoRow label="DISCOM Ref No.">{applicant.discomRefNo}</InfoRow>
            </>
          )}
        </AccordionCard>

        {/* DISCOM Application */}
        <AccordionCard title="DISCOM Application"
          summary={<FieldsProgress applicant={applicant} section="discom" />}
          isOpen={!!expanded['discom']} isEditing={editingSection === 'discom'}
          canEdit={canEdit('discom')} saving={saveMutation.isPending} editDisabled={editingSection !== null}
          onToggle={() => toggleSection('discom')} onEdit={() => startEdit('discom')}
          onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
          {editingSection === 'discom' ? (
            <div className="space-y-4">
              <F label="Portal Application Date">
                <DateSelectPicker value={form.portalApplicationDate ?? ''} onChange={(v) => { set('portalApplicationDate', v); touch('portalApplicationDate', v); }} placeholder="Select date" />
              </F>
              <F label="JE Name"><Input value={form.jeName ?? ''} onChange={(e) => set('jeName', e.target.value)} onBlur={(e) => touch('jeName', e.target.value)} placeholder="Junior Engineer name" className={fieldClass('jeName')} /></F>
              <F label="JE Contact" error={errors.jeContact}>
                <Input maxLength={10} value={form.jeContact ?? ''} onChange={(e) => set('jeContact', e.target.value.replace(/\D/g, ''))} onBlur={(e) => touch('jeContact', e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" className={fieldClass('jeContact')} />
              </F>
              <F label="MRT Date">
                <DateSelectPicker value={form.mrtDate ?? ''} onChange={(v) => { set('mrtDate', v); touch('mrtDate', v); }} placeholder="Select date" />
              </F>
              <F label="Inspection Date">
                <DateSelectPicker value={form.inspectionDate ?? ''} onChange={(v) => { set('inspectionDate', v); touch('inspectionDate', v); }} placeholder="Select date" />
              </F>
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
              <F label="Net Meter Serial No."><Input value={form.netMeterSerialNo ?? ''} onChange={(e) => set('netMeterSerialNo', e.target.value)} onBlur={(e) => touch('netMeterSerialNo', e.target.value)} placeholder="e.g. NM-2024-001234" className={fieldClass('netMeterSerialNo')} /></F>
            </div>
          ) : (
            <>
              <InfoRow label="Portal Application">{formatDate(applicant.portalApplicationDate)}</InfoRow>
              <InfoRow label="JE Name">{applicant.jeName}</InfoRow>
              <InfoRow label="JE Contact">{applicant.jeContact}</InfoRow>
              <InfoRow label="MRT Date">{formatDate(applicant.mrtDate)}</InfoRow>
              <InfoRow label="Inspection Date">{formatDate(applicant.inspectionDate)}</InfoRow>
              <InfoRow label="Inspection Result">{applicant.inspectionResult ? toTitleCase(applicant.inspectionResult) : null}</InfoRow>
              <InfoRow label="Net Meter S/N">{applicant.netMeterSerialNo}</InfoRow>
            </>
          )}
        </AccordionCard>

        {/* Finance Details */}
        <AccordionCard title="Finance Details"
          summary={<FieldsProgress applicant={applicant} section="finance" />}
          isOpen={!!expanded['finance']} isEditing={editingSection === 'finance'}
          canEdit={canEdit('finance')} saving={saveMutation.isPending} editDisabled={editingSection !== null}
          onToggle={() => toggleSection('finance')} onEdit={() => startEdit('finance')}
          onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
          {editingSection === 'finance' ? (
            <div className="space-y-4">
              <F label="Finance Mode">
                <Select value={sv(form.financeMode)} onValueChange={(v) => { set('financeMode', v); touch('financeMode', v); }}>
                  <SelectTrigger className={fieldClass('financeMode')}><SelectValue placeholder="Select finance mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Self Finance</SelectItem>
                    <SelectItem value="govt_bank">Government Bank Loan</SelectItem>
                    <SelectItem value="private_bank">Private Bank Loan</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="Bank Name"><Input value={form.bankName ?? ''} onChange={(e) => set('bankName', e.target.value)} onBlur={(e) => touch('bankName', e.target.value)} placeholder="Bank name (for loan cases)" className={fieldClass('bankName')} /></F>
              <F label="Loan Amount (₹)" error={errors.loanAmount}>
                <Input type="number" min={0} value={form.loanAmount ?? ''} onChange={(e) => set('loanAmount', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('loanAmount', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 200000" className={fieldClass('loanAmount')} />
              </F>
              <F label="Loan Sanctioned Date">
                <DateSelectPicker value={form.loanSanctionedDate ?? ''} onChange={(v) => { set('loanSanctionedDate', v); touch('loanSanctionedDate', v); }} placeholder="Select date" />
              </F>
              <F label="Overpayment Rule">
                <Select value={sv(form.overpaymentRule)} onValueChange={(v) => { set('overpaymentRule', v); touch('overpaymentRule', v); }}>
                  <SelectTrigger className={fieldClass('overpaymentRule')}><SelectValue placeholder="Select rule" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warn">Warn (allow with warning)</SelectItem>
                    <SelectItem value="block">Block (prevent overpayment)</SelectItem>
                  </SelectContent>
                </Select>
              </F>
            </div>
          ) : (
            <>
              <InfoRow label="Finance Mode">{applicant.financeMode ? toTitleCase(applicant.financeMode) : null}</InfoRow>
              <InfoRow label="Bank Name">{applicant.bankName}</InfoRow>
              <InfoRow label="Loan Amount">{applicant.loanAmount ? `₹${applicant.loanAmount.toLocaleString('en-IN')}` : null}</InfoRow>
              <InfoRow label="Loan Sanctioned">{formatDate(applicant.loanSanctionedDate)}</InfoRow>
              <InfoRow label="Overpayment Rule">{toTitleCase(applicant.overpaymentRule)}</InfoRow>
            </>
          )}
        </AccordionCard>

      </div>

      <div>
        <ProjectActivityTimeline applicantId={applicant.id} activities={applicant.activities ?? []} />
      </div>
    </div>
  );
}

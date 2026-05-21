import { useState, useEffect, useRef } from 'react';
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
import { InstallationSection } from './InstallationSection';
import type { Applicant } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { ProjectActivityTimeline } from './ProjectActivityTimeline';

type Section = 'personal' | 'address' | 'area' | 'bank' | 'installation' | 'survey' | 'finance' | null;

function sv(v: any): string | undefined { return v || undefined; }

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-surface-container-low">
      <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-semibold text-on-surface">{children ?? '—'}</span>
    </div>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const req = label.endsWith(' *');
  const text = req ? label.slice(0, -2) : label;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
        {text}{req && <span className="text-error"> *</span>}
      </label>
      <div>
        {children}
        {error && <p className="mt-1 text-[10px] text-error font-semibold">{error}</p>}
      </div>
    </div>
  );
}

// ── Validation rules ─────────────────────────────────────────────────────────
const MOBILE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_RE = /^\d{6}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const AADHAAR_RE = /^\d{12}$/;

function validate(section: Section, form: Record<string, any>): Record<string, string> {
  const e: Record<string, string> = {};
  if (section === 'personal') {
    if (form.email && !EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address';
    if (form.whatsappNumber && !MOBILE_RE.test(form.whatsappNumber)) e.whatsappNumber = 'Must be a valid 10-digit mobile number';
    if (form.alternateMobile && !MOBILE_RE.test(form.alternateMobile)) e.alternateMobile = 'Must be a valid 10-digit mobile number';
    if (form.panToken && !PAN_RE.test(form.panToken)) e.panToken = 'Enter a valid PAN (e.g. ABCDE1234F)';
    if (form.aadhaarToken && !AADHAAR_RE.test(form.aadhaarToken)) e.aadhaarToken = 'Aadhaar must be exactly 12 digits';
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
  if (section === 'survey') {
    if (form.roofAreaSqft !== '' && form.roofAreaSqft !== undefined && Number(form.roofAreaSqft) <= 0)
      e.roofAreaSqft = 'Must be greater than 0';
    if (form.recommendedCapacityKw !== '' && form.recommendedCapacityKw !== undefined && Number(form.recommendedCapacityKw) <= 0)
      e.recommendedCapacityKw = 'Must be greater than 0';
  }
  if (section === 'bank') {
    if (form.coApplicantMobile && !MOBILE_RE.test(form.coApplicantMobile)) e.coApplicantMobile = 'Must be a valid 10-digit mobile number';
  }
  if (section === 'finance') {
    if (form.loanAmount !== '' && form.loanAmount !== undefined && Number(form.loanAmount) < 0)
      e.loanAmount = 'Loan amount cannot be negative';
  }
  return e;
}

const SECTION_FIELDS: Record<string, string[]> = {
  personal: ['customerName', 'customerProfession', 'dateOfBirth', 'gender', 'email', 'whatsappNumber', 'alternateMobile', 'panToken', 'aadhaarToken', 'signatureFileKey'],
  address: ['addressHouse', 'addressStreet', 'addressVillage', 'addressGp', 'addressBlock', 'addressStateId', 'addressDistrictId', 'addressPincode', 'gpsLatitude', 'gpsLongitude'],
  area: ['areaHouseNo', 'areaRoofSizeSqft', 'areaNoOfFloors', 'areaRoofType', 'areaHouseHeight'],
  bank: ['bankNameInAccount', 'bankBranchName', 'bankAccountNumber', 'bankIfscCode', 'coApplicantName', 'coApplicantRelationship', 'coApplicantMobile', 'dateOfBirth', 'coApplicantOccupation'],
  installation: [],
  survey: ['surveyDate', 'surveyedBy', 'roofAreaSqft', 'recommendedCapacityKw', 'shadowAnalysis'],
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

  const [sigObjUrl, setSigObjUrl] = useState<string | null>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  const { data: sigBlob } = useQuery({
    queryKey: ['signature', applicant.id, applicant.signatureFileKey],
    queryFn: () => applicantsService.getSignatureBlob(applicant.id),
    enabled: !!applicant.signatureFileKey,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (sigBlob) {
      const url = URL.createObjectURL(sigBlob);
      setSigObjUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setSigObjUrl(null);
    }
  }, [sigBlob]);

  const sigUploadMutation = useMutation({
    mutationFn: (file: File) => applicantsService.uploadSignature(applicant.id, file),
    onSuccess: () => {
      toast.success('Signature uploaded');
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      queryClient.invalidateQueries({ queryKey: ['signature', applicant.id] });
    },
    onError: () => toast.error('Failed to upload signature'),
  });

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
        customerName: applicant.customerName ?? '',
        customerProfession: applicant.customerProfession ?? '',
        dateOfBirth: applicant.dateOfBirth ? applicant.dateOfBirth.slice(0, 10) : '',
        gender: applicant.gender ?? '',
        email: applicant.email ?? '',
        whatsappNumber: applicant.whatsappNumber ?? '',
        alternateMobile: applicant.alternateMobile ?? '',
        panToken: applicant.panToken ?? '',
        aadhaarToken: applicant.aadhaarToken ?? '',
      });
    } else if (section === 'address') {
      setForm({
        addressHouse: applicant.addressHouse ?? '',
        addressStreet: applicant.addressStreet ?? '',
        addressVillage: applicant.addressVillage ?? '',
        addressGp: applicant.addressGp ?? '',
        addressBlock: applicant.addressBlock ?? '',
        addressStateId: applicant.addressStateId ?? '',
        addressDistrictId: applicant.addressDistrictId ?? '',
        addressPincode: applicant.addressPincode ?? '',
        gpsLatitude: applicant.gpsLatitude ?? '',
        gpsLongitude: applicant.gpsLongitude ?? '',
      });
    } else if (section === 'bank') {
      setForm({
        bankNameInAccount: applicant.bankNameInAccount ?? '',
        bankBranchName: applicant.bankBranchName ?? '',
        bankAccountNumber: applicant.bankAccountNumber ?? '',
        bankIfscCode: applicant.bankIfscCode ?? '',
        coApplicantName: applicant.coApplicantName ?? '',
        coApplicantRelationship: applicant.coApplicantRelationship ?? '',
        coApplicantMobile: applicant.coApplicantMobile ?? '',
        dateOfBirth: applicant.dateOfBirth ? applicant.dateOfBirth.slice(0, 10) : '',
        coApplicantOccupation: applicant.coApplicantOccupation ?? '',
      });
    } else if (section === 'area') {
      setForm({
        areaHouseNo: applicant.areaHouseNo ?? '',
        areaRoofSizeSqft: applicant.areaRoofSizeSqft ?? '',
        areaNoOfFloors: applicant.areaNoOfFloors ?? '',
        areaRoofType: applicant.areaRoofType ?? '',
        areaHouseHeight: applicant.areaHouseHeight ?? '',
      });
    } else if (section === 'survey') {
      setForm({
        surveyDate: applicant.surveyDate ? applicant.surveyDate.slice(0, 10) : '',
        surveyedBy: applicant.surveyedBy ?? '',
        roofAreaSqft: applicant.roofAreaSqft ?? '',
        recommendedCapacityKw: applicant.recommendedCapacityKw ?? '',
        shadowAnalysis: applicant.shadowAnalysis ?? '',
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <F label="Customer Name">
                <Input value={form.customerName ?? ''} onChange={(e) => set('customerName', e.target.value)} onBlur={(e) => touch('customerName', e.target.value)} placeholder="Full name" className={fieldClass('customerName')} />
              </F>
              <F label="Customer Profession">
                <Input value={form.customerProfession ?? ''} onChange={(e) => set('customerProfession', e.target.value)} onBlur={(e) => touch('customerProfession', e.target.value)} placeholder="e.g. Farmer, Business" className={fieldClass('customerProfession')} />
              </F>
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
              <F label="PAN Number" error={errors.panToken}>
                <Input maxLength={10} value={form.panToken ?? ''} onChange={(e) => set('panToken', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} onBlur={(e) => touch('panToken', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="e.g. ABCDE1234F" className={fieldClass('panToken')} />
              </F>
              <F label="Aadhaar Number" error={errors.aadhaarToken}>
                <Input maxLength={12} value={form.aadhaarToken ?? ''} onChange={(e) => set('aadhaarToken', e.target.value.replace(/\D/g, ''))} onBlur={(e) => touch('aadhaarToken', e.target.value.replace(/\D/g, ''))} placeholder="12-digit Aadhaar" className={fieldClass('aadhaarToken')} />
              </F>
              <div className="col-span-2">
                <F label="Signature">
                  <div className="flex items-center gap-4 flex-wrap">
                    <input
                      ref={sigInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) sigUploadMutation.mutate(f);
                        e.target.value = '';
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      loading={sigUploadMutation.isPending}
                      onClick={() => sigInputRef.current?.click()}
                    >
                      {applicant.signatureFileKey ? 'Replace Signature' : 'Upload Signature'}
                    </Button>
                    {sigObjUrl && (
                      <img src={sigObjUrl} alt="Current signature" className="max-h-16 border border-surface-container-low rounded-lg object-contain bg-white p-1" />
                    )}
                  </div>
                </F>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow label="Customer Name">{applicant.customerName}</InfoRow>
              <InfoRow label="Profession">{applicant.customerProfession}</InfoRow>
              <InfoRow label="Date of Birth">{formatDate(applicant.dateOfBirth)}</InfoRow>
              <InfoRow label="Gender">{applicant.gender ? toTitleCase(applicant.gender) : null}</InfoRow>
              <InfoRow label="Email">{applicant.email}</InfoRow>
              <InfoRow label="WhatsApp">{applicant.whatsappNumber}</InfoRow>
              <InfoRow label="Alternate Mobile">{applicant.alternateMobile}</InfoRow>
              <InfoRow label="PAN Number">{applicant.panToken}</InfoRow>
              <InfoRow label="Aadhaar Number">{applicant.aadhaarToken ? `XXXX XXXX ${applicant.aadhaarToken.slice(-4)}` : null}</InfoRow>
              <div className="col-span-2 flex flex-col gap-0.5 py-2 border-b border-surface-container-low">
                <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Signature</span>
                {sigObjUrl
                  ? <img src={sigObjUrl} alt="Signature" className="mt-1 max-h-24 max-w-xs border border-surface-container-low rounded-lg object-contain bg-white p-1" />
                  : <span className="text-sm font-semibold text-on-surface">—</span>
                }
              </div>
            </div>
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <F label="House / Plot No."><Input value={form.addressHouse ?? ''} onChange={(e) => set('addressHouse', e.target.value)} onBlur={(e) => touch('addressHouse', e.target.value)} placeholder="House or plot number" className={fieldClass('addressHouse')} /></F>
              <F label="Street / Lane"><Input value={form.addressStreet ?? ''} onChange={(e) => set('addressStreet', e.target.value)} onBlur={(e) => touch('addressStreet', e.target.value)} placeholder="Street name" className={fieldClass('addressStreet')} /></F>
              <F label="Village / Town"><Input value={form.addressVillage ?? ''} onChange={(e) => set('addressVillage', e.target.value)} onBlur={(e) => touch('addressVillage', e.target.value)} placeholder="Village or town" className={fieldClass('addressVillage')} /></F>
              <F label="GP (Gram Panchayat)"><Input value={form.addressGp ?? ''} onChange={(e) => set('addressGp', e.target.value)} onBlur={(e) => touch('addressGp', e.target.value)} placeholder="Gram Panchayat name" className={fieldClass('addressGp')} /></F>
              <F label="Block"><Input value={form.addressBlock ?? ''} onChange={(e) => set('addressBlock', e.target.value)} onBlur={(e) => touch('addressBlock', e.target.value)} placeholder="Block name" className={fieldClass('addressBlock')} /></F>
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
              <F label="GPS Latitude" error={errors.gpsLatitude}>
                <Input type="number" step="any" value={form.gpsLatitude ?? ''} onChange={(e) => set('gpsLatitude', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('gpsLatitude', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 20.296" className={fieldClass('gpsLatitude')} />
              </F>
              <F label="GPS Longitude" error={errors.gpsLongitude}>
                <Input type="number" step="any" value={form.gpsLongitude ?? ''} onChange={(e) => set('gpsLongitude', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('gpsLongitude', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 85.824" className={fieldClass('gpsLongitude')} />
              </F>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow label="House / Plot">{applicant.addressHouse}</InfoRow>
              <InfoRow label="Street">{applicant.addressStreet}</InfoRow>
              <InfoRow label="Village">{applicant.addressVillage}</InfoRow>
              <InfoRow label="GP">{applicant.addressGp}</InfoRow>
              <InfoRow label="Block">{applicant.addressBlock}</InfoRow>
              <InfoRow label="State">{applicant.addressState?.name}</InfoRow>
              <InfoRow label="District">{applicant.addressDistrict?.name}</InfoRow>
              <InfoRow label="Pincode">{applicant.addressPincode}</InfoRow>
              {applicant.gpsLatitude && <InfoRow label="GPS">{applicant.gpsLatitude}, {applicant.gpsLongitude}</InfoRow>}
            </div>
          )}
        </AccordionCard>

        {/* Area Details */}
        <AccordionCard title="Area Details"
          summary={<FieldsProgress applicant={applicant} section="area" />}
          isOpen={!!expanded['area']} isEditing={editingSection === 'area'}
          canEdit={canEdit('area')} saving={saveMutation.isPending} editDisabled={editingSection !== null}
          onToggle={() => toggleSection('area')} onEdit={() => startEdit('area')}
          onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
          {editingSection === 'area' ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <F label="House / Flat / Plot No.">
                <Input value={form.areaHouseNo ?? ''} onChange={(e) => set('areaHouseNo', e.target.value)} onBlur={(e) => touch('areaHouseNo', e.target.value)} placeholder="e.g. 12A / Flat 3B" className={fieldClass('areaHouseNo')} />
              </F>
              <F label="Roof Size (approx. sq. ft.)">
                <Input type="number" min={0} step={0.1} value={form.areaRoofSizeSqft ?? ''} onChange={(e) => set('areaRoofSizeSqft', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('areaRoofSizeSqft', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 800" className={fieldClass('areaRoofSizeSqft')} />
              </F>
              <F label="No. of Floors">
                <Select value={form.areaNoOfFloors ? String(form.areaNoOfFloors) : ''} onValueChange={(v) => { set('areaNoOfFloors', Number(v)); touch('areaNoOfFloors', Number(v)); }}>
                  <SelectTrigger className={fieldClass('areaNoOfFloors')}><SelectValue placeholder="Select floors" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </F>
              <F label="Roof Type">
                <Select value={sv(form.areaRoofType)} onValueChange={(v) => { set('areaRoofType', v); touch('areaRoofType', v); }}>
                  <SelectTrigger className={fieldClass('areaRoofType')}><SelectValue placeholder="Select roof type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rcc">RCC</SelectItem>
                    <SelectItem value="pakka">Pakka</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="House Height">
                <Input value={form.areaHouseHeight ?? ''} onChange={(e) => set('areaHouseHeight', e.target.value)} onBlur={(e) => touch('areaHouseHeight', e.target.value)} placeholder="e.g. 10 ft" className={fieldClass('areaHouseHeight')} />
              </F>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow label="House / Flat / Plot No.">{applicant.areaHouseNo}</InfoRow>
              <InfoRow label="Roof Size">{applicant.areaRoofSizeSqft ? `${applicant.areaRoofSizeSqft} sq. ft.` : null}</InfoRow>
              <InfoRow label="No. of Floors">{applicant.areaNoOfFloors}</InfoRow>
              <InfoRow label="Roof Type">{applicant.areaRoofType ? applicant.areaRoofType.toUpperCase() : null}</InfoRow>
              <InfoRow label="House Height">{applicant.areaHouseHeight}</InfoRow>
            </div>
          )}
        </AccordionCard>

        {/* Bank Details */}
        <AccordionCard title="Bank Details"
          summary={<FieldsProgress applicant={applicant} section="bank" />}
          isOpen={!!expanded['bank']} isEditing={editingSection === 'bank'}
          canEdit={canEdit('bank')} saving={saveMutation.isPending} editDisabled={editingSection !== null}
          onToggle={() => toggleSection('bank')} onEdit={() => startEdit('bank')}
          onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
          {editingSection === 'bank' ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <F label="Name in Bank Account">
                <Input value={form.bankNameInAccount ?? ''} onChange={(e) => set('bankNameInAccount', e.target.value)} onBlur={(e) => touch('bankNameInAccount', e.target.value)} placeholder="As per bank records" className={fieldClass('bankNameInAccount')} />
              </F>
              <F label="Bank & Branch Name">
                <Input value={form.bankBranchName ?? ''} onChange={(e) => set('bankBranchName', e.target.value)} onBlur={(e) => touch('bankBranchName', e.target.value)} placeholder="e.g. SBI, MG Road Branch" className={fieldClass('bankBranchName')} />
              </F>
              <F label="Account Number">
                <Input value={form.bankAccountNumber ?? ''} onChange={(e) => set('bankAccountNumber', e.target.value)} onBlur={(e) => touch('bankAccountNumber', e.target.value)} placeholder="Bank account number" className={fieldClass('bankAccountNumber')} />
              </F>
              <F label="IFSC Code">
                <Input value={form.bankIfscCode ?? ''} onChange={(e) => set('bankIfscCode', e.target.value.toUpperCase())} onBlur={(e) => touch('bankIfscCode', e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" className={fieldClass('bankIfscCode')} />
              </F>
              <F label="Co-Applicant Name">
                <Input value={form.coApplicantName ?? ''} onChange={(e) => set('coApplicantName', e.target.value)} onBlur={(e) => touch('coApplicantName', e.target.value)} placeholder="Full name" className={fieldClass('coApplicantName')} />
              </F>
              <F label="Relationship">
                <Input value={form.coApplicantRelationship ?? ''} onChange={(e) => set('coApplicantRelationship', e.target.value)} onBlur={(e) => touch('coApplicantRelationship', e.target.value)} placeholder="e.g. Spouse, Father" className={fieldClass('coApplicantRelationship')} />
              </F>
              <F label="Mobile No" error={errors.coApplicantMobile}>
                <Input maxLength={10} value={form.coApplicantMobile ?? ''} onChange={(e) => set('coApplicantMobile', e.target.value.replace(/\D/g, ''))} onBlur={(e) => touch('coApplicantMobile', e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" className={fieldClass('coApplicantMobile')} />
              </F>
              <F label="Date of Birth">
                <DateSelectPicker value={form.dateOfBirth ?? ''} onChange={(v) => { set('dateOfBirth', v); touch('dateOfBirth', v); }} className={fieldClass('dateOfBirth')} />
              </F>
              <F label="Occupation">
                <Input value={form.coApplicantOccupation ?? ''} onChange={(e) => set('coApplicantOccupation', e.target.value)} onBlur={(e) => touch('coApplicantOccupation', e.target.value)} placeholder="e.g. Farmer, Business" className={fieldClass('coApplicantOccupation')} />
              </F>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow label="Name in Bank Account">{applicant.bankNameInAccount}</InfoRow>
              <InfoRow label="Bank & Branch">{applicant.bankBranchName}</InfoRow>
              <InfoRow label="Account Number">{applicant.bankAccountNumber}</InfoRow>
              <InfoRow label="IFSC Code">{applicant.bankIfscCode}</InfoRow>
              <InfoRow label="Co-Applicant Name">{applicant.coApplicantName}</InfoRow>
              <InfoRow label="Relationship">{applicant.coApplicantRelationship}</InfoRow>
              <InfoRow label="Mobile No">{applicant.coApplicantMobile}</InfoRow>
              <InfoRow label="Date of Birth">{formatDate(applicant.dateOfBirth)}</InfoRow>
              <InfoRow label="Occupation">{applicant.coApplicantOccupation}</InfoRow>
            </div>
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
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
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow label="Survey Date">{formatDate(applicant.surveyDate)}</InfoRow>
              <InfoRow label="Surveyed By">{applicant.surveyedBy}</InfoRow>
              <InfoRow label="Roof Area">{applicant.roofAreaSqft ? `${applicant.roofAreaSqft} sqft` : null}</InfoRow>
              <InfoRow label="Recommended Capacity">{formatCapacity(applicant.recommendedCapacityKw)}</InfoRow>
              {applicant.shadowAnalysis && <InfoRow label="Shadow Analysis">{applicant.shadowAnalysis}</InfoRow>}
            </div>
          )}
        </AccordionCard>

        {/* Installation Details */}
        <AccordionCard title="Installation Details"
          summary={undefined}
          isOpen={!!expanded['installation']} isEditing={false}
          canEdit={false} saving={false} editDisabled={false}
          onToggle={() => toggleSection('installation')} onEdit={() => {}} onCancel={() => {}} onSave={() => {}}>
          <InstallationSection applicant={applicant} />
        </AccordionCard>

        {/* Finance Details */}
        <AccordionCard title="Finance Details"
          summary={<FieldsProgress applicant={applicant} section="finance" />}
          isOpen={!!expanded['finance']} isEditing={editingSection === 'finance'}
          canEdit={canEdit('finance')} saving={saveMutation.isPending} editDisabled={editingSection !== null}
          onToggle={() => toggleSection('finance')} onEdit={() => startEdit('finance')}
          onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
          {editingSection === 'finance' ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
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
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow label="Finance Mode">{applicant.financeMode ? toTitleCase(applicant.financeMode) : null}</InfoRow>
              <InfoRow label="Bank Name">{applicant.bankName}</InfoRow>
              <InfoRow label="Loan Amount">{applicant.loanAmount ? `₹${applicant.loanAmount.toLocaleString('en-IN')}` : null}</InfoRow>
              <InfoRow label="Loan Sanctioned">{formatDate(applicant.loanSanctionedDate)}</InfoRow>
              <InfoRow label="Overpayment Rule">{toTitleCase(applicant.overpaymentRule)}</InfoRow>
            </div>
          )}
        </AccordionCard>

      </div>

      <div>
        <ProjectActivityTimeline applicantId={applicant.id} activities={applicant.activities ?? []} />
      </div>
    </div>
  );
}

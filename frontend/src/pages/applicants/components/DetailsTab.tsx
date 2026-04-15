import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, X, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

interface DetailsTabProps { applicant: Applicant; }

export function DetailsTab({ applicant }: DetailsTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [editingSection, setEditingSection] = useState<Section>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  // All sections collapsed by default
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const canEdit = user && ['admin', 'operations_staff'].includes(user.role);
  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSection = (section: string) => {
    // Don't collapse while editing that section
    if (editingSection === section) return;
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // States & districts for address section
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
    // Auto-expand the section being edited
    setExpanded((prev) => ({ ...prev, [section as string]: true }));
    setEditingSection(section);
  };

  const cancelEdit = () => { setEditingSection(null); setForm({}); };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = {};
      Object.entries(form).forEach(([k, v]) => { payload[k] = v === '' ? null : v; });
      return applicantsService.updateApplicant(applicant.id, payload as any);
    },
    onSuccess: () => {
      toast.success('Details saved');
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      cancelEdit();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed to save'),
  });

  // ── Accordion section card ────────────────────────────────────────────────
  function AccordionCard({
    id,
    title,
    section,
    summary,
    children,
  }: {
    id: string;
    title: string;
    section: Section;
    summary?: React.ReactNode;
    children: React.ReactNode;
  }) {
    const isOpen = !!expanded[id];
    const isEditing = editingSection === section;

    return (
      <div className="rounded-xl border border-surface-container-low overflow-hidden">
        {/* Header */}
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center gap-3 px-5 py-4 bg-surface-container-lowest hover:bg-surface-container transition-colors text-left"
        >
          <span className="flex-shrink-0 text-on-surface-variant/40">
            {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </span>
          <span className="flex-1 text-[11px] font-black uppercase tracking-widest text-on-surface-variant/70">
            {title}
          </span>
          {!isOpen && summary && (
            <span className="text-xs text-on-surface-variant/50 font-medium truncate max-w-[180px]">
              {summary}
            </span>
          )}
          {/* Edit / Cancel+Save in header when open */}
          {isOpen && canEdit && (
            <span onClick={(e) => e.stopPropagation()}>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={saveMutation.isPending}>
                    <X size={12} />Cancel
                  </Button>
                  <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
                    <Save size={12} />Save
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => startEdit(section)} disabled={editingSection !== null}>
                  <Pencil size={12} />Edit
                </Button>
              )}
            </span>
          )}
        </button>

        {/* Body */}
        {isOpen && (
          <div className="px-5 py-4 bg-surface/50 border-t border-surface-container-low">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ── Left: accordion section cards ───────────────── */}
      <div className="lg:col-span-2 space-y-2">

        {/* Personal Information */}
        <AccordionCard
          id="personal" title="Personal Information" section="personal"
          summary={applicant.gender ? toTitleCase(applicant.gender) : applicant.email}
        >
          {editingSection === 'personal' ? (
            <div className="space-y-4">
              <F label="Date of Birth"><Input type="date" value={form.dateOfBirth ?? ''} onChange={(e) => set('dateOfBirth', e.target.value)} /></F>
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
              <F label="Email"><Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="customer@email.com" /></F>
              <F label="WhatsApp Number"><Input maxLength={10} value={form.whatsappNumber ?? ''} onChange={(e) => set('whatsappNumber', e.target.value)} placeholder="10-digit mobile" /></F>
              <F label="Alternate Mobile"><Input maxLength={10} value={form.alternateMobile ?? ''} onChange={(e) => set('alternateMobile', e.target.value)} placeholder="10-digit mobile" /></F>
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
        <AccordionCard
          id="address" title="Address" section="address"
          summary={[applicant.addressVillage, applicant.addressDistrict?.name].filter(Boolean).join(', ')}
        >
          {editingSection === 'address' ? (
            <div className="space-y-4">
              <F label="House / Plot No."><Input value={form.addressHouse ?? ''} onChange={(e) => set('addressHouse', e.target.value)} placeholder="House or plot number" /></F>
              <F label="Street / Lane"><Input value={form.addressStreet ?? ''} onChange={(e) => set('addressStreet', e.target.value)} placeholder="Street name" /></F>
              <F label="Village / Town"><Input value={form.addressVillage ?? ''} onChange={(e) => set('addressVillage', e.target.value)} placeholder="Village or town" /></F>
              <F label="State">
                <Select value={sv(form.addressStateId)} onValueChange={(v) => { set('addressStateId', v); set('addressDistrictId', ''); }}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {states.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </F>
              <F label="District">
                <Select value={sv(form.addressDistrictId)} onValueChange={(v) => set('addressDistrictId', v)} disabled={!form.addressStateId}>
                  <SelectTrigger><SelectValue placeholder={form.addressStateId ? 'Select district' : 'Select state first'} /></SelectTrigger>
                  <SelectContent>
                    {districts.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </F>
              <F label="Pincode"><Input maxLength={6} value={form.addressPincode ?? ''} onChange={(e) => set('addressPincode', e.target.value)} placeholder="6-digit pincode" /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="GPS Latitude"><Input type="number" step="any" value={form.gpsLatitude ?? ''} onChange={(e) => set('gpsLatitude', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 20.296" /></F>
                <F label="GPS Longitude"><Input type="number" step="any" value={form.gpsLongitude ?? ''} onChange={(e) => set('gpsLongitude', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 85.824" /></F>
              </div>
            </div>
          ) : (
            <>
              <InfoRow label="House / Plot">{applicant.addressHouse}</InfoRow>
              <InfoRow label="Street">{applicant.addressStreet}</InfoRow>
              <InfoRow label="Village">{applicant.addressVillage}</InfoRow>
              <InfoRow label="District">{applicant.addressDistrict?.name}</InfoRow>
              <InfoRow label="State">{applicant.addressState?.name}</InfoRow>
              <InfoRow label="Pincode">{applicant.addressPincode}</InfoRow>
              {applicant.gpsLatitude && (
                <InfoRow label="GPS">{applicant.gpsLatitude}, {applicant.gpsLongitude}</InfoRow>
              )}
            </>
          )}
        </AccordionCard>

        {/* Installation Details */}
        <AccordionCard
          id="installation" title="Installation Details" section="installation"
          summary={formatCapacity(applicant.systemCapacityKw) ?? undefined}
        >
          {editingSection === 'installation' ? (
            <div className="space-y-4">
              <F label="System Capacity (kW)"><Input type="number" min={1} step={0.1} value={form.systemCapacityKw ?? ''} onChange={(e) => set('systemCapacityKw', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 5" /></F>
              <F label="Sanctioned Load (kW)"><Input type="number" min={0.1} step={0.1} value={form.sanctionedLoadKw ?? ''} onChange={(e) => set('sanctionedLoadKw', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 3" /></F>
              <F label="Roof Type">
                <Select value={sv(form.roofType)} onValueChange={(v) => set('roofType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select roof type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rcc">RCC / Concrete</SelectItem>
                    <SelectItem value="metal">Metal / Tin Sheet</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="Consumer No. (DISCOM)"><Input value={form.existingConsumerNo ?? ''} onChange={(e) => set('existingConsumerNo', e.target.value)} placeholder="Existing consumer number" /></F>
              <F label="DISCOM Ref No."><Input value={form.discomRefNo ?? ''} onChange={(e) => set('discomRefNo', e.target.value)} placeholder="e.g. TPCODL/2024/001234" /></F>
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

        {/* Survey Information */}
        <AccordionCard
          id="survey" title="Survey Information" section="survey"
          summary={applicant.surveyDate ? formatDate(applicant.surveyDate) ?? undefined : undefined}
        >
          {editingSection === 'survey' ? (
            <div className="space-y-4">
              <F label="Survey Date"><Input type="date" value={form.surveyDate ?? ''} onChange={(e) => set('surveyDate', e.target.value)} /></F>
              <F label="Surveyed By"><Input value={form.surveyedBy ?? ''} onChange={(e) => set('surveyedBy', e.target.value)} placeholder="Staff member name" /></F>
              <F label="Roof Area (sqft)"><Input type="number" min={1} value={form.roofAreaSqft ?? ''} onChange={(e) => set('roofAreaSqft', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 500" /></F>
              <F label="Recommended Capacity (kW)"><Input type="number" min={1} step={0.1} value={form.recommendedCapacityKw ?? ''} onChange={(e) => set('recommendedCapacityKw', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 5" /></F>
              <F label="Shadow Analysis Notes"><Input value={form.shadowAnalysis ?? ''} onChange={(e) => set('shadowAnalysis', e.target.value)} placeholder="Describe shading conditions" /></F>
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

        {/* DISCOM Application */}
        <AccordionCard
          id="discom" title="DISCOM Application" section="discom"
          summary={applicant.portalApplicationDate ? formatDate(applicant.portalApplicationDate) ?? undefined : undefined}
        >
          {editingSection === 'discom' ? (
            <div className="space-y-4">
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
              <F label="Net Meter Serial No."><Input value={form.netMeterSerialNo ?? ''} onChange={(e) => set('netMeterSerialNo', e.target.value)} placeholder="e.g. NM-2024-001234" /></F>
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
        <AccordionCard
          id="finance" title="Finance Details" section="finance"
          summary={applicant.financeMode ? toTitleCase(applicant.financeMode) : undefined}
        >
          {editingSection === 'finance' ? (
            <div className="space-y-4">
              <F label="Finance Mode">
                <Select value={sv(form.financeMode)} onValueChange={(v) => set('financeMode', v)}>
                  <SelectTrigger><SelectValue placeholder="Select finance mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Self Finance</SelectItem>
                    <SelectItem value="govt_bank">Government Bank Loan</SelectItem>
                    <SelectItem value="private_bank">Private Bank Loan</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="Bank Name"><Input value={form.bankName ?? ''} onChange={(e) => set('bankName', e.target.value)} placeholder="Bank name (for loan cases)" /></F>
              <F label="Loan Amount (₹)"><Input type="number" min={0} value={form.loanAmount ?? ''} onChange={(e) => set('loanAmount', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 200000" /></F>
              <F label="Loan Sanctioned Date"><Input type="date" value={form.loanSanctionedDate ?? ''} onChange={(e) => set('loanSanctionedDate', e.target.value)} /></F>
              <F label="Overpayment Rule">
                <Select value={sv(form.overpaymentRule)} onValueChange={(v) => set('overpaymentRule', v)}>
                  <SelectTrigger><SelectValue placeholder="Select rule" /></SelectTrigger>
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

      {/* ── Right: Activity Timeline ─────────────────────── */}
      <div>
        <ProjectActivityTimeline
          applicantId={applicant.id}
          activities={applicant.activities ?? []}
        />
      </div>

    </div>
  );
}

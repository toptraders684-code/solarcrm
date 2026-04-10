import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { applicantsService } from '@/services/applicants.service';
import { masterService } from '@/services/master.service';
import { usersService } from '@/services/users.service';
import type { Applicant } from '@/types';

// ── Field wrapper defined OUTSIDE the component so React doesn't remount on every render ──
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// Helper: pass undefined to Select when value is empty so placeholder shows
function sv(v: string | undefined | null): string | undefined {
  return v || undefined;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  applicant: Applicant;
}

export function EditApplicantSheet({ open, onOpenChange, applicant }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open && applicant) {
      setForm({
        customerName: applicant.customerName ?? '',
        email: applicant.email ?? '',
        alternateMobile: applicant.alternateMobile ?? '',
        whatsappNumber: applicant.whatsappNumber ?? '',
        gender: applicant.gender ?? '',
        dateOfBirth: applicant.dateOfBirth ? applicant.dateOfBirth.slice(0, 10) : '',
        assignedStaffId: applicant.assignedStaffId ?? '',
        addressHouse: applicant.addressHouse ?? '',
        addressStreet: applicant.addressStreet ?? '',
        addressVillage: applicant.addressVillage ?? '',
        addressDistrictId: applicant.addressDistrictId ?? '',
        addressStateId: applicant.addressStateId ?? '',
        addressPincode: applicant.addressPincode ?? '',
        gpsLatitude: applicant.gpsLatitude ?? '',
        gpsLongitude: applicant.gpsLongitude ?? '',
        discom: applicant.discom ?? '',
        projectType: applicant.projectType ?? '',
        systemCapacityKw: applicant.systemCapacityKw ?? '',
        sanctionedLoadKw: applicant.sanctionedLoadKw ?? '',
        roofType: applicant.roofType ?? '',
        existingConsumerNo: applicant.existingConsumerNo ?? '',
        discomRefNo: applicant.discomRefNo ?? '',
        contractAmount: applicant.contractAmount ?? '',
        financeMode: applicant.financeMode ?? '',
        bankName: applicant.bankName ?? '',
        loanAmount: applicant.loanAmount ?? '',
        loanSanctionedDate: applicant.loanSanctionedDate ? applicant.loanSanctionedDate.slice(0, 10) : '',
        overpaymentRule: applicant.overpaymentRule ?? 'warn',
        surveyDate: applicant.surveyDate ? applicant.surveyDate.slice(0, 10) : '',
        surveyedBy: applicant.surveyedBy ?? '',
        roofAreaSqft: applicant.roofAreaSqft ?? '',
        shadowAnalysis: applicant.shadowAnalysis ?? '',
        recommendedCapacityKw: applicant.recommendedCapacityKw ?? '',
        portalApplicationDate: applicant.portalApplicationDate ? applicant.portalApplicationDate.slice(0, 10) : '',
        jeName: applicant.jeName ?? '',
        jeContact: applicant.jeContact ?? '',
        mrtDate: applicant.mrtDate ? applicant.mrtDate.slice(0, 10) : '',
        inspectionDate: applicant.inspectionDate ? applicant.inspectionDate.slice(0, 10) : '',
        inspectionResult: applicant.inspectionResult ?? '',
        netMeterSerialNo: applicant.netMeterSerialNo ?? '',
      });
    }
  }, [open, applicant]);

  const { data: statesData } = useQuery({ queryKey: ['states'], queryFn: () => masterService.getStates() });
  const { data: staffData } = useQuery({ queryKey: ['staff'], queryFn: () => usersService.getStaff() });
  const { data: districtsData } = useQuery({
    queryKey: ['districts', form.addressStateId],
    queryFn: () => masterService.getDistricts(form.addressStateId),
    enabled: !!form.addressStateId,
  });

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) payload[k] = v;
      });
      return applicantsService.updateApplicant(applicant.id, payload as any);
    },
    onSuccess: () => {
      toast.success('Project details saved');
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || 'Failed to save';
      toast.error(msg);
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Edit Project Details — {applicant.applicantCode}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="personal">
          <TabsList className="w-full grid grid-cols-3 mb-4 h-auto">
            <TabsTrigger value="personal" className="text-xs">Personal &amp; Address</TabsTrigger>
            <TabsTrigger value="installation" className="text-xs">Installation &amp; Finance</TabsTrigger>
            <TabsTrigger value="discom" className="text-xs">Survey &amp; DISCOM</TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Personal & Address ── */}
          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <F label="Customer Name *">
                  <Input value={form.customerName ?? ''} onChange={(e) => set('customerName', e.target.value)} />
                </F>
              </div>
              <F label="Email">
                <Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
              </F>
              <F label="Alternate Mobile">
                <Input maxLength={10} value={form.alternateMobile ?? ''} onChange={(e) => set('alternateMobile', e.target.value)} />
              </F>
              <F label="WhatsApp Number">
                <Input maxLength={10} value={form.whatsappNumber ?? ''} onChange={(e) => set('whatsappNumber', e.target.value)} />
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
              <F label="Date of Birth">
                <Input type="date" value={form.dateOfBirth ?? ''} onChange={(e) => set('dateOfBirth', e.target.value)} />
              </F>
              <F label="Assigned Staff">
                <Select value={sv(form.assignedStaffId)} onValueChange={(v) => set('assignedStaffId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                  <SelectContent>
                    {staffData?.data?.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Address</p>
            <div className="grid grid-cols-2 gap-3">
              <F label="House / Plot No.">
                <Input value={form.addressHouse ?? ''} onChange={(e) => set('addressHouse', e.target.value)} />
              </F>
              <F label="Street">
                <Input value={form.addressStreet ?? ''} onChange={(e) => set('addressStreet', e.target.value)} />
              </F>
              <div className="col-span-2">
                <F label="Village / Area">
                  <Input value={form.addressVillage ?? ''} onChange={(e) => set('addressVillage', e.target.value)} />
                </F>
              </div>
              <F label="State">
                <Select
                  value={sv(form.addressStateId)}
                  onValueChange={(v) => { set('addressStateId', v); set('addressDistrictId', ''); }}
                >
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {statesData?.data?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              <F label="District">
                <Select
                  value={sv(form.addressDistrictId)}
                  onValueChange={(v) => set('addressDistrictId', v)}
                  disabled={!form.addressStateId}
                >
                  <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>
                    {districtsData?.data?.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              <F label="Pincode">
                <Input maxLength={6} value={form.addressPincode ?? ''} onChange={(e) => set('addressPincode', e.target.value)} />
              </F>
              <F label="GPS Latitude">
                <Input type="number" step="0.0000001" placeholder="e.g. 20.2961" value={form.gpsLatitude ?? ''} onChange={(e) => set('gpsLatitude', e.target.value)} />
              </F>
              <F label="GPS Longitude">
                <Input type="number" step="0.0000001" placeholder="e.g. 85.8245" value={form.gpsLongitude ?? ''} onChange={(e) => set('gpsLongitude', e.target.value)} />
              </F>
            </div>
          </TabsContent>

          {/* ── Tab 2: Installation & Finance ── */}
          <TabsContent value="installation" className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Installation</p>
            <div className="grid grid-cols-2 gap-3">
              <F label="DISCOM">
                <Select value={sv(form.discom)} onValueChange={(v) => set('discom', v)}>
                  <SelectTrigger><SelectValue placeholder="Select DISCOM" /></SelectTrigger>
                  <SelectContent>
                    {['tpcodl', 'tpnodl', 'tpsodl', 'tpwodl'].map((d) => (
                      <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              <F label="Project Type">
                <Select value={sv(form.projectType)} onValueChange={(v) => set('projectType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="System Capacity (kW)">
                <Input type="number" step="0.01" placeholder="e.g. 3.00" value={form.systemCapacityKw ?? ''} onChange={(e) => set('systemCapacityKw', e.target.value)} />
              </F>
              <F label="Sanctioned Load (kW)">
                <Input type="number" step="0.01" value={form.sanctionedLoadKw ?? ''} onChange={(e) => set('sanctionedLoadKw', e.target.value)} />
              </F>
              <F label="Roof Type">
                <Select value={sv(form.roofType)} onValueChange={(v) => set('roofType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select roof type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rcc">RCC</SelectItem>
                    <SelectItem value="tin">Tin / Metal Sheet</SelectItem>
                    <SelectItem value="asbestos">Asbestos</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="Existing Consumer No.">
                <Input value={form.existingConsumerNo ?? ''} onChange={(e) => set('existingConsumerNo', e.target.value)} />
              </F>
              <div className="col-span-2">
                <F label="DISCOM Reference No.">
                  <Input value={form.discomRefNo ?? ''} onChange={(e) => set('discomRefNo', e.target.value)} />
                </F>
              </div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Finance</p>
            <div className="grid grid-cols-2 gap-3">
              <F label="Contract Amount (₹)">
                <Input type="number" step="1" value={form.contractAmount ?? ''} onChange={(e) => set('contractAmount', e.target.value)} />
              </F>
              <F label="Finance Mode">
                <Select value={sv(form.financeMode)} onValueChange={(v) => set('financeMode', v)}>
                  <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Self</SelectItem>
                    <SelectItem value="govt_bank">Govt Bank Loan</SelectItem>
                    <SelectItem value="private_bank">Private Bank Loan</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="Bank Name">
                <Input value={form.bankName ?? ''} onChange={(e) => set('bankName', e.target.value)} />
              </F>
              <F label="Loan Amount (₹)">
                <Input type="number" step="1" value={form.loanAmount ?? ''} onChange={(e) => set('loanAmount', e.target.value)} />
              </F>
              <F label="Loan Sanctioned Date">
                <Input type="date" value={form.loanSanctionedDate ?? ''} onChange={(e) => set('loanSanctionedDate', e.target.value)} />
              </F>
              <F label="Overpayment Rule">
                <Select value={sv(form.overpaymentRule) ?? 'warn'} onValueChange={(v) => set('overpaymentRule', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warn">Warn (allow with warning)</SelectItem>
                    <SelectItem value="block">Block (prevent overpayment)</SelectItem>
                  </SelectContent>
                </Select>
              </F>
            </div>
          </TabsContent>

          {/* ── Tab 3: Survey & DISCOM ── */}
          <TabsContent value="discom" className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Site Survey</p>
            <div className="grid grid-cols-2 gap-3">
              <F label="Survey Date">
                <Input type="date" value={form.surveyDate ?? ''} onChange={(e) => set('surveyDate', e.target.value)} />
              </F>
              <F label="Surveyed By">
                <Input value={form.surveyedBy ?? ''} onChange={(e) => set('surveyedBy', e.target.value)} />
              </F>
              <F label="Roof Area (sqft)">
                <Input type="number" step="0.01" value={form.roofAreaSqft ?? ''} onChange={(e) => set('roofAreaSqft', e.target.value)} />
              </F>
              <F label="Recommended Capacity (kW)">
                <Input type="number" step="0.01" value={form.recommendedCapacityKw ?? ''} onChange={(e) => set('recommendedCapacityKw', e.target.value)} />
              </F>
              <div className="col-span-2">
                <F label="Shadow Analysis Notes">
                  <Textarea rows={2} value={form.shadowAnalysis ?? ''} onChange={(e) => set('shadowAnalysis', e.target.value)} />
                </F>
              </div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">DISCOM Application</p>
            <div className="grid grid-cols-2 gap-3">
              <F label="Portal Application Date">
                <Input type="date" value={form.portalApplicationDate ?? ''} onChange={(e) => set('portalApplicationDate', e.target.value)} />
              </F>
              <F label="JE Name">
                <Input value={form.jeName ?? ''} onChange={(e) => set('jeName', e.target.value)} />
              </F>
              <F label="JE Contact">
                <Input maxLength={10} value={form.jeContact ?? ''} onChange={(e) => set('jeContact', e.target.value)} />
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
              <div className="col-span-2">
                <F label="Net Meter Serial No.">
                  <Input value={form.netMeterSerialNo ?? ''} onChange={(e) => set('netMeterSerialNo', e.target.value)} />
                </F>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

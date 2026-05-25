import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Settings2, Power, ChevronDown, BadgeDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DateSelectPicker } from '@/components/ui/date-select-picker';
import { vendorCommissionService } from '@/services/vendor-commission.service';
import { commissionStructuresService } from '@/services/commission-structures.service';
import { vendorsService } from '@/services/vendors.service';
import { usersService } from '@/services/users.service';
import type { VendorCommissionAssignment, CommissionStructure, ConfigSchemaField, EmployeePayable, PayableIncentive, User } from '@/types';
import { SlabTableEditor, SlabTableViewer } from './components/SlabTableEditor';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STRUCTURE_TYPE_LABELS: Record<string, string> = {
  per_kw: 'Per KW',
  percentage: 'Percentage',
  fixed_per_project: 'Fixed Per Project',
  slab_based: 'Slab Based',
};
const INCENTIVE_TYPES = ['Fuel', 'Gift', 'Performance Bonus', 'Other'];

export default function CommissionPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'assignments' | 'payables'>('assignments');

  // ── ASSIGNMENT STATE ──────────────────────────────────────────────
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignVendorId, setAssignVendorId] = useState('');
  const [assignForm, setAssignForm] = useState({ employeeId: '', commissionStructureId: '', effectiveFrom: '' });
  const [configOpen, setConfigOpen] = useState(false);
  const [configAssignment, setConfigAssignment] = useState<VendorCommissionAssignment | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [slabData, setSlabData] = useState<Array<{ from: number; to: number; rate: number }>>([]);

  // ── PAYABLE STATE ─────────────────────────────────────────────────
  const [filterVendorId, setFilterVendorId] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genForm, setGenForm] = useState({ employeeId: '', month: '', year: '' });
  const [selectedPayable, setSelectedPayable] = useState<EmployeePayable | null>(null);
  const [payableDetailOpen, setPayableDetailOpen] = useState(false);
  const [incentiveType, setIncentiveType] = useState('');
  const [incentiveAmount, setIncentiveAmount] = useState('');
  const [incentiveNote, setIncentiveNote] = useState('');
  const [salaryInput, setSalaryInput] = useState('');

  // ── QUERIES ───────────────────────────────────────────────────────
  const { data: assignmentsData, isLoading: assignLoading } = useQuery({
    queryKey: ['vendor-commission-assignments'],
    queryFn: () => vendorCommissionService.getAssignments(),
  });
  const assignments: VendorCommissionAssignment[] = assignmentsData?.data ?? [];

  const { data: structuresData } = useQuery({
    queryKey: ['commission-structures'],
    queryFn: () => commissionStructuresService.getAll(),
  });
  const structures: CommissionStructure[] = (structuresData?.data ?? []).filter((s) => s.isActive);

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors', 'all'],
    queryFn: () => vendorsService.getVendors({ limit: 100 }),
  });
  const vendors = vendorsData?.data ?? [];

  const { data: assignVendorMembersData } = useQuery({
    queryKey: ['vendor-team', assignVendorId],
    queryFn: () => usersService.getVendorTeam(assignVendorId || undefined),
    enabled: !!assignVendorId,
  });
  const assignVendorMembers: User[] = assignVendorMembersData?.data ?? [];

  const { data: allMembersData } = useQuery({
    queryKey: ['vendor-team-all'],
    queryFn: () => usersService.getVendorTeam(),
  });
  const allMembers: User[] = allMembersData?.data ?? [];

  const payableFilters = {
    ...(filterVendorId && { vendorId: filterVendorId }),
    ...(filterMonth && { month: parseInt(filterMonth) }),
    ...(filterYear && { year: parseInt(filterYear) }),
  };
  const { data: payablesData, isLoading: payableLoading } = useQuery({
    queryKey: ['vendor-commission-payables', payableFilters],
    queryFn: () => vendorCommissionService.getPayables(payableFilters),
    enabled: tab === 'payables',
  });
  const payables: EmployeePayable[] = payablesData?.data ?? [];

  // ── MUTATIONS ─────────────────────────────────────────────────────
  const assignMutation = useMutation({
    mutationFn: () => vendorCommissionService.createAssignment({
      employeeId: assignForm.employeeId,
      commissionStructureId: assignForm.commissionStructureId,
      effectiveFrom: assignForm.effectiveFrom,
    }),
    onSuccess: () => {
      toast.success('Commission structure assigned');
      queryClient.invalidateQueries({ queryKey: ['vendor-commission-assignments'] });
      setAssignOpen(false);
      setAssignVendorId('');
      setAssignForm({ employeeId: '', commissionStructureId: '', effectiveFrom: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to assign'),
  });

  const toggleAssignMutation = useMutation({
    mutationFn: (id: string) => vendorCommissionService.toggleAssignment(id),
    onSuccess: () => { toast.success('Status updated'); queryClient.invalidateQueries({ queryKey: ['vendor-commission-assignments'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const saveConfigMutation = useMutation({
    mutationFn: () => {
      if (!configAssignment) throw new Error('No assignment');
      const configs = Object.entries(configValues).map(([configKey, configValue]) => ({ configKey, configValue }));
      return vendorCommissionService.saveConfig(configAssignment.id, configs);
    },
    onSuccess: () => {
      toast.success('Configuration saved');
      queryClient.invalidateQueries({ queryKey: ['vendor-commission-assignments'] });
      setConfigOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save config'),
  });

  const generateMutation = useMutation({
    mutationFn: () => vendorCommissionService.generatePayables({
      employeeId: genForm.employeeId,
      month: parseInt(genForm.month),
      year: parseInt(genForm.year),
    }),
    onSuccess: () => {
      toast.success('Payable generated');
      queryClient.invalidateQueries({ queryKey: ['vendor-commission-payables'] });
      setGenerateOpen(false);
      setGenForm({ employeeId: '', month: '', year: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to generate'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => vendorCommissionService.approvePayable(id),
    onSuccess: () => {
      toast.success('Payable approved');
      queryClient.invalidateQueries({ queryKey: ['vendor-commission-payables'] });
      if (selectedPayable) setSelectedPayable((p) => p ? { ...p, status: 'approved' } : p);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const salarySaveMutation = useMutation({
    mutationFn: ({ id, salary }: { id: string; salary: number }) => vendorCommissionService.updateSalary(id, salary),
    onSuccess: (res) => {
      toast.success('Salary updated');
      queryClient.invalidateQueries({ queryKey: ['vendor-commission-payables'] });
      setSelectedPayable(res.data);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const addIncentiveMutation = useMutation({
    mutationFn: () => vendorCommissionService.addIncentive(selectedPayable!.id, {
      type: incentiveType,
      amount: parseFloat(incentiveAmount),
      note: incentiveNote || undefined,
    }),
    onSuccess: () => {
      toast.success('Incentive added');
      queryClient.invalidateQueries({ queryKey: ['vendor-commission-payables'] });
      setIncentiveType(''); setIncentiveAmount(''); setIncentiveNote('');
      // Refresh payable detail
      vendorCommissionService.getPayable(selectedPayable!.id).then((r) => setSelectedPayable(r.data));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const removeIncentiveMutation = useMutation({
    mutationFn: ({ incentiveId }: { incentiveId: string }) =>
      vendorCommissionService.removeIncentive(selectedPayable!.id, incentiveId),
    onSuccess: () => {
      toast.success('Incentive removed');
      queryClient.invalidateQueries({ queryKey: ['vendor-commission-payables'] });
      vendorCommissionService.getPayable(selectedPayable!.id).then((r) => setSelectedPayable(r.data));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  // ── CONFIG HELPERS ────────────────────────────────────────────────
  const openConfigDialog = (a: VendorCommissionAssignment) => {
    setConfigAssignment(a);
    const vals: Record<string, string> = {};
    for (const c of a.configs) vals[c.configKey] = c.configValue;
    setConfigValues(vals);
    // Pre-populate slabs if slab_based
    if (a.commissionStructure?.structureType === 'slab_based') {
      try { setSlabData(JSON.parse(vals['slabs'] ?? '[]')); } catch { setSlabData([]); }
    }
    setConfigOpen(true);
  };

  const getConfigField = (field: ConfigSchemaField) => {
    if (field.type === 'slab_table') {
      return (
        <div key={field.key}>
          <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{field.label}{field.required ? ' *' : ''}</label>
          <SlabTableEditor
            value={slabData}
            onChange={(v) => {
              setSlabData(v);
              setConfigValues((cv) => ({ ...cv, slabs: JSON.stringify(v) }));
            }}
          />
        </div>
      );
    }
    return (
      <div key={field.key}>
        <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{field.label}{field.required ? ' *' : ''}</label>
        <Input
          className="mt-1"
          type={field.type === 'number' ? 'number' : 'text'}
          step={field.type === 'number' ? 'any' : undefined}
          placeholder={field.required ? 'Required' : 'Optional'}
          value={configValues[field.key] ?? ''}
          onChange={(e) => setConfigValues((cv) => ({ ...cv, [field.key]: e.target.value }))}
        />
      </div>
    );
  };

  const openPayableDetail = async (p: EmployeePayable) => {
    const res = await vendorCommissionService.getPayable(p.id);
    setSelectedPayable(res.data);
    setSalaryInput(String(res.data.salaryAmount));
    setPayableDetailOpen(true);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-surface-container-high text-on-surface-variant/60',
      approved: 'bg-secondary/10 text-secondary',
      paid: 'bg-primary/10 text-primary',
    };
    return <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${map[status] ?? ''}`}>{status}</span>;
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-on-surface flex items-center gap-2"><BadgeDollarSign size={20} />Commission Management</h1>
        <p className="text-sm text-on-surface-variant/60 mt-0.5">Assign commission structures to vendors and generate team payables</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-outline-variant/10">
        {(['assignments', 'payables'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-colors capitalize ${tab === t ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/50 hover:text-on-surface-variant'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── ASSIGNMENTS TAB ── */}
      {tab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setAssignOpen(true)}><Plus size={14} />Assign Structure</Button>
          </div>
          {assignLoading && <p className="text-sm text-on-surface-variant/60">Loading...</p>}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
            {assignments.length === 0 && !assignLoading ? (
              <p className="text-sm text-center text-on-surface-variant/50 py-12">No assignments yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Team Member</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Vendor Team</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Structure</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Effective From</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id} className="border-b border-outline-variant/5 last:border-0 hover:bg-surface-container transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium">{a.employee?.name ?? '—'}</p>
                        <p className="text-xs text-on-surface-variant/50">{a.employee?.vendorLevel ?? ''}</p>
                      </td>
                      <td className="px-5 py-3 text-on-surface-variant/70 text-sm">{a.vendor?.businessName ?? '—'}</td>
                      <td className="px-5 py-3">
                        <p>{a.commissionStructure?.name ?? '—'}</p>
                        <p className="text-xs text-on-surface-variant/50">{STRUCTURE_TYPE_LABELS[a.commissionStructure?.structureType ?? ''] ?? ''}</p>
                      </td>
                      <td className="px-5 py-3 text-on-surface-variant/70">{new Date(a.effectiveFrom).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${a.isActive ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-high text-on-surface-variant/50'}`}>
                          {a.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="secondary" onClick={() => openConfigDialog(a)}><Settings2 size={13} />Configure</Button>
                          <button onClick={() => toggleAssignMutation.mutate(a.id)} className="p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant/50 hover:text-primary">
                            <Power size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── PAYABLES TAB ── */}
      {tab === 'payables' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={filterVendorId || '_all_'} onValueChange={(v) => setFilterVendorId(v === '_all_' ? '' : v)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Teams" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">All Teams</SelectItem>
                {vendors.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.businessName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterMonth || '_all_'} onValueChange={(v) => setFilterMonth(v === '_all_' ? '' : v)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Month" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">All Months</SelectItem>
                {MONTH_NAMES.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterYear || '_all_'} onValueChange={(v) => setFilterYear(v === '_all_' ? '' : v)}>
              <SelectTrigger className="w-28"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">All Years</SelectItem>
                {yearOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button size="sm" onClick={() => { setGenForm({ employeeId: '', month: '', year: '' }); setGenerateOpen(true); }}>
              <Plus size={14} />Generate Payables
            </Button>
          </div>

          {payableLoading && <p className="text-sm text-on-surface-variant/60">Loading...</p>}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
            {payables.length === 0 && !payableLoading ? (
              <p className="text-sm text-center text-on-surface-variant/50 py-12">No payables found</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Employee</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Vendor Team</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Period</th>
                    <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Projects</th>
                    <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Total kW</th>
                    <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Total Payable</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {payables.map((p) => (
                    <tr key={p.id} className="border-b border-outline-variant/5 last:border-0 hover:bg-surface-container transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium">{p.employee?.name ?? '—'}</p>
                        <p className="text-xs text-on-surface-variant/50">{p.employee?.vendorLevel ?? ''}</p>
                      </td>
                      <td className="px-5 py-3 text-on-surface-variant/70">{p.vendor?.businessName ?? '—'}</td>
                      <td className="px-5 py-3 text-on-surface-variant/70">{MONTH_NAMES[p.month - 1]} {p.year}</td>
                      <td className="px-5 py-3 text-right">{p.projectCount}</td>
                      <td className="px-5 py-3 text-right">{Number(p.totalKw).toFixed(2)}</td>
                      <td className="px-5 py-3 text-right font-bold">₹{Number(p.totalPayable).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3">{statusBadge(p.status)}</td>
                      <td className="px-5 py-3">
                        <Button size="sm" variant="secondary" onClick={() => openPayableDetail(p)}>Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── ASSIGN DIALOG ── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Commission Structure</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Vendor Team *</label>
              <Select value={assignVendorId} onValueChange={(v) => { setAssignVendorId(v); setAssignForm((f) => ({ ...f, employeeId: '' })); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select vendor team" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.businessName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Team Member *</label>
              <Select
                value={assignForm.employeeId}
                onValueChange={(v) => setAssignForm((f) => ({ ...f, employeeId: v }))}
                disabled={!assignVendorId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={assignVendorId ? 'Select team member' : 'Select vendor team first'} />
                </SelectTrigger>
                <SelectContent>
                  {assignVendorMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} <span className="text-on-surface-variant/50 ml-1">({m.vendorLevel})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Commission Structure *</label>
              <Select value={assignForm.commissionStructureId} onValueChange={(v) => setAssignForm((f) => ({ ...f, commissionStructureId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select structure" /></SelectTrigger>
                <SelectContent>
                  {structures.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span>{s.name}</span>
                      <span className="text-on-surface-variant/50 ml-1 text-xs">— {STRUCTURE_TYPE_LABELS[s.structureType]}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Effective From *</label>
              <DateSelectPicker className="mt-1" value={assignForm.effectiveFrom} onChange={(v) => setAssignForm((f) => ({ ...f, effectiveFrom: v }))} placeholder="Select date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              onClick={() => assignMutation.mutate()}
              loading={assignMutation.isPending}
              disabled={!assignForm.employeeId || !assignForm.commissionStructureId || !assignForm.effectiveFrom}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CONFIG DIALOG ── */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure: {configAssignment?.vendor?.businessName}</DialogTitle>
            <p className="text-xs text-on-surface-variant/60">{configAssignment?.commissionStructure?.name}</p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(configAssignment?.commissionStructure?.configSchema ?? []).map((field) => getConfigField(field))}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfigOpen(false)}>Cancel</Button>
            <Button onClick={() => saveConfigMutation.mutate()} loading={saveConfigMutation.isPending}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── GENERATE DIALOG ── */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Generate Monthly Payables</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Team Member *</label>
              <Select value={genForm.employeeId} onValueChange={(v) => setGenForm((f) => ({ ...f, employeeId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select team member" /></SelectTrigger>
                <SelectContent>
                  {allMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} <span className="text-on-surface-variant/50 ml-1">({m.vendorLevel})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Month *</label>
                <Select value={genForm.month} onValueChange={(v) => setGenForm((f) => ({ ...f, month: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Year *</label>
                <Select value={genForm.year} onValueChange={(v) => setGenForm((f) => ({ ...f, year: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant/50">Calculates commission for this team member based on applicants they created with sanctioned capacity in the selected month.</p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => generateMutation.mutate()}
              loading={generateMutation.isPending}
              disabled={!genForm.employeeId || !genForm.month || !genForm.year}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PAYABLE DETAIL DIALOG ── */}
      <Dialog open={payableDetailOpen} onOpenChange={setPayableDetailOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {selectedPayable && (
            <>
              <DialogHeader>
                <DialogTitle>Payable Details</DialogTitle>
                <p className="text-xs text-on-surface-variant/60">
                  {selectedPayable.employee?.name} · {selectedPayable.employee?.vendorLevel} · {MONTH_NAMES[selectedPayable.month - 1]} {selectedPayable.year}
                </p>
              </DialogHeader>
              <div className="space-y-5 py-2">
                {/* Summary Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Projects', value: selectedPayable.projectCount },
                    { label: 'Total kW', value: Number(selectedPayable.totalKw).toFixed(2) },
                    { label: 'Commission', value: `₹${Number(selectedPayable.commissionAmount).toLocaleString('en-IN')}` },
                    { label: 'Salary', value: `₹${Number(selectedPayable.salaryAmount).toLocaleString('en-IN')}` },
                    { label: 'Incentives', value: `₹${Number(selectedPayable.incentiveAmount).toLocaleString('en-IN')}` },
                    { label: 'Total', value: `₹${Number(selectedPayable.totalPayable).toLocaleString('en-IN')}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-surface-container rounded-xl px-3 py-2 text-center">
                      <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-black text-on-surface mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Salary Update */}
                {selectedPayable.status !== 'paid' && (
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Update Salary (₹)</label>
                    <div className="flex gap-2 mt-1">
                      <Input type="number" min={0} value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)} placeholder="Enter salary amount" />
                      <Button variant="secondary" size="sm" loading={salarySaveMutation.isPending}
                        onClick={() => salarySaveMutation.mutate({ id: selectedPayable.id, salary: parseFloat(salaryInput) || 0 })}>
                        Save
                      </Button>
                    </div>
                  </div>
                )}

                {/* Incentives */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-2">Incentives</p>
                  {selectedPayable.incentives?.length === 0 && (
                    <p className="text-xs text-on-surface-variant/40 italic mb-2">No incentives added</p>
                  )}
                  <div className="space-y-1.5 mb-3">
                    {selectedPayable.incentives?.map((inc: PayableIncentive) => (
                      <div key={inc.id} className="flex items-center justify-between bg-surface-container rounded-xl px-3 py-2">
                        <div>
                          <span className="text-xs font-bold">{inc.type}</span>
                          {inc.note && <span className="text-xs text-on-surface-variant/50 ml-2">— {inc.note}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">₹{Number(inc.amount).toLocaleString('en-IN')}</span>
                          {selectedPayable.status !== 'paid' && (
                            <button
                              onClick={() => removeIncentiveMutation.mutate({ incentiveId: inc.id })}
                              className="text-error/50 hover:text-error transition-colors text-xs">✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedPayable.status !== 'paid' && (
                    <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
                      <Select value={incentiveType} onValueChange={setIncentiveType}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          {INCENTIVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input type="number" min={0} placeholder="Amount (₹)" className="h-8 text-xs" value={incentiveAmount} onChange={(e) => setIncentiveAmount(e.target.value)} />
                      <Input placeholder="Note" className="h-8 text-xs" value={incentiveNote} onChange={(e) => setIncentiveNote(e.target.value)} />
                      <Button size="sm" loading={addIncentiveMutation.isPending}
                        disabled={!incentiveType || !incentiveAmount}
                        onClick={() => addIncentiveMutation.mutate()}>
                        <Plus size={13} />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Status + Approve */}
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant/60">Status:</span>
                    {statusBadge(selectedPayable.status)}
                  </div>
                  {selectedPayable.status === 'draft' && (
                    <Button onClick={() => approveMutation.mutate(selectedPayable.id)} loading={approveMutation.isPending}>
                      Approve Payable
                    </Button>
                  )}
                  {selectedPayable.status === 'approved' && (
                    <p className="text-xs text-on-surface-variant/50">Approved by {selectedPayable.approvedBy?.name ?? '—'}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

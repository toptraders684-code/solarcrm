import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, LogOut, FileText, Users, Building2, Database, Activity, Zap, BadgeDollarSign, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { discomMasterService } from '@/services/discom-master.service';
import { masterDataService } from '@/services/masterData.service';
import { masterService } from '@/services/master.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import type { DiscomMasterItem } from '@/types';

interface FormState {
  districtId: string;
  code: string;
  name: string;
  fullform: string;
  headquarters: string;
  sortOrder: string;
}

const DEFAULT_FORM: FormState = {
  districtId: '',
  code: '',
  name: '',
  fullform: '',
  headquarters: '',
  sortOrder: '0',
};

export default function DiscomMasterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<DiscomMasterItem | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [deleteItem, setDeleteItem] = useState<DiscomMasterItem | null>(null);
  const [filterDistrictId, setFilterDistrictId] = useState<string>('');

  const { data: allData, isLoading } = useQuery({
    queryKey: ['discom-master-all'],
    queryFn: () => discomMasterService.listAll(),
  });

  const { data: refDiscomsData } = useQuery({
    queryKey: ['master-data', 'discoms'],
    queryFn: () => masterDataService.list('discoms', true),
  });
  const refDiscoms: Array<{ id: string; code: string; fullform?: string }> = refDiscomsData?.data ?? [];

  const { data: hqData } = useQuery({
    queryKey: ['master-data', 'hq', 'active'],
    queryFn: () => masterDataService.listHq(true),
  });
  const hqOptions: Array<{ id: string; name: string }> = hqData?.data ?? [];

  const { data: statesData } = useQuery({ queryKey: ['states'], queryFn: () => masterService.getStates() });
  const [formStateId, setFormStateId] = useState('');
  const { data: formDistrictsData } = useQuery({
    queryKey: ['districts', formStateId],
    queryFn: () => masterService.getDistricts(formStateId),
    enabled: !!formStateId,
  });
  const { data: filterDistrictsData } = useQuery({
    queryKey: ['districts-all'],
    queryFn: () => masterService.getDistricts(),
  });

  const items = (allData?.data ?? []).filter((d) =>
    filterDistrictId ? d.districtId === filterDistrictId : true,
  );

  const closeForm = () => {
    setFormOpen(false);
    setEditItem(null);
    setForm(DEFAULT_FORM);
    setFormStateId('');
  };

  const openAdd = () => {
    setEditItem(null);
    setForm(DEFAULT_FORM);
    setFormStateId('');
    setFormOpen(true);
  };

  const openEdit = (item: DiscomMasterItem) => {
    setEditItem(item);
    setForm({
      districtId: item.districtId ?? '',
      code: item.code,
      name: item.name,
      fullform: item.fullform ?? '',
      headquarters: item.headquarters ?? '',
      sortOrder: String(item.sortOrder),
    });
    setFormStateId(item.district?.state?.id ?? '');
    setFormOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: () => discomMasterService.create({
      districtId: form.districtId || undefined,
      code: form.code,
      name: form.name,
      fullform: form.fullform || undefined,
      headquarters: form.headquarters || undefined,
      sortOrder: form.sortOrder ? parseInt(form.sortOrder) : 0,
    }),
    onSuccess: () => {
      toast.success('DISCOM added');
      queryClient.invalidateQueries({ queryKey: ['discom-master-all'] });
      closeForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add'),
  });

  const updateMutation = useMutation({
    mutationFn: () => discomMasterService.update(editItem!.id, {
      districtId: form.districtId || null,
      code: form.code,
      name: form.name,
      fullform: form.fullform || null,
      headquarters: form.headquarters || null,
      sortOrder: form.sortOrder ? parseInt(form.sortOrder) : 0,
    }),
    onSuccess: () => {
      toast.success('DISCOM updated');
      queryClient.invalidateQueries({ queryKey: ['discom-master-all'] });
      closeForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
  });

  const toggleMutation = useMutation({
    mutationFn: (item: DiscomMasterItem) => discomMasterService.update(item.id, { isActive: !item.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discom-master-all'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => discomMasterService.remove(deleteItem!.id),
    onSuccess: () => {
      toast.success('DISCOM deleted');
      queryClient.invalidateQueries({ queryKey: ['discom-master-all'] });
      setDeleteItem(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const handleSubmit = () => {
    if (!form.code.trim()) {
      toast.error('DISCOM Code is required');
      return;
    }
    if (!form.districtId) {
      toast.error('District is required');
      return;
    }
    editItem ? updateMutation.mutate() : createMutation.mutate();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/admin');
  };

  const NAV_TABS = [
    { to: '/admin/companies', icon: Building2, label: 'Companies' },
    { to: '/admin/documents', icon: FileText, label: 'Document Master' },
    { to: '/admin/discoms', icon: Zap, label: 'DISCOM Master' },
    { to: '/admin/masters', icon: Database, label: 'Master Data' },
    { to: '/admin/users', icon: Users, label: 'Admin Users' },
    { to: '/admin/logs', icon: Activity, label: 'Activity Logs' },
    { to: '/admin/commission', icon: BadgeDollarSign, label: 'Commission Structures' },
    { to: '/admin/checklist', icon: ClipboardList, label: 'Checklist Master' },
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-20 w-full bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
        <div className="flex items-center justify-between h-16 px-8">
          <div className="flex items-center gap-3">
            <img src="/images/solar.png" alt="Usolar" className="w-8 h-8 object-contain rounded-lg" />
            <div>
              <p className="text-sm font-black text-primary leading-none">Usolar CRM</p>
              <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest">Super Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-on-surface-variant hidden sm:block">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:bg-error/5 hover:text-error transition-colors"
            >
              <LogOut size={15} />Logout
            </button>
          </div>
        </div>
        <div className="flex gap-1 px-8 border-t border-outline-variant/10">
          {NAV_TABS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                isActive ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/50 hover:text-on-surface-variant'
              }`}>
              <Icon size={13} />{label}
            </NavLink>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8">
        {/* Title row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-on-surface">DISCOM Master</h1>
            <p className="text-xs text-on-surface-variant/50 mt-0.5">District-wise electricity distribution companies</p>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus size={13} />Add DISCOM
          </Button>
        </div>

        {/* Filter */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">Filter by District</span>
          <Select value={filterDistrictId || undefined} onValueChange={setFilterDistrictId}>
            <SelectTrigger className="w-56 h-8 text-xs">
              <SelectValue placeholder="All districts" />
            </SelectTrigger>
            <SelectContent>
              {filterDistrictsData?.data?.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterDistrictId && (
            <button onClick={() => setFilterDistrictId('')} className="text-xs text-primary underline">Clear</button>
          )}
        </div>

        {/* Table */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-high">
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 w-12">Sl</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">District</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">DISCOM Name</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Full Form</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Headquarters</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-on-surface-variant/40">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-on-surface-variant/40">No DISCOMs found. Add one to get started.</td></tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-outline-variant/5 hover:bg-surface-container-high/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-on-surface-variant/40">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-on-surface">{item.district?.name ?? <span className="text-on-surface-variant/30 italic">—</span>}</span>
                      {item.district?.state && (
                        <span className="block text-[10px] text-on-surface-variant/40">{item.district.state.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-black text-primary">{item.code}</span>
                      {item.name !== item.code && (
                        <span className="block text-[10px] text-on-surface-variant/50">{item.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">{item.fullform ?? <span className="text-on-surface-variant/30 italic">—</span>}</td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">{item.headquarters ?? <span className="text-on-surface-variant/30 italic">—</span>}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleMutation.mutate(item)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-surface-container-high text-on-surface-variant/40'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteItem(item)}
                          className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => { if (!v) closeForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit DISCOM' : 'Add DISCOM'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* State → District */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">State</label>
                <Select
                  value={formStateId || undefined}
                  onValueChange={(v) => { setFormStateId(v); setForm((f) => ({ ...f, districtId: '' })); }}
                >
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {statesData?.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">District <span className="text-error">*</span></label>
                <Select
                  value={form.districtId || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, districtId: v }))}
                  disabled={!formStateId}
                >
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>
                    {formDistrictsData?.data?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">DISCOM Code *</label>
              <Select
                value={form.code || undefined}
                onValueChange={(v) => {
                  const ref = refDiscoms.find((d) => d.code === v);
                  setForm((f) => ({
                    ...f,
                    code: v,
                    name: v,
                    fullform: ref?.fullform ?? f.fullform,
                  }));
                }}
              >
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue placeholder="Select DISCOM code..." />
                </SelectTrigger>
                <SelectContent>
                  {refDiscoms.map((d) => (
                    <SelectItem key={d.id} value={d.code}>
                      {d.code}{d.fullform ? ` — ${d.fullform}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {refDiscoms.length === 0 && (
                <p className="text-[10px] text-on-surface-variant/40 mt-1">No DISCOMs in Master Data yet. Add them under Master Data → DISCOMs tab first.</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Headquarters</label>
              <Select
                value={form.headquarters || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, headquarters: v }))}
              >
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue placeholder="Select headquarters..." />
                </SelectTrigger>
                <SelectContent>
                  {hqOptions.map((h) => (
                    <SelectItem key={h.id} value={h.name}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hqOptions.length === 0 && (
                <p className="text-[10px] text-on-surface-variant/40 mt-1">No headquarters in Master Data yet. Add them under Master Data → Headquarters tab first.</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Sort Order</label>
              <Input
                className="mt-1 h-9 text-sm"
                type="number"
                placeholder="0"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSubmit} loading={isPending}>
              {editItem ? 'Save Changes' : 'Add DISCOM'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteItem}
        title="Delete DISCOM"
        description={`Are you sure you want to delete "${deleteItem?.code}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onOpenChange={(v) => { if (!v) setDeleteItem(null); }}
      />
    </div>
  );
}

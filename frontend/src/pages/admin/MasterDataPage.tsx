import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Users, FileText, Building2, Database, Activity, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { masterDataService, MasterType } from '@/services/masterData.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

type Tab = MasterType | 'stages';

const TABS: { id: Tab; label: string }[] = [
  { id: 'discoms', label: 'DISCOMs' },
  { id: 'lead-sources', label: 'Lead Sources' },
  { id: 'vendor-types', label: 'Vendor Types' },
  { id: 'payment-methods', label: 'Payment Methods' },
  { id: 'project-types', label: 'Project Types' },
  { id: 'stages', label: 'Project Stages' },
];

interface SimpleItem { id: string; name: string; code: string; isActive: boolean; sortOrder: number; }
interface StageItem { id: string; stageNumber: number; name: string; description?: string; isActive: boolean; }

function AdminHeader({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
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
          <button onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:bg-error/5 hover:text-error transition-colors">
            <LogOut size={15} />Logout
          </button>
        </div>
      </div>
      <div className="flex gap-1 px-8 border-t border-outline-variant/10">
        {[
          { to: '/admin/companies', icon: Building2, label: 'Companies' },
          { to: '/admin/documents', icon: FileText, label: 'Document Master' },
          { to: '/admin/masters', icon: Database, label: 'Master Data' },
          { to: '/admin/users', icon: Users, label: 'Admin Users' },
          { to: '/admin/logs', icon: Activity, label: 'Activity Logs' },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              isActive ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/50 hover:text-on-surface-variant'
            }`}>
            <Icon size={13} />{label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}

export default function MasterDataPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('discoms');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SimpleItem | StageItem | null>(null);
  const [form, setForm] = useState({ name: '', code: '', sortOrder: '0', description: '', stageNumber: '' });

  const isStages = activeTab === 'stages';

  const { data, isLoading } = useQuery({
    queryKey: ['master-data', activeTab],
    queryFn: () => masterDataService.list(activeTab),
  });
  const items: any[] = data?.data ?? [];

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/admin');
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', code: '', sortOrder: '0', description: '', stageNumber: '' });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name: item.name,
      code: (item as SimpleItem).code ?? '',
      sortOrder: String((item as SimpleItem).sortOrder ?? 0),
      description: (item as StageItem).description ?? '',
      stageNumber: String((item as StageItem).stageNumber ?? ''),
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isStages) {
        if (editItem) {
          return masterDataService.updateStage(editItem.id, { name: form.name, description: form.description || undefined });
        }
        return masterDataService.createStage({ stageNumber: Number(form.stageNumber), name: form.name, description: form.description || undefined });
      } else {
        const type = activeTab as MasterType;
        if (editItem) {
          return masterDataService.update(type, editItem.id, { name: form.name, code: form.code, sortOrder: Number(form.sortOrder) });
        }
        return masterDataService.create(type, { name: form.name, code: form.code, sortOrder: Number(form.sortOrder) });
      }
    },
    onSuccess: () => {
      toast.success(editItem ? 'Updated' : 'Created');
      queryClient.invalidateQueries({ queryKey: ['master-data', activeTab] });
      setDialogOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isStages) return masterDataService.updateStage(id, { isActive: !isActive });
      return masterDataService.update(activeTab as MasterType, id, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-data', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['master-enums'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const canSave = isStages
    ? form.name.trim().length > 0 && (editItem || form.stageNumber.trim().length > 0)
    : form.name.trim().length > 0 && form.code.trim().length > 0;

  return (
    <div className="min-h-screen bg-surface">
      <AdminHeader user={user} onLogout={handleLogout} />

      <main className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-black text-on-surface">Master Data</h1>
          <p className="text-sm text-on-surface-variant/60 mt-0.5">Manage dropdown options used across the application</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-outline-variant/20">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/50 hover:text-on-surface-variant'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant/10 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">
              {TABS.find((t) => t.id === activeTab)?.label}
            </p>
            <Button size="sm" onClick={openCreate}>
              <Plus size={13} />Add
            </Button>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-surface-container rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/5">
                  {isStages ? (
                    <>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 w-16">No.</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Stage Name</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Description</th>
                    </>
                  ) : (
                    <>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Name</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Code</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 w-20">Order</th>
                    </>
                  )}
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 w-20">Active</th>
                  <th className="px-5 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {items.map((item) => (
                  <tr key={item.id} className={`hover:bg-surface-container-low/30 transition-colors ${!item.isActive ? 'opacity-50' : ''}`}>
                    {isStages ? (
                      <>
                        <td className="px-5 py-3 text-xs font-black text-primary">{item.stageNumber}</td>
                        <td className="px-5 py-3 font-semibold text-on-surface">{item.name}</td>
                        <td className="px-5 py-3 text-xs text-on-surface-variant/60 max-w-xs truncate">{item.description || '—'}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3 font-semibold text-on-surface">{item.name}</td>
                        <td className="px-5 py-3 font-mono text-xs text-on-surface-variant/70">{item.code}</td>
                        <td className="px-5 py-3 text-xs text-on-surface-variant/60">{item.sortOrder}</td>
                      </>
                    )}
                    <td className="px-5 py-3">
                      <button onClick={() => toggleMutation.mutate({ id: item.id, isActive: item.isActive })}
                        className="text-on-surface-variant/40 hover:text-primary transition-colors">
                        {item.isActive
                          ? <ToggleRight size={20} className="text-primary" />
                          : <ToggleLeft size={20} />
                        }
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => openEdit(item)}
                        className="flex items-center gap-1 text-xs text-on-surface-variant/50 hover:text-primary transition-colors">
                        <Pencil size={12} />Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-on-surface-variant/50">
                      No items yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit' : 'Add'} {TABS.find((t) => t.id === activeTab)?.label.replace(/s$/, '')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isStages && !editItem && (
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Stage Number <span className="text-error">*</span></label>
                <Input className="mt-1" type="number" min={1} placeholder="e.g. 12" value={form.stageNumber}
                  onChange={(e) => setForm((f) => ({ ...f, stageNumber: e.target.value }))} />
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Name <span className="text-error">*</span></label>
              <Input className="mt-1" placeholder="Display name" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            {isStages ? (
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Description</label>
                <Input className="mt-1" placeholder="Short description (optional)" value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Code <span className="text-error">*</span></label>
                  <Input className="mt-1" placeholder="e.g. walk_in (used in data)" value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
                  <p className="text-[10px] text-on-surface-variant/40 mt-1">Lowercase, underscores only. Cannot change after data is saved.</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Sort Order</label>
                  <Input className="mt-1" type="number" min={0} value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={!canSave} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {editItem ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

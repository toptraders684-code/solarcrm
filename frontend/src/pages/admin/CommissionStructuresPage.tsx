import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Power, Pencil, ChevronDown, ChevronUp, Trash2, Building2, FileText, Zap, Database, Users, Activity, BadgeDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { commissionStructuresService } from '@/services/commission-structures.service';
import type { CommissionStructure, ConfigSchemaField, CommissionStructureType } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const STRUCTURE_TYPE_LABELS: Record<CommissionStructureType, string> = {
  per_kw: 'Per KW Commission',
  percentage: 'Percentage of Project Value',
  fixed_per_project: 'Fixed Per Project',
  slab_based: 'Slab-Based Incentive',
};

const DEFAULT_SCHEMAS: Record<CommissionStructureType, ConfigSchemaField[]> = {
  per_kw: [
    { key: 'rate_per_kw', label: 'Rate Per KW (₹)', type: 'number', required: true },
    { key: 'min_project_kw', label: 'Minimum Project Size (kW)', type: 'number', required: false },
    { key: 'bonus_threshold_kw', label: 'Bonus Threshold (kW)', type: 'number', required: false },
    { key: 'bonus_rate_per_kw', label: 'Bonus Rate Per KW (₹)', type: 'number', required: false },
  ],
  percentage: [
    { key: 'percentage_rate', label: 'Commission %', type: 'number', required: true },
    { key: 'project_value_per_kw', label: 'Project Value Per KW (₹)', type: 'number', required: true },
    { key: 'max_cap', label: 'Maximum Cap (₹)', type: 'number', required: false },
  ],
  fixed_per_project: [
    { key: 'fixed_amount', label: 'Fixed Amount Per Project (₹)', type: 'number', required: true },
  ],
  slab_based: [
    { key: 'slabs', label: 'Slab Configuration', type: 'slab_table', required: true },
  ],
};

interface FormState {
  name: string;
  structureType: CommissionStructureType;
  description: string;
  fields: ConfigSchemaField[];
}

const EMPTY_FORM: FormState = {
  name: '',
  structureType: 'per_kw',
  description: '',
  fields: DEFAULT_SCHEMAS.per_kw,
};

export default function CommissionStructuresPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['commission-structures'],
    queryFn: () => commissionStructuresService.getAll(),
  });
  const structures: CommissionStructure[] = data?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name: form.name, structureType: form.structureType, description: form.description || undefined, configSchema: form.fields };
      return editingId
        ? commissionStructuresService.update(editingId, payload)
        : commissionStructuresService.create(payload);
    },
    onSuccess: () => {
      toast.success(editingId ? 'Structure updated' : 'Structure created');
      queryClient.invalidateQueries({ queryKey: ['commission-structures'] });
      setDialogOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => commissionStructuresService.toggle(id),
    onSuccess: () => { toast.success('Status updated'); queryClient.invalidateQueries({ queryKey: ['commission-structures'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (s: CommissionStructure) => {
    setEditingId(s.id);
    setForm({ name: s.name, structureType: s.structureType, description: s.description ?? '', fields: s.configSchema });
    setDialogOpen(true);
  };

  const handleTypeChange = (type: CommissionStructureType) => {
    setForm((f) => ({ ...f, structureType: type, fields: DEFAULT_SCHEMAS[type] }));
  };

  const updateField = (idx: number, key: keyof ConfigSchemaField, value: string | boolean) => {
    setForm((f) => {
      const fields = [...f.fields];
      fields[idx] = { ...fields[idx], [key]: value };
      return { ...f, fields };
    });
  };

  const addField = () => {
    setForm((f) => ({
      ...f,
      fields: [...f.fields, { key: '', label: '', type: 'number', required: false }],
    }));
  };

  const removeField = (idx: number) => {
    setForm((f) => ({ ...f, fields: f.fields.filter((_, i) => i !== idx) }));
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/admin');
  };

  const canSave = form.name.trim().length > 0 && form.fields.every((f) => f.key.trim() && f.label.trim());

  return (
    <div className="min-h-screen bg-surface">
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
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:bg-error/5 hover:text-error transition-colors">
              <LogOut size={15} />Logout
            </button>
          </div>
        </div>
        <div className="flex gap-1 px-8 border-t border-outline-variant/10 overflow-x-auto">
          {[
            { to: '/admin/companies', icon: Building2, label: 'Companies' },
            { to: '/admin/documents', icon: FileText, label: 'Document Master' },
            { to: '/admin/discoms', icon: Zap, label: 'DISCOM Master' },
            { to: '/admin/masters', icon: Database, label: 'Master Data' },
            { to: '/admin/users', icon: Users, label: 'Admin Users' },
            { to: '/admin/logs', icon: Activity, label: 'Activity Logs' },
            { to: '/admin/commission', icon: BadgeDollarSign, label: 'Commission Structures' },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                isActive ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/50 hover:text-on-surface-variant'
              }`}>
              <Icon size={13} />{label}
            </NavLink>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-on-surface">Commission Structures</h1>
            <p className="text-sm text-on-surface-variant/60 mt-0.5">Global commission engines available to all tenant companies</p>
          </div>
          <Button size="sm" onClick={openCreate}><Plus size={14} />New Structure</Button>
        </div>

        {isLoading && <p className="text-sm text-on-surface-variant/60">Loading...</p>}

        <div className="space-y-3">
          {structures.map((s) => (
            <div key={s.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} className="text-on-surface-variant/40 hover:text-primary transition-colors">
                    {expandedId === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <div>
                    <p className="font-bold text-sm text-on-surface">{s.name}</p>
                    <p className="text-xs text-on-surface-variant/60">{STRUCTURE_TYPE_LABELS[s.structureType]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${s.isActive ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-high text-on-surface-variant/50'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-on-surface-variant/50">{s._count?.assignments ?? 0} tenants</span>
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant/50 hover:text-primary">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => toggleMutation.mutate(s.id)} className="p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant/50 hover:text-primary">
                    <Power size={13} />
                  </button>
                </div>
              </div>
              {expandedId === s.id && (
                <div className="px-5 pb-4 border-t border-outline-variant/10 pt-4">
                  {s.description && <p className="text-sm text-on-surface-variant/70 mb-3">{s.description}</p>}
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-2">Configuration Fields</p>
                  <div className="grid grid-cols-2 gap-2">
                    {s.configSchema.map((field) => (
                      <div key={field.key} className="bg-surface-container rounded-xl px-3 py-2">
                        <p className="text-xs font-bold text-on-surface">{field.label}</p>
                        <p className="text-[10px] text-on-surface-variant/50">{field.key} · {field.type}{field.required ? ' · required' : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {!isLoading && structures.length === 0 && (
            <p className="text-sm text-center text-on-surface-variant/50 py-12">No commission structures yet. Create the first one.</p>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Structure' : 'New Commission Structure'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Structure Name *</label>
              <Input className="mt-1" placeholder="e.g. Per KW Solar Commission" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Structure Type *</label>
              <Select value={form.structureType} onValueChange={(v) => handleTypeChange(v as CommissionStructureType)} disabled={!!editingId}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STRUCTURE_TYPE_LABELS) as CommissionStructureType[]).map((t) => (
                    <SelectItem key={t} value={t}>{STRUCTURE_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingId && <p className="text-xs text-on-surface-variant/50 mt-1">Structure type cannot be changed after creation</p>}
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Description</label>
              <Input className="mt-1" placeholder="Optional description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Configuration Fields</label>
                <button onClick={addField} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={12} />Add Field</button>
              </div>
              <div className="space-y-2">
                {form.fields.map((field, idx) => (
                  <div key={idx} className="bg-surface-container rounded-xl p-3 grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-center">
                    <Input placeholder="config_key" value={field.key} onChange={(e) => updateField(idx, 'key', e.target.value)} className="text-xs h-8" />
                    <Input placeholder="Display Label" value={field.label} onChange={(e) => updateField(idx, 'label', e.target.value)} className="text-xs h-8" />
                    <Select value={field.type} onValueChange={(v) => updateField(idx, 'type', v)}>
                      <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="slab_table">Slab Table</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-1 text-xs text-on-surface-variant/60 whitespace-nowrap cursor-pointer">
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, 'required', e.target.checked)} />
                      Req.
                    </label>
                    <button onClick={() => removeField(idx)} className="text-error/60 hover:text-error transition-colors"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={!canSave}>
              {editingId ? 'Save Changes' : 'Create Structure'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

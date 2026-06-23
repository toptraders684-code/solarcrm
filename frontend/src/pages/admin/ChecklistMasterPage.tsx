import { useState, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LogOut, Users, FileText, Building2, Database, Activity, Pencil,
  ToggleLeft, ToggleRight, Zap, BadgeDollarSign, ClipboardList,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { masterDataService } from '@/services/masterData.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

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

interface ChecklistItem {
  id: string;
  discom: string;
  projectType: string;
  phaseName: string;
  phaseOrder: number;
  itemText: string;
  itemOrder: number;
  isMandatory: boolean;
  isActive: boolean;
}

export default function ChecklistMasterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();

  const [selectedDiscom, setSelectedDiscom] = useState('');
  const [selectedProjectType, setSelectedProjectType] = useState('');
  const [editItem, setEditItem] = useState<ChecklistItem | null>(null);
  const [editText, setEditText] = useState('');
  const [editMandatory, setEditMandatory] = useState(false);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/admin');
  };

  const { data, isLoading } = useQuery({
    queryKey: ['checklist-master'],
    queryFn: () => masterDataService.listChecklist(),
  });

  const allItems: ChecklistItem[] = data?.data ?? [];

  const discoms = useMemo(
    () => [...new Set(allItems.map(i => i.discom))].sort(),
    [allItems],
  );

  const projectTypes = useMemo(
    () => [...new Set(allItems.filter(i => !selectedDiscom || i.discom === selectedDiscom).map(i => i.projectType))].sort(),
    [allItems, selectedDiscom],
  );

  const phases = useMemo(() => {
    if (!selectedDiscom || !selectedProjectType) return [];
    const filtered = allItems.filter(
      i => i.discom === selectedDiscom && i.projectType === selectedProjectType,
    );
    const phaseMap = new Map<string, { phaseOrder: number; items: ChecklistItem[] }>();
    filtered.forEach(item => {
      if (!phaseMap.has(item.phaseName)) {
        phaseMap.set(item.phaseName, { phaseOrder: item.phaseOrder, items: [] });
      }
      phaseMap.get(item.phaseName)!.items.push(item);
    });
    return [...phaseMap.entries()]
      .sort(([, a], [, b]) => a.phaseOrder - b.phaseOrder)
      .map(([phaseName, { phaseOrder, items }]) => ({
        phaseName,
        phaseOrder,
        items: [...items].sort((a, b) => a.itemOrder - b.itemOrder),
      }));
  }, [allItems, selectedDiscom, selectedProjectType]);

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { itemText?: string; isMandatory?: boolean; isActive?: boolean } }) =>
      masterDataService.updateChecklistItem(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-master'] });
      toast.success('Item updated');
      setEditItem(null);
    },
    onError: () => toast.error('Failed to update item'),
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; itemOrder: number }[]) =>
      masterDataService.reorderChecklist(items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-master'] }),
    onError: () => toast.error('Failed to reorder items'),
  });

  const moveItem = (phaseItems: ChecklistItem[], index: number, direction: -1 | 1) => {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= phaseItems.length) return;
    const newItems = [...phaseItems];
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    reorderMutation.mutate(newItems.map((item, i) => ({ id: item.id, itemOrder: i + 1 })));
  };

  const openEdit = (item: ChecklistItem) => {
    setEditItem(item);
    setEditText(item.itemText);
    setEditMandatory(item.isMandatory);
  };

  const saveEdit = () => {
    if (!editItem) return;
    updateMutation.mutate({
      id: editItem.id,
      body: { itemText: editText, isMandatory: editMandatory },
    });
  };

  const toggleActive = (item: ChecklistItem) => {
    updateMutation.mutate({ id: item.id, body: { isActive: !item.isActive } });
  };

  return (
    <div className="min-h-screen bg-background">
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
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:bg-error/5 hover:text-error transition-colors">
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

      <main className="max-w-5xl mx-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-black text-on-surface">Checklist Master</h1>
          <p className="text-xs text-on-surface-variant/50 mt-0.5">Re-order, rename, and toggle checklist items by DISCOM and project type</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <div className="w-56">
            <Select value={selectedDiscom} onValueChange={v => { setSelectedDiscom(v); setSelectedProjectType(''); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select DISCOM" />
              </SelectTrigger>
              <SelectContent>
                {discoms.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-56">
            <Select value={selectedProjectType} onValueChange={setSelectedProjectType} disabled={!selectedDiscom}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select Project Type" />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map(pt => <SelectItem key={pt} value={pt}>{pt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-16 text-on-surface-variant/50 text-sm">Loading checklist data...</div>
        )}

        {/* Prompt */}
        {!isLoading && (!selectedDiscom || !selectedProjectType) && (
          <div className="text-center py-16 text-on-surface-variant/40 text-sm">
            Select a DISCOM and Project Type to view the checklist
          </div>
        )}

        {/* Phase groups */}
        {!isLoading && selectedDiscom && selectedProjectType && phases.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant/40 text-sm">
            No checklist items found for this combination
          </div>
        )}

        {phases.map(phase => (
          <div key={phase.phaseName} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-outline-variant/20" />
              <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant/60 px-2">
                Phase {phase.phaseOrder} — {phase.phaseName}
              </span>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>

            <div className="rounded-2xl border border-outline-variant/10 overflow-hidden bg-surface">
              {phase.items.map((item, index) => (
                <div key={item.id}
                  className={`flex items-center gap-3 px-5 py-3.5 border-b border-outline-variant/5 last:border-b-0 ${!item.isActive ? 'opacity-50' : ''}`}>

                  {/* Order buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveItem(phase.items, index, -1)}
                      disabled={index === 0 || reorderMutation.isPending}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-on-surface-variant/40 hover:bg-primary/10 hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <ChevronUp size={13} />
                    </button>
                    <button
                      onClick={() => moveItem(phase.items, index, 1)}
                      disabled={index === phase.items.length - 1 || reorderMutation.isPending}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-on-surface-variant/40 hover:bg-primary/10 hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <ChevronDown size={13} />
                    </button>
                  </div>

                  {/* Order badge */}
                  <span className="w-7 h-7 rounded-lg bg-primary/8 text-primary text-xs font-black flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>

                  {/* Item text */}
                  <span className="flex-1 text-sm text-on-surface">{item.itemText}</span>

                  {/* Mandatory badge */}
                  {item.isMandatory && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-error/70 bg-error/8 px-2 py-0.5 rounded-full">
                      Mandatory
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(item)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant/40 hover:bg-primary/10 hover:text-primary transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => toggleActive(item)}
                      disabled={updateMutation.isPending}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-primary/10">
                      {item.isActive
                        ? <ToggleRight size={17} className="text-primary" />
                        : <ToggleLeft size={17} className="text-on-surface-variant/30" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Checklist Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">
                Item Text
              </label>
              <Input
                value={editText}
                onChange={e => setEditText(e.target.value)}
                placeholder="Item description"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editMandatory}
                onChange={e => setEditMandatory(e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-on-surface">Mark as Mandatory</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={updateMutation.isPending || !editText.trim()}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

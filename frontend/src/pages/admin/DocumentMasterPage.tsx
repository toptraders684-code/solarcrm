import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Sun, LogOut, FileText, Zap, Upload, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { documentMasterService } from '@/services/document-master.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import type { DocumentMaster } from '@/types';

const DISCOMS = ['tpcodl', 'tpnodl', 'tpsodl', 'tpwodl'] as const;
const DISCOM_LABELS: Record<string, string> = {
  tpcodl: 'TPCODL — TP Central Odisha',
  tpnodl: 'TPNODL — TP Northern Odisha',
  tpsodl: 'TPSODL — TP Southern Odisha',
  tpwodl: 'TPWODL — TP Western Odisha',
};

interface FormState {
  discom: string;
  title: string;
  docType: string;
  sortOrder: string;
}

const DEFAULT_FORM: FormState = { discom: 'tpcodl', title: '', docType: 'upload', sortOrder: '' };

function TypeBadge({ docType }: { docType: string }) {
  if (docType === 'generate') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-on-secondary-fixed-variant bg-secondary-container px-2 py-0.5 rounded-full w-fit">
        <Zap size={9} />Generate
      </span>
    );
  }
  if (docType === 'view') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full w-fit">
        <Eye size={9} />View File
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">
      <Upload size={9} />Upload
    </span>
  );
}

export default function DocumentMasterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeDiscom, setActiveDiscom] = useState<string>('tpcodl');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<DocumentMaster | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [deleteItem, setDeleteItem] = useState<DocumentMaster | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['document-master', activeDiscom],
    queryFn: () => documentMasterService.list(activeDiscom),
  });

  const items: DocumentMaster[] = data?.data ?? [];

  const closeForm = () => {
    setFormOpen(false);
    setEditItem(null);
    setPendingFile(null);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await documentMasterService.create({
        discom: form.discom,
        title: form.title.trim(),
        docType: form.docType,
        sortOrder: form.sortOrder ? parseInt(form.sortOrder) : undefined,
      });
      if (pendingFile && form.docType === 'view') {
        await documentMasterService.uploadMasterFile(result.data.id, pendingFile);
      }
      return result;
    },
    onSuccess: () => {
      toast.success('Document added');
      queryClient.invalidateQueries({ queryKey: ['document-master'] });
      closeForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const result = await documentMasterService.update(editItem!.id, {
        title: form.title.trim(),
        docType: form.docType,
        sortOrder: form.sortOrder ? parseInt(form.sortOrder) : undefined,
      });
      if (pendingFile) {
        await documentMasterService.uploadMasterFile(editItem!.id, pendingFile);
      }
      return result;
    },
    onSuccess: () => {
      toast.success('Document updated');
      queryClient.invalidateQueries({ queryKey: ['document-master'] });
      closeForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentMasterService.remove(deleteItem!.id),
    onSuccess: () => {
      toast.success('Document removed');
      queryClient.invalidateQueries({ queryKey: ['document-master'] });
      setDeleteItem(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...DEFAULT_FORM, discom: activeDiscom });
    setPendingFile(null);
    setFormOpen(true);
  };

  const openEdit = (item: DocumentMaster) => {
    setEditItem(item);
    setForm({ discom: item.discom, title: item.title, docType: item.docType, sortOrder: String(item.sortOrder) });
    setPendingFile(null);
    setFormOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('File exceeds 2MB limit'); return; }
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPG, PNG, PDF allowed'); return;
    }
    setPendingFile(file);
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/admin');
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-20 w-full bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 flex items-center justify-between h-16 px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 signature-gradient rounded-lg flex items-center justify-center shadow-sm">
            <Sun size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-primary leading-none">Suryam CRM</p>
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
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-on-surface">Document Master</h1>
            <p className="text-sm text-on-surface-variant/60 mt-0.5">Manage required documents per DISCOM</p>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus size={14} />Add Document
          </Button>
        </div>

        {/* DISCOM Tabs */}
        <div className="flex gap-2 flex-wrap">
          {DISCOMS.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDiscom(d)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeDiscom === d
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant/10 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">
              {DISCOM_LABELS[activeDiscom]}
            </p>
            <span className="text-xs text-on-surface-variant/40">{items.length} documents</span>
          </div>

          {isLoading ? (
            <div className="divide-y divide-outline-variant/5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 px-5 flex items-center">
                  <div className="h-4 w-48 bg-surface-container rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/5">
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 w-10">#</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Title</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 w-32">Type</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 w-16">Order</th>
                  <th className="px-5 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-5 py-3 text-on-surface-variant/40 text-xs">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText size={11} className="text-primary" />
                        </div>
                        <span className="font-semibold text-on-surface">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <TypeBadge docType={item.docType} />
                    </td>
                    <td className="px-5 py-3 text-xs text-on-surface-variant/60">{item.sortOrder}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(item)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface-variant/50 hover:text-primary transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteItem(item)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-error/10 text-on-surface-variant/50 hover:text-error transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-on-surface-variant/50">
                      No documents for {activeDiscom.toUpperCase()} yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Document' : 'Add Document'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editItem && (
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">DISCOM *</label>
                <Select value={form.discom} onValueChange={(v) => setForm((f) => ({ ...f, discom: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DISCOMS.map((d) => <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Document Title *</label>
              <Input
                className="mt-1"
                placeholder="e.g. Customer Agreement"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Type *</label>
              <Select
                value={form.docType}
                onValueChange={(v) => { setForm((f) => ({ ...f, docType: v })); setPendingFile(null); }}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload">Upload File</SelectItem>
                  <SelectItem value="generate">Generate</SelectItem>
                  <SelectItem value="view">View File</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File upload — only shown when type is view */}
            {form.docType === 'view' && (
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                  File {editItem?.masterFilePath ? '(leave blank to keep existing)' : ''}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); } }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface hover:bg-surface-container text-on-surface-variant text-xs font-semibold transition-colors"
                  >
                    {pendingFile ? (
                      <span className="text-primary truncate max-w-[160px]" title={pendingFile.name}>{pendingFile.name}</span>
                    ) : editItem?.masterFilePath ? (
                      <><Eye size={12} />Replace File</>
                    ) : (
                      <><Upload size={12} />Choose File</>
                    )}
                  </button>
                  {pendingFile && (
                    <button
                      type="button"
                      onClick={() => setPendingFile(null)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-error/10 text-on-surface-variant/50 hover:text-error transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                  {editItem?.masterFilePath && !pendingFile && (
                    <span className="text-[10px] text-on-surface-variant/50">File already uploaded</span>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Sort Order</label>
              <Input
                className="mt-1"
                type="number"
                placeholder="Leave blank for auto"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button
              disabled={!form.title.trim()}
              loading={isPending}
              onClick={() => editItem ? updateMutation.mutate() : createMutation.mutate()}
            >
              {editItem ? 'Save Changes' : 'Add Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => { if (!open) setDeleteItem(null); }}
        title="Remove Document?"
        description={`"${deleteItem?.title}" will be removed from the ${deleteItem?.discom?.toUpperCase()} document list.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

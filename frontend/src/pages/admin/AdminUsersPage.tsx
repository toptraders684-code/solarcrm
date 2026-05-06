import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Users, FileText, CheckCircle2, XCircle, Plus, Eye, EyeOff, UserCheck, Building2, Database, Activity, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { usersService } from '@/services/users.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

const STATUS_COLOURS: Record<string, string> = {
  active:           'bg-primary/10 text-primary',
  inactive:         'bg-surface-container text-on-surface-variant/50',
  pending_approval: 'bg-secondary-container text-on-secondary-fixed-variant',
};

const STATUS_LABELS: Record<string, string> = {
  active:           'Active',
  inactive:         'Inactive',
  pending_approval: 'Pending',
};

interface CreateForm { name: string; email: string; mobile: string; password: string; }
interface EditForm   { name: string; email: string; mobile: string; password: string; }

const DEFAULT_CREATE: CreateForm = { name: '', email: '', mobile: '', password: '' };
const DEFAULT_EDIT:   EditForm   = { name: '', email: '', mobile: '', password: '' };

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
      {children}{required && <span className="text-error"> *</span>}
    </label>
  );
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();

  const [togglingId, setTogglingId]     = useState<string | null>(null);
  const [createOpen, setCreateOpen]     = useState(false);
  const [createForm, setCreateForm]     = useState<CreateForm>(DEFAULT_CREATE);
  const [showCreatePwd, setShowCreatePwd] = useState(false);

  const [editOpen, setEditOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState<User | null>(null);
  const [editForm, setEditForm]         = useState<EditForm>(DEFAULT_EDIT);
  const [showEditPwd, setShowEditPwd]   = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-users'],
    queryFn: () => usersService.getUsers({ role: 'admin', limit: 100 }),
  });

  const admins: User[] = (data as any)?.data ?? [];

  const approveMutation = useMutation({
    mutationFn: (id: string) => usersService.approveUser(id),
    onSuccess: () => { toast.success('Admin approved'); queryClient.invalidateQueries({ queryKey: ['super-admin-users'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to approve'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => usersService.updateUser(id, { status }),
    onSuccess: () => { toast.success('Status updated'); queryClient.invalidateQueries({ queryKey: ['super-admin-users'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
    onSettled: () => setTogglingId(null),
  });

  const createMutation = useMutation({
    mutationFn: () => usersService.createUser({
      name: createForm.name.trim(), email: createForm.email.trim(),
      mobile: createForm.mobile.trim(), password: createForm.password, role: 'admin',
    }),
    onSuccess: () => {
      toast.success('Admin created');
      queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
      setCreateOpen(false);
      setCreateForm(DEFAULT_CREATE);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create admin'),
  });

  const editMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = {
        name: editForm.name.trim(),
        email: editForm.email.trim() || undefined,
        mobile: editForm.mobile.trim(),
      };
      if (editForm.password.length >= 6) payload.password = editForm.password;
      return usersService.updateUser(editTarget!.id, payload);
    },
    onSuccess: () => {
      toast.success('Admin updated');
      queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
      setEditOpen(false);
      setEditTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update admin'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => usersService.deleteUser(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Admin deleted');
      queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete admin'),
  });

  const handleToggle = (admin: User) => {
    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    setTogglingId(admin.id);
    toggleMutation.mutate({ id: admin.id, status: newStatus });
  };

  const openEdit = (admin: User) => {
    setEditTarget(admin);
    setEditForm({ name: admin.name, email: admin.email ?? '', mobile: admin.mobile ?? '', password: '' });
    setShowEditPwd(false);
    setEditOpen(true);
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/admin');
  };

  const canCreate = createForm.name.trim().length > 0 && createForm.mobile.trim().length === 10 && createForm.password.length >= 6;
  const canEdit   = editForm.name.trim().length > 0 && editForm.mobile.trim().length === 10 && (editForm.password === '' || editForm.password.length >= 6);

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

      <main className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-on-surface">Admin Users</h1>
            <p className="text-sm text-on-surface-variant/60 mt-0.5">Create, edit, activate or remove admin accounts</p>
          </div>
          <Button size="sm" onClick={() => { setCreateForm(DEFAULT_CREATE); setCreateOpen(true); }}>
            <Plus size={14} />Add Admin
          </Button>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant/10 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">Admins</p>
            <span className="text-xs text-on-surface-variant/40">{admins.length} users</span>
          </div>

          {isLoading ? (
            <div className="divide-y divide-outline-variant/5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 px-5 flex items-center gap-4">
                  <div className="h-4 w-40 bg-surface-container rounded animate-pulse" />
                  <div className="h-4 w-28 bg-surface-container rounded animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/5">
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 w-10">#</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Name</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Email</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 w-28">Status</th>
                  <th className="px-5 py-3 w-48" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {admins.map((admin, i) => (
                  <tr key={admin.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-5 py-4 text-on-surface-variant/40 text-xs">{i + 1}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-on-surface">{admin.name}</p>
                      {admin.mobile && <p className="text-xs text-on-surface-variant/50 mt-0.5">{admin.mobile}</p>}
                    </td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{admin.email || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_COLOURS[admin.status] ?? ''}`}>
                        {STATUS_LABELS[admin.status] ?? admin.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(admin)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
                        >
                          <Pencil size={12} />Edit
                        </button>

                        {/* Approve / Toggle */}
                        {admin.status === 'pending_approval' ? (
                          <button
                            onClick={() => approveMutation.mutate(admin.id)}
                            disabled={approveMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                          >
                            <UserCheck size={12} />Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggle(admin)}
                            disabled={togglingId === admin.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                              admin.status === 'active'
                                ? 'bg-error/10 text-error hover:bg-error/20'
                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                            }`}
                          >
                            {admin.status === 'active'
                              ? <><XCircle size={12} />Deactivate</>
                              : <><CheckCircle2 size={12} />Activate</>}
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(admin)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-error/10 text-error hover:bg-error/20 transition-colors"
                        >
                          <Trash2 size={12} />Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-on-surface-variant/50">
                      No admin users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Create Admin Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) setCreateOpen(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Admin</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <FieldLabel required>Full Name</FieldLabel>
              <Input className="mt-1" placeholder="e.g. Rajesh Kumar" value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <FieldLabel required>Mobile</FieldLabel>
              <Input className="mt-1" type="tel" placeholder="10-digit mobile" maxLength={10}
                value={createForm.mobile}
                onChange={(e) => setCreateForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, '') }))} />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <Input className="mt-1" type="email" placeholder="admin@example.com" value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <FieldLabel required>Password</FieldLabel>
              <div className="relative mt-1">
                <Input type={showCreatePwd ? 'text' : 'password'} placeholder="Min 6 characters" className="pr-10"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowCreatePwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">
                  {showCreatePwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={!canCreate} loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Create Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) { setEditOpen(false); setEditTarget(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Admin — {editTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <FieldLabel required>Full Name</FieldLabel>
              <Input className="mt-1" placeholder="e.g. Rajesh Kumar" value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <FieldLabel required>Mobile</FieldLabel>
              <Input className="mt-1" type="tel" placeholder="10-digit mobile" maxLength={10}
                value={editForm.mobile}
                onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, '') }))} />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <Input className="mt-1" type="email" placeholder="admin@example.com" value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>New Password</FieldLabel>
              <div className="relative mt-1">
                <Input type={showEditPwd ? 'text' : 'password'} placeholder="Leave blank to keep current" className="pr-10"
                  value={editForm.password}
                  onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowEditPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">
                  {showEditPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {editForm.password.length > 0 && editForm.password.length < 6 && (
                <p className="mt-1 text-[10px] text-error font-semibold">Minimum 6 characters</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => { setEditOpen(false); setEditTarget(null); }}>Cancel</Button>
            <Button disabled={!canEdit} loading={editMutation.isPending} onClick={() => editMutation.mutate()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Admin?"
        description={`This will permanently remove "${deleteTarget?.name}" (${deleteTarget?.email || deleteTarget?.mobile}). This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

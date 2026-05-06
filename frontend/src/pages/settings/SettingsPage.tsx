import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCheck, UserX, Users, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { usersService } from '@/services/users.service';
import { formatDate, toTitleCase } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

const ROLES = ['operations_staff', 'field_technician', 'finance_manager'];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
      {children}{required && <span className="text-error"> *</span>}
    </label>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen]           = useState(false);
  const [showAddPwd, setShowAddPwd]     = useState(false);

  const [editTarget, setEditTarget]     = useState<User | null>(null);
  const [showEditPwd, setShowEditPwd]   = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getUsers({ limit: 100 }),
  });
  const users = data?.data ?? [];

  // ── Add form ──────────────────────────────────────────────────────────────
  const { register: regAdd, handleSubmit: submitAdd, setValue: setAddVal, reset: resetAdd, formState: { errors: addErr, isSubmitting: addSubmitting } } = useForm({
    defaultValues: { name: '', mobile: '', email: '', password: '', role: '' },
  });

  // ── Edit form ─────────────────────────────────────────────────────────────
  const { register: regEdit, handleSubmit: submitEdit, setValue: setEditVal, reset: resetEdit, formState: { errors: editErr, isSubmitting: editSubmitting } } = useForm({
    defaultValues: { name: '', mobile: '', email: '', password: '', role: '' },
  });

  const openEdit = (u: User) => {
    setEditTarget(u);
    resetEdit({ name: u.name, mobile: u.mobile ?? '', email: u.email ?? '', password: '', role: u.role });
    setShowEditPwd(false);
  };

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (values: any) => usersService.createUser({ ...values, email: values.email?.trim() || undefined }),
    onSuccess: () => {
      toast.success('User created');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAddOpen(false); resetAdd(); setShowAddPwd(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Failed to create user'));
    },
  });

  const editMutation = useMutation({
    mutationFn: (values: any) => {
      const payload: Record<string, any> = {
        name: values.name.trim(),
        mobile: values.mobile.trim(),
        email: values.email?.trim() || undefined,
        role: values.role,
      };
      if (values.password?.length >= 8) payload.password = values.password;
      return usersService.updateUser(editTarget!.id, payload);
    },
    onSuccess: () => {
      toast.success('User updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditTarget(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Failed to update user'));
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => usersService.approveUser(id),
    onSuccess: () => { toast.success('User approved'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => usersService.updateUser(id, { status }),
    onSuccess: () => { toast.success('Status updated'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => usersService.deleteUser(deleteTarget!.id),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete user'),
  });

  const pendingUsers = users.filter((u: User) => u.status === 'pending_approval');
  const activeUsers  = users.filter((u: User) => u.status !== 'pending_approval');

  const actionBtnClass = (variant: 'default' | 'danger' | 'activate') => {
    const base = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50';
    if (variant === 'danger')   return `${base} bg-error/10 text-error hover:bg-error hover:text-white`;
    if (variant === 'activate') return `${base} bg-primary/10 text-primary hover:bg-primary hover:text-white`;
    return `${base} bg-surface-container text-on-surface-variant hover:bg-surface-container-high`;
  };

  return (
    <PageWrapper title="Settings" subtitle="User management"
      actions={<Button onClick={() => setAddOpen(true)}><Plus size={16} />Add User</Button>}>

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <div className="bg-tertiary-container/20 p-4 border-b border-tertiary-container/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
            <h3 className="text-sm font-bold text-on-tertiary-container">Pending Approval ({pendingUsers.length})</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                <th className="px-6 py-4">Name</th>
                <th className="px-4 py-4">Mobile</th>
                <th className="px-4 py-4">Role</th>
                <th className="px-4 py-4">Registered</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {pendingUsers.map((u: User) => (
                <tr key={u.id} className="hover:bg-surface-container-low/50">
                  <td className="px-6 py-4 text-sm font-bold text-on-surface">{u.name}</td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{u.mobile}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-[10px] font-bold uppercase">{toTitleCase(u.role)}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{formatDate(u.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u)} className={actionBtnClass('default')}>
                        <Pencil size={13} />Edit
                      </button>
                      <button onClick={() => approveMutation.mutate(u.id)} disabled={approveMutation.isPending}
                        className={actionBtnClass('activate')}>
                        <UserCheck size={13} />Approve
                      </button>
                      <button onClick={() => setDeleteTarget(u)} className={actionBtnClass('danger')}>
                        <Trash2 size={13} />Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* All Users */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
        <div className="p-6 border-b border-surface-container-low flex items-center gap-2">
          <Users size={20} className="text-primary" />
          <h3 className="text-lg font-bold text-on-surface font-headline">All Users</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
              <th className="px-6 py-4">Name</th>
              <th className="px-4 py-4">Mobile</th>
              <th className="px-4 py-4">Email</th>
              <th className="px-4 py-4">Role</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-4"><Skeleton className="h-4" /></td>)}</tr>
                ))
              : activeUsers.map((u: User) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-on-surface">{u.name}</td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{u.mobile}</td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{u.email ?? '—'}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-[10px] font-bold uppercase">{toTitleCase(u.role)}</span>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={u.status} /></td>
                    <td className="px-6 py-4">
                      {u.id !== user.id ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(u)} className={actionBtnClass('default')}>
                            <Pencil size={13} />Edit
                          </button>
                          <button
                            onClick={() => toggleMutation.mutate({ id: u.id, status: u.status === 'active' ? 'inactive' : 'active' })}
                            disabled={toggleMutation.isPending}
                            className={u.status === 'active' ? actionBtnClass('danger') : actionBtnClass('activate')}>
                            {u.status === 'active' ? <><UserX size={13} />Deactivate</> : <><UserCheck size={13} />Activate</>}
                          </button>
                          <button onClick={() => setDeleteTarget(u)} className={actionBtnClass('danger')}>
                            <Trash2 size={13} />Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant/40 italic">You</span>
                      )}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* ── Add User Sheet ── */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="overflow-y-auto p-8">
          <SheetHeader><SheetTitle>Add User</SheetTitle></SheetHeader>
          <form onSubmit={submitAdd((v) => createMutation.mutate(v))} className="mt-6 space-y-4">
            <div>
              <FieldLabel required>Full Name</FieldLabel>
              <Input className={`mt-1 ${addErr.name ? 'border-error' : ''}`} placeholder="Name"
                {...regAdd('name', { required: 'Name is required' })} />
              {addErr.name && <p className="mt-1 text-xs text-error">{addErr.name.message}</p>}
            </div>
            <div>
              <FieldLabel required>Mobile</FieldLabel>
              <Input className={`mt-1 ${addErr.mobile ? 'border-error' : ''}`} placeholder="10-digit mobile" maxLength={10}
                {...regAdd('mobile', { required: 'Mobile is required', pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' } })} />
              {addErr.mobile && <p className="mt-1 text-xs text-error">{addErr.mobile.message}</p>}
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <Input className={`mt-1 ${addErr.email ? 'border-error' : ''}`} type="email" placeholder="Optional" autoComplete="off"
                {...regAdd('email', { validate: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email' })} />
              {addErr.email && <p className="mt-1 text-xs text-error">{addErr.email.message}</p>}
            </div>
            <div>
              <FieldLabel required>Password</FieldLabel>
              <div className="relative mt-1">
                <Input type={showAddPwd ? 'text' : 'password'} placeholder="Min 8 characters" autoComplete="new-password"
                  className={`pr-10 ${addErr.password ? 'border-error' : ''}`}
                  {...regAdd('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })} />
                <button type="button" onClick={() => setShowAddPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">
                  {showAddPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {addErr.password && <p className="mt-1 text-xs text-error">{addErr.password.message}</p>}
            </div>
            <div>
              <FieldLabel required>Role</FieldLabel>
              <input type="hidden" {...regAdd('role', { required: 'Please select a role' })} />
              <Select onValueChange={(v) => setAddVal('role', v, { shouldValidate: true })}>
                <SelectTrigger className={`mt-1 ${addErr.role ? 'border-error' : ''}`}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{toTitleCase(r)}</SelectItem>)}
                </SelectContent>
              </Select>
              {addErr.role && <p className="mt-1 text-xs text-error">{addErr.role.message}</p>}
            </div>
            <div className="flex gap-3 pt-4 border-t border-surface-container-low">
              <Button type="button" variant="secondary" className="flex-1"
                onClick={() => { setAddOpen(false); resetAdd(); setShowAddPwd(false); }}>Cancel</Button>
              <Button type="submit" className="flex-1" loading={addSubmitting || createMutation.isPending}>Create User</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Edit User Sheet ── */}
      <Sheet open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <SheetContent className="overflow-y-auto p-8">
          <SheetHeader><SheetTitle>Edit User — {editTarget?.name}</SheetTitle></SheetHeader>
          <form onSubmit={submitEdit((v) => editMutation.mutate(v))} className="mt-6 space-y-4">
            <div>
              <FieldLabel required>Full Name</FieldLabel>
              <Input className={`mt-1 ${editErr.name ? 'border-error' : ''}`} placeholder="Name"
                {...regEdit('name', { required: 'Name is required' })} />
              {editErr.name && <p className="mt-1 text-xs text-error">{editErr.name.message}</p>}
            </div>
            <div>
              <FieldLabel required>Mobile</FieldLabel>
              <Input className={`mt-1 ${editErr.mobile ? 'border-error' : ''}`} placeholder="10-digit mobile" maxLength={10}
                {...regEdit('mobile', { required: 'Mobile is required', pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' } })} />
              {editErr.mobile && <p className="mt-1 text-xs text-error">{editErr.mobile.message}</p>}
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <Input className={`mt-1 ${editErr.email ? 'border-error' : ''}`} type="email" placeholder="Optional" autoComplete="off"
                {...regEdit('email', { validate: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email' })} />
              {editErr.email && <p className="mt-1 text-xs text-error">{editErr.email.message}</p>}
            </div>
            <div>
              <FieldLabel>New Password</FieldLabel>
              <div className="relative mt-1">
                <Input type={showEditPwd ? 'text' : 'password'} placeholder="Leave blank to keep current" autoComplete="new-password"
                  className={`pr-10 ${editErr.password ? 'border-error' : ''}`}
                  {...regEdit('password', { validate: (v) => !v || v.length >= 8 || 'Min 8 characters' })} />
                <button type="button" onClick={() => setShowEditPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">
                  {showEditPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {editErr.password && <p className="mt-1 text-xs text-error">{editErr.password.message}</p>}
            </div>
            <div>
              <FieldLabel required>Role</FieldLabel>
              <input type="hidden" {...regEdit('role', { required: 'Please select a role' })} />
              <Select
                value={editTarget?.role}
                onValueChange={(v) => setEditVal('role', v, { shouldValidate: true })}
              >
                <SelectTrigger className={`mt-1 ${editErr.role ? 'border-error' : ''}`}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{toTitleCase(r)}</SelectItem>)}
                </SelectContent>
              </Select>
              {editErr.role && <p className="mt-1 text-xs text-error">{editErr.role.message}</p>}
            </div>
            <div className="flex gap-3 pt-4 border-t border-surface-container-low">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" className="flex-1" loading={editSubmitting || editMutation.isPending}>Save Changes</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete User?"
        description={`This will permanently remove "${deleteTarget?.name}" (${deleteTarget?.mobile}). This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </PageWrapper>
  );
}

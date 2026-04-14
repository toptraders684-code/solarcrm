import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCheck, UserX, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { usersService } from '@/services/users.service';
import { formatDate, toTitleCase } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

const ROLES = ['admin', 'operations_staff', 'field_technician', 'finance_manager', 'vendor'];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getUsers({ limit: 100 }),
  });

  const users = data?.data ?? [];

  const { register, handleSubmit, setValue, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { name: '', mobile: '', email: '', password: '', role: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => usersService.createUser(values),
    onSuccess: () => { toast.success('User created successfully'); queryClient.invalidateQueries({ queryKey: ['users'] }); setAddOpen(false); reset(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create user'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => usersService.approveUser(id),
    onSuccess: () => { toast.success('User approved'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => usersService.updateUser(id, { status }),
    onSuccess: () => { toast.success('User status updated'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const onSubmit = handleSubmit((values) => createMutation.mutate(values));

  const pendingUsers = users.filter((u: User) => u.status === 'pending_approval');
  const activeUsers = users.filter((u: User) => u.status !== 'pending_approval');

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
                <th className="px-6 py-4">Name</th><th className="px-4 py-4">Mobile</th>
                <th className="px-4 py-4">Role</th><th className="px-4 py-4">Registered</th><th className="px-6 py-4">Actions</th>
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
                    <button onClick={() => approveMutation.mutate(u.id)} disabled={approveMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all">
                      <UserCheck size={14} />Approve
                    </button>
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
              <th className="px-6 py-4">Name</th><th className="px-4 py-4">Mobile</th>
              <th className="px-4 py-4">Email</th><th className="px-4 py-4">Role</th>
              <th className="px-4 py-4">Status</th><th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {isLoading ? [...Array(5)].map((_, i) => (
              <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-4"><Skeleton className="h-4" /></td>)}</tr>
            )) : activeUsers.map((u: User) => (
              <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-on-surface">{u.name}</td>
                <td className="px-4 py-4 text-sm text-on-surface-variant">{u.mobile}</td>
                <td className="px-4 py-4 text-sm text-on-surface-variant">{u.email ?? '—'}</td>
                <td className="px-4 py-4">
                  <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-[10px] font-bold uppercase">{toTitleCase(u.role)}</span>
                </td>
                <td className="px-4 py-4"><StatusBadge status={u.status} /></td>
                <td className="px-6 py-4">
                  {u.id !== user.id && (
                    <button
                      onClick={() => toggleStatusMutation.mutate({ id: u.id, status: u.status === 'active' ? 'inactive' : 'active' })}
                      disabled={toggleStatusMutation.isPending}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        u.status === 'active' ? 'bg-error/10 text-error hover:bg-error hover:text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                      }`}>
                      {u.status === 'active' ? <><UserX size={14} />Deactivate</> : <><UserCheck size={14} />Activate</>}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="overflow-y-auto p-8">
          <SheetHeader><SheetTitle>Add User</SheetTitle></SheetHeader>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Full Name *</label>
              <Input className="mt-1" placeholder="Name" {...register('name', { required: true })} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Mobile *</label>
              <Input className="mt-1" placeholder="10-digit mobile" maxLength={10} {...register('mobile', { required: true })} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Email</label>
              <Input className="mt-1" type="email" {...register('email')} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Password *</label>
              <Input className="mt-1" type="password" placeholder="Min 8 characters" {...register('password', { required: true })} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Role *</label>
              <Select onValueChange={(v) => setValue('role', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{toTitleCase(r)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4 border-t border-surface-container-low">
              <Button type="button" variant="secondary" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1" loading={isSubmitting}>Create User</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </PageWrapper>
  );
}

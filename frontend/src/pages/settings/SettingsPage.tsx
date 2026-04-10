import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, UserCheck, UserX } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getUsers({ limit: 100 }),
  });

  const users = data?.data ?? [];

  const { register, handleSubmit, setValue, reset, formState: { isSubmitting, errors } } = useForm({
    defaultValues: { name: '', mobile: '', email: '', password: '', role: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => usersService.createUser(values),
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAddOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create user');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => usersService.approveUser(id),
    onSuccess: () => {
      toast.success('User approved');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      usersService.updateUser(id, { status }),
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const onSubmit = handleSubmit((values) => createMutation.mutate(values));

  const pendingUsers = users.filter((u: User) => u.status === 'pending_approval');
  const activeUsers = users.filter((u: User) => u.status !== 'pending_approval');

  return (
    <PageWrapper
      title="Settings"
      subtitle="User management"
      actions={
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      }
    >
      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            Pending Approval ({pendingUsers.length})
          </h3>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-yellow-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Mobile</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Registered</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((u: User) => (
                  <tr key={u.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.mobile}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{toTitleCase(u.role)}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => approveMutation.mutate(u.id)}
                        disabled={approveMutation.isPending}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Users */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">All Users</h3>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mobile</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : activeUsers.map((u: User) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.mobile}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{toTitleCase(u.role)}</Badge>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                      <td className="px-4 py-3">
                        {u.id !== user.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={u.status === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: u.id,
                                status: u.status === 'active' ? 'inactive' : 'active',
                              })
                            }
                            disabled={toggleStatusMutation.isPending}
                          >
                            {u.status === 'active' ? (
                              <><UserX className="w-4 h-4 mr-1" />Deactivate</>
                            ) : (
                              <><UserCheck className="w-4 h-4 mr-1" />Activate</>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent>
          <SheetHeader className="mb-6">
            <SheetTitle>Add User</SheetTitle>
          </SheetHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input placeholder="Name" {...register('name', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile *</Label>
              <Input placeholder="10-digit mobile" maxLength={10} {...register('mobile', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input type="password" placeholder="Min 8 characters" {...register('password', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select onValueChange={(v) => setValue('role', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{toTitleCase(r)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create User
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </PageWrapper>
  );
}

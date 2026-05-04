import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sun, LogOut, Users, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
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

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-users'],
    queryFn: () => usersService.getUsers({ role: 'admin', limit: 100 }),
  });

  const admins: User[] = (data as any)?.data ?? [];

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      usersService.updateUser(id, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
    onSettled: () => setTogglingId(null),
  });

  const handleToggle = (admin: User) => {
    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    setTogglingId(admin.id);
    toggleMutation.mutate({ id: admin.id, status: newStatus });
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-20 w-full bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
        <div className="flex items-center justify-between h-16 px-8">
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
        </div>
        {/* Nav tabs */}
        <div className="flex gap-1 px-8 pb-0 border-t border-outline-variant/10">
          <NavLink
            to="/admin/documents"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant/50 hover:text-on-surface-variant'
              }`
            }
          >
            <FileText size={13} />Document Master
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant/50 hover:text-on-surface-variant'
              }`
            }
          >
            <Users size={13} />Admin Users
          </NavLink>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-black text-on-surface">Admin Users</h1>
          <p className="text-sm text-on-surface-variant/60 mt-0.5">Activate or deactivate admin accounts</p>
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
                  <th className="px-5 py-3 w-36" />
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
                      <button
                        onClick={() => handleToggle(admin)}
                        disabled={togglingId === admin.id || admin.status === 'pending_approval'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                          admin.status === 'active'
                            ? 'bg-error/10 text-error hover:bg-error/20'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                        }`}
                      >
                        {admin.status === 'active'
                          ? <><XCircle size={12} />Deactivate</>
                          : <><CheckCircle2 size={12} />Activate</>
                        }
                      </button>
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
    </div>
  );
}

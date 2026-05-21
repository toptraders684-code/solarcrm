import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Users, FileText, Building2, Database, Activity, Plus, Eye, EyeOff, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { companiesService } from '@/services/companies.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

interface CreateForm {
  companyName: string;
  adminName: string;
  adminMobile: string;
  adminEmail: string;
  adminPassword: string;
}

const EMPTY: CreateForm = { companyName: '', adminName: '', adminMobile: '', adminEmail: '', adminPassword: '' };

export default function CompaniesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesService.getAll(),
  });
  const companies: any[] = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => companiesService.create({
      companyName: form.companyName.trim(),
      adminName: form.adminName.trim(),
      adminMobile: form.adminMobile.trim(),
      adminEmail: form.adminEmail.trim() || undefined,
      adminPassword: form.adminPassword,
    }),
    onSuccess: () => {
      toast.success('Company and admin account created');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setFormOpen(false);
      setForm(EMPTY);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      companiesService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
    onSettled: () => setTogglingId(null),
  });

  const handleToggle = (c: any) => {
    const newStatus = c.status === 'active' ? 'inactive' : 'active';
    setTogglingId(c.id);
    toggleMutation.mutate({ id: c.id, status: newStatus });
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/admin');
  };

  const canCreate =
    form.companyName.trim().length > 0 &&
    form.adminName.trim().length > 0 &&
    form.adminMobile.trim().length === 10 &&
    form.adminPassword.length >= 6;

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
            { to: '/admin/discoms', icon: Zap, label: 'DISCOM Master' },
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

      <main className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-on-surface">Companies</h1>
            <p className="text-sm text-on-surface-variant/60 mt-0.5">Each company is an independent tenant with its own data</p>
          </div>
          <Button size="sm" onClick={() => { setForm(EMPTY); setFormOpen(true); }}>
            <Plus size={14} />Add Company
          </Button>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant/10 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">Tenant Companies</p>
            <span className="text-xs text-on-surface-variant/40">{companies.length} total</span>
          </div>

          {isLoading ? (
            <div className="divide-y divide-outline-variant/5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 px-5 flex items-center gap-4">
                  <div className="h-4 w-48 bg-surface-container rounded animate-pulse" />
                  <div className="h-4 w-32 bg-surface-container rounded animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/5">
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 w-8">#</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Company</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Admin</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Data</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 w-24">Status</th>
                  <th className="px-5 py-3 w-32" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {companies.map((c, i) => {
                  const admin = c.users?.[0];
                  return (
                    <tr key={c.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-5 py-4 text-on-surface-variant/40 text-xs">{i + 1}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-on-surface">{c.name}</p>
                        <p className="text-xs text-on-surface-variant/40 mt-0.5">{new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                      </td>
                      <td className="px-5 py-4">
                        {admin ? (
                          <>
                            <p className="text-sm font-medium text-on-surface">{admin.name}</p>
                            <p className="text-xs text-on-surface-variant/50">{admin.mobile}</p>
                          </>
                        ) : (
                          <span className="text-xs text-on-surface-variant/40">No admin</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-3 text-xs text-on-surface-variant/60">
                          <span>{c._count?.leads ?? 0} leads</span>
                          <span>{c._count?.applicants ?? 0} projects</span>
                          <span>{c._count?.users ?? 0} users</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          c.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant/50'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggle(c)}
                          disabled={togglingId === c.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                            c.status === 'active'
                              ? 'bg-error/10 text-error hover:bg-error/20'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          {c.status === 'active'
                            ? <><XCircle size={12} />Deactivate</>
                            : <><CheckCircle2 size={12} />Activate</>
                          }
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-on-surface-variant/50">
                      No companies yet. Add the first tenant company.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) setFormOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Company Name <span className="text-error">*</span></label>
              <Input className="mt-1" placeholder="e.g. Suryam Solar Pvt Ltd" value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
            </div>
            <div className="border-t border-outline-variant/20 pt-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-3">Admin Account</p>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Full Name <span className="text-error">*</span></label>
                  <Input className="mt-1" placeholder="e.g. Rajesh Kumar" value={form.adminName}
                    onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Mobile <span className="text-error">*</span> (10 digits)</label>
                  <Input className="mt-1" type="tel" placeholder="9876543210" maxLength={10} value={form.adminMobile}
                    onChange={(e) => setForm((f) => ({ ...f, adminMobile: e.target.value.replace(/\D/g, '') }))} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Email (optional)</label>
                  <Input className="mt-1" type="email" placeholder="admin@company.in" value={form.adminEmail}
                    onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Password <span className="text-error">*</span> (min 6)</label>
                  <div className="relative mt-1">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" className="pr-10"
                      value={form.adminPassword}
                      onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button disabled={!canCreate} loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Create Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

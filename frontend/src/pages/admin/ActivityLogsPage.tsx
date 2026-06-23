import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Users, FileText, Building2, Database, Activity, ChevronLeft, ChevronRight, Search, X, Zap, BadgeDollarSign, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateSelectPicker } from '@/components/ui/date-select-picker';
import { activityLogsService } from '@/services/activityLogs.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

const PAGE_SIZE = 50;

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-primary/10 text-primary',
  LOGIN_FAILED: 'bg-error/10 text-error',
  LOGOUT: 'bg-surface-container text-on-surface-variant',
  CREATE: 'bg-tertiary/10 text-tertiary',
  UPDATE: 'bg-secondary/10 text-secondary',
  DELETE: 'bg-error/10 text-error',
  APPROVE: 'bg-primary/10 text-primary',
  UPLOAD: 'bg-tertiary/10 text-tertiary',
};

function actionChip(action: string) {
  const cls = ACTION_COLORS[action] ?? 'bg-surface-container text-on-surface-variant/60';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {action}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default function ActivityLogsPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ action: '', module: '', from: '', to: '', userId: '' });
  const [applied, setApplied] = useState({ action: '', module: '', from: '', to: '', userId: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', applied, page],
    queryFn: () =>
      activityLogsService.getAll({
        action: applied.action || undefined,
        module: applied.module || undefined,
        from: applied.from || undefined,
        to: applied.to || undefined,
        userId: applied.userId || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
  });

  const logs: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleApply = () => { setApplied({ ...filters }); setPage(0); };
  const handleClear = () => {
    const empty = { action: '', module: '', from: '', to: '', userId: '' };
    setFilters(empty);
    setApplied(empty);
    setPage(0);
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
            { to: '/admin/commission', icon: BadgeDollarSign, label: 'Commission Structures' },
            { to: '/admin/checklist', icon: ClipboardList, label: 'Checklist Master' },
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

      <main className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-black text-on-surface">Activity Logs</h1>
          <p className="text-sm text-on-surface-variant/60 mt-0.5">
            All user actions across tenants — {total.toLocaleString('en-IN')} total records
          </p>
        </div>

        {/* Filters */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-4">Filters</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Action</label>
              <Input className="mt-1 h-8 text-xs" placeholder="e.g. LOGIN" value={filters.action}
                onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Module</label>
              <Input className="mt-1 h-8 text-xs" placeholder="e.g. leads" value={filters.module}
                onChange={(e) => setFilters((f) => ({ ...f, module: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">From Date</label>
              <DateSelectPicker className="mt-1" value={filters.from}
                onChange={(v) => setFilters((f) => ({ ...f, from: v }))} placeholder="From date" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">To Date</label>
              <DateSelectPicker className="mt-1" value={filters.to}
                onChange={(v) => setFilters((f) => ({ ...f, to: v }))} placeholder="To date" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">User ID</label>
              <Input className="mt-1 h-8 text-xs" placeholder="Paste user ID" value={filters.userId}
                onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={handleApply}>
              <Search size={12} />Apply
            </Button>
            <Button size="sm" variant="secondary" onClick={handleClear}>
              <X size={12} />Clear
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant/10 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">Log Entries</p>
            <span className="text-xs text-on-surface-variant/40">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="divide-y divide-outline-variant/5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-14 px-5 flex items-center gap-4">
                    <div className="h-3 w-32 bg-surface-container rounded animate-pulse" />
                    <div className="h-3 w-24 bg-surface-container rounded animate-pulse" />
                    <div className="h-3 w-40 bg-surface-container rounded animate-pulse ml-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-outline-variant/5">
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Date / Time</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">User</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Action</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Module</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Path</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">IP</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 w-16">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-5 py-3 text-xs text-on-surface-variant/70 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        {log.user ? (
                          <>
                            <p className="text-xs font-semibold text-on-surface leading-none">{log.user.name}</p>
                            <p className="text-[10px] text-on-surface-variant/40 mt-0.5 capitalize">{log.user.role?.replace('_', ' ')}</p>
                          </>
                        ) : (
                          <span className="text-xs text-on-surface-variant/40">System</span>
                        )}
                      </td>
                      <td className="px-5 py-3">{actionChip(log.action)}</td>
                      <td className="px-5 py-3">
                        {log.module ? (
                          <span className="text-xs text-on-surface-variant/70 capitalize">{log.module}</span>
                        ) : (
                          <span className="text-on-surface-variant/30">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 max-w-xs">
                        <p className="text-xs text-on-surface-variant/50 truncate font-mono">
                          {log.method && <span className="text-primary/60 mr-1">{log.method}</span>}
                          {log.path ?? '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-xs text-on-surface-variant/50 font-mono whitespace-nowrap">
                        {log.ipAddress ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        {log.statusCode != null ? (
                          <span className={`text-xs font-bold ${log.statusCode < 400 ? 'text-primary' : 'text-error'}`}>
                            {log.statusCode}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant/30">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-sm text-on-surface-variant/50">
                        No activity logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-outline-variant/10 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant/50">Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded-lg hover:bg-surface-container disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg hover:bg-surface-container disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

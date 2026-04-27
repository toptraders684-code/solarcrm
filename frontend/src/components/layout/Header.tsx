import { useState, useRef, useEffect } from 'react';
import { Bell, Search, LogOut, CheckCircle2, AlertTriangle, Info, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

const SAMPLE_NOTIFICATIONS = [
  { id: 1, icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10', title: 'Lead converted to project', body: 'Ramesh Kumar (LD-00012) has been converted.', time: '10 min ago', unread: true },
  { id: 2, icon: Wallet, color: 'text-secondary', bg: 'bg-secondary-container', title: 'Payment received', body: '₹45,000 receipt recorded for SRM-00008.', time: '1 hr ago', unread: true },
  { id: 3, icon: AlertTriangle, color: 'text-error', bg: 'bg-error/10', title: 'Follow-up overdue', body: 'Sunita Devi (LD-00007) follow-up was due yesterday.', time: '3 hrs ago', unread: true },
  { id: 4, icon: Info, color: 'text-on-surface-variant', bg: 'bg-surface-container', title: 'Stage advanced', body: 'SRM-00005 moved to Stage 9 — Installation.', time: 'Yesterday', unread: false },
  { id: 5, icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10', title: 'Checklist complete', body: 'All Stage 6 checklist items done for SRM-00003.', time: 'Yesterday', unread: false },
];

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return { open, setOpen, ref };
}

export function Header() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const notif = useDropdown();
  const menu = useDropdown();
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

  const handleLogout = async () => {
    menu.setOpen(false);
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-surface/80 backdrop-blur-xl flex justify-between items-center h-16 px-8 shadow-sm border-b border-outline-variant/10">
      {/* Search */}
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-container/20 outline-none placeholder:text-on-surface-variant/40"
            placeholder="Search projects, leads, documents..."
            type="text"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        {/* Notifications */}
        <div ref={notif.ref} className="relative">
          <button
            onClick={() => { notif.setOpen((v) => !v); menu.setOpen(false); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
            )}
          </button>

          {notif.open && (
            <div className="absolute right-0 top-12 w-80 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/10 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
                <span className="text-sm font-black text-on-surface">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline font-medium">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-surface-container-low max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-container-low/50 ${n.unread ? 'bg-primary/[0.03]' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${n.bg}`}>
                      <n.icon size={14} className={n.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-on-surface truncate">{n.title}</p>
                        {n.unread && <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-on-surface-variant/70 mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-on-surface-variant/40 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-outline-variant/10 text-center">
                <span className="text-xs text-on-surface-variant/50">Showing last 5 notifications</span>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-outline-variant/30" />

        {/* User avatar + dropdown */}
        <div ref={menu.ref} className="relative">
          <button
            onClick={() => { menu.setOpen((v) => !v); notif.setOpen(false); }}
            className="h-10 w-10 rounded-full signature-gradient flex items-center justify-center text-white text-sm font-black border-2 border-white shadow-sm hover:shadow-md transition-shadow"
          >
            {initials}
          </button>

          {menu.open && (
            <div className="absolute right-0 top-12 w-52 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/10 py-1 z-50">
              <div className="px-4 py-3 border-b border-outline-variant/10">
                <p className="text-sm font-bold text-on-surface leading-none">{user?.name}</p>
                <p className="text-xs text-on-surface-variant capitalize mt-1">
                  {user?.role?.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface-variant hover:bg-error/5 hover:text-error transition-colors rounded-b-xl"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

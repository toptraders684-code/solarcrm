import { useState, useRef, useEffect } from 'react';
import { Bell, Search, HelpCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

export function Header() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
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
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-on-surface-variant">
          <button className="hover:text-primary transition-colors">
            <Bell size={20} />
          </button>
          <button className="hover:text-primary transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>
        <div className="h-8 w-px bg-outline-variant/30" />

        {/* User avatar + dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="h-10 w-10 rounded-full signature-gradient flex items-center justify-center text-white text-sm font-black border-2 border-white shadow-sm hover:shadow-md transition-shadow"
          >
            {initials}
          </button>

          {menuOpen && (
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

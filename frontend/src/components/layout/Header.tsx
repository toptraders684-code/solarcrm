import { Bell, Search, HelpCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function Header() {
  const { user } = useAuthStore();

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

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
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold leading-none text-on-surface">{user?.name}</p>
            <p className="text-[10px] text-on-surface-variant capitalize mt-0.5">
              {user?.role?.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full signature-gradient flex items-center justify-center text-white text-sm font-black border-2 border-white shadow-sm">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}

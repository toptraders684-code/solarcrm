import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Truck,
  BarChart2,
  Settings,
  Sun,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<any>;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: FileText, roles: ['admin', 'operations_staff', 'field_technician'] },
  { to: '/applicants', label: 'Projects', icon: Users },
  { to: '/finance', label: 'Finance', icon: CreditCard, roles: ['admin', 'finance_manager', 'operations_staff'] },
  { to: '/vendors', label: 'Vendors', icon: Truck, roles: ['admin', 'operations_staff'] },
  { to: '/reports', label: 'Reports', icon: BarChart2, roles: ['admin', 'finance_manager'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

export function Sidebar() {
  const { user } = useAuthStore();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col bg-surface-container font-headline text-sm font-semibold tracking-tight py-6 z-30">
      {/* Logo */}
      <div className="px-8 mb-10">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 signature-gradient rounded-lg flex items-center justify-center shadow-md">
            <Sun size={18} className="text-white" />
          </div>
          <span className="text-xl font-black text-primary tracking-tighter">Suryam</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 ml-10">Solar CRM</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-8 py-3 transition-all',
                isActive
                  ? 'bg-surface-container-lowest text-primary rounded-l-xl ml-4 shadow-sm translate-x-1'
                  : 'text-on-surface-variant/60 hover:bg-surface-container-high hover:text-on-surface'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'text-primary' : ''} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-8 py-4 flex flex-col gap-4 border-t border-black/5">
        {user && (
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 signature-gradient rounded-full flex items-center justify-center text-white text-xs font-black">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface leading-none">{user.name}</p>
              <p className="text-[10px] text-on-surface-variant/60 capitalize mt-0.5">
                {user.role.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        )}
        <a href="#" className="flex items-center gap-3 text-on-surface-variant/60 hover:text-primary transition-colors text-sm">
          <HelpCircle size={18} />
          <span>Support</span>
        </a>
      </div>
    </aside>
  );
}

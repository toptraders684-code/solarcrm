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
  ChevronLeft,
  ChevronRight,
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

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuthStore();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside
      className={cn(
        'h-screen fixed left-0 top-0 flex flex-col bg-surface-container font-headline text-sm font-semibold tracking-tight py-6 z-30 transition-all duration-300',
        collapsed
          ? '-translate-x-full lg:translate-x-0 lg:w-16'
          : 'translate-x-0 w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('mb-10 flex items-center', collapsed ? 'justify-center px-0' : 'px-8')}>
        {collapsed ? (
          <div className="w-8 h-8 signature-gradient rounded-lg flex items-center justify-center shadow-md">
            <Sun size={18} className="text-white" />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 signature-gradient rounded-lg flex items-center justify-center shadow-md">
                <Sun size={18} className="text-white" />
              </div>
              <span className="text-xl font-black text-primary tracking-tighter">Suryam</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 ml-10">Solar CRM</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center transition-all py-3',
                collapsed
                  ? cn('justify-center px-0 mx-2 rounded-xl', isActive ? 'bg-primary/10 text-primary' : 'text-on-surface-variant/60 hover:bg-surface-container-high hover:text-on-surface')
                  : cn('gap-3 px-8', isActive ? 'bg-surface-container-lowest text-primary rounded-l-xl ml-4 shadow-sm translate-x-1' : 'text-on-surface-variant/60 hover:bg-surface-container-high hover:text-on-surface')
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'text-primary' : ''} />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('mt-auto border-t border-black/5 flex flex-col gap-1 pt-4', collapsed ? 'items-center px-0' : 'px-8')}>
        <NavLink
          to="/support"
          title={collapsed ? 'Support' : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center transition-all py-2.5',
              collapsed
                ? cn('justify-center mx-2 w-10 rounded-xl', isActive ? 'bg-primary/10 text-primary' : 'text-on-surface-variant/60 hover:text-primary')
                : cn('gap-3 text-sm', isActive ? 'text-primary' : 'text-on-surface-variant/60 hover:text-primary')
            )
          }
        >
          <HelpCircle size={18} />
          {!collapsed && <span>Support</span>}
        </NavLink>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'hidden lg:flex items-center py-2.5 text-on-surface-variant/40 hover:text-primary transition-colors',
            collapsed ? 'justify-center mx-2 w-10 rounded-xl' : 'gap-3 text-sm'
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

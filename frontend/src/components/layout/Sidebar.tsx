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
  desktopCollapsed: boolean;
  mobileOpen: boolean;
  onDesktopToggle: () => void;
  onExpand: () => void;
  onMobileClose: () => void;
}

export function Sidebar({ desktopCollapsed, mobileOpen, onDesktopToggle, onExpand, onMobileClose }: SidebarProps) {
  const { user } = useAuthStore();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside
      className={cn(
        'w-64 h-screen fixed left-0 top-0 flex flex-col bg-surface-container font-headline text-sm font-semibold tracking-tight py-6 z-30 transition-all duration-300',
        // Mobile: hidden by default, slide in when mobileOpen
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: always visible; width shrinks when collapsed
        desktopCollapsed ? 'lg:translate-x-0 lg:w-16' : 'lg:translate-x-0 lg:w-64',
      )}
    >
      {/* Logo */}
      <div className={cn('mb-10 flex items-center', desktopCollapsed ? 'lg:justify-center lg:px-0 px-8' : 'px-8')}>
        <div className={cn('flex items-center gap-2.5 mb-1', desktopCollapsed && 'lg:mb-0')}>
          <div className="w-8 h-8 signature-gradient rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
            <Sun size={18} className="text-white" />
          </div>
          <div className={desktopCollapsed ? 'lg:hidden' : ''}>
            <p className="text-xl font-black text-primary tracking-tighter leading-none">Suryam</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 mt-0.5">Solar CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={desktopCollapsed ? item.label : undefined}
            onClick={() => {
              // On mobile: close drawer after navigation
              if (mobileOpen) onMobileClose();
              // On desktop collapsed: expand sidebar
              if (desktopCollapsed) onExpand();
            }}
            className={({ isActive }) =>
              cn(
                'flex items-center transition-all py-3',
                desktopCollapsed
                  ? cn('lg:justify-center lg:mx-2 lg:px-0 lg:rounded-xl gap-3 px-8',
                      isActive
                        ? 'lg:bg-primary/10 text-primary'
                        : 'text-on-surface-variant/60 hover:bg-surface-container-high hover:text-on-surface lg:hover:bg-surface-container-high')
                  : cn('gap-3 px-8',
                      isActive
                        ? 'bg-surface-container-lowest text-primary rounded-l-xl ml-4 shadow-sm translate-x-1'
                        : 'text-on-surface-variant/60 hover:bg-surface-container-high hover:text-on-surface')
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'text-primary' : ''} />
                <span className={desktopCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('mt-auto border-t border-black/5 flex flex-col gap-1 pt-4', desktopCollapsed ? 'lg:items-center lg:px-0 px-8' : 'px-8')}>
        <NavLink
          to="/support"
          title={desktopCollapsed ? 'Support' : undefined}
          onClick={() => { if (mobileOpen) onMobileClose(); }}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 transition-all py-2.5 text-sm',
              desktopCollapsed && 'lg:justify-center lg:mx-2 lg:w-10 lg:rounded-xl',
              isActive ? 'text-primary' : 'text-on-surface-variant/60 hover:text-primary'
            )
          }
        >
          <HelpCircle size={18} />
          <span className={desktopCollapsed ? 'lg:hidden' : ''}>Support</span>
        </NavLink>

        {/* Desktop collapse toggle */}
        <button
          onClick={onDesktopToggle}
          title={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'hidden lg:flex items-center gap-3 py-2.5 text-sm text-on-surface-variant/40 hover:text-primary transition-colors',
            desktopCollapsed ? 'justify-center mx-2 w-10 rounded-xl' : ''
          )}
        >
          {desktopCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!desktopCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

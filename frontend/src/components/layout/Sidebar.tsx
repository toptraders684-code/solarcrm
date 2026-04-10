import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Truck,
  BarChart2,
  Settings,
  LogOut,
  Sun,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: FileText, roles: ['admin', 'operations_staff', 'field_technician'] },
  { to: '/applicants', label: 'Projects', icon: Users },
  { to: '/finance', label: 'Finance', icon: DollarSign, roles: ['admin', 'finance_manager', 'operations_staff'] },
  { to: '/vendors', label: 'Vendors', icon: Truck, roles: ['admin', 'operations_staff'] },
  { to: '/reports', label: 'Reports', icon: BarChart2, roles: ['admin', 'finance_manager'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

export function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    clearAuth();
    toast.success('Logged out');
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      {collapsed ? (
        <div className="flex items-center justify-center h-16 border-b border-gray-100">
          <button
            onClick={() => setCollapsed(false)}
            className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center hover:bg-brand-600 transition-colors"
            title="Expand sidebar"
          >
            <Sun className="w-5 h-5 text-white" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100">
          <div className="flex-shrink-0 w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Sun className="w-5 h-5 text-white" />
          </div>
          <span className="font-headline font-bold text-lg text-brand-500 truncate flex-1">
            Suryam CRM
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-brand-600 hover:bg-gray-100 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-brand-50 text-brand-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-gray-100 p-3">
        {!collapsed && user && (
          <div className="mb-2 px-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role.replace(/_/g, ' ')}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          className="w-full text-gray-600 hover:text-red-600 hover:bg-red-50"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}

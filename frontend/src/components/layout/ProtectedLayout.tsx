import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function ProtectedLayout() {
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((v) => !v);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      {/* Mobile backdrop */}
      {!collapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-20"
          onClick={() => setCollapsed(true)}
        />
      )}

      <div className={`transition-all duration-300 min-h-screen flex flex-col ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header onMobileToggle={toggle} />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function ProtectedLayout() {
  const { user } = useAuthStore();

  // Desktop: icon-only rail when true (default: expanded)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  // Mobile: drawer open when true (default: hidden)
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'super_admin') {
    return <Navigate to="/admin/documents" replace />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        desktopCollapsed={desktopCollapsed}
        mobileOpen={mobileOpen}
        onDesktopToggle={() => setDesktopCollapsed((v) => !v)}
        onExpand={() => setDesktopCollapsed(false)}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile backdrop — close drawer on tap */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-20"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`transition-all duration-300 min-h-screen flex flex-col ${
          desktopCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <Header onMobileToggle={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

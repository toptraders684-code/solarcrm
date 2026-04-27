import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { setAuth, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user?.role === 'super_admin') {
    navigate('/admin/documents', { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Email and password required'); return; }
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      if (res.user.role !== 'super_admin') {
        toast.error('Access denied. Super admin credentials required.');
        return;
      }
      setAuth(res.user, res.accessToken, res.refreshToken);
      toast.success('Welcome, Super Admin');
      navigate('/admin/documents');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 signature-gradient rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Sun size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">Suryam CRM</h1>
          <p className="text-xs text-on-surface-variant/60 uppercase tracking-widest mt-1">Super Admin Panel</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock size={14} className="text-primary" />
            </div>
            <h2 className="text-sm font-black text-on-surface">Admin Login</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Email</label>
              <Input
                className="mt-1"
                type="email"
                placeholder="superadmin@suryamcrm.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Password</label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-on-surface-variant/40 mt-6">
          This panel is for system administrators only.
        </p>
      </div>
    </div>
  );
}

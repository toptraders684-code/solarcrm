import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

const emailLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const otpRequestSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
});

const otpVerifySchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-error mt-1">{msg}</p>;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [otpSent, setOtpSent] = useState(false);
  const [otpMobile, setOtpMobile] = useState('');

  const emailForm = useForm({ resolver: zodResolver(emailLoginSchema) });
  const otpRequestForm = useForm({ resolver: zodResolver(otpRequestSchema) });
  const otpVerifyForm = useForm({ resolver: zodResolver(otpVerifySchema) });

  const handleEmailLogin = emailForm.handleSubmit(async (values) => {
    try {
      const res = await authService.login(values.email, values.password);
      setAuth(res.user, res.accessToken, res.refreshToken);
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  });

  const handleOtpRequest = otpRequestForm.handleSubmit(async (values) => {
    try {
      await authService.requestOtp(values.mobile);
      setOtpMobile(values.mobile);
      setOtpSent(true);
      toast.success('OTP sent to your mobile number');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send OTP';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  });

  const handleOtpVerify = otpVerifyForm.handleSubmit(async (values) => {
    try {
      const res = await authService.verifyOtp(otpMobile, values.otp);
      setAuth(res.user, res.accessToken, res.refreshToken);
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid OTP';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  });

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full signature-gradient opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full signature-gradient opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 signature-gradient rounded-2xl mb-4 shadow-lg">
            <Sun size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tighter font-headline">Suryam CRM</h1>
          <p className="mt-1 text-sm text-on-surface-variant/60">Solar Rooftop Installation Management</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-on-surface font-headline">Sign In</h2>
            <p className="text-sm text-on-surface-variant/60 mt-1">Access your account to continue</p>
          </div>

          <Tabs defaultValue="password">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="password" className="flex-1 text-xs">Email & Password</TabsTrigger>
              <TabsTrigger value="otp" className="flex-1 text-xs">Mobile OTP</TabsTrigger>
            </TabsList>

            {/* Email + Password */}
            <TabsContent value="password">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Email Address</label>
                  <Input className="mt-1" type="email" placeholder="admin@suryamcrm.in" {...emailForm.register('email')} />
                  <FieldError msg={emailForm.formState.errors.email?.message as string} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Password</label>
                  <Input className="mt-1" type="password" placeholder="••••••••" {...emailForm.register('password')} />
                  <FieldError msg={emailForm.formState.errors.password?.message as string} />
                </div>
                <Button type="submit" className="w-full mt-2" loading={emailForm.formState.isSubmitting}>
                  Sign In
                </Button>
              </form>
            </TabsContent>

            {/* Mobile OTP */}
            <TabsContent value="otp">
              {!otpSent ? (
                <form onSubmit={handleOtpRequest} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Mobile Number</label>
                    <Input className="mt-1" type="tel" placeholder="9876543210" maxLength={10} {...otpRequestForm.register('mobile')} />
                    <FieldError msg={otpRequestForm.formState.errors.mobile?.message as string} />
                  </div>
                  <Button type="submit" className="w-full mt-2" loading={otpRequestForm.formState.isSubmitting}>
                    Send OTP
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <p className="text-sm text-on-surface-variant/70">
                    OTP sent to <span className="font-bold text-on-surface">+91 {otpMobile}</span>.{' '}
                    <button type="button" className="text-primary hover:underline font-semibold" onClick={() => setOtpSent(false)}>
                      Change
                    </button>
                  </p>
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Enter OTP</label>
                    <Input className="mt-1 text-center text-lg tracking-widest" type="text" placeholder="123456" maxLength={6} {...otpVerifyForm.register('otp')} />
                    <FieldError msg={otpVerifyForm.formState.errors.otp?.message as string} />
                  </div>
                  <Button type="submit" className="w-full mt-2" loading={otpVerifyForm.formState.isSubmitting}>
                    Verify OTP
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-on-surface-variant/40 mt-6">
          Suryam CRM &copy; {new Date().getFullYear()} &mdash; Solar EPC Management
        </p>
      </div>
    </div>
  );
}

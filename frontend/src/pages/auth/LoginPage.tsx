import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-4 shadow-lg">
            <Sun className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-gray-900">Suryam CRM</h1>
          <p className="mt-1 text-muted-foreground">Solar Rooftop Installation Management</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Access your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="password">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="password" className="flex-1">Email & Password</TabsTrigger>
                <TabsTrigger value="otp" className="flex-1">Mobile OTP</TabsTrigger>
              </TabsList>

              {/* Email + Password */}
              <TabsContent value="password">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@suryam.in"
                      {...emailForm.register('email')}
                    />
                    {emailForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{emailForm.formState.errors.email.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...emailForm.register('password')}
                    />
                    {emailForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{emailForm.formState.errors.password.message as string}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={emailForm.formState.isSubmitting}
                  >
                    {emailForm.formState.isSubmitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              {/* Mobile OTP */}
              <TabsContent value="otp">
                {!otpSent ? (
                  <form onSubmit={handleOtpRequest} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="9876543210"
                        maxLength={10}
                        {...otpRequestForm.register('mobile')}
                      />
                      {otpRequestForm.formState.errors.mobile && (
                        <p className="text-xs text-destructive">{otpRequestForm.formState.errors.mobile.message as string}</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={otpRequestForm.formState.isSubmitting}
                    >
                      {otpRequestForm.formState.isSubmitting && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Send OTP
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleOtpVerify} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      OTP sent to <strong>+91 {otpMobile}</strong>.{' '}
                      <button
                        type="button"
                        className="text-brand-500 hover:underline"
                        onClick={() => setOtpSent(false)}
                      >
                        Change
                      </button>
                    </p>
                    <div className="space-y-1.5">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                        {...otpVerifyForm.register('otp')}
                      />
                      {otpVerifyForm.formState.errors.otp && (
                        <p className="text-xs text-destructive">{otpVerifyForm.formState.errors.otp.message as string}</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={otpVerifyForm.formState.isSubmitting}
                    >
                      {otpVerifyForm.formState.isSubmitting && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Verify OTP
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Suryam CRM &copy; {new Date().getFullYear()} &mdash; Solar EPC Management
        </p>
      </div>
    </div>
  );
}

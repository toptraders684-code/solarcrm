import { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usersService } from '@/services/users.service';

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
      {children}{required && <span className="text-error"> *</span>}
    </label>
  );
}

function PasswordInput({
  id, placeholder, registration, error, show, onToggle,
}: {
  id: string; placeholder: string;
  registration: any; error?: string;
  show: boolean; onToggle: () => void;
}) {
  return (
    <div>
      <div className="relative mt-1">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete="new-password"
          className={`pr-10 ${error ? 'border-error' : ''}`}
          {...registration}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="mt-1 text-[10px] text-error font-semibold">{error}</p>}
    </div>
  );
}

export default function ChangePasswordPage() {
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      usersService.changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully');
      reset();
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? 'Failed to change password';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  return (
    <PageWrapper title="Change Password" subtitle="Update your account password">
      <div className="max-w-md">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-container-low">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <KeyRound size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">Update Password</p>
              <p className="text-xs text-on-surface-variant/60 mt-0.5">Choose a strong password with at least 8 characters</p>
            </div>
          </div>

          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
            <div>
              <FieldLabel required>Current Password</FieldLabel>
              <PasswordInput
                id="currentPassword"
                placeholder="Enter your current password"
                registration={register('currentPassword', { required: 'Current password is required' })}
                error={errors.currentPassword?.message}
                show={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
              />
            </div>

            <div>
              <FieldLabel required>New Password</FieldLabel>
              <PasswordInput
                id="newPassword"
                placeholder="Min 8 characters"
                registration={register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Must be at least 8 characters' },
                })}
                error={errors.newPassword?.message}
                show={showNew}
                onToggle={() => setShowNew((v) => !v)}
              />
            </div>

            <div>
              <FieldLabel required>Confirm New Password</FieldLabel>
              <PasswordInput
                id="confirmPassword"
                placeholder="Repeat new password"
                registration={register('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: (v) => v === watch('newPassword') || 'Passwords do not match',
                })}
                error={errors.confirmPassword?.message}
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" loading={mutation.isPending} className="w-full">
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}

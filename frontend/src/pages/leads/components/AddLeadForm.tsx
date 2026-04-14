import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createLeadSchema, type CreateLeadFormData } from '@/utils/validators';
import { masterService } from '@/services/master.service';
import { usersService } from '@/services/users.service';
import { leadsService } from '@/services/leads.service';

interface AddLeadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddLeadForm({ onSuccess, onCancel }: AddLeadFormProps) {
  const { data: enums } = useQuery({ queryKey: ['enums'], queryFn: () => masterService.getEnums() });
  const { data: statesData } = useQuery({ queryKey: ['states'], queryFn: () => masterService.getStates() });
  const { data: staffData } = useQuery({ queryKey: ['staff'], queryFn: () => usersService.getStaff() });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
  });

  const selectedStateId = watch('addressStateId');

  const { data: districtsData } = useQuery({
    queryKey: ['districts', selectedStateId],
    queryFn: () => masterService.getDistricts(selectedStateId),
    enabled: !!selectedStateId,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await leadsService.createLead({
        ...values,
        estimatedCapacityKw: values.estimatedCapacityKw ? Number(values.estimatedCapacityKw) : undefined,
      } as any);
      toast.success('Lead created successfully');
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create lead';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  });

  const L = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{children}</label>
  );

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
      <div>
        <L>Customer Name *</L>
        <Input className="mt-1" placeholder="Full name" {...register('customerName')} />
        {errors.customerName && <p className="text-xs text-error mt-1">{errors.customerName.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <L>Mobile *</L>
          <Input className="mt-1" placeholder="10-digit mobile" maxLength={10} {...register('mobile')} />
          {errors.mobile && <p className="text-xs text-error mt-1">{errors.mobile.message}</p>}
        </div>
        <div>
          <L>Alternate Mobile</L>
          <Input className="mt-1" placeholder="10-digit mobile" maxLength={10} {...register('alternateMobile')} />
        </div>
      </div>

      <div>
        <L>Email</L>
        <Input className="mt-1" type="email" placeholder="customer@email.com" {...register('email')} />
      </div>

      <div>
        <L>Village / Area *</L>
        <Input className="mt-1" placeholder="Village or locality name" {...register('addressVillage')} />
        {errors.addressVillage && <p className="text-xs text-error mt-1">{errors.addressVillage.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <L>State</L>
          <Select onValueChange={(v) => { setValue('addressStateId', v); setValue('addressDistrictId', ''); }}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent>
              {statesData?.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <L>District</L>
          <Select onValueChange={(v) => setValue('addressDistrictId', v)} disabled={!selectedStateId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select district" /></SelectTrigger>
            <SelectContent>
              {districtsData?.data?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <L>Pincode</L>
          <Input className="mt-1" placeholder="6-digit pincode" maxLength={6} {...register('addressPincode')} />
        </div>
        <div>
          <L>DISCOM *</L>
          <Select onValueChange={(v) => setValue('discom', v as any)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select DISCOM" /></SelectTrigger>
            <SelectContent>
              {enums?.discoms?.map((d) => <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.discom && <p className="text-xs text-error mt-1">{errors.discom.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <L>Project Type *</L>
          <Select onValueChange={(v) => setValue('projectType', v as any)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {enums?.projectTypes?.map((t) => (
                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.projectType && <p className="text-xs text-error mt-1">{errors.projectType.message}</p>}
        </div>
        <div>
          <L>Est. Capacity (kW)</L>
          <Input className="mt-1" type="number" step="0.01" placeholder="e.g. 3.00" {...register('estimatedCapacityKw', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <L>Lead Source *</L>
          <Select onValueChange={(v) => setValue('leadSource', v as any)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select source" /></SelectTrigger>
            <SelectContent>
              {enums?.leadSources?.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.leadSource && <p className="text-xs text-error mt-1">{errors.leadSource.message}</p>}
        </div>
        <div>
          <L>Finance Preference</L>
          <Select onValueChange={(v) => setValue('financePreference', v as any)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select preference" /></SelectTrigger>
            <SelectContent>
              {enums?.financePreferences?.map((f) => (
                <SelectItem key={f} value={f}>{f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <L>Assigned Staff *</L>
        <Select onValueChange={(v) => setValue('assignedStaffId', v)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select staff member" /></SelectTrigger>
          <SelectContent>
            {staffData?.data?.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name} ({u.role.replace(/_/g, ' ')})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.assignedStaffId && <p className="text-xs text-error mt-1">{errors.assignedStaffId.message}</p>}
      </div>

      <div>
        <L>Follow Up Date</L>
        <Input className="mt-1" type="date" {...register('followUpDate')} />
      </div>

      <div className="flex gap-3 pt-4 border-t border-surface-container-low">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1" loading={isSubmitting}>Create Lead</Button>
      </div>
    </form>
  );
}

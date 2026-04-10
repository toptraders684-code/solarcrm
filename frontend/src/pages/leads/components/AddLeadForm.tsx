import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const { data: enums } = useQuery({
    queryKey: ['enums'],
    queryFn: () => masterService.getEnums(),
  });

  const { data: statesData } = useQuery({
    queryKey: ['states'],
    queryFn: () => masterService.getStates(),
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: () => usersService.getStaff(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadFormData>({
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

  return (
    <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Customer Name *</Label>
          <Input placeholder="Full name" {...register('customerName')} />
          {errors.customerName && <p className="text-xs text-destructive">{errors.customerName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Mobile *</Label>
          <Input placeholder="10-digit mobile" maxLength={10} {...register('mobile')} />
          {errors.mobile && <p className="text-xs text-destructive">{errors.mobile.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Alternate Mobile</Label>
          <Input placeholder="10-digit mobile" maxLength={10} {...register('alternateMobile')} />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Email</Label>
          <Input type="email" placeholder="customer@email.com" {...register('email')} />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Village / Area *</Label>
          <Input placeholder="Village or locality name" {...register('addressVillage')} />
          {errors.addressVillage && <p className="text-xs text-destructive">{errors.addressVillage.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>State</Label>
          <Select onValueChange={(v) => { setValue('addressStateId', v); setValue('addressDistrictId', ''); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {statesData?.data?.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>District</Label>
          <Select onValueChange={(v) => setValue('addressDistrictId', v)} disabled={!selectedStateId}>
            <SelectTrigger>
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {districtsData?.data?.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Pincode</Label>
          <Input placeholder="6-digit pincode" maxLength={6} {...register('addressPincode')} />
        </div>

        <div className="space-y-1.5">
          <Label>DISCOM *</Label>
          <Select onValueChange={(v) => setValue('discom', v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select DISCOM" />
            </SelectTrigger>
            <SelectContent>
              {enums?.discoms?.map((d) => (
                <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.discom && <p className="text-xs text-destructive">{errors.discom.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Project Type *</Label>
          <Select onValueChange={(v) => setValue('projectType', v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {enums?.projectTypes?.map((t) => (
                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.projectType && <p className="text-xs text-destructive">{errors.projectType.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Est. Capacity (kW)</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="e.g. 3.00"
            {...register('estimatedCapacityKw', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Lead Source *</Label>
          <Select onValueChange={(v) => setValue('leadSource', v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {enums?.leadSources?.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.leadSource && <p className="text-xs text-destructive">{errors.leadSource.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Finance Preference</Label>
          <Select onValueChange={(v) => setValue('financePreference', v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select preference" />
            </SelectTrigger>
            <SelectContent>
              {enums?.financePreferences?.map((f) => (
                <SelectItem key={f} value={f}>{f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Assigned Staff *</Label>
          <Select onValueChange={(v) => setValue('assignedStaffId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              {staffData?.data?.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({u.role.replace(/_/g, ' ')})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.assignedStaffId && <p className="text-xs text-destructive">{errors.assignedStaffId.message}</p>}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Follow Up Date</Label>
          <Input type="date" {...register('followUpDate')} />
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Lead
        </Button>
      </div>
    </form>
  );
}

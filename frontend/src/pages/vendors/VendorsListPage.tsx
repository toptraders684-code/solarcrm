import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { vendorsService } from '@/services/vendors.service';
import { formatDate, toTitleCase } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import type { Vendor } from '@/types';

const VENDOR_TYPES = ['material_supplier', 'labour_installer', 'transport_logistics'];

export default function VendorsListPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const canManage = user && ['admin', 'operations_staff'].includes(user.role);

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', page, search, typeFilter],
    queryFn: () =>
      vendorsService.getVendors({
        page,
        limit: 25,
        search: search || undefined,
        vendorType: typeFilter || undefined,
      }),
  });

  const vendors = data?.data ?? [];
  const meta = data?.meta;

  const { register, handleSubmit, setValue, watch, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      businessName: '',
      contactPerson: '',
      mobile: '',
      email: '',
      addressVillage: '',
      vendorTypes: [] as string[],
      gstin: '',
      ifscCode: '',
    },
  });

  const selectedTypes = watch('vendorTypes');

  const onSubmit = handleSubmit(async (values) => {
    try {
      await vendorsService.createVendor({ ...values, vendorTypes: values.vendorTypes as any });
      toast.success('Vendor added successfully');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setAddOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to add vendor');
    }
  });

  return (
    <PageWrapper
      title="Vendors"
      subtitle={`${meta?.total ?? 0} vendors`}
      actions={
        canManage ? (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        ) : undefined
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border p-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search vendors..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {VENDOR_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{toTitleCase(t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Business Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Types</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Since</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              : vendors.map((v: Vendor) => (
                  <tr key={v.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/vendors/${v.id}`} className="font-medium text-brand-600 hover:underline">
                        {v.businessName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p>{v.contactPerson ?? '—'}</p>
                      {v.mobile && <p className="text-xs text-muted-foreground">{v.mobile}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {v.vendorTypes?.map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs">
                            {toTitleCase(t).split(' ')[0]}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {v.addressVillage ?? '—'}{v.addressDistrict ? `, ${v.addressDistrict}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={v.isActive ? 'success' : 'secondary'}>
                        {v.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(v.empanelmentDate)}</td>
                  </tr>
                ))}
            {!isLoading && vendors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No vendors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Vendor Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Add Vendor</SheetTitle>
          </SheetHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Business Name *</Label>
              <Input placeholder="Company / firm name" {...register('businessName', { required: true })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Contact Person</Label>
                <Input placeholder="Name" {...register('contactPerson')} />
              </div>
              <div className="space-y-1.5">
                <Label>Mobile</Label>
                <Input placeholder="10-digit" maxLength={10} {...register('mobile')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
            </div>
            <div className="space-y-1.5">
              <Label>Village / Location</Label>
              <Input {...register('addressVillage')} />
            </div>
            <div className="space-y-2">
              <Label>Vendor Types *</Label>
              {VENDOR_TYPES.map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <Checkbox
                    id={t}
                    checked={selectedTypes.includes(t)}
                    onCheckedChange={(checked) => {
                      if (checked) setValue('vendorTypes', [...selectedTypes, t]);
                      else setValue('vendorTypes', selectedTypes.filter((x) => x !== t));
                    }}
                  />
                  <label htmlFor={t} className="text-sm cursor-pointer">{toTitleCase(t)}</label>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>GSTIN</Label>
                <Input placeholder="15-char GST" {...register('gstin')} />
              </div>
              <div className="space-y-1.5">
                <Label>IFSC Code</Label>
                <Input placeholder="AAAA0AAAAAA" {...register('ifscCode')} />
              </div>
            </div>
            <div className="flex gap-3 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                Add Vendor
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </PageWrapper>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Phone, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { vendorsService } from '@/services/vendors.service';
import { formatDate, toTitleCase } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import type { Vendor } from '@/types';

const VENDOR_TYPES = [
  'channel_partner',
  'district_partner',
  'block_partner',
  'installation_partner',
  'transport_partner',
  'insurance_partner',
  'netmeter_partner',
];

const VENDOR_TYPE_LABELS: Record<string, string> = {
  channel_partner:      'Channel Partner',
  district_partner:     'District Partner',
  block_partner:        'Block Partner',
  installation_partner: 'Installation Partner',
  transport_partner:    'Transport Partner',
  insurance_partner:    'Insurance Partner',
  netmeter_partner:     'Netmeter Partner',
};

export default function VendorsListPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const canManage = user && ['admin', 'operations_staff'].includes(user.role);

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', page, search, typeFilter],
    queryFn: () => vendorsService.getVendors({ page, limit: 25, search: search || undefined, vendorType: typeFilter || undefined }),
  });

  const vendors = data?.data ?? [];
  const meta = data?.meta;

  const { register, handleSubmit, setValue, watch, reset, formState: { isSubmitting, errors } } = useForm({
    defaultValues: { businessName: '', contactPerson: '', mobile: '', email: '', addressVillage: '', vendorTypes: [] as string[], gstin: '', ifscCode: '', loginMobile: '', loginPassword: '' },
  });

  const selectedTypes = watch('vendorTypes');
  const loginMobile = watch('loginMobile');
  const loginPassword = watch('loginPassword');

  const onSubmit = handleSubmit(async (values) => {
    const hasLogin = values.loginMobile?.trim() || values.loginPassword?.trim();
    if (hasLogin && !/^\d{10}$/.test(values.loginMobile ?? '')) {
      toast.error('Login mobile must be 10 digits');
      return;
    }
    if (hasLogin && (values.loginPassword?.length ?? 0) < 8) {
      toast.error('Login password must be at least 8 characters');
      return;
    }
    try {
      const result = await vendorsService.createVendor({
        ...values,
        vendorTypes: values.vendorTypes as any,
        loginMobile: values.loginMobile?.trim() || undefined,
        loginPassword: values.loginPassword?.trim() || undefined,
      });
      const loginMsg = (result as any).loginCreated ? ' Login account created.' : '';
      toast.success(`Vendor added successfully.${loginMsg}`);
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setAddOpen(false); reset(); setShowLoginPwd(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to add vendor');
    }
  });

  return (
    <PageWrapper
      title="Vendors"
      subtitle={`${meta?.total ?? 0} vendors`}
      actions={canManage ? <Button onClick={() => setAddOpen(true)}><Plus size={16} />Add Vendor</Button> : undefined}
    >
      <div className="bg-surface-container-lowest rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={16} />
          <Input placeholder="Search vendors..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {VENDOR_TYPES.map((t) => <SelectItem key={t} value={t}>{VENDOR_TYPE_LABELS[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
              <th className="px-6 py-4">Business Name</th><th className="px-4 py-4">Contact</th>
              <th className="px-4 py-4">Types</th><th className="px-4 py-4">Location</th>
              <th className="px-4 py-4">Status</th><th className="px-6 py-4">Since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {isLoading ? [...Array(6)].map((_, i) => (
              <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-4"><Skeleton className="h-4" /></td>)}</tr>
            )) : vendors.map((v: Vendor) => (
              <tr key={v.id} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="px-6 py-4">
                  <Link to={`/vendors/${v.id}`} className="font-bold text-primary hover:underline text-sm">{v.businessName}</Link>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold text-on-surface">{v.contactPerson || '—'}</p>
                  {v.mobile && <p className="text-xs text-on-surface-variant/60 flex items-center gap-1 mt-0.5"><Phone size={10} />{v.mobile}</p>}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {v.vendorTypes?.map((t: string) => (
                      <span key={t} className="px-1.5 py-0.5 bg-surface-container text-on-surface-variant rounded text-[9px] font-bold uppercase">
                        {t.split('_').map(w => w[0].toUpperCase()).join('')}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-on-surface-variant">{v.addressVillage || '—'}</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${v.isActive ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                    {v.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{formatDate(v.empanelmentDate)}</td>
              </tr>
            ))}
            {!isLoading && vendors.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-on-surface-variant/50 text-sm">No vendors found.</td></tr>
            )}
          </tbody>
        </table>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-container-low">
            <p className="text-xs text-on-surface-variant/60">Page {meta.page} of {meta.totalPages} &mdash; {meta.total} results</p>
            <div className="flex gap-2">
              <button className="text-xs px-3 py-1.5 rounded-lg bg-surface-container font-semibold disabled:opacity-40" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="text-xs px-3 py-1.5 rounded-lg bg-surface-container font-semibold disabled:opacity-40" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="overflow-y-auto p-8">
          <SheetHeader><SheetTitle>Add New Vendor</SheetTitle></SheetHeader>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Business Name <span className="text-error">*</span></label>
              <Input className="mt-1" placeholder="Company / firm name" {...register('businessName', { required: true })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Contact Person</label>
                <Input className="mt-1" placeholder="Name" {...register('contactPerson')} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Mobile</label>
                <Input className="mt-1" placeholder="10-digit" maxLength={10} {...register('mobile')} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Email</label>
              <Input className="mt-1" type="email" {...register('email')} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Village / Location</label>
              <Input className="mt-1" {...register('addressVillage')} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-2 block">Vendor Types <span className="text-error">*</span></label>
              {VENDOR_TYPES.map((t) => (
                <div key={t} className="flex items-center gap-2 py-1.5">
                  <Checkbox id={t} checked={selectedTypes.includes(t)}
                    onCheckedChange={(checked) => {
                      if (checked) setValue('vendorTypes', [...selectedTypes, t]);
                      else setValue('vendorTypes', selectedTypes.filter((x) => x !== t));
                    }} />
                  <label htmlFor={t} className="text-sm cursor-pointer font-medium">{VENDOR_TYPE_LABELS[t]}</label>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">GSTIN</label>
                <Input className="mt-1" placeholder="15-char GST number" maxLength={15} {...register('gstin')} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">IFSC Code</label>
                <Input className="mt-1" placeholder="e.g. SBIN0001234" maxLength={11} {...register('ifscCode')} />
              </div>
            </div>

            {/* Login account section */}
            <div className="border-t border-surface-container-low pt-4 space-y-3">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Login Account</p>
                <p className="text-xs text-on-surface-variant/60 mt-0.5">
                  Set credentials so this vendor can log into the system. Leave blank to skip.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Login Mobile</label>
                  <Input
                    className="mt-1"
                    placeholder="10-digit mobile"
                    maxLength={10}
                    {...register('loginMobile')}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Password</label>
                  <div className="relative mt-1">
                    <Input
                      type={showLoginPwd ? 'text' : 'password'}
                      placeholder="Min 8 characters"
                      className="pr-10"
                      autoComplete="new-password"
                      {...register('loginPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                    >
                      {showLoginPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              {(loginMobile || loginPassword) && (
                <p className="text-[10px] text-on-surface-variant/50">
                  Login name will be set to Contact Person (or Business Name if blank).
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-surface-container-low">
              <Button type="button" variant="secondary" onClick={() => { setAddOpen(false); reset(); setShowLoginPwd(false); }} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1" loading={isSubmitting}>Add Vendor</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </PageWrapper>
  );
}

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, MapPin, Building2, CreditCard } from 'lucide-react';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { vendorsService } from '@/services/vendors.service';
import { formatDate, toTitleCase } from '@/utils/formatters';

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-surface-container-low last:border-0">
      <span className="text-xs text-on-surface-variant/60 font-medium">{label}</span>
      <span className="text-sm font-semibold text-on-surface text-right">{children}</span>
    </div>
  );
}

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorsService.getVendor(id!),
    enabled: !!id,
  });

  const vendor = data?.data;

  if (isLoading) {
    return <PageWrapper title="Vendor Details"><Skeleton className="h-64 w-full" /></PageWrapper>;
  }

  if (!vendor) return null;

  return (
    <PageWrapper
      title={vendor.businessName}
      subtitle="Vendor profile"
      actions={
        <Button variant="secondary" size="sm" onClick={() => navigate('/vendors')}>
          <ArrowLeft size={14} />Back
        </Button>
      }
    >
      {/* Header card */}
      <div className="bg-surface-container-lowest rounded-xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 signature-gradient rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
          <Building2 size={28} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-black text-on-surface font-headline">{vendor.businessName}</h2>
          <div className="flex flex-wrap gap-1 mt-2">
            {vendor.vendorTypes?.map((t: string) => (
              <span key={t} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase">
                {toTitleCase(t)}
              </span>
            ))}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${vendor.isActive ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
          {vendor.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact */}
        <div className="bg-surface-container-lowest rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 signature-gradient rounded-lg flex items-center justify-center">
              <Phone size={14} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-on-surface font-headline">Contact Details</h3>
          </div>
          <InfoRow label="Contact Person">{vendor.contactPerson ?? '—'}</InfoRow>
          <InfoRow label="Mobile">{vendor.mobile ?? '—'}</InfoRow>
          <InfoRow label="Email">{vendor.email ?? '—'}</InfoRow>
          <InfoRow label="Empanelment Date">{formatDate(vendor.empanelmentDate)}</InfoRow>
        </div>

        {/* Address */}
        <div className="bg-surface-container-lowest rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 signature-gradient rounded-lg flex items-center justify-center">
              <MapPin size={14} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-on-surface font-headline">Address</h3>
          </div>
          <InfoRow label="Village">{vendor.addressVillage ?? '—'}</InfoRow>
          <InfoRow label="District">{vendor.addressDistrict ?? '—'}</InfoRow>
          <InfoRow label="State">{vendor.addressState ?? '—'}</InfoRow>
          <InfoRow label="Pincode">{vendor.addressPincode ?? '—'}</InfoRow>
        </div>

        {/* Business */}
        <div className="bg-surface-container-lowest rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 signature-gradient rounded-lg flex items-center justify-center">
              <CreditCard size={14} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-on-surface font-headline">Financial Details</h3>
          </div>
          <InfoRow label="GSTIN">{vendor.gstin ?? '—'}</InfoRow>
          <InfoRow label="IFSC Code">{vendor.ifscCode ?? '—'}</InfoRow>
          <InfoRow label="Bank Account">{(vendor as any).bankAccountNumber ?? '—'}</InfoRow>
        </div>
      </div>
    </PageWrapper>
  );
}

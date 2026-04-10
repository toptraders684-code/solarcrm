import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { vendorsService } from '@/services/vendors.service';
import { formatDate, toTitleCase } from '@/utils/formatters';

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
        <Button variant="outline" size="sm" onClick={() => navigate('/vendors')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Contact Details</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row label="Contact Person">{vendor.contactPerson ?? '—'}</Row>
            <Row label="Mobile">{vendor.mobile ?? '—'}</Row>
            <Row label="Email">{vendor.email ?? '—'}</Row>
            <Row label="Status">
              <Badge variant={vendor.isActive ? 'success' : 'secondary'}>
                {vendor.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Address</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row label="Village">{vendor.addressVillage ?? '—'}</Row>
            <Row label="District">{vendor.addressDistrict ?? '—'}</Row>
            <Row label="State">{vendor.addressState ?? '—'}</Row>
            <Row label="Pincode">{vendor.addressPincode ?? '—'}</Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Business Details</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row label="Vendor Types">
              <div className="flex flex-wrap gap-1">
                {vendor.vendorTypes?.map((t) => (
                  <Badge key={t} variant="secondary">{toTitleCase(t)}</Badge>
                ))}
              </div>
            </Row>
            <Row label="GSTIN">{vendor.gstin ?? '—'}</Row>
            <Row label="IFSC Code">{vendor.ifscCode ?? '—'}</Row>
            <Row label="Empanelment Date">{formatDate(vendor.empanelmentDate)}</Row>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="font-medium text-right">{children}</span>
    </div>
  );
}

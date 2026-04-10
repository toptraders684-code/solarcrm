import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StageProgressBar } from './components/StageProgressBar';
import { DocumentsTab } from './components/DocumentsTab';
import { ChecklistTab } from './components/ChecklistTab';
import { FinanceTab } from './components/FinanceTab';
import { DiscomTab } from './components/DiscomTab';
import { ProcurementTab } from './components/ProcurementTab';
import { EditApplicantSheet } from './components/EditApplicantSheet';
import { applicantsService } from '@/services/applicants.service';
import { formatDate, getStageName, getDiscomLabel, toTitleCase, formatCapacity } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';

export default function ApplicantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['applicant', id],
    queryFn: () => applicantsService.getApplicant(id!),
    enabled: !!id,
  });

  const applicant = data?.data;

  const advanceMutation = useMutation({
    mutationFn: () => applicantsService.advanceStage(id!),
    onSuccess: () => {
      toast.success('Stage advanced successfully');
      queryClient.invalidateQueries({ queryKey: ['applicant', id] });
      setAdvanceOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Cannot advance stage — check mandatory checklist items');
    },
  });

  if (isLoading) {
    return (
      <PageWrapper title="Project Details">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </PageWrapper>
    );
  }

  if (!applicant) return null;

  const canAdvance = user && ['admin', 'operations_staff'].includes(user.role) && applicant.stage < 11;
  const canEdit = user && ['admin', 'operations_staff'].includes(user.role);

  return (
    <PageWrapper
      title={applicant.customerName}
      subtitle={`Project Code: ${applicant.applicantCode}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/applicants')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="w-4 h-4 mr-1" />
              Edit Details
            </Button>
          )}
          {canAdvance && (
            <Button size="sm" onClick={() => setAdvanceOpen(true)}>
              <ChevronRight className="w-4 h-4 mr-1" />
              Advance Stage
            </Button>
          )}
        </div>
      }
    >
      {/* Stage Progress Bar */}
      <StageProgressBar currentStage={applicant.stage} />

      {/* Meta info strip */}
      <div className="flex flex-wrap gap-3 text-sm">
        <Badge variant="info">{applicant.discom.toUpperCase()}</Badge>
        <Badge variant="secondary" className="capitalize">{applicant.projectType}</Badge>
        {applicant.systemCapacityKw && (
          <Badge variant="outline">{formatCapacity(applicant.systemCapacityKw)}</Badge>
        )}
        <span className="text-muted-foreground">Assigned: {applicant.assignedStaff?.name ?? '—'}</span>
        <span className="text-muted-foreground">Stage updated: {formatDate(applicant.stageUpdatedAt)}</span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="discom">DISCOM Application</TabsTrigger>
          <TabsTrigger value="procurement">Procurement</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <InfoRow label="Date of Birth">{formatDate(applicant.dateOfBirth)}</InfoRow>
                <InfoRow label="Gender">{applicant.gender ? toTitleCase(applicant.gender) : '—'}</InfoRow>
                <InfoRow label="Email">{applicant.email ?? '—'}</InfoRow>
                <InfoRow label="WhatsApp">{applicant.whatsappNumber ?? '—'}</InfoRow>
                <InfoRow label="Alternate Mobile">{applicant.alternateMobile ?? '—'}</InfoRow>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Address</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <InfoRow label="House / Plot">{applicant.addressHouse ?? '—'}</InfoRow>
                <InfoRow label="Street">{applicant.addressStreet ?? '—'}</InfoRow>
                <InfoRow label="Village">{applicant.addressVillage ?? '—'}</InfoRow>
                <InfoRow label="District">{applicant.addressDistrict?.name ?? '—'}</InfoRow>
                <InfoRow label="State">{applicant.addressState?.name ?? '—'}</InfoRow>
                <InfoRow label="Pincode">{applicant.addressPincode ?? '—'}</InfoRow>
                {applicant.gpsLatitude && (
                  <InfoRow label="GPS">{applicant.gpsLatitude}, {applicant.gpsLongitude}</InfoRow>
                )}
              </CardContent>
            </Card>

            {/* Installation */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Installation Details</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <InfoRow label="System Capacity">{formatCapacity(applicant.systemCapacityKw)}</InfoRow>
                <InfoRow label="Sanctioned Load">{formatCapacity(applicant.sanctionedLoadKw)}</InfoRow>
                <InfoRow label="Roof Type">{applicant.roofType ? toTitleCase(applicant.roofType) : '—'}</InfoRow>
                <InfoRow label="Consumer No.">{applicant.existingConsumerNo ?? '—'}</InfoRow>
                <InfoRow label="DISCOM Ref No.">{applicant.discomRefNo ?? '—'}</InfoRow>
              </CardContent>
            </Card>

            {/* Survey */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Survey Information</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <InfoRow label="Survey Date">{formatDate(applicant.surveyDate)}</InfoRow>
                <InfoRow label="Surveyed By">{applicant.surveyedBy ?? '—'}</InfoRow>
                <InfoRow label="Roof Area">{applicant.roofAreaSqft ? `${applicant.roofAreaSqft} sqft` : '—'}</InfoRow>
                <InfoRow label="Recommended Capacity">{formatCapacity(applicant.recommendedCapacityKw)}</InfoRow>
                {applicant.shadowAnalysis && (
                  <InfoRow label="Shadow Analysis">{applicant.shadowAnalysis}</InfoRow>
                )}
              </CardContent>
            </Card>

            {/* DISCOM Application */}
            <Card>
              <CardHeader><CardTitle className="text-sm">DISCOM Application</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <InfoRow label="Portal Application">{formatDate(applicant.portalApplicationDate)}</InfoRow>
                <InfoRow label="JE Name">{applicant.jeName ?? '—'}</InfoRow>
                <InfoRow label="JE Contact">{applicant.jeContact ?? '—'}</InfoRow>
                <InfoRow label="MRT Date">{formatDate(applicant.mrtDate)}</InfoRow>
                <InfoRow label="Inspection Date">{formatDate(applicant.inspectionDate)}</InfoRow>
                <InfoRow label="Inspection Result">{applicant.inspectionResult ? toTitleCase(applicant.inspectionResult) : '—'}</InfoRow>
                <InfoRow label="Net Meter S/N">{applicant.netMeterSerialNo ?? '—'}</InfoRow>
              </CardContent>
            </Card>

            {/* Finance */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Finance Details</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <InfoRow label="Finance Mode">{applicant.financeMode ? toTitleCase(applicant.financeMode) : '—'}</InfoRow>
                <InfoRow label="Bank Name">{applicant.bankName ?? '—'}</InfoRow>
                <InfoRow label="Loan Amount">{applicant.loanAmount ? `₹${applicant.loanAmount}` : '—'}</InfoRow>
                <InfoRow label="Loan Sanctioned">{formatDate(applicant.loanSanctionedDate)}</InfoRow>
                <InfoRow label="Overpayment Rule">{toTitleCase(applicant.overpaymentRule)}</InfoRow>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="discom" className="mt-4">
          <DiscomTab applicant={applicant} />
        </TabsContent>

        <TabsContent value="procurement" className="mt-4">
          <ProcurementTab applicant={applicant} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsTab applicantId={id!} />
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          <ChecklistTab applicantId={id!} applicant={applicant} />
        </TabsContent>

        <TabsContent value="finance" className="mt-4">
          <FinanceTab applicantId={id!} />
        </TabsContent>
      </Tabs>

      <EditApplicantSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        applicant={applicant}
      />

      <ConfirmDialog
        open={advanceOpen}
        onOpenChange={setAdvanceOpen}
        title={`Advance to Stage ${(applicant.stage ?? 0) + 1}?`}
        description={`This will move the project from "${getStageName(applicant.stage)}" to "${getStageName(applicant.stage + 1)}". All mandatory checklist items must be complete.`}
        confirmLabel="Advance Stage"
        onConfirm={() => advanceMutation.mutate()}
        loading={advanceMutation.isPending}
      />
    </PageWrapper>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

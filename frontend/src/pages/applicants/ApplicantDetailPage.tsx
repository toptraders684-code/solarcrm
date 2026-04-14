import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StageProgressBar } from './components/StageProgressBar';
import { DocumentsTab } from './components/DocumentsTab';
import { ChecklistTab } from './components/ChecklistTab';
import { FinanceTab } from './components/FinanceTab';
import { DiscomTab } from './components/DiscomTab';
import { ProcurementTab } from './components/ProcurementTab';
import { EditApplicantSheet } from './components/EditApplicantSheet';
import { applicantsService } from '@/services/applicants.service';
import { formatDate, getStageName, toTitleCase, formatCapacity } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-container-low last:border-0">
      <span className="text-xs text-on-surface-variant/60 font-medium flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-on-surface text-right">{children ?? '—'}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6">
      <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50 mb-4">{title}</h4>
      {children}
    </div>
  );
}

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
          <Button variant="secondary" size="sm" onClick={() => navigate('/applicants')}>
            <ArrowLeft size={14} />Back
          </Button>
          {canEdit && (
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil size={14} />Edit Details
            </Button>
          )}
          {canAdvance && (
            <Button size="sm" onClick={() => setAdvanceOpen(true)}>
              <ChevronRight size={14} />Advance Stage
            </Button>
          )}
        </div>
      }
    >
      {/* Stage Progress Bar */}
      <StageProgressBar currentStage={applicant.stage} />

      {/* Meta info strip */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-fixed-variant rounded-lg text-xs font-bold uppercase">
          {applicant.discom.toUpperCase()}
        </span>
        <span className="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-lg text-xs font-semibold capitalize">
          {applicant.projectType}
        </span>
        {applicant.systemCapacityKw && (
          <span className="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-lg text-xs font-semibold">
            {formatCapacity(applicant.systemCapacityKw)}
          </span>
        )}
        <span className="text-xs text-on-surface-variant/60">Assigned: {applicant.assignedStaff?.name ?? '—'}</span>
        <span className="text-xs text-on-surface-variant/60">Stage updated: {formatDate(applicant.stageUpdatedAt)}</span>
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
            <SectionCard title="Personal Information">
              <InfoRow label="Date of Birth">{formatDate(applicant.dateOfBirth)}</InfoRow>
              <InfoRow label="Gender">{applicant.gender ? toTitleCase(applicant.gender) : null}</InfoRow>
              <InfoRow label="Email">{applicant.email}</InfoRow>
              <InfoRow label="WhatsApp">{applicant.whatsappNumber}</InfoRow>
              <InfoRow label="Alternate Mobile">{applicant.alternateMobile}</InfoRow>
            </SectionCard>

            <SectionCard title="Address">
              <InfoRow label="House / Plot">{applicant.addressHouse}</InfoRow>
              <InfoRow label="Street">{applicant.addressStreet}</InfoRow>
              <InfoRow label="Village">{applicant.addressVillage}</InfoRow>
              <InfoRow label="District">{applicant.addressDistrict?.name}</InfoRow>
              <InfoRow label="State">{applicant.addressState?.name}</InfoRow>
              <InfoRow label="Pincode">{applicant.addressPincode}</InfoRow>
              {applicant.gpsLatitude && (
                <InfoRow label="GPS">{applicant.gpsLatitude}, {applicant.gpsLongitude}</InfoRow>
              )}
            </SectionCard>

            <SectionCard title="Installation Details">
              <InfoRow label="System Capacity">{formatCapacity(applicant.systemCapacityKw)}</InfoRow>
              <InfoRow label="Sanctioned Load">{formatCapacity(applicant.sanctionedLoadKw)}</InfoRow>
              <InfoRow label="Roof Type">{applicant.roofType ? toTitleCase(applicant.roofType) : null}</InfoRow>
              <InfoRow label="Consumer No.">{applicant.existingConsumerNo}</InfoRow>
              <InfoRow label="DISCOM Ref No.">{applicant.discomRefNo}</InfoRow>
            </SectionCard>

            <SectionCard title="Survey Information">
              <InfoRow label="Survey Date">{formatDate(applicant.surveyDate)}</InfoRow>
              <InfoRow label="Surveyed By">{applicant.surveyedBy}</InfoRow>
              <InfoRow label="Roof Area">{applicant.roofAreaSqft ? `${applicant.roofAreaSqft} sqft` : null}</InfoRow>
              <InfoRow label="Recommended Capacity">{formatCapacity(applicant.recommendedCapacityKw)}</InfoRow>
              {applicant.shadowAnalysis && (
                <InfoRow label="Shadow Analysis">{applicant.shadowAnalysis}</InfoRow>
              )}
            </SectionCard>

            <SectionCard title="DISCOM Application">
              <InfoRow label="Portal Application">{formatDate(applicant.portalApplicationDate)}</InfoRow>
              <InfoRow label="JE Name">{applicant.jeName}</InfoRow>
              <InfoRow label="JE Contact">{applicant.jeContact}</InfoRow>
              <InfoRow label="MRT Date">{formatDate(applicant.mrtDate)}</InfoRow>
              <InfoRow label="Inspection Date">{formatDate(applicant.inspectionDate)}</InfoRow>
              <InfoRow label="Inspection Result">{applicant.inspectionResult ? toTitleCase(applicant.inspectionResult) : null}</InfoRow>
              <InfoRow label="Net Meter S/N">{applicant.netMeterSerialNo}</InfoRow>
            </SectionCard>

            <SectionCard title="Finance Details">
              <InfoRow label="Finance Mode">{applicant.financeMode ? toTitleCase(applicant.financeMode) : null}</InfoRow>
              <InfoRow label="Bank Name">{applicant.bankName}</InfoRow>
              <InfoRow label="Loan Amount">{applicant.loanAmount ? `₹${applicant.loanAmount}` : null}</InfoRow>
              <InfoRow label="Loan Sanctioned">{formatDate(applicant.loanSanctionedDate)}</InfoRow>
              <InfoRow label="Overpayment Rule">{toTitleCase(applicant.overpaymentRule)}</InfoRow>
            </SectionCard>
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

      <EditApplicantSheet open={editOpen} onOpenChange={setEditOpen} applicant={applicant} />

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

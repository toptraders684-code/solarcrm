import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, MapPin, Calendar, Zap, RefreshCw, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { leadsService } from '@/services/leads.service';
import { formatDate, formatMobile, getDiscomLabel, toTitleCase } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

const OUTCOME_TYPES = [
  'contacted', 'not_reachable', 'meeting_scheduled', 'site_visit_done', 'document_collected', 'other',
];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [followupOpen, setFollowupOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [outcomeType, setOutcomeType] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [closureReason, setClosureReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsService.getLead(id!),
    enabled: !!id,
  });

  const lead = data?.data;

  const addFollowupMutation = useMutation({
    mutationFn: () =>
      leadsService.addFollowup(id!, { outcomeType, notes, followUpDate: followUpDate || undefined }),
    onSuccess: () => {
      toast.success('Follow-up added');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      setFollowupOpen(false);
      setOutcomeType('');
      setNotes('');
      setFollowUpDate('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to add follow-up');
    },
  });

  const convertMutation = useMutation({
    mutationFn: () => leadsService.convertLead(id!),
    onSuccess: (res: any) => {
      toast.success('Lead converted to project!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      const applicantId = res?.data?.applicant?.id || res?.applicant?.id || res?.id;
      if (applicantId) {
        navigate(`/applicants/${applicantId}`);
      } else {
        navigate('/applicants');
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to convert lead');
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => leadsService.closeLead(id!, closureReason),
    onSuccess: () => {
      toast.success('Lead closed');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      setCloseOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to close lead');
    },
  });

  if (isLoading) {
    return (
      <PageWrapper title="Lead Details">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageWrapper>
    );
  }

  if (!lead) return null;

  const canEdit = user && ['admin', 'operations_staff', 'field_technician'].includes(user.role);
  const canConvert = canEdit && !['converted', 'closed'].includes(lead.status);
  const canClose = canEdit && !['converted', 'closed'].includes(lead.status);

  return (
    <PageWrapper
      title={lead.customerName}
      subtitle={`Lead Code: ${lead.leadCode}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/leads')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setFollowupOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Follow-up
            </Button>
          )}
          {canConvert && (
            <Button size="sm" onClick={() => setConvertOpen(true)}>
              <Zap className="w-4 h-4 mr-1" />
              Convert to Project
            </Button>
          )}
          {canClose && (
            <Button size="sm" variant="outline" onClick={() => setCloseOpen(true)}>
              Close Lead
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Status"><StatusBadge status={lead.status} /></InfoRow>
              <InfoRow label="DISCOM"><Badge variant="info">{lead.discom.toUpperCase()}</Badge></InfoRow>
              <InfoRow label="Mobile"><span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.mobile}</span></InfoRow>
              {lead.alternateMobile && <InfoRow label="Alt Mobile">{lead.alternateMobile}</InfoRow>}
              <InfoRow label="Project Type">{toTitleCase(lead.projectType)}</InfoRow>
              <InfoRow label="Lead Source">{toTitleCase(lead.leadSource)}</InfoRow>
              {lead.estimatedCapacityKw && <InfoRow label="Est. Capacity">{lead.estimatedCapacityKw} kW</InfoRow>}
              {lead.financePreference && <InfoRow label="Finance">{toTitleCase(lead.financePreference)}</InfoRow>}
              <InfoRow label="Village"><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.addressVillage}</span></InfoRow>
              <InfoRow label="Assigned To">{lead.assignedStaff?.name ?? '—'}</InfoRow>
              {lead.followUpDate && (
                <InfoRow label="Next Follow-up">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(lead.followUpDate)}</span>
                </InfoRow>
              )}
              <InfoRow label="Created">{formatDate(lead.createdAt)}</InfoRow>
              {lead.convertedApplicantId && (
                <InfoRow label="Converted To">
                  <Link to={`/applicants/${lead.convertedApplicantId}`} className="text-brand-600 hover:underline">
                    View Project
                  </Link>
                </InfoRow>
              )}
            </CardContent>
          </Card>

          {/* Follow-ups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Follow-up History</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.followups && lead.followups.length > 0 ? (
                <div className="space-y-3">
                  {[...lead.followups].reverse().map((fu) => (
                    <div key={fu.id} className="flex gap-3 pb-3 border-b last:border-0">
                      <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="text-xs">{toTitleCase(fu.outcomeType)}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(fu.createdAt)}</span>
                        </div>
                        {fu.notes && <p className="text-sm text-gray-700 mt-1">{fu.notes}</p>}
                        {fu.followUpDate && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Next: {formatDate(fu.followUpDate)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">By: {fu.createdBy?.name ?? '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No follow-ups recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side info */}
        <div className="space-y-6">
          {lead.email && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-sm">{lead.email}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Followup Dialog */}
      <Dialog open={followupOpen} onOpenChange={setFollowupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Follow-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Outcome *</Label>
              <Select value={outcomeType} onValueChange={setOutcomeType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOME_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{toTitleCase(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Follow-up notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Next Follow-up Date</Label>
              <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowupOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addFollowupMutation.mutate()}
              disabled={!outcomeType || addFollowupMutation.isPending}
            >
              {addFollowupMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Confirm */}
      <ConfirmDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        title="Convert Lead to Project?"
        description="This will create a new project from this lead. The lead will be marked as Converted."
        confirmLabel="Convert"
        onConfirm={() => convertMutation.mutate()}
        loading={convertMutation.isPending}
      />

      {/* Close Lead Dialog */}
      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Closure Reason *</Label>
            <Select value={closureReason} onValueChange={setClosureReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {['not_interested', 'no_roof_space', 'financial_issue', 'competitor', 'unreachable', 'other'].map((r) => (
                  <SelectItem key={r} value={r}>{toTitleCase(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!closureReason || closeMutation.isPending}
              onClick={() => closeMutation.mutate()}
            >
              {closeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Close Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <div className="font-medium">{children}</div>
    </div>
  );
}

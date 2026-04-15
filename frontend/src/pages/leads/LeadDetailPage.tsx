import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, MapPin, Calendar, Zap, Plus, Pencil, X, Save, History, PhoneCall, PhoneOff, CalendarCheck, FileCheck, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { leadsService } from '@/services/leads.service';
import { usersService } from '@/services/users.service';
import { formatDate, toTitleCase } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

function sv(v: any) { return v || undefined; }

const OUTCOME_TYPES = [
  'contacted', 'not_reachable', 'meeting_scheduled', 'site_visit_done', 'document_collected', 'other',
];

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-1">{label}</p>
      <div className="text-sm font-medium text-on-surface">{children || '—'}</div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

const OUTCOME_ICON: Record<string, React.ComponentType<any>> = {
  contacted:          PhoneCall,
  not_reachable:      PhoneOff,
  meeting_scheduled:  CalendarCheck,
  site_visit_done:    MapPin,
  document_collected: FileCheck,
  other:              MessageCircle,
};

const OUTCOME_TITLE: Record<string, string> = {
  contacted:          'Called — Contacted',
  not_reachable:      'Call Attempt — Not Reachable',
  meeting_scheduled:  'Meeting Scheduled',
  site_visit_done:    'Site Visit Done',
  document_collected: 'Documents Collected',
  other:              'Activity Logged',
};

function formatTimelineDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  if (isToday) return `TODAY, ${time}`;
  if (isYesterday) return `YESTERDAY, ${time}`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase() + `, ${time}`;
}

const PREVIEW_COUNT = 3;

function ActivityTimeline({ followups, canAdd, onAddFollowup }: { followups: any[]; canAdd?: boolean; onAddFollowup?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...followups].reverse();
  const visible = expanded ? sorted : sorted.slice(0, PREVIEW_COUNT);
  const hasMore = sorted.length > PREVIEW_COUNT;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <History size={20} className="text-primary" />
        </div>
        <h3 className="text-lg font-black text-on-surface font-headline flex-1">Activity Timeline</h3>
        {canAdd && onAddFollowup && (
          <button
            onClick={onAddFollowup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all"
          >
            <Plus size={13} />Add
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center mx-auto mb-3">
            <History size={20} className="text-on-surface-variant/30" />
          </div>
          <p className="text-sm text-on-surface-variant/50">No activity recorded yet.</p>
          <p className="text-xs text-on-surface-variant/40 mt-1">Follow-ups will appear here.</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <div className="absolute left-[19px] top-6 bottom-0 w-px bg-surface-container-low" />
            <div className="space-y-0">
              {visible.map((fu: any, idx: number) => {
                const Icon = OUTCOME_ICON[fu.outcomeType] ?? MessageCircle;
                const isFirst = idx === 0;
                return (
                  <div key={fu.id} className="relative flex gap-4 pb-7 last:pb-0">
                    <div className="flex-shrink-0 relative z-10">
                      {isFirst ? (
                        <div className="w-10 h-10 rounded-full border-[3px] border-primary bg-surface-container-lowest flex items-center justify-center shadow-sm">
                          <Icon size={16} className="text-primary" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                          <Icon size={15} className="text-on-surface-variant/60" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1.5">
                      <p className="text-sm font-bold text-on-surface leading-snug">
                        {OUTCOME_TITLE[fu.outcomeType] ?? toTitleCase(fu.outcomeType)}
                      </p>
                      {fu.notes && (
                        <p className="text-sm text-on-surface-variant/70 mt-1 leading-relaxed">"{fu.notes}"</p>
                      )}
                      {fu.followUpDate && (
                        <p className="text-xs text-on-surface-variant/60 mt-1.5 flex items-center gap-1">
                          <Calendar size={10} />
                          <span>Next follow-up: {formatDate(fu.followUpDate)}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wide">
                          {formatTimelineDate(fu.createdAt)}
                        </p>
                        {fu.createdBy?.name && (
                          <p className="text-[10px] text-on-surface-variant/40 uppercase tracking-wide">
                            {fu.createdBy.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-5 pt-4 border-t border-surface-container-low text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors text-center"
            >
              {expanded ? `COLLAPSE HISTORY` : `VIEW FULL HISTORY (${sorted.length - PREVIEW_COUNT} more)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [followupOpen, setFollowupOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [outcomeType, setOutcomeType] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [closureReason, setClosureReason] = useState('');

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const { data, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsService.getLead(id!),
    enabled: !!id,
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: () => usersService.getStaff(),
    enabled: editing,
  });

  const lead = data?.data;

  const startEdit = () => {
    setForm({
      customerName: lead?.customerName ?? '',
      mobile: lead?.mobile ?? '',
      alternateMobile: lead?.alternateMobile ?? '',
      email: lead?.email ?? '',
      discom: lead?.discom ?? '',
      projectType: lead?.projectType ?? '',
      leadSource: lead?.leadSource ?? '',
      estimatedCapacityKw: lead?.estimatedCapacityKw ?? '',
      financePreference: lead?.financePreference ?? '',
      addressVillage: lead?.addressVillage ?? '',
      addressPincode: lead?.addressPincode ?? '',
      assignedStaffId: lead?.assignedStaff?.id ?? '',
      followUpDate: lead?.followUpDate ? lead.followUpDate.slice(0, 10) : '',
    });
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setForm({}); };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = {};
      Object.entries(form).forEach(([k, v]) => { payload[k] = v === '' ? null : v; });
      if (payload.estimatedCapacityKw) payload.estimatedCapacityKw = parseFloat(payload.estimatedCapacityKw);
      return leadsService.updateLead(id!, payload as any);
    },
    onSuccess: () => {
      toast.success('Lead updated');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      cancelEdit();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to update lead'),
  });

  const addFollowupMutation = useMutation({
    mutationFn: () =>
      leadsService.addFollowup(id!, { outcomeType, notes, followUpDate: followUpDate || undefined }),
    onSuccess: () => {
      toast.success('Follow-up added');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      setFollowupOpen(false);
      setOutcomeType(''); setNotes(''); setFollowUpDate('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add follow-up'),
  });

  const convertMutation = useMutation({
    mutationFn: () => leadsService.convertLead(id!),
    onSuccess: (res: any) => {
      toast.success('Lead converted to project!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      const applicantId = res?.data?.applicant?.id || res?.applicant?.id || res?.id;
      if (applicantId) navigate(`/applicants/${applicantId}`);
      else navigate('/applicants');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to convert lead'),
  });

  const closeMutation = useMutation({
    mutationFn: () => leadsService.closeLead(id!, closureReason),
    onSuccess: () => {
      toast.success('Lead closed');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      setCloseOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to close lead'),
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
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => navigate('/leads')}>
            <ArrowLeft size={14} />Back
          </Button>
          {canConvert && (
            <Button size="sm" onClick={() => setConvertOpen(true)}>
              <Zap size={14} />Convert to Project
            </Button>
          )}
          {canClose && (
            <Button size="sm" variant="secondary" onClick={() => setCloseOpen(true)}>
              Close Lead
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Information card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            {/* Card header with inline Edit / Cancel+Save */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">Lead Information</h3>
              {canEdit && (
                editing ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={saveMutation.isPending}>
                      <X size={12} />Cancel
                    </Button>
                    <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
                      <Save size={12} />Save
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" onClick={startEdit}>
                    <Pencil size={12} />Edit
                  </Button>
                )
              )}
            </div>

            {editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <F label="Customer Name *"><Input value={form.customerName ?? ''} onChange={(e) => set('customerName', e.target.value)} /></F>
                </div>
                <F label="Mobile *"><Input maxLength={10} value={form.mobile ?? ''} onChange={(e) => set('mobile', e.target.value)} /></F>
                <F label="Alternate Mobile"><Input maxLength={10} value={form.alternateMobile ?? ''} onChange={(e) => set('alternateMobile', e.target.value)} /></F>
                <div className="md:col-span-2">
                  <F label="Email"><Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} /></F>
                </div>
                <F label="DISCOM">
                  <Select value={sv(form.discom)} onValueChange={(v) => set('discom', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['tpcodl','tpnodl','tpsodl','tpwodl'].map(d => <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </F>
                <F label="Project Type">
                  <Select value={sv(form.projectType)} onValueChange={(v) => set('projectType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </F>
                <F label="Lead Source">
                  <Select value={sv(form.leadSource)} onValueChange={(v) => set('leadSource', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['walk_in','referral','online','camp','channel_partner','other'].map(s => <SelectItem key={s} value={s}>{toTitleCase(s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </F>
                <F label="Finance Preference">
                  <Select value={sv(form.financePreference) ?? 'none'} onValueChange={(v) => set('financePreference', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {['self','govt_bank','private_bank'].map(f => <SelectItem key={f} value={f}>{toTitleCase(f)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </F>
                <F label="Est. Capacity (kW)">
                  <Input type="number" step="0.1" value={form.estimatedCapacityKw ?? ''} onChange={(e) => set('estimatedCapacityKw', e.target.value)} />
                </F>
                <F label="Pincode">
                  <Input maxLength={6} value={form.addressPincode ?? ''} onChange={(e) => set('addressPincode', e.target.value)} />
                </F>
                <div className="md:col-span-2">
                  <F label="Village / Location">
                    <Input value={form.addressVillage ?? ''} onChange={(e) => set('addressVillage', e.target.value)} />
                  </F>
                </div>
                <F label="Assigned Staff">
                  <Select value={sv(form.assignedStaffId)} onValueChange={(v) => set('assignedStaffId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                    <SelectContent>
                      {staffData?.data?.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.role.replace(/_/g, ' ')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </F>
                <F label="Follow Up Date">
                  <Input type="date" value={form.followUpDate ?? ''} onChange={(e) => set('followUpDate', e.target.value)} />
                </F>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5">
                <InfoRow label="Status"><StatusBadge status={lead.status} /></InfoRow>
                <InfoRow label="DISCOM">
                  <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-fixed-variant rounded text-[10px] font-bold uppercase">
                    {lead.discom.toUpperCase()}
                  </span>
                </InfoRow>
                <InfoRow label="Mobile">
                  <span className="flex items-center gap-1"><Phone size={12} className="text-primary" />{lead.mobile}</span>
                </InfoRow>
                {lead.alternateMobile && <InfoRow label="Alt Mobile">{lead.alternateMobile}</InfoRow>}
                <InfoRow label="Project Type">{toTitleCase(lead.projectType)}</InfoRow>
                <InfoRow label="Lead Source">{toTitleCase(lead.leadSource)}</InfoRow>
                {lead.estimatedCapacityKw && <InfoRow label="Est. Capacity">{lead.estimatedCapacityKw} kW</InfoRow>}
                {lead.financePreference && <InfoRow label="Finance">{toTitleCase(lead.financePreference)}</InfoRow>}
                <InfoRow label="Village">
                  <span className="flex items-center gap-1"><MapPin size={12} className="text-primary" />{lead.addressVillage}</span>
                </InfoRow>
                <InfoRow label="Assigned To">{lead.assignedStaff?.name ?? '—'}</InfoRow>
                {lead.followUpDate && (
                  <InfoRow label="Next Follow-up">
                    <span className="flex items-center gap-1"><Calendar size={12} className="text-primary" />{formatDate(lead.followUpDate)}</span>
                  </InfoRow>
                )}
                <InfoRow label="Created">{formatDate(lead.createdAt)}</InfoRow>
                {lead.email && <InfoRow label="Email">{lead.email}</InfoRow>}
                {lead.convertedApplicantId && (
                  <InfoRow label="Converted To">
                    <Link to={`/applicants/${lead.convertedApplicantId}`} className="text-primary hover:underline font-semibold">
                      View Project →
                    </Link>
                  </InfoRow>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline — right column */}
        <div>
          <ActivityTimeline
            followups={lead.followups ?? []}
            canAdd={!!canEdit}
            onAddFollowup={() => setFollowupOpen(true)}
          />
        </div>
      </div>

      {/* Add Followup Dialog */}
      <Dialog open={followupOpen} onOpenChange={setFollowupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Follow-up</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Outcome *</label>
              <Select value={outcomeType} onValueChange={setOutcomeType}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select outcome" /></SelectTrigger>
                <SelectContent>
                  {OUTCOME_TYPES.map((t) => <SelectItem key={t} value={t}>{toTitleCase(t)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Notes</label>
              <Textarea className="mt-1" placeholder="Follow-up notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Next Follow-up Date</label>
              <Input className="mt-1" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setFollowupOpen(false)}>Cancel</Button>
            <Button onClick={() => addFollowupMutation.mutate()} disabled={!outcomeType} loading={addFollowupMutation.isPending}>Save</Button>
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
          <DialogHeader><DialogTitle>Close Lead</DialogTitle></DialogHeader>
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Closure Reason *</label>
            <Select value={closureReason} onValueChange={setClosureReason}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                {['not_interested', 'no_roof_space', 'financial_issue', 'competitor', 'unreachable', 'other'].map((r) => (
                  <SelectItem key={r} value={r}>{toTitleCase(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCloseOpen(false)}>Cancel</Button>
            <Button variant="danger" disabled={!closureReason} loading={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
              Close Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

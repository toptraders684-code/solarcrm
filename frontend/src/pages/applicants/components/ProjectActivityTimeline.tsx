import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, History, Calendar, StickyNote, Phone, MapPin, FileCheck,
  IndianRupee, Package, Wrench, ClipboardCheck, MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { applicantsService } from '@/services/applicants.service';
import { formatDate } from '@/utils/formatters';
import type { ProjectActivity, ProjectActivityType } from '@/types';
import { useAuthStore } from '@/store/authStore';

const ACTIVITY_TYPES: { value: ProjectActivityType; label: string }[] = [
  { value: 'note',                label: 'General Note' },
  { value: 'customer_contacted',  label: 'Customer Contacted' },
  { value: 'site_visit',          label: 'Site Visit' },
  { value: 'document_collected',  label: 'Documents Collected' },
  { value: 'payment_received',    label: 'Payment Received' },
  { value: 'material_delivered',  label: 'Material Delivered' },
  { value: 'installation_update', label: 'Installation Update' },
  { value: 'inspection_done',     label: 'Inspection Done' },
  { value: 'other',               label: 'Other' },
];

const ACTIVITY_ICON: Record<ProjectActivityType, React.ComponentType<any>> = {
  note:                StickyNote,
  customer_contacted:  Phone,
  site_visit:          MapPin,
  document_collected:  FileCheck,
  payment_received:    IndianRupee,
  material_delivered:  Package,
  installation_update: Wrench,
  inspection_done:     ClipboardCheck,
  other:               MessageCircle,
};

const ACTIVITY_TITLE: Record<ProjectActivityType, string> = {
  note:                'Note',
  customer_contacted:  'Customer Contacted',
  site_visit:          'Site Visit Done',
  document_collected:  'Documents Collected',
  payment_received:    'Payment Received',
  material_delivered:  'Material Delivered to Site',
  installation_update: 'Installation Update',
  inspection_done:     'Inspection Done',
  other:               'Activity Logged',
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

const PREVIEW_COUNT = 4;

interface ProjectActivityTimelineProps {
  applicantId: string;
  activities: ProjectActivity[];
}

export function ProjectActivityTimeline({ applicantId, activities }: ProjectActivityTimelineProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canAdd = user && ['admin', 'operations_staff', 'field_technician'].includes(user.role);

  const [addOpen, setAddOpen] = useState(false);
  const [activityType, setActivityType] = useState<ProjectActivityType | ''>('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [expanded, setExpanded] = useState(false);

  const sorted = [...activities].reverse();
  const visible = expanded ? sorted : sorted.slice(0, PREVIEW_COUNT);
  const hasMore = sorted.length > PREVIEW_COUNT;

  const addMutation = useMutation({
    mutationFn: () =>
      applicantsService.addActivity(applicantId, {
        activityType,
        notes: notes || undefined,
        followUpDate: followUpDate || undefined,
      }),
    onSuccess: () => {
      toast.success('Activity added');
      queryClient.invalidateQueries({ queryKey: ['applicant', applicantId] });
      setAddOpen(false);
      setActivityType('');
      setNotes('');
      setFollowUpDate('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add activity'),
  });

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <History size={20} className="text-primary" />
        </div>
        <h3 className="text-lg font-black text-on-surface font-headline flex-1">Activity Timeline</h3>
        {canAdd && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all"
          >
            <Plus size={13} />Add
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center mx-auto mb-3">
            <History size={20} className="text-on-surface-variant/30" />
          </div>
          <p className="text-sm text-on-surface-variant/50">No activity recorded yet.</p>
          {canAdd && <p className="text-xs text-on-surface-variant/40 mt-1">Click "Add" to log the first activity.</p>}
        </div>
      ) : (
        <>
          <div className="relative">
            <div className="absolute left-[19px] top-6 bottom-0 w-px bg-surface-container-low" />
            <div className="space-y-0">
              {visible.map((activity, idx) => {
                const type = activity.activityType as ProjectActivityType;
                const Icon = ACTIVITY_ICON[type] ?? MessageCircle;
                const isFirst = idx === 0;
                return (
                  <div key={activity.id} className="relative flex gap-4 pb-7 last:pb-0">
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
                        {ACTIVITY_TITLE[type] ?? type}
                      </p>
                      {activity.notes && (
                        <p className="text-sm text-on-surface-variant/70 mt-1 leading-relaxed">"{activity.notes}"</p>
                      )}
                      {activity.followUpDate && (
                        <p className="text-xs text-on-surface-variant/60 mt-1.5 flex items-center gap-1">
                          <Calendar size={10} />
                          <span>Follow-up: {formatDate(activity.followUpDate)}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wide">
                          {formatTimelineDate(activity.createdAt)}
                        </p>
                        {activity.createdBy?.name && (
                          <p className="text-[10px] text-on-surface-variant/40 uppercase tracking-wide">
                            {activity.createdBy.name}
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
              {expanded
                ? 'COLLAPSE HISTORY'
                : `VIEW FULL HISTORY (${sorted.length - PREVIEW_COUNT} more)`}
            </button>
          )}
        </>
      )}

      {/* Add Activity Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Activity Type *</label>
              <Select value={activityType} onValueChange={(v) => setActivityType(v as ProjectActivityType)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select activity type" /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Notes</label>
              <Textarea
                className="mt-1"
                placeholder="Add details about this activity..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Follow-up Date</label>
              <Input
                className="mt-1"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              disabled={!activityType}
              loading={addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              Save Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

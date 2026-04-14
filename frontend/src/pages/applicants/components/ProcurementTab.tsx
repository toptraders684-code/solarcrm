import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronRight, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { applicantsService } from '@/services/applicants.service';
import { vendorsService } from '@/services/vendors.service';
import { getStageName } from '@/utils/formatters';
import type { Applicant, ApplicantVendor } from '@/types';
import { useAuthStore } from '@/store/authStore';

const VENDOR_TYPE_LABELS: Record<string, string> = {
  material_supplier: 'Material Supplier',
  labour_installer: 'Labour / Installer',
  transport_logistics: 'Transport / Logistics',
};

const CATEGORY_LABELS = [
  'Panel Supplier', 'Inverter Supplier', 'Cable & BOS', 'Structure Fabricator',
  'Civil Work', 'Electrical Work', 'Transport', 'Other',
];

interface ProcurementTabProps { applicant: Applicant; }

export function ProcurementTab({ applicant }: ProcurementTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [assignOpen, setAssignOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ApplicantVendor | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const canEdit = user && ['admin', 'operations_staff'].includes(user.role);
  const assignedVendors: ApplicantVendor[] = applicant.applicantVendors ?? [];

  const { data: vendorListData } = useQuery({
    queryKey: ['vendors-all'],
    queryFn: () => vendorsService.getVendors({ limit: 200 }),
    enabled: assignOpen,
  });
  const allVendors = vendorListData?.data ?? [];
  const assignedIds = new Set(assignedVendors.map((av) => av.vendorId));
  const availableVendors = allVendors.filter((v) => !assignedIds.has(v.id) && v.isActive);

  const assignMutation = useMutation({
    mutationFn: () => applicantsService.assignVendor(applicant.id, selectedVendorId, categoryLabel || undefined, isPrimary),
    onSuccess: () => {
      toast.success('Vendor assigned');
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      setAssignOpen(false); setSelectedVendorId(''); setCategoryLabel(''); setIsPrimary(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed to assign vendor'),
  });

  const removeMutation = useMutation({
    mutationFn: (vendorId: string) => applicantsService.removeVendor(applicant.id, vendorId),
    onSuccess: () => {
      toast.success('Vendor removed');
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      setRemoveTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed to remove vendor'),
  });

  const advanceMutation = useMutation({
    mutationFn: () => applicantsService.advanceStage(applicant.id),
    onSuccess: () => {
      toast.success(`Advanced to: ${getStageName(applicant.stage + 1)}`);
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      setAdvanceOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Cannot advance — check mandatory checklist items');
      setAdvanceOpen(false);
    },
  });

  return (
    <div className="space-y-4">
      {/* Stage action panel for stage 8 */}
      {applicant.stage === 8 && canEdit && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold uppercase mb-2 inline-block">
                Stage 8 — Material Procurement
              </span>
              <p className="text-sm text-on-surface font-medium">Has all material been procured and dispatched to site?</p>
              {assignedVendors.length === 0 && (
                <p className="text-xs text-on-surface-variant/60 mt-1">No vendors assigned yet — assign at least one before advancing</p>
              )}
            </div>
            <Button size="sm" onClick={() => setAdvanceOpen(true)} disabled={advanceMutation.isPending} className="shrink-0">
              <ChevronRight size={14} />Mark Installation Started (→ Stage 9)
            </Button>
          </div>
        </div>
      )}

      {/* Assigned Vendors */}
      <div className="bg-surface-container-lowest rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">Assigned Vendors / Contractors</h4>
          {canEdit && (
            <Button size="sm" variant="secondary" onClick={() => setAssignOpen(true)}>
              <Plus size={12} />Assign Vendor
            </Button>
          )}
        </div>

        {assignedVendors.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center mx-auto mb-3">
              <Package size={22} className="text-on-surface-variant/30" />
            </div>
            <p className="text-sm text-on-surface-variant/50">No vendors assigned yet.</p>
            {canEdit && <p className="text-xs text-on-surface-variant/40 mt-1">Click "Assign Vendor" to add a supplier or contractor.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {assignedVendors.map((av) => (
              <div key={av.id} className="flex items-start justify-between gap-3 p-4 bg-surface-container-low/50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-on-surface">{av.vendor.businessName}</span>
                    {av.isPrimary && <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-bold uppercase">Primary</span>}
                    {av.categoryLabel && <span className="px-1.5 py-0.5 bg-surface-container text-on-surface-variant rounded text-[9px] font-bold">{av.categoryLabel}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {av.vendor.vendorTypes?.map((t: string) => (
                      <span key={t} className="px-1.5 py-0.5 bg-secondary-container text-on-secondary-fixed-variant rounded text-[9px] font-bold uppercase">
                        {VENDOR_TYPE_LABELS[t] ?? t}
                      </span>
                    ))}
                  </div>
                  {av.vendor.contactPerson && <p className="text-xs text-on-surface-variant/60">Contact: {av.vendor.contactPerson}</p>}
                  {av.vendor.mobile && <p className="text-xs text-on-surface-variant/60">Mobile: {av.vendor.mobile}</p>}
                </div>
                {canEdit && (
                  <button
                    onClick={() => setRemoveTarget(av)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant/40 hover:text-error hover:bg-error/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Vendor Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Vendor to Project</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Vendor *</label>
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                <SelectContent>
                  {availableVendors.length === 0 && <SelectItem value="__none" disabled>No vendors available</SelectItem>}
                  {availableVendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.businessName}
                      {v.vendorTypes?.length > 0 && (
                        <span className="text-on-surface-variant ml-1 text-xs">— {v.vendorTypes.map((t: string) => VENDOR_TYPE_LABELS[t] ?? t).join(', ')}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Category / Role</label>
              <Select value={categoryLabel} onValueChange={setCategoryLabel}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category (optional)" /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_LABELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Custom Category (if not in list)</label>
              <Input
                className="mt-1"
                value={CATEGORY_LABELS.includes(categoryLabel) ? '' : categoryLabel}
                placeholder="e.g. Rooftop Contractor"
                onChange={(e) => setCategoryLabel(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPrimary" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="rounded" />
              <label htmlFor="isPrimary" className="text-sm cursor-pointer font-medium text-on-surface">Mark as Primary Contractor</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button disabled={!selectedVendorId} loading={assignMutation.isPending} onClick={() => assignMutation.mutate()}>Assign Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(v) => { if (!v) setRemoveTarget(null); }}
        title="Remove Vendor?"
        description={`Remove ${removeTarget?.vendor.businessName} from this project?`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget.vendorId)}
        loading={removeMutation.isPending}
      />

      <ConfirmDialog
        open={advanceOpen}
        onOpenChange={setAdvanceOpen}
        title="Mark Installation Started?"
        description="This will advance the project to Stage 9 (Installation Done). All mandatory checklist items must be complete."
        confirmLabel="Advance to Stage 9"
        onConfirm={() => advanceMutation.mutate()}
        loading={advanceMutation.isPending}
      />
    </div>
  );
}

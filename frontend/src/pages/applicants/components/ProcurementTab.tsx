import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronRight, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  'Panel Supplier',
  'Inverter Supplier',
  'Cable & BOS',
  'Structure Fabricator',
  'Civil Work',
  'Electrical Work',
  'Transport',
  'Other',
];

interface ProcurementTabProps {
  applicant: Applicant;
}

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
      setAssignOpen(false);
      setSelectedVendorId('');
      setCategoryLabel('');
      setIsPrimary(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || 'Failed to assign vendor');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (vendorId: string) => applicantsService.removeVendor(applicant.id, vendorId),
    onSuccess: () => {
      toast.success('Vendor removed');
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      setRemoveTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || 'Failed to remove vendor');
    },
  });

  const advanceMutation = useMutation({
    mutationFn: () => applicantsService.advanceStage(applicant.id),
    onSuccess: () => {
      toast.success(`Advanced to: ${getStageName(applicant.stage + 1)}`);
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      setAdvanceOpen(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || 'Cannot advance — check mandatory checklist items';
      toast.error(msg);
      setAdvanceOpen(false);
    },
  });

  return (
    <div className="space-y-4">

      {/* Stage action panel for stage 8 */}
      {applicant.stage === 8 && canEdit && (
        <Card className="border-brand-200 bg-brand-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <Badge variant="info" className="text-xs mb-1">Stage 8 — Material Procurement</Badge>
                <p className="text-sm text-brand-800 font-medium">
                  Has all material been procured and dispatched to site?
                </p>
                {assignedVendors.length === 0 && (
                  <p className="text-xs text-amber-700 mt-1">⚠ No vendors assigned yet — assign at least one before advancing</p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => setAdvanceOpen(true)}
                disabled={advanceMutation.isPending}
                className="shrink-0"
              >
                <ChevronRight className="w-4 h-4 mr-1" />
                Mark Installation Started (→ Stage 9)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Vendors card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm">Assigned Vendors / Contractors</CardTitle>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Assign Vendor
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {assignedVendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No vendors assigned yet.
              {canEdit && <p className="mt-1">Click "Assign Vendor" to add a supplier or contractor.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {assignedVendors.map((av) => (
                <div key={av.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-white">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{av.vendor.businessName}</span>
                      {av.isPrimary && <Badge variant="success" className="text-xs">Primary</Badge>}
                      {av.categoryLabel && <Badge variant="secondary" className="text-xs">{av.categoryLabel}</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {av.vendor.vendorTypes?.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">{VENDOR_TYPE_LABELS[t] ?? t}</Badge>
                      ))}
                    </div>
                    {av.vendor.contactPerson && (
                      <p className="text-xs text-muted-foreground">Contact: {av.vendor.contactPerson}</p>
                    )}
                    {av.vendor.mobile && (
                      <p className="text-xs text-muted-foreground">Mobile: {av.vendor.mobile}</p>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => setRemoveTarget(av)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Vendor Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Vendor to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vendor *</Label>
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {availableVendors.length === 0 && (
                    <SelectItem value="__none" disabled>No vendors available</SelectItem>
                  )}
                  {availableVendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.businessName}
                      {v.vendorTypes?.length > 0 && (
                        <span className="text-muted-foreground ml-1 text-xs">
                          — {v.vendorTypes.map((t) => VENDOR_TYPE_LABELS[t] ?? t).join(', ')}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category / Role</Label>
              <Select value={categoryLabel} onValueChange={setCategoryLabel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_LABELS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Custom Category (if not in list)</Label>
              <Input
                value={CATEGORY_LABELS.includes(categoryLabel) ? '' : categoryLabel}
                placeholder="e.g. Rooftop Contractor"
                onChange={(e) => setCategoryLabel(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isPrimary" className="text-sm cursor-pointer">Mark as Primary Contractor</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedVendorId || assignMutation.isPending}
              onClick={() => assignMutation.mutate()}
            >
              {assignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirm */}
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(v) => { if (!v) setRemoveTarget(null); }}
        title="Remove Vendor?"
        description={`Remove ${removeTarget?.vendor.businessName} from this project?`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget.vendorId)}
        loading={removeMutation.isPending}
      />

      {/* Advance stage confirm */}
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

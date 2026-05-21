import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { applicantsService } from '@/services/applicants.service';
import type { Applicant } from '@/types';
import { useAuthStore } from '@/store/authStore';

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-surface-container-low last:border-0">
      <span className="text-xs text-on-surface-variant/60 font-medium">{label}</span>
      <span className="text-sm font-semibold text-on-surface text-right">{children || '—'}</span>
    </div>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const req = label.endsWith(' *');
  const text = req ? label.slice(0, -2) : label;
  return (
    <div>
      <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
        {text}{req && <span className="text-error"> *</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-[10px] text-error font-semibold">{error}</p>}
    </div>
  );
}

function fmt(val: number | undefined | null): string {
  if (val == null) return '—';
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(val: number | undefined | null): string {
  if (val == null) return '—';
  return `${Number(val)}%`;
}

interface InvoiceTabProps { applicant: Applicant; }

export function InvoiceTab({ applicant }: InvoiceTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const canEdit = user && ['admin', 'operations_staff'].includes(user.role);

  const set = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const touch = (key: string, val: any) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const fieldClass = (key: string) => {
    if (errors[key]) return 'border-error';
    if (touched[key] && form[key] !== '' && form[key] !== null && form[key] !== undefined) return 'border-primary';
    return '';
  };

  const startEdit = () => {
    setForm({
      invoiceNo: applicant.invoiceNo ?? '',
      solarRate: applicant.solarRate ?? '',
      solarGst: applicant.solarGst ?? '',
      installationRate: applicant.installationRate ?? '',
      installationGst: applicant.installationGst ?? '',
    });
    setErrors({});
    setTouched({});
    setIsEditing(true);
  };

  const cancelEdit = () => { setIsEditing(false); setForm({}); setErrors({}); setTouched({}); };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = {};
      Object.entries(form).forEach(([k, v]) => { payload[k] = v === '' ? null : v; });
      return applicantsService.updateApplicant(applicant.id, payload as any);
    },
    onSuccess: () => {
      toast.success('Invoice details saved');
      queryClient.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      cancelEdit();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to save');
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-surface-container-lowest rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">Invoice Details</h4>
          {canEdit && (
            isEditing ? (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={saveMutation.isPending}><X size={12} />Cancel</Button>
                <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}><Save size={12} />Save</Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={startEdit}><Pencil size={12} />Edit</Button>
            )
          )}
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <F label="Invoice No">
                <Input value={form.invoiceNo ?? ''} onChange={(e) => set('invoiceNo', e.target.value)} onBlur={(e) => touch('invoiceNo', e.target.value)} placeholder="e.g. INV-2024-001" className={fieldClass('invoiceNo')} />
              </F>
            </div>
            <F label="SOLAR Rate (₹)">
              <Input type="number" min={0} step={0.01} value={form.solarRate ?? ''} onChange={(e) => set('solarRate', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('solarRate', e.target.value)} placeholder="e.g. 35000" className={fieldClass('solarRate')} />
            </F>
            <F label="SOLAR GST (%)">
              <Input type="number" min={0} max={100} step={0.01} value={form.solarGst ?? ''} onChange={(e) => set('solarGst', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('solarGst', e.target.value)} placeholder="e.g. 12" className={fieldClass('solarGst')} />
            </F>
            <F label="Installation Rate (₹)">
              <Input type="number" min={0} step={0.01} value={form.installationRate ?? ''} onChange={(e) => set('installationRate', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('installationRate', e.target.value)} placeholder="e.g. 5000" className={fieldClass('installationRate')} />
            </F>
            <F label="Installation GST (%)">
              <Input type="number" min={0} max={100} step={0.01} value={form.installationGst ?? ''} onChange={(e) => set('installationGst', e.target.value ? Number(e.target.value) : '')} onBlur={(e) => touch('installationGst', e.target.value)} placeholder="e.g. 18" className={fieldClass('installationGst')} />
            </F>
            <div className="md:col-span-2">
              <div className="rounded-lg bg-surface-container p-3 text-xs text-on-surface-variant/70">
                <span className="font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Project Cost (Contract Amount)</span>
                <p className="mt-1 text-sm font-semibold text-on-surface">{fmt(applicant.contractAmount)}</p>
                <p className="text-[10px] mt-0.5">Edit from Finance Details in the Details tab</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow label="Invoice No">{applicant.invoiceNo}</InfoRow>
            <InfoRow label="SOLAR Rate">{fmt(applicant.solarRate)}</InfoRow>
            <InfoRow label="SOLAR GST">{fmtPct(applicant.solarGst)}</InfoRow>
            <InfoRow label="Installation Rate">{fmt(applicant.installationRate)}</InfoRow>
            <InfoRow label="Installation GST">{fmtPct(applicant.installationGst)}</InfoRow>
            <InfoRow label="Project Cost (Contract Amount)">
              {applicant.contractAmount
                ? <span className="text-primary font-bold">{fmt(applicant.contractAmount)}</span>
                : null}
            </InfoRow>
          </div>
        )}
      </div>
    </div>
  );
}

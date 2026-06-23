import { format, parseISO, isValid } from 'date-fns';

export function formatDate(date?: string | null, fmt = 'dd MMM yyyy'): string {
  if (!date) return '—';
  try {
    const d = parseISO(date);
    return isValid(d) ? format(d, fmt) : '—';
  } catch {
    return '—';
  }
}

export function formatDateTime(date?: string | null): string {
  return formatDate(date, 'dd MMM yyyy, hh:mm a');
}

export function formatCurrency(amount?: number | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCapacity(kw?: number | null): string {
  if (kw == null) return '—';
  return `${kw} kW`;
}

export function maskAadhaar(aadhaar?: string | null): string {
  if (!aadhaar) return '—';
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
}

export function maskPan(pan?: string | null): string {
  if (!pan) return '—';
  return `XXXXX${pan.slice(-5)}`;
}

export function maskBankAccount(account?: string | null): string {
  if (!account) return '—';
  return `XXXXXXXX${account.slice(-4)}`;
}

export function formatMobile(mobile?: string | null): string {
  if (!mobile) return '—';
  return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
}

export function toTitleCase(str?: string | null): string {
  if (!str) return '—';
  return str
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const STAGE_LABELS: Record<number, string> = {
  1: 'Lead Generation & Information Collection',
  2: 'Project Onboarding',
  3: 'Financing',
  4: 'Advance Payment Collection',
  5: 'DISCUM Document Verification',
  6: 'Material Installation',
  7: 'Inspection & DCR',
  8: 'Net Meter Approval',
  9: 'Final Payment Release',
  10: 'Customer Settlement & Handover',
  11: 'Subsidy Release',
  12: 'Maintenance',
};

export function getStageName(stage: number): string {
  return STAGE_LABELS[stage] || `Stage ${stage}`;
}

export const DISCOM_LABELS: Record<string, string> = {
  tpcodl: 'TPCODL (Central)',
  tpnodl: 'TPNODL (North)',
  tpsodl: 'TPSODL (South)',
  tpwodl: 'TPWODL (West)',
};

export function getDiscomLabel(discom?: string): string {
  return discom ? (DISCOM_LABELS[discom] ?? discom.toUpperCase()) : '—';
}

export function fileSizeLabel(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

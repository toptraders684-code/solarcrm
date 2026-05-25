import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import {
  Users, FileText, DollarSign, Clock, TrendingUp, Zap,
  ChevronDown, BarChart2, MapPin, Award, Layers, Download, FileDown,
} from 'lucide-react';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionItem, AccordionContent } from '@/components/ui/accordion';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { formatCurrency, STAGE_LABELS } from '@/utils/formatters';
import type { DashboardStats } from '@/types';

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  title, value, icon: Icon, description, accent = false,
}: {
  title: string; value: string | number; icon: React.ComponentType<any>; description?: string; accent?: boolean;
}) {
  return (
    <div className={`bg-surface-container-lowest p-6 rounded-xl ${accent ? 'ring-2 ring-primary/20' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-black text-on-surface mt-2 font-headline">{value}</p>
          {description && <p className="text-xs text-on-surface-variant/60 mt-1">{description}</p>}
        </div>
        <div className="w-12 h-12 signature-gradient rounded-xl flex items-center justify-center shadow-md">
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

// ── Accordion section header ──────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, label, description, iconBg,
}: {
  icon: React.ComponentType<any>; label: string; description: string; iconBg: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="text-left">
        <p className="text-sm font-bold text-on-surface">{label}</p>
        <p className="text-xs text-on-surface-variant/50 font-normal">{description}</p>
      </div>
    </div>
  );
}

// ── Generic report table ──────────────────────────────────────────────────────

type ColDef = {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render?: (val: any, row: any, idx: number) => React.ReactNode;
};

function ReportTable({
  id, columns, rows, headerBg,
}: {
  id: string; columns: ColDef[]; rows: Record<string, any>[]; headerBg: string;
}) {
  if (!rows.length) {
    return <p className="text-sm text-on-surface-variant/50 py-6 text-center">No data available</p>;
  }
  return (
    <div id={id} className="overflow-x-auto rounded-xl border border-surface-container-low">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className={headerBg}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-white font-bold text-xs uppercase tracking-wider text-${col.align ?? 'left'}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b border-surface-container-low last:border-b-0 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-container-lowest/60'}`}>
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-${col.align ?? 'left'}`}>
                  {col.render ? col.render(row[col.key], row, i) : (
                    <span className={col.align === 'right' ? 'font-bold text-on-surface tabular-nums' : 'text-on-surface-variant'}>
                      {row[col.key] ?? '—'}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Export helpers ────────────────────────────────────────────────────────────

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(v => `"${String(v ?? '')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadXls(filename: string, headers: string[], rows: (string | number)[][]) {
  const headerRow = `<tr>${headers.map(h => `<th><b>${h}</b></th>`).join('')}</tr>`;
  const bodyRows = rows.map(r => `<tr>${r.map(v => `<td>${String(v ?? '')}</td>`).join('')}</tr>`).join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table>${headerRow}${bodyRows}</table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportToPdf(elementId: string, filename: string) {
  // @ts-ignore
  const html2pdf = (await import('html2pdf.js')).default;
  const el = document.getElementById(elementId);
  if (!el) return;
  html2pdf()
    .set({
      margin: 10,
      filename: `${filename}.pdf`,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    })
    .from(el)
    .save();
}

// ── Export button pair ────────────────────────────────────────────────────────

function ExportButtons({
  onCsv, onXls, onPdf, borderColor, textColor,
}: {
  onCsv: () => void; onXls: () => void; onPdf: () => void; borderColor: string; textColor: string;
}) {
  const btnCls = `flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border ${borderColor} ${textColor} hover:opacity-70 transition-opacity`;
  return (
    <div
      className="flex items-center gap-1.5 pr-2 shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={onCsv} className={btnCls}>
        <Download size={11} /> CSV
      </button>
      <button type="button" onClick={onXls} className={btnCls}>
        <FileDown size={11} /> XLS
      </button>
      <button type="button" onClick={onPdf} className={btnCls}>
        <FileDown size={11} /> PDF
      </button>
    </div>
  );
}

// ── Lead status config ────────────────────────────────────────────────────────

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  converted: 'bg-emerald-500',
  closed: 'bg-red-400',
};
const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'New', in_progress: 'In Progress', converted: 'Converted', closed: 'Closed',
};

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [openSections, setOpenSections] = useState<string[]>([]);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard');
      return data;
    },
    retry: false,
    placeholderData: {
      totalLeads: 0, activeApplicants: 0, pendingApprovals: 0,
      monthlyRevenue: 0, leadsThisMonth: 0, conversionRate: 0, stageWiseCount: {},
    },
  });

  // ── Report queries (lazy — only when accordion opened) ──────────────────────

  const { data: leadSummaryRaw, isLoading: leadLoading } = useQuery({
    queryKey: ['report-lead-summary'],
    queryFn: () => api.get('/reports/generate?reportType=lead_summary').then(r => r.data.data ?? []),
    enabled: isAdmin && openSections.includes('leads'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: stageAgingRaw, isLoading: stageLoading } = useQuery({
    queryKey: ['report-stage-aging'],
    queryFn: () => api.get('/reports/generate?reportType=stage_aging').then(r => r.data.data ?? []),
    enabled: isAdmin && openSections.includes('pipeline'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: staffRaw, isLoading: staffLoading } = useQuery({
    queryKey: ['report-staff-performance'],
    queryFn: () => api.get('/reports/generate?reportType=staff_performance').then(r => r.data.data ?? []),
    enabled: isAdmin && openSections.includes('team'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: discomRaw, isLoading: discomLoading } = useQuery({
    queryKey: ['report-discom-wise'],
    queryFn: () => api.get('/reports/generate?reportType=discom_wise').then(r => r.data.data ?? []),
    enabled: isAdmin && openSections.includes('discom'),
    staleTime: 5 * 60 * 1000,
  });

  // ── Derived table rows ──────────────────────────────────────────────────────

  const leadByStatus: Record<string, number> = {};
  for (const row of (leadSummaryRaw ?? [])) {
    leadByStatus[row.status] = (leadByStatus[row.status] ?? 0) + (row.count as number);
  }

  const leadTableRows = ['new', 'in_progress', 'converted', 'closed'].map((s) => ({
    statusKey: s, count: leadByStatus[s] ?? 0,
  }));

  const pipelineTableRows = (stageAgingRaw ?? []).map((r: any) => ({
    stageNum: r.stage,
    stageName: STAGE_LABELS[String(r.stage)] ?? `Stage ${r.stage}`,
    projects: r.count,
    oldestDays: r.oldestDays ?? null,
  }));

  const teamTableRows = (staffRaw ?? []).slice(0, 25).map((r: any, i: number) => ({
    rank: i + 1,
    name: r.staff,
    leads: r.leads,
    projects: r.projects,
    total: r.leads + r.projects,
  }));

  const discomTableRows = (discomRaw ?? []).slice(0, 25).map((r: any) => ({
    discom: r.discom,
    leads: r.leads,
    projects: r.projects,
    total: r.leads + r.projects,
  }));

  // ── Column definitions ──────────────────────────────────────────────────────

  const leadCols: ColDef[] = [
    {
      key: 'statusKey', label: 'Status',
      render: (val: string) => (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${LEAD_STATUS_COLORS[val] ?? 'bg-gray-400'}`}>
          {LEAD_STATUS_LABELS[val] ?? val}
        </span>
      ),
    },
    { key: 'count', label: 'Count', align: 'right' },
  ];

  const pipelineCols: ColDef[] = [
    {
      key: 'stageNum', label: '#', align: 'center',
      render: (val: number) => (
        <span className="inline-flex w-7 h-7 rounded-full signature-gradient items-center justify-center text-white text-xs font-black">
          {val}
        </span>
      ),
    },
    { key: 'stageName', label: 'Stage Name' },
    { key: 'projects', label: 'Projects', align: 'right' },
    {
      key: 'oldestDays', label: 'Oldest (days)', align: 'right',
      render: (val: number | null) => (
        <span className={`font-bold tabular-nums ${val != null && val > 30 ? 'text-red-500' : 'text-on-surface'}`}>
          {val ?? '—'}
        </span>
      ),
    },
  ];

  const teamCols: ColDef[] = [
    {
      key: 'rank', label: '#', align: 'center',
      render: (val: number) => {
        const medal = val === 1 ? 'bg-amber-400' : val === 2 ? 'bg-slate-400' : val === 3 ? 'bg-orange-400' : 'bg-surface-container';
        const text = val <= 3 ? 'text-white' : 'text-on-surface-variant';
        return (
          <span className={`inline-flex w-7 h-7 rounded-full ${medal} ${text} items-center justify-center text-xs font-black`}>
            {val}
          </span>
        );
      },
    },
    { key: 'name', label: 'Staff Name' },
    { key: 'leads', label: 'Leads', align: 'right' },
    { key: 'projects', label: 'Projects', align: 'right' },
    { key: 'total', label: 'Total', align: 'right' },
  ];

  const discomCols: ColDef[] = [
    { key: 'discom', label: 'DISCOM' },
    { key: 'leads', label: 'Leads', align: 'right' },
    { key: 'projects', label: 'Projects', align: 'right' },
    { key: 'total', label: 'Total', align: 'right' },
  ];

  // ── Stage-wise count for "Projects by Stage" panel ─────────────────────────
  const stageEntries = Object.entries(STAGE_LABELS).filter(
    ([stageNum]) => (stats?.stageWiseCount?.[stageNum] ?? 0) > 0,
  );

  return (
    <PageWrapper
      title={`Welcome, ${user?.name?.split(' ')[0] ?? 'there'}!`}
      subtitle="Here's what's happening with your projects today."
    >
      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Leads" value={stats?.totalLeads ?? 0} icon={FileText} description={`${stats?.leadsThisMonth ?? 0} this month`} />
          <StatCard title="Active Projects" value={stats?.activeApplicants ?? 0} icon={Users} description="In pipeline" />
          <StatCard title="Pending Approvals" value={stats?.pendingApprovals ?? 0} icon={Clock} description="Finance queue" />
          <StatCard title="Monthly Revenue" value={formatCurrency(stats?.monthlyRevenue)} icon={DollarSign} description="Received this month" accent />
        </div>
      )}

      {/* ── 2-col panels ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-container-low">
            <h2 className="text-lg font-bold flex items-center gap-2 font-headline">
              <Zap className="text-primary" size={20} />
              Projects by Stage
            </h2>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : stageEntries.length === 0 ? (
              <p className="text-sm text-on-surface-variant/60 text-center py-8">No active projects</p>
            ) : (
              <div className="space-y-1">
                {stageEntries.map(([stageNum, label]) => {
                  const count = stats?.stageWiseCount?.[stageNum] ?? 0;
                  return (
                    <div key={stageNum} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-container transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full signature-gradient text-white text-[10px] flex items-center justify-center font-black">{stageNum}</span>
                        <span className="text-sm font-medium text-on-surface">{label}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-surface-container rounded text-[10px] font-bold text-on-surface-variant">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-container-low">
            <h2 className="text-lg font-bold flex items-center gap-2 font-headline">
              <TrendingUp className="text-primary" size={20} />
              Quick Stats
            </h2>
          </div>
          <div className="p-6 space-y-5">
            {[
              { label: 'Conversion Rate', value: `${((stats?.conversionRate ?? 0) * 100).toFixed(1)}%`, highlight: true },
              { label: 'Leads This Month', value: stats?.leadsThisMonth ?? 0 },
              { label: 'Active Projects', value: stats?.activeApplicants ?? 0 },
              { label: 'Finance Pending', value: stats?.pendingApprovals ?? 0 },
            ].map(({ label, value, highlight }, i) => (
              <div key={i}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant/70">{label}</span>
                  <span className={`text-sm font-bold ${highlight ? 'text-primary' : 'text-on-surface'}`}>{value}</span>
                </div>
                {i < 3 && <div className="mt-4 h-px bg-surface-container-low" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Report Accordions (admin only) ───────────────────────────── */}
      {isAdmin && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-on-surface-variant/60">Detailed Reports</h2>
          </div>

          <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="space-y-3">

            {/* ── 1. Lead Reports ─────────────────────────────────────── */}
            <AccordionItem value="leads" className="bg-surface-container-lowest rounded-2xl border border-orange-100 overflow-hidden border-b-0">
              <AccordionPrimitive.Header className="flex items-center hover:bg-orange-50/40 data-[state=open]:bg-orange-50/60 transition-colors">
                <AccordionPrimitive.Trigger className="flex flex-1 items-center gap-0 px-6 py-4 text-left [&[data-state=open]>svg]:rotate-180">
                  <SectionHeader icon={FileText} iconBg="bg-orange-500" label="Lead Reports" description="Status breakdown across all your leads" />
                  <ChevronDown size={16} className="ml-auto shrink-0 text-on-surface-variant/40 transition-transform duration-200" />
                </AccordionPrimitive.Trigger>
                {openSections.includes('leads') && (
                  <ExportButtons
                    borderColor="border-orange-300"
                    textColor="text-orange-600"
                    onCsv={() => downloadCsv('lead-reports.csv',
                      ['Status', 'Count'],
                      leadTableRows.map(r => [LEAD_STATUS_LABELS[r.statusKey] ?? r.statusKey, r.count]),
                    )}
                    onXls={() => downloadXls('lead-reports',
                      ['Status', 'Count'],
                      leadTableRows.map(r => [LEAD_STATUS_LABELS[r.statusKey] ?? r.statusKey, r.count]),
                    )}
                    onPdf={() => exportToPdf('rpt-leads', 'lead-reports')}
                  />
                )}
              </AccordionPrimitive.Header>
              <AccordionContent className="px-6 pb-5 pt-2">
                {leadLoading ? (
                  <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
                ) : (
                  <ReportTable
                    id="rpt-leads"
                    columns={leadCols}
                    rows={leadTableRows}
                    headerBg="bg-orange-500"
                  />
                )}
              </AccordionContent>
            </AccordionItem>

            {/* ── 2. Project Pipeline ─────────────────────────────────── */}
            <AccordionItem value="pipeline" className="bg-surface-container-lowest rounded-2xl border border-violet-100 overflow-hidden border-b-0">
              <AccordionPrimitive.Header className="flex items-center hover:bg-violet-50/40 data-[state=open]:bg-violet-50/60 transition-colors">
                <AccordionPrimitive.Trigger className="flex flex-1 items-center gap-0 px-6 py-4 text-left [&[data-state=open]>svg]:rotate-180">
                  <SectionHeader icon={Layers} iconBg="bg-violet-500" label="Project Pipeline" description="Stage-wise count & aging of active projects" />
                  <ChevronDown size={16} className="ml-auto shrink-0 text-on-surface-variant/40 transition-transform duration-200" />
                </AccordionPrimitive.Trigger>
                {openSections.includes('pipeline') && (
                  <ExportButtons
                    borderColor="border-violet-300"
                    textColor="text-violet-600"
                    onCsv={() => downloadCsv('project-pipeline.csv',
                      ['Stage', 'Stage Name', 'Projects', 'Oldest (days)'],
                      pipelineTableRows.map(r => [r.stageNum, r.stageName, r.projects, r.oldestDays ?? '']),
                    )}
                    onXls={() => downloadXls('project-pipeline',
                      ['Stage', 'Stage Name', 'Projects', 'Oldest (days)'],
                      pipelineTableRows.map(r => [r.stageNum, r.stageName, r.projects, r.oldestDays ?? '']),
                    )}
                    onPdf={() => exportToPdf('rpt-pipeline', 'project-pipeline')}
                  />
                )}
              </AccordionPrimitive.Header>
              <AccordionContent className="px-6 pb-5 pt-2">
                {stageLoading ? (
                  <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
                ) : (
                  <ReportTable
                    id="rpt-pipeline"
                    columns={pipelineCols}
                    rows={pipelineTableRows}
                    headerBg="bg-violet-500"
                  />
                )}
              </AccordionContent>
            </AccordionItem>

            {/* ── 3. Team Performance ─────────────────────────────────── */}
            <AccordionItem value="team" className="bg-surface-container-lowest rounded-2xl border border-emerald-100 overflow-hidden border-b-0">
              <AccordionPrimitive.Header className="flex items-center hover:bg-emerald-50/40 data-[state=open]:bg-emerald-50/60 transition-colors">
                <AccordionPrimitive.Trigger className="flex flex-1 items-center gap-0 px-6 py-4 text-left [&[data-state=open]>svg]:rotate-180">
                  <SectionHeader icon={Award} iconBg="bg-emerald-500" label="Team Performance" description="Staff leaderboard by leads & projects handled" />
                  <ChevronDown size={16} className="ml-auto shrink-0 text-on-surface-variant/40 transition-transform duration-200" />
                </AccordionPrimitive.Trigger>
                {openSections.includes('team') && (
                  <ExportButtons
                    borderColor="border-emerald-300"
                    textColor="text-emerald-600"
                    onCsv={() => downloadCsv('team-performance.csv',
                      ['Rank', 'Staff Name', 'Leads', 'Projects', 'Total'],
                      teamTableRows.map(r => [r.rank, r.name, r.leads, r.projects, r.total]),
                    )}
                    onXls={() => downloadXls('team-performance',
                      ['Rank', 'Staff Name', 'Leads', 'Projects', 'Total'],
                      teamTableRows.map(r => [r.rank, r.name, r.leads, r.projects, r.total]),
                    )}
                    onPdf={() => exportToPdf('rpt-team', 'team-performance')}
                  />
                )}
              </AccordionPrimitive.Header>
              <AccordionContent className="px-6 pb-5 pt-2">
                {staffLoading ? (
                  <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
                ) : (
                  <ReportTable
                    id="rpt-team"
                    columns={teamCols}
                    rows={teamTableRows}
                    headerBg="bg-emerald-500"
                  />
                )}
              </AccordionContent>
            </AccordionItem>

            {/* ── 4. DISCOM Overview ──────────────────────────────────── */}
            <AccordionItem value="discom" className="bg-surface-container-lowest rounded-2xl border border-cyan-100 overflow-hidden border-b-0">
              <AccordionPrimitive.Header className="flex items-center hover:bg-cyan-50/40 data-[state=open]:bg-cyan-50/60 transition-colors">
                <AccordionPrimitive.Trigger className="flex flex-1 items-center gap-0 px-6 py-4 text-left [&[data-state=open]>svg]:rotate-180">
                  <SectionHeader icon={MapPin} iconBg="bg-cyan-500" label="DISCOM Overview" description="Leads & projects distributed across power utilities" />
                  <ChevronDown size={16} className="ml-auto shrink-0 text-on-surface-variant/40 transition-transform duration-200" />
                </AccordionPrimitive.Trigger>
                {openSections.includes('discom') && (
                  <ExportButtons
                    borderColor="border-cyan-300"
                    textColor="text-cyan-600"
                    onCsv={() => downloadCsv('discom-overview.csv',
                      ['DISCOM', 'Leads', 'Projects', 'Total'],
                      discomTableRows.map(r => [r.discom, r.leads, r.projects, r.total]),
                    )}
                    onXls={() => downloadXls('discom-overview',
                      ['DISCOM', 'Leads', 'Projects', 'Total'],
                      discomTableRows.map(r => [r.discom, r.leads, r.projects, r.total]),
                    )}
                    onPdf={() => exportToPdf('rpt-discom', 'discom-overview')}
                  />
                )}
              </AccordionPrimitive.Header>
              <AccordionContent className="px-6 pb-5 pt-2">
                {discomLoading ? (
                  <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
                ) : (
                  <ReportTable
                    id="rpt-discom"
                    columns={discomCols}
                    rows={discomTableRows}
                    headerBg="bg-cyan-500"
                  />
                )}
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      )}
    </PageWrapper>
  );
}

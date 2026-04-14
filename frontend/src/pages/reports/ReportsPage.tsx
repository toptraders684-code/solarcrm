import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { reportsService, type ReportType } from '@/services/reports.service';
import { formatDate, formatCurrency, toTitleCase } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const REPORTS: { value: ReportType; label: string; description: string }[] = [
  { value: 'lead_summary', label: 'Lead Summary', description: 'Total leads, sources, conversion rates' },
  { value: 'conversion_funnel', label: 'Conversion Funnel', description: 'Lead to project conversion by DISCOM' },
  { value: 'stage_aging', label: 'Stage Aging', description: 'Projects stuck at each stage' },
  { value: 'project_profitability', label: 'Project Profitability', description: 'Contract vs received vs costs' },
  { value: 'subsidy_tracker', label: 'Subsidy Tracker', description: 'Subsidy status and disbursement' },
  { value: 'vendor_payment', label: 'Vendor Payment Summary', description: 'Payments by vendor by period' },
  { value: 'staff_performance', label: 'Staff Performance', description: 'Leads and projects by staff' },
  { value: 'discom_wise', label: 'DISCOM-wise Summary', description: 'Counts and revenue by DISCOM' },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [discom, setDiscom] = useState('');
  const [generate, setGenerate] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['report', selectedReport, dateFrom, dateTo, discom],
    queryFn: () => reportsService.generate({ reportType: selectedReport as ReportType, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, discom: discom || undefined }),
    enabled: generate && !!selectedReport,
  });

  const handleDownload = async (format: 'pdf' | 'excel') => {
    if (!selectedReport) return;
    setDownloading(format);
    try {
      const blob = await reportsService.download({ reportType: selectedReport as ReportType, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}_${new Date().toISOString().slice(0, 10)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed. Try again.');
    } finally {
      setDownloading(null);
    }
  };

  const reportRows = data?.data ?? [];

  return (
    <PageWrapper title="Reports & MIS" subtitle="Generate and download management reports">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selector */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-3">Select Report</p>
          {REPORTS.map((r) => (
            <button key={r.value} onClick={() => { setSelectedReport(r.value); setGenerate(false); }}
              className={cn(
                'w-full text-left p-4 rounded-xl border transition-all',
                selectedReport === r.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-outline-variant/20 bg-surface-container-lowest hover:border-primary/30'
              )}>
              <p className={cn('text-sm font-bold', selectedReport === r.value ? 'text-primary' : 'text-on-surface')}>{r.label}</p>
              <p className="text-xs text-on-surface-variant/60 mt-0.5">{r.description}</p>
            </button>
          ))}
        </div>

        {/* Filters + Results */}
        <div className="lg:col-span-2 space-y-4">
          {selectedReport ? (
            <>
              <div className="bg-surface-container-lowest rounded-xl p-6">
                <h3 className="text-lg font-bold text-on-surface font-headline mb-4">
                  {REPORTS.find((r) => r.value === selectedReport)?.label}
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Date From</label>
                    <Input className="mt-1" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Date To</label>
                    <Input className="mt-1" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">DISCOM (Optional)</label>
                    <Select value={discom} onValueChange={(v) => setDiscom(v === 'all' ? '' : v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="All DISCOMs" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All DISCOMs</SelectItem>
                        {['tpcodl', 'tpnodl', 'tpsodl', 'tpwodl'].map((d) => (
                          <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-surface-container-low">
                  <Button onClick={() => setGenerate(true)} loading={isFetching}>
                    <BarChart2 size={16} />Generate
                  </Button>
                  <Button variant="secondary" onClick={() => handleDownload('pdf')} disabled={!generate || downloading === 'pdf'}>
                    <FileDown size={16} />PDF
                  </Button>
                  <Button variant="secondary" onClick={() => handleDownload('excel')} disabled={!generate || downloading === 'excel'}>
                    <FileDown size={16} />Excel
                  </Button>
                </div>
              </div>

              {generate && (
                <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
                  {isFetching ? (
                    <div className="p-6 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
                  ) : reportRows.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                            {Object.keys(reportRows[0]).map((col) => (
                              <th key={col} className="px-4 py-4">{toTitleCase(col)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-low">
                          {reportRows.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-surface-container-low/50">
                              {Object.values(row).map((val: any, j: number) => (
                                <td key={j} className="px-4 py-3 text-sm text-on-surface-variant">
                                  {typeof val === 'number' && String(Object.keys(row)[j]).toLowerCase().includes('amount')
                                    ? formatCurrency(val)
                                    : typeof val === 'string' && val.includes('T') ? formatDate(val)
                                    : String(val ?? '—')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant/50 text-center py-12">No data found for the selected filters.</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 bg-surface-container-lowest rounded-xl text-on-surface-variant/40 text-sm">
              Select a report from the left to get started.
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, BarChart2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { reportsService, type ReportType } from '@/services/reports.service';
import { formatDate, formatCurrency, toTitleCase } from '@/utils/formatters';

const REPORTS: { value: ReportType; label: string; description: string }[] = [
  { value: 'lead_summary', label: 'Lead Summary', description: 'Total leads, sources, conversion rates by period' },
  { value: 'conversion_funnel', label: 'Conversion Funnel', description: 'Lead to project conversion by DISCOM and staff' },
  { value: 'stage_aging', label: 'Stage Aging', description: 'Projects stuck at each stage with days elapsed' },
  { value: 'project_profitability', label: 'Project Profitability', description: 'Contract vs received vs costs per project' },
  { value: 'subsidy_tracker', label: 'Subsidy Tracker', description: 'Subsidy applications, amounts, and disbursement status' },
  { value: 'vendor_payment', label: 'Vendor Payment Summary', description: 'Payments made to each vendor by period' },
  { value: 'staff_performance', label: 'Staff Performance', description: 'Leads assigned, converted, and projects by staff' },
  { value: 'discom_wise', label: 'DISCOM-wise Summary', description: 'Project counts and revenue by DISCOM' },
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
    queryFn: () =>
      reportsService.generate({
        reportType: selectedReport as ReportType,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        discom: discom || undefined,
      }),
    enabled: generate && !!selectedReport,
  });

  const handleGenerate = () => setGenerate(true);

  const handleDownload = async (format: 'pdf' | 'excel') => {
    if (!selectedReport) return;
    setDownloading(format);
    try {
      const blob = await reportsService.download({
        reportType: selectedReport as ReportType,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        format,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}_${new Date().toISOString().slice(0, 10)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('Download failed. Try again.');
    } finally {
      setDownloading(null);
    }
  };

  const reportRows = data?.data ?? [];
  const summary = data?.summary;

  return (
    <PageWrapper title="Reports & MIS" subtitle="Generate and download reports">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Report Selector */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Select Report</h3>
          {REPORTS.map((r) => (
            <button
              key={r.value}
              onClick={() => { setSelectedReport(r.value); setGenerate(false); }}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedReport === r.value
                  ? 'border-brand-500 bg-brand-50 shadow-sm'
                  : 'border-gray-200 hover:border-brand-300 bg-white'
              }`}
            >
              <p className={`text-sm font-medium ${selectedReport === r.value ? 'text-brand-700' : 'text-gray-800'}`}>
                {r.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
            </button>
          ))}
        </div>

        {/* Right: Filters + Results */}
        <div className="lg:col-span-2 space-y-4">
          {selectedReport ? (
            <>
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {REPORTS.find((r) => r.value === selectedReport)?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Date From</Label>
                      <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date To</Label>
                      <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>DISCOM (Optional)</Label>
                      <Select value={discom} onValueChange={(v) => setDiscom(v === 'all' ? '' : v)}>
                        <SelectTrigger><SelectValue placeholder="All DISCOMs" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All DISCOMs</SelectItem>
                          {['tpcodl', 'tpnodl', 'tpsodl', 'tpwodl'].map((d) => (
                            <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleGenerate} disabled={isFetching}>
                      {isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart2 className="w-4 h-4 mr-2" />}
                      Generate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownload('pdf')}
                      disabled={!generate || downloading === 'pdf'}
                    >
                      {downloading === 'pdf' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />}
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownload('excel')}
                      disabled={!generate || downloading === 'excel'}
                    >
                      {downloading === 'excel' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />}
                      Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {generate && (
                <div className="bg-white rounded-xl border overflow-hidden">
                  {isFetching ? (
                    <div className="p-6 space-y-2">
                      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                  ) : reportRows.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            {Object.keys(reportRows[0]).map((col) => (
                              <th key={col} className="text-left px-4 py-3 font-medium text-gray-600">
                                {toTitleCase(col)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reportRows.map((row: any, i: number) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                              {Object.values(row).map((val: any, j: number) => (
                                <td key={j} className="px-4 py-2.5 text-muted-foreground">
                                  {typeof val === 'number' && String(Object.keys(row)[j]).toLowerCase().includes('amount')
                                    ? formatCurrency(val)
                                    : typeof val === 'string' && val.includes('T')
                                    ? formatDate(val)
                                    : String(val ?? '—')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      No data found for the selected filters.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              Select a report from the left to get started.
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

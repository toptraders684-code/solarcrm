import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Download, CheckCircle2, XCircle, FileSpreadsheet, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { leadsService } from '@/services/leads.service';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const TEMPLATE_HEADERS = [
  'Customer Name',
  'Mobile',
  'Alternate Mobile',
  'Email',
  'Village / Area',
  'Pincode',
  'DISCOM',
  'Project Type',
  'Capacity (kW)',
  'Lead Source',
  'Finance Preference',
  'Assigned To',
  'Follow Up Date',
];

const SAMPLE_ROWS = [
  ['Ramesh Kumar', '9876543210', '', 'ramesh@email.com', 'Bhubaneswar', '751001', 'TPCODL', 'Residential', '5', 'Referral', 'Self', 'Suresh Patel', '2026-05-01'],
  ['Sunita Devi', '9123456780', '9123456781', '', 'Cuttack', '753001', 'TPNODL', 'Commercial', '10', 'Online', 'Govt Bank', '', ''],
];

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS, ...SAMPLE_ROWS];
  const csv = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads_upload_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

type UploadResult = {
  created: number;
  failed: { row: number; name: string; reason: string }[];
  total: number;
};

export function BulkUploadDialog({ open, onOpenChange }: BulkUploadDialogProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const reset = () => { setFile(null); setResult(null); };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleFile = (f: File) => {
    const ok = f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls');
    if (!ok) { toast.error('Only .csv, .xlsx, or .xls files are accepted'); return; }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await leadsService.bulkUpload(file);
      setResult(res);
      if (res.created > 0) {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        toast.success(`${res.created} lead${res.created > 1 ? 's' : ''} imported successfully`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Leads</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Step 1 — Template */}
          <div className="bg-surface-container-low/50 rounded-xl p-4 flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Download size={16} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface mb-0.5">Step 1 — Download Template</p>
              <p className="text-xs text-on-surface-variant/60 mb-3">
                Fill the CSV template with your leads. Required columns: <span className="font-semibold">Customer Name, Mobile, Village / Area, DISCOM, Project Type, Lead Source</span>.
              </p>
              <Button size="sm" variant="secondary" onClick={downloadTemplate}>
                <Download size={13} />Download Template (.csv)
              </Button>
            </div>
          </div>

          {/* Column reference */}
          <details className="text-xs text-on-surface-variant/60">
            <summary className="cursor-pointer font-semibold text-on-surface-variant hover:text-on-surface select-none">
              View accepted values for each column
            </summary>
            <div className="mt-2 space-y-1 pl-3 border-l-2 border-surface-container-low">
              <p><span className="font-semibold text-on-surface">DISCOM:</span> TPCODL, TPNODL, TPSODL, TPWODL</p>
              <p><span className="font-semibold text-on-surface">Project Type:</span> Residential, Commercial</p>
              <p><span className="font-semibold text-on-surface">Lead Source:</span> Walk In, Referral, Online, Camp, Channel Partner, Other</p>
              <p><span className="font-semibold text-on-surface">Finance Preference:</span> Self, Govt Bank, Private Bank (optional)</p>
              <p><span className="font-semibold text-on-surface">Assigned To:</span> Exact staff name — if blank or not found, assigned to you</p>
              <p><span className="font-semibold text-on-surface">Follow Up Date:</span> YYYY-MM-DD or DD/MM/YYYY (optional)</p>
            </div>
          </details>

          {/* Step 2 — Upload */}
          <div>
            <p className="text-sm font-bold text-on-surface mb-2">Step 2 — Upload File</p>

            {!result ? (
              <>
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragging
                      ? 'border-primary bg-primary/5'
                      : file
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-surface-container-low hover:border-primary/40 hover:bg-surface-container-low/30'
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileSpreadsheet size={22} className="text-primary" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-on-surface">{file.name}</p>
                        <p className="text-xs text-on-surface-variant/60">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="ml-2 w-6 h-6 rounded flex items-center justify-center text-on-surface-variant/40 hover:text-error hover:bg-error/10 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={28} className="text-on-surface-variant/30 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-on-surface-variant/60">Drag & drop or click to choose file</p>
                      <p className="text-xs text-on-surface-variant/40 mt-1">Accepts .csv, .xlsx, .xls — max 500 rows</p>
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="secondary" onClick={() => handleClose(false)}>Cancel</Button>
                  <Button disabled={!file || uploading} loading={uploading} onClick={handleUpload}>
                    <Upload size={14} />Import Leads
                  </Button>
                </div>
              </>
            ) : (
              /* Results */
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-primary/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-primary">{result.total}</p>
                    <p className="text-xs text-on-surface-variant/60 font-medium mt-0.5">Total Rows</p>
                  </div>
                  <div className="bg-primary/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-primary">{result.created}</p>
                    <p className="text-xs text-on-surface-variant/60 font-medium mt-0.5">Imported</p>
                  </div>
                  <div className={`rounded-xl p-4 text-center ${result.failed.length > 0 ? 'bg-error/10' : 'bg-surface-container-low'}`}>
                    <p className={`text-2xl font-black ${result.failed.length > 0 ? 'text-error' : 'text-on-surface-variant/40'}`}>{result.failed.length}</p>
                    <p className="text-xs text-on-surface-variant/60 font-medium mt-0.5">Failed</p>
                  </div>
                </div>

                {result.failed.length > 0 && (
                  <div className="rounded-xl border border-error/20 overflow-hidden">
                    <div className="bg-error/5 px-4 py-2.5 flex items-center gap-2">
                      <XCircle size={14} className="text-error" />
                      <span className="text-xs font-black uppercase tracking-widest text-error/70">Failed Rows</span>
                    </div>
                    <div className="divide-y divide-surface-container-low max-h-52 overflow-y-auto">
                      {result.failed.map((f) => (
                        <div key={f.row} className="px-4 py-2.5 flex items-start gap-3">
                          <span className="text-xs font-bold text-on-surface-variant/50 w-12 flex-shrink-0">Row {f.row}</span>
                          <span className="text-xs font-semibold text-on-surface flex-shrink-0 w-32 truncate">{f.name}</span>
                          <span className="text-xs text-error/80">{f.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.created > 0 && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <CheckCircle2 size={16} />
                    <span>{result.created} lead{result.created > 1 ? 's' : ''} added to your leads list.</span>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={reset}>Upload Another File</Button>
                  <Button onClick={() => handleClose(false)}>Done</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Printer, Download, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { documentMasterService } from '@/services/document-master.service';
import { fillTemplate } from '@/utils/templateHelpers';
import { buildPlaceholderValues } from '@/utils/templateHelpers';
import type { Applicant } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  masterItemId: string;
  masterTitle: string;
  applicant: Applicant;
}

export function GeneratePreviewModal({ open, onClose, masterItemId, masterTitle, applicant }: Props) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    documentMasterService
      .getTemplate(masterItemId)
      .then(({ templateContent }) => {
        if (!templateContent) {
          setHtml('<p style="text-align:center;color:#999;padding:40px">No template configured for this document. Ask your administrator to set one up.</p>');
          return;
        }
        const values = buildPlaceholderValues(applicant);
        setHtml(fillTemplate(templateContent, values));
      })
      .catch(() => setHtml('<p style="color:red">Failed to load template.</p>'))
      .finally(() => setLoading(false));
  }, [open, masterItemId, applicant]);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const safe = masterTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    const dt = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>${safe}_${dt}</title>
      <style>
        @page { size: A4; margin: 18mm 20mm; }
        * { box-sizing: border-box; }
        body { font-family: serif; font-size: 12pt; line-height: 1.6; color: #000; margin: 0; padding: 0; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #999; padding: 4px 8px; }
        img { max-width: 100%; }
        .placeholder-chip { background: transparent; border: none; padding: 0; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const safe = masterTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
      const dt = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
      const opt = {
        margin: [18, 20, 18, 20] as [number, number, number, number],
        filename: `${safe}_${dt}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      };
      await html2pdf().set(opt).from(previewRef.current).save();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl" style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="truncate pr-4">{masterTitle}</DialogTitle>
        </DialogHeader>

        {/* Action bar */}
        <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/10 flex-shrink-0">
          <Button size="sm" variant="secondary" onClick={handlePrint} disabled={loading}>
            <Printer size={13} />Print
          </Button>
          <Button size="sm" onClick={handleDownload} loading={downloading} disabled={loading}>
            <Download size={13} />Download PDF
          </Button>
          <span className="text-[10px] text-on-surface-variant/40 ml-2">
            Print opens a print dialog. Download saves directly without dialog.
          </span>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto bg-surface-container-low p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-2 text-sm text-on-surface-variant/50">
              <Loader2 size={16} className="animate-spin" />Preparing document…
            </div>
          ) : (
            <div className="flex flex-col gap-8 items-center">
              {splitPages(html).map((pageHtml, i) => (
                <div key={i}>
                  {i > 0 && (
                    <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-on-surface-variant/40">
                      <div className="flex-1 h-px bg-outline-variant/30" />Page {i + 1}
                      <div className="flex-1 h-px bg-outline-variant/30" />
                    </div>
                  )}
                  <div
                    className="bg-white shadow-lg border border-outline-variant/10"
                    style={{ width: '595px', minHeight: '842px', padding: '68px 75px', position: 'relative' }}
                  >
                    <div
                      ref={i === 0 ? previewRef : undefined}
                      className="generate-preview-content"
                      style={{ fontFamily: 'serif', fontSize: '12pt', lineHeight: 1.6, color: '#000' }}
                      dangerouslySetInnerHTML={{ __html: pageHtml }}
                    />
                    <div className="absolute bottom-4 right-5 text-[9px] text-gray-300">{i + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function splitPages(html: string): string[] {
  if (!html) return [''];
  const parts = html.split(/<hr[^>]*class="[^"]*page-break[^"]*"[^>]*\/?>/i);
  return parts.length > 0 ? parts : [html];
}

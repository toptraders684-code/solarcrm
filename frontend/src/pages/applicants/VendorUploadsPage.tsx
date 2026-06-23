import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, FileText, Users, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { applicantsService } from '@/services/applicants.service';
import { formatDate } from '@/utils/formatters';

export default function VendorUploadsPage() {
  const navigate = useNavigate();
  const [filterVendor, setFilterVendor] = useState('');
  const [viewFile, setViewFile] = useState<{ url: string; mimeType: string; title: string } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-uploads'],
    queryFn: () => applicantsService.getVendorUploads(),
  });

  const uploads: any[] = data?.data ?? [];

  // Collect unique vendors for filter dropdown
  const vendorMap: Record<string, any> = {};
  uploads.forEach((d) => { if (d.uploadedBy?.id) vendorMap[d.uploadedBy.id] = d.uploadedBy; });
  const vendors = Object.values(vendorMap);

  const filtered = filterVendor
    ? uploads.filter((d) => d.uploadedBy?.id === filterVendor)
    : uploads;

  const handleView = async (doc: any) => {
    setLoadingId(doc.id);
    try {
      const blob = await applicantsService.downloadDocument(doc.applicantId, doc.id);
      const url = URL.createObjectURL(blob);
      setViewFile({ url, mimeType: doc.mimeType || 'application/pdf', title: doc.docName });
    } catch {
      toast.error('Failed to load file');
    } finally {
      setLoadingId(null);
    }
  };

  const closeView = () => {
    if (viewFile?.url) URL.revokeObjectURL(viewFile.url);
    setViewFile(null);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-on-surface">Vendor Uploads</h1>
          <p className="text-sm text-on-surface-variant/60 mt-0.5">Documents uploaded by vendor team members</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
          {filtered.length} document{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filter */}
      {vendors.length > 1 && (
        <div className="flex items-center gap-3">
          <Users size={14} className="text-on-surface-variant/50 flex-shrink-0" />
          <select
            value={filterVendor}
            onChange={(e) => setFilterVendor(e.target.value)}
            className="text-sm border border-outline-variant/20 rounded-lg px-3 py-1.5 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All vendor members</option>
            {vendors.map((v: any) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-outline-variant/10 bg-surface-container-low text-center gap-2">
          <FileText size={36} className="text-on-surface-variant/20" />
          <p className="text-sm text-on-surface-variant/40">No vendor uploads yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant/10">
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 w-10">#</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Project</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Document</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Uploaded By</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 w-28">Date</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filtered.map((doc, i) => (
                <tr key={doc.id} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="px-4 py-3 text-on-surface-variant/40 text-center text-xs">{i + 1}</td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/applicants/${doc.applicantId}`)}
                      className="text-left hover:underline"
                    >
                      <div className="font-bold text-xs text-primary">{doc.applicant?.applicantCode}</div>
                      <div className="text-sm font-semibold text-on-surface truncate max-w-[180px]">{doc.applicant?.customerName}</div>
                      <div className="text-[10px] text-on-surface-variant/50">{doc.applicant?.discom?.toUpperCase()}</div>
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText size={13} className="text-primary" />
                      </div>
                      <span className="font-semibold text-on-surface truncate max-w-[180px]">{doc.docName}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-on-surface text-sm">{doc.uploadedBy?.name ?? '—'}</div>
                    {doc.uploadedBy?.vendorLevel && (
                      <span className="text-[10px] text-on-surface-variant/50">{doc.uploadedBy.vendorLevel}</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-xs text-on-surface-variant/60">
                    {doc.uploadedAt ? formatDate(doc.uploadedAt) : '—'}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleView(doc)}
                      disabled={loadingId === doc.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/5 disabled:opacity-60 transition-colors"
                    >
                      <Eye size={12} />{loadingId === doc.id ? '…' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View modal */}
      <Dialog open={!!viewFile} onOpenChange={(open) => { if (!open) closeView(); }}>
        <DialogContent className="max-w-3xl" style={{ height: '80vh' }}>
          <DialogHeader>
            <DialogTitle className="truncate pr-16">{viewFile?.title}</DialogTitle>
            {viewFile && (
              <a
                href={viewFile.url}
                download={viewFile.title}
                className="absolute right-10 top-4 p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant/60 hover:text-on-surface transition-colors"
                title="Download"
              >
                <Download size={16} />
              </a>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg bg-surface-container" style={{ height: 'calc(80vh - 80px)' }}>
            {viewFile?.mimeType?.startsWith('image/') ? (
              <img src={viewFile.url} alt={viewFile.title} className="w-full h-full object-contain" />
            ) : (
              <iframe src={viewFile?.url} className="w-full h-full border-0 rounded-lg" title={viewFile?.title} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Eye, FileText, Zap, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { applicantsService } from '@/services/applicants.service';
import { documentMasterService } from '@/services/document-master.service';
import type { Document, DocumentMaster } from '@/types';

interface DocumentsTabProps {
  applicantId: string;
  discom: string;
}

export function DocumentsTab({ applicantId, discom }: DocumentsTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [viewFile, setViewFile] = useState<{ url: string; mimeType: string; title: string } | null>(null);
  const [loadingViewId, setLoadingViewId] = useState<string | null>(null);

  const { data: masterData, isLoading: masterLoading } = useQuery({
    queryKey: ['document-master', discom],
    queryFn: () => documentMasterService.list(discom),
    enabled: !!discom,
  });

  const { data: docData } = useQuery({
    queryKey: ['applicant-documents', applicantId],
    queryFn: () => applicantsService.getDocuments(applicantId),
  });

  const masters: DocumentMaster[] = masterData?.data ?? [];
  const documents: Document[] = docData?.data ?? [];

  const docByMasterId = documents.reduce((acc, doc) => {
    if (doc.masterItemId) acc[doc.masterItemId] = doc;
    return acc;
  }, {} as Record<string, Document>);

  const handleChooseFile = (masterItemId: string) => {
    setActiveItemId(masterItemId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeItemId) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('File exceeds 2MB limit'); return; }
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPG, PNG, PDF allowed'); return;
    }
    setPendingFiles((prev) => ({ ...prev, [activeItemId]: file }));
  };

  const clearPending = (masterItemId: string) => {
    setPendingFiles((prev) => { const n = { ...prev }; delete n[masterItemId]; return n; });
  };

  const handleUpload = async (master: DocumentMaster) => {
    const file = pendingFiles[master.id];
    if (!file) return;
    setUploadingId(master.id);
    try {
      await applicantsService.uploadDocument(applicantId, file, master.title, 'discom', master.id);
      toast.success('Document uploaded');
      queryClient.invalidateQueries({ queryKey: ['applicant-documents', applicantId] });
      clearPending(master.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const handleView = async (doc: Document, title: string) => {
    setLoadingViewId(doc.id);
    try {
      const blob = await applicantsService.downloadDocument(applicantId, doc.id);
      const url = URL.createObjectURL(blob);
      setViewFile({ url, mimeType: doc.mimeType || 'application/pdf', title });
    } catch {
      toast.error('Failed to load file');
    } finally {
      setLoadingViewId(null);
    }
  };

  const closeView = () => {
    if (viewFile?.url) URL.revokeObjectURL(viewFile.url);
    setViewFile(null);
  };

  if (masterLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-surface-container animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="overflow-x-auto rounded-xl border border-outline-variant/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container border-b border-outline-variant/10">
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 w-12">Sl</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Document Title</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 w-72">Upload File</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 w-44">Uploaded File</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {masters.map((master, i) => {
              const uploaded = docByMasterId[master.id];
              const pending = pendingFiles[master.id];
              const isUploading = uploadingId === master.id;
              const isLoadingView = loadingViewId === uploaded?.id;

              return (
                <tr key={master.id} className="hover:bg-surface-container-low/30 transition-colors">
                  {/* Sl No */}
                  <td className="px-4 py-3 text-on-surface-variant/50 font-medium text-center">{i + 1}</td>

                  {/* Document Title */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText size={13} className="text-primary" />
                      </div>
                      <span className="font-semibold text-on-surface text-sm leading-snug">{master.title}</span>
                    </div>
                  </td>

                  {/* Upload File — blank when already uploaded */}
                  <td className="px-4 py-3">
                    {uploaded ? null : master.canGenerate ? (
                      <button
                        disabled
                        title="Auto-generate coming soon"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-container text-on-secondary-fixed-variant text-xs font-semibold opacity-50 cursor-not-allowed"
                      >
                        <Zap size={12} />Generate Document
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleChooseFile(master.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface hover:bg-surface-container text-on-surface-variant text-xs font-semibold transition-colors min-w-0"
                        >
                          {pending ? (
                            <span className="text-primary truncate max-w-[110px]" title={pending.name}>{pending.name}</span>
                          ) : (
                            <><Upload size={12} />Choose File</>
                          )}
                        </button>
                        {pending && (
                          <>
                            <button
                              onClick={() => handleUpload(master)}
                              disabled={isUploading}
                              className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                            >
                              {isUploading ? 'Uploading…' : 'Upload'}
                            </button>
                            <button
                              onClick={() => clearPending(master.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-error/10 text-on-surface-variant/50 hover:text-error transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Uploaded File */}
                  <td className="px-4 py-3">
                    {uploaded ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">
                          Uploaded
                        </span>
                        <button
                          onClick={() => handleView(uploaded, master.title)}
                          disabled={isLoadingView}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/5 disabled:opacity-60 transition-colors"
                        >
                          <Eye size={12} />{isLoadingView ? '…' : 'View'}
                        </button>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant/40 text-[10px] font-bold uppercase tracking-wide">
                        Not Uploaded
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {masters.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-on-surface-variant/50">
                  No documents configured for {discom.toUpperCase()}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View File Modal */}
      <Dialog open={!!viewFile} onOpenChange={(open) => { if (!open) closeView(); }}>
        <DialogContent className="max-w-3xl" style={{ height: '80vh' }}>
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{viewFile?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg bg-surface-container" style={{ height: 'calc(80vh - 80px)' }}>
            {viewFile?.mimeType?.startsWith('image/') ? (
              <img
                src={viewFile.url}
                alt={viewFile.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <iframe
                src={viewFile?.url}
                className="w-full h-full border-0 rounded-lg"
                title={viewFile?.title}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

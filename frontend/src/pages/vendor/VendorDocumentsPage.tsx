import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Camera, Upload, FileText, X, Eye, Download, Search, FolderOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CameraCapture } from '@/components/shared/CameraCapture';
import { applicantsService } from '@/services/applicants.service';
import { compressImage } from '@/utils/imageCompressor';
import { documentMasterService } from '@/services/document-master.service';
import type { Document, DocumentMaster, Applicant } from '@/types';

export default function VendorDocumentsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<Applicant | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [loadingViewId, setLoadingViewId] = useState<string | null>(null);
  const [viewFile, setViewFile] = useState<{ url: string; mimeType: string; title: string; filename: string } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraTargetId, setCameraTargetId] = useState<string | null>(null);

  // Load vendor's projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['vendor-projects'],
    queryFn: () => applicantsService.getApplicants({ limit: 200 }),
  });

  const allProjects: Applicant[] = (projectsData as any)?.data ?? [];
  const filtered = search.trim()
    ? allProjects.filter(
        (p) =>
          p.customerName?.toLowerCase().includes(search.toLowerCase()) ||
          p.applicantCode?.toLowerCase().includes(search.toLowerCase()),
      )
    : allProjects;

  // Load document masters for selected project
  const { data: masterData, isLoading: masterLoading } = useQuery({
    queryKey: ['document-master', selectedProject?.discom],
    queryFn: () => documentMasterService.list(selectedProject!.discom),
    enabled: !!selectedProject?.discom,
  });

  // Load uploaded documents for selected project
  const { data: docData } = useQuery({
    queryKey: ['applicant-documents', selectedProject?.id],
    queryFn: () => applicantsService.getDocuments(selectedProject!.id),
    enabled: !!selectedProject,
  });

  const masters: DocumentMaster[] = masterData?.data ?? [];
  const documents: Document[] = docData?.data ?? [];

  const docByMasterId = documents.reduce((acc, doc) => {
    if (doc.masterItemId) acc[doc.masterItemId] = doc;
    return acc;
  }, {} as Record<string, Document>);

  const buildFilename = (title: string, mimeType = 'application/pdf') => {
    const safe = title.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    const dt = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
    const ext = mimeType.includes('pdf') ? 'pdf' : mimeType.includes('png') ? 'png' : mimeType.includes('jpeg') ? 'jpg' : 'pdf';
    return `${safe}_${dt}.${ext}`;
  };

  const handleChooseFile = (masterItemId: string) => {
    setActiveItemId(masterItemId);
    if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); }
  };

  const handleTakePhoto = (masterItemId: string) => {
    setCameraTargetId(masterItemId);
    setCameraOpen(true);
  };

  const handleCameraCapture = async (file: File) => {
    if (!cameraTargetId) return;
    const targetId = cameraTargetId;
    setCameraTargetId(null);
    try {
      const compressed = await compressImage(file);
      setPendingFiles((prev) => ({ ...prev, [targetId]: compressed }));
    } catch {
      toast.error('Failed to process photo');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeItemId) return;
    const targetId = activeItemId;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPG, PNG, PDF allowed'); return;
    }
    if (file.type === 'application/pdf') {
      if (file.size > 2 * 1024 * 1024) { toast.error('PDF exceeds 2MB limit'); return; }
      setPendingFiles((prev) => ({ ...prev, [targetId]: file }));
    } else {
      try {
        const compressed = await compressImage(file);
        setPendingFiles((prev) => ({ ...prev, [targetId]: compressed }));
      } catch {
        toast.error('Failed to process image');
      }
    }
  };

  const clearPending = (id: string) =>
    setPendingFiles((prev) => { const n = { ...prev }; delete n[id]; return n; });

  const handleUpload = async (master: DocumentMaster) => {
    if (!selectedProject) return;
    const file = pendingFiles[master.id];
    if (!file) return;
    setUploadingId(master.id);
    try {
      await applicantsService.uploadDocument(selectedProject.id, file, master.title, 'discom', master.id);
      toast.success('Document uploaded');
      queryClient.invalidateQueries({ queryKey: ['applicant-documents', selectedProject.id] });
      clearPending(master.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const handleView = async (doc: Document, title: string) => {
    if (!selectedProject) return;
    setLoadingViewId(doc.id);
    try {
      const blob = await applicantsService.downloadDocument(selectedProject.id, doc.id);
      const url = URL.createObjectURL(blob);
      const mime = doc.mimeType || 'application/pdf';
      setViewFile({ url, mimeType: mime, title, filename: buildFilename(title, mime) });
    } catch { toast.error('Failed to load file'); }
    finally { setLoadingViewId(null); }
  };

  const closeView = () => { if (viewFile?.url) URL.revokeObjectURL(viewFile.url); setViewFile(null); };

  const uploadableCount = masters.filter(
    (m) => m.docType === 'upload' && (!docByMasterId[m.id] || docByMasterId[m.id].status === 'needs_reupload'),
  ).length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />

      {/* Camera modal */}
      <CameraCapture
        open={cameraOpen}
        onCapture={handleCameraCapture}
        onClose={() => { setCameraOpen(false); setCameraTargetId(null); }}
      />

      {/* Page header */}
      <div>
        <h1 className="text-xl font-black text-on-surface">Project Documents</h1>
        <p className="text-sm text-on-surface-variant/60 mt-0.5">Select a project and upload the required documents</p>
      </div>

      {/* Project picker */}
      <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
          <input
            type="text"
            placeholder="Search by customer name or project code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {projectsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-surface-container animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-on-surface-variant/50 text-center py-4">No projects found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {filtered.map((project) => (
              <button
                key={project.id}
                onClick={() => { setSelectedProject(project); setPendingFiles({}); setSearch(''); }}
                className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                  selectedProject?.id === project.id
                    ? 'border-primary/40 bg-primary/8 text-primary'
                    : 'border-outline-variant/15 bg-surface hover:bg-surface-container text-on-surface'
                }`}
              >
                <div className="font-bold text-xs">{project.applicantCode}</div>
                <div className="text-sm font-semibold truncate">{project.customerName}</div>
                <div className="text-[11px] text-on-surface-variant/50 mt-0.5">{project.discom?.toUpperCase()}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Document table */}
      {selectedProject && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-on-surface">{selectedProject.customerName}</span>
              <span className="ml-2 text-xs text-on-surface-variant/50">{selectedProject.applicantCode}</span>
            </div>
            {uploadableCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-warning/10 text-warning text-[11px] font-bold">
                {uploadableCount} pending
              </span>
            )}
          </div>

          {masterLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : masters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-outline-variant/10 bg-surface-container-low text-center gap-2">
              <FolderOpen size={32} className="text-on-surface-variant/25" />
              <p className="text-sm text-on-surface-variant/50">No documents configured for {selectedProject.discom?.toUpperCase()}. Ask your super admin to add them in Document Master.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-outline-variant/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant/10">
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 w-10">#</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Document</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 w-56">Upload</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {masters.filter((m) => m.docType === 'upload').map((master, i) => {
                    const uploaded = docByMasterId[master.id];
                    const pending = pendingFiles[master.id];
                    const isUploading = uploadingId === master.id;

                    return (
                      <tr key={master.id} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="px-4 py-3 text-on-surface-variant/40 text-center text-xs">{i + 1}</td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText size={13} className="text-primary" />
                            </div>
                            <span className="font-semibold text-on-surface text-sm leading-snug">{master.title}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {uploaded && uploaded.status === 'uploaded' ? (
                            <button
                              onClick={() => handleView(uploaded, master.title)}
                              disabled={loadingViewId === uploaded.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/5 disabled:opacity-60 transition-colors"
                            >
                              <Eye size={12} />{loadingViewId === uploaded.id ? '…' : 'View'}
                            </button>
                          ) : pending ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-primary truncate max-w-[120px] text-xs font-semibold" title={pending.name}>{pending.name}</span>
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
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleChooseFile(master.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface hover:bg-surface-container text-on-surface-variant text-xs font-semibold transition-colors"
                              >
                                <Upload size={12} />File
                              </button>
                              <button
                                onClick={() => handleTakePhoto(master.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface hover:bg-surface-container text-on-surface-variant text-xs font-semibold transition-colors"
                              >
                                <Camera size={12} />Camera
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {uploaded?.status === 'needs_reupload' ? (
                            <div>
                              <span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning text-[10px] font-bold uppercase tracking-wide">
                                Re-upload Required
                              </span>
                              {uploaded.rejectionReason && (
                                <p className="mt-1 text-[10px] text-on-surface-variant/70 leading-snug max-w-[160px]">
                                  {uploaded.rejectionReason}
                                </p>
                              )}
                            </div>
                          ) : uploaded ? (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">
                              Uploaded
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant/40 text-[10px] font-bold uppercase tracking-wide">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedProject && !projectsLoading && allProjects.length > 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
          <FolderOpen size={36} className="text-on-surface-variant/20" />
          <p className="text-sm text-on-surface-variant/40">Select a project above to view its documents</p>
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
                download={viewFile.filename}
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

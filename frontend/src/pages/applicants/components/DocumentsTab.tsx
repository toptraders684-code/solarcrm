import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, FileText, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applicantsService } from '@/services/applicants.service';
import { formatDate, fileSizeLabel } from '@/utils/formatters';
import { validateFile } from '@/utils/validators';
import type { Document } from '@/types';

const CATEGORIES = ['kyc', 'technical', 'discom'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  kyc: 'KYC Documents',
  technical: 'Technical Documents',
  discom: 'DISCOM Documents',
};

interface DocumentsTabProps { applicantId: string; }

export function DocumentsTab({ applicantId }: DocumentsTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('kyc');
  const [uploadDocName, setUploadDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [uploadLink, setUploadLink] = useState('');

  const { data } = useQuery({
    queryKey: ['applicant-documents', applicantId],
    queryFn: () => applicantsService.getDocuments(applicantId),
  });

  const documents = data?.data ?? [];

  const uploadMutation = useMutation({
    mutationFn: () => applicantsService.uploadDocument(applicantId, selectedFile!, uploadDocName, uploadCategory),
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['applicant-documents', applicantId] });
      setUploadOpen(false); setSelectedFile(null); setUploadDocName('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Upload failed'),
  });

  const linkMutation = useMutation({
    mutationFn: () => applicantsService.generateUploadLink(applicantId),
    onSuccess: (res) => { setUploadLink(res.link); setLinkOpen(true); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to generate link'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setFileError(err); setSelectedFile(null); }
    else { setFileError(''); setSelectedFile(file); }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await applicantsService.downloadDocument(applicantId, doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = doc.fileName || doc.docName; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download document'); }
  };

  const docsByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = documents.filter((d) => d.category === cat);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => linkMutation.mutate()} loading={linkMutation.isPending}>
          <Link2 size={14} />Customer Upload Link
        </Button>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload size={14} />Upload Document
        </Button>
      </div>

      {CATEGORIES.map((cat) => (
        <div key={cat}>
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-3">{CATEGORY_LABELS[cat]}</p>
          {docsByCategory[cat].length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {docsByCategory[cat].map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-xl hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-xl signature-gradient flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{doc.docName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${doc.status === 'uploaded' ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                        {doc.status}
                      </span>
                      {doc.fileSizeBytes && <span className="text-xs text-on-surface-variant/50">{fileSizeLabel(doc.fileSizeBytes)}</span>}
                      {doc.uploadedAt && <span className="text-xs text-on-surface-variant/50">{formatDate(doc.uploadedAt)}</span>}
                    </div>
                  </div>
                  {doc.status === 'uploaded' && (
                    <button className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-all" onClick={() => handleDownload(doc)}>
                      <Download size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant/50 py-2">No {CATEGORY_LABELS[cat].toLowerCase()} uploaded.</p>
          )}
        </div>
      ))}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Document Name *</label>
              <Input className="mt-1" placeholder="e.g. Aadhaar Card" value={uploadDocName} onChange={(e) => setUploadDocName(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Category *</label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">File *</label>
              <div
                className={`mt-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${selectedFile ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:border-primary/50'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <p className="text-sm font-bold text-primary">{selectedFile.name}</p>
                ) : (
                  <>
                    <Upload size={32} className="text-on-surface-variant/30 mx-auto mb-2" />
                    <p className="text-sm text-on-surface-variant/60">Click to select file</p>
                    <p className="text-xs text-on-surface-variant/40 mt-1">PDF, JPG, PNG — max 2MB</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
              {fileError && <p className="text-xs text-error mt-1">{fileError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button disabled={!selectedFile || !uploadDocName} loading={uploadMutation.isPending} onClick={() => uploadMutation.mutate()}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Link Dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Customer Upload Link</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant/70">Share this link with the customer to allow them to upload documents. Valid for 24 hours.</p>
            <div className="flex gap-2">
              <Input value={uploadLink} readOnly className="font-mono text-xs" />
              <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(uploadLink); toast.success('Link copied!'); }}>Copy</Button>
            </div>
          </div>
          <DialogFooter><Button onClick={() => setLinkOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

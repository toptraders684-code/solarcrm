import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, FileText, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface DocumentsTabProps {
  applicantId: string;
}

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

  const { data, isLoading } = useQuery({
    queryKey: ['applicant-documents', applicantId],
    queryFn: () => applicantsService.getDocuments(applicantId),
  });

  const documents = data?.data ?? [];

  const uploadMutation = useMutation({
    mutationFn: () => applicantsService.uploadDocument(applicantId, selectedFile!, uploadDocName, uploadCategory),
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['applicant-documents', applicantId] });
      setUploadOpen(false);
      setSelectedFile(null);
      setUploadDocName('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Upload failed');
    },
  });

  const linkMutation = useMutation({
    mutationFn: () => applicantsService.generateUploadLink(applicantId),
    onSuccess: (res) => {
      setUploadLink(res.link);
      setLinkOpen(true);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to generate link');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setFileError(err);
      setSelectedFile(null);
    } else {
      setFileError('');
      setSelectedFile(file);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await applicantsService.downloadDocument(applicantId, doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || doc.docName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download document');
    }
  };

  const docsByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = documents.filter((d) => d.category === cat);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => linkMutation.mutate()} disabled={linkMutation.isPending}>
          {linkMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Link2 className="w-4 h-4 mr-1" />}
          Customer Upload Link
        </Button>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="w-4 h-4 mr-1" />
          Upload Document
        </Button>
      </div>

      {CATEGORIES.map((cat) => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{CATEGORY_LABELS[cat]}</h3>
          {docsByCategory[cat].length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {docsByCategory[cat].map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:border-brand-300 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.docName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={doc.status === 'uploaded' ? 'success' : 'warning'} className="text-xs">
                        {doc.status}
                      </Badge>
                      {doc.fileSizeBytes && (
                        <span className="text-xs text-muted-foreground">{fileSizeLabel(doc.fileSizeBytes)}</span>
                      )}
                      {doc.uploadedAt && (
                        <span className="text-xs text-muted-foreground">{formatDate(doc.uploadedAt)}</span>
                      )}
                    </div>
                  </div>
                  {doc.status === 'uploaded' && (
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No {CATEGORY_LABELS[cat].toLowerCase()} uploaded.</p>
          )}
        </div>
      ))}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Document Name *</Label>
              <Input
                placeholder="e.g. Aadhaar Card"
                value={uploadDocName}
                onChange={(e) => setUploadDocName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>File *</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-brand-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <p className="text-sm font-medium text-brand-600">{selectedFile.name}</p>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to select file</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG — max 2MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />
              {fileError && <p className="text-xs text-destructive">{fileError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedFile || !uploadDocName || uploadMutation.isPending}
              onClick={() => uploadMutation.mutate()}
            >
              {uploadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Link Dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer Upload Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share this link with the customer to allow them to upload their documents. Valid for 24 hours.
            </p>
            <div className="flex gap-2">
              <Input value={uploadLink} readOnly className="font-mono text-xs" />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(uploadLink);
                  toast.success('Link copied!');
                }}
              >
                Copy
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setLinkOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

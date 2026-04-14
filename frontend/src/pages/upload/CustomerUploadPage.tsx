import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sun, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { validateFile } from '@/utils/validators';
import { fileSizeLabel } from '@/utils/formatters';
import axios from 'axios';

export default function CustomerUploadPage() {
  const { token } = useParams<{ token: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setFileError(err); setSelectedFile(null); }
    else { setFileError(''); setSelectedFile(file); }
  };

  const handleUpload = async () => {
    if (!selectedFile || !consent || !token) return;
    setUploading(true); setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('consent', 'true');
      await axios.post(`/api/v1/upload/${token}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploaded(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Upload failed. The link may have expired.';
      setUploadError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setUploading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl p-10 text-center">
          <div className="w-16 h-16 signature-gradient rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-on-surface font-headline">Upload Successful!</h2>
          <p className="text-on-surface-variant/70 mt-2 text-sm">
            Your document has been uploaded successfully. Our team will review it shortly.
          </p>
          <p className="text-xs text-on-surface-variant/40 mt-4">You may now close this window.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full signature-gradient opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full signature-gradient opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 signature-gradient rounded-2xl mb-3 shadow-lg">
            <Sun size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tighter font-headline">Suryam CRM</h1>
          <p className="text-sm text-on-surface-variant/60">Secure Document Upload</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-8 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-on-surface font-headline">Upload Your Document</h2>
          </div>

          <div className="bg-secondary-container/30 rounded-xl p-4">
            <p className="text-sm text-on-secondary-fixed-variant">
              This is a secure link shared by Suryam Solar for you to upload your KYC or supporting documents. Your documents are encrypted and stored securely.
            </p>
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3">
            <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" />
            <label htmlFor="consent" className="text-sm text-on-surface-variant leading-relaxed cursor-pointer">
              I consent to Suryam Solar storing my uploaded document for the purpose of processing my solar rooftop installation application. I understand this data will be kept securely and used only for this purpose.
            </label>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              !consent ? 'opacity-50 cursor-not-allowed border-outline-variant/30' :
              selectedFile ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:border-primary/50'
            }`}
            onClick={() => consent && fileInputRef.current?.click()}
          >
            {selectedFile ? (
              <div>
                <div className="w-10 h-10 signature-gradient rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle size={20} className="text-white" />
                </div>
                <p className="text-sm font-bold text-primary">{selectedFile.name}</p>
                <p className="text-xs text-on-surface-variant/60 mt-1">{fileSizeLabel(selectedFile.size)}</p>
                <button className="text-xs text-on-surface-variant/50 hover:text-error mt-2 underline"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>Remove</button>
              </div>
            ) : (
              <>
                <Upload size={36} className="text-on-surface-variant/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-on-surface-variant">
                  {consent ? 'Click to select file' : 'Accept consent to upload'}
                </p>
                <p className="text-xs text-on-surface-variant/50 mt-1">PDF, JPG, PNG — maximum 2MB</p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />

          {fileError && (
            <p className="text-xs text-error flex items-center gap-1"><AlertCircle size={12} />{fileError}</p>
          )}
          {uploadError && (
            <div className="bg-error-container/20 rounded-xl p-3">
              <p className="text-sm text-error flex items-center gap-2"><AlertCircle size={16} />{uploadError}</p>
            </div>
          )}

          <Button className="w-full" disabled={!consent || !selectedFile} loading={uploading} onClick={handleUpload}>
            <Upload size={16} />Upload Document
          </Button>
        </div>

        <p className="text-center text-xs text-on-surface-variant/40 mt-4">
          This link is valid for 24 hours and can only be used once.
        </p>
      </div>
    </div>
  );
}

import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sun, Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    if (err) {
      setFileError(err);
      setSelectedFile(null);
    } else {
      setFileError('');
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !consent || !token) return;
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('consent', 'true');
      await axios.post(`/api/v1/upload/${token}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
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
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardContent className="pt-10 pb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-headline font-bold text-gray-900">Upload Successful!</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Your document has been uploaded successfully. Our team will review it shortly.
            </p>
            <p className="text-xs text-muted-foreground mt-4">You may now close this window.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-2xl mb-3">
            <Sun className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-headline font-bold text-gray-900">Suryam CRM</h1>
          <p className="text-sm text-muted-foreground">Secure Document Upload</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-lg">Upload Your Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                This is a secure link shared by Suryam Solar for you to upload your KYC or supporting documents.
                Your documents are encrypted and stored securely.
              </p>
            </div>

            {/* Consent */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(v) => setConsent(!!v)}
                className="mt-0.5"
              />
              <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                I consent to Suryam Solar storing my uploaded document for the purpose of processing my solar rooftop installation application. I understand this data will be kept securely and used only for this purpose.
              </Label>
            </div>

            {/* File Upload */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                consent ? 'hover:border-brand-400' : 'opacity-50 cursor-not-allowed'
              } ${selectedFile ? 'border-brand-400 bg-brand-50' : 'border-gray-200'}`}
              onClick={() => consent && fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div>
                  <CheckCircle className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-brand-700">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{fileSizeLabel(selectedFile.size)}</p>
                  <button
                    className="text-xs text-muted-foreground hover:text-red-500 mt-2 underline"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">
                    {consent ? 'Click to select file' : 'Accept consent to upload'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG — maximum 2MB</p>
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
            {fileError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fileError}
              </p>
            )}

            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {uploadError}
                </p>
              </div>
            )}

            <Button
              className="w-full"
              disabled={!consent || !selectedFile || uploading}
              onClick={handleUpload}
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Upload Document</>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          This link is valid for 24 hours and can only be used once.
        </p>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { X, Circle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface CameraCaptureProps {
  open: boolean;
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCapture({ open, onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setReady(false);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => {
        setError('Camera access denied or not available. Use "File" to upload from gallery instead.');
      });

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  const handleClose = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onClose();
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        handleClose();
      },
      'image/jpeg',
      0.92,
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        {error ? (
          <div className="p-10 flex flex-col items-center text-center gap-3">
            <p className="text-sm text-on-surface-variant/60 leading-relaxed">{error}</p>
            <button
              onClick={handleClose}
              className="px-5 py-2 rounded-xl bg-surface-container text-sm font-semibold text-on-surface"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-[70vh] object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-8">
              <button
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X size={18} />
              </button>
              <button
                onClick={handleCapture}
                disabled={!ready}
                className="w-16 h-16 flex items-center justify-center rounded-full bg-white hover:bg-white/90 disabled:opacity-40 transition-all shadow-lg"
                title="Take photo"
              >
                <Circle size={28} className="text-black fill-black" />
              </button>
              <div className="w-10" />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

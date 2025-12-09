import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface CameraFeedProps {
  onFrameCapture?: (base64: string) => void;
  isActive: boolean;
}

export interface CameraHandle {
  capture: () => string | null;
}

const CameraFeed = forwardRef<CameraHandle, CameraFeedProps>(({ isActive }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    capture: () => {
      if (!videoRef.current) return null;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoRef.current, 0, 0);
      // Remove data:image/jpeg;base64, prefix for API
      return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
    }
  }));

  useEffect(() => {
    if (isActive) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Camera access denied:", err));
    } else {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [isActive]);

  // Hidden video element, usually we analyze frames without showing them to save battery/screen
  // But for user assurance, we show a tiny preview or hide it completely based on props.
  // Here we hide it for the "Silent Companion" feel, but keep it in DOM.
  return (
    <div className="fixed top-0 left-0 w-1 h-1 opacity-0 overflow-hidden pointer-events-none">
      <video ref={videoRef} autoPlay playsInline muted />
    </div>
  );
});

export default CameraFeed;
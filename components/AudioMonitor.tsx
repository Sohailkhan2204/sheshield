import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface AudioMonitorProps {
  isActive: boolean;
}

export interface AudioHandle {
  getLatestAudio: () => Promise<string | null>;
}

const AudioMonitor = forwardRef<AudioHandle, AudioMonitorProps>(({ isActive }, ref) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useImperativeHandle(ref, () => ({
    getLatestAudio: async () => {
      // Returns the last chunk as base64
      if (chunksRef.current.length === 0) return null;
      
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      chunksRef.current = []; // Clear buffer after reading
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    }
  }));

  useEffect(() => {
    if (isActive) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunksRef.current.push(e.data);
              // Keep buffer small (approx last 5 seconds)
              if (chunksRef.current.length > 5) chunksRef.current.shift();
            }
          };

          recorder.start(1000); // Collect 1-second chunks
          mediaRecorderRef.current = recorder;
        })
        .catch(err => console.error("Microphone access denied:", err));
    } else {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    }
  }, [isActive]);

  return null; // Invisible component
});

export default AudioMonitor;
import { useState, useRef, useCallback, useEffect } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const createSyntheticCameraStream = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    let raf = 0;
    const draw = () => {
      const t = Date.now() / 1000;

      ctx.fillStyle = '#0b1020';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(35, 179, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // A moving waveform so captured frames are not static
      ctx.strokeStyle = '#23b3ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 8) {
        const y = canvas.height * 0.55 + Math.sin((x / 65) + t * 3) * 35 + Math.sin((x / 12) + t * 8) * 4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = '#8ee6ff';
      ctx.font = '28px monospace';
      ctx.fillText('ICU RM-12 • DEMO CAMERA FEED', 30, 46);
      ctx.font = '22px monospace';
      ctx.fillText(new Date().toLocaleTimeString(), 30, 82);

      raf = requestAnimationFrame(draw);
    };

    draw();

    const stream = canvas.captureStream(15);
    const [track] = stream.getVideoTracks();
    if (track) {
      track.addEventListener('ended', () => cancelAnimationFrame(raf));
    }
    return stream;
  }, []);

  const start = useCallback(async () => {
    setStatus('requesting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('active');
    } catch (err: any) {
      // Fallback to a synthetic stream so AI analysis can still run in restricted environments.
      const synthetic = createSyntheticCameraStream();
      if (synthetic) {
        streamRef.current = synthetic;
        if (videoRef.current) {
          videoRef.current.srcObject = synthetic;
        }
        setError('Physical camera unavailable. Running synthetic demo feed.');
        setStatus('active');
        return;
      }

      const msg = err.name === 'NotAllowedError'
        ? 'Camera access denied. Please allow camera permissions.'
        : err.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : `Camera error: ${err.message}`;
      setError(msg);
      setStatus('error');
    }
  }, [createSyntheticCameraStream]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return { videoRef, status, error, start, stop };
}

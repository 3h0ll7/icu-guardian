import { Video, VideoOff, Camera, AlertTriangle } from 'lucide-react';
import type { CameraStatus } from '@/hooks/useCamera';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  status: CameraStatus;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

export default function CameraFeed({ videoRef, status, error, onStart, onStop }: CameraFeedProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="aspect-video bg-secondary/50 relative flex items-center justify-center">
        {/* Live video element — always rendered, hidden when inactive */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${status === 'active' ? 'block' : 'hidden'}`}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/50 pointer-events-none" />

        {/* Top-left: recording indicator */}
        {status === 'active' && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <div className="h-2 w-2 rounded-full bg-vital-critical pulse-dot" />
            <span className="text-[10px] font-mono text-vital-critical">● REC</span>
          </div>
        )}

        {/* Top-right: room label */}
        <div className="absolute top-3 right-3 text-[10px] font-mono text-muted-foreground z-10">
          ICU RM-12 • CAM-01
        </div>

        {/* Scan line effect when active */}
        {status === 'active' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            <div className="w-full h-px bg-accent/20 scan-line" />
          </div>
        )}

        {/* Idle state */}
        {status === 'idle' && (
          <button
            onClick={onStart}
            className="z-10 flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="h-16 w-16 rounded-full border-2 border-accent/40 flex items-center justify-center group-hover:border-accent group-hover:bg-accent/10 transition-all">
              <Video className="h-7 w-7 text-accent/60 group-hover:text-accent transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Start Live Camera
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              Click to connect ICU room camera
            </p>
          </button>
        )}

        {/* Requesting permission */}
        {status === 'requesting' && (
          <div className="z-10 flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full border-2 border-accent/40 flex items-center justify-center animate-pulse">
              <Camera className="h-7 w-7 text-accent/60" />
            </div>
            <p className="text-xs text-muted-foreground">Requesting camera access…</p>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="z-10 flex flex-col items-center gap-2 max-w-xs text-center">
            <div className="h-16 w-16 rounded-full border-2 border-destructive/40 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive/70" />
            </div>
            <p className="text-xs text-destructive">{error}</p>
            <button
              onClick={onStart}
              className="text-[10px] text-accent hover:underline mt-1"
            >
              Try again
            </button>
          </div>
        )}

        {/* Stop button when active */}
        {status === 'active' && (
          <button
            onClick={onStop}
            className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/20 hover:bg-destructive/30 text-destructive text-[10px] font-medium uppercase tracking-wider transition-colors"
          >
            <VideoOff className="h-3 w-3" />
            Stop
          </button>
        )}
      </div>
    </div>
  );
}

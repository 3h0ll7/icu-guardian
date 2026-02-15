import { Camera, Wifi, WifiOff, Eye, EyeOff, Sun, SunDim, Users } from 'lucide-react';
import type { SceneContext, SystemHealth } from '@/types/icu';

interface StatusBarProps {
  scene: SceneContext;
  health: SystemHealth;
}

function StatusChip({ icon: Icon, label, ok }: { icon: React.ElementType; label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider ${
      ok ? 'bg-vital-normal/10 text-vital-normal' : 'bg-vital-critical/10 text-vital-critical'
    }`}>
      <Icon className="h-3 w-3" />
      {label}
    </div>
  );
}

export default function StatusBar({ scene, health }: StatusBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusChip
        icon={health.cameraConnected ? Wifi : WifiOff}
        label={health.cameraConnected ? 'Camera Online' : 'Camera Offline'}
        ok={health.cameraConnected}
      />
      <StatusChip
        icon={scene.monitorVisible ? Eye : EyeOff}
        label={scene.monitorVisible ? 'Monitor Visible' : 'Monitor Blocked'}
        ok={scene.monitorVisible}
      />
      <StatusChip
        icon={scene.lightingAdequate ? Sun : SunDim}
        label={scene.lightingAdequate ? 'Lighting OK' : 'Low Light'}
        ok={scene.lightingAdequate}
      />
      {scene.staffPresent && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider bg-vital-info/10 text-vital-info">
          <Users className="h-3 w-3" />
          Staff Present
        </div>
      )}
      <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
        <Camera className="h-3 w-3" />
        {health.analysisDelayMs}ms
      </div>
    </div>
  );
}

import { Droplet, AlertTriangle, Clock, Pause, Play, AlertCircle } from 'lucide-react';
import type { InfusionPump } from '@/types/icu';

const statusConfig = {
  running: { color: 'text-vital-normal', icon: Play, label: 'Running', bg: 'bg-vital-normal/10' },
  paused: { color: 'text-vital-warning', icon: Pause, label: 'Paused', bg: 'bg-vital-warning/10' },
  alarm: { color: 'text-vital-critical', icon: AlertTriangle, label: 'Alarm', bg: 'bg-vital-critical/10' },
  completed: { color: 'text-muted-foreground', icon: AlertCircle, label: 'Completed', bg: 'bg-muted/50' },
  unknown: { color: 'text-muted-foreground', icon: AlertCircle, label: 'Unknown', bg: 'bg-muted/50' },
};

function PumpCard({ pump }: { pump: InfusionPump }) {
  const config = statusConfig[pump.status];
  const StatusIcon = config.icon;
  const volumePercent = pump.volumeRemaining && pump.volumeTotal
    ? (pump.volumeRemaining / pump.volumeTotal) * 100
    : 0;
  const isLow = pump.volumeRemaining !== null && pump.volumeRemaining <= 10;
  const barColor = isLow ? 'bg-vital-critical' : volumePercent < 20 ? 'bg-vital-warning' : 'bg-vital-normal';

  return (
    <div className={`rounded-lg border border-border bg-card p-3 ${isLow ? 'glow-red border-destructive/50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Droplet className={`h-4 w-4 ${config.color}`} />
          <span className="text-sm font-semibold text-card-foreground">{pump.label}</span>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${config.bg} ${config.color}`}>
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-2">{pump.medication}</p>

      {pump.flowRate !== null && (
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-lg font-bold text-card-foreground">{pump.flowRate}</span>
          <span className="text-xs text-muted-foreground">{pump.flowRateUnit}</span>
        </div>
      )}

      {/* Volume bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Remaining</span>
          <span className={`font-mono ${isLow ? 'text-vital-critical font-bold' : ''}`}>
            {pump.volumeRemaining ?? '--'} / {pump.volumeTotal ?? '--'} mL
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: `${volumePercent}%` }}
          />
        </div>
      </div>

      {pump.estimatedTimeRemaining !== null && pump.status === 'running' && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {pump.estimatedTimeRemaining < 60
              ? `${pump.estimatedTimeRemaining} min remaining`
              : `${Math.floor(pump.estimatedTimeRemaining / 60)}h ${pump.estimatedTimeRemaining % 60}m remaining`}
          </span>
        </div>
      )}

      {isLow && (
        <div className="mt-2 flex items-center gap-1 text-vital-critical">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-[10px] font-semibold uppercase tracking-wider pulse-dot">Low Volume Alert</span>
        </div>
      )}

      {pump.alarmMessage && (
        <p className="mt-1 text-[10px] text-vital-warning italic">{pump.alarmMessage}</p>
      )}
    </div>
  );
}

export default function InfusionPanel({ pumps }: { pumps: InfusionPump[] }) {
  return (
    <div className="space-y-3">
      <h2 className="panel-header flex items-center gap-2">
        <Droplet className="h-4 w-4 text-vital-info" />
        Infusion Pumps
      </h2>
      <div className="space-y-3">
        {pumps.map((pump) => (
          <PumpCard key={pump.id} pump={pump} />
        ))}
      </div>
    </div>
  );
}

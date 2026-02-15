import { User, AlertTriangle } from 'lucide-react';
import type { PatientStatus, PatientPosture, ActivityLevel } from '@/types/icu';

// SVG posture silhouettes
function PostureIcon({ posture, active }: { posture: PatientPosture; active: boolean }) {
  const color = active ? 'hsl(var(--vital-info))' : 'hsl(var(--muted-foreground))';
  const opacity = active ? 1 : 0.3;

  const icons: Record<string, JSX.Element> = {
    supine: (
      <svg viewBox="0 0 80 30" className="w-16 h-8" style={{ opacity }}>
        <ellipse cx="12" cy="15" rx="6" ry="6" fill={color} />
        <rect x="18" y="11" width="30" height="8" rx="4" fill={color} />
        <line x1="48" y1="13" x2="65" y2="20" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1="48" y1="17" x2="65" y2="24" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1="18" y1="13" x2="10" y2="6" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <line x1="18" y1="17" x2="10" y2="24" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    prone: (
      <svg viewBox="0 0 80 30" className="w-16 h-8" style={{ opacity }}>
        <ellipse cx="12" cy="15" rx="6" ry="6" fill={color} />
        <rect x="18" y="11" width="30" height="8" rx="4" fill={color} />
        <line x1="48" y1="15" x2="68" y2="15" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1="48" y1="15" x2="65" y2="22" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1="15" y1="11" x2="8" y2="5" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <line x1="15" y1="19" x2="8" y2="25" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    side: (
      <svg viewBox="0 0 50 50" className="w-12 h-12" style={{ opacity }}>
        <circle cx="25" cy="10" r="6" fill={color} />
        <line x1="25" y1="16" x2="25" y2="32" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1="25" y1="32" x2="18" y2="44" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1="25" y1="32" x2="32" y2="38" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1="25" y1="22" x2="15" y2="18" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <line x1="25" y1="22" x2="35" y2="26" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    sitting: (
      <svg viewBox="0 0 50 55" className="w-12 h-14" style={{ opacity }}>
        <circle cx="25" cy="8" r="6" fill={color} />
        <line x1="25" y1="14" x2="25" y2="30" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1="25" y1="30" x2="25" y2="45" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1="25" y1="45" x2="18" y2="52" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1="25" y1="45" x2="32" y2="52" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1="25" y1="20" x2="15" y2="26" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <line x1="25" y1="20" x2="35" y2="26" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    unknown: (
      <svg viewBox="0 0 40 40" className="w-10 h-10" style={{ opacity }}>
        <circle cx="20" cy="20" r="14" stroke={color} strokeWidth="2" fill="none" strokeDasharray="4 3" />
        <text x="20" y="25" textAnchor="middle" fill={color} fontSize="16" fontFamily="monospace">?</text>
      </svg>
    ),
  };

  return icons[posture] || icons.unknown;
}

// Activity meter
function ActivityMeter({ level }: { level: ActivityLevel }) {
  const config: Record<ActivityLevel, { bars: number; color: string; label: string }> = {
    calm: { bars: 1, color: 'bg-vital-normal', label: 'Calm' },
    restless: { bars: 2, color: 'bg-vital-warning', label: 'Restless' },
    agitated: { bars: 3, color: 'bg-vital-critical', label: 'Agitated' },
    unknown: { bars: 0, color: 'bg-muted-foreground', label: 'Unknown' },
  };

  const c = config[level];

  return (
    <div className="space-y-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Activity</span>
      <div className="flex items-end gap-1 h-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3 rounded-sm transition-all duration-500 ${
              i <= c.bars ? c.color : 'bg-secondary'
            } ${i <= c.bars && level === 'agitated' ? 'pulse-dot' : ''}`}
            style={{ height: `${i * 8 + 4}px` }}
          />
        ))}
      </div>
      <span className={`text-xs font-semibold ${
        level === 'calm' ? 'text-vital-normal' : level === 'restless' ? 'text-vital-warning' : level === 'agitated' ? 'text-vital-critical' : 'text-muted-foreground'
      }`}>
        {c.label}
      </span>
    </div>
  );
}

const allPostures: PatientPosture[] = ['supine', 'prone', 'side', 'sitting'];

export default function PatientStatusPanel({ status }: { status: PatientStatus }) {
  return (
    <div className="space-y-3">
      <h2 className="panel-header flex items-center gap-2">
        <User className="h-4 w-4 text-vital-info" />
        Patient Status
      </h2>

      <div className="rounded-lg border border-border bg-card p-4">
        {/* Posture icons */}
        <div className="mb-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Detected Posture</span>
          <div className="flex items-center gap-4 mt-2">
            {allPostures.map((p) => (
              <div key={p} className="flex flex-col items-center gap-1">
                <div className={`rounded-lg p-1 ${status.posture === p ? 'bg-accent/10 ring-1 ring-accent/40' : ''}`}>
                  <PostureIcon posture={p} active={status.posture === p} />
                </div>
                <span className={`text-[9px] capitalize ${
                  status.posture === p ? 'text-accent font-semibold' : 'text-muted-foreground'
                }`}>
                  {p}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity meter */}
        <div className="mb-3">
          <ActivityMeter level={status.activityLevel} />
        </div>

        {/* Movement description */}
        <p className="text-xs text-muted-foreground">{status.movementDescription}</p>

        {/* Risk events */}
        {status.riskEvents.length > 0 && (
          <div className="mt-3 space-y-1">
            {status.riskEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-1 text-vital-critical text-xs">
                <AlertTriangle className="h-3 w-3" />
                {event}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

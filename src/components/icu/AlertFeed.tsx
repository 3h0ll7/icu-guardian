import { Bell, Check, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { MonitoringEvent } from '@/types/icu';

const priorityConfig = {
  critical: { icon: AlertTriangle, color: 'text-vital-critical', bg: 'bg-vital-critical/10', border: 'border-vital-critical/30' },
  warning: { icon: AlertCircle, color: 'text-vital-warning', bg: 'bg-vital-warning/10', border: 'border-vital-warning/30' },
  info: { icon: Info, color: 'text-vital-info', bg: 'bg-vital-info/10', border: 'border-vital-info/30' },
};

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

interface AlertFeedProps {
  events: MonitoringEvent[];
  onAcknowledge: (id: string) => void;
}

export default function AlertFeed({ events, onAcknowledge }: AlertFeedProps) {
  return (
    <div className="space-y-3">
      <h2 className="panel-header flex items-center gap-2">
        <Bell className="h-4 w-4 text-vital-info" />
        Alert Feed
        {events.filter(e => !e.acknowledged).length > 0 && (
          <span className="ml-auto flex items-center justify-center h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
            {events.filter(e => !e.acknowledged).length}
          </span>
        )}
      </h2>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {events.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">No alerts</div>
        )}
        {events.map((event) => {
          const config = priorityConfig[event.priority];
          const PriorityIcon = config.icon;

          return (
            <div
              key={event.id}
              className={`rounded-lg border p-3 transition-all duration-300 ${
                event.acknowledged
                  ? 'border-border bg-card opacity-50'
                  : `${config.border} ${config.bg}`
              }`}
            >
              <div className="flex items-start gap-2">
                <PriorityIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>
                      {event.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-card-foreground">{event.message}</p>
                </div>
                {!event.acknowledged && (
                  <button
                    onClick={() => onAcknowledge(event.id)}
                    className="flex-shrink-0 h-6 w-6 rounded-md bg-secondary hover:bg-accent/20 flex items-center justify-center transition-colors"
                    title="Acknowledge"
                  >
                    <Check className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

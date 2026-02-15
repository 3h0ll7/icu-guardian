import { Heart, Thermometer, Wind, Activity, Droplets } from 'lucide-react';
import type { VitalsData, VitalSign } from '@/types/icu';

const statusColorMap = {
  normal: 'text-vital-normal',
  warning: 'text-vital-warning',
  critical: 'text-vital-critical',
  unknown: 'text-muted-foreground',
};

const statusGlowMap = {
  normal: '',
  warning: 'glow-amber',
  critical: 'glow-red',
  unknown: '',
};

const trendArrow = {
  rising: '↑',
  falling: '↓',
  stable: '→',
};

function VitalCard({ vital, icon: Icon, large }: { vital: VitalSign; icon: React.ElementType; large?: boolean }) {
  const color = statusColorMap[vital.status];
  const glow = statusGlowMap[vital.status];

  return (
    <div className={`rounded-lg border border-border bg-card p-3 ${glow} transition-shadow duration-500`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="panel-header">{vital.label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`${large ? 'vital-reading' : 'font-mono text-2xl font-bold'} ${color}`}>
          {vital.value !== null ? vital.value : '--'}
        </span>
        <span className="text-xs text-muted-foreground">{vital.unit}</span>
        {vital.trend && (
          <span className={`text-sm ml-1 ${color}`}>{trendArrow[vital.trend]}</span>
        )}
      </div>
      {vital.status === 'critical' && (
        <div className="mt-1 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-destructive pulse-dot" />
          <span className="text-[10px] text-destructive font-medium uppercase tracking-wider">Critical</span>
        </div>
      )}
      {vital.status === 'warning' && (
        <div className="mt-1 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-warning pulse-dot" />
          <span className="text-[10px] text-warning font-medium uppercase tracking-wider">Warning</span>
        </div>
      )}
    </div>
  );
}

export default function VitalsPanel({ vitals }: { vitals: VitalsData }) {
  return (
    <div className="space-y-3">
      <h2 className="panel-header flex items-center gap-2">
        <Activity className="h-4 w-4 text-vital-info" />
        Vital Signs Monitor
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <VitalCard vital={vitals.heartRate} icon={Heart} large />
        <VitalCard vital={vitals.spO2} icon={Droplets} large />
        <VitalCard
          vital={{
            label: 'Blood Pressure',
            value: vitals.systolicBP.value,
            unit: vitals.systolicBP.value && vitals.diastolicBP.value
              ? `${vitals.systolicBP.value}/${vitals.diastolicBP.value} mmHg`
              : 'mmHg',
            status: vitals.systolicBP.status === 'critical' || vitals.diastolicBP.status === 'critical'
              ? 'critical'
              : vitals.systolicBP.status === 'warning' || vitals.diastolicBP.status === 'warning'
              ? 'warning'
              : 'normal',
            trend: vitals.systolicBP.trend,
          }}
          icon={Activity}
        />
        <VitalCard vital={vitals.respiratoryRate} icon={Wind} />
        <VitalCard vital={vitals.temperature} icon={Thermometer} />
      </div>
    </div>
  );
}

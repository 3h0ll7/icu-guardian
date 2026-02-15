import { useEffect, useMemo, useRef, useState, type ElementType } from 'react';
import { Heart, Thermometer, Wind, Activity, Droplets } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import type { VitalsData, VitalSign, VitalTrendPoint } from '@/types/icu';

type VitalCardKey = 'heartRate' | 'spO2' | 'bloodPressure' | 'respiratoryRate' | 'temperature';

type VitalCardModel = {
  key: VitalCardKey;
  vital: VitalSign;
  icon: ElementType;
  large?: boolean;
};

type TimestampByKey = Record<VitalCardKey, Date>;
type SignatureByKey = Record<VitalCardKey, string>;

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

const chartConfig = {
  heartRate: { label: 'HR (bpm)', color: 'hsl(var(--chart-1))' },
  spO2: { label: 'SpO₂ (%)', color: 'hsl(var(--chart-2))' },
  bloodPressure: { label: 'BP (mmHg)', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

function getVitalSignature(vital: VitalSign) {
  return `${vital.value ?? 'null'}:${vital.status}:${vital.trend ?? 'none'}:${vital.unit}`;
}

function getSignatures(vitalsList: VitalCardModel[]): SignatureByKey {
  return vitalsList.reduce((acc, item) => {
    acc[item.key] = getVitalSignature(item.vital);
    return acc;
  }, {} as SignatureByKey);
}

function createInitialTimestamps(): TimestampByKey {
  const initialTime = new Date();
  return {
    heartRate: initialTime,
    spO2: initialTime,
    bloodPressure: initialTime,
    respiratoryRate: initialTime,
    temperature: initialTime,
  };
}

function formatElapsedTime(lastUpdated: Date, now: number) {
  const elapsedSeconds = Math.max(0, Math.floor((now - lastUpdated.getTime()) / 1000));

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s ago`;
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${minutes}m ${seconds}s ago`;
}

function VitalCard({ vital, icon: Icon, large, lastUpdated, now }: { vital: VitalSign; icon: ElementType; large?: boolean; lastUpdated: Date; now: number }) {
  const color = statusColorMap[vital.status];
  const glow = statusGlowMap[vital.status];

  return (
    <div className={`rounded-lg border border-border bg-card p-3 ${glow} transition-shadow duration-500`}>
      <div className="mb-1 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="panel-header">{vital.label}</span>
      </div>
      <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        Updated {formatElapsedTime(lastUpdated, now)}
      </p>
      <div className="flex items-baseline gap-1">
        <span className={`${large ? 'vital-reading' : 'font-mono text-2xl font-bold'} ${color}`}>
          {vital.value !== null ? vital.value : '--'}
        </span>
        <span className="text-xs text-muted-foreground">{vital.unit}</span>
        {vital.trend && <span className={`ml-1 text-sm ${color}`}>{trendArrow[vital.trend]}</span>}
      </div>
      {vital.status === 'critical' && (
        <div className="mt-1 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-destructive pulse-dot" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-destructive">Critical</span>
        </div>
      )}
      {vital.status === 'warning' && (
        <div className="mt-1 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-warning pulse-dot" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-warning">Warning</span>
        </div>
      )}
    </div>
  );
}

export function VitalsTrendChart({ history }: { history: VitalTrendPoint[] }) {
  if (history.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <h3 className="panel-header mb-3">Trend (Recent History)</h3>
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <LineChart accessibilityLayer data={history} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="timestamp" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
          <YAxis yAxisId="primary" tickLine={false} axisLine={false} tickMargin={8} domain={[40, 180]} />
          <YAxis yAxisId="spo2" orientation="right" tickLine={false} axisLine={false} tickMargin={8} domain={[80, 100]} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="line"
                formatter={(value, name) => {
                  const unit = name === 'HR (bpm)' ? 'bpm' : name === 'SpO₂ (%)' ? '%' : 'mmHg';
                  return (
                    <>
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {value} {unit}
                      </span>
                    </>
                  );
                }}
              />
            }
          />
          <Line yAxisId="primary" dataKey="heartRate" type="monotone" stroke="var(--color-heartRate)" strokeWidth={2} dot={false} connectNulls />
          <Line yAxisId="spo2" dataKey="spO2" type="monotone" stroke="var(--color-spO2)" strokeWidth={2} dot={false} connectNulls />
          <Line yAxisId="primary" dataKey="bloodPressure" type="monotone" stroke="var(--color-bloodPressure)" strokeWidth={2} dot={false} connectNulls />
          <ChartLegend content={<ChartLegendContent />} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

export default function VitalsPanel({ vitals }: { vitals: VitalsData }) {
  const vitalsList = useMemo<VitalCardModel[]>(
    () => [
      { key: 'heartRate', vital: vitals.heartRate, icon: Heart, large: true },
      { key: 'spO2', vital: vitals.spO2, icon: Droplets, large: true },
      {
        key: 'bloodPressure',
        vital: {
          label: 'Blood Pressure',
          value: vitals.systolicBP.value,
          unit:
            vitals.systolicBP.value && vitals.diastolicBP.value
              ? `${vitals.systolicBP.value}/${vitals.diastolicBP.value} mmHg`
              : 'mmHg',
          status:
            vitals.systolicBP.status === 'critical' || vitals.diastolicBP.status === 'critical'
              ? 'critical'
              : vitals.systolicBP.status === 'warning' || vitals.diastolicBP.status === 'warning'
                ? 'warning'
                : 'normal',
          trend: vitals.systolicBP.trend,
        },
        icon: Activity,
      },
      { key: 'respiratoryRate', vital: vitals.respiratoryRate, icon: Wind },
      { key: 'temperature', vital: vitals.temperature, icon: Thermometer },
    ],
    [vitals]
  );

  const [lastUpdatedByKey, setLastUpdatedByKey] = useState<TimestampByKey>(createInitialTimestamps);
  const signaturesByKeyRef = useRef<SignatureByKey>(getSignatures(vitalsList));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const nextSignatures = getSignatures(vitalsList);

    setLastUpdatedByKey(prev => {
      const next = { ...prev };
      let changed = false;

      (Object.keys(nextSignatures) as VitalCardKey[]).forEach(key => {
        if (signaturesByKeyRef.current[key] !== nextSignatures[key]) {
          next[key] = new Date();
          changed = true;
        }
      });

      return changed ? next : prev;
    });

    signaturesByKeyRef.current = nextSignatures;
  }, [vitalsList]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="panel-header flex items-center gap-2">
        <Activity className="h-4 w-4 text-vital-info" />
        Vital Signs Monitor
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {vitalsList.map(item => (
          <VitalCard
            key={item.key}
            vital={item.vital}
            icon={item.icon}
            large={item.large}
            lastUpdated={lastUpdatedByKey[item.key]}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}

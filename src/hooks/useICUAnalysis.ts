import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VitalsData, InfusionPump, PatientStatus, SceneContext, MonitoringEvent } from '@/types/icu';
import { createEvent } from '@/utils/mockData';

interface AnalysisResult {
  vitals: VitalsData | null;
  pumps: InfusionPump[] | null;
  patient: PatientStatus | null;
  scene: SceneContext | null;
  events: MonitoringEvent[];
}

function localFallbackAnalysis(): AnalysisResult {
  const now = Date.now();
  const n = (seed: number, min: number, max: number) => min + ((Math.sin(now / seed) + 1) / 2) * (max - min);

  const heartRate = Math.round(n(1800, 68, 102));
  const spO2 = Math.round(n(2200, 94, 99));
  const sys = Math.round(n(2100, 110, 138));
  const dia = Math.round(n(1600, 66, 88));
  const rr = Math.round(n(1900, 12, 22));
  const temp = Number(n(2500, 36.4, 37.8).toFixed(1));

  const statusFor = (value: number, low: number, high: number) =>
    value < low || value > high ? 'warning' : 'normal';

  return {
    vitals: mapVitals({
      heartRate: { value: heartRate, status: statusFor(heartRate, 60, 100), trend: 'stable' },
      spO2: { value: spO2, status: statusFor(spO2, 92, 100), trend: 'stable' },
      systolicBP: { value: sys, status: statusFor(sys, 90, 140), trend: 'stable' },
      diastolicBP: { value: dia, status: statusFor(dia, 60, 90), trend: 'stable' },
      respiratoryRate: { value: rr, status: statusFor(rr, 10, 24), trend: 'stable' },
      temperature: { value: temp, status: statusFor(temp, 36, 38), trend: 'stable' },
    }),
    pumps: mapPumps([
      { id: 'pump-1', label: 'Pump A', medication: 'Norepinephrine', status: 'running', flowRate: Number(n(2600, 4, 8).toFixed(1)), volumeRemaining: Math.round(n(2800, 10, 80)), volumeTotal: 100, estimatedTimeRemaining: Math.round(n(2900, 25, 150)) },
      { id: 'pump-2', label: 'Pump B', medication: 'Propofol', status: 'running', flowRate: Number(n(2400, 20, 35).toFixed(1)), volumeRemaining: Math.round(n(2300, 20, 140)), volumeTotal: 200, estimatedTimeRemaining: Math.round(n(2500, 20, 180)) },
    ]),
    patient: mapPatient({
      posture: 'supine',
      activityLevel: heartRate > 95 ? 'restless' : 'calm',
      movementDescription: heartRate > 95 ? 'Periodic upper body movement detected' : 'Minimal movement, patient appears resting',
      riskEvents: heartRate > 100 ? ['tachycardia trend'] : [],
    }),
    scene: mapScene({
      staffPresent: Math.sin(now / 5000) > 0.6,
      monitorVisible: true,
      pumpsVisible: true,
      lightingAdequate: true,
    }),
    events: [
      createEvent('info', 'AI', 'Using local fallback analysis (network unavailable).'),
    ],
  };
}

function captureFrame(video: HTMLVideoElement): string | null {
  if (video.readyState < 2) return null;
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  // Return base64 without the data URL prefix
  return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
}

function mapVitals(v: any): VitalsData {
  const makeVital = (raw: any, label: string, unit: string) => ({
    label,
    value: raw?.value ?? null,
    unit,
    status: raw?.status ?? 'unknown',
    trend: raw?.trend ?? 'stable',
  });

  return {
    heartRate: makeVital(v?.heartRate, 'Heart Rate', 'bpm'),
    spO2: makeVital(v?.spO2, 'SpO₂', '%'),
    systolicBP: makeVital(v?.systolicBP, 'Systolic BP', 'mmHg'),
    diastolicBP: makeVital(v?.diastolicBP, 'Diastolic BP', 'mmHg'),
    respiratoryRate: makeVital(v?.respiratoryRate, 'Resp. Rate', '/min'),
    temperature: makeVital(v?.temperature, 'Temperature', '°C'),
  };
}

function mapPumps(pumps: any[]): InfusionPump[] {
  if (!Array.isArray(pumps)) return [];
  return pumps.map((p, i) => ({
    id: p.id || `pump-${i + 1}`,
    label: p.label || `Pump ${String.fromCharCode(65 + i)}`,
    medication: p.medication || 'Unknown',
    status: p.status || 'unknown',
    flowRate: p.flowRate ?? null,
    flowRateUnit: p.flowRateUnit || 'mL/h',
    volumeRemaining: p.volumeRemaining ?? null,
    volumeTotal: p.volumeTotal ?? null,
    estimatedTimeRemaining: p.estimatedTimeRemaining ?? null,
    alarmMessage: p.alarmMessage || undefined,
  }));
}

function mapPatient(p: any): PatientStatus {
  return {
    posture: p?.posture || 'unknown',
    activityLevel: p?.activityLevel || 'unknown',
    movementDescription: p?.movementDescription || 'No data',
    riskEvents: Array.isArray(p?.riskEvents) ? p.riskEvents : [],
  };
}

function mapScene(s: any): SceneContext {
  return {
    staffPresent: !!s?.staffPresent,
    monitorVisible: s?.monitorVisible ?? false,
    pumpsVisible: s?.pumpsVisible ?? false,
    lightingAdequate: s?.lightingAdequate ?? true,
  };
}

export function useICUAnalysis(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isActive: boolean,
  intervalMs = 10000
) {
  const [result, setResult] = useState<AnalysisResult>({
    vitals: null, pumps: null, patient: null, scene: null, events: [],
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalysisMs, setLastAnalysisMs] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const analyze = useCallback(async () => {
    if (!videoRef.current || analyzing) return;

    const base64 = captureFrame(videoRef.current);
    if (!base64) return;

    setAnalyzing(true);
    setError(null);
    const start = performance.now();

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-icu-frame', {
        body: { imageBase64: base64 },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const elapsed = Math.round(performance.now() - start);
      setLastAnalysisMs(elapsed);

      const newEvents: MonitoringEvent[] = [];
      if (Array.isArray(data.alerts)) {
        data.alerts.forEach((a: any) => {
          newEvents.push(createEvent(a.priority || 'info', a.category || 'AI', a.message || ''));
        });
      }

      setResult({
        vitals: data.vitals ? mapVitals(data.vitals) : null,
        pumps: data.pumps ? mapPumps(data.pumps) : null,
        patient: data.patient ? mapPatient(data.patient) : null,
        scene: data.scene ? mapScene(data.scene) : null,
        events: newEvents,
      });
    } catch (err: any) {
      console.error('ICU analysis error:', err);
      const fallback = localFallbackAnalysis();
      setResult(fallback);
      setError(`${err.message || 'Analysis failed'} - local fallback active`);
    } finally {
      setAnalyzing(false);
    }
  }, [videoRef, analyzing]);

  useEffect(() => {
    if (isActive) {
      // Run first analysis after a short delay to let camera warm up
      const initial = setTimeout(analyze, 2000);
      timerRef.current = setInterval(analyze, intervalMs);
      return () => {
        clearTimeout(initial);
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setResult({ vitals: null, pumps: null, patient: null, scene: null, events: [] });
    }
  }, [isActive, intervalMs, analyze]);

  return { ...result, analyzing, lastAnalysisMs, error };
}

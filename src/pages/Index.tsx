import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Shield, Brain } from 'lucide-react';
import type { VitalsData, InfusionPump, PatientStatus, SceneContext, MonitoringEvent, SystemHealth, VitalTrendPoint } from '@/types/icu';
import { createMockVitals, createMockPumps, createMockPatientStatus, createMockSceneContext, createMockSystemHealth, createEvent } from '@/utils/mockData';
import VitalsPanel, { VitalsTrendChart } from '@/components/icu/VitalsPanel';
import InfusionPanel from '@/components/icu/InfusionPanel';
import PatientStatusPanel from '@/components/icu/PatientStatusPanel';
import AlertFeed from '@/components/icu/AlertFeed';
import StatusBar from '@/components/icu/StatusBar';
import CameraFeed from '@/components/icu/CameraFeed';
import { useCamera } from '@/hooks/useCamera';
import { useICUAnalysis } from '@/hooks/useICUAnalysis';
import { useCriticalAlertAudio } from '@/hooks/useCriticalAlertAudio';

const Index = () => {
  const { videoRef, status: cameraStatus, error: cameraError, start: startCamera, stop: stopCamera } = useCamera();
  const aiAnalysis = useICUAnalysis(videoRef, cameraStatus === 'active', 10000);
  const { playCriticalAlert, ensureAudioReady, audioReady } = useCriticalAlertAudio();
  const lastAlertSignatureRef = useRef<string>('');

  const [vitals, setVitals] = useState<VitalsData>(createMockVitals());
  const [pumps, setPumps] = useState<InfusionPump[]>(createMockPumps());
  const [patientStatus, setPatientStatus] = useState<PatientStatus>(createMockPatientStatus());
  const [sceneContext, setSceneContext] = useState<SceneContext>(createMockSceneContext());
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(createMockSystemHealth());
  const [vitalHistory, setVitalHistory] = useState<VitalTrendPoint[]>([]);
  const [events, setEvents] = useState<MonitoringEvent[]>([
    createEvent('info', 'System', 'ICU Sentinel AI monitoring started'),
  ]);

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const point: VitalTrendPoint = {
      timestamp,
      heartRate: vitals.heartRate.value,
      spO2: vitals.spO2.value,
      bloodPressure: vitals.systolicBP.value,
    };

    setVitalHistory(prev => [...prev.slice(-23), point]);
  }, [vitals]);

  // When AI analysis returns results, use them instead of mock data
  useEffect(() => {
    if (aiAnalysis.vitals) setVitals(aiAnalysis.vitals);
    if (aiAnalysis.pumps && aiAnalysis.pumps.length > 0) setPumps(aiAnalysis.pumps);
    if (aiAnalysis.patient) setPatientStatus(aiAnalysis.patient);
    if (aiAnalysis.scene) setSceneContext(aiAnalysis.scene);

    // Append AI-generated events
    if (aiAnalysis.events.length > 0) {
      setEvents(prev => [...aiAnalysis.events, ...prev].slice(0, 50));
    }
  }, [aiAnalysis.vitals, aiAnalysis.pumps, aiAnalysis.patient, aiAnalysis.scene, aiAnalysis.events]);

  const handleStartCamera = useCallback(() => {
    // Browser audio often requires a user interaction to unlock playback.
    void ensureAudioReady();
    startCamera();
  }, [ensureAudioReady, startCamera]);

  const criticalEventSignature = useMemo(() => {
    const criticalEvents = aiAnalysis.events.filter(event => event.priority === 'critical');
    return criticalEvents
      .map(event => `${event.category}:${event.message}`)
      .sort()
      .join('|');
  }, [aiAnalysis.events]);

  // Play audio tone once per unique set of critical AI events
  useEffect(() => {
    if (!criticalEventSignature) return;
    if (criticalEventSignature === lastAlertSignatureRef.current) return;

    lastAlertSignatureRef.current = criticalEventSignature;
    void playCriticalAlert();
  }, [criticalEventSignature, playCriticalAlert]);

  // Update system health based on camera + AI status
  useEffect(() => {
    setSystemHealth(prev => ({
      ...prev,
      cameraConnected: cameraStatus === 'active',
      lastAnalysisTime: aiAnalysis.lastAnalysisMs > 0 ? new Date() : prev.lastAnalysisTime,
      analysisDelayMs: aiAnalysis.lastAnalysisMs || prev.analysisDelayMs,
      frozen: false,
    }));
  }, [cameraStatus, aiAnalysis.lastAnalysisMs]);

  // Fallback: simulate updates only when camera is NOT active
  useEffect(() => {
    if (cameraStatus === 'active') return;

    const interval = setInterval(() => {
      setVitals(createMockVitals());
      setSceneContext(createMockSceneContext());
      setSystemHealth(prev => ({ ...prev, ...createMockSystemHealth(), cameraConnected: false }));

      if (Math.random() > 0.7) setPatientStatus(createMockPatientStatus());

      if (Math.random() > 0.8) {
        const types: Array<{ p: MonitoringEvent['priority']; c: string; m: string }> = [
          { p: 'info', c: 'System', m: 'Routine analysis completed — all within range' },
          { p: 'warning', c: 'Vitals', m: 'Heart rate trending upward over last 10 minutes' },
          { p: 'critical', c: 'Infusion', m: 'Pump B volume critically low — nurse notification sent' },
          { p: 'info', c: 'Context', m: 'Staff detected in room — suppressing non-critical alerts' },
          { p: 'warning', c: 'Patient', m: 'Increased patient movement detected' },
        ];
        const t = types[Math.floor(Math.random() * types.length)];
        setEvents(prev => [createEvent(t.p, t.c, t.m), ...prev].slice(0, 50));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [cameraStatus]);

  const handleAcknowledge = useCallback((id: string) => {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, acknowledged: true } : e)));
  }, []);

  const isAiActive = cameraStatus === 'active';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-wide">ICU SENTINEL AI</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Intelligent Monitoring System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAiActive && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/10">
                <Brain className={`h-3.5 w-3.5 text-accent ${aiAnalysis.analyzing ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-mono text-accent uppercase">
                  {aiAnalysis.analyzing ? 'Analyzing…' : 'AI Active'}
                </span>
                <span className={`text-[10px] font-mono ${audioReady ? 'text-vital-normal' : 'text-vital-warning'}`}>
                  {audioReady ? 'Audio Ready' : 'Audio Locked'}
                </span>
              </div>
            )}
            {aiAnalysis.error && (
              <span className="text-[10px] text-destructive font-mono">{aiAnalysis.error}</span>
            )}
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isAiActive ? 'bg-vital-normal' : 'bg-vital-warning'} pulse-dot`} />
              <span className={`text-xs font-mono ${isAiActive ? 'text-vital-normal' : 'text-vital-warning'}`}>
                {isAiActive ? 'LIVE AI' : 'SIMULATED'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Status bar */}
      <div className="border-b border-border px-4 py-2">
        <div className="max-w-[1600px] mx-auto">
          <StatusBar scene={sceneContext} health={systemHealth} />
        </div>
      </div>

      {/* Main dashboard */}
      <main className="max-w-[1600px] mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Camera + Vitals */}
          <div className="lg:col-span-5 space-y-4">
            <CameraFeed
              videoRef={videoRef}
              status={cameraStatus}
              error={cameraError}
              onStart={handleStartCamera}
              onStop={stopCamera}
            />
            <VitalsPanel vitals={vitals} />
            <VitalsTrendChart history={vitalHistory} />
          </div>

          {/* Center: Infusion + Patient */}
          <div className="lg:col-span-4 space-y-4">
            <InfusionPanel pumps={pumps} />
            <PatientStatusPanel status={patientStatus} />
          </div>

          {/* Right: Alerts */}
          <div className="lg:col-span-3">
            <AlertFeed events={events} onAcknowledge={handleAcknowledge} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

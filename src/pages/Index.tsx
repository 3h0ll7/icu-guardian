import { useState, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';
import type { VitalsData, InfusionPump, PatientStatus, SceneContext, MonitoringEvent, SystemHealth } from '@/types/icu';
import { createMockVitals, createMockPumps, createMockPatientStatus, createMockSceneContext, createMockSystemHealth, createEvent } from '@/utils/mockData';
import VitalsPanel from '@/components/icu/VitalsPanel';
import InfusionPanel from '@/components/icu/InfusionPanel';
import PatientStatusPanel from '@/components/icu/PatientStatusPanel';
import AlertFeed from '@/components/icu/AlertFeed';
import StatusBar from '@/components/icu/StatusBar';
import CameraFeed from '@/components/icu/CameraFeed';
import { useCamera } from '@/hooks/useCamera';

const Index = () => {
  const { videoRef, status: cameraStatus, error: cameraError, start: startCamera, stop: stopCamera } = useCamera();
  const [vitals, setVitals] = useState<VitalsData>(createMockVitals());
  const [pumps, setPumps] = useState<InfusionPump[]>(createMockPumps());
  const [patientStatus, setPatientStatus] = useState<PatientStatus>(createMockPatientStatus());
  const [sceneContext, setSceneContext] = useState<SceneContext>(createMockSceneContext());
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(createMockSystemHealth());
  const [events, setEvents] = useState<MonitoringEvent[]>([
    createEvent('info', 'System', 'ICU Sentinel AI monitoring started'),
    createEvent('warning', 'Infusion', 'Pump B: Normal Saline volume low (8 mL remaining)'),
    createEvent('critical', 'Vitals', 'SpO₂ dropped below 94% — monitor closely'),
  ]);

  // Simulate periodic updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(createMockVitals());
      setSceneContext(createMockSceneContext());
      setSystemHealth(prev => ({ ...prev, ...createMockSystemHealth(), cameraConnected: cameraStatus === 'active' }));

      // Occasionally update patient status
      if (Math.random() > 0.7) {
        setPatientStatus(createMockPatientStatus());
      }

      // Occasionally add events
      if (Math.random() > 0.8) {
        const types: Array<{ p: MonitoringEvent['priority']; c: string; m: string }> = [
          { p: 'info', c: 'System', m: 'Routine analysis completed — all within range' },
          { p: 'warning', c: 'Vitals', m: 'Heart rate trending upward over last 10 minutes' },
          { p: 'critical', c: 'Infusion', m: 'Pump B volume critically low — nurse notification sent' },
          { p: 'info', c: 'Context', m: 'Staff detected in room — suppressing non-critical alerts' },
          { p: 'warning', c: 'Patient', m: 'Increased patient movement detected' },
        ];
        const t = types[Math.floor(Math.random() * types.length)];
        setEvents((prev) => [createEvent(t.p, t.c, t.m), ...prev].slice(0, 50));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, acknowledged: true } : e))
    );
  }, []);

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
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-vital-normal pulse-dot" />
            <span className="text-xs text-vital-normal font-mono">LIVE</span>
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
              onStart={startCamera}
              onStop={stopCamera}
            />

            <VitalsPanel vitals={vitals} />
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

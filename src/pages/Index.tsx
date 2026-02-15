import { useState, useEffect, useCallback } from 'react';
import { Shield, Activity } from 'lucide-react';
import type { VitalsData, InfusionPump, PatientStatus, SceneContext, MonitoringEvent, SystemHealth } from '@/types/icu';
import { createMockVitals, createMockPumps, createMockPatientStatus, createMockSceneContext, createMockSystemHealth, createEvent } from '@/utils/mockData';
import VitalsPanel from '@/components/icu/VitalsPanel';
import InfusionPanel from '@/components/icu/InfusionPanel';
import PatientStatusPanel from '@/components/icu/PatientStatusPanel';
import AlertFeed from '@/components/icu/AlertFeed';
import StatusBar from '@/components/icu/StatusBar';

const Index = () => {
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
      setSystemHealth(createMockSystemHealth());

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
            {/* Camera feed placeholder */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="aspect-video bg-secondary/50 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/50" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-vital-critical pulse-dot" />
                  <span className="text-[10px] font-mono text-vital-critical">● REC</span>
                </div>
                <div className="absolute top-3 right-3 text-[10px] font-mono text-muted-foreground">
                  ICU RM-12 • CAM-01
                </div>
                <div className="text-center">
                  <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Camera Feed</p>
                  <p className="text-[10px] text-muted-foreground/60">Connect camera to enable AI analysis</p>
                </div>
                {/* Scan line effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="w-full h-px bg-accent/20 scan-line" />
                </div>
              </div>
            </div>

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

import type { VitalsData, InfusionPump, PatientStatus, SceneContext, MonitoringEvent, SystemHealth } from '@/types/icu';

export function createMockVitals(): VitalsData {
  const hr = 60 + Math.floor(Math.random() * 40);
  const spo2 = 93 + Math.floor(Math.random() * 7);
  const sys = 100 + Math.floor(Math.random() * 40);
  const dia = 60 + Math.floor(Math.random() * 20);
  const rr = 12 + Math.floor(Math.random() * 10);
  const temp = 36.2 + Math.random() * 2.2;

  return {
    heartRate: {
      label: 'Heart Rate',
      value: hr,
      unit: 'bpm',
      status: hr > 100 || hr < 50 ? 'critical' : hr > 90 || hr < 55 ? 'warning' : 'normal',
      trend: 'stable',
    },
    spO2: {
      label: 'SpO₂',
      value: spo2,
      unit: '%',
      status: spo2 < 90 ? 'critical' : spo2 < 94 ? 'warning' : 'normal',
      trend: spo2 < 95 ? 'falling' : 'stable',
    },
    systolicBP: {
      label: 'Systolic BP',
      value: sys,
      unit: 'mmHg',
      status: sys > 140 || sys < 90 ? 'critical' : sys > 130 || sys < 100 ? 'warning' : 'normal',
      trend: 'stable',
    },
    diastolicBP: {
      label: 'Diastolic BP',
      value: dia,
      unit: 'mmHg',
      status: dia > 90 || dia < 60 ? 'warning' : 'normal',
      trend: 'stable',
    },
    respiratoryRate: {
      label: 'Resp. Rate',
      value: rr,
      unit: '/min',
      status: rr > 20 || rr < 10 ? 'critical' : rr > 18 || rr < 12 ? 'warning' : 'normal',
      trend: 'stable',
    },
    temperature: {
      label: 'Temperature',
      value: parseFloat(temp.toFixed(1)),
      unit: '°C',
      status: temp > 38.5 ? 'critical' : temp > 37.5 ? 'warning' : 'normal',
      trend: 'stable',
    },
  };
}

export function createMockPumps(): InfusionPump[] {
  return [
    {
      id: 'pump-1',
      label: 'Pump A',
      medication: 'Norepinephrine',
      status: 'running',
      flowRate: 5.2,
      flowRateUnit: 'mL/h',
      volumeRemaining: 42,
      volumeTotal: 250,
      estimatedTimeRemaining: 485,
    },
    {
      id: 'pump-2',
      label: 'Pump B',
      medication: 'Normal Saline 0.9%',
      status: 'running',
      flowRate: 125,
      flowRateUnit: 'mL/h',
      volumeRemaining: 8,
      volumeTotal: 1000,
      estimatedTimeRemaining: 4,
      alarmMessage: undefined,
    },
    {
      id: 'pump-3',
      label: 'Pump C',
      medication: 'TPN',
      status: 'paused',
      flowRate: 0,
      flowRateUnit: 'mL/h',
      volumeRemaining: 500,
      volumeTotal: 1000,
      estimatedTimeRemaining: null,
      alarmMessage: 'Pump paused by nurse',
    },
  ];
}

export function createMockPatientStatus(): PatientStatus {
  const postures: PatientStatus['posture'][] = ['supine', 'side', 'prone', 'sitting'];
  const activities: PatientStatus['activityLevel'][] = ['calm', 'restless', 'agitated'];
  return {
    posture: postures[Math.floor(Math.random() * postures.length)],
    activityLevel: activities[Math.floor(Math.random() * activities.length)],
    movementDescription: 'Minimal limb movement detected',
    riskEvents: [],
  };
}

export function createMockSceneContext(): SceneContext {
  return {
    staffPresent: Math.random() > 0.7,
    monitorVisible: true,
    pumpsVisible: true,
    lightingAdequate: true,
  };
}

export function createMockSystemHealth(): SystemHealth {
  return {
    cameraConnected: true,
    lastAnalysisTime: new Date(),
    analysisDelayMs: 800 + Math.floor(Math.random() * 400),
    frozen: false,
  };
}

let eventCounter = 0;
export function createEvent(
  priority: MonitoringEvent['priority'],
  category: string,
  message: string
): MonitoringEvent {
  eventCounter++;
  return {
    id: `evt-${eventCounter}-${Date.now()}`,
    timestamp: new Date(),
    priority,
    category,
    message,
    acknowledged: false,
  };
}

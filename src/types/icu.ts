export type VitalStatus = 'normal' | 'warning' | 'critical' | 'unknown';
export type AlertPriority = 'critical' | 'warning' | 'info';
export type PatientPosture = 'supine' | 'prone' | 'side' | 'sitting' | 'unknown';
export type ActivityLevel = 'calm' | 'restless' | 'agitated' | 'unknown';
export type InfusionStatus = 'running' | 'paused' | 'alarm' | 'completed' | 'unknown';

export interface VitalSign {
  label: string;
  value: number | null;
  unit: string;
  status: VitalStatus;
  trend?: 'rising' | 'falling' | 'stable';
}

export interface VitalsData {
  heartRate: VitalSign;
  spO2: VitalSign;
  systolicBP: VitalSign;
  diastolicBP: VitalSign;
  respiratoryRate: VitalSign;
  temperature: VitalSign;
}

export interface InfusionPump {
  id: string;
  label: string;
  medication: string;
  status: InfusionStatus;
  flowRate: number | null;
  flowRateUnit: string;
  volumeRemaining: number | null;
  volumeTotal: number | null;
  estimatedTimeRemaining: number | null; // minutes
  alarmMessage?: string;
}

export interface PatientStatus {
  posture: PatientPosture;
  activityLevel: ActivityLevel;
  movementDescription: string;
  riskEvents: string[];
}

export interface SceneContext {
  staffPresent: boolean;
  monitorVisible: boolean;
  pumpsVisible: boolean;
  lightingAdequate: boolean;
}

export interface MonitoringEvent {
  id: string;
  timestamp: Date;
  priority: AlertPriority;
  category: string;
  message: string;
  acknowledged: boolean;
}

export interface SystemHealth {
  cameraConnected: boolean;
  lastAnalysisTime: Date | null;
  analysisDelayMs: number;
  frozen: boolean;
}

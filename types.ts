export enum RiskLevel {
  SAFE = 'SAFE',
  CAUTION = 'CAUTION',
  DANGER = 'DANGER',
  CRITICAL = 'CRITICAL'
}

export interface RiskAssessment {
  riskLevel: RiskLevel;
  score: number; // 0-100
  reason: string;
  recommendedAction: string;
  detectedThreats: string[];
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface SafePlace {
  name: string;
  address: string;
  distance: string;
  type: string;
  uri?: string;
}

export interface IncidentLog {
  id: string;
  timestamp: string;
  riskLevel: RiskLevel;
  description: string;
}

export interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string };
}
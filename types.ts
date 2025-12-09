export enum RiskLevel {
  SAFE = 'SAFE',
  UNCERTAIN = 'UNCERTAIN',
  SUSPICIOUS = 'SUSPICIOUS',
  DANGEROUS = 'DANGEROUS',
  CRITICAL = 'CRITICAL'
}

export interface AudioAnalysisDetails {
  emotional_state: string;
  distress_score: number;
  keywords_detected: string[];
  tone_analysis: string;
}

export interface ContextFactors {
  time_risk: string;
  location_risk: string;
  route_deviation: string;
  movement_pattern: string;
}

export interface ContextAnalysis {
  contextual_factors: ContextFactors;
  context_risk_score: number;
  reasoning: string;
}

export interface RiskAssessment {
  riskLevel: RiskLevel;
  score: number; // 0-100
  reason: string;
  recommendedAction: string;
  detectedThreats: string[];
  audioAnalysis?: AudioAnalysisDetails;
  contextAnalysis?: ContextAnalysis;
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
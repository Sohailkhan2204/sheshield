import React from 'react';
import { RiskLevel, AudioAnalysisDetails, ContextAnalysis } from '../types';

interface RiskIndicatorProps {
  level: RiskLevel;
  score: number;
  reason: string;
  audioAnalysis?: AudioAnalysisDetails;
  contextAnalysis?: ContextAnalysis;
}

const RiskIndicator: React.FC<RiskIndicatorProps> = ({ level, score, reason, audioAnalysis, contextAnalysis }) => {
  const getColor = () => {
    switch (level) {
      case RiskLevel.SAFE: return 'bg-emerald-500 shadow-emerald-500/50';
      case RiskLevel.UNCERTAIN: return 'bg-slate-500 shadow-slate-500/50';
      case RiskLevel.SUSPICIOUS: return 'bg-amber-500 shadow-amber-500/50';
      case RiskLevel.DANGEROUS: return 'bg-orange-600 shadow-orange-600/50';
      case RiskLevel.CRITICAL: return 'bg-red-600 shadow-red-600/50 animate-pulse';
      default: return 'bg-slate-700';
    }
  };

  const getLabel = () => {
    switch (level) {
      case RiskLevel.SAFE: return 'Shield Active';
      case RiskLevel.UNCERTAIN: return 'Analyzing...';
      case RiskLevel.SUSPICIOUS: return 'Suspicious';
      case RiskLevel.DANGEROUS: return 'DANGER DETECTED';
      case RiskLevel.CRITICAL: return 'EMERGENCY';
      default: return 'Initializing';
    }
  };

  const getRiskColor = (risk: string) => {
      switch(risk?.toLowerCase()) {
          case 'high': return 'text-red-400';
          case 'medium': return 'text-amber-400';
          default: return 'text-slate-400';
      }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 relative">
      {/* Pulse Effect */}
      <div className={`absolute w-64 h-64 rounded-full opacity-20 animate-pulse ${getColor()}`} />
      
      {/* Core Indicator */}
      <div className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center text-center p-4 transition-all duration-500 ${getColor()} shadow-2xl border-4 border-slate-900/20`}>
        <span className="text-3xl font-bold tracking-wider">{score}%</span>
        <span className="text-sm font-semibold uppercase mt-1">{getLabel()}</span>
      </div>

      <div className="mt-6 w-full space-y-3">
        {/* Main Reason */}
        <div className="px-6 py-3 bg-slate-900/50 rounded-xl border border-slate-800 backdrop-blur-sm text-center">
          <p className="text-slate-300 text-sm">{reason || "Monitoring environment..."}</p>
        </div>

        {/* Audio Diagnostics */}
        {audioAnalysis && (audioAnalysis.distress_score > 0 || audioAnalysis.emotional_state !== 'unknown') && (
            <div className="px-4 py-3 bg-slate-900/80 rounded-xl border border-indigo-900/50 flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-indigo-400 font-bold uppercase tracking-wider">Voice Analysis</span>
                    <span className={`px-2 py-0.5 rounded-full ${audioAnalysis.distress_score > 50 ? 'bg-red-900/50 text-red-200' : 'bg-emerald-900/50 text-emerald-200'}`}>
                        Distress: {audioAnalysis.distress_score}%
                    </span>
                </div>
                <div className="flex justify-between text-slate-400">
                    <span>State: <span className="text-slate-200 capitalize">{audioAnalysis.emotional_state.replace(/_/g, ' ')}</span></span>
                </div>
                <div className="text-slate-500 italic">
                    "{audioAnalysis.tone_analysis}"
                </div>
                {audioAnalysis.keywords_detected.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {audioAnalysis.keywords_detected.map((k, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">{k}</span>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Context Diagnostics */}
        {contextAnalysis && (
            <div className="px-4 py-3 bg-slate-900/80 rounded-xl border border-slate-700 flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                     <span className="text-indigo-400 font-bold uppercase tracking-wider">Context</span>
                     <span className={`px-2 py-0.5 rounded-full font-bold ${getRiskColor(contextAnalysis.contextual_factors.location_risk)}`}>
                        {contextAnalysis.contextual_factors.movement_pattern.toUpperCase().replace('_', ' ')}
                     </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-400">
                    <div>Time Risk: <span className={getRiskColor(contextAnalysis.contextual_factors.time_risk)}>{contextAnalysis.contextual_factors.time_risk}</span></div>
                    <div>Loc Risk: <span className={getRiskColor(contextAnalysis.contextual_factors.location_risk)}>{contextAnalysis.contextual_factors.location_risk}</span></div>
                    <div className="col-span-2">Deviation: <span className="text-slate-200">{contextAnalysis.contextual_factors.route_deviation}</span></div>
                </div>
                 <div className="text-slate-500 italic">
                    "{contextAnalysis.reasoning}"
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default RiskIndicator;
import React from 'react';
import { RiskLevel } from '../types';

interface RiskIndicatorProps {
  level: RiskLevel;
  score: number;
  reason: string;
}

const RiskIndicator: React.FC<RiskIndicatorProps> = ({ level, score, reason }) => {
  const getColor = () => {
    switch (level) {
      case RiskLevel.SAFE: return 'bg-emerald-500 shadow-emerald-500/50';
      case RiskLevel.CAUTION: return 'bg-amber-500 shadow-amber-500/50';
      case RiskLevel.DANGER: return 'bg-orange-600 shadow-orange-600/50';
      case RiskLevel.CRITICAL: return 'bg-red-600 shadow-red-600/50';
      default: return 'bg-slate-700';
    }
  };

  const getLabel = () => {
    switch (level) {
      case RiskLevel.SAFE: return 'Shield Active';
      case RiskLevel.CAUTION: return 'Caution';
      case RiskLevel.DANGER: return 'Danger Detected';
      case RiskLevel.CRITICAL: return 'EMERGENCY';
      default: return 'Initializing';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 relative">
      {/* Pulse Effect */}
      <div className={`absolute w-64 h-64 rounded-full opacity-20 animate-pulse ${getColor()}`} />
      
      {/* Core Indicator */}
      <div className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center text-center p-4 transition-all duration-500 ${getColor()} shadow-2xl border-4 border-slate-900/20`}>
        <span className="text-3xl font-bold tracking-wider">{score}%</span>
        <span className="text-sm font-semibold uppercase mt-1">{getLabel()}</span>
      </div>

      <div className="mt-6 px-6 py-3 bg-slate-900/50 rounded-xl border border-slate-800 backdrop-blur-sm max-w-sm text-center">
        <p className="text-slate-300 text-sm">{reason || "Monitoring environment..."}</p>
      </div>
    </div>
  );
};

export default RiskIndicator;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import CameraFeed, { CameraHandle } from './components/CameraFeed';
import AudioMonitor, { AudioHandle } from './components/AudioMonitor';
import RiskIndicator from './components/RiskIndicator';
import { assessRisk, findSafePlaces, generateIncidentReport } from './services/geminiService';
import { RiskAssessment, RiskLevel, SafePlace } from './types';

const App: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [assessment, setAssessment] = useState<RiskAssessment>({
    riskLevel: RiskLevel.SAFE,
    score: 0,
    reason: "Standby",
    recommendedAction: "Tap Start to Monitor",
    detectedThreats: []
  });
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const cameraRef = useRef<CameraHandle>(null);
  const audioRef = useRef<AudioHandle>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error(err)
    );
  }, []);

  // Update Safe Places when location changes (Maps Grounding)
  useEffect(() => {
    if (location) {
      findSafePlaces(location.lat, location.lng).then(setSafePlaces);
    }
  }, [location]);

  const runAnalysisLoop = useCallback(async () => {
    if (!cameraRef.current || !audioRef.current || !location) return;

    // 1. Gather Sensor Data
    const imageBase64 = cameraRef.current.capture();
    const audioBase64 = await audioRef.current.getLatestAudio();
    const context = `Lat: ${location.lat}, Lng: ${location.lng}, Time: ${new Date().toLocaleTimeString()}`;

    // 2. Log Locally
    const timestamp = new Date().toISOString();
    
    // 3. Send to Gemini (Flash Lite)
    const result = await assessRisk(imageBase64, audioBase64, context);
    
    setAssessment(result);
    setLogs(prev => [...prev.slice(-19), `[${timestamp}] Risk: ${result.riskLevel} - ${result.reason}`]);

    // 4. Auto-Response Logic (Demo)
    if (result.riskLevel === RiskLevel.DANGER || result.riskLevel === RiskLevel.CRITICAL) {
      // In a real app, this would trigger SOS SMS, loud alarm, etc.
      console.warn("HIGH RISK DETECTED - INITIATING PROTOCOLS");
    }

  }, [location]);

  const toggleMonitoring = () => {
    if (isMonitoring) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsMonitoring(false);
      setAssessment(prev => ({ ...prev, riskLevel: RiskLevel.SAFE, reason: "Monitoring Paused" }));
    } else {
      setIsMonitoring(true);
      // Run immediately then interval
      runAnalysisLoop();
      intervalRef.current = window.setInterval(runAnalysisLoop, 6000); // Poll every 6 seconds
    }
  };

  const handleGenerateReport = async () => {
    setShowReport(true);
    setReportText("Generating comprehensive analysis...");
    const lastImage = cameraRef.current?.capture() || null;
    const report = await generateIncidentReport(logs, lastImage);
    setReportText(report);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">SheShield AI</h1>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleGenerateReport}
                className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 transition-colors"
            >
                Create Report
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 gap-6 max-w-md mx-auto w-full">
        
        {/* Risk Visualizer */}
        <RiskIndicator 
          level={assessment.riskLevel} 
          score={assessment.score} 
          reason={assessment.reason}
        />

        {/* Action Center */}
        <div className="space-y-4">
          <button 
            onClick={toggleMonitoring}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all transform active:scale-95 ${
              isMonitoring 
              ? 'bg-slate-800 text-slate-400 border border-slate-700' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30'
            }`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Protection'}
          </button>

          {assessment.riskLevel !== RiskLevel.SAFE && (
             <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button className="p-4 bg-red-600 rounded-xl font-bold text-white shadow-lg shadow-red-900/40 hover:bg-red-500 active:scale-95">
                    SOS ALERT
                </button>
                <button className="p-4 bg-slate-800 border border-slate-700 rounded-xl font-medium text-slate-200 hover:bg-slate-700 active:scale-95">
                    Fake Call
                </button>
             </div>
          )}
        </div>

        {/* Dynamic Advice */}
        {assessment.recommendedAction && (
          <div className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30">
            <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">AI Recommendation</h3>
            <p className="text-lg font-medium">{assessment.recommendedAction}</p>
          </div>
        )}

        {/* Safe Places (Maps Grounding) */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Nearby Safe Havens (Maps Grounding)</h3>
          {safePlaces.length === 0 ? (
            <div className="text-slate-500 text-sm">Locating safe zones...</div>
          ) : (
            <ul className="space-y-3">
              {safePlaces.slice(0, 3).map((place, i) => (
                <li key={i} className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-slate-200">{place.name}</div>
                    <div className="text-xs text-slate-500">{place.type}</div>
                  </div>
                  {place.uri ? (
                    <a href={place.uri} target="_blank" rel="noreferrer" className="text-indigo-400 text-xs underline">
                      View Map
                    </a>
                  ) : (
                    <span className="text-xs text-slate-600">{place.distance}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Hidden Sensors */}
      <CameraFeed isActive={isMonitoring} ref={cameraRef} />
      <AudioMonitor isActive={isMonitoring} ref={audioRef} />

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold">Incident Report</h2>
              <button onClick={() => setShowReport(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-6 overflow-y-auto whitespace-pre-wrap font-mono text-sm text-slate-300">
                {reportText}
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
                <p className="text-xs text-slate-500 text-center">Generated by Gemini 3 Pro (Thinking Mode)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mount App
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;
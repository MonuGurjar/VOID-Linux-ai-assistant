import { useEffect, useState } from 'react';
import { ShieldCheck, Database, Cpu, Activity, Server } from 'lucide-react';

interface ServiceStatus {
  backend: boolean;
  gemini: boolean;
  lmstudio: boolean;
  database: boolean;
}

export function StatusBar() {
  const [status, setStatus] = useState<ServiceStatus>({
    backend: true,
    gemini: true,
    lmstudio: false,
    database: true,
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    const checkServices = async () => {
      let isBackendOk = false;
      let isGeminiOk = false;
      let isLmsOk = false;

      // 1. Check Backend & Gemini Health
      try {
        const res = await fetch(`${API_URL}/ai/health`);
        if (res.ok) {
          const data = await res.json();
          isBackendOk = data.backend === "running";
          isGeminiOk = data.gemini === "configured";
          isLmsOk = data.lmstudio === "running";
        }
      } catch (e) {
        isBackendOk = false;
      }

      setStatus({
        backend: isBackendOk,
        gemini: isGeminiOk,
        lmstudio: isLmsOk,
        database: isBackendOk,
      });
    };

    checkServices();
    const interval = setInterval(checkServices, 6000);
    return () => clearInterval(interval);
  }, [API_URL]);

  return (
    <div className="h-9 flex items-center justify-between px-4 glass-panel-3d text-[11px] text-muted-foreground select-none shrink-0 border-t border-white/10 z-30">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-semibold text-foreground/90 hidden sm:inline">Google Gemini AI &bull; Autonomous Linux Assistant</span>
      </div>

      {/* Services Status Headings */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
        {/* Backend Status */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shrink-0" title="FastAPI Backend Server">
          <Server className="w-3 h-3 text-muted-foreground" />
          <span className="font-bold text-foreground/90">Backend:</span>
          <span className={`w-2 h-2 rounded-full ${status.backend ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`} />
          <span className={status.backend ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {status.backend ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Gemini Status */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shrink-0" title="Google Gemini API Key">
          <Cpu className="w-3 h-3 text-muted-foreground" />
          <span className="font-bold text-foreground/90">Gemini:</span>
          <span className={`w-2 h-2 rounded-full ${status.gemini ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'}`} />
          <span className={status.gemini ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {status.gemini ? 'Configured' : 'Key Needed'}
          </span>
        </div>

        {/* LM Studio Status */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shrink-0" title="LM Studio Service (Port 1234)">
          <Activity className="w-3 h-3 text-muted-foreground" />
          <span className="font-bold text-foreground/90">LM Studio:</span>
          <span className={`w-2 h-2 rounded-full ${status.lmstudio ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-white/20'}`} />
          <span className={status.lmstudio ? 'text-emerald-400 font-semibold' : 'text-muted-foreground/60'}>
            {status.lmstudio ? 'Running' : 'Stopped'}
          </span>
        </div>

        {/* Database */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shrink-0">
          <Database className="w-3 h-3 text-muted-foreground" />
          <span className="font-medium text-foreground/80">SQLite</span>
        </div>
      </div>
    </div>
  );
}

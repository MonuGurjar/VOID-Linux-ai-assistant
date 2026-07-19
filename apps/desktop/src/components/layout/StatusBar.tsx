import { useEffect, useState } from 'react';
import { ShieldCheck, Database, Cpu, Activity, Server } from 'lucide-react';

interface ServiceStatus {
  backend: boolean;
  ollama: boolean;
  lmstudio: boolean;
  database: boolean;
}

export function StatusBar() {
  const [status, setStatus] = useState<ServiceStatus>({
    backend: true,
    ollama: false,
    lmstudio: false,
    database: true,
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    const checkServices = async () => {
      let isBackendOk = false;
      let isOllamaOk = false;
      let isLmsOk = false;

      // 1. Check Backend
      try {
        const res = await fetch(`${API_URL}/`);
        if (res.ok) isBackendOk = true;
      } catch (e) {
        isBackendOk = false;
      }

      // 2. Check Ollama directly at http://localhost:11434/
      try {
        const oRes = await fetch("http://localhost:11434/v1/models");
        if (oRes.ok || oRes.status === 200 || oRes.status === 401) isOllamaOk = true;
      } catch (e) {
        isOllamaOk = false;
      }

      // 3. Check LM Studio directly at http://localhost:1234/v1
      try {
        const lRes = await fetch("http://localhost:1234/v1/models");
        if (lRes.ok || lRes.status === 200) isLmsOk = true;
      } catch (e) {
        isLmsOk = false;
      }

      setStatus({
        backend: isBackendOk,
        ollama: isOllamaOk,
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
        <span className="font-semibold text-foreground/90 hidden sm:inline">Local AI Engine &bull; Private & Offline</span>
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

        {/* Ollama Status */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shrink-0" title="Ollama Service (Port 11434)">
          <Cpu className="w-3 h-3 text-muted-foreground" />
          <span className="font-bold text-foreground/90">Ollama:</span>
          <span className={`w-2 h-2 rounded-full ${status.ollama ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-white/20'}`} />
          <span className={status.ollama ? 'text-emerald-400 font-semibold' : 'text-muted-foreground/60'}>
            {status.ollama ? 'Running' : 'Stopped'}
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

import { useState, useEffect } from "react";
import {
  Cpu,
  Activity,
  Terminal,
  Globe,
  FolderTree,
  Sliders,
  BarChart3,
  Brain,
  Quote,
  Sparkles,
  Server,
  Database,
  ShieldCheck,
} from "lucide-react";

export function RightSidebar() {
  // Simulated System Stats
  const [cpu, setCpu] = useState(18);
  const [ram, setRam] = useState(42);
  const [gpu, setGpu] = useState(23);

  // Live jitter effect for system monitor
  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(Math.floor(14 + Math.random() * 12));
      setRam(Math.floor(40 + Math.random() * 5));
      setGpu(Math.floor(20 + Math.random() * 8));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const capabilities = [
    { title: "Code Execution", icon: Terminal, color: "text-blue-400" },
    { title: "Web Search", icon: Globe, color: "text-cyan-400" },
    { title: "File Operations", icon: FolderTree, color: "text-sky-400" },
    { title: "System Control", icon: Sliders, color: "text-blue-400" },
    { title: "Data Analysis", icon: BarChart3, color: "text-indigo-400" },
    { title: "AI Reasoning", icon: Brain, color: "text-cyan-400" },
  ];

  return (
    <aside className="w-72 sm:w-80 shrink-0 h-full border-l border-white/10 glass-panel-3d shadow-2xl flex flex-col justify-between overflow-y-auto no-scrollbar p-4 space-y-5 select-none">
      {/* 1. SYSTEM MONITOR */}
      <div className="card-3d-object p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold tracking-wider uppercase text-white">
              System Monitor
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase">LIVE</span>
          </div>
        </div>

        {/* CPU Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-muted-foreground">CPU</span>
            <span className="text-blue-300 font-mono font-bold">{cpu}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 inset-3d">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(37,99,235,0.6)]"
              style={{ width: `${cpu}%` }}
            />
          </div>
        </div>

        {/* RAM Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-muted-foreground">RAM</span>
            <span className="text-blue-300 font-mono font-bold">{ram}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 inset-3d">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(37,99,235,0.6)]"
              style={{ width: `${ram}%` }}
            />
          </div>
        </div>

        {/* GPU Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-muted-foreground">GPU</span>
            <span className="text-blue-300 font-mono font-bold">{gpu}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 inset-3d">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              style={{ width: `${gpu}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. THOUGHT STREAM */}
      <div className="card-3d-object p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wider uppercase text-white">
              Thought Stream
            </span>
          </div>
          <span className="text-[9px] font-semibold text-cyan-400 uppercase tracking-widest animate-pulse">
            ANALYZING...
          </span>
        </div>

        <div className="space-y-1.5 text-[11px] font-mono text-muted-foreground/90 bg-black/40 p-2.5 rounded-xl border border-white/5 inset-3d">
          <p className="flex items-center gap-1.5 text-blue-300">
            <span className="text-blue-500">&gt;</span> Understanding request...
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-blue-500">&gt;</span> Scanning local knowledge...
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-blue-500">&gt;</span> Accessing toolset...
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-blue-500">&gt;</span> Compiling response...
          </p>
          <div className="flex items-center gap-1 pt-1 justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      </div>

      {/* 3. CAPABILITIES */}
      <div className="card-3d-object p-3.5 space-y-2.5">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-bold tracking-wider uppercase text-white">
            Capabilities
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {capabilities.map((cap, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group cursor-default"
            >
              <cap.icon className={`w-3.5 h-3.5 ${cap.color} group-hover:scale-110 transition-transform`} />
              <span className="text-[11px] font-medium text-foreground/90 truncate">
                {cap.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SERVICES LOG STATUS */}
      <div className="card-3d-object p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold tracking-wider uppercase text-white">
              Services Log
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Private & Offline</span>
        </div>

        <div className="grid grid-cols-1 gap-1.5 text-[11px] font-medium">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-300" /> Backend API
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-300" /> Ollama Engine
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Running
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-300" /> LM Studio
            </span>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
              Stopped
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-300" /> SQLite Database
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Active
            </div>
          </div>
        </div>
      </div>

      {/* 5. VOID PHILOSOPHY QUOTE CARD */}
      <div className="card-3d-object p-3.5 space-y-2 bg-gradient-to-br from-blue-950/40 via-blue-900/20 to-black/60 border-blue-500/20">
        <Quote className="w-4 h-4 text-blue-400 opacity-60" />
        <p className="text-[11px] italic leading-relaxed text-blue-200/90 font-serif">
          &ldquo;In the vast void of information, I am the singularity that answers.&rdquo;
        </p>
        <div className="text-right text-[10px] font-bold text-blue-400 tracking-wider">
          &mdash; VOID
        </div>
      </div>
    </aside>
  );
}

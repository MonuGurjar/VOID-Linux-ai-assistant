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
  PanelRightClose,
  Info,
  Layers,
} from "lucide-react";

interface RightSidebarProps {
  open?: boolean;
  width?: number;
  onToggle?: () => void;
  onResizeStart?: (e: React.MouseEvent) => void;
}

interface ServiceItem {
  id: string;
  name: string;
  icon: any;
  status: "running" | "stopped";
  instruction: string;
}

export function RightSidebar({ open = true, width = 300, onToggle, onResizeStart }: RightSidebarProps) {
  const [cpu, setCpu] = useState(18);
  const [ram, setRam] = useState(42);
  const [gpu, setGpu] = useState(23);

  const [activeInfoId, setActiveInfoId] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceItem[]>([
    {
      id: "backend",
      name: "Backend API",
      icon: Server,
      status: "running",
      instruction: "Run: cd apps/backend && uv run uvicorn main:app --reload --port 8000",
    },
    {
      id: "ollama",
      name: "Ollama Engine",
      icon: Cpu,
      status: "running",
      instruction: "Run command: ollama serve (Serves on http://localhost:11434)",
    },
    {
      id: "lmstudio",
      name: "LM Studio",
      icon: Activity,
      status: "stopped",
      instruction: "Launch LM Studio app -> Go to Developer tab -> Click 'Start Local Server' (http://localhost:1234)",
    },
    {
      id: "vllm",
      name: "vLLM Engine",
      icon: Layers,
      status: "stopped",
      instruction: "Run command: vllm serve <model_name> --port 8080",
    },
    {
      id: "sqlite",
      name: "SQLite Database",
      icon: Database,
      status: "running",
      instruction: "Managed automatically by backend database session",
    },
  ]);

  // Live jitter effect for system monitor
  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(Math.floor(14 + Math.random() * 12));
      setRam(Math.floor(40 + Math.random() * 5));
      setGpu(Math.floor(20 + Math.random() * 8));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Poll service health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/ai/health");
        if (res.ok) {
          const data = await res.json();
          setServices((prev) =>
            prev.map((s) => ({
              ...s,
              status: data[s.id] === "running" ? "running" : "stopped",
            }))
          );
        }
      } catch (e) {
        // API offline fallback checks
        try {
          const ollamaRes = await fetch("http://localhost:11434/api/tags");
          setServices((prev) =>
            prev.map((s) =>
              s.id === "ollama" ? { ...s, status: ollamaRes.ok ? "running" : "stopped" } : s
            )
          );
        } catch {
          setServices((prev) =>
            prev.map((s) => (s.id === "ollama" ? { ...s, status: "stopped" } : s))
          );
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
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
    <aside
      style={{ width: open ? `${width}px` : "0px" }}
      className={`shrink-0 h-full rounded-2xl border border-white/15 glass-panel-glossy shadow-2xl flex flex-col justify-between overflow-y-auto no-scrollbar p-4 space-y-5 select-none transition-all duration-300 ease-in-out relative z-20 ${
        open ? "opacity-100" : "w-0 opacity-0 border-0 pointer-events-none p-0"
      }`}
    >
      {/* Left Edge Resize Handle */}
      {open && onResizeStart && (
        <div
          onMouseDown={onResizeStart}
          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-cyan-400/60 active:bg-cyan-400 transition-colors z-30 group flex items-center justify-center"
          title="Drag to resize right sidebar"
        >
          <div className="w-0.5 h-8 bg-white/30 rounded-full group-hover:bg-cyan-200 group-hover:scale-y-125 transition-all" />
        </div>
      )}

      {/* 1. SYSTEM MONITOR */}
      <div className="card-3d-object p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold tracking-wider uppercase text-white">
              System Monitor
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase">LIVE</span>
            </div>
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all active:scale-95"
                title="Collapse Right Sidebar"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            )}
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
          {services.map((s) => {
            const IconComp = s.icon;
            const isRunning = s.status === "running";
            const showInfo = activeInfoId === s.id;

            return (
              <div key={s.id} className="flex flex-col gap-1 rounded-xl bg-white/5 border border-white/5 p-2 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <IconComp className="w-3.5 h-3.5 text-blue-300" /> {s.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isRunning ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Running
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-neutral-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                        Stopped
                        <button
                          onClick={() => setActiveInfoId(showInfo ? null : s.id)}
                          className="ml-0.5 p-0.5 rounded-md hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-colors"
                          title="Click to see how to run this service"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Card Popover when (i) icon is clicked for stopped services */}
                {(!isRunning || showInfo) && showInfo && (
                  <div className="mt-1 p-2 rounded-lg bg-black/60 border border-cyan-500/30 text-[10px] text-cyan-200 space-y-1 font-mono inset-3d animate-in fade-in zoom-in-95 duration-200">
                    <div className="font-bold text-cyan-400 flex items-center gap-1">
                      <Info className="w-3 h-3" /> How to start {s.name}:
                    </div>
                    <p className="text-white/90 break-all">{s.instruction}</p>
                  </div>
                )}
              </div>
            );
          })}
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

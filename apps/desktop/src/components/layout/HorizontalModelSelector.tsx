import { useModelSelection } from "@/hooks/useModelSelection";
import { Cpu, ChevronDown } from "lucide-react";

export function HorizontalModelSelector() {
  const { provider, setProvider, selectedModel, setSelectedModel, models } = useModelSelection();

  return (
    <div className="flex items-center gap-2 glass-panel-3d p-1.5 px-2.5 rounded-2xl shadow-xl border border-white/15 backdrop-blur-md">
      {/* Horizontal Provider Pill Toggle */}
      <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl inset-3d">
        <button
          onClick={() => setProvider("ollama")}
          className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
            provider === "ollama"
              ? "btn-3d-primary text-white shadow-md"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Ollama
        </button>
        <button
          onClick={() => setProvider("lmstudio")}
          className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
            provider === "lmstudio"
              ? "btn-3d-primary text-white shadow-md"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          LM Studio
        </button>
      </div>

      {/* Horizontal Slim Model Dropdown */}
      <div className="relative flex items-center">
        <Cpu className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="appearance-none bg-white/5 hover:bg-white/10 text-white font-semibold text-xs py-1.5 pl-8 pr-8 rounded-xl border border-white/10 focus:outline-none focus:border-purple-500/50 transition-all cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
        >
          {models.length === 0 ? (
            <option value="" disabled className="bg-neutral-900 text-neutral-400">
              Select Model
            </option>
          ) : (
            models.map((m) => (
              <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                {m.name}
              </option>
            ))
          )}
        </select>
        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

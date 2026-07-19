import { useModelSelection } from "@/hooks/useModelSelection";
import { Cpu, ChevronDown } from "lucide-react";

export function SlimModelSelector() {
  const { provider, setProvider, selectedModel, setSelectedModel, models } = useModelSelection();

  return (
    <div className="flex flex-col gap-1.5 w-full inset-3d p-2 rounded-xl border border-white/10">
      {/* Top Provider Toggle */}
      <div className="flex items-center justify-between gap-1 bg-black/40 p-0.5 rounded-lg">
        <button
          onClick={() => setProvider("ollama")}
          className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${
            provider === "ollama"
              ? "btn-3d-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Ollama
        </button>
        <button
          onClick={() => setProvider("lmstudio")}
          className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${
            provider === "lmstudio"
              ? "btn-3d-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          LM Studio
        </button>
      </div>

      {/* Slim Model Dropdown */}
      <div className="relative w-full">
        <Cpu className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full appearance-none bg-white/5 hover:bg-white/10 text-white font-medium text-[11px] py-1.5 pl-8 pr-7 rounded-lg border border-white/10 focus:outline-none focus:border-purple-500/50 transition-all cursor-pointer truncate"
        >
          {models.length === 0 ? (
            <option value="" disabled className="bg-neutral-900 text-neutral-400">
              No models found
            </option>
          ) : (
            models.map((m) => (
              <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                {m.name}
              </option>
            ))
          )}
        </select>
        <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

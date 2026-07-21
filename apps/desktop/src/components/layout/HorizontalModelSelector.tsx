import { useModelSelection, ProviderType } from "@/hooks/useModelSelection";
import { Cpu, ChevronDown } from "lucide-react";

export function HorizontalModelSelector() {
  const { provider, setProvider, selectedModel, setSelectedModel, models } = useModelSelection();

  const providers: { id: ProviderType; label: string }[] = [
    { id: "ollama", label: "Ollama" },
    { id: "lmstudio", label: "LM Studio" },
    { id: "vllm", label: "vLLM" },
  ];

  return (
    <div className="flex items-center gap-2 sidebar-solid-panel p-1.5 px-2.5 rounded-2xl shadow-xl border border-white/15">
      {/* Horizontal Multi-Provider Pill Toggle */}
      <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl inset-3d">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => setProvider(p.id)}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              provider === p.id
                ? "btn-3d-primary text-white shadow-md"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Horizontal Slim Model Dropdown */}
      <div className="relative flex items-center">
        <Cpu className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="appearance-none bg-white/5 hover:bg-white/10 text-white font-semibold text-xs py-1.5 pl-8 pr-8 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
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
        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

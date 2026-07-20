import { useState, useEffect } from "react";

export type ProviderType = "ollama" | "lmstudio" | "vllm" | "custom";

export interface ModelOption {
  id: string;
  name: string;
  provider: ProviderType;
}

let globalProvider: ProviderType = (localStorage.getItem("void_provider") as ProviderType) || "ollama";
let globalSelectedModel: string = localStorage.getItem("void_selected_model") || "";
let globalModels: ModelOption[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function useModelSelection() {
  const [provider, setProviderState] = useState<ProviderType>(globalProvider);
  const [selectedModel, setSelectedModelState] = useState<string>(globalSelectedModel);
  const [models, setModels] = useState<ModelOption[]>(globalModels);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    const handleChange = () => {
      setProviderState(globalProvider);
      setSelectedModelState(globalSelectedModel);
      setModels([...globalModels]);
    };

    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const fetchModels = async (prov = globalProvider) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai/models?provider=${prov}`);
      if (res.ok) {
        const data = await res.json();
        const list: ModelOption[] = (data || []).map((m: any) => ({
          id: m.id || m.name,
          name: m.name || m.id,
          provider: prov,
        }));

        // Fallback for Ollama if /ai/models returns empty list
        if (list.length === 0 && prov === "ollama") {
          const directRes = await fetch("http://localhost:11434/api/tags");
          if (directRes.ok) {
            const directData = await directRes.json();
            const fallbackList: ModelOption[] = (directData.models || []).map((m: any) => ({
              id: m.name,
              name: m.name,
              provider: "ollama" as const,
            }));
            globalModels = fallbackList;
            if (fallbackList.length > 0 && (!globalSelectedModel || !fallbackList.some((m) => m.id === globalSelectedModel))) {
              globalSelectedModel = fallbackList[0].id;
              localStorage.setItem("void_selected_model", fallbackList[0].id);
            }
            return;
          }
        }

        globalModels = list;
        if (list.length > 0 && (!globalSelectedModel || !list.some((m) => m.id === globalSelectedModel))) {
          globalSelectedModel = list[0].id;
          localStorage.setItem("void_selected_model", list[0].id);
        }
      } else {
        globalModels = [];
      }
    } catch (e) {
      console.warn("Failed to fetch models for", prov, e);
      globalModels = [];
    } finally {
      setIsLoading(false);
      notify();
    }
  };

  useEffect(() => {
    fetchModels(globalProvider);
  }, [provider]);

  const setProvider = (p: ProviderType) => {
    globalProvider = p;
    localStorage.setItem("void_provider", p);
    fetchModels(p);
  };

  const setSelectedModel = (m: string) => {
    globalSelectedModel = m;
    localStorage.setItem("void_selected_model", m);
    notify();
  };

  return {
    provider,
    setProvider,
    selectedModel,
    setSelectedModel,
    models,
    isLoading,
    refreshModels: fetchModels,
  };
}

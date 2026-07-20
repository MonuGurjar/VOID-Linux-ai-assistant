import { useState, useEffect } from "react";

export type ProviderType = "ollama" | "lmstudio" | "vllm" | "custom";

export interface ModelOption {
  id: string;
  name: string;
  provider: ProviderType;
}

const PROVIDER_ENDPOINTS: Record<ProviderType, string> = {
  ollama: "http://localhost:11434/api/tags",
  lmstudio: "http://localhost:1234/v1/models",
  vllm: "http://localhost:8080/v1/models",
  custom: "http://localhost:8080/v1/models",
};

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
      if (prov === "ollama") {
        const res = await fetch("http://localhost:11434/api/tags");
        if (res.ok) {
          const data = await res.json();
          const list: ModelOption[] = (data.models || []).map((m: any) => ({
            id: m.name,
            name: m.name,
            provider: "ollama" as const,
          }));
          globalModels = list;
          if (list.length > 0 && (!globalSelectedModel || !list.some((m) => m.id === globalSelectedModel))) {
            globalSelectedModel = list[0].id;
            localStorage.setItem("void_selected_model", list[0].id);
          }
        } else {
          globalModels = [];
        }
      } else {
        const url = PROVIDER_ENDPOINTS[prov] || PROVIDER_ENDPOINTS.ollama;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const list: ModelOption[] = (data.data || []).map((m: any) => ({
            id: m.id,
            name: m.id,
            provider: prov,
          }));
          globalModels = list;
          if (list.length > 0 && (!globalSelectedModel || !list.some((m) => m.id === globalSelectedModel))) {
            globalSelectedModel = list[0].id;
            localStorage.setItem("void_selected_model", list[0].id);
          }
        } else {
          globalModels = [];
        }
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

import { useState, useEffect } from "react";

export interface ModelOption {
  id: string;
  name: string;
  provider: "ollama" | "lmstudio";
}

// Global state for model selection across sidebar & chat
let globalProvider: "ollama" | "lmstudio" = (localStorage.getItem("void_provider") as "ollama" | "lmstudio") || "ollama";
let globalSelectedModel: string = localStorage.getItem("void_selected_model") || "";
let globalModels: ModelOption[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function useModelSelection() {
  const [provider, setProviderState] = useState<"ollama" | "lmstudio">(globalProvider);
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
        }
      } else {
        const res = await fetch("http://localhost:1234/v1/models");
        if (res.ok) {
          const data = await res.json();
          const list: ModelOption[] = (data.data || []).map((m: any) => ({
            id: m.id,
            name: m.id,
            provider: "lmstudio" as const,
          }));
          globalModels = list;
          if (list.length > 0 && (!globalSelectedModel || !list.some((m) => m.id === globalSelectedModel))) {
            globalSelectedModel = list[0].id;
            localStorage.setItem("void_selected_model", list[0].id);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to fetch models for", prov, e);
    } finally {
      setIsLoading(false);
      notify();
    }
  };

  useEffect(() => {
    fetchModels(globalProvider);
  }, [provider]);

  const setProvider = (p: "ollama" | "lmstudio") => {
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

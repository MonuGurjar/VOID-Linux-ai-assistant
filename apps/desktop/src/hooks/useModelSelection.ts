import { useState, useEffect } from "react";

export type ProviderType = "gemini" | "lmstudio" | "vllm" | "custom";

export interface ModelOption {
  id: string;
  name: string;
  provider: ProviderType;
}

const DEFAULT_GEMINI_MODELS: ModelOption[] = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "gemini" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "gemini" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "gemini" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "gemini" },
];

let globalProvider: ProviderType = (localStorage.getItem("void_provider") as ProviderType) || "gemini";
let globalSelectedModel: string = localStorage.getItem("void_selected_model") || "gemini-2.5-flash";
let globalModels: ModelOption[] = DEFAULT_GEMINI_MODELS;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

async function fetchDirectProviderModels(prov: ProviderType): Promise<ModelOption[]> {
  try {
    if (prov === "gemini") {
      return DEFAULT_GEMINI_MODELS;
    } else if (prov === "lmstudio") {
      const res = await fetch("http://localhost:1234/v1/models");
      if (res.ok) {
        const data = await res.json();
        return (data.data || []).map((m: any) => ({
          id: m.id || m.name,
          name: m.name || m.id,
          provider: "lmstudio" as const,
        }));
      }
    } else if (prov === "vllm") {
      const res = await fetch("http://localhost:8080/v1/models");
      if (res.ok) {
        const data = await res.json();
        return (data.data || []).map((m: any) => ({
          id: m.id || m.name,
          name: m.name || m.id,
          provider: "vllm" as const,
        }));
      }
    }
  } catch (e) {
    console.warn(`Direct client-side fallback failed for ${prov}:`, e);
  }
  return prov === "gemini" ? DEFAULT_GEMINI_MODELS : [];
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
    let list: ModelOption[] = [];

    try {
      const res = await fetch(`${API_URL}/ai/models?provider=${prov}`);
      if (res.ok) {
        const data = await res.json();
        list = (data || []).map((m: any) => ({
          id: m.id || m.name,
          name: m.name || m.id,
          provider: prov,
        }));
      }
    } catch (e) {
      console.warn("Backend /ai/models fetch failed for", prov, e);
    }

    // Direct client fallback if backend returned no models
    if (list.length === 0) {
      list = await fetchDirectProviderModels(prov);
    }

    globalModels = list;
    if (list.length > 0) {
      if (!globalSelectedModel || !list.some((m) => m.id === globalSelectedModel)) {
        globalSelectedModel = list[0].id;
        localStorage.setItem("void_selected_model", list[0].id);
      }
    }

    setIsLoading(false);
    notify();
  };

  useEffect(() => {
    fetchModels(globalProvider);
  }, []);

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

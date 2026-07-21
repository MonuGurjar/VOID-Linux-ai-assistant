import { useState, useEffect } from "react";
import { Save, Palette, Check } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function SettingsPage() {
  const { theme: wallpaperTheme, setTheme: setWallpaperTheme } = useTheme();
  const [settings, setSettings] = useState<Record<string, string>>({
    theme: "dark",
    fontSize: "14px",
    dataDir: "~/.void/data",
    ai_base_url: "http://localhost:11434/v1",
    ai_model: ""
  });
  const [models, setModels] = useState<{id: string, name: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    fetch(`${API_URL}/settings/`)
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error("Failed to load settings:", err));
      
    fetch(`${API_URL}/ai/models`)
      .then(res => res.json())
      .then(data => {
         setModels(data);
         if (data.length > 0 && !settings.ai_model) {
            setSettings(prev => ({ ...prev, ai_model: data[0].id }));
         }
      })
      .catch(err => console.error("Failed to load models:", err));
  }, [API_URL]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`${API_URL}/settings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      // apply settings locally if needed
      document.documentElement.className = settings.theme;
      document.documentElement.style.fontSize = settings.fontSize;
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto w-full flex flex-col gap-8 text-foreground h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Settings</h1>
          <p className="text-xs text-muted-foreground mt-1">Configure your VOID AI Assistant and local LLM endpoints.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 btn-3d-primary rounded-xl font-bold text-xs shadow-lg disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>
      
      <div className="space-y-6">
        <section className="card-3d-object p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-red-400 border-b border-white/10 pb-3 flex items-center justify-between">
            <span>Appearance & Wallpapers</span>
            <Palette className="w-4 h-4 text-cyan-400" />
          </h2>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground">Wallpaper Theme</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cosmic Blue Theme Option */}
              <button
                type="button"
                onClick={() => setWallpaperTheme("cosmic")}
                className={`relative rounded-2xl p-4 border text-left transition-all overflow-hidden group cursor-pointer ${
                  wallpaperTheme === "cosmic"
                    ? "border-blue-500 bg-blue-950/40 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-400">Cosmic Blue (bg.png)</span>
                  {wallpaperTheme === "cosmic" && (
                    <span className="p-1 rounded-full bg-blue-500 text-white">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/80">
                  Electric neon cyan & deep blue space singularity theme.
                </p>
              </button>

              {/* Obsidian Silver Theme Option */}
              <button
                type="button"
                onClick={() => setWallpaperTheme("obsidian")}
                className={`relative rounded-2xl p-4 border text-left transition-all overflow-hidden group cursor-pointer ${
                  wallpaperTheme === "obsidian"
                    ? "border-slate-300 bg-zinc-900/60 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">Obsidian Silver (bg1.png)</span>
                  {wallpaperTheme === "obsidian" && (
                    <span className="p-1 rounded-full bg-slate-200 text-black">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/80">
                  Ultra-sleek monochromatic obsidian black hole & platinum theme.
                </p>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Mode</label>
              <select 
                value={settings.theme}
                onChange={e => setSettings({...settings, theme: e.target.value})}
                className="w-full btn-3d-secondary rounded-xl p-2.5 text-xs font-medium outline-none cursor-pointer"
              >
                <option value="dark" className="bg-neutral-900">Dark Mode</option>
                <option value="light" className="bg-neutral-900">Light Mode</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Font Size</label>
              <select 
                value={settings.fontSize}
                onChange={e => setSettings({...settings, fontSize: e.target.value})}
                className="w-full btn-3d-secondary rounded-xl p-2.5 text-xs font-medium outline-none cursor-pointer"
              >
                <option value="12px" className="bg-neutral-900">Small (12px)</option>
                <option value="14px" className="bg-neutral-900">Medium (14px)</option>
                <option value="16px" className="bg-neutral-900">Large (16px)</option>
              </select>
            </div>
          </div>
        </section>

        <section className="card-3d-object p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-red-400 border-b border-white/10 pb-3">Local AI Integration</h2>
          
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Base URL</label>
              <input 
                type="text" 
                value={settings.ai_base_url || ""}
                onChange={e => setSettings({...settings, ai_base_url: e.target.value})}
                placeholder="http://localhost:11434/v1"
                className="w-full inset-3d rounded-xl p-2.5 text-xs font-mono outline-none text-foreground"
              />
              <p className="text-[11px] text-muted-foreground/70">Ollama: http://localhost:11434/v1 | LM Studio: http://localhost:1234/v1</p>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Default Model</label>
              <select 
                value={settings.ai_model || ""}
                onChange={e => setSettings({...settings, ai_model: e.target.value})}
                className="w-full btn-3d-secondary rounded-xl p-2.5 text-xs font-medium outline-none cursor-pointer"
              >
                <option value="" disabled className="bg-neutral-900">Select a model</option>
                {models.map(m => (
                  <option key={m.id} value={m.id} className="bg-neutral-900">{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="card-3d-object p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-red-400 border-b border-white/10 pb-3">Application Info</h2>
          <div className="grid gap-4 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground font-medium">Version</span>
              <span className="font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[11px]">1.0.0-beta</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Data Directory</label>
              <input 
                type="text" 
                value={settings.dataDir}
                onChange={e => setSettings({...settings, dataDir: e.target.value})}
                className="w-full inset-3d rounded-xl p-2.5 text-xs font-mono outline-none text-foreground"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

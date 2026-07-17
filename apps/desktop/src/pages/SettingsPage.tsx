import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export function SettingsPage() {
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
    <div className="p-8 max-w-2xl mx-auto w-full flex flex-col gap-8 text-foreground h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>
      
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-border/50 pb-2">Appearance</h2>
          
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Theme</label>
              <select 
                value={settings.theme}
                onChange={e => setSettings({...settings, theme: e.target.value})}
                className="w-full bg-background border border-border/50 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Font Size</label>
              <select 
                value={settings.fontSize}
                onChange={e => setSettings({...settings, fontSize: e.target.value})}
                className="w-full bg-background border border-border/50 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="12px">Small</option>
                <option value="14px">Medium</option>
                <option value="16px">Large</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-border/50 pb-2">Local AI Integration</h2>
          
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Base URL</label>
              <input 
                type="text" 
                value={settings.ai_base_url || ""}
                onChange={e => setSettings({...settings, ai_base_url: e.target.value})}
                placeholder="http://localhost:11434/v1"
                className="w-full bg-background border border-border/50 rounded-lg p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground">Ollama: http://localhost:11434/v1 | LM Studio: http://localhost:1234/v1</p>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Model</label>
              <select 
                value={settings.ai_model || ""}
                onChange={e => setSettings({...settings, ai_model: e.target.value})}
                className="w-full bg-background border border-border/50 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="" disabled>Select a model</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-border/50 pb-2">Application Information</h2>
          <div className="grid gap-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border/20">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono">1.0.0-beta</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Data Directory</label>
              <input 
                type="text" 
                value={settings.dataDir}
                onChange={e => setSettings({...settings, dataDir: e.target.value})}
                className="w-full bg-background border border-border/50 rounded-lg p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

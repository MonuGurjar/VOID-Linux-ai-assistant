import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Settings2, ChevronDown } from 'lucide-react';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [modelName, setModelName] = useState("Loading...");
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await getCurrentWindow().isMaximized();
      setIsMaximized(maximized);
    };
    
    // Tauri has event listeners but we can also check on mount and interval
    // For simplicity, we just check on mount. In a robust setup we'd listen to 'tauri://resize'
    checkMaximized();

    const fetchSettings = () => {
      fetch(`${API_URL}/settings/`)
        .then(res => res.json())
        .then(data => {
          if (data.ai_model) {
            setModelName(data.ai_model);
          } else {
            setModelName("No model selected");
          }
        })
        .catch(err => {
          console.error("Failed to load settings:", err);
          setModelName("Disconnected");
        });
    };
    
    fetchSettings();
    // Poll settings every few seconds in case it changes
    const interval = setInterval(fetchSettings, 5000);
    return () => clearInterval(interval);
  }, [API_URL]);

  const handleMinimize = () => getCurrentWindow().minimize();
  const handleMaximize = async () => {
    const win = getCurrentWindow();
    if (await win.isMaximized()) {
      await win.unmaximize();
      setIsMaximized(false);
    } else {
      await win.maximize();
      setIsMaximized(true);
    }
  };
  const handleClose = () => getCurrentWindow().close();

  return (
    <div
      data-tauri-drag-region
      className="h-10 flex justify-between items-center bg-background select-none sticky top-0 z-50 border-b border-border/50"
    >
      <div className="flex items-center px-4 gap-3 pointer-events-none">
        <img src="/logo-red.png" alt="VOID" className="w-6 h-6 object-contain" />
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex items-center gap-1">
            VOID Assistant
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </span>
          <span className="text-muted-foreground font-normal text-xs px-2 py-0.5 rounded-full bg-muted flex items-center gap-1.5 pointer-events-auto">
            {modelName}
            <span className={`w-1.5 h-1.5 rounded-full ${modelName === 'Disconnected' ? 'bg-destructive' : 'bg-green-500'}`}></span>
          </span>
        </div>
      </div>

      <div className="flex items-center h-full">
        <button
          className="h-full px-4 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
          title="Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
          title="Minimize"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleClose}
          className="h-full px-4 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors flex items-center justify-center"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

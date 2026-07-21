import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Palette, Minus, Square, X, Settings2, ChevronDown } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { PanelLeft } from 'lucide-react';
import { VoidLogo } from '@/components/ui/VoidLogo';
import { useTheme } from '@/hooks/useTheme';

export function TitleBar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  let toggleSidebar = () => {};
  try {
    const sidebar = useSidebar();
    toggleSidebar = sidebar.toggleSidebar;
  } catch (e) {
    // Graceful fallback if mounted outside SidebarProvider
  }
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
      className="h-10 flex justify-between items-center glass-panel-3d select-none sticky top-0 z-50 shadow-md"
    >
      <div className="flex items-center h-full gap-2 pointer-events-auto">
        <button
          onClick={toggleSidebar}
          className="h-full px-3 text-muted-foreground hover:text-foreground transition-all duration-150 flex items-center justify-center hover:bg-white/5 active:scale-95"
          title="Toggle Sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 px-2 pointer-events-none">
          <VoidLogo className="w-5 h-5" />
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1 tracking-wide">
              VOID
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </span>
            <span className="text-muted-foreground font-medium text-[11px] px-2.5 py-0.5 rounded-full btn-3d-secondary flex items-center gap-2 pointer-events-auto shadow-sm">
              <span className="max-w-[140px] truncate">{modelName}</span>
              <span className={`w-2 h-2 rounded-full ${modelName === 'Disconnected' ? 'bg-destructive glow-red-3d' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`}></span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center h-full pointer-events-auto gap-0.5 px-1">
        <button
          onClick={toggleTheme}
          className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 rounded hover:bg-white/10 active:scale-95 border border-white/10 bg-white/5"
          title={`Switch Theme (Current: ${theme === 'cosmic' ? 'Cosmic Blue' : 'Obsidian Silver'})`}
        >
          <Palette className={`w-3.5 h-3.5 ${theme === 'obsidian' ? 'text-slate-100' : 'text-cyan-400'}`} />
          <span className="text-[10px] hidden sm:inline font-mono uppercase tracking-wider">
            {theme === 'cosmic' ? 'Cosmic' : 'Obsidian'}
          </span>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="h-7 w-8 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center rounded hover:bg-white/10 active:scale-95"
          title="Settings"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMinimize}
          className="h-7 w-8 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center rounded hover:bg-white/10 active:scale-95"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-7 w-8 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center rounded hover:bg-white/10 active:scale-95"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="h-7 w-8 hover:bg-rose-600/90 hover:text-white text-muted-foreground transition-all flex items-center justify-center rounded active:scale-95"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

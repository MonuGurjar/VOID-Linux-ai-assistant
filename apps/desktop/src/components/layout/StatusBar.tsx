import { ShieldCheck, Database, Expand } from 'lucide-react';

export function StatusBar() {
  return (
    <div className="h-8 flex items-center justify-between px-4 border-t border-border/50 bg-background/95 text-xs text-muted-foreground select-none shrink-0">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Local AI &bull; No data leaves your device</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5" />
          <span>SQLite</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>Backend: Connected</span>
        </div>

        <button className="hover:text-foreground transition-colors p-1" title="Fullscreen">
          <Expand className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

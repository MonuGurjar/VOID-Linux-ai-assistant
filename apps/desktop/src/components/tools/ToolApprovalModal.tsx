import { Terminal, HardDrive, Package, Cpu, ShieldAlert, Check, X } from "lucide-react";

interface ToolApprovalModalProps {
  isOpen: boolean;
  toolName: string;
  arguments: Record<string, any>;
  onApprove: () => void;
  onDeny: () => void;
}

export function ToolApprovalModal({
  isOpen,
  toolName,
  arguments: args,
  onApprove,
  onDeny,
}: ToolApprovalModalProps) {
  if (!isOpen) return null;

  const getToolIcon = () => {
    switch (toolName) {
      case "terminal_execute":
        return <Terminal className="w-5 h-5 text-amber-400" />;
      case "filesystem_read":
      case "filesystem_write":
      case "filesystem_list":
        return <HardDrive className="w-5 h-5 text-cyan-400" />;
      case "package_manager_query":
        return <Package className="w-5 h-5 text-purple-400" />;
      case "system_info":
        return <Cpu className="w-5 h-5 text-blue-400" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="card-3d-object w-full max-w-lg p-6 border border-white/20 shadow-2xl space-y-4 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 inset-3d">
            {getToolIcon()}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Tool Permission Request
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Action Required
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              VOID AI requests permission to execute <code className="text-cyan-400 font-mono">{toolName}</code>
            </p>
          </div>
        </div>

        {/* Arguments Body */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Arguments & Payload
          </label>
          <div className="bg-black/60 rounded-xl p-3 border border-white/10 text-xs font-mono text-cyan-300 overflow-x-auto max-h-48 overflow-y-auto inset-3d leading-relaxed">
            <pre>{JSON.stringify(args, null, 2)}</pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            onClick={onDeny}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold btn-3d-secondary text-rose-300 hover:text-rose-200 transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Deny Action
          </button>
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold btn-3d-primary text-white transition-all active:scale-95 cursor-pointer shadow-lg"
          >
            <Check className="w-3.5 h-3.5" />
            Approve & Execute
          </button>
        </div>
      </div>
    </div>
  );
}

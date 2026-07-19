import { Terminal, FileText, Code2, Search, BrainCircuit, Folder } from 'lucide-react';
import { VoidLogo } from '@/components/ui/VoidLogo';

export function WelcomeGrid() {
  const suggestions = [
    {
      title: "Run a command",
      description: "Execute terminal commands",
      icon: Terminal,
      color: "text-green-500",
      borderColor: "border-green-500/20"
    },
    {
      title: "Summarize a file",
      description: "Get key insights from your documents",
      icon: FileText,
      color: "text-zinc-100",
      borderColor: "border-zinc-500/20"
    },
    {
      title: "Explain code",
      description: "Understand and improve your code",
      icon: Code2,
      color: "text-red-500",
      borderColor: "border-red-500/20"
    },
    {
      title: "Search knowledge",
      description: "Search your indexed documents",
      icon: Search,
      color: "text-amber-500",
      borderColor: "border-amber-500/20"
    },
    {
      title: "Brainstorm ideas",
      description: "Generate ideas and solutions",
      icon: BrainCircuit,
      color: "text-purple-500",
      borderColor: "border-purple-500/20"
    },
    {
      title: "Analyze project",
      description: "Deep analysis of your codebase",
      icon: Folder,
      color: "text-blue-500",
      borderColor: "border-blue-500/20"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-3xl mx-auto px-6 py-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="w-24 h-24 mb-6 flex items-center justify-center relative">
          <VoidLogo size={96} />
        </div>
        <h1 className="text-4xl font-black mb-3 tracking-tight text-white drop-shadow-md">
          Welcome to <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent">VOID</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-md font-medium">
          Your tactile, offline AI companion. Private. Local. Unlimited.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {suggestions.map((item, i) => (
          <button
            key={i}
            className="flex items-start gap-4 p-4 card-3d-object text-left group"
          >
            <div className={`p-3 rounded-xl inset-3d group-hover:scale-110 transition-transform duration-200 shadow-inner`}>
              <item.icon className={`w-5 h-5 ${item.color} drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`} />
            </div>
            <div>
              <h3 className="font-bold text-xs mb-1 text-foreground tracking-wide group-hover:text-red-400 transition-colors">{item.title}</h3>
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed font-normal">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

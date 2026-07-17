import { Terminal, FileText, Code2, Search, BrainCircuit, Folder } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center h-full w-full max-w-3xl mx-auto px-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 mb-6 rounded-2xl border-4 border-primary flex items-center justify-center p-3 relative">
          <div className="absolute -inset-2 rounded-2xl border border-primary/20 border-dashed animate-[spin_10s_linear_infinite]" />
          <div className="w-8 h-8 bg-primary rounded-lg"></div>
        </div>
        <h1 className="text-3xl font-bold mb-3 tracking-tight">
          Welcome to <span className="text-primary">VOID</span>
        </h1>
        <p className="text-muted-foreground text-lg text-center max-w-md">
          Your offline AI companion. Private. Local. Powerful.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {suggestions.map((item, i) => (
          <button
            key={i}
            className={`flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 hover:border-border transition-all text-left group`}
          >
            <div className={`p-2.5 rounded-lg border ${item.borderColor} bg-background/50 group-hover:scale-110 transition-transform`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1 text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

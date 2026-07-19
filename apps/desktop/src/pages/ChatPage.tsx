import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { SendHorizontal, Plus, Paperclip, ChevronDown } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { WelcomeGrid } from "@/components/layout/WelcomeGrid";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Model settings state
  const [models, setModels] = useState<{id: string, name: string}[]>([]);
  const [activeModel, setActiveModel] = useState<string>("");
  const [activeProvider, setActiveProvider] = useState<string>("ollama");

  const scrollRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  // Fetch messages if we load an existing chat
  useEffect(() => {
    if (id) {
      if (isSendingRef.current) return;
      fetch(`${API_URL}/conversations/${id}/messages`)
        .then((res) => res.json())
        .then((data: Message[]) => {
           if (!isSendingRef.current) {
             // Filter out empty ghost messages from history
             setMessages(data.filter(m => m.content !== "" || m.role === "user"));
           }
        })
        .catch((err) => console.error("Failed to load messages", err));
    } else {
      if (!isSendingRef.current) {
        setMessages([]);
      }
    }
  }, [id, API_URL]);

  // Fetch AI settings and models
  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_URL}/ai/models`);
      const data = await res.json();
      setModels(data);
    } catch(err) {
      console.error("Failed to load models:", err);
    }
  };

  useEffect(() => {
    fetchModels();

    fetch(`${API_URL}/settings/`)
      .then(res => res.json())
      .then(data => {
        if (data.ai_model) setActiveModel(data.ai_model);
        if (data.ai_base_url?.includes("1234")) {
          setActiveProvider("lmstudio");
        } else {
          setActiveProvider("ollama");
        }
      })
      .catch(err => console.error("Failed to load settings:", err));
  }, [API_URL]);

  const handleProviderChange = async (provider: string) => {
    setActiveProvider(provider);
    const newUrl = provider === "lmstudio" ? "http://localhost:1234/v1" : "http://localhost:11434/v1";
    try {
      await fetch(`${API_URL}/settings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_base_url: newUrl, ai_model: "" }) // reset model
      });
      setActiveModel("");
      fetchModels(); // Refetch models from new provider
    } catch (err) {
      console.error("Failed to switch provider", err);
    }
  };

  const handleModelChange = async (newModel: string) => {
    setActiveModel(newModel);
    try {
      await fetch(`${API_URL}/settings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_model: newModel })
      });
    } catch (err) {
      console.error("Failed to update model setting", err);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    isSendingRef.current = true;
    const userMessage = input.trim();
    setInput("");
    
    // Optimistic UI update
    const newMsg: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, newMsg]);
    setIsLoading(true);

    try {
      let chatId = id;
      
      // If no ID, create a new conversation first
      if (!chatId) {
        const createRes = await fetch(`${API_URL}/conversations/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: userMessage.slice(0, 30) + "..." }),
        });
        if (!createRes.ok) throw new Error("Failed to create conversation");
        const chatData = await createRes.json();
        chatId = chatData.id;
        // Update URL silently so refresh keeps us in this chat
        navigate(`/chat/${chatId}`, { replace: true });
      }

      // Send message and get streaming response
      const msgRes = await fetch(`${API_URL}/conversations/${chatId}/messages/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content: userMessage }),
      });
      
      if (!msgRes.ok) throw new Error("Failed to get response");
      if (!msgRes.body) throw new Error("No response body");

      const reader = msgRes.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg: Message = { role: "assistant", content: "", created_at: new Date().toISOString() };
      
      // Add empty assistant message to UI
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false); // Can hide loader since we are streaming now

      let isDone = false;
      while (!isDone) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              isDone = true;
              break;
            }
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                 throw new Error(data.error);
              }
              if (data.content) {
                assistantMsg.content += data.content;
                // Update UI continuously
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = { ...assistantMsg };
                  return newMsgs;
                });
              }
            } catch (e) {
              console.error("Error parsing stream chunk", e, dataStr);
            }
          }
        }
      }

      // If stream finished and message is still empty, remove it (e.g. error)
      if (!assistantMsg.content) {
        setMessages(prev => prev.slice(0, -1));
      }
      
    } catch (err: any) {
      console.error("Failed to send message", err);
      setError(err.message || "An error occurred");
      // Remove empty ghost message if error occurred
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === "assistant" && !prev[prev.length - 1].content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      setIsLoading(false);
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      <ScrollArea className="flex-1">
        {messages.length === 0 ? (
          <WelcomeGrid />
        ) : (
          <div className="max-w-4xl mx-auto space-y-6 p-4 lg:p-8 pb-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 relative group ${
                    msg.role === "user"
                      ? "btn-3d-primary font-medium text-white shadow-lg"
                      : "bg-transparent text-foreground"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none min-h-6">
                      {msg.content === "" ? (
                        <div className="flex items-center gap-1.5 h-6">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce glow-red-3d" />
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.2s] glow-red-3d" />
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.4s] glow-red-3d" />
                        </div>
                      ) : (
                        <ReactMarkdown 
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            code({node, className, children, ...props}) {
                              const match = /language-(\w+)/.exec(className || '');
                              return match ? (
                                <div className="relative group/code rounded-xl overflow-hidden my-4 inset-3d border border-white/10 shadow-inner">
                                  <div className="flex items-center justify-between px-3.5 py-2 bg-white/5 text-xs text-muted-foreground border-b border-white/10 font-mono">
                                    <span className="font-semibold text-red-400">{match[1]}</span>
                                    <button 
                                      onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                                      className="hover:text-foreground transition-colors btn-3d-secondary px-2 py-0.5 rounded text-[10px]"
                                    >
                                      Copy Code
                                    </button>
                                  </div>
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </div>
                              ) : (
                                <code className={`${className} bg-white/10 rounded-md px-1.5 py-0.5 text-red-400 font-mono text-xs`} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  )}
                  {msg.created_at && (
                    <div className={`text-[10px] text-muted-foreground/80 mt-2 ${msg.role === "user" ? "text-right text-white/80" : "text-left"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-transparent text-foreground max-w-[85%] rounded-2xl px-5 py-3.5">
                  <div className="flex items-center gap-1.5 h-6">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce glow-red-3d" />
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce [animation-delay:0.2s] glow-red-3d" />
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce [animation-delay:0.4s] glow-red-3d" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center p-4">
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl px-4 py-3 text-xs font-semibold flex items-center justify-between w-full max-w-md shadow-lg backdrop-blur-md">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="text-rose-400 hover:text-white transition-colors">
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      <div className="px-4 md:px-8 pb-4 pt-2 shrink-0">
        <div className="max-w-4xl mx-auto relative">
          <div className="flex flex-col w-full rounded-2xl glass-panel-3d shadow-2xl transition-all border border-white/15">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex min-h-[60px] max-h-[40vh] w-full bg-transparent px-4 py-4 text-sm outline-none resize-none placeholder:text-muted-foreground/60 text-foreground"
              rows={1}
            />
            <div className="flex items-center justify-between p-2.5 pt-0">
              <div className="flex items-center gap-1.5">
                <button className="p-2 text-muted-foreground hover:text-foreground btn-3d-secondary rounded-xl transition-all">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-2 text-muted-foreground hover:text-foreground btn-3d-secondary rounded-xl transition-all">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground btn-3d-secondary rounded-xl transition-all">
                  @ Tools
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative flex items-center inset-3d rounded-xl p-1">
                  <button
                    onClick={() => handleProviderChange("ollama")}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      activeProvider === "ollama" ? "btn-3d-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Ollama
                  </button>
                  <button
                    onClick={() => handleProviderChange("lmstudio")}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      activeProvider === "lmstudio" ? "btn-3d-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    LM Studio
                  </button>
                </div>
                <div className="relative flex items-center">
                  <select 
                    value={activeModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="appearance-none px-3 py-1.5 pr-8 flex items-center gap-2 text-xs font-semibold text-foreground btn-3d-secondary rounded-xl cursor-pointer outline-none max-w-[200px] truncate"
                  >
                    <option value="" disabled className="bg-neutral-900">Select Model</option>
                    {models.map(m => (
                      <option key={m.id} value={m.id} className="bg-neutral-900">{m.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 pointer-events-none" />
                </div>
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 btn-3d-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all flex items-center justify-center shadow-lg"
                >
                  <SendHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

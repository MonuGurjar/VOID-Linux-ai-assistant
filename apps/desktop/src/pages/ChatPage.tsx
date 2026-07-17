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
  const scrollRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  // Fetch messages if we load an existing chat
  useEffect(() => {
    if (id) {
      fetch(`${API_URL}/conversations/${id}/messages`)
        .then((res) => res.json())
        .then((data) => setMessages(data))
        .catch((err) => console.error("Failed to load messages", err));
    } else {
      setMessages([]);
    }
  }, [id, API_URL]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
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

      // Send message
      const msgRes = await fetch(`${API_URL}/conversations/${chatId}/messages/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content: userMessage }),
      });
      
      if (!msgRes.ok) throw new Error("Failed to get response");
      
      const assistantMsg = await msgRes.json();
      setMessages((prev) => [...prev, assistantMsg]);
      
    } catch (err: any) {
      console.error("Failed to send message", err);
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <ScrollArea className="flex-1">
        {messages.length === 0 ? (
          <WelcomeGrid />
        ) : (
          <div className="max-w-4xl mx-auto space-y-6 p-4 lg:p-8 pb-32">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm relative group ${
                    msg.role === "user"
                      ? "bg-secondary text-foreground"
                      : "bg-transparent text-foreground"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown 
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          code({node, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <div className="relative group/code rounded-md overflow-hidden my-4 border border-border/50">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-secondary text-xs text-muted-foreground border-b border-border/50">
                                  <span>{match[1]}</span>
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                                    className="hover:text-foreground transition-colors"
                                  >
                                    Copy Code
                                  </button>
                                </div>
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </div>
                            ) : (
                              <code className={`${className} bg-secondary/50 rounded px-1.5 py-0.5 text-primary`} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  {msg.created_at && (
                    <div className={`text-[10px] text-muted-foreground mt-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
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
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center p-4">
                <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-4 py-3 text-sm flex items-center justify-between w-full max-w-md">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="text-destructive hover:opacity-70">
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      <div className="absolute bottom-4 left-0 right-0 px-4 md:px-8 pointer-events-none">
        <div className="max-w-4xl mx-auto relative pointer-events-auto">
          <div className="flex flex-col w-full rounded-2xl border border-border/60 bg-card shadow-lg focus-within:border-border/80 focus-within:ring-1 focus-within:ring-border transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex min-h-[60px] max-h-[40vh] w-full bg-transparent px-4 py-4 text-sm outline-none resize-none placeholder:text-muted-foreground"
              rows={1}
            />
            <div className="flex items-center justify-between p-2 pt-0">
              <div className="flex items-center gap-1.5">
                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:bg-muted rounded-lg transition-colors">
                  @ Tools
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-foreground border border-border/50 hover:bg-muted rounded-lg transition-colors">
                  Gemma 3 12B
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-opacity flex items-center justify-center"
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

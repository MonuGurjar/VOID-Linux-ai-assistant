import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Send, Plus, Paperclip, Mic } from "lucide-react";

import { WelcomeGrid } from "@/components/layout/WelcomeGrid";
import { useModelSelection } from "@/hooks/useModelSelection";

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

  // Model selection synced with Left Sidebar
  const { provider: activeProvider, selectedModel: activeModel } = useModelSelection();

  const scrollRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  // Fetch messages if we load an existing chat
  useEffect(() => {
    if (id) {
      if (isSendingRef.current) return;
      fetch(`${API_URL}/conversations/${id}/messages`)
        .then((res) => res.json())
        .then((data: Message[]) => {
          if (!isSendingRef.current) {
            setMessages(data.filter((m) => m.content !== "" || m.role === "user"));
          }
        })
        .catch((err) => console.error("Failed to load messages", err));
    } else {
      if (!isSendingRef.current) {
        setMessages([]);
      }
    }
  }, [id, API_URL]);

  // Auto-scroll chat message container safely without scrolling window body
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    // Optimistic UI update
    const userMsg: Message = { role: "user", content: userMessage, created_at: new Date().toISOString() };
    const assistantMsg: Message = { role: "assistant", content: "", created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    try {
      let chatId = id;
      if (!chatId) {
        const createRes = await fetch(`${API_URL}/conversations/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: userMessage.slice(0, 30) + "..." }),
        });
        if (!createRes.ok) throw new Error("Failed to create conversation");
        const chatData = await createRes.json();
        chatId = chatData.id;
        navigate(`/chat/${chatId}`, { replace: true });
      }

      const msgRes = await fetch(`${API_URL}/conversations/${chatId}/messages/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "user",
          content: userMessage,
          model: activeModel,
          provider: activeProvider,
        }),
      });

      if (!msgRes.ok) throw new Error("Failed to send message");
      if (!msgRes.body) throw new Error("No response body");

      const reader = msgRes.body.getReader();
      const decoder = new TextDecoder();
      let streamContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") break;
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.error) throw new Error(data.error);
              if (data.content) {
                streamContent += data.content;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = {
                    role: "assistant",
                    content: streamContent,
                    created_at: new Date().toISOString(),
                  };
                  return newMsgs;
                });
              }
            } catch (e) {
              if (dataStr && dataStr !== "[DONE]") {
                streamContent += dataStr;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = {
                    role: "assistant",
                    content: streamContent,
                    created_at: new Date().toISOString(),
                  };
                  return newMsgs;
                });
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to send message", err);
      setError(err.message || "An error occurred");
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].role === "assistant" && !prev[prev.length - 1].content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative min-h-0">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto">
          <WelcomeGrid />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto" ref={chatContainerRef}>
          <div className="max-w-4xl mx-auto space-y-6 p-4 lg:p-8 pb-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-xl backdrop-blur-md transition-all ${
                    msg.role === "user"
                      ? "btn-3d-primary text-white font-medium rounded-tr-xs"
                      : "card-3d-object text-foreground rounded-tl-xs"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none min-h-6">
                      {msg.content === "" ? (
                        <div className="flex items-center gap-1.5 h-6">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce glow-purple-3d" />
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s] glow-purple-3d" />
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s] glow-purple-3d" />
                        </div>
                      ) : (
                        <ReactMarkdown
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            code({ node, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || "");
                              return match ? (
                                <div className="relative group/code rounded-xl overflow-hidden my-4 inset-3d border border-white/10 shadow-inner">
                                  <div className="flex items-center justify-between px-3.5 py-2 bg-white/5 text-xs text-muted-foreground border-b border-white/10 font-mono">
                                    <span className="font-semibold text-purple-400">{match[1]}</span>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ""))}
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
                                <code
                                  className={`${className} bg-white/10 rounded-md px-1.5 py-0.5 text-purple-400 font-mono text-xs`}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  )}
                  {msg.created_at && (
                    <div
                      className={`text-[10px] text-muted-foreground/80 mt-2 ${
                        msg.role === "user" ? "text-right text-white/80" : "text-left"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="bg-transparent text-foreground max-w-[85%] rounded-2xl px-5 py-3.5">
                  <div className="flex items-center gap-1.5 h-6">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce glow-purple-3d" />
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s] glow-purple-3d" />
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s] glow-purple-3d" />
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
        </div>
      )}

      {/* Slim Single-Line Chat Input Bar */}
      <div className="px-4 md:px-8 pb-3 pt-1 shrink-0">
        <div className="max-w-4xl mx-auto relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2.5 w-full glass-panel-3d shadow-2xl rounded-2xl p-2 px-3 border border-white/15 focus-within:border-purple-500/50 transition-all"
          >
            {/* Left corner + Icon button & Attachment */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-2 text-muted-foreground hover:text-white btn-3d-secondary rounded-xl transition-all active:scale-95"
                title="Add attachment or tool"
              >
                <Plus className="w-4 h-4 text-purple-400" />
              </button>
              <button
                type="button"
                className="p-2 text-muted-foreground hover:text-white btn-3d-secondary rounded-xl transition-all active:scale-95 hidden sm:flex"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            {/* Slim Input Field */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask VOID anything..."
              className="flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/60 text-foreground font-medium"
            />

            {/* Right corner controls: Mic & Send Button */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="p-2 text-muted-foreground hover:text-white transition-colors"
                title="Voice Input"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="btn-3d-primary p-2.5 rounded-xl text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

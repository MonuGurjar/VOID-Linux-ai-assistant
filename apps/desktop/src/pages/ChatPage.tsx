import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Send, Plus, Paperclip, Mic, Brain, ChevronDown } from "lucide-react";

import { WelcomeGrid } from "@/components/layout/WelcomeGrid";
import { HorizontalModelSelector } from "@/components/layout/HorizontalModelSelector";
import { useModelSelection } from "@/hooks/useModelSelection";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

function parseMessageParts(content: string): { thinking: string; response: string } {
  if (!content) return { thinking: "", response: "" };

  // 1. Explicit <think>...</think> tags
  if (content.includes("<think>")) {
    const thinkEnd = content.indexOf("</think>");
    if (thinkEnd !== -1) {
      const thinking = content.slice(content.indexOf("<think>") + 7, thinkEnd).trim();
      const response = content.slice(thinkEnd + 8).trim();
      return { thinking, response };
    } else {
      // Currently streaming inside <think> tag
      const thinking = content.slice(content.indexOf("<think>") + 7).trim();
      return { thinking, response: "" };
    }
  }

  // 2. Explicit 🧠 **Thought Process** block
  if (content.includes("🧠 **Thought Process**")) {
    const parts = content.split("---");
    if (parts.length >= 2) {
      const thinking = parts[0]
        .replace(/>\s*🧠\s*\*\*Thought Process\*\*/gi, "")
        .replace(/^>\s*/gm, "")
        .trim();
      const response = parts.slice(1).join("---").trim();
      return { thinking, response };
    }
  }

  // 3. Monologue thinking prefix (e.g. "Okay, the user...", "Let's see...", "I need to...")
  const monologueStartPattern = /^\s*(Okay|Let's|The user|Hmm|Wait|First,|I should|I need|I will|Thinking)/i;
  if (monologueStartPattern.test(content)) {
    // Search for where the actual response answer starts
    const answerMarkerMatch = content.match(/(Hello!|Hi!|Hey!|Welcome|Sure!|Here is|Certainly!|Okay!|\n\n(?=[A-Z0-9]))/i);
    
    if (answerMarkerMatch && answerMarkerMatch.index !== undefined && answerMarkerMatch.index > 5) {
      const thinking = content.slice(0, answerMarkerMatch.index).trim();
      const response = content.slice(answerMarkerMatch.index).trim();
      return { thinking, response };
    } else {
      // Still streaming thinking monologue — keep response EMPTY so no monologue leaks into body!
      return { thinking: content.trim(), response: "" };
    }
  }

  return { thinking: "", response: content };
}

function ThinkingAccordion({ thinkingText, isDone }: { thinkingText: string; isDone?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-3.5 rounded-xl border border-white/10 bg-black/40 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-white/5 transition-all select-none cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{isDone ? "Thought Process" : "Thinking..."}</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {isDone ? `(${thinkingText.length} chars)` : "• live"}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-3.5 py-2.5 text-[11px] font-mono text-muted-foreground/90 border-t border-white/10 bg-black/60 leading-relaxed overflow-x-auto max-h-60 overflow-y-auto inset-3d select-text">
          {thinkingText}
        </div>
      )}
    </div>
  );
}

export function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { provider: activeProvider, selectedModel: activeModel } = useModelSelection();

  const scrollRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
      let thinkingAccumulator = "";
      let responseAccumulator = "";

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

              if (data.thinking) {
                thinkingAccumulator += data.thinking;
              }
              if (data.content) {
                responseAccumulator += data.content;
              }

              const formattedPayload = thinkingAccumulator
                ? `<think>\n${thinkingAccumulator}\n</think>\n\n${responseAccumulator}`
                : responseAccumulator;

              setMessages((prev) => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = {
                  role: "assistant",
                  content: formattedPayload,
                  created_at: new Date().toISOString(),
                };
                return newMsgs;
              });
            } catch (e) {
              if (dataStr && dataStr !== "[DONE]") {
                responseAccumulator += dataStr;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = {
                    role: "assistant",
                    content: responseAccumulator,
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
      {/* Top Header Row — Model Selector pinned to the right */}
      <div className="flex items-center justify-end px-4 md:px-8 pt-2 pb-1 shrink-0">
        <HorizontalModelSelector />
      </div>

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto">
          <WelcomeGrid />
        </div>
      ) : (
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-6 min-h-0 no-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, index) => {
              const { thinking, response } = msg.role === "assistant" ? parseMessageParts(msg.content) : { thinking: "", response: msg.content };

              return (
                <div
                  key={index}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
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
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce glow-blue-3d" />
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s] glow-blue-3d" />
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s] glow-blue-3d" />
                          </div>
                        ) : (
                          <>
                            {/* Collapsible Collapsed-by-default Thinking Accordion */}
                            {thinking && (
                              <ThinkingAccordion
                                thinkingText={thinking}
                                isDone={!isLoading || index < messages.length - 1}
                              />
                            )}
                            
                            {/* Main Answer Content */}
                            {response && (
                              <ReactMarkdown
                                rehypePlugins={[rehypeHighlight]}
                                components={{
                                  code({ node, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    return match ? (
                                      <div className="relative group/code rounded-xl overflow-hidden my-4 inset-3d border border-white/10 shadow-inner">
                                        <div className="flex items-center justify-between px-3.5 py-2 bg-white/5 text-xs text-muted-foreground border-b border-white/10 font-mono">
                                          <span className="font-semibold text-cyan-400">{match[1]}</span>
                                          <button
                                            onClick={() =>
                                              navigator.clipboard.writeText(String(children).replace(/\n$/, ""))
                                            }
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
                                        className={`${className} bg-white/10 rounded-md px-1.5 py-0.5 text-cyan-400 font-mono text-xs`}
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    );
                                  },
                                }}
                              >
                                {response}
                              </ReactMarkdown>
                            )}
                          </>
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
              );
            })}

            {isLoading && (
              <div className="flex items-start">
                <div className="bg-transparent text-foreground max-w-[85%] rounded-2xl px-5 py-3.5">
                  <div className="flex items-center gap-1.5 h-6">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce glow-blue-3d" />
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s] glow-blue-3d" />
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s] glow-blue-3d" />
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
            className="flex items-center gap-2.5 w-full glass-panel-glossy shadow-2xl rounded-2xl p-2 px-3 border border-white/15 focus-within:border-blue-500/50 transition-all"
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-2 text-muted-foreground hover:text-white btn-3d-secondary rounded-xl transition-all active:scale-95"
                title="Add attachment or tool"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
              </button>
              <button
                type="button"
                className="p-2 text-muted-foreground hover:text-white btn-3d-secondary rounded-xl transition-all active:scale-95 hidden sm:flex"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask VOID anything..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none px-1 py-1 font-medium"
            />

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="p-2 text-muted-foreground hover:text-white btn-3d-secondary rounded-xl transition-all active:scale-95 hidden sm:flex"
                title="Voice input"
              >
                <Mic className="w-4 h-4 text-cyan-400" />
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="btn-3d-primary p-2.5 rounded-xl text-white disabled:opacity-40 disabled:hover:transform-none transition-all active:scale-95 shadow-md flex items-center justify-center"
                title="Send message"
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

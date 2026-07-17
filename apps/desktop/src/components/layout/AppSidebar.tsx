import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { Plus, Settings, MessageSquare, Search, PanelLeftClose, ChevronDown, MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Conversation {
  id: number;
  title: string;
  updated_at: string;
}

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const fetchConversations = () => {
    fetch(`${API_URL}/conversations/`)
      .then(res => res.json())
      .then(data => setConversations(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchConversations();
    // Simple polling for now to keep sidebar synced
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: number) => {
    await fetch(`${API_URL}/conversations/${id}`, { method: "DELETE" });
    fetchConversations();
    if (location.pathname === `/chat/${id}`) {
      navigate("/");
    }
  };

  const handleRename = async (id: number) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    await fetch(`${API_URL}/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle.trim() })
    });
    setEditingId(null);
    fetchConversations();
  };

  const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  // Setup keyboard shortcut for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('conversation-search');
        if (searchInput) searchInput.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <Sidebar className="border-r border-border/50 bg-sidebar/50">
      <SidebarHeader className="p-4 flex flex-col gap-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3 px-2">
          <div className="relative flex items-center justify-center">
            <img src="/logo-red.png" alt="VOID Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-tight text-primary">VOID</span>
            <span className="text-xs text-muted-foreground">AI Assistant</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link 
            to="/" 
            className="flex-1 flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 rounded-lg text-sm font-medium py-2 transition-colors"
          >
            <Plus className="w-4 h-4 text-primary" />
            New Chat
          </Link>
          <button className="p-2 bg-secondary/50 hover:bg-secondary border border-border/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            id="conversation-search"
            type="text" 
            placeholder="Search conversations..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border/50 rounded-lg py-1.5 pl-9 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            Ctrl K
          </kbd>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filtered.map(c => {
                const isActive = location.pathname === `/chat/${c.id}`;
                const isEditing = editingId === c.id;
                return (
                  <SidebarMenuItem key={c.id}>
                    <SidebarMenuButton 
                      isActive={isActive} 
                      onClick={() => !isEditing && navigate(`/chat/${c.id}`)}
                      className={`group relative ${isActive ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" : ""}`}
                    >
                      <MessageSquare className="w-4 h-4 min-w-4" />
                      {isEditing ? (
                        <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                          <input 
                            autoFocus
                            type="text" 
                            className="flex-1 bg-background border border-border px-1 text-sm rounded outline-none" 
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRename(c.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button onClick={() => handleRename(c.id)} className="text-green-500 hover:text-green-400">
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="truncate pr-4">{c.title}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger 
                              className="absolute right-2 p-1 rounded hover:bg-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity" 
                              onClick={e => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 border-border/50">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setEditTitle(c.title); }}>
                                <Pencil className="w-4 h-4 mr-2" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No conversations found.
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 space-y-4">
        <Link to="/settings" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground px-2 py-1.5 transition-colors">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
        
        <button className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border/50 text-left">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-medium">
                V
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-sidebar" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none mb-1 text-foreground">VOID User</span>
              <span className="text-xs text-muted-foreground leading-none">Local Mode</span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

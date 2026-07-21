import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { VoidLogo } from "@/components/ui/VoidLogo";
import {
  Plus,
  Settings,
  MessageSquare,
  Search,
  PanelLeftClose,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  Star,
} from "lucide-react";

import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
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

interface GroupedConversations {
  today: Conversation[];
  yesterday: Conversation[];
  older: Conversation[];
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  }

  if (date >= startOfYesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupConversations(conversations: Conversation[]): GroupedConversations {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const groups: GroupedConversations = { today: [], yesterday: [], older: [] };

  for (const c of conversations) {
    const date = new Date(c.updated_at);
    if (date >= startOfToday) {
      groups.today.push(c);
    } else if (date >= startOfYesterday) {
      groups.yesterday.push(c);
    } else {
      groups.older.push(c);
    }
  }

  return groups;
}

const pinnedItems = [
  { id: "pinned-docs", title: "Project Docs" },
  { id: "pinned-notes", title: "Research Notes" },
];

interface AppSidebarProps {
  width?: number;
  onResizeStart?: (e: React.MouseEvent) => void;
}

export function AppSidebar({ width = 280, onResizeStart }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { open, toggleSidebar } = useSidebar();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const fetchConversations = () => {
    fetch(`${API_URL}/conversations/`)
      .then((res) => res.json())
      .then((data) => setConversations(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchConversations();
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
      body: JSON.stringify({ title: editTitle.trim() }),
    });
    setEditingId(null);
    fetchConversations();
  };

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = useMemo(() => groupConversations(filtered), [filtered]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("conversation-search");
        if (searchInput) searchInput.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const renderConversationItem = (c: Conversation) => {
    const isActive = location.pathname === `/chat/${c.id}`;
    const isEditing = editingId === c.id;

    return (
      <SidebarMenuItem key={c.id}>
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => !isEditing && navigate(`/chat/${c.id}`)}
          className={`group relative ${
            isActive
              ? "border-l-2 border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary rounded-l-none"
              : ""
          }`}
        >
          <MessageSquare className="w-4 h-4 min-w-4" />
          {isEditing ? (
            <div
              className="flex items-center gap-1 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                type="text"
                className="flex-1 bg-background border border-border px-1 text-sm rounded outline-none"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename(c.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
              />
              <button
                onClick={() => handleRename(c.id)}
                className="text-green-500 hover:text-green-400"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="text-red-500 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <span className="truncate flex-1">{c.title}</span>
              <span className="ml-auto text-[11px] text-muted-foreground shrink-0 group-hover:hidden">
                {formatTime(c.updated_at)}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="absolute right-2 p-1 rounded hover:bg-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 border-border/50">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(c.id);
                      setEditTitle(c.title);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const hasResults = filtered.length > 0 || !search;

  return (
    <aside
      style={{ width: open ? `${width}px` : "0px" }}
      className={`shrink-0 h-full rounded-2xl border sidebar-solid-panel shadow-2xl overflow-hidden select-none transition-all duration-300 cubic-bezier(0.16,1,0.3,1) relative z-20 will-change-[width,opacity] transform-gpu ${
        open
          ? "opacity-100 border-white/15"
          : "opacity-0 border-transparent pointer-events-none"
      }`}
    >
      <div
        style={{ width: `${width}px` }}
        className="h-full flex flex-col justify-between"
      >
      {/* Right Edge Resize Handle */}
      {open && onResizeStart && (
        <div
          onMouseDown={onResizeStart}
          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-cyan-400/60 active:bg-cyan-400 transition-colors z-30 group flex items-center justify-center"
          title="Drag to resize sidebar"
        >
          <div className="w-0.5 h-8 bg-white/30 rounded-full group-hover:bg-cyan-200 group-hover:scale-y-125 transition-all" />
        </div>
      )}
      {/* Permanent Fixed Header: Logo, New Chat Button & Search */}
      <div className="p-4 flex flex-col gap-3 shrink-0 border-b border-white/10">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <VoidLogo className="w-7 h-7" />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm leading-tight text-white tracking-wider">VOID</span>
              <span className="text-[10px] text-muted-foreground font-medium">AI Assistant</span>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all active:scale-95"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Primary New Chat Action */}
        <Link
          to="/"
          className="w-full flex items-center justify-center gap-2 btn-3d-primary rounded-xl text-xs font-bold py-2.5 shadow-lg tracking-wide hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 text-white" />
          New Chat
        </Link>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            id="conversation-search"
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full inset-3d rounded-xl py-1.5 pl-8 pr-12 text-xs focus:outline-none text-foreground placeholder:text-muted-foreground/60"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground/70 bg-white/5 border border-white/10 px-1 py-0.5 rounded">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Scrollable Conversation List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-2 no-scrollbar">
        {grouped.today.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/70 px-2 py-1">
              Today
            </div>
            <ul className="flex flex-col gap-0.5">{grouped.today.map(renderConversationItem)}</ul>
          </div>
        )}

        {grouped.yesterday.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/70 px-2 py-1">
              Yesterday
            </div>
            <ul className="flex flex-col gap-0.5">{grouped.yesterday.map(renderConversationItem)}</ul>
          </div>
        )}

        {grouped.older.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/70 px-2 py-1">
              Older
            </div>
            <ul className="flex flex-col gap-0.5">{grouped.older.map(renderConversationItem)}</ul>
          </div>
        )}

        {!hasResults && (
          <div className="text-center py-4 text-xs text-muted-foreground">
            No conversations found.
          </div>
        )}

        <div className="flex flex-col gap-1 pt-2">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/70 px-2 py-1">
            Pinned
          </div>
          <ul className="flex flex-col gap-0.5">
            {pinnedItems.map((item) => (
              <li key={item.id}>
                <div className="flex items-center gap-2 p-2 rounded-lg text-xs font-medium hover:bg-white/5 cursor-default">
                  <Star className="w-3.5 h-3.5 min-w-3.5 text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                  <span className="truncate">{item.title}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Permanent Fixed Footer: Settings & Profile */}
      <div className="p-3 shrink-0 border-t border-white/10 space-y-2">
        <Link
          to="/settings"
          className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-xl transition-all hover:bg-white/5"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>

        <button className="flex items-center justify-between w-full p-2 rounded-xl btn-3d-secondary text-left">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-7 h-7 rounded-full btn-3d-primary flex items-center justify-center font-bold text-xs">
                V
              </div>
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-sidebar shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold leading-none mb-1 text-foreground">
                VOID User
              </span>
              <span className="text-[9px] text-muted-foreground leading-none">Local AI Active</span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      </div>
    </aside>
  );
}

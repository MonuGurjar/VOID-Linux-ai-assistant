import { Link } from "react-router";
import { Plus, Settings, MessageSquare, Hexagon, Search, PanelLeftClose, Star, ChevronDown } from "lucide-react";

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

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-border/50 bg-sidebar/50">
      <SidebarHeader className="p-4 flex flex-col gap-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3 px-2">
          <div className="relative flex items-center justify-center text-primary">
            <Hexagon className="w-8 h-8" strokeWidth={1.5} />
            <div className="absolute w-3 h-3 bg-primary rounded-sm rotate-45" />
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
            type="text" 
            placeholder="Search conversations..." 
            className="w-full bg-background border border-border/50 rounded-lg py-1.5 pl-9 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            Ctrl K
          </kbd>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        {/* Today Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">Today</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">
                  <MessageSquare className="w-4 h-4" />
                  <span className="truncate">Welcome to VOID</span>
                  <span className="ml-auto text-[10px] opacity-70">10:30 AM</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <MessageSquare className="w-4 h-4" />
                  <span className="truncate">Linux Commands Help</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">09:15 AM</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <MessageSquare className="w-4 h-4" />
                  <span className="truncate">Docker Issue Debugging</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">08:45 AM</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Yesterday Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">Yesterday</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <MessageSquare className="w-4 h-4" />
                  <span className="truncate">Python Script Review</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">Yesterday</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <MessageSquare className="w-4 h-4" />
                  <span className="truncate">RAG Architecture Overview</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">Yesterday</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pinned Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">Pinned</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="truncate">Project Docs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="truncate">Research Notes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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

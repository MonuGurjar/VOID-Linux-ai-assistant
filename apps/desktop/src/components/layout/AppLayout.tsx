import { Outlet } from "react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TitleBar } from "./TitleBar";
import { StatusBar } from "./StatusBar";

export function AppLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground rounded-lg shadow-2xl">
      <TitleBar />
      <SidebarProvider className="flex-1 min-h-0 overflow-hidden">
        <AppSidebar />
        <main className="flex flex-col flex-1 min-w-0 bg-background relative border-l border-border/50 overflow-hidden">
          <div className="absolute top-4 left-4 z-10 lg:hidden">
            <SidebarTrigger className="bg-background/80 backdrop-blur-sm" />
          </div>
          <div className="flex-1 overflow-hidden relative">
            <Outlet />
          </div>
          <StatusBar />
        </main>
      </SidebarProvider>
    </div>
  );
}

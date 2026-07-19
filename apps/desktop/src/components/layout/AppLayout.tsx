import { Outlet } from "react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TitleBar } from "./TitleBar";
import { StatusBar } from "./StatusBar";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden spatial-bg-3d text-foreground rounded-lg shadow-2xl relative">
      {/* Background Ambient Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/15 rounded-full blur-[120px] pointer-events-none ambient-orb-red" />
      <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none ambient-orb-indigo" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-rose-900/10 rounded-full blur-[160px] pointer-events-none" />

      <SidebarProvider className="flex h-full w-full overflow-hidden relative z-10">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TitleBar />
          <main className="flex flex-col flex-1 min-w-0 bg-transparent relative border-l border-white/10 overflow-hidden">
            <div className="absolute top-4 left-4 z-10 lg:hidden">
              <SidebarTrigger className="bg-background/80 backdrop-blur-sm" />
            </div>
            <div className="flex-1 overflow-hidden relative">
              <Outlet />
            </div>
            <StatusBar />
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}

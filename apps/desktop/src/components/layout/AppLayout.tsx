import { Outlet } from "react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { RightSidebar } from "./RightSidebar";
import { TitleBar } from "./TitleBar";


export function AppLayout() {
  return (
    <SidebarProvider className="flex flex-col h-screen w-screen overflow-hidden spatial-bg-3d text-foreground shadow-2xl relative select-none">
      {/* Background Ambient Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none ambient-orb-red" />
      <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-cyan-600/20 rounded-full blur-[140px] pointer-events-none ambient-orb-indigo" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-sky-900/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Window TitleBar */}
      <TitleBar />

      {/* Main App Workspace */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden relative z-10">
        <AppSidebar />
        <main className="flex flex-col flex-1 min-w-0 min-h-0 bg-transparent relative border-x border-white/10 overflow-hidden">
          <div className="absolute top-4 left-4 z-10 lg:hidden">
            <SidebarTrigger className="bg-background/80 backdrop-blur-sm" />
          </div>
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
            <Outlet />
          </div>

        </main>
        <RightSidebar />
      </div>
    </SidebarProvider>
  );
}

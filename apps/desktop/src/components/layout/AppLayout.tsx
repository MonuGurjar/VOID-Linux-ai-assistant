import { useState, useCallback } from "react";
import { Outlet } from "react-router";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { RightSidebar } from "./RightSidebar";
import { TitleBar } from "./TitleBar";
import { PanelLeftOpen, PanelRightOpen } from "lucide-react";

function MainContentWrapper() {
  const { open: leftOpen, toggleSidebar: toggleLeftSidebar } = useSidebar();
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(300);

  // Resize handling for Left Sidebar
  const handleLeftResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = leftWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.min(Math.max(startWidth + delta, 200), 480);
        setLeftWidth(newWidth);
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [leftWidth]
  );

  // Resize handling for Right Sidebar
  const handleRightResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = rightWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = startX - moveEvent.clientX;
        const newWidth = Math.min(Math.max(startWidth + delta, 240), 500);
        setRightWidth(newWidth);
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [rightWidth]
  );

  return (
    <div className="flex flex-1 min-h-0 w-full overflow-hidden relative z-10 p-2 gap-2">
      {/* Left Resizable & Collapsible Glossy Sidebar */}
      <AppSidebar width={leftWidth} onResizeStart={handleLeftResizeStart} />

      {/* Central Main Workspace Canvas */}
      <main className="flex flex-col flex-1 min-w-0 min-h-0 bg-transparent relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-300 cubic-bezier(0.16,1,0.3,1)">
        {/* Floating Expand Triggers when sidebars are collapsed */}
        {!leftOpen && (
          <button
            onClick={toggleLeftSidebar}
            className="absolute top-3 left-3 z-30 btn-3d-secondary p-2 rounded-xl text-cyan-400 border border-white/15 shadow-2xl hover:scale-105 active:scale-95 transition-all"
            title="Expand Left Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {!rightOpen && (
          <button
            onClick={() => setRightOpen(true)}
            className="absolute top-3 right-3 z-30 btn-3d-secondary p-2 rounded-xl text-cyan-400 border border-white/15 shadow-2xl hover:scale-105 active:scale-95 transition-all"
            title="Expand Right Sidebar"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
        )}

        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
          <Outlet />
        </div>
      </main>

      {/* Right Resizable & Collapsible Glossy Sidebar */}
      <RightSidebar
        open={rightOpen}
        width={rightWidth}
        onToggle={() => setRightOpen((prev) => !prev)}
        onResizeStart={handleRightResizeStart}
      />
    </div>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider className="flex flex-col h-screen w-screen overflow-hidden spatial-bg-3d text-foreground shadow-2xl relative select-none">


      {/* Top Window TitleBar */}
      <TitleBar />

      {/* Main App Workspace */}
      <MainContentWrapper />
    </SidebarProvider>
  );
}

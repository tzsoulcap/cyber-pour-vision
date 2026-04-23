import { useState } from "react";
import { Sidebar, type ViewMode, type CameraId } from "@/components/console/Sidebar";
import { LiveFeed } from "@/components/console/LiveFeed";
import { DataSidebar } from "@/components/console/DataSidebar";
import { BottomDashboard } from "@/components/console/BottomDashboard";
import { ArchiveView } from "@/components/console/ArchiveView";

const Index = () => {
  const [view, setView] = useState<ViewMode>("live");
  const [camera, setCamera] = useState<CameraId>("CAM 01");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar
        view={view}
        onViewChange={setView}
        activeCamera={camera}
        onCameraChange={setCamera}
      />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-surface/60 backdrop-blur flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-display font-bold text-lg tracking-[0.15em] text-foreground">
              {view === "live" ? "REAL-TIME AI INSPECTION" : "IMAGE ARCHIVE"}
            </h1>
            <span className="font-mono text-[10px] text-muted-foreground tracking-[0.25em] px-2 py-0.5 rounded border border-border">
              FOUNDRY · LINE A
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground tracking-wider">
            <span className="text-primary">● AI MODEL v4.2.1</span>
            <span>OPERATOR · J. MORALES</span>
            <span className="text-accent">2024-03-15 · 14:32:08 UTC</span>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-hidden">
          {view === "live" ? (
            <div className="h-full flex flex-col gap-4">
              <div className="flex-1 min-h-0 flex gap-4">
                <div className="flex-1 min-w-0">
                  <LiveFeed cameraId={camera} />
                </div>
                <DataSidebar />
              </div>
              <div className="shrink-0">
                <BottomDashboard />
              </div>
            </div>
          ) : (
            <ArchiveView />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;

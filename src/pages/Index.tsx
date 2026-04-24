import { useState, useEffect } from "react";

function useBangkokTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const p = Object.fromEntries(fmt.map(({ type, value }) => [type, value]));
  return `${p.year}-${p.month}-${p.day} · ${p.hour}:${p.minute}:${p.second} UTC+7`;
}

import { Sidebar, type ViewMode, type CameraId } from "@/components/console/Sidebar";
import { LiveFeed } from "@/components/console/LiveFeed";
import { DataSidebar } from "@/components/console/DataSidebar";
import { BottomDashboard } from "@/components/console/BottomDashboard";
import { ArchiveView } from "@/components/console/ArchiveView";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

const Index = () => {
  const [view, setView] = useState<ViewMode>("live");
  const [camera, setCamera] = useState<CameraId>("");
  const bangkokTime = useBangkokTime();
  const { theme, toggleTheme } = useTheme();

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
            <span className="text-accent">{bangkokTime}</span>
            <button
              onClick={toggleTheme}
              className="ml-1 p-1.5 rounded-md border border-border hover:border-primary/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-hidden">
          {view === "live" ? (
            <div className="h-full flex flex-col gap-4">
              <div className="flex-1 min-h-0 flex gap-4">
                <div className="flex-1 min-w-0">
                  <LiveFeed cameraId={camera} />
                </div>
                <DataSidebar cameraId={camera} />
              </div>
              <div className="shrink-0">
                <BottomDashboard cameraId={camera} />
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

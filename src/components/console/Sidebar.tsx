import { useState, useEffect } from "react";
import { Activity, Archive, Camera, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "live" | "archive";
export type CameraId = string;

const API_BASE = "http://192.168.212.10:5000";

type ApiCamera = {
  id: string;
  connected: boolean;
  fps: number;
  trigger_active: boolean;
  charge: number;
  mold: number;
  pattern: number;
  images_saved: number;
};

function useCameras() {
  const [cameras, setCameras] = useState<ApiCamera[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetch_ = () =>
      fetch(`${API_BASE}/api/cameras`)
        .then((r) => r.json())
        .then((d) => { if (!cancelled) setCameras(d.cameras ?? []); })
        .catch(() => {});
    fetch_();
    const id = setInterval(fetch_, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return cameras;
}

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  activeCamera: CameraId;
  onCameraChange: (c: CameraId) => void;
}

export const Sidebar = ({ view, onViewChange, activeCamera, onCameraChange }: Props) => {
  const cameras = useCameras();

  // Auto-select first connected camera when list loads
  useEffect(() => {
    if (cameras.length > 0 && !activeCamera) {
      const first = cameras.find((c) => c.connected) ?? cameras[0];
      onCameraChange(first.id);
    }
  }, [cameras]);

  const onlineCount = cameras.filter((c) => c.connected).length;

  return (
    <aside className="w-[260px] shrink-0 h-screen sticky top-0 glass-panel-strong border-r border-border flex flex-col">
      {/* Brand */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-lg bg-gradient-glow-primary border border-primary/40 flex items-center justify-center shadow-glow-primary">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none text-foreground tracking-wider">POURING</div>
            <div className="font-mono text-[10px] text-primary tracking-[0.3em] mt-1">CONSOLE V3.0</div>
          </div>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="p-4 border-b border-border">
        <div className="font-mono text-[10px] text-muted-foreground tracking-[0.25em] mb-3 px-1">MODE</div>
        <div className="space-y-1.5">
          <ModeButton
            active={view === "live"}
            onClick={() => onViewChange("live")}
            icon={<Activity className="w-4 h-4" />}
            label="LIVE MONITORING"
            sub="Real-time AI"
          />
          <ModeButton
            active={view === "archive"}
            onClick={() => onViewChange("archive")}
            icon={<Archive className="w-4 h-4" />}
            label="IMAGE ARCHIVE"
            sub="History & logs"
          />
        </div>
      </div>

      {/* Cameras */}
      <div className="p-4 border-b border-border flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="font-mono text-[10px] text-muted-foreground tracking-[0.25em]">CAMERAS</span>
          <span className="font-mono text-[10px] text-primary">
            {cameras.length > 0 ? `${onlineCount} / ${cameras.length}` : "—"}
          </span>
        </div>
        <div className="space-y-2">
          {cameras.length === 0 ? (
            <div className="font-mono text-[10px] text-muted-foreground tracking-widest px-1 animate-pulse">
              CONNECTING…
            </div>
          ) : (
            cameras.map((c) => (
              <CameraButton
                key={c.id}
                camera={c}
                active={activeCamera === c.id}
                onClick={() => onCameraChange(c.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer status */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary shadow-glow-primary" />
          </span>
          <div className="flex-1">
            <div className="font-mono text-[11px] text-primary tracking-wider">SYSTEM ONLINE</div>
            <div className="font-mono text-[9px] text-muted-foreground">UPTIME 14:32:08</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const ModeButton = ({
  active, onClick, icon, label, sub,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; sub: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md border transition-all duration-300 group",
      active
        ? "bg-gradient-glow-primary border-primary/50 shadow-glow-primary"
        : "bg-surface border-transparent hover:border-border hover:bg-surface-elevated"
    )}
  >
    <div className={cn(
      "w-8 h-8 rounded flex items-center justify-center transition-colors",
      active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:text-foreground"
    )}>
      {icon}
    </div>
    <div className="text-left flex-1 min-w-0">
      <div className={cn(
        "font-display text-xs font-semibold tracking-wider",
        active ? "text-primary" : "text-foreground"
      )}>{label}</div>
      <div className="font-mono text-[9px] text-muted-foreground tracking-wide">{sub}</div>
    </div>
  </button>
);

const CameraButton = ({
  camera, active, onClick,
}: { camera: ApiCamera; active: boolean; onClick: () => void }) => {
  const displayId = camera.id.replace(/_/g, " ").toUpperCase();
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-md border transition-all duration-300",
        active
          ? "border-accent/50 bg-accent/5 shadow-[0_0_12px_hsl(var(--accent)/0.25)]"
          : "border-border/60 bg-surface hover:border-accent/30"
      )}
    >
      {/* mini preview */}
      <div className="relative w-12 h-9 rounded overflow-hidden bg-background border border-border/50 shrink-0">
        <div className="absolute inset-0 hud-grid opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <Camera className="absolute inset-0 m-auto w-3.5 h-3.5 text-primary/70" />
        <span className={cn(
          "absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full",
          camera.connected
            ? camera.trigger_active
              ? "bg-accent animate-pulse-dot shadow-[0_0_6px_hsl(var(--accent))]"
              : "bg-primary animate-pulse-dot shadow-[0_0_6px_hsl(var(--primary))]"
            : "bg-muted-foreground/50"
        )} />
      </div>
      <div className="text-left flex-1 min-w-0">
        <div className={cn(
          "font-mono text-xs font-semibold tracking-wider truncate",
          active ? "text-accent" : "text-foreground"
        )}>{displayId}</div>
        <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
          {!camera.connected
            ? "○ Offline"
            : camera.trigger_active
              ? "● Pouring"
              : `● ${camera.fps.toFixed(1)} FPS`}
        </div>
        {camera.connected && (
          <div className="font-mono text-[8px] text-muted-foreground/70 mt-0.5">
            {`PT ${camera.pattern} · LD ${camera.charge} · MD ${camera.mold}`}
          </div>
        )}
      </div>
    </button>
  );
};

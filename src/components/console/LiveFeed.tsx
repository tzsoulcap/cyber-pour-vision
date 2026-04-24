import { useEffect, useState } from "react";
import moltenPour from "@/assets/molten-pour.jpg";
import { Maximize2, Radio, Zap } from "lucide-react";

interface Props {
  cameraId: string;
}

export const LiveFeed = ({ cameraId }: Props) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 800);
    return () => clearInterval(i);
  }, []);

  const confidence = (94.2 + (Math.sin(tick / 3) * 1.8)).toFixed(1);
  const temp = (1452 + Math.floor(Math.sin(tick / 2) * 14)).toString();

  return (
    <div className="relative h-full rounded-2xl overflow-hidden glass-panel scan-line">
      {/* Image */}
      <img
        src={moltenPour}
        alt="Molten metal pour live feed"
        className="absolute inset-0 w-full h-full object-cover"
        width={1280}
        height={768}
      />
      {/* HUD grid */}
      <div className="absolute inset-0 hud-grid opacity-30 mix-blend-screen" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-background/70 backdrop-blur border border-primary/40 shadow-glow-primary">
            <Radio className="w-3.5 h-3.5 text-primary animate-pulse-dot" />
            <span className="font-mono text-[11px] font-bold text-primary tracking-[0.2em]">LIVE</span>
          </div>
          <div className="px-3 py-1.5 rounded-md bg-background/70 backdrop-blur border border-border">
            <span className="font-mono text-[11px] text-foreground tracking-wider">{cameraId}</span>
          </div>
          <div className="px-3 py-1.5 rounded-md bg-background/70 backdrop-blur border border-accent/40">
            <span className="font-mono text-[11px] text-accent tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> AI ACTIVE
            </span>
          </div>
        </div>
        <button className="p-2 rounded-md bg-background/70 backdrop-blur border border-border hover:border-primary/50 transition-colors">
          <Maximize2 className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Active processing overlay top-right */}
      <div className="absolute top-20 right-4 glass-panel-strong rounded-lg px-3 py-2 border border-primary/30">
        <div className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] mb-1">AI PROCESSING</div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display font-bold text-2xl text-primary text-glow-primary">{confidence}</span>
          <span className="font-mono text-xs text-primary">%</span>
        </div>
        <div className="font-mono text-[9px] text-muted-foreground tracking-wider mt-0.5">CONFIDENCE</div>
      </div>

      {/* Bounding box */}
      <div className="absolute left-[26%] top-[18%] w-[48%] h-[58%] pointer-events-none">
        {/* Corners */}
        {([
          "top-0 left-0 border-t-2 border-l-2 rounded-tl",
          "top-0 right-0 border-t-2 border-r-2 rounded-tr",
          "bottom-0 left-0 border-b-2 border-l-2 rounded-bl",
          "bottom-0 right-0 border-b-2 border-r-2 rounded-br",
        ]).map((cls, i) => (
          <span key={i} className={`absolute w-6 h-6 border-primary shadow-glow-primary ${cls}`} />
        ))}
        {/* Faint box */}
        <div className="absolute inset-0 border border-primary/30 rounded animate-pulse-glow" />
        {/* Label */}
        <div className="absolute -top-7 left-0 px-2 py-0.5 bg-primary text-primary-foreground rounded-sm font-mono text-[10px] font-bold tracking-wider shadow-glow-primary">
          POUR_STREAM · 98%
        </div>
        {/* Crosshair center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-px h-12 bg-accent/70" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-px bg-accent/70" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-accent rounded-full animate-pulse-dot" />
        </div>
      </div>

      {/* Bottom HUD bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
        <div className="flex gap-2">
          <HudStat label="TEMP" value={`${temp}°C`} accent="primary" />
          <HudStat label="FLOW" value="24.6 L/s" accent="accent" />
          <HudStat label="FRAME" value={`#${(28140 + tick).toString()}`} accent="primary" />
        </div>
        <div className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] animate-data-flicker">
          REC ● 00:14:32:08
        </div>
      </div>
    </div>
  );
};

const HudStat = ({ label, value, accent }: { label: string; value: string; accent: "primary" | "accent" }) => (
  <div className="px-3 py-2 rounded-md bg-background/70 backdrop-blur border border-border">
    <div className="font-mono text-[9px] text-muted-foreground tracking-[0.2em]">{label}</div>
    <div className={`font-mono text-sm font-bold tracking-wider ${accent === "primary" ? "text-primary" : "text-accent"}`}>{value}</div>
  </div>
);

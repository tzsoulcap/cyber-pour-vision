import { Panel } from "./Panel";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Activity, HardDrive, Gauge, Clock } from "lucide-react";

export const BottomDashboard = () => {
  const [apiOn, setApiOn] = useState(true);
  const [savingOn, setSavingOn] = useState(true);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Configuration */}
      <Panel title="Configuration" subtitle="System">
        <div className="grid grid-cols-2 gap-3 p-4">
          <ConfigField icon={<Clock className="w-3.5 h-3.5" />} label="Exposure" value="850" unit="μs" />
          <ConfigField icon={<Gauge className="w-3.5 h-3.5" />} label="Interval" value="120" unit="ms" />
          <ToggleField label="Auto-Saving" checked={savingOn} onChange={setSavingOn} />
          <ToggleField label="API Endpoint" checked={apiOn} onChange={setApiOn} />
        </div>
      </Panel>

      {/* System Health */}
      <Panel title="System Health" subtitle="REAL-TIME" accent="accent">
        <div className="grid grid-cols-2 gap-3 p-4">
          <HealthStat icon={<Activity className="w-4 h-4" />} label="FPS" value="59.8" sub="Stable" tone="primary" />
          <HealthStat icon={<HardDrive className="w-4 h-4" />} label="Saved" value="14,302" sub="Today" tone="accent" />
          <HealthStat icon={<Gauge className="w-4 h-4" />} label="GPU" value="62%" sub="RTX-A4000" tone="accent" />
          <HealthStat icon={<Clock className="w-4 h-4" />} label="Latency" value="8ms" sub="Edge AI" tone="primary" />
        </div>
      </Panel>
    </div>
  );
};

const ConfigField = ({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) => (
  <div className="bg-surface-elevated rounded-lg border border-border/60 p-3">
    <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
      {icon}
      <span className="font-mono text-[9px] tracking-[0.2em] uppercase">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="font-display font-bold text-xl text-foreground tabular-nums">{value}</span>
      <span className="font-mono text-[10px] text-muted-foreground">{unit}</span>
    </div>
  </div>
);

const ToggleField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="bg-surface-elevated rounded-lg border border-border/60 p-3 flex items-center justify-between">
    <div>
      <div className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] uppercase mb-1">{label}</div>
      <div className={`font-mono text-xs font-semibold ${checked ? "text-primary" : "text-muted-foreground"}`}>
        {checked ? "● ENABLED" : "○ DISABLED"}
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-primary" />
  </div>
);

const HealthStat = ({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub: string; tone: "primary" | "accent" }) => (
  <div className="bg-surface-elevated rounded-lg border border-border/60 p-3 relative overflow-hidden">
    <div className={`absolute inset-y-0 right-0 w-px ${tone === "primary" ? "bg-primary/40" : "bg-accent/40"}`} />
    <div className={`flex items-center gap-1.5 mb-1.5 ${tone === "primary" ? "text-primary" : "text-accent"}`}>
      {icon}
      <span className="font-mono text-[9px] tracking-[0.2em] uppercase">{label}</span>
    </div>
    <div className={`font-display font-bold text-2xl tabular-nums ${tone === "primary" ? "text-primary text-glow-primary" : "text-accent text-glow-accent"}`}>
      {value}
    </div>
    <div className="font-mono text-[9px] text-muted-foreground mt-0.5">{sub}</div>
  </div>
);

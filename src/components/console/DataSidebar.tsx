import { Panel } from "./Panel";
import { usePouringStatus } from "@/hooks/usePouringStatus";

export const DataSidebar = ({ cameraId }: { cameraId: string }) => {
  const { status, isLoading, isError } = usePouringStatus(cameraId);

  const batchInfo = [
    { label: "Pattern", value: status?.batch?.pattern ?? "—" },
    { label: "Charge No.", value: status?.batch?.chargeNo ?? "—" },
    { label: "Ladle No.", value: status?.batch?.ladleNo ?? "—" },
    { label: "Mold ID", value: status?.batch?.moldId ?? "—" },
    { label: "Sample", value: status?.batch?.sample ?? "—" },
  ];

  const measurements = [
    { label: "UPPER", value: status?.measurements?.upper ?? null },
    { label: "MIDDLE", value: status?.measurements?.middle ?? null },
    { label: "BELOW", value: status?.measurements?.below ?? null },
  ];

  const fillRatio = status?.measurements?.fillRatio ?? null;
  const fillBarWidth = fillRatio !== null ? Math.min(100, Math.max(0, fillRatio)) : 0;

  const connectionLabel = isError ? "DISCONNECTED" : isLoading ? "CONNECTING…" : "LIVE";

  return (
    <div className="w-[340px] shrink-0 flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* Batch Info */}
      <Panel title="Batch Info" subtitle={isError ? "DISCONNECTED" : "Active Run"}>
        <div className="divide-y divide-border/60">
          {batchInfo.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
              <span className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] uppercase">{row.label}</span>
              <span className={`font-mono text-xs font-semibold tracking-wider ${isError ? "text-muted-foreground" : "text-foreground"}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Measurements */}
      <Panel title="Measurements" subtitle={`PX · ${connectionLabel}`} accent="accent">
        <div className="p-4 space-y-3">
          {measurements.map((m) => (
            <div key={m.label} className="relative bg-surface-elevated rounded-lg p-3 border border-border/60 overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent to-primary" />
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] text-muted-foreground tracking-[0.25em]">{m.label}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-bold text-3xl text-accent text-glow-accent tracking-wider tabular-nums">
                  {m.value !== null ? m.value : "—"}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">PX</span>
              </div>
            </div>
          ))}

          {/* Fill ratio - hero */}
          <div className="relative bg-gradient-glow-primary rounded-lg p-4 border border-primary/40 overflow-hidden">
            <div className="absolute inset-0 hud-grid opacity-30" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-primary tracking-[0.25em]">FILL RATIO</span>
                {fillRatio !== null && (
                  <span className="font-mono text-[9px] text-primary/80 px-1.5 py-0.5 rounded bg-primary/15">
                    {fillRatio >= 85 ? "OPTIMAL" : fillRatio >= 70 ? "NORMAL" : "LOW"}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-display font-bold text-5xl text-primary text-glow-primary tabular-nums">
                  {fillRatio !== null ? fillRatio.toFixed(1) : "—"}
                </span>
                <span className="font-mono text-base text-primary">%</span>
              </div>
              {/* Bar */}
              <div className="h-2 bg-background/60 rounded-full overflow-hidden border border-primary/20">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent shadow-glow-primary rounded-full transition-all duration-500"
                  style={{ width: `${fillBarWidth}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 font-mono text-[9px] text-muted-foreground">
                <span>0%</span><span>TARGET 85%</span><span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};

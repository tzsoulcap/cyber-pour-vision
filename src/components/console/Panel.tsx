import { cn } from "@/lib/utils";

interface PanelProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
  accent?: "primary" | "accent";
}

export const Panel = ({ title, subtitle, className, children, accent = "primary" }: PanelProps) => {
  return (
    <div className={cn(
      "glass-panel rounded-2xl overflow-hidden flex flex-col animate-fade-up",
      className
    )}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-elevated/50">
        <div className="flex items-center gap-2.5">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full animate-pulse-dot",
            accent === "primary" ? "bg-primary shadow-[0_0_8px_hsl(var(--primary))]" : "bg-accent shadow-[0_0_8px_hsl(var(--accent))]"
          )} />
          <h3 className="font-display text-xs font-semibold tracking-[0.2em] text-foreground uppercase">{title}</h3>
        </div>
        {subtitle && (
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider uppercase">{subtitle}</span>
        )}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

import { useState } from "react";
import { Panel } from "./Panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, Search, Camera } from "lucide-react";
import thumb1 from "@/assets/pour-thumb-1.jpg";
import thumb2 from "@/assets/pour-thumb-2.jpg";
import thumb3 from "@/assets/pour-thumb-3.jpg";
import { cn } from "@/lib/utils";

const thumbs = [thumb1, thumb2, thumb3];

interface Ladle {
  id: number;
  pattern: string;
  molds: number;
  images: number;
  shift: "A" | "B" | "C";
  camera: "CAM 01" | "CAM 02" | "CAM 03";
  status: "OK" | "REVIEW" | "FLAG";
  time: string;
}

const ladles: Ladle[] = [
  { id: 43, pattern: "PT-A47-X", molds: 12, images: 384, shift: "A", camera: "CAM 01", status: "OK", time: "14:32" },
  { id: 42, pattern: "PT-B12-K", molds: 8, images: 256, shift: "A", camera: "CAM 02", status: "OK", time: "13:08" },
  { id: 41, pattern: "PT-A47-X", molds: 14, images: 448, shift: "A", camera: "CAM 01", status: "REVIEW", time: "11:45" },
  { id: 40, pattern: "PT-C03-P", molds: 6, images: 192, shift: "B", camera: "CAM 03", status: "OK", time: "10:20" },
  { id: 39, pattern: "PT-B12-K", molds: 10, images: 320, shift: "B", camera: "CAM 02", status: "OK", time: "08:55" },
  { id: 38, pattern: "PT-A47-X", molds: 12, images: 384, shift: "B", camera: "CAM 01", status: "FLAG", time: "07:12" },
  { id: 37, pattern: "PT-D77-Q", molds: 9, images: 288, shift: "C", camera: "CAM 03", status: "OK", time: "23:48" },
  { id: 36, pattern: "PT-A47-X", molds: 11, images: 352, shift: "C", camera: "CAM 02", status: "OK", time: "22:15" },
];

const cameras = ["ALL", "CAM 01", "CAM 02", "CAM 03"];
const shifts = ["ALL", "A", "B", "C"];
const patterns = ["ALL", "PT-A47-X", "PT-B12-K", "PT-C03-P", "PT-D77-Q"];

export const ArchiveView = () => {
  const [camera, setCamera] = useState("ALL");
  const [shift, setShift] = useState("ALL");
  const [pattern, setPattern] = useState("ALL");
  const [query, setQuery] = useState("");

  const filtered = ladles.filter((l) =>
    (camera === "ALL" || l.camera === camera) &&
    (shift === "ALL" || l.shift === shift) &&
    (pattern === "ALL" || l.pattern === pattern) &&
    (query === "" || l.id.toString().includes(query) || l.pattern.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Filter ribbon */}
      <Panel title="Filter Archive" subtitle={`${filtered.length} OF ${ladles.length} LADLES`} accent="accent">
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-12 gap-3 items-end">
            {/* Search */}
            <div className="col-span-3">
              <FieldLabel icon={<Search className="w-3 h-3" />} label="Search" />
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ladle ID or pattern..."
                  className="pl-8 h-9 bg-surface-elevated border-border/60 font-mono text-xs"
                />
              </div>
            </div>

            {/* Camera */}
            <div className="col-span-2">
              <FieldLabel icon={<Camera className="w-3 h-3" />} label="Camera" />
              <ChipGroup options={cameras} value={camera} onChange={setCamera} />
            </div>

            {/* Date range */}
            <div className="col-span-3">
              <FieldLabel icon={<Calendar className="w-3 h-3" />} label="Date Range" />
              <div className="flex items-center gap-2">
                <Input type="date" defaultValue="2024-03-01" className="h-9 bg-surface-elevated border-border/60 font-mono text-xs" />
                <span className="font-mono text-[10px] text-muted-foreground">→</span>
                <Input type="date" defaultValue="2024-03-15" className="h-9 bg-surface-elevated border-border/60 font-mono text-xs" />
              </div>
            </div>

            {/* Shift */}
            <div className="col-span-1">
              <FieldLabel icon={<Filter className="w-3 h-3" />} label="Shift" />
              <ChipGroup options={shifts} value={shift} onChange={setShift} />
            </div>

            {/* Pattern */}
            <div className="col-span-2">
              <FieldLabel icon={<Filter className="w-3 h-3" />} label="Pattern" />
              <select
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="w-full h-9 px-2.5 rounded-md bg-surface-elevated border border-border/60 font-mono text-xs text-foreground focus:outline-none focus:border-accent"
              >
                {patterns.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="col-span-1">
              <Button className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary-glow font-display font-semibold tracking-wider text-xs shadow-glow-primary">
                APPLY
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      {/* Result grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((l, i) => (
            <LadleCard key={l.id} ladle={l} thumb={thumbs[i % thumbs.length]} />
          ))}
        </div>
      </div>
    </div>
  );
};

const FieldLabel = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
    {icon}
    <span className="font-mono text-[9px] tracking-[0.2em] uppercase">{label}</span>
  </div>
);

const ChipGroup = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex gap-1 bg-surface-elevated border border-border/60 rounded-md p-0.5 h-9">
    {options.map((opt) => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={cn(
          "flex-1 px-1.5 rounded font-mono text-[10px] font-semibold tracking-wider transition-all",
          value === opt
            ? "bg-accent text-accent-foreground shadow-[0_0_8px_hsl(var(--accent)/0.5)]"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {opt.replace("CAM ", "")}
      </button>
    ))}
  </div>
);

const statusStyles: Record<Ladle["status"], string> = {
  OK: "bg-primary/15 text-primary border-primary/40",
  REVIEW: "bg-accent/15 text-accent border-accent/40",
  FLAG: "bg-warning/15 text-warning border-warning/40",
};

const LadleCard = ({ ladle, thumb }: { ladle: Ladle; thumb: string }) => (
  <div className="group glass-panel rounded-2xl overflow-hidden hover:border-accent/50 hover:shadow-glow-accent transition-all duration-300 cursor-pointer animate-fade-up corner-brackets">
    {/* Thumb */}
    <div className="relative aspect-video overflow-hidden bg-background">
      <img
        src={thumb}
        alt={`Ladle ${ladle.id} pour preview`}
        loading="lazy"
        width={512}
        height={288}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
      <div className="absolute inset-0 hud-grid opacity-20 mix-blend-screen" />

      {/* Top labels */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
        <div className={cn(
          "px-2 py-0.5 rounded border font-mono text-[10px] font-bold tracking-wider backdrop-blur",
          statusStyles[ladle.status]
        )}>
          {ladle.status}
        </div>
        <div className="px-2 py-0.5 rounded bg-background/70 backdrop-blur border border-border font-mono text-[10px] text-foreground tracking-wider">
          {ladle.camera}
        </div>
      </div>

      {/* Big ID */}
      <div className="absolute bottom-3 left-3">
        <div className="font-mono text-[9px] text-muted-foreground tracking-[0.3em]">LADLE</div>
        <div className="font-display font-bold text-5xl text-accent text-glow-accent leading-none tabular-nums">
          #{ladle.id}
        </div>
      </div>
      <div className="absolute bottom-3 right-3 text-right">
        <div className="font-mono text-[9px] text-muted-foreground tracking-[0.2em]">SHIFT {ladle.shift}</div>
        <div className="font-mono text-xs text-foreground tracking-wider">{ladle.time}</div>
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-3 divide-x divide-border/60 border-t border-border/60 bg-surface-elevated/40">
      <Stat label="Molds" value={ladle.molds.toString()} />
      <Stat label="Pattern" value={ladle.pattern.replace("PT-", "")} mono />
      <Stat label="Images" value={ladle.images.toString()} accent />
    </div>
  </div>
);

const Stat = ({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) => (
  <div className="px-3 py-2.5">
    <div className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] uppercase mb-0.5">{label}</div>
    <div className={cn(
      "font-display font-bold text-base tabular-nums",
      accent ? "text-accent" : "text-foreground",
      mono && "font-mono text-sm"
    )}>{value}</div>
  </div>
);

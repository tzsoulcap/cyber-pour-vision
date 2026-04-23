import { useState, useEffect, useMemo, useRef } from "react";
import { Panel } from "./Panel";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, ChevronRight, ChevronLeft, Image, Layers, FlaskConical, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useImageLog,
  fetchDates,
  fetchShifts,
  fetchPatterns,
  getImageUrl,
  type ImageMeta,
} from "@/hooks/useImageLog";

// ─── Cascading filter state ────────────────────────────────────────────────────

type DrillLevel = "ladle" | "mold" | "images";

export const ArchiveView = () => {
  // Cascading filter data
  const [dates, setDates] = useState<string[]>([]);
  const [shifts, setShifts] = useState<string[]>([]);
  const [patterns, setPatterns] = useState<number[]>([]);

  // Selected filter values
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedPattern, setSelectedPattern] = useState("");

  // Drill-down state
  const [drillLevel, setDrillLevel] = useState<DrillLevel>("ladle");
  const [selectedLadle, setSelectedLadle] = useState<number | null>(null);
  const [selectedMold, setSelectedMold] = useState<number | null>(null);

  // Slideshow state
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [slideshowImages, setSlideshowImages] = useState<ImageMeta[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(5);
  const filmstripRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { images, isLoading, isError, fetchImages } = useImageLog();

  // Step 1: load dates on mount
  useEffect(() => {
    fetchDates()
      .then((d) => {
        setDates(d);
        if (d.length > 0) {
          setDateFrom(d[d.length - 1]);
          setDateTo(d[d.length - 1]);
        }
      })
      .catch(() => {});
  }, []);

  // Step 2: load shifts when date changes
  useEffect(() => {
    if (!dateFrom || !dateTo) return;
    setSelectedShift("");
    setSelectedPattern("");
    setShifts([]);
    setPatterns([]);
    fetchShifts(dateFrom, dateTo)
      .then(setShifts)
      .catch(() => {});
  }, [dateFrom, dateTo]);

  // Step 3: load patterns when shift changes
  useEffect(() => {
    if (!dateFrom || !dateTo || !selectedShift) return;
    setSelectedPattern("");
    setPatterns([]);
    fetchPatterns(dateFrom, dateTo, selectedShift)
      .then((p) => setPatterns(p))
      .catch(() => {});
  }, [selectedShift]);

  const handleApply = () => {
    setDrillLevel("ladle");
    setSelectedLadle(null);
    setSelectedMold(null);
    fetchImages({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      shift: selectedShift || undefined,
      pattern: selectedPattern || undefined,
    });
  };

  // Derived drill-down groups
  const ladleGroups = useMemo(() => {
    const map = new Map<number, ImageMeta[]>();
    images.forEach((img) => {
      if (!map.has(img.ladle_no)) map.set(img.ladle_no, []);
      map.get(img.ladle_no)!.push(img);
    });
    return map;
  }, [images]);

  const moldGroups = useMemo(() => {
    if (selectedLadle === null) return new Map<number, ImageMeta[]>();
    const ladleImages = ladleGroups.get(selectedLadle) ?? [];
    const map = new Map<number, ImageMeta[]>();
    ladleImages.forEach((img) => {
      if (!map.has(img.mold)) map.set(img.mold, []);
      map.get(img.mold)!.push(img);
    });
    return map;
  }, [ladleGroups, selectedLadle]);

  const moldImages = useMemo(() => {
    if (selectedMold === null) return [];
    return (moldGroups.get(selectedMold) ?? []).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [moldGroups, selectedMold]);

  // Slideshow playback
  useEffect(() => {
    if (!isPlaying || !slideshowOpen) return;
    const delay = Math.round(1000 / playbackSpeed);
    const id = setInterval(() => {
      setCurrentIndex((i) => {
        if (i >= slideshowImages.length - 1) { setIsPlaying(false); return i; }
        return i + 1;
      });
    }, delay);
    return () => clearInterval(id);
  }, [isPlaying, slideshowOpen, playbackSpeed, slideshowImages.length]);

  // Scroll filmstrip to current frame
  useEffect(() => {
    filmstripRefs.current[currentIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentIndex]);

  const openSlideshow = (imgs: ImageMeta[], startIndex = 0) => {
    setSlideshowImages(imgs);
    setCurrentIndex(startIndex);
    setIsPlaying(false);
    setSlideshowOpen(true);
  };

  const breadcrumb = (
    <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground tracking-wider">
      <button
        onClick={() => { setDrillLevel("ladle"); setSelectedLadle(null); setSelectedMold(null); }}
        className={cn("hover:text-foreground transition-colors", drillLevel === "ladle" && "text-primary")}
      >
        LADLES
      </button>
      {selectedLadle !== null && (
        <>
          <ChevronRight className="w-3 h-3" />
          <button
            onClick={() => { setDrillLevel("mold"); setSelectedMold(null); }}
            className={cn("hover:text-foreground transition-colors", drillLevel === "mold" && "text-primary")}
          >
            LADLE #{selectedLadle}
          </button>
        </>
      )}
      {selectedMold !== null && (
        <>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary">MOLD #{selectedMold}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Filter panel */}
      <Panel title="Image Archive" subtitle={images.length > 0 ? `${images.length} IMAGES` : "FILTER TO SEARCH"} accent="accent">
        <div className="p-4">
          <div className="grid grid-cols-12 gap-3 items-end">
            {/* Date From */}
            <div className="col-span-2">
              <FieldLabel icon={<Calendar className="w-3 h-3" />} label="Date From" />
              <select
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-9 px-2.5 rounded-md bg-surface-elevated border border-border/60 font-mono text-xs text-foreground focus:outline-none focus:border-accent"
              >
                <option value="">— select —</option>
                {dates.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Date To */}
            <div className="col-span-2">
              <FieldLabel icon={<Calendar className="w-3 h-3" />} label="Date To" />
              <select
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-9 px-2.5 rounded-md bg-surface-elevated border border-border/60 font-mono text-xs text-foreground focus:outline-none focus:border-accent"
              >
                <option value="">— select —</option>
                {dates.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Shift */}
            <div className="col-span-2">
              <FieldLabel icon={<Filter className="w-3 h-3" />} label="Shift" />
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                disabled={shifts.length === 0}
                className="w-full h-9 px-2.5 rounded-md bg-surface-elevated border border-border/60 font-mono text-xs text-foreground focus:outline-none focus:border-accent disabled:opacity-40"
              >
                <option value="">— all shifts —</option>
                {shifts.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Pattern */}
            <div className="col-span-3">
              <FieldLabel icon={<FlaskConical className="w-3 h-3" />} label="Pattern" />
              <select
                value={selectedPattern}
                onChange={(e) => setSelectedPattern(e.target.value)}
                disabled={patterns.length === 0}
                className="w-full h-9 px-2.5 rounded-md bg-surface-elevated border border-border/60 font-mono text-xs text-foreground focus:outline-none focus:border-accent disabled:opacity-40"
              >
                <option value="">— all patterns —</option>
                {patterns.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="col-span-2 col-start-12">
              <Button
                onClick={handleApply}
                disabled={!dateFrom}
                className="w-full h-9 bg-accent text-accent-foreground hover:bg-accent/90 font-display font-semibold tracking-wider text-xs shadow-glow-accent"
              >
                APPLY
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      {/* Results area */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {isLoading && (
          <div className="flex items-center justify-center h-32 font-mono text-xs text-muted-foreground tracking-widest animate-pulse">
            LOADING…
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center h-32 font-mono text-xs text-destructive tracking-widest">
            CONNECTION ERROR — CHECK BACKEND
          </div>
        )}
        {!isLoading && !isError && images.length === 0 && (
          <div className="flex items-center justify-center h-32 font-mono text-xs text-muted-foreground tracking-widest">
            SELECT FILTERS AND PRESS APPLY
          </div>
        )}

        {!isLoading && !isError && images.length > 0 && (
          <>
            <div className="mb-3 flex items-center justify-between">
              {breadcrumb}
            </div>

            {/* Level 1: Ladle list */}
            {drillLevel === "ladle" && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...ladleGroups.entries()].sort(([a], [b]) => a - b).map(([ladleNo, imgs]) => (
                  <DrillCard
                    key={ladleNo}
                    icon={<Layers className="w-5 h-5" />}
                    title={`LADLE #${ladleNo}`}
                    meta={`${[...new Set(imgs.map((i) => i.mold))].length} molds · ${imgs.length} images`}
                    onClick={() => { setSelectedLadle(ladleNo); setDrillLevel("mold"); }}
                  />
                ))}
              </div>
            )}

            {/* Level 2: Mold list */}
            {drillLevel === "mold" && selectedLadle !== null && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...moldGroups.entries()].sort(([a], [b]) => a - b).map(([moldId, imgs]) => (
                  <DrillCard
                    key={moldId}
                    icon={<FlaskConical className="w-5 h-5" />}
                    title={`MOLD #${moldId}`}
                    meta={`${imgs.length} images`}
                    onClick={() => { setSelectedMold(moldId); setDrillLevel("images"); }}
                  />
                ))}
              </div>
            )}

            {/* Level 3: Image grid */}
            {drillLevel === "images" && selectedMold !== null && (
              <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
                {moldImages.map((img, idx) => (
                  <button
                    key={img.path}
                    onClick={() => openSlideshow(moldImages, idx)}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-surface-elevated border border-border/60 hover:border-accent/60 transition-all"
                  >
                    <img
                      src={getImageUrl(img.path)}
                      alt={`Frame ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-background/80 px-1.5 py-1">
                      <div className="font-mono text-[8px] text-muted-foreground truncate">
                        {new Date(img.timestamp).toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour12: false })}
                      </div>
                      {img.measurements !== undefined && (
                        <div className="font-mono text-[9px] text-primary font-semibold">
                          {img.measurements.fill_ratio_percent.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Slideshow Modal */}
      {slideshowOpen && slideshowImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col items-center justify-center gap-4 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setSlideshowOpen(false); }}
        >
          <div className="w-full max-w-4xl flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground tracking-widest">
              <div className="flex items-center gap-3">
                <span>PATTERN <span className="text-accent font-semibold">{slideshowImages[currentIndex].pattern}</span></span>
                <span className="text-border">·</span>
                <span>LADLE <span className="text-accent font-semibold">#{slideshowImages[currentIndex].ladle_no}</span></span>
                <span className="text-border">·</span>
                <span>MOLD <span className="text-primary font-semibold">#{selectedMold}</span></span>
                <span className="text-border">·</span>
                <span>FRAME <span className="text-foreground">{currentIndex + 1}</span> / {slideshowImages.length}</span>
              </div>
              <button onClick={() => setSlideshowOpen(false)} className="hover:text-foreground transition-colors px-2">✕ CLOSE</button>
            </div>

            {/* Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-elevated border border-border/60">
              <img
                src={getImageUrl(slideshowImages[currentIndex].path)}
                alt={`Frame ${currentIndex + 1}`}
                className="w-full h-full object-contain"
              />
              {/* Timestamp overlay */}
              <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur rounded px-2 py-1 font-mono text-[10px] text-muted-foreground">
                {new Date(slideshowImages[currentIndex].timestamp).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", hour12: false })}
              </div>
            </div>

            {/* Measurements bar */}
            {(() => {
              const m = slideshowImages[currentIndex]?.measurements;
              const rows: { label: string; value: number | undefined }[] = [
                { label: "UPPER", value: m?.upper_width_px },
                { label: "MIDDLE", value: m?.middle_width_px },
                { label: "BELOW", value: m?.below_width_px },
              ];
              return (
                <div className="grid grid-cols-4 gap-3">
                  {rows.map(({ label, value }) => (
                    <div key={label} className="relative bg-surface-elevated rounded-lg p-3 border border-border/60 overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent to-primary" />
                      <div className="font-mono text-[9px] text-muted-foreground tracking-[0.25em] mb-1">{label}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display font-bold text-2xl text-accent tabular-nums">
                          {value != null ? value : "—"}
                        </span>
                        {value != null && <span className="font-mono text-[10px] text-muted-foreground">px</span>}
                      </div>
                    </div>
                  ))}

                  {/* Fill ratio */}
                  <div className="relative bg-gradient-glow-primary rounded-lg p-3 border border-primary/40 overflow-hidden">
                    <div className="absolute inset-0 hud-grid opacity-20" />
                    <div className="relative">
                      <div className="font-mono text-[9px] text-primary tracking-[0.25em] mb-1">FILL RATIO</div>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="font-display font-bold text-2xl text-primary text-glow-primary tabular-nums">
                          {m != null ? m.fill_ratio_percent.toFixed(1) : "—"}
                        </span>
                        {m != null && <span className="font-mono text-[10px] text-primary">%</span>}
                      </div>
                      {m != null && (
                        <div className="h-1.5 bg-background/60 rounded-full overflow-hidden border border-primary/20">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, m.fill_ratio_percent)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => { setCurrentIndex(0); setIsPlaying(false); }}
                className="p-2 rounded-lg border border-border/60 hover:border-primary/60 text-muted-foreground hover:text-primary transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="p-2 rounded-lg border border-border/60 hover:border-primary/60 text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="p-3 rounded-lg bg-primary text-primary-foreground shadow-glow-primary hover:bg-primary/90 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setCurrentIndex((i) => Math.min(slideshowImages.length - 1, i + 1))}
                className="p-2 rounded-lg border border-border/60 hover:border-primary/60 text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setCurrentIndex(slideshowImages.length - 1); setIsPlaying(false); }}
                className="p-2 rounded-lg border border-border/60 hover:border-primary/60 text-muted-foreground hover:text-primary transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* FPS control */}
              <div className="flex items-center gap-2 ml-4 bg-surface-elevated rounded-lg border border-border/60 px-3 py-2">
                <span className="font-mono text-[9px] text-muted-foreground tracking-widest">FPS</span>
                {[1, 3, 5, 10, 15].map((fps) => (
                  <button
                    key={fps}
                    onClick={() => setPlaybackSpeed(fps)}
                    className={cn(
                      "font-mono text-[10px] px-1.5 py-0.5 rounded transition-colors",
                      playbackSpeed === fps ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {fps}
                  </button>
                ))}
              </div>
            </div>

            {/* Filmstrip */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {slideshowImages.map((img, idx) => (
                <button
                  key={img.path}
                  ref={(el) => { filmstripRefs.current[idx] = el; }}
                  onClick={() => { setCurrentIndex(idx); setIsPlaying(false); }}
                  className={cn(
                    "shrink-0 w-14 h-10 rounded overflow-hidden border transition-colors",
                    idx === currentIndex ? "border-primary shadow-glow-primary" : "border-border/40 opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={getImageUrl(img.path)} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FieldLabel = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
    {icon}
    <span className="font-mono text-[9px] tracking-[0.2em] uppercase">{label}</span>
  </div>
);

const DrillCard = ({ icon, title, meta, onClick }: { icon: React.ReactNode; title: string; meta: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group glass-panel rounded-xl p-4 border border-border/60 hover:border-accent/60 hover:shadow-glow-accent transition-all text-left flex items-center gap-3 animate-fade-up"
  >
    <div className="text-accent group-hover:scale-110 transition-transform">{icon}</div>
    <div className="min-w-0">
      <div className="font-display font-bold text-sm text-foreground tracking-wider">{title}</div>
      <div className="font-mono text-[9px] text-muted-foreground mt-0.5">{meta}</div>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent ml-auto shrink-0 transition-colors" />
  </button>
);

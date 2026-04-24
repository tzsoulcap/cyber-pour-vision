import { Panel } from "./Panel";
import { Activity, HardDrive, Gauge, Clock, Camera, Shield, Settings } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { usePouringStatus } from "@/hooks/usePouringStatus";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SystemSettings } from "@/hooks/useSystemSettings";
import { API_BASE } from "@/lib/config";

/** How long (ms) authentication remains valid without re-entering password */
const AUTH_TTL_MS = 1 * 60 * 1000; // 1 minute

export const BottomDashboard = ({ cameraId }: { cameraId: string }) => {
  const { settings, saveSettings } = useSystemSettings();
  const { status } = usePouringStatus(cameraId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Password verification
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const verifiedAt = useRef<number | null>(null);

  const isAuthValid = () =>
    verifiedAt.current !== null && Date.now() - verifiedAt.current < AUTH_TTL_MS;

  const openPasswordDialog = () => {
    if (!settings) return;
    if (isAuthValid()) {
      // Still within TTL — open settings directly
      setDraft(JSON.parse(JSON.stringify(settings)));
      setSaveError(null);
      setDialogOpen(true);
      return;
    }
    setPassword("");
    setPasswordError(null);
    setPasswordOpen(true);
  };

  const handleVerify = async () => {
    setVerifying(true);
    setPasswordError(null);
    try {
      const res = await fetch(`${API_BASE}/api/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        verifiedAt.current = Date.now();
        setPasswordOpen(false);
        setDraft(JSON.parse(JSON.stringify(settings)));
        setSaveError(null);
        setDialogOpen(true);
      } else {
        setPasswordError("Incorrect password");
      }
    } catch {
      setPasswordError("Connection failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveSettings(draft);
      setDialogOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {/* Configuration */}
        <Panel
          title="Configuration"
          subtitle={settings ? "LIVE" : "LOADING…"}
          action={
            <button
              onClick={openPasswordDialog}
              className="p-1 rounded hover:bg-border/60 text-muted-foreground hover:text-foreground transition-colors"
              title="Edit Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          }
        >
          {(() => {
            const activeCam = settings?.cameras.find((c) => c.id === cameraId) ?? settings?.cameras[0];
            return (
              <div className="grid grid-cols-2 gap-3 p-4">
                <ConfigField
                  icon={<Camera className="w-3.5 h-3.5" />}
                  label="Exposure"
                  value={activeCam ? String(activeCam.exposureTime) : "—"}
                  unit="μs"
                />
                <ConfigField
                  icon={<Gauge className="w-3.5 h-3.5" />}
                  label="Detect Interval"
                  value={settings ? String(settings.detection.interval) : "—"}
                  unit="s"
                />
                <StatusField label="Detection" enabled={settings?.detection.enabled ?? null} />
                <StatusField label="Saving" enabled={settings?.saving.enabled ?? null} />
                <TagsField icon={<HardDrive className="w-3.5 h-3.5" />} label="Save Patterns" values={settings?.saving.patterns ?? null} />
                <ConfigField icon={<Clock className="w-3.5 h-3.5" />} label="Retention" value={settings ? String(settings.saving.retentionDays) : "—"} unit="days" />
                <StatusField label="API" enabled={settings?.api.enabled ?? null} />
                <TagsField icon={<Shield className="w-3.5 h-3.5" />} label="API Patterns" values={settings?.api.patterns ?? null} />
              </div>
            );
          })()}
        </Panel>

        {/* System Health */}
        <Panel title="System Health" subtitle="REAL-TIME" accent="accent">
          <div className="grid grid-cols-2 gap-3 p-4">
            <HealthStat icon={<Activity className="w-4 h-4" />} label="FPS" value={status ? status.fps.toFixed(1) : "—"} sub="Camera" tone="primary" />
            <HealthStat icon={<HardDrive className="w-4 h-4" />} label="Saved" value={status ? status.imagesSaved.toLocaleString() : "—"} sub="Today" tone="accent" />
            <HealthStat icon={<Gauge className="w-4 h-4" />} label="GPU" value="—" sub="RTX-A4000" tone="accent" />
            <HealthStat icon={<Clock className="w-4 h-4" />} label="Latency" value="—" sub="Edge AI" tone="primary" />
          </div>
        </Panel>
      </div>

      {/* Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={(o) => { setPasswordOpen(o); if (!o) setPassword(""); }}>
        <DialogContent className="max-w-sm font-mono">
          <DialogHeader>
            <DialogTitle className="font-display tracking-[0.15em] text-sm">AUTHENTICATE</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider">Enter administrator password to access settings.</p>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              autoFocus
              onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" && password) handleVerify(); }}
              className="font-mono text-xs h-9"
            />
            {passwordError && (
              <p className="font-mono text-[10px] text-destructive">{passwordError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPasswordOpen(false)} className="font-mono text-xs tracking-wider">
              CANCEL
            </Button>
            <Button size="sm" onClick={handleVerify} disabled={verifying || !password} className="font-mono text-xs tracking-wider">
              {verifying ? "VERIFYING…" : "CONFIRM"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg font-mono">
          <DialogHeader>
            <DialogTitle className="font-display tracking-[0.15em] text-sm">EDIT SETTINGS</DialogTitle>
          </DialogHeader>

          {draft && (
            <div className="space-y-5 py-2 max-h-[60vh] overflow-y-auto pr-1">
              {/* Cameras */}
              <Section label="Cameras">
                {draft.cameras.map((cam, idx) => (
                  <FormRow key={cam.id} label={`${cam.id.replace(/_/g, " ").toUpperCase()} — Exposure (μs)`}>
                    <Input
                      type="number"
                      value={cam.exposureTime}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          cameras: draft.cameras.map((c, i) =>
                            i === idx ? { ...c, exposureTime: Number(e.target.value) } : c
                          ),
                        })
                      }
                      className="font-mono h-8 text-xs"
                    />
                  </FormRow>
                ))}
              </Section>

              {/* Detection */}
              <Section label="Detection">
                <FormRow label="Enabled">
                  <Switch
                    checked={draft.detection.enabled}
                    onCheckedChange={(v) => setDraft({ ...draft, detection: { ...draft.detection, enabled: v } })}
                    className="data-[state=checked]:bg-primary"
                  />
                </FormRow>
                <FormRow label="Interval (s)">
                  <Input
                    type="number"
                    step="0.01"
                    value={draft.detection.interval}
                    onChange={(e) => setDraft({ ...draft, detection: { ...draft.detection, interval: Number(e.target.value) } })}
                    className="font-mono h-8 text-xs"
                  />
                </FormRow>
                <FormRow label="Confidence">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={draft.detection.confidence}
                    onChange={(e) => setDraft({ ...draft, detection: { ...draft.detection, confidence: Number(e.target.value) } })}
                    className="font-mono h-8 text-xs"
                  />
                </FormRow>
                <FormRow label="Liquid Confidence">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={draft.detection.liquidConfidence}
                    onChange={(e) => setDraft({ ...draft, detection: { ...draft.detection, liquidConfidence: Number(e.target.value) } })}
                    className="font-mono h-8 text-xs"
                  />
                </FormRow>
              </Section>

              {/* Saving */}
              <Section label="Saving">
                <FormRow label="Enabled">
                  <Switch
                    checked={draft.saving.enabled}
                    onCheckedChange={(v) => setDraft({ ...draft, saving: { ...draft.saving, enabled: v } })}
                    className="data-[state=checked]:bg-primary"
                  />
                </FormRow>
                <FormRow label="Patterns (comma-separated)">
                  <Input
                    value={draft.saving.patterns.join(",")}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        saving: {
                          ...draft.saving,
                          patterns: e.target.value.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n)),
                        },
                      })
                    }
                    className="font-mono h-8 text-xs"
                  />
                </FormRow>
                <FormRow label="Retention Days">
                  <Input
                    type="number"
                    value={draft.saving.retentionDays}
                    onChange={(e) => setDraft({ ...draft, saving: { ...draft.saving, retentionDays: Number(e.target.value) } })}
                    className="font-mono h-8 text-xs"
                  />
                </FormRow>
              </Section>

              {/* API */}
              <Section label="API">
                <FormRow label="Enabled">
                  <Switch
                    checked={draft.api.enabled}
                    onCheckedChange={(v) => setDraft({ ...draft, api: { ...draft.api, enabled: v } })}
                    className="data-[state=checked]:bg-primary"
                  />
                </FormRow>
                <FormRow label="URL">
                  <Input
                    value={draft.api.url}
                    onChange={(e) => setDraft({ ...draft, api: { ...draft.api, url: e.target.value } })}
                    className="font-mono h-8 text-xs"
                  />
                </FormRow>
                <FormRow label="Patterns (comma-separated)">
                  <Input
                    value={draft.api.patterns.join(",")}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        api: {
                          ...draft.api,
                          patterns: e.target.value.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n)),
                        },
                      })
                    }
                    className="font-mono h-8 text-xs"
                  />
                </FormRow>
              </Section>
            </div>
          )}

          {saveError && (
            <p className="font-mono text-[10px] text-destructive">{saveError}</p>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="font-mono text-xs tracking-wider">
              CANCEL
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !draft} className="font-mono text-xs tracking-wider">
              {saving ? "SAVING…" : "SAVE"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="font-mono text-[9px] tracking-[0.25em] text-primary uppercase mb-2">{label}</p>
    <div className="space-y-2 pl-1">{children}</div>
  </div>
);

const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="font-mono text-[10px] text-muted-foreground tracking-wider shrink-0">{label}</span>
    <div className="flex-1 flex justify-end">{children}</div>
  </div>
);

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

const StatusField = ({ label, enabled }: { label: string; enabled: boolean | null }) => (
  <div className="bg-surface-elevated rounded-lg border border-border/60 p-3 flex items-center justify-between">
    <div>
      <div className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] uppercase mb-1">{label}</div>
      <div className={`font-mono text-xs font-semibold ${enabled === null ? "text-muted-foreground" : enabled ? "text-primary" : "text-muted-foreground"}`}>
        {enabled === null ? "— UNKNOWN" : enabled ? "● ENABLED" : "○ DISABLED"}
      </div>
    </div>
  </div>
);

const TagsField = ({ icon, label, values }: { icon: React.ReactNode; label: string; values: number[] | null }) => (
  <div className="bg-surface-elevated rounded-lg border border-border/60 p-3 col-span-2">
    <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
      {icon}
      <span className="font-mono text-[9px] tracking-[0.2em] uppercase">{label}</span>
    </div>
    <div className="flex flex-wrap gap-1">
      {values === null ? (
        <span className="font-mono text-[10px] text-muted-foreground">—</span>
      ) : values.length === 0 ? (
        <span className="font-mono text-[10px] text-muted-foreground">NONE</span>
      ) : (
        values.map((v) => (
          <span key={v} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            {v}
          </span>
        ))
      )}
    </div>
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

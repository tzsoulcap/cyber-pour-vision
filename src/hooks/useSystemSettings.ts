import { useState, useEffect } from "react";

const API_BASE = "http://192.168.212.10:5000";
const POLL_INTERVAL_MS = 10000;

type RawSettings = {
  success: boolean;
  config: {
    cameras: Array<{
      id: string;
      exposure_time: number;
      fps: number;
      width: number;
      height: number;
      plc_id: string;
      serial: string;
    }>;
    detection: {
      enabled: boolean;
      detect_interval: number;
      confidence: number;
      liquid_confidence: number;
    };
    saving: {
      enabled: boolean;
      patterns: number[];
      retention_days: number;
      root_path: string;
      save_interval_ms: number;
      save_images: boolean;
      save_metadata: boolean;
      dry_run: boolean;
      file_extensions: string[];
    };
    api: {
      enabled: boolean;
      patterns: number[];
      url: string;
    };
  };
};

export type CameraConfig = {
  id: string;
  exposureTime: number;
  fps: number;
  width: number;
  height: number;
};

export type SystemSettings = {
  cameras: CameraConfig[];
  detection: {
    enabled: boolean;
    interval: number;
    confidence: number;
    liquidConfidence: number;
  };
  saving: {
    enabled: boolean;
    patterns: number[];
    retentionDays: number;
  };
  api: {
    enabled: boolean;
    patterns: number[];
    url: string;
  };
};

type UseSystemSettingsResult = {
  settings: SystemSettings | null;
  isLoading: boolean;
  isError: boolean;
  saveSettings: (patch: SystemSettings) => Promise<void>;
};

function mapRawSettings(raw: RawSettings): SystemSettings {
  const { cameras, detection, saving, api } = raw.config;
  return {
    cameras: cameras.map((c) => ({
      id: c.id,
      exposureTime: c.exposure_time,
      fps: c.fps,
      width: c.width,
      height: c.height,
    })),
    detection: {
      enabled: detection.enabled,
      interval: detection.detect_interval,
      confidence: detection.confidence,
      liquidConfidence: detection.liquid_confidence,
    },
    saving: {
      enabled: saving.enabled,
      patterns: saving.patterns,
      retentionDays: saving.retention_days,
    },
    api: {
      enabled: api.enabled,
      patterns: api.patterns,
      url: api.url,
    },
  };
}

export function useSystemSettings(): UseSystemSettingsResult {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw: RawSettings = await res.json();
        if (!cancelled && raw.success) {
          setSettings(mapRawSettings(raw));
          setIsError(false);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsError(true);
          setIsLoading(false);
        }
      }
    };

    fetchSettings();
    const id = setInterval(fetchSettings, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { settings, isLoading, isError, saveSettings };
}

async function saveSettings(patch: SystemSettings): Promise<void> {
  const body = {
    cameras: patch.cameras.map((c) => ({ id: c.id, exposure_time: c.exposureTime, fps: c.fps })),
    detection: {
      enabled: patch.detection.enabled,
      detect_interval: patch.detection.interval,
      confidence: patch.detection.confidence,
      liquid_confidence: patch.detection.liquidConfidence,
    },
    saving: {
      enabled: patch.saving.enabled,
      patterns: patch.saving.patterns,
      retention_days: patch.saving.retentionDays,
    },
    api: { enabled: patch.api.enabled, patterns: patch.api.patterns, url: patch.api.url },
  };
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

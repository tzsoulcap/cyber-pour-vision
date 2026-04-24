import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/config";
const POLL_INTERVAL_MS = 500;

export type PouringStatus = {
  isPouring: boolean;
  fps: number;
  imagesSaved: number;
  batch: {
    pattern: string;
    chargeNo: string;
    ladleNo: string;
    moldId: string;
    sample: string;
  };
  measurements: {
    upper: number;
    middle: number;
    below: number;
    fillRatio: number;
  };
};

type UsePouringStatusResult = {
  status: PouringStatus | null;
  isLoading: boolean;
  isError: boolean;
};

type RawCameraStatus = {
  cam_id: string;
  connected: boolean;
  trigger_active: boolean;
  pattern: number;
  charge: number;
  ladle_no: number;
  mold: number;
  sample_count: number;
  last_widths: Record<string, number>;
  fill_ratio: number;
  fps: number;
  images_saved: number;
};

type RawStatusResponse = {
  cameras: Record<string, RawCameraStatus>;
};

function mapRawCamera(raw: RawCameraStatus): PouringStatus {
  return {
    isPouring: raw.trigger_active,
    fps: raw.fps ?? 0,
    imagesSaved: raw.images_saved ?? 0,
    batch: {
      pattern: String(raw.pattern),
      chargeNo: String(raw.charge),
      ladleNo: String(raw.ladle_no),
      moldId: String(raw.mold),
      sample: String(raw.sample_count),
    },
    measurements: {
      upper: raw.last_widths?.["100"] ?? 0,
      middle: raw.last_widths?.["280"] ?? 0,
      below: raw.last_widths?.["420"] ?? 0,
      fillRatio: (raw.fill_ratio ?? 0) * 100,
    },
  };
}

export function usePouringStatus(cameraId: string): UsePouringStatusResult {
  const [status, setStatus] = useState<PouringStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!cameraId) return;
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: RawStatusResponse = await res.json();
        const raw = data.cameras?.[cameraId];
        if (!cancelled) {
          if (raw) {
            setStatus(mapRawCamera(raw));
            setIsError(false);
          } else {
            setStatus(null);
          }
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsError(true);
          setIsLoading(false);
        }
      }
    };

    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [cameraId]);

  return { status, isLoading, isError };
}

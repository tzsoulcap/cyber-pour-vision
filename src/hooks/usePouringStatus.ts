import { useState, useEffect } from "react";

const API_BASE = "http://192.168.212.10:5000";
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

type RawStatus = {
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

function mapRawStatus(raw: RawStatus): PouringStatus {
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
      fillRatio: (raw.fill_ratio ?? 0),
    },
  };
}

export function usePouringStatus(): UsePouringStatusResult {
  const [status, setStatus] = useState<PouringStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/status`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw: RawStatus = await res.json();
        if (!cancelled) {
          setStatus(mapRawStatus(raw));
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

    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { status, isLoading, isError };
}

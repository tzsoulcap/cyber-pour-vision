import { useState, useCallback } from "react";

import { API_BASE } from "@/lib/config";

export type ImageMeasurements = {
  upper_width_px: number;
  middle_width_px: number;
  below_width_px: number;
  fill_ratio_percent: number;
};

export type ImageMeta = {
  path: string;
  filename: string;
  pattern: number;
  ladle_no: number;
  mold: number;
  timestamp: string;
  size?: number;
  measurements?: ImageMeasurements;
};

export type ImageFilters = {
  dateFrom?: string;
  dateTo?: string;
  shift?: string;
  pattern?: string | number;
  ladle?: string | number;
  mold?: string | number;
};

export function getImageUrl(imagePath: string): string {
  return `${API_BASE}/api/images/serve/${encodeURIComponent(imagePath)}`;
}

type UseImageLogResult = {
  images: ImageMeta[];
  isLoading: boolean;
  isError: boolean;
  fetchImages: (filters?: ImageFilters) => Promise<void>;
};

export function useImageLog(): UseImageLogResult {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const fetchImages = useCallback(async (filters?: ImageFilters) => {
    setIsLoading(true);
    setIsError(false);
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
        });
      }
      const url = `${API_BASE}/api/images/list${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setImages(Array.isArray(data) ? data : data.images ?? []);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { images, isLoading, isError, fetchImages };
}

// Cascading filter fetchers
export async function fetchDates(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/images/dates`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.dates ?? [];
}

export async function fetchShifts(dateFrom: string, dateTo: string): Promise<string[]> {
  const params = new URLSearchParams({ dateFrom, dateTo });
  const res = await fetch(`${API_BASE}/api/images/shifts?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.shifts ?? [];
}

export async function fetchPatterns(dateFrom: string, dateTo: string, shift: string): Promise<number[]> {
  const params = new URLSearchParams({ dateFrom, dateTo, shift });
  const res = await fetch(`${API_BASE}/api/images/patterns?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.patterns ?? [];
}

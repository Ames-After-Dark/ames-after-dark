// src/hooks/useBars.ts
import { useEffect, useMemo, useState } from "react";
import type { Bar } from "@/types/bars";
import { USE_MOCK } from "@/config/runtime";
import { BARS_BASE } from "@/data/mock";
import { getNow, isBarOpen } from "@/config/time";
import { getBars } from "@/services/barsService";

export type BarsFilters = {
  open?: boolean;
  hasDeals?: boolean;
  liveMusic?: boolean;   // 👈 include this
  q?: string;
};

export function useBars(filters?: BarsFilters) {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const now = getNow();                         //compute now here

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (USE_MOCK) {
          if (!cancelled) setBars(BARS_BASE as unknown as Bar[]);
        } else {
          const data = await getBars();
          if (!cancelled) setBars(data);
        }
      } catch (err) {
        if (!cancelled) {
          setBars([]);
          setError(err instanceof Error ? err : new Error("Failed to load bars"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // derive open flag client-side (works for mock + API)
  const withOpenFlag = useMemo(
    () => bars.map(b => ({ ...b, __openNow: isBarOpen(b, now) })),
    [bars, now]
  );

  return { bars: withOpenFlag, loading, error, now }; // 👈 return now
}

// src/hooks/useBars.ts
import { useEffect, useMemo, useState } from "react";
import type { Bar } from "@/types/bars";
import { apiGet } from "@/lib/api";
import { USE_MOCK } from "@/config/runtime";
import { BARS_BASE } from "@/data/mock";
import { getNow, isBarOpen } from "@/config/time";

export type BarsFilters = {
  open?: boolean;
  hasDeals?: boolean;
  liveMusic?: boolean;   // 👈 include this
  q?: string;
};

export function useBars(filters?: BarsFilters) {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const now = getNow();                         //compute now here

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        if (USE_MOCK) {
          if (!cancelled) setBars(BARS_BASE as unknown as Bar[]);
        } else {
          const params = new URLSearchParams();
          if (filters?.open) params.set("open", "true");
          if (filters?.hasDeals) params.set("hasDeals", "true");
          if (filters?.liveMusic) params.set("liveMusic", "true"); // 👈 pass through
          if (filters?.q) params.set("q", filters.q);
          const data = await apiGet<Bar[]>(`/bars?${params.toString()}`);
          if (!cancelled) setBars(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [filters?.open, filters?.hasDeals, filters?.liveMusic, filters?.q]);

  // derive open flag client-side (works for mock + API)
  const withOpenFlag = useMemo(
    () => bars.map(b => ({ ...b, __openNow: isBarOpen(b, now) })),
    [bars, now]
  );

  return { bars: withOpenFlag, loading, now }; // 👈 return now
}

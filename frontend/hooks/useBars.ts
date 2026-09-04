// src/hooks/useBars.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Bar } from "@/types/bars";
import { getNow, isBarOpen } from "@/utils/schedule";
import { getBars } from "@/services/barsService";

export type BarsFilters = {
  open?: boolean;
  hasDeals?: boolean;
  liveMusic?: boolean;
  q?: string;
};

export function useBars(filters?: BarsFilters) {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const now = getNow();

  // 1. Create a stable, reusable fetch function
  const loadData = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    setError(null);

    try {
      // Use your actual service here
      const data = await getBars();
      setBars(data);
    } catch (err) {
      console.error("Failed to fetch bars:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []); // Add filters to dependency if getBars(filters) is implemented

  // 2. Initial load on mount
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const withOpenFlag = useMemo(
    // Prefer the day-aware isOpenNow resolved from the bar's weekly hours
    // schedule; isBarOpen() only compares clock time and has no concept of
    // day-of-week, so it's kept only as a fallback for bars without it.
    () => bars.map(b => ({ ...b, __openNow: typeof b.isOpenNow === "boolean" ? b.isOpenNow : isBarOpen(b, now) })),
    [bars, now]
  );

  // 3. Return refetch so the Index page can use it
  return {
    bars: withOpenFlag,
    loading,
    error,
    now,
    refetch: loadData
  };
}
import { useCallback, useEffect, useState } from "react";
import type { Bar } from "../types/bars";
import { getBarById } from "../services/barsService";

export function useBarDetail(id?: string) {
  const [bar, setBar] = useState<Bar | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getBarById(id!);
      setBar(data);
    } catch (err) {
      console.error("Error loading bar detail:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getBarById(id!);
        if (!cancelled) setBar(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  return { bar, loading, refetch: loadData };
}

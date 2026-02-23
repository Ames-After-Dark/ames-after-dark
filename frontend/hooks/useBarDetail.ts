import { useEffect, useState } from "react";
import type { Bar } from "../types/bars";
import { USE_MOCK } from "../config/runtime";
import { BARS_BASE } from "../data/mock";
import { getBarById } from "../services/barsService";

export function useBarDetail(id?: string) {
  const [bar, setBar] = useState<Bar | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        if (USE_MOCK) {
          const found = BARS_BASE.find(b => String(b.id) === String(id)) as Bar | undefined;
          if (!cancelled) setBar(found ?? null);
        } else {
          const data = await getBarById(id!);
          if (!cancelled) setBar(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  return { bar, loading };
}

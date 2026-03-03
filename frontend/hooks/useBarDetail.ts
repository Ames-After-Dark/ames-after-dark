import { useEffect, useState } from "react";
import type { Bar } from "../types/bars";
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
        const data = await getBarById(id!);
        if (!cancelled) setBar(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  return { bar, loading };
}

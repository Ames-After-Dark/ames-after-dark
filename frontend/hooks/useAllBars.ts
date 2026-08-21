import { useState, useEffect } from "react";
import { apiFetch } from "@/services/apiClient";
import type { Location } from "./useOpenBars";

export function useAllBars() {
  const [bars, setBars] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAllBars = async () => {
      try {
        setLoading(true);
        // Unlike useOpenBars, this returns every location regardless of
        // whether it's open right now, with the same nested location_hours
        // shape so callers can still determine open/closed per bar.
        const data = await apiFetch(`/locations/with-hours`);
        setBars(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch bars"));
        setBars([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBars();
  }, []);

  return { bars, loading, error };
}

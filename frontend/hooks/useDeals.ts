import { useState, useEffect } from "react";
// TODO: Swap back to getActiveDeals when dedicated tonight API is ready
import { getDeals, Deal } from "@/services/dealsService";

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        // TODO: Replace getDeals() with getActiveDeals() (or getTonightDeals()) when API is ready
        const data = await getDeals();
        setDeals(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch deals"));
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  return { deals, loading, error };
}

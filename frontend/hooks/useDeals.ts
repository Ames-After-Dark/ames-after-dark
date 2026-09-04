import { useCallback, useEffect, useState } from "react";
// TODO: Swap back to getActiveDeals when dedicated tonight API is ready
import { getDeals, Deal } from "@/services/dealsService";

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDeals = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) setLoading(true);
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
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return { deals, loading, error, refetch: fetchDeals };
}

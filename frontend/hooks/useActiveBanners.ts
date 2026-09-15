// src/hooks/useActiveBanners.ts
import { useCallback, useEffect, useState } from "react";
import { getActiveBanners, type ActiveBanner } from "@/services/bannerService";

export function useActiveBanners() {
  const [banners, setBanners] = useState<ActiveBanner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  const loadData = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    setError(null);

    try {
      const data = await getActiveBanners();
      setBanners(data);
    } catch (err) {
      console.error("Failed to fetch active banners:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  return {
    banners,
    loading,
    error,
    refetch: loadData,
  };
}

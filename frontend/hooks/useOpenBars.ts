import { useState, useEffect } from "react";
import { apiFetch } from "@/services/apiClient";

export interface Location {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  hoursOpen?: string;
  hoursClose?: string;
  // ... other location fields
}

export function useOpenBars() {
  const [bars, setBars] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOpenBars = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/locations/open");
        setBars(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch open bars"));
        setBars([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOpenBars();
  }, []);

  return { bars, loading, error };
}

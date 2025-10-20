import { useEffect, useState } from "react";
import { getBars } from "../services/barsService";

export function useBars() {
  const [bars, setBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getBars();
        setBars(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { bars, loading, error };
}

import { useEffect, useState } from "react";
import { BARS_BASE } from "@/src/data/mock";

// Hook: useBarPhotos, returns mock photo data (until backend integration)
export function useBarPhotos(barId?: string) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!barId) return;
    let canceled = false;

    async function load() {
      try {
        setLoading(true);

        const bar = BARS_BASE.find((b) => String(b.id) === String(barId));
        if (!bar) throw new Error("Bar not found");

        // Mock gallery grid
        const mockPhotos = Array.from({ length: 9 }).map((_, i) => ({
          id: `${bar.id}-photo-${i + 1}`,
          image:
            bar.galleryImage ?? require("@/assets/images/Logo.png"), // placeholder if undefined
        }));

        if (!canceled) setPhotos(mockPhotos);
      } catch (err: any) {
        if (!canceled) setError(err.message ?? "Failed to load photos");
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, [barId]);

  return { photos, loading, error };
}

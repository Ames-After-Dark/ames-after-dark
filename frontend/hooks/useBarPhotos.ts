import { useEffect, useState } from "react";
import { getPhotosByBar } from "@/services/photosService";
import { BARS_BASE } from "@/data/mock";

// Hook: useBarPhotos, returns mock photo data (until backend integration)
export function useBarPhotos(barName: string) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPhotosByBar(barName);
        setPhotos(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [barName]);

  // useEffect(() => {
  //   if (!barId) return;
  //   let canceled = false;

  //   async function load() {
  //     try {
  //       setLoading(true);

  //       const bar = BARS_BASE.find((b) => String(b.id) === String(barId));
  //       if (!bar) throw new Error("Bar not found");

  //       // Mock gallery grid
  //       const mockPhotos = (bar.photos && bar.photos.length > 0
  //         ? bar.photos.map((p) => ({ id: p.id, image: { uri: p.uri } }))
  //         : Array.from({ length: 6 }, (_, i) => ({
  //             id: `${barId}-photo-${i + 1}`,
  //             image: bar.galleryImage
  //         }))
  //       );

  //       if (!canceled) setPhotos(mockPhotos);
  //     } catch (err: any) {
  //       if (!canceled) setError(err.message ?? "Failed to load photos");
  //     } finally {
  //       if (!canceled) setLoading(false);
  //     }
  //   }

  //   load();
  //   return () => {
  //     canceled = true;
  //   };
  // }, [barId]);

  return { photos, loading, error };
}

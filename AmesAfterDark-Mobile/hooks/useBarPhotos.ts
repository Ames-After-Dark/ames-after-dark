import { useEffect, useState } from "react";
import { getPhotosByBar } from "../services/photosService";

export function useBarPhotos(barId: number) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPhotosByBar(barId);
        setPhotos(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [barId]);

  return { photos, loading, error };
}

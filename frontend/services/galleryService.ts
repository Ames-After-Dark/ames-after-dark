import Constants from "expo-constants";
import { getLatestWeekendAlbums as fetchSmugmugAlbums, getPhotosByAlbumUri as fetchSmugmugPhotos, Photo, Album } from "@/services/photosService";

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || "http://localhost:3000";

if (!BACKEND_URL) {
  console.warn("Missing BACKEND_URL in app config — gallery will not load");
}

// Photo and Album types are imported from photosService; re-export for consumers
export { Photo, Album };

/**
 * Fetches the latest weekend albums from the backend.
 * Returns albums grouped by bar, filtered to the latest weekend.
 */
export async function getLatestWeekendAlbums(): Promise<Album[]> {
  // Code below is used for Cloudflare R2 fetch, but currently disabled until Cloudflare is ready.
  // try {
  //   const url = `${BACKEND_URL}/api/r2/albums`;
  //   const res = await fetch(url, {
  //     headers: { Accept: "application/json" },
  //   });

  //   if (!res.ok) throw new Error(`Albums fetch failed: ${res.statusText}`);
  //   const albums: Album[] = await res.json();
  //   if (albums && albums.length > 0) return albums;
  // } catch (err) {
  //   console.warn("Cloudflare fetch failed, falling back to SmugMug:", err);
  // }
  return await fetchSmugmugAlbums();
}

/**
 * Fetches photos for a given album (bar folder) from the backend.
 * albumUri is the bar folder prefix (e.g. "Sips/").
 */
export async function getPhotosByAlbumUri(albumUri: string): Promise<Photo[]> {
  return await fetchSmugmugPhotos(albumUri);
}

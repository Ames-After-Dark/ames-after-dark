import Constants from "expo-constants";
import { getLatestWeekendAlbums as fetchSmugmugAlbums, getPhotosByAlbumUri as fetchSmugmugPhotos, Photo, Album } from "@/services/photosService";

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL;
const RAW_DOMAIN = process.env.EXPO_PUBLIC_IMAGE_DOMAIN;
const IMAGE_DOMAIN = `https://${RAW_DOMAIN}`;

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
  try {
    const url = `${BACKEND_URL}/r2/albums`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) throw new Error(`Albums fetch failed: ${res.statusText}`);
    const albums: Album[] = await res.json();
    if (albums && albums.length > 0) return albums;
  } catch (err) {
    console.warn("Cloudflare fetch failed, falling back to SmugMug:", err);
  }
  return await fetchSmugmugAlbums();
}

/**
 * Fetches photos for a given album (bar folder) from the backend.
 * albumUri is the bar folder prefix (e.g. "Sips/").
 */
export async function getPhotosByAlbumUri(albumUri: string): Promise<Photo[]> {
  try {
    const url = `${BACKEND_URL}/r2/photos?prefix=${encodeURIComponent(albumUri)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) throw new Error(`Photos fetch failed: ${res.statusText}`);
    const photos: Photo[] = await res.json();
    if (photos && photos.length > 0) return photos;
  } catch (err) {
    console.warn("Cloudflare photos fetch failed, falling back to SmugMug:", err);
  }
  return await fetchSmugmugPhotos(albumUri);
}

/**
 * Transforms a standard R2 public URL into a Cloudflare Image Resizing URL.
 * Syntax: https://<DOMAIN>/cdn-cgi/image/<OPTIONS>/<IMAGE_PATH>
 */
export function getResizedImageUri(originalUri: string, width: number = 400): string {
  if (!originalUri) return originalUri;

  try {
    const urlObj = new URL(originalUri);
    if (urlObj.hostname.includes(`${RAW_DOMAIN}`) || urlObj.hostname.includes("r2.cloudflarestorage.com")) {
      // Extracts the path after the domain
      const imagePath = urlObj.pathname;
      // quality=80 and format=auto will drastically reduce file size for grid photos
      return `${IMAGE_DOMAIN}/cdn-cgi/image/width=${width},quality=80,format=auto${imagePath}`;
    }
  } catch (err) {
    // Ignore if invalid
  }

  return originalUri;
}
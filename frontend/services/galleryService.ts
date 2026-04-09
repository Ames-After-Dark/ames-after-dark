const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL;
const RAW_DOMAIN = process.env.EXPO_PUBLIC_IMAGE_DOMAIN;
const IMAGE_DOMAIN = `https://${RAW_DOMAIN}`;

if (!BACKEND_URL) {
  console.warn("Missing BACKEND_URL in app config — gallery will not load");
}

// Photo and Album types are imported from photosService; re-export for consumers
export type Photo = {
  id: string;
  image: { uri: string };
};

export type Album = {
  id: string;
  name: string;
  barName: string;
  date: string;
  coverUrl: string | null;
  albumUri: string;
};

/**
 * Parse a date token like "2-7" or "1/31" into a Date object (month-day).
 * Assumes current year, but if that date is in the future, it rolls back to previous year.
 */
function parseFolderDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split(/[-\/]/);
  if (parts.length !== 2) return null;

  const month = parseInt(parts[0].trim(), 10) - 1;
  const day = parseInt(parts[1].trim(), 10);
  if (isNaN(month) || isNaN(day)) return null;

  const now = new Date();
  let year = now.getFullYear();
  let candidate = new Date(year, month, day);
  if (candidate > now) candidate = new Date(year - 1, month, day);
  return candidate;
}

/**
 * Fetches albums from the backend & filters them using a 7-day rolling window
 * with a day-of-week override to ensure only most relevant albums are displayed
 */
export async function getLatestWeekendAlbums(): Promise<Album[]> {
  // Code below is used for Cloudflare R2 fetch, but currently disabled until Cloudflare is ready.
  try {
    const url = `${BACKEND_URL}/api/r2/albums`;
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
    const url = `${BACKEND_URL}/api/r2/photos?prefix=${encodeURIComponent(albumUri)}`;
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

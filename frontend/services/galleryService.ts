import Constants from "expo-constants";

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || "http://localhost:3000";

if (!BACKEND_URL) {
  console.warn("Missing BACKEND_URL in app config — gallery will not load");
}

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
 * Fetches the latest weekend albums from the backend.
 * Returns albums grouped by bar, filtered to the latest weekend.
 */
export async function getLatestWeekendAlbums(): Promise<Album[]> {
  try {
    const url = `${BACKEND_URL}/api/r2/albums`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Albums fetch failed: ${res.statusText}`);
    }

    const albums: Album[] = await res.json();
    return albums;
  } catch (err) {
    console.warn("getLatestWeekendAlbums failed:", err);
    return [];
  }
}

/**
 * Fetches photos for a given album (bar folder) from the backend.
 * albumUri is the bar folder prefix (e.g. "Sips/").
 */
export async function getPhotosByAlbumUri(albumUri: string): Promise<Photo[]> {
  try {
    if (!albumUri) return [];

    const url = `${BACKEND_URL}/api/r2/photos?prefix=${encodeURIComponent(albumUri)}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Photos fetch failed: ${res.statusText}`);
    }

    const photos: Photo[] = await res.json();

    if (!photos.length) {
      throw new Error("No photos found in album");
    }

    return photos;
  } catch (err) {
    console.warn("getPhotosByAlbumUri failed:", err);
    // fallback to dummy local images
    return Array.from({ length: 9 }, (_, i) => ({
      id: `mock-${i}`,
      image: require("@/assets/images/Logo.png"),
    }));
  }
}

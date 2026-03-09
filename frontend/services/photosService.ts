import Constants from "expo-constants";

const SMUGMUG_API_KEY = Constants.expoConfig?.extra?.SMUGMUG_API_KEY;
const USER = "chaseanderson";
const SMUGMUG_API_BASE = "https://api.smugmug.com/api/v2";

// ensures API key is working
if (!SMUGMUG_API_KEY) {
  console.warn("Missing SMUGMUG_API_KEY — using fallback images");
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
 * Fetches photos for a given bar by the Album URI.
 * Falls back to mock images if SmugMug fetch fails/none found.
 */
export async function getPhotosByAlbumUri(albumUri: string): Promise<Photo[]> {
  try {
    const url = `https://api.smugmug.com${albumUri}?APIKey=${SMUGMUG_API_KEY}`;
    const imagesData = await xhrGet(url);
    const images = imagesData?.Response?.AlbumImage ?? [];

    const photos = images.map((img: any) => ({
      id: img.ImageKey,
      image: {
        uri: img.Sizes?.LargestImage?.Url || img.ArchivedUri || img.Uri,
      },
    }));

    if (!photos.length) throw new Error("No photos found");
    return photos;
  } catch (err) {
    console.warn("SmugMug fetch failed, falling back:", err);
    return Array.from({ length: 9 }, (_, i) => ({
      id: `mock-${i}`,
      image: require("@/assets/images/Logo.png"),
    }));
  }
}

/**
 * Extract the last date-like token from a folder name.
 * The function finds all occurrences of `M-D` or `M/D` tokens and returns the last one.
 */
function extractFolderEndDate(folderName: string): string | null {
  if (!folderName) return null;
  const tokenRegex = /(?<!\d)(\d{1,2}[\/\-]\d{1,2})(?!\d)/g;
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = tokenRegex.exec(folderName)) !== null) {
    matches.push(m[1]);
  }
  if (matches.length === 0) return null;
  return matches[matches.length - 1];
}

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

function xhrGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader(
      "User-Agent",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    );
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`${xhr.status} ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send();
  });
}

// Fetches albums from the most recent weekend folder
export async function getLatestWeekendAlbums(): Promise<Album[]> {
  try {
    // Temporarily hardcoded as SmugMug folders aren't consistently named (can ignore since moving to Cloudflare)
    const LATEST_FOLDER = "Big-4-2-262-28";
    const albumsUrl = `${SMUGMUG_API_BASE}/folder/user/${USER}/${LATEST_FOLDER}!albums?APIKey=${SMUGMUG_API_KEY}`;
    
    const albumsData = await xhrGet(albumsUrl);
    const allAlbums = albumsData?.Response?.Album ?? [];
    console.log("Albums found:", allAlbums.length);

    const enriched: Album[] = await Promise.all(
      allAlbums.map(async (a: any) => {
        let coverUrl = null;
        try {
          if (a.Uris?.HighlightImage?.Uri) {
            const coverRes = await fetch(
              `https://api.smugmug.com${a.Uris.HighlightImage.Uri}?APIKey=${SMUGMUG_API_KEY}`,
              {
                headers: {
                  Accept: "application/json",
                  "User-Agent": "AmesAfterDark/1.0",
                },
              }
            );
            if (coverRes.ok) {
              const coverData = await coverRes.json();
              coverUrl =
                coverData?.Response?.Image?.LargestImage?.Url ||
                coverData?.Response?.Image?.ArchivedUri ||
                null;
            }
          }
        } catch { /* ignore */ }

        const parts = (a.Name || "").split(" ");
        const date: string = parts.at(-1) || "";
        const bar = parts.slice(0, -1).join(" ");

        return {
          id: a.AlbumKey,
          name: a.Name,
          barName: bar,
          date,
          coverUrl,
          albumUri: a.Uris?.AlbumImages?.Uri,
        };
      })
    );

    return enriched;
  } catch (err) {
    console.warn("Album fetch failed:", err);
    return [];
  }
}
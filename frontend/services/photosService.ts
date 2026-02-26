import Constants from "expo-constants";

// Configurable extras (put these in expo config extra)
const R2_API_TOKEN = Constants.expoConfig?.extra?.CLOUDFLARE_R2_API_TOKEN;
const R2_ACCOUNT_ID = Constants.expoConfig?.extra?.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_BUCKET = Constants.expoConfig?.extra?.CLOUDFLARE_R2_BUCKET;
const R2_S3_ENDPOINT = Constants.expoConfig?.extra?.CLOUDFLARE_R2_S3_ENDPOINT; // e.g. https://<id>.r2.cloudflarestorage.com

if (!R2_API_TOKEN || !R2_ACCOUNT_ID || !R2_BUCKET || !R2_S3_ENDPOINT) {
  console.warn("Missing Cloudflare R2 config (CLOUDFLARE_R2_*) — using fallback images");
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
  albumUri: string; // object prefix for the album in R2
};

function encodeKeyForUrl(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/**
 * Build a public S3-style URL for an R2 object key.
 * If R2_S3_ENDPOINT is set, it constructs a path-style URL: `${endpoint}/${bucket}/${key}`
 */
function urlForKey(key: string) {
  // prefer S3 client endpoint (path-style)
  const endpoint = R2_S3_ENDPOINT?.replace(/\/$/, "") || "";
  const bucket = R2_BUCKET || "";
  return `${endpoint}/${bucket}/${encodeKeyForUrl(key)}`;
}

/**
 * Extract the last date-like token from a folder name.
 * The function finds all occurrences of `M-D` or `M/D` tokens and returns the last one.
 */
function extractFolderEndDate(folderName: string): string | null {
  if (!folderName) return null;
  const tokenRegex = /\b(\d{1,2}[\/\-]\d{1,2})\b/g;
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
 * List objects in R2 under a given prefix using Cloudflare Account API.
 */
async function listR2Objects(prefix = "", limit = 1000): Promise<any[]> {
  if (!R2_API_TOKEN || !R2_ACCOUNT_ID || !R2_BUCKET) return [];
  const base = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects`;
  const url = `${base}?limit=${limit}${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ""}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${R2_API_TOKEN}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.warn("R2 list objects failed: ", res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    const objects = data?.result?.objects || data?.objects || data?.result || [];
    // each object should have a 'key' property
    return objects;
  } catch (err) {
    console.warn("R2 list error: ", err);
    return[];
  }
}

/**
 * Fetches photos for a given album prefix in the R2 bucket.
 * albumUri is the prefix for the album (e.g. "big4/2-7/SomeAlbum/")
 */
export async function getPhotosByAlbumUri(albumUri: string): Promise<Photo[]> {
  try {
    if (!albumUri) return [];
    // remove leading slash
    let prefix = albumUri.replace(/^\//, "");
    // ensure prefix ends with slash so we only list objects within the album
    if (!prefix.endsWith("/")) prefix = `${prefix}/`;

    const objs = await listR2Objects(prefix, 2000);
    const items = objs.filter((o: any) => o?.key).map((o: any) => o);
    const photos = items.map((it: any) => ({ id: it.key, image: { uri: urlForKey(it.key) } }));
    if (!photos.length) throw new Error("No photos found in album");
    return photos;
  } catch (err) {
    console.warn("R2 fetch failed, falling back: ", err);
    return Array.from({ length: 9 }, (_, i) => ({ id: `mock-${i}`, image: require("@/assets/images/Logo.png") }));
  }
}

/**
 * Fetch albums from the most recent "Big 4" weekend folder.
 * Detect folders by looking for keys that contain 'big4' or 'big 4' and
 * then pick the latest folder by parsing embedded date tokens.
 */
export async function getLatestWeekendAlbums(): Promise<Album[]> {
  try {
    // list a large set of objects to discover folder names
    const allObjects = await listR2Objects("", 2000);
    if (!allObjects || allObjects.length === 0) {
      console.warn("No objects found in R2 bucket");
      return [];
    }

    // Find folder names that follow a 'big4' or 'big 4' segment
    const folderSet = new Set<string>();
    for (const obj of allObjects) {
      const key: string = obj?.key || "";
      const parts = key.split("/");
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i].toLowerCase();
        if (p === "big4" || p === "big 4") {
          const folderName = parts[i + 1] || "";
          if (folderName) folderSet.add(folderName);
        }
      }
    }

    const folders = Array.from(folderSet);
    const folderItems = folders
      .map((name) => ({ name, endDateStr: extractFolderEndDate(name) || "", endDate: parseFolderDate(extractFolderEndDate(name) || "") }))
      .filter((f) => f.endDate !== null)
      .sort((a, b) => (b.endDate!.getTime() - a.endDate!.getTime()));

    if (folderItems.length === 0) {
      console.warn("No Big 4 folders found in R2");
      return [];
    }

    const latestFolder = folderItems[0].name;
    // Now list objects under the big4/latestFolder prefix
    // We need to find the parent 'big4' segment to build correct prefix
    // Search one example key to find the exact 'big4/<folder>' prefix
    let prefixBase = "";
    for (const obj of allObjects) {
      const key: string = obj?.key || "";
      const match = key.match(/(big4|big 4)\/(.+?)\//i);
      if (match && match[2] === latestFolder) {
        // extract everything up to and including the folder name
        const idx = key.toLowerCase().indexOf(match[0].toLowerCase());
        if (idx !== -1) {
          prefixBase = key.substring(0, idx) + match[0];
          break;
        }
      }
    }
    // fallback: construct prefix as 'big4/<latestFolder>/'
    if (!prefixBase) prefixBase = `big4/${latestFolder}/`;

    const albumObjects = await listR2Objects(prefixBase, 5000);
    // Group by album (assume album folders are the next segment after folder)
    const albumsMap: Record<string, any[]> = {};
    for (const o of albumObjects) {
      const k: string = o.key || "";
      // remove prefixBase from key
      let relative = k;
      if (k.startsWith(prefixBase)) relative = k.substring(prefixBase.length);
      const parts = relative.split("/");
      const albumName = parts[0] || "__root__";
      if (!albumsMap[albumName]) albumsMap[albumName] = [];
      albumsMap[albumName].push(o);
    }

    const albums: Album[] = Object.entries(albumsMap).map(([albumName, items]) => {
      // try to pick a cover (first image)
      const first = items.find((it: any) => it && it.key && !it.key.endsWith("/"));
      const coverUrl = first ? urlForKey(first.key) : null;
      // Attempt to find a date token in the folder name and use it as the album date
      const dateToken = folderItems[0].endDateStr || "";
      return {
        id: `${latestFolder}/${albumName}`,
        name: `${albumName} ${dateToken}`.trim(),
        barName: albumName,
        date: dateToken,
        coverUrl,
        albumUri: `${prefixBase}${albumName}/`,
      };
    });

    return albums;
  } catch (err) {
    console.warn("getLatestWeekendAlbums failed:", err);
    return [];
  }
}
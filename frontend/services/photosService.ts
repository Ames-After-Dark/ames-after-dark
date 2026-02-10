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
    const imagesRes = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "AmesAfterDark/1.0",
      },
    });

    if (!imagesRes.ok) throw new Error(`Images fetch failed: ${imagesRes.statusText}`);

    const imagesData = await imagesRes.json();
    const images = imagesData?.Response?.AlbumImage ?? [];

    const photos = images.map((img: any) => ({
      id: img.ImageKey,
      image: {
        uri:
          img.Sizes?.LargestImage?.Url || img.ArchivedUri || img.Uri,
      },
    }));

    if (!photos.length) throw new Error("No photos found");
    return photos;
  } catch (err) {
    console.warn("SmugMug fetch failed, falling back:", err);

    // fallback to dummy local images
    return Array.from({ length: 9 }, (_, i) => ({
      id: `mock-${i}`,
      image: require("@/assets/images/Logo.png"),
    }));
  }
}

/**
 * Extract the last date-like token from a folder name.
 * Supports formats like:
 *  - "Big 4 2-5/2-7" -> "2-7"
 *  - "Big 4 1/29 - 1/31" -> "1/31"
 *  - "Big4 12/18-12/20" -> "12/20"
 *  - "Big 4 11-6 / 11-8" -> "11-8"
 *
 * The function finds all occurrences of `M-D` or `M/D` tokens and returns the last one.
 */
function extractFolderEndDate(folderName: string): string | null {
  if (!folderName) return null;
  // Find tokens like 1-31, 12/20, etc.
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
  // If candidate is in the future, it likely refers to previous year
  if (candidate > now) {
    candidate = new Date(year - 1, month, day);
  }
  return candidate;
}

// Fetches albums from the most recent weekend folder
export async function getLatestWeekendAlbums(): Promise<Album[]> {
  try {
    const foldersRes = await fetch(
      `${SMUGMUG_API_BASE}/folder/user/${USER}!folders?APIKey=${SMUGMUG_API_KEY}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "AmesAfterDark/1.0",
        },
      }
    );
    if (!foldersRes.ok)
      throw new Error(`Folders fetch failed: ${foldersRes.statusText}`);

    const foldersData = await foldersRes.json();
    const folders = foldersData?.Response?.Folder ?? [];

    // Fetch only Big 4 folders and extract end dates
    type FolderItem = { folder: any; endDateStr: string; endDate: Date };
    const bigFourFolders: FolderItem[] = folders
      .filter((f: any) => {
        const name = f.Name?.toLowerCase() || "";
        return name.startsWith("big 4") || name.startsWith("big4");
      })
      .map((f: any) => {
        const endDateStr = extractFolderEndDate(f.Name) || "";
        const parsed = parseFolderDate(endDateStr);
        return { folder: f, endDateStr, endDate: parsed } as any;
      })
      .filter((item: { endDate: null; }) => item.endDate !== null) as FolderItem[];

    if (bigFourFolders.length === 0) {
      console.warn("No Big 4 folders found");
      return [];
    }

    // Sort by parsed date descending and pick the latest
    bigFourFolders.sort((a, b) => (b.endDate.getTime() - a.endDate.getTime()));
    const latestFolder = bigFourFolders[0];
    console.log(`Fetching albums from latest weekend folder: ${latestFolder.folder.Name}`);
    // Fetch albums from only the latest folder
    const albumsUrl = `https://api.smugmug.com${latestFolder.folder.Uris.FolderAlbums.Uri}?APIKey=${SMUGMUG_API_KEY}`;
    const albumsRes = await fetch(albumsUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "AmesAfterDark/1.0",
      },
    });

    if (!albumsRes.ok) {
      console.warn(`Albums fetch failed: ${albumsRes.statusText}`);
      return [];
    }

    const albumsData = await albumsRes.json();
    const allAlbums = albumsData?.Response?.Album ?? [];

    // // only include Big 4 folders
    // const validFolders = folders.filter((f: any) => {
    //   const name = f.Name?.toLowerCase() || "";
    //   return name.startsWith("big 4") || name.startsWith("big4");
    // });

    // //console.log("Found Big 4 folders:", validFolders.map((f: any) => f.Name));

    // const allAlbums: any[] = [];

    // for (const folder of validFolders) {
    //   const albumsUrl = `https://api.smugmug.com${folder.Uris.FolderAlbums.Uri}?APIKey=${SMUGMUG_API_KEY}`;
    //   const albumsRes = await fetch(albumsUrl, {
    //     headers: {
    //       Accept: "application/json",
    //       "User-Agent": "AmesAfterDark/1.0",
    //     },
    //   });
    //   if (!albumsRes.ok) continue;

    //   const albumsData = await albumsRes.json();
    //   const albums = albumsData?.Response?.Album ?? [];
    //   allAlbums.push(...albums);
    // }

    // //console.log("Total albums found:", allAlbums.length);

    // fetch image cover
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
        } catch {
          // ignore
        }

        // Extract barName + date from album name like "Sips 2-8"
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

// // Return only the newest album for each bar
// export async function getLatestAlbumsPerBar(): Promise<Album[]> {
//   try {
//     // Call getAlbums
//     const albums = await getAlbums();
//     const latestMap: Record<string, Album> = {};

//     // Reduce to latest per bar
//     for (const a of albums) {
//       const key = (a.barName || a.name || "").toLowerCase();
//       const existing = latestMap[key];

//       if (!existing) {
//         latestMap[key] = a;
//         continue;
//       }

//       const aTime = new Date(a.date).getTime();
//       const eTime = new Date(existing.date).getTime();

//       // Get the album with the newest date
//       if (!isNaN(aTime) && (isNaN(eTime) || aTime > eTime)) {
//         latestMap[key] = a;
//       }
//     }

//     return Object.values(latestMap);
//   } catch (err) {
//     console.warn("Latest albums fetch failed:", err);
//     return [];
//   }
// }
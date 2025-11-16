import { apiFetch } from "./apiClient";
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
 * DEPRECATED: Kept so nothing breaks for now
 * Fetches photos for a given bar from SmugMug.
 * Falls back to mock images if SmugMug fetch fails or none found.
 */
export async function getPhotosByBar(barName: string): Promise<Photo[]> {
  try {
    // get all albums
    const albumsRes = await fetch(
      `${SMUGMUG_API_BASE}/user/${USER}!albums?APIKey=${SMUGMUG_API_KEY}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "AmesAfterDark/1.0",
        },
      }
    );
    if (!albumsRes.ok) throw new Error(`Albums fetch failed: ${albumsRes.statusText}`);

    const albumsData = await albumsRes.json();
    const albums = albumsData?.Response?.Album ?? [];

    // try to find album including barName
    const album = albums.find((a: any) =>
      a.Name.toLowerCase().includes(barName.toLowerCase())
    );
    if (!album) throw new Error(`No album found for ${barName}`);

    // fetch image info
    const imagesRes = await fetch(
      `https://api.smugmug.com${album.Uris.AlbumImages.Uri}?APIKey=${SMUGMUG_API_KEY}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "AmesAfterDark/1.0",
        },
      }
    );
    if (!imagesRes.ok) throw new Error(`Images fetch failed: ${imagesRes.statusText}`);

    const imagesData = await imagesRes.json();
    const images = imagesData?.Response?.AlbumImage ?? [];

    const photos = images.map((img: any) => ({
      id: img.ImageKey,
      image: { uri: img.Sizes?.LargestImage?.Url || img.ArchivedUri || img.Uri },
    }));

    if (!photos.length) throw new Error("No photos found");

    return photos;
  } catch (err) {
    console.warn("SmugMug fetch failed, falling back to mock:", err);
    // fallback to dummy local images
    return Array.from({ length: 9 }, (_, i) => ({
      id: `mock-${i}`,
      image: require("@/assets/images/Logo.png"),
    }));
  }
}

// Get ALL Albums (grouped by folders)
export async function getAlbums() {
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

    // only include Big 4 folders
    const validFolders = folders.filter((f: any) => {
      const name = f.Name?.toLowerCase() || "";
      return name.startsWith("big 4") || name.startsWith("big4");
    });

    //console.log("Found Big 4 folders:", validFolders.map((f: any) => f.Name));

    const allAlbums: any[] = [];

    for (const folder of validFolders) {
      const albumsUrl = `https://api.smugmug.com${folder.Uris.FolderAlbums.Uri}?APIKey=${SMUGMUG_API_KEY}`;
      const albumsRes = await fetch(albumsUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "AmesAfterDark/1.0",
        },
      });
      if (!albumsRes.ok) continue;

      const albumsData = await albumsRes.json();
      const albums = albumsData?.Response?.Album ?? [];
      allAlbums.push(...albums);
    }

    //console.log("Total albums found:", allAlbums.length);

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
        // Extract barName + date from "Sips 11-8"
        const parts = a.Name.split(" ");
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

// Return the newest album for a give bar
// Useful for bar details page to route to newest gallery album
export async function getMostRecentAlbumForBar(barName: string) {
  const albums = await getAlbums();
  const match = albums
    .filter((a) => a.barName.toLowerCase() === barName.toLowerCase())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return match[0] || null;
}
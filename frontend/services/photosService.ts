import { apiFetch } from "./apiClient";
import Constants from "expo-constants";

const SMUGMUG_API_KEY = Constants.expoConfig?.extra?.SMUGMUG_API_KEY;
const USER = "chaseanderson";
const SMUGMUG_API_BASE = "https://api.smugmug.com/api/v2";

// ensures API key is working
if (!SMUGMUG_API_KEY) {
  console.warn("Missing SMUGMUG_API_KEY — using fallback images");
}

type Photo = {
  id: string;
  image: { uri: string };
};

/**
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

    console.log("Found Big 4 folders:", validFolders.map((f: any) => f.Name));

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

  console.log("Total albums found:", allAlbums.length);

    // // Exclude engineers' week just in case
    // const validAlbums = allAlbums.filter(
    //   (a) => !a.Name?.toLowerCase().includes("engineers")
    // );

    // fetch image cover
    const enriched = await Promise.all(
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

        const parts = a.Name.split(" ");
        const bar = parts[0]?.includes("Big") ? parts[1] : parts[0];
        const date = parts.slice(-1)[0] || "";

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
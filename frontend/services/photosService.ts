import { apiFetch } from "./apiClient";

const SMUGMUG_API_KEY = "zDrHkD6NtkcwhBdQfFzXRD9QGZxwWrWx"; // key allows access, don't share
const USER = "chaseanderson";
const SMUGMUG_API_BASE = "https://api.smugmug.com/api/v2";

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

    console.log("Album Uris:", album.Uris);

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
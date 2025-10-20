import { apiFetch } from "./apiClient";

export async function getPhotosByBar(barId: number) {
  // For now, ignore barId and return dummy data
  const dummyPhotos = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    // Use require() to load local assets in React Native
    image: require("../assets/images/icon.png"),
  }));

  // Simulate network delay
  return new Promise<typeof dummyPhotos>((resolve) =>
    setTimeout(() => resolve(dummyPhotos), 500)
  );
}
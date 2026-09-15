import { apiFetch } from "./apiClient";

export interface ActiveBanner {
  id: number;
  name: string;
  image_url: string;
  target_type: "EVENT" | "DEAL";
  target_id: number;
  location_id: number | null;
}

export async function getActiveBanners(): Promise<ActiveBanner[]> {
  return apiFetch("/banners/active");
}

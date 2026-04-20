import { apiFetch } from "./apiClient";

export interface Deal {
  id: string;
  locationId: string;
  title: string;
  description?: string;
  rule?: string;
  deals?: string;
  event?: string;
}

export async function getDeals(): Promise<Deal[]> {
  return apiFetch("/deals");
}

export async function getActiveDeals(): Promise<Deal[]> {
  return apiFetch("/deals/active");
}

export async function getDealsByLocationId(locationId: string): Promise<Deal[]> {
  return apiFetch(`/deals/location/${locationId}`);
}

export async function getDealById(id: string): Promise<Deal> {
  return apiFetch(`/deals/${id}`);
}

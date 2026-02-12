import { apiFetch } from "./apiClient";

export interface Event {
  id: string;
  locationId: string;
  name: string;
  description?: string;
  rule?: string; // e.g., "FRI 21:00-23:59"
  // ... other event fields as needed
}

export async function getEvents(): Promise<Event[]> {
  return apiFetch("/events");
}

export async function getActiveEvents(): Promise<Event[]> {
  return apiFetch("/events");
}

export async function getEventsByLocationId(locationId: string): Promise<Event[]> {
  return apiFetch(`/events/location/${locationId}`);
}

export async function getEventById(id: string): Promise<Event> {
  return apiFetch(`/events/${id}`);
}

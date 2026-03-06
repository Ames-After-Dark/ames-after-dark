import { apiFetch } from "./apiClient";

export interface Event {
  id: string;
  locationId: string;
  location_id?: string | number;
  name: string;
  description?: string;
  rule?: string; // e.g., "FRI 21:00-23:59"
  start_time_utc?: string;
  end_time_utc?: string;
  events?: {
    id?: string | number;
    location_id?: string | number;
    name?: string;
    description?: string;
  };
  // ... other event fields as needed
}

export async function getEvents(): Promise<Event[]> {
  return apiFetch("/events");
}

export async function getActiveEvents(): Promise<Event[]> {
  return apiFetch("/events/active");
}

export async function getEventsByLocationId(locationId: string): Promise<Event[]> {
  return apiFetch(`/events/location/${locationId}`);
}

export async function getEventById(id: string): Promise<Event> {
  return apiFetch(`/events/${id}`);
}

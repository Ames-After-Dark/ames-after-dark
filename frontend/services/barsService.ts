import { apiFetch } from "./apiClient";
import type { Bar, ScheduledDeal, ScheduledEvent } from "@/types/bars";

interface LocationApiResponse {
  id: number;
  name: string;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  open: boolean;
  views: number;
  [key: string]: any;
}

interface EventApiResponse {
  id: number;
  location_id: number;
  date: string;
  start_time_utc: string;
  end_time_utc: string;
  description: string;
  repeating: boolean | null;
  [key: string]: any;
}

interface DealApiResponse {
  id: number;
  location_id: number;
  name: string;
  date: string;
  start_time_utc: string;
  end_time_utc: string;
  repeating: boolean;
  [key: string]: any;
}

/**
 * Fetches all locations along with their associated events and deals,
 * then combines them into the Bar type expected by the frontend.
 */
export async function getBars(): Promise<Bar[]> {
  try {
    // Fetch all data in parallel
    const [locations, events, deals] = await Promise.all([
      apiFetch("/locations") as Promise<LocationApiResponse[]>,
      apiFetch("/events") as Promise<EventApiResponse[]>,
      apiFetch("/deals") as Promise<DealApiResponse[]>,
    ]);

    // Map locations to bars and attach their associated events/deals
    const bars: Bar[] = locations.map((location: LocationApiResponse) => {
      // Filter events and deals for this location
      const locationEvents = events.filter((e: EventApiResponse) => e.location_id === location.id);
      const locationDeals = deals.filter((d: DealApiResponse) => d.location_id === location.id);

      // Convert events to ScheduledEvent format
      const eventsScheduled: ScheduledEvent[] = locationEvents.map((event: EventApiResponse) => ({
        id: String(event.id),
        barId: String(location.id),
        name: event.description,
        description: event.description,
        rule: event.repeating
          ? {
              kind: "weekly" as const,
              tz: "America/Chicago",
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              startLocalTime: new Date(event.start_time_utc).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
              endLocalTime: new Date(event.end_time_utc).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
            }
          : {
              kind: "one-time" as const,
              tz: "America/Chicago",
              start: event.date,
              end: new Date(event.date).toISOString(),
            },
      }));

      // Convert deals to ScheduledDeal format
      const dealsScheduled: ScheduledDeal[] = locationDeals.map((deal: DealApiResponse) => ({
        id: String(deal.id),
        barId: String(location.id),
        title: deal.name,
        rule: deal.repeating
          ? {
              kind: "weekly" as const,
              tz: "America/Chicago",
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              startLocalTime: new Date(deal.start_time_utc).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
              endLocalTime: new Date(deal.end_time_utc).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
            }
          : {
              kind: "one-time" as const,
              tz: "America/Chicago",
              start: deal.date,
              end: new Date(deal.date).toISOString(),
            },
      }));

      return {
        id: String(location.id),
        name: location.name,
        description: location.description,
        open: location.open,
        dealsScheduled,
        eventsScheduled,
      } as Bar;
    });

    return bars;
  } catch (error) {
    console.error("Failed to fetch bars:", error);
    throw error;
  }
}

/**
 * Fetches a single bar by ID along with its associated events and deals.
 */
export async function getBarById(id: string): Promise<Bar | null> {
  try {
    // Fetch location details
    const location = await apiFetch(`/locations/${id}`) as LocationApiResponse;

    if (!location) return null;

    // Fetch all events and deals, then filter for this location
    const [events, deals] = await Promise.all([
      apiFetch("/events") as Promise<EventApiResponse[]>,
      apiFetch("/deals") as Promise<DealApiResponse[]>,
    ]);

    const locationEvents = events.filter((e: EventApiResponse) => e.location_id === location.id);
    const locationDeals = deals.filter((d: DealApiResponse) => d.location_id === location.id);

    // Convert events to ScheduledEvent format
    const eventsScheduled: ScheduledEvent[] = locationEvents.map((event: EventApiResponse) => ({
      id: String(event.id),
      barId: String(location.id),
      name: event.description,
      description: event.description,
      rule: event.repeating
        ? {
            kind: "weekly" as const,
            tz: "America/Chicago",
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startLocalTime: new Date(event.start_time_utc).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            endLocalTime: new Date(event.end_time_utc).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
          }
        : {
            kind: "one-time" as const,
            tz: "America/Chicago",
            start: event.date,
            end: new Date(event.date).toISOString(),
          },
    }));

    // Convert deals to ScheduledDeal format
    const dealsScheduled: ScheduledDeal[] = locationDeals.map((deal: DealApiResponse) => ({
      id: String(deal.id),
      barId: String(location.id),
      title: deal.name,
      rule: deal.repeating
        ? {
            kind: "weekly" as const,
            tz: "America/Chicago",
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startLocalTime: new Date(deal.start_time_utc).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            endLocalTime: new Date(deal.end_time_utc).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
          }
        : {
            kind: "one-time" as const,
            tz: "America/Chicago",
            start: deal.date,
            end: new Date(deal.date).toISOString(),
          },
    }));

    return {
      id: String(location.id),
      name: location.name,
      description: location.description,
      open: location.open,
      dealsScheduled,
      eventsScheduled,
    } as Bar;
  } catch (error) {
    console.error(`Failed to fetch bar ${id}:`, error);
    return null;
  }
}

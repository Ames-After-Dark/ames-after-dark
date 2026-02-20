import { apiFetch } from "./apiClient";
import { getNow } from "@/config/time";
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
      apiFetch("/locations/with-hours") as Promise<LocationApiResponse[]>,
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

      // derive display opening/closing strings from location_hours when present
      let openingTime: string | undefined = undefined;
      let closingTime: string | undefined = undefined;
      const locHours = (location as any).location_hours;
      if (Array.isArray(locHours) && locHours.length) {
        // determine current weekday in America/Chicago to pick the relevant entry
        const now = getNow();
        const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
        const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
        const inTz = new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), 0);
        const weekdayIdNow = inTz.getDay() + 1; // 1=Sun..7=Sat

        const entry = locHours.find((h: any) => Number(h.weekday_id) === Number(weekdayIdNow)) || locHours[0];
        if (entry) {
          const openMatch = String(entry.open_time_utc || "").match(/T(\d{2}):(\d{2})/);
          const closeMatch = String(entry.close_time_utc || "").match(/T(\d{2}):(\d{2})/);
          if (openMatch) {
            const hh = Number(openMatch[1]);
            const mm = Number(openMatch[2]);
            const hour12 = hh % 12 === 0 ? 12 : hh % 12;
            const ampm = hh >= 12 ? "PM" : "AM";
            openingTime = `${hour12}:${String(mm).padStart(2, "0")} ${ampm}`;
          }
          if (closeMatch) {
            const hh = Number(closeMatch[1]);
            const mm = Number(closeMatch[2]);
            const hour12 = hh % 12 === 0 ? 12 : hh % 12;
            const ampm = hh >= 12 ? "PM" : "AM";
            closingTime = `${hour12}:${String(mm).padStart(2, "0")} ${ampm}`;
          }
        }
      }

      return {
        id: String(location.id),
        name: location.name,
        description: location.description,
        open: location.open,
        openingTime,
        closingTime,
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

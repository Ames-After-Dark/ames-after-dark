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
  location_type_id: number; // 1=Bar, 2=Restaurant, etc.
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

interface MenuItemTypeApiResponse {
  id: number;
  name: string;
}

interface MenuItemApiResponse {
  id: number;
  location_id: number;
  menu_item_type_id: number;
  name: string;
  description?: string | null;
  is_available?: boolean | null;
  price?: string | number | null;
  [key: string]: any;
}

interface LocationHourRow {
  weekday_id?: number | string;
  open_time?: string;
  close_time?: string;
  open_time_utc?: string;
  close_time_utc?: string;
  [key: string]: any;
}

interface LocationHoursApiResponse {
  id: number;
  timezone?: string;
  location_hours?: LocationHourRow[];
  [key: string]: any;
}

function parseTimeToMinutes(value?: string | null): number | null {
  if (!value) return null;
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}

function formatMinutesAs12Hour(value: number | null): string | undefined {
  if (value == null) return undefined;
  const hour24 = Math.floor(value / 60);
  const minute = value % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function getWeekdayIdInTimezone(now: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value])
  );

  const inTimezoneDate = new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    0
  );

  return inTimezoneDate.getDay() + 1; // 1=Sun..7=Sat
}

function deriveDisplayHours(
  schedule: LocationHourRow[] | undefined,
  timezone = "America/Chicago"
): { openingTime?: string; closingTime?: string } {
  if (!Array.isArray(schedule) || !schedule.length) {
    return {};
  }

  const todayId = getWeekdayIdInTimezone(new Date(), timezone);
  const entry = schedule.find((row) => Number(row.weekday_id) === todayId) ?? schedule[0];
  if (!entry) {
    return {};
  }

  const openingTime = formatMinutesAs12Hour(
    parseTimeToMinutes(entry.open_time ?? entry.open_time_utc ?? null)
  );
  const closingTime = formatMinutesAs12Hour(
    parseTimeToMinutes(entry.close_time ?? entry.close_time_utc ?? null)
  );

  return { openingTime, closingTime };
}

function toIsoOrNull(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function buildOneTimeRule(dateValue?: string | null) {
  const iso = toIsoOrNull(dateValue);
  if (!iso) return null;
  return {
    kind: "one-time" as const,
    tz: "America/Chicago",
    start: dateValue ?? iso,
    end: iso,
  };
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

    const hoursByLocationId = new Map<number, LocationHoursApiResponse>();
    await Promise.all(
      locations.map(async (location) => {
        try {
          const hours = await apiFetch(`/locationhours/${location.id}`) as LocationHoursApiResponse;
          if (hours && Array.isArray(hours.location_hours)) {
            hoursByLocationId.set(location.id, hours);
          }
        } catch (error) {
          console.warn(`Failed to fetch hours for location ${location.id}:`, error);
        }
      })
    );

    // Map locations to bars and attach their associated events/deals
    const bars: Bar[] = locations.map((location: LocationApiResponse) => {
      // Filter events and deals for this location
      const locationEvents = events.filter((e: EventApiResponse) => e.location_id === location.id);
      const locationDeals = deals.filter((d: DealApiResponse) => d.location_id === location.id);

      // Convert events to ScheduledEvent format
      const eventsScheduled: ScheduledEvent[] = locationEvents
        .map((event: EventApiResponse) => {
          if (event.repeating) {
            return {
              id: String(event.id),
              barId: String(location.id),
              name: event.description,
              description: event.description,
              rule: {
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
              },
            } as ScheduledEvent;
          }

          const oneTimeRule = buildOneTimeRule(event.date);
          if (!oneTimeRule) return null;

          return {
            id: String(event.id),
            barId: String(location.id),
            name: event.description,
            description: event.description,
            rule: oneTimeRule,
          } as ScheduledEvent;
        })
        .filter((event): event is ScheduledEvent => Boolean(event));

      // Convert deals to ScheduledDeal format
      const dealsScheduled: ScheduledDeal[] = locationDeals
        .map((deal: DealApiResponse) => {
          if (deal.repeating) {
            return {
              id: String(deal.id),
              barId: String(location.id),
              title: deal.name,
              rule: {
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
              },
            } as ScheduledDeal;
          }

          const oneTimeRule = buildOneTimeRule(deal.date);
          if (!oneTimeRule) return null;

          return {
            id: String(deal.id),
            barId: String(location.id),
            title: deal.name,
            rule: oneTimeRule,
          } as ScheduledDeal;
        })
        .filter((deal): deal is ScheduledDeal => Boolean(deal));

      const hoursResponse = hoursByLocationId.get(location.id);
      const schedule = (
        Array.isArray(hoursResponse?.location_hours) && hoursResponse.location_hours.length
          ? hoursResponse.location_hours
          : Array.isArray((location as any).location_hours)
            ? ((location as any).location_hours as LocationHourRow[])
            : []
      ) as LocationHourRow[];

      const { openingTime, closingTime } = deriveDisplayHours(
        schedule,
        hoursResponse?.timezone || "America/Chicago"
      );

      return {
        id: String(location.id),
        name: location.name,
        description: location.description,
        open: location.open,
        openingTime,
        closingTime,
        dealsScheduled,
        eventsScheduled,
        location_type_id: location.location_type_id,
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

    // Fetch events, deals, and menu items for this location
    const [events, deals, menuItems, menuItemTypes] = await Promise.all([
      apiFetch("/events") as Promise<EventApiResponse[]>,
      apiFetch("/deals") as Promise<DealApiResponse[]>,
      apiFetch(`/menuitems/location/${id}`) as Promise<MenuItemApiResponse[]>,
      apiFetch("/menuitems/types") as Promise<MenuItemTypeApiResponse[]>,
    ]);

    const locationEvents = events.filter((e: EventApiResponse) => e.location_id === location.id);
    const locationDeals = deals.filter((d: DealApiResponse) => d.location_id === location.id);

    // Convert events to ScheduledEvent format
    const eventsScheduled: ScheduledEvent[] = locationEvents
      .map((event: EventApiResponse) => {
        if (event.repeating) {
          return {
            id: String(event.id),
            barId: String(location.id),
            name: event.description,
            description: event.description,
            rule: {
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
            },
          } as ScheduledEvent;
        }

        const oneTimeRule = buildOneTimeRule(event.date);
        if (!oneTimeRule) return null;

        return {
          id: String(event.id),
          barId: String(location.id),
          name: event.description,
          description: event.description,
          rule: oneTimeRule,
        } as ScheduledEvent;
      })
      .filter((event): event is ScheduledEvent => Boolean(event));

    // Convert deals to ScheduledDeal format
    const dealsScheduled: ScheduledDeal[] = locationDeals
      .map((deal: DealApiResponse) => {
        if (deal.repeating) {
          return {
            id: String(deal.id),
            barId: String(location.id),
            title: deal.name,
            rule: {
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
            },
          } as ScheduledDeal;
        }

        const oneTimeRule = buildOneTimeRule(deal.date);
        if (!oneTimeRule) return null;

        return {
          id: String(deal.id),
          barId: String(location.id),
          title: deal.name,
          rule: oneTimeRule,
        } as ScheduledDeal;
      })
      .filter((deal): deal is ScheduledDeal => Boolean(deal));

    const groupedMenuItems = new Map<string, { id: string; name: string; desc?: string; price?: string; isAvailable: boolean }[]>();

    const menuTypeNameById = new Map<number, string>(
      menuItemTypes.map((type) => [type.id, type.name])
    );

    menuItems
      .filter((item) => item.is_available !== false)
      .forEach((item) => {
        const sectionTitle = menuTypeNameById.get(item.menu_item_type_id) || "Menu";
        const sectionItems = groupedMenuItems.get(sectionTitle) ?? [];
        sectionItems.push({
          id: String(item.id),
          name: item.name,
          desc: item.description ?? undefined,
          price: item.price == null ? undefined : String(item.price),
          isAvailable: item.is_available !== false,
        });
        groupedMenuItems.set(sectionTitle, sectionItems);
      });

    const menuSections = Array.from(groupedMenuItems.entries()).map(([title, items], index) => ({
      id: `${title.toLowerCase().replace(/\s+/g, "-")}-${index}`,
      title,
      items,
    }));

    return {
      id: String(location.id),
      name: location.name,
      description: location.description,
      open: location.open,
      dealsScheduled,
      eventsScheduled,
      menu: {
        sections: menuSections,
      },
      location_type_id: location.location_type_id,
    } as Bar;
  } catch (error) {
    console.error(`Failed to fetch bar ${id}:`, error);
    return null;
  }
}

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
  location_id?: number | null;
  name?: string | null;
  description?: string | null;
  date?: string;
  start_time_utc?: string;
  end_time_utc?: string;
  repeating?: boolean | null;
  event_occurrences?: {
    id?: number;
    event_id?: number;
    start_time_utc?: string;
    end_time_utc?: string;
    [key: string]: any;
  }[];
  [key: string]: any;
}

interface DealApiResponse {
  id: number;
  location_id?: number | null;
  name?: string | null;
  date?: string;
  start_time_utc?: string;
  end_time_utc?: string;
  repeating?: boolean;
  deal_occurrences?: {
    id?: number;
    deal_id?: number;
    start_time_utc?: string;
    end_time_utc?: string;
    [key: string]: any;
  }[];
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

function buildOneTimeRuleFromRange(startValue?: string | null, endValue?: string | null) {
  const startIso = toIsoOrNull(startValue);
  const endIso = toIsoOrNull(endValue);
  if (!startIso || !endIso) return null;
  return {
    kind: "one-time" as const,
    tz: "America/Chicago",
    start: startIso,
    end: endIso,
  };
}

function toLocal24Hour(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function mapEventToScheduled(event: EventApiResponse, locationId: number): ScheduledEvent[] {
  const eventName = event.name ?? event.description ?? `Event ${event.id}`;
  const eventDescription = event.description ?? undefined;

  if (Array.isArray(event.event_occurrences) && event.event_occurrences.length) {
    return event.event_occurrences
      .map((occurrence, index) => {
        const rule = buildOneTimeRuleFromRange(
          occurrence.start_time_utc,
          occurrence.end_time_utc
        );
        if (!rule) return null;

        return {
          id: `${String(event.id)}-occ-${String(occurrence.id ?? index)}`,
          barId: String(locationId),
          name: eventName,
          description: eventDescription,
          rule,
        } as ScheduledEvent;
      })
      .filter((item): item is ScheduledEvent => Boolean(item));
  }

  if (event.repeating) {
    const startLocalTime = toLocal24Hour(event.start_time_utc);
    const endLocalTime = toLocal24Hour(event.end_time_utc);
    if (!startLocalTime || !endLocalTime) return [];

    return [{
      id: String(event.id),
      barId: String(locationId),
      name: eventName,
      description: eventDescription,
      rule: {
        kind: "weekly" as const,
        tz: "America/Chicago",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startLocalTime,
        endLocalTime,
      },
    } as ScheduledEvent];
  }

  const oneTimeRule =
    buildOneTimeRuleFromRange(event.start_time_utc, event.end_time_utc) ??
    buildOneTimeRule(event.date);
  if (!oneTimeRule) return [];

  return [{
    id: String(event.id),
    barId: String(locationId),
    name: eventName,
    description: eventDescription,
    rule: oneTimeRule,
  } as ScheduledEvent];
}

function mapDealToScheduled(deal: DealApiResponse, locationId: number): ScheduledDeal[] {
  const dealTitle = deal.name ?? `Deal ${deal.id}`;

  if (Array.isArray(deal.deal_occurrences) && deal.deal_occurrences.length) {
    return deal.deal_occurrences
      .map((occurrence, index) => {
        const rule = buildOneTimeRuleFromRange(
          occurrence.start_time_utc,
          occurrence.end_time_utc
        );
        if (!rule) return null;

        return {
          id: `${String(deal.id)}-occ-${String(occurrence.id ?? index)}`,
          barId: String(locationId),
          title: dealTitle,
          rule,
        } as ScheduledDeal;
      })
      .filter((item): item is ScheduledDeal => Boolean(item));
  }

  if (deal.repeating) {
    const startLocalTime = toLocal24Hour(deal.start_time_utc);
    const endLocalTime = toLocal24Hour(deal.end_time_utc);
    if (!startLocalTime || !endLocalTime) return [];

    return [{
      id: String(deal.id),
      barId: String(locationId),
      title: dealTitle,
      rule: {
        kind: "weekly" as const,
        tz: "America/Chicago",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startLocalTime,
        endLocalTime,
      },
    } as ScheduledDeal];
  }

  const oneTimeRule =
    buildOneTimeRuleFromRange(deal.start_time_utc, deal.end_time_utc) ??
    buildOneTimeRule(deal.date);
  if (!oneTimeRule) return [];

  return [{
    id: String(deal.id),
    barId: String(locationId),
    title: dealTitle,
    rule: oneTimeRule,
  } as ScheduledDeal];
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
      const locationEvents = events.filter(
        (e: EventApiResponse) => Number(e.location_id) === Number(location.id)
      );
      const locationDeals = deals.filter(
        (d: DealApiResponse) => Number(d.location_id) === Number(location.id)
      );

      const eventsScheduled: ScheduledEvent[] = locationEvents.flatMap((event) =>
        mapEventToScheduled(event, location.id)
      );

      const dealsScheduled: ScheduledDeal[] = locationDeals.flatMap((deal) =>
        mapDealToScheduled(deal, location.id)
      );

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

    const locationEvents = events.filter(
      (e: EventApiResponse) => Number(e.location_id) === Number(location.id)
    );
    const locationDeals = deals.filter(
      (d: DealApiResponse) => Number(d.location_id) === Number(location.id)
    );

    const eventsScheduled: ScheduledEvent[] = locationEvents.flatMap((event) =>
      mapEventToScheduled(event, location.id)
    );

    const dealsScheduled: ScheduledDeal[] = locationDeals.flatMap((deal) =>
      mapDealToScheduled(deal, location.id)
    );

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

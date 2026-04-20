import { useMemo } from "react";
import { useDeals } from "./useDeals";
import { useEvents } from "./useEvents";

// ─── TODO: API SWAP POINT ────────────────────────────────────────────────────
// When the "deals and events happening today" endpoint is ready, replace:
//   useDeals()  →  useTonightDeals()   (hits /api/deals/today or similar)
//   useEvents() →  useTonightEvents()  (hits /api/events/today or similar)
// The hooks should return the same { deals, events, loading, error } shape.
// Remove filterTonightOccurrences() below once the API does the filtering.
// ─────────────────────────────────────────────────────────────────────────────
import { useBars } from "./useBars";
import { Deal } from "@/services/dealsService";
import { Event } from "@/services/eventsService";
import type { Bar } from "@/types/bars";

// Location type alias for compatibility
type Location = Bar;

export interface TonightBarData {
  id: string;
  bar: string;
  event: string;
  specials: string;
  openHours?: string;
  isOpen: boolean;
  hasDeal: boolean;
  image?: string;
  locationId: string;
}

export interface TonightDealData {
  id: string;
  dealId: string;
  barId: string;
  bar: string;
  title: string;
  subtitle?: string;
  isActiveNow: boolean;
}

export interface BarDealOrEvent {
  id: string;
  kind: 'event' | 'deal';
  title: string;
  subtitle?: string;
  startTimeUtc?: Date;
}

export interface BarGroupedTonight {
  barId: string;
  barName: string;
  logoUrl?: string;
  highlight: BarDealOrEvent;
  rest: BarDealOrEvent[];
}

interface NormalizedActiveDeal {
  dealId: string;
  locationId: string;
  title: string;
  subtitle?: string;
  startTimeUtc?: Date;
}

interface NormalizedActiveEvent {
  eventId: string;
  locationId: string;
  name: string;
  description?: string;
  startTimeUtc?: Date;
}

interface LocationHourRow {
  weekday_id?: number | string;
  open_time?: string;
  close_time?: string;
}

function parseTimeToMinutes(value?: string): number | null {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}

function format24HourTime(value?: string): string | undefined {
  const minutes = parseTimeToMinutes(value);
  if (minutes == null) return undefined;
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
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

function getTimeInMinutesInTimezone(now: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value])
  );

  return Number(parts.hour) * 60 + Number(parts.minute);
}

function getHoursFromSchedule(location: Location): string | undefined {
  const locationWithHours = location as Location & {
    timezone?: string;
    location_hours?: LocationHourRow[];
  };

  const schedule = locationWithHours.location_hours;
  if (!Array.isArray(schedule) || !schedule.length) return undefined;

  const timezone = locationWithHours.timezone || "America/Chicago";
  const now = new Date();
  const todayId = getWeekdayIdInTimezone(now, timezone);
  const yesterdayId = todayId === 1 ? 7 : todayId - 1;
  const currentMinutes = getTimeInMinutesInTimezone(now, timezone);

  const activeRow = schedule.find((row) => {
    const weekdayId = Number(row.weekday_id);
    const openMinutes = parseTimeToMinutes(row.open_time);
    const closeMinutes = parseTimeToMinutes(row.close_time);

    if (!weekdayId || openMinutes == null || closeMinutes == null) return false;

    const isOvernight = closeMinutes <= openMinutes;

    if (!isOvernight) {
      return (
        weekdayId === todayId &&
        currentMinutes >= openMinutes &&
        currentMinutes <= closeMinutes
      );
    }

    const isFirstHalf =
      weekdayId === todayId && currentMinutes >= openMinutes;
    const isSecondHalf =
      weekdayId === yesterdayId && currentMinutes <= closeMinutes;

    return isFirstHalf || isSecondHalf;
  });

  const fallbackRow =
    activeRow ?? schedule.find((row) => Number(row.weekday_id) === todayId) ?? schedule[0];

  const open = format24HourTime(fallbackRow?.open_time);
  const close = format24HourTime(fallbackRow?.close_time);
  if (open && close) return `${open} - ${close}`;
  if (open) return `From ${open}`;
  if (close) return `Until ${close}`;
  return undefined;
}

function getOpenHoursText(location: Location): string | undefined {
  const locationWithFallbacks = location as Location & {
    openingTime?: string;
    closingTime?: string;
    hours_open?: string;
    hours_close?: string;
  };

  const open =
    locationWithFallbacks.hours_open ??
    locationWithFallbacks.openingTime ??
    locationWithFallbacks.hours_open;
  const close =
    locationWithFallbacks.hours_close ??
    locationWithFallbacks.closingTime ??
    locationWithFallbacks.hours_close;

  if (open && close) return `${open} - ${close}`;
  if (open) return `From ${open}`;
  if (close) return `Until ${close}`;
  return getHoursFromSchedule(location);
}

// ─── Tonight Filter ──────────────────────────────────────────────────────────
// TODO: Remove this function once the backend has a dedicated "today" endpoint.
// Keeps only deals/events that have at least one occurrence starting or active
// on the current calendar day in America/Chicago (CDT/CST).
// Update the generic T to include a broad index signature or record
function filterTonightOccurrences<T extends object>(items: T[]): T[] {
  const now = new Date();

  const todayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(yesterday);

  return items.filter((item) => {
    // Cast to any here to allow checking for occurrences properties 
    // that might not be strictly defined on the base Deal/Event types
    const rawItem = item as any;
    const occurrences: Array<{ start_time_utc: string | Date; end_time_utc: string | Date }> =
      rawItem.deal_occurrences ?? rawItem.event_occurrences ?? [];

    if (occurrences.length === 0) return false;

    return occurrences.some((occ) => {
      const start = new Date(occ.start_time_utc);
      const end = new Date(occ.end_time_utc);

      if (end < now) return false;

      const startStr = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(start);

      return startStr === todayStr || startStr === yesterdayStr;
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────

function normalizeActiveDeal(deal: Deal): NormalizedActiveDeal | null {
  const rawDeal = deal as Deal & {
    id?: string | number;
    location_id?: string | number;
    title?: string;
    name?: string;
    description?: string;
    start_time_utc?: string | Date;
    deal_occurrences?: Array<{ start_time_utc: string | Date; end_time_utc: string | Date }>;
    deals?: {
      id?: string | number;
      location_id?: string | number;
      title?: string;
      name?: string;
      description?: string;
    };
  };

  const locationId = String(
    rawDeal.locationId ?? rawDeal.location_id ?? rawDeal.deals?.location_id ?? ""
  );
  if (!locationId) return null;

  const dealId = String(rawDeal.id ?? rawDeal.deals?.id ?? "");
  const title = rawDeal.title ?? rawDeal.name ?? rawDeal.deals?.title ?? rawDeal.deals?.name ?? "Deal";
  const subtitle = rawDeal.description ?? rawDeal.deals?.description;

  // Try top-level start_time_utc first (active endpoint), then first nested occurrence (all endpoint)
  const startTimeUtc = rawDeal.start_time_utc
    ? new Date(rawDeal.start_time_utc)
    : rawDeal.deal_occurrences?.[0]?.start_time_utc
      ? new Date(rawDeal.deal_occurrences[0].start_time_utc)
      : undefined;

  const normalizedDeal: NormalizedActiveDeal = { dealId, locationId, title };
  if (subtitle) normalizedDeal.subtitle = subtitle;
  if (startTimeUtc) normalizedDeal.startTimeUtc = startTimeUtc;

  return normalizedDeal;
}

function normalizeActiveEvent(event: Event): NormalizedActiveEvent | null {
  const rawEvent = event as Event & {
    id?: string | number;
    location_id?: string | number;
    name?: string;
    description?: string;
    start_time_utc?: string | Date;
    event_occurrences?: Array<{ start_time_utc: string | Date; end_time_utc: string | Date }>;
    events?: {
      id?: string | number;
      location_id?: string | number;
      name?: string;
      description?: string;
    };
  };

  const locationId = String(
    rawEvent.locationId ?? rawEvent.location_id ?? rawEvent.events?.location_id ?? ""
  );
  if (!locationId) return null;

  const eventId = String(rawEvent.id ?? rawEvent.events?.id ?? "");
  const name =
    rawEvent.name ??
    rawEvent.events?.name ??
    rawEvent.description ??
    rawEvent.events?.description ??
    "Event";
  const description = rawEvent.description ?? rawEvent.events?.description;

  // Try top-level start_time_utc first (active endpoint), then first nested occurrence (all endpoint)
  const startTimeUtc = rawEvent.start_time_utc
    ? new Date(rawEvent.start_time_utc)
    : rawEvent.event_occurrences?.[0]?.start_time_utc
      ? new Date(rawEvent.event_occurrences[0].start_time_utc)
      : undefined;

  const normalizedEvent: NormalizedActiveEvent = { eventId, locationId, name };
  if (description) normalizedEvent.description = description;
  if (startTimeUtc) normalizedEvent.startTimeUtc = startTimeUtc;

  return normalizedEvent;
}

export function useTonightData() {
  const { deals, loading: dealsLoading, error: dealsError } = useDeals();
  const { events, loading: eventsLoading, error: eventsError } = useEvents();
  const { bars: allBars, loading: barsLoading, error: barsError } = useBars();

  const loading = dealsLoading || eventsLoading || barsLoading;
  const error = dealsError || eventsError || barsError;

  // Filter to only open bars (using frontend calculation instead of backend endpoint)
  const bars = useMemo(() => {
    return allBars.filter((bar) => bar.__openNow === true);
  }, [allBars]);

  const activeDeals = useMemo(() => {
    // TODO: When API swap is done, remove filterTonightOccurrences() call here
    return filterTonightOccurrences(deals)
      .map((deal) => normalizeActiveDeal(deal))
      .filter((deal): deal is NormalizedActiveDeal => Boolean(deal));
  }, [deals]);

  const activeEvents = useMemo(() => {
    // TODO: When API swap is done, remove filterTonightOccurrences() call here
    return filterTonightOccurrences(events)
      .map((event) => normalizeActiveEvent(event))
      .filter((event): event is NormalizedActiveEvent => Boolean(event));
  }, [events]);

  // Organize deals by locationId for quick lookup
  const dealsByLocation = useMemo(() => {
    const map = new Map<string, Deal[]>();
    activeDeals.forEach((deal) => {
      if (!map.has(deal.locationId)) {
        map.set(deal.locationId, []);
      }
      map.get(deal.locationId)!.push({
        id: deal.dealId,
        locationId: deal.locationId,
        title: deal.title,
        description: deal.subtitle,
      } as Deal);
    });
    return map;
  }, [activeDeals]);

  // Organize events by locationId for quick lookup
  const eventsByLocation = useMemo(() => {
    const map = new Map<string, Event[]>();
    activeEvents.forEach((event) => {
      const locationId = String(event.locationId);
      if (!map.has(locationId)) {
        map.set(locationId, []);
      }
      map.get(locationId)!.push({
        id: event.eventId,
        locationId: event.locationId,
        name: event.name,
        description: event.description,
      } as Event);
    });
    return map;
  }, [activeEvents]);

  // Combine location data with deals and events
  // Note: 'bars' is already filtered to only open locations (computed locally with __openNow)
  const barsWithTonightData = useMemo(() => {
    return bars.map((location: Location) => {
      const locationId = String(location.id);
      const locationDeals = dealsByLocation.get(locationId) || [];
      const locationEvents = eventsByLocation.get(locationId) || [];

      return {
        id: locationId,
        locationId,
        bar: location.name,
        event: locationEvents[0]?.name ?? "",
        specials: locationDeals[0]?.title ?? "",
        openHours: getOpenHoursText(location),
        isOpen: true, // bars array is already filtered to only open bars
        hasDeal: locationDeals.length > 0,
        image: location.logoUrl,
      } as TonightBarData;
    });
  }, [bars, dealsByLocation, eventsByLocation]);

  // Flatten all deals from open locations for "Deals Tonight" tab
  const allActiveDealsTonight = useMemo(() => {
    const openLocationIds = new Set(bars.map((b) => String(b.id)));

    return activeDeals
      .filter((deal) => openLocationIds.has(deal.locationId))
      .map((deal) => {
        const bar = bars.find((b) => String(b.id) === deal.locationId);
        if (!bar) return null;
        const barId = String(bar.id);

        return {
          id: `${barId}-${deal.dealId || deal.title}`,
          dealId: deal.dealId,
          barId,
          bar: bar.name,
          title: deal.title,
          subtitle: deal.subtitle,
          isActiveNow: true,
        } as TonightDealData;
      })
      .filter((item): item is TonightDealData => Boolean(item));
  }, [bars, activeDeals]);

  // Build grouped bar view for "Deals Tonight" tab
  // Each bar gets one highlighted item (event preferred, then deal) and the rest collapsed
  const barGroupsTonight = useMemo((): BarGroupedTonight[] => {
    const now = new Date();
    const openLocationIds = new Set(bars.map((b) => String(b.id)));

    // Helper: distance from now in ms (for sorting by proximity)
    const distFromNow = (d?: Date) =>
      d ? Math.abs(d.getTime() - now.getTime()) : Infinity;

    const groups: BarGroupedTonight[] = [];

    bars.forEach((location) => {
      const locationId = String(location.id);
      if (!openLocationIds.has(locationId)) return;

      // Collect all events for this bar
      const barEvents: BarDealOrEvent[] = activeEvents
        .filter((e) => e.locationId === locationId)
        .map((e) => ({
          id: `event-${e.eventId}`,
          kind: 'event' as const,
          title: e.name,
          subtitle: e.description,
          startTimeUtc: e.startTimeUtc,
        }))
        .sort((a, b) => distFromNow(a.startTimeUtc) - distFromNow(b.startTimeUtc));

      // Collect all deals for this bar
      const barDeals: BarDealOrEvent[] = activeDeals
        .filter((d) => d.locationId === locationId)
        .map((d) => ({
          id: `deal-${d.dealId}`,
          kind: 'deal' as const,
          title: d.title,
          subtitle: d.subtitle,
          startTimeUtc: d.startTimeUtc,
        }))
        .sort((a, b) => distFromNow(a.startTimeUtc) - distFromNow(b.startTimeUtc));

      const all = [...barEvents, ...barDeals];
      if (all.length === 0) return; // exclude bars with nothing tonight

      // Highlight: first event (closest to now), or first deal if no events
      const highlight = all[0];
      const rest = all.slice(1);

      groups.push({
        barId: locationId,
        barName: location.name,
        logoUrl: location.logoUrl,
        highlight,
        rest,
      });
    });

    // Sort bars alphabetically
    return groups.sort((a, b) => a.barName.localeCompare(b.barName));
  }, [bars, activeEvents, activeDeals]);

  return {
    barsWithTonightData,
    allActiveDealsTonight,
    barGroupsTonight,
    loading,
    error,
  };
}

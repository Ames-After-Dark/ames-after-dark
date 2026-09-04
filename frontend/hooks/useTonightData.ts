import { useCallback, useMemo } from "react";
import { useDeals } from "./useDeals";
import { useEvents } from "./useEvents";

// ─── TODO: API SWAP POINT ────────────────────────────────────────────────────
// When the "deals and events happening today" endpoint is ready, replace:
//   useDeals()  →  useTonightDeals()   (hits /api/deals/today or similar)
//   useEvents() →  useTonightEvents()  (hits /api/events/today or similar)
// The hooks should return the same { deals, events, loading, error } shape.
// Remove findCurrentOccurrence()/findNextOccurrenceTonight() below once the API does the filtering.
// ─────────────────────────────────────────────────────────────────────────────
// Note: this intentionally uses useAllBars (every location), not useOpenBars
// (currently-open-only) — Tonight should show bars with deals/events later
// tonight even if they haven't opened their doors yet. See isBarOpenNow()
// below for the per-bar open/closed status shown alongside each listing.
import { useAllBars } from "./useAllBars";
import { Deal } from "@/services/dealsService";
import { Event } from "@/services/eventsService";
import { Location } from "./useOpenBars";

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

function isBarOpenNow(location: Location): boolean {
  const locationWithHours = location as Location & {
    timezone?: string;
    location_hours?: LocationHourRow[];
  };

  const schedule = locationWithHours.location_hours;
  if (!Array.isArray(schedule) || !schedule.length) return false;

  const timezone = locationWithHours.timezone || "America/Chicago";
  const now = new Date();
  const todayId = getWeekdayIdInTimezone(now, timezone);
  const yesterdayId = todayId === 1 ? 7 : todayId - 1;
  const currentMinutes = getTimeInMinutesInTimezone(now, timezone);

  return schedule.some((row) => {
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

    const isFirstHalf = weekdayId === todayId && currentMinutes >= openMinutes;
    const isSecondHalf = weekdayId === yesterdayId && currentMinutes <= closeMinutes;

    return isFirstHalf || isSecondHalf;
  });
}

function getOpenHoursText(location: Location): string | undefined {
  const locationWithFallbacks = location as Location & {
    openingTime?: string;
    closingTime?: string;
    hours_open?: string;
    hours_close?: string;
  };

  const open =
    locationWithFallbacks.hoursOpen ??
    locationWithFallbacks.openingTime ??
    locationWithFallbacks.hours_open;
  const close =
    locationWithFallbacks.hoursClose ??
    locationWithFallbacks.closingTime ??
    locationWithFallbacks.hours_close;

  if (open && close) return `${open} - ${close}`;
  if (open) return `From ${open}`;
  if (close) return `Until ${close}`;
  return getHoursFromSchedule(location);
}

// ─── Tonight Occurrence Selection ───────────────────────────────────────────
// TODO: Remove this once the backend has dedicated "active now" / "later
// tonight" endpoints.
// "Open Now" and "Tonight" must be mutually exclusive: a deal/event that has
// already started belongs in Open Now (it's happening right now), and only a
// deal/event that hasn't started yet — but will, later today — belongs in
// Tonight. Each helper below picks the single occurrence (if any) of an item
// that matches its bucket, rather than just checking "does today's date
// match," which is what previously let already-active items leak into both
// tabs at once.
type Occurrence = { start_time_utc: string | Date; end_time_utc: string | Date };

function findCurrentOccurrence(occurrences: Occurrence[], now: Date): Occurrence | undefined {
  return occurrences.find((occ) => {
    const start = new Date(occ.start_time_utc);
    const end = new Date(occ.end_time_utc);
    return start <= now && now <= end;
  });
}

function findNextOccurrenceTonight(
  occurrences: Occurrence[],
  now: Date,
  todayStr: string
): Occurrence | undefined {
  const upcoming = occurrences.filter((occ) => {
    const start = new Date(occ.start_time_utc);

    // Must not have started yet — an already-active occurrence belongs to
    // Open Now, not Tonight.
    if (start <= now) return false;

    const startStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(start);

    return startStr === todayStr;
  });

  if (!upcoming.length) return undefined;

  return upcoming.reduce((soonest, occ) =>
    new Date(occ.start_time_utc) < new Date(soonest.start_time_utc) ? occ : soonest
  );
}

function getChicagoDateStr(now: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
// ─────────────────────────────────────────────────────────────────────────────

function normalizeActiveDeal(
  deal: Deal,
  occurrenceStartUtc?: string | Date
): NormalizedActiveDeal | null {
  const rawDeal = deal as Deal & {
    id?: string | number;
    location_id?: string | number;
    title?: string;
    name?: string;
    description?: string;
    start_time_utc?: string | Date;
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

  // The caller resolves which occurrence (current or upcoming) this deal
  // matched to; fall back to the top-level start_time_utc for endpoints that
  // already return a single active occurrence per item.
  const startTimeUtc = occurrenceStartUtc
    ? new Date(occurrenceStartUtc)
    : rawDeal.start_time_utc
      ? new Date(rawDeal.start_time_utc)
      : undefined;

  const normalizedDeal: NormalizedActiveDeal = { dealId, locationId, title };
  if (subtitle) normalizedDeal.subtitle = subtitle;
  if (startTimeUtc) normalizedDeal.startTimeUtc = startTimeUtc;

  return normalizedDeal;
}

function normalizeActiveEvent(
  event: Event,
  occurrenceStartUtc?: string | Date
): NormalizedActiveEvent | null {
  const rawEvent = event as Event & {
    id?: string | number;
    location_id?: string | number;
    name?: string;
    description?: string;
    start_time_utc?: string | Date;
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

  // The caller resolves which occurrence (current or upcoming) this event
  // matched to; fall back to the top-level start_time_utc for endpoints that
  // already return a single active occurrence per item.
  const startTimeUtc = occurrenceStartUtc
    ? new Date(occurrenceStartUtc)
    : rawEvent.start_time_utc
      ? new Date(rawEvent.start_time_utc)
      : undefined;

  const normalizedEvent: NormalizedActiveEvent = { eventId, locationId, name };
  if (description) normalizedEvent.description = description;
  if (startTimeUtc) normalizedEvent.startTimeUtc = startTimeUtc;

  return normalizedEvent;
}

export function useTonightData() {
  const { deals, loading: dealsLoading, error: dealsError, refetch: refetchDeals } = useDeals();
  const { events, loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useEvents();
  const { bars, loading: barsLoading, error: barsError, refetch: refetchBars } = useAllBars();

  const loading = dealsLoading || eventsLoading || barsLoading;
  const error = dealsError || eventsError || barsError;

  // Re-fetches everything Tonight depends on. Pass showLoadingState=false
  // (e.g. on tab focus) to refresh quietly in the background without
  // flashing the full-screen skeleton; pull-to-refresh can still show its
  // own spinner independently of this.
  const refetch = useCallback(
    (showLoadingState = true) => {
      return Promise.all([
        refetchDeals(showLoadingState),
        refetchEvents(showLoadingState),
        refetchBars(showLoadingState),
      ]);
    },
    [refetchDeals, refetchEvents, refetchBars]
  );

  // "Open Now" needs deals/events that are actively happening right now.
  const currentDeals = useMemo(() => {
    const now = new Date();
    return deals
      .map((deal) => {
        const occurrences = (deal as Deal & { deal_occurrences?: Occurrence[] }).deal_occurrences;
        const occurrence = occurrences ? findCurrentOccurrence(occurrences, now) : undefined;
        return occurrence ? normalizeActiveDeal(deal, occurrence.start_time_utc) : null;
      })
      .filter((deal): deal is NormalizedActiveDeal => Boolean(deal));
  }, [deals]);

  const currentEvents = useMemo(() => {
    const now = new Date();
    return events
      .map((event) => {
        const occurrences = (event as Event & { event_occurrences?: Occurrence[] }).event_occurrences;
        const occurrence = occurrences ? findCurrentOccurrence(occurrences, now) : undefined;
        return occurrence ? normalizeActiveEvent(event, occurrence.start_time_utc) : null;
      })
      .filter((event): event is NormalizedActiveEvent => Boolean(event));
  }, [events]);

  // "Tonight" needs deals/events that haven't started yet but will, later today.
  const upcomingDeals = useMemo(() => {
    const now = new Date();
    const todayStr = getChicagoDateStr(now);
    return deals
      .map((deal) => {
        const occurrences = (deal as Deal & { deal_occurrences?: Occurrence[] }).deal_occurrences ?? [];
        const occurrence = findNextOccurrenceTonight(occurrences, now, todayStr);
        return occurrence ? normalizeActiveDeal(deal, occurrence.start_time_utc) : null;
      })
      .filter((deal): deal is NormalizedActiveDeal => Boolean(deal));
  }, [deals]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const todayStr = getChicagoDateStr(now);
    return events
      .map((event) => {
        const occurrences = (event as Event & { event_occurrences?: Occurrence[] }).event_occurrences ?? [];
        const occurrence = findNextOccurrenceTonight(occurrences, now, todayStr);
        return occurrence ? normalizeActiveEvent(event, occurrence.start_time_utc) : null;
      })
      .filter((event): event is NormalizedActiveEvent => Boolean(event));
  }, [events]);

  // Organize currently-active deals by locationId for quick lookup (Open Now cards)
  const dealsByLocation = useMemo(() => {
    const map = new Map<string, Deal[]>();
    currentDeals.forEach((deal) => {
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
  }, [currentDeals]);

  // Organize currently-active events by locationId for quick lookup (Open Now cards)
  const eventsByLocation = useMemo(() => {
    const map = new Map<string, Event[]>();
    currentEvents.forEach((event) => {
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
  }, [currentEvents]);

  // Combine location data with deals and events
  // Note: 'bars' now comes from useAllBars (every location), so a bar that
  // hasn't opened yet tonight still shows up if it has something scheduled.
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
        isOpen: isBarOpenNow(location),
        hasDeal: locationDeals.length > 0,
        image: location.logoUrl,
      } as TonightBarData;
    });
  }, [bars, dealsByLocation, eventsByLocation]);

  // Flatten all of tonight's upcoming deals (not yet started) from every bar
  const allActiveDealsTonight = useMemo(() => {
    return upcomingDeals
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
          isActiveNow: isBarOpenNow(bar),
        } as TonightDealData;
      })
      .filter((item): item is TonightDealData => Boolean(item));
  }, [bars, upcomingDeals]);

  // Build grouped bar view for "Deals Tonight" tab
  // Each bar gets one highlighted item (event preferred, then deal) and the rest collapsed
  const barGroupsTonight = useMemo((): BarGroupedTonight[] => {
    const now = new Date();

    // Helper: distance from now in ms (for sorting by proximity)
    const distFromNow = (d?: Date) =>
      d ? Math.abs(d.getTime() - now.getTime()) : Infinity;

    const groups: BarGroupedTonight[] = [];

    bars.forEach((location) => {
      const locationId = String(location.id);

      // Collect all upcoming (not-yet-started) events for this bar
      const barEvents: BarDealOrEvent[] = upcomingEvents
        .filter((e) => e.locationId === locationId)
        .map((e) => ({
          id: `event-${e.eventId}`,
          kind: 'event' as const,
          title: e.name,
          subtitle: e.description,
          startTimeUtc: e.startTimeUtc,
        }))
        .sort((a, b) => distFromNow(a.startTimeUtc) - distFromNow(b.startTimeUtc));

      // Collect all upcoming (not-yet-started) deals for this bar
      const barDeals: BarDealOrEvent[] = upcomingDeals
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
  }, [bars, upcomingEvents, upcomingDeals]);

  return {
    barsWithTonightData,
    allActiveDealsTonight,
    barGroupsTonight,
    loading,
    error,
    refetch,
  };
}

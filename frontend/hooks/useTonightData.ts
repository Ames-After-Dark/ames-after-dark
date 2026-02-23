import { useMemo } from "react";
import { useDeals } from "./useDeals";
import { useEvents } from "./useEvents";
import { useOpenBars } from "./useOpenBars";
import { Deal } from "@/services/dealsService";
import { Event } from "@/services/eventsService";
import { Location } from "./useOpenBars";

export interface TonightBarData {
  id: string;
  bar: string;
  event: string;
  specials: string;
  isOpen: boolean;
  hasDeal: boolean;
  image?: string;
  locationId: string;
}

export function useTonightData() {
  const { deals, loading: dealsLoading, error: dealsError } = useDeals();
  const { events, loading: eventsLoading, error: eventsError } = useEvents();
  const { bars, loading: barsLoading, error: barsError } = useOpenBars();

  const loading = dealsLoading || eventsLoading || barsLoading;
  const error = dealsError || eventsError || barsError;

  // Organize deals by locationId for quick lookup
  const dealsByLocation = useMemo(() => {
    const map = new Map<string, Deal[]>();
    deals.forEach((deal) => {
      if (!map.has(deal.locationId)) {
        map.set(deal.locationId, []);
      }
      map.get(deal.locationId)!.push(deal);
    });
    return map;
  }, [deals]);

  // Organize events by locationId for quick lookup
  const eventsByLocation = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach((event) => {
      if (!map.has(event.locationId)) {
        map.set(event.locationId, []);
      }
      map.get(event.locationId)!.push(event);
    });
    return map;
  }, [events]);

  // Combine location data with deals and events
  const barsWithTonightData = useMemo(() => {
    return bars.map((location: Location) => {
      const locationDeals = dealsByLocation.get(location.id) || [];
      const locationEvents = eventsByLocation.get(location.id) || [];

      return {
        id: location.id,
        locationId: location.id,
        bar: location.name,
        event: locationEvents[0]?.name ?? "",
        specials: locationDeals[0]?.title ?? "",
        isOpen: !!location.isOpen,
        hasDeal: locationDeals.length > 0,
        image: location.logoUrl,
      } as TonightBarData;
    });
  }, [bars, dealsByLocation, eventsByLocation]);

  return {
    barsWithTonightData,
    loading,
    error,
  };
}

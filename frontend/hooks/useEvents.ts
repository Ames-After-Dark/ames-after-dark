import { useCallback, useEffect, useState } from "react";
// TODO: Swap back to getActiveEvents when dedicated tonight API is ready
import { getEvents, Event } from "@/services/eventsService";

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) setLoading(true);
      // TODO: Replace getEvents() with getActiveEvents() (or getTonightEvents()) when API is ready
      const data = await getEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch events"));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}

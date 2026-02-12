import { useState, useEffect } from "react";
import { getActiveEvents, Event } from "@/services/eventsService";

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await getActiveEvents();
        setEvents(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch events"));
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, error };
}

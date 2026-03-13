import { useMemo } from "react";
import { getNow, isActive } from "@/utils/schedule";

type UpcomingWeekItem = {
  id: string;
  barId: string;
  bar: string;
  title: string;
  subtitle: string;
  kind: "Deal" | "Event";
  startsAt: Date;
  whenLabel: string;
};

type UpcomingWeekGroup = {
  key: string;
  label: string;
  items: UpcomingWeekItem[];
};

function formatUpcomingDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function useUpcomingSchedule(scheduledBars: any[], query: string) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = getNow();
    const windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const stepMs = 5 * 60 * 1000;

    const items: UpcomingWeekItem[] = [];

    const pushOneTimeItem = (
      base: Omit<UpcomingWeekItem, "startsAt" | "whenLabel">,
      start: string,
      end: string
    ) => {
      const startsAt = new Date(start);
      const endsAt = new Date(end);
      if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return;
      if (endsAt < now || startsAt > windowEnd) return;

      const isHappeningNow = startsAt <= now && endsAt >= now;
      const displayTime = isHappeningNow ? now : startsAt;

      items.push({
        ...base,
        id: `${base.id}-${displayTime.getTime()}`,
        startsAt: displayTime,
        whenLabel: isHappeningNow ? "Happening now" : formatUpcomingDateTime(startsAt),
      });
    };

    const pushWeeklyItems = (
      base: Omit<UpcomingWeekItem, "startsAt" | "whenLabel">,
      rule: any
    ) => {
      let wasActive = isActive(rule, now);

      if (wasActive) {
        items.push({
          ...base,
          id: `${base.id}-active-${now.getTime()}`,
          startsAt: now,
          whenLabel: "Happening now",
        });
      }

      for (let cursorMs = now.getTime() + stepMs; cursorMs <= windowEnd.getTime(); cursorMs += stepMs) {
        const cursor = new Date(cursorMs);
        const isCurrentlyActive = isActive(rule, cursor);

        if (!wasActive && isCurrentlyActive) {
          items.push({
            ...base,
            id: `${base.id}-${cursor.getTime()}`,
            startsAt: cursor,
            whenLabel: formatUpcomingDateTime(cursor),
          });
        }
        wasActive = isCurrentlyActive;
      }
    };

    scheduledBars.forEach((bar) => {
      const barId = String(bar.id);

      (bar.dealsScheduled ?? []).forEach((deal: any) => {
        const base = {
          id: `deal-${barId}-${deal.id}`,
          barId,
          bar: bar.name,
          title: deal.title,
          subtitle: deal.subtitle ?? "",
          kind: "Deal" as const,
        };
        deal.rule.kind === "one-time" 
          ? pushOneTimeItem(base, deal.rule.start, deal.rule.end) 
          : pushWeeklyItems(base, deal.rule);
      });

      (bar.eventsScheduled ?? []).forEach((event: any) => {
        const base = {
          id: `event-${barId}-${event.id}`,
          barId,
          bar: bar.name,
          title: event.name,
          subtitle: event.description && event.description !== event.name ? event.description : "",
          kind: "Event" as const,
        };
        event.rule.kind === "one-time" 
          ? pushOneTimeItem(base, event.rule.start, event.rule.end) 
          : pushWeeklyItems(base, event.rule);
      });
    });

    let upcomingItems = items.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

    if (q) {
      upcomingItems = upcomingItems.filter((item) =>
        [item.bar, item.title, item.subtitle, item.kind].join(" ").toLowerCase().includes(q)
      );
    }

    const labelFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
    const groupLabelFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" });
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const groupsMap = new Map<string, UpcomingWeekItem[]>();
    upcomingItems.forEach((item) => {
      const groupDate = new Date(item.startsAt);
      groupDate.setHours(0, 0, 0, 0);
      const key = `${groupDate.getFullYear()}-${groupDate.getMonth()}-${groupDate.getDate()}`;
      const existing = groupsMap.get(key) ?? [];
      existing.push(item);
      groupsMap.set(key, existing);
    });

    const groups: UpcomingWeekGroup[] = Array.from(groupsMap.entries()).map(([key, groupedItems]) => {
      const groupDate = new Date(groupedItems[0].startsAt);
      groupDate.setHours(0, 0, 0, 0);
      const dayDiff = Math.round((groupDate.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));

      let groupLabel = groupLabelFormatter.format(groupDate);
      if (dayDiff === 0) groupLabel = "Today";
      if (dayDiff === 1) groupLabel = "Tomorrow";

      return { key, label: groupLabel, items: groupedItems };
    });

    return {
      label: `Upcoming This Week • ${labelFormatter.format(now)} - ${labelFormatter.format(windowEnd)}`,
      items: upcomingItems,
      groups,
    };
  }, [query, scheduledBars]);
}
import type { TimeRule } from "@/types/types";

export const getNow = (): Date => new Date();

export function isActive(rule: TimeRule, now: Date): boolean {
  if (rule.kind === "one-time") {
    const start = new Date(rule.start);
    const end = new Date(rule.end);
    return now >= start && now <= end;
  }

  const tz = rule.tz;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((part) => [part.type, part.value])
  );

  const localY = Number(parts.year);
  const localM = Number(parts.month);
  const localD = Number(parts.day);
  const localH = Number(parts.hour);
  const localMin = Number(parts.minute);
  const localS = Number(parts.second);

  const inTz = new Date(localY, localM - 1, localD, localH, localMin, localS);

  const [sH, sM] = rule.startLocalTime.split(":").map(Number);
  const [eH, eM] = rule.endLocalTime.split(":").map(Number);

  const startLocal = new Date(inTz);
  startLocal.setHours(sH, sM, 0, 0);

  const endLocal = new Date(inTz);
  endLocal.setHours(eH, eM, 0, 0);

  const dayOfWeek = inTz.getDay();

  if (endLocal > startLocal) {
    if (!rule.daysOfWeek.includes(dayOfWeek)) return false;
    return inTz >= startLocal && inTz <= endLocal;
  }

  const startDay = startLocal.getDay();
  const nextDay = (startDay + 1) % 7;

  if (inTz >= startLocal) {
    return rule.daysOfWeek.includes(startDay);
  }

  if (inTz <= endLocal) {
    return rule.daysOfWeek.includes(nextDay);
  }

  return false;
}

export function isBarOpen(
  bar: { openingTime?: string; closingTime?: string; status?: "Open" | "Closed" },
  now: Date
): boolean {
  const openStr = bar.openingTime?.trim();
  const closeStr = bar.closingTime?.trim();
  if (!openStr || !closeStr) return bar.status === "Open";

  const parseTime = (timeStr: string) => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
    if (!match) return null;
    let [, h, m, ampm] = match;
    let hour = parseInt(h, 10);
    const minute = parseInt(m, 10);
    if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
    return { hour, minute };
  };

  const open = parseTime(openStr);
  const close = parseTime(closeStr);
  if (!open || !close) return bar.status === "Open";

  const openDate = new Date(now);
  openDate.setHours(open.hour, open.minute, 0, 0);

  const closeDate = new Date(now);
  closeDate.setHours(close.hour, close.minute, 0, 0);

  const nowM = now.getHours() * 60 + now.getMinutes();
  const openM = open.hour * 60 + open.minute;
  const closeM = close.hour * 60 + close.minute;

  if (closeM <= openM) {
    if (nowM < closeM) {
      openDate.setDate(openDate.getDate() - 1);
    } else {
      closeDate.setDate(closeDate.getDate() + 1);
    }
  }

  return now >= openDate && now < closeDate;
}
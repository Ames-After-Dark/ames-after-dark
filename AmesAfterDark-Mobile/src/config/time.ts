import { TimeRule } from "@/src/data/mock";

export const USE_FAKE_TIME = true;
//export const FAKE_TIME = "2025-10-28T16:30:00-05:00"; // Tuesday 7:30 PM
//export const FAKE_TIME = "2025-10-28T21:30:00-05:00"; // Tuesday 9:30 PM
//export const FAKE_TIME = "2025-10-25T12:30:00-05:00"; // Saturday 12:30 PM
//export const FAKE_TIME = "2025-10-25T19:30:00-05:00"; // Saturday 7:30 PM
export const FAKE_TIME = "2025-10-25T21:30:00-05:00"; // Saturday 9:30 PM
//export const FAKE_TIME = "2025-10-25T01:30:00-05:00"; // Saturday 1:30 AM
//export const FAKE_TIME = "2025-10-25T02:30:00-05:00"; // Saturday 2:30 AM
//export const FAKE_TIME = "2025-10-25T04:30:00-05:00"; // Saturday 4:30 AM


// ---------- Shared helpers ----------
export const getNow = (): Date =>
  USE_FAKE_TIME ? new Date(FAKE_TIME) : new Date();

/**
 * Checks whether a scheduled rule (deal/event) is active at `now`
 */
// /src/config/time.ts (or wherever isActive lives)
export function isActive(rule: TimeRule, now: Date): boolean {
  if (rule.kind === "one-time") {
    const start = new Date(rule.start);
    const end = new Date(rule.end);
    return now >= start && now <= end;
  }

  // weekly rule: evaluate "now" in the provided timezone
  const tz = rule.tz;

  // Convert `now` to the target timezone by formatting parts then rebuilding a Date in that tz's clock
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(fmt.formatToParts(now).map(p => [p.type, p.value]));
  // parts: { year, month, day, hour, minute, second }
  const localY = Number(parts.year);
  const localM = Number(parts.month);
  const localD = Number(parts.day);
  const localH = Number(parts.hour);
  const localMin = Number(parts.minute);
  const localS = Number(parts.second);

  // Day-of-week in the target tz
  const dowFmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" });
  // To get getDay() in that tz: make a Date representing midnight in tz and read UTC day via trick:
  const localNowStr = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  const localNow = new Date(localNowStr); // interpreted as local device tz, but we only use its clock values below

  // Map weekly days using JS convention: 0=Sun..6=Sat
  // We already have the date parts in the target tz; create a Date object in *that* clock:
  const inTz = new Date(localY, localM - 1, localD, localH, localMin, localS);

  const dayOfWeek = inTz.getDay();
  if (!rule.daysOfWeek.includes(dayOfWeek)) return false;

  const [sH, sM] = rule.startLocalTime.split(":").map(Number);
  const [eH, eM] = rule.endLocalTime.split(":").map(Number);

  const startLocal = new Date(inTz);
  startLocal.setHours(sH, sM, 0, 0);

  const endLocal = new Date(inTz);
  endLocal.setHours(eH, eM, 0, 0);

  return inTz >= startLocal && inTz <= endLocal;
}


/**
 * Determines whether a bar is currently open based on explicit opening/closing times.
 */
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

  // Cross-midnight window (e.g., 16:00 → 02:00)
  if (closeM <= openM) {
    // If we're after midnight but before close, the "open" was yesterday
    if (nowM < closeM) {
      openDate.setDate(openDate.getDate() - 1);
    } else {
      // If we're after open on the same calendar day, push close to tomorrow
      closeDate.setDate(closeDate.getDate() + 1);
    }
  }

  return now >= openDate && now < closeDate;
}


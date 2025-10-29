export const USE_FAKE_TIME = true;
export const FAKE_TIME = "2025-10-28T19:30:00-05:00"; // 7:30 PM
//export const FAKE_TIME = "2025-10-28T21:30:00-05:00"; // 9:30 PM
//export const FAKE_TIME = "2025-10-29T02:30:00-05:00"; // 2:30 AM


// ---------- Shared helpers ----------
export const getNow = (): Date =>
  USE_FAKE_TIME ? new Date(FAKE_TIME) : new Date();

/**
 * Checks whether a scheduled rule (deal/event) is active at `now`
 */
export function isActive(rule: any, now: Date): boolean {
  if (!rule) return false;
  if (rule.kind === "one-time") {
    const start = new Date(rule.start);
    const end = new Date(rule.end);
    return now >= start && now <= end;
  }
  if (rule.kind === "weekly") {
    const day = now.getDay();
    if (!rule.daysOfWeek.includes(day)) return false;
    const [sh, sm] = rule.startLocalTime.split(":").map(Number);
    const [eh, em] = rule.endLocalTime.split(":").map(Number);
    const local = new Date(now.toLocaleString("en-US", { timeZone: rule.tz }));
    const minutes = local.getHours() * 60 + local.getMinutes();
    return minutes >= sh * 60 + sm && minutes <= eh * 60 + em;
  }
  return false;
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

  // If either time is missing, fall back to static status
  if (!openStr || !closeStr) return bar.status === "Open";

  // Parse "4:00 PM" etc.
  const parseTime = (timeStr: string) => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
    if (!match) return null;
    let [_, h, m, ampm] = match;
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

  // Handle bars that close after midnight (e.g., 2:00 AM)
  if (close.hour < open.hour) closeDate.setDate(closeDate.getDate() + 1);

  return now >= openDate && now < closeDate;
}

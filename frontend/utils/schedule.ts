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

export function getBarStatus(data: any) {
  if (!data || !data.location_hours) return { isOpen: false, closingTime: null };

  const tz = data.timezone || "America/Chicago";
  const now = new Date();

  // 1. Get all the parts we need from Intl
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value;

  const currentHour = parseInt(getPart("hour") || "0", 10);
  const currentMin = parseInt(getPart("minute") || "0", 10);
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;

  // 2. GET DAY ID WITHOUT NaN
  // We use a specific weekday formatter that returns the day name, then map it.
  const dayName = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(now);

  const days: Record<string, number> = {
    "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3,
    "Thursday": 4, "Friday": 5, "Saturday": 6
  };

  let dayToLookup = days[dayName];

  console.log(`--- DEBUG ---`);
  console.log(`Timezone: ${tz}`);
  console.log(`Day Name: ${dayName} | Day ID: ${dayToLookup}`);
  console.log(`Bar Local Time: ${currentTimeStr}`);

  // 3. Late Night Logic
  if (currentHour < 5) {
    dayToLookup = dayToLookup === 0 ? 6 : dayToLookup - 1;
    console.log(`Late night adjustment: Day ID is now ${dayToLookup}`);
  }

  // 4. Match with DB
  // CRITICAL: Check if your DB uses 0-6 or 1-7. 
  // If your DB uses 1 for Sunday, change this to: Number(h.weekday_id) === (dayToLookup + 1)
  const today = data.location_hours.find((h: any) => Number(h.weekday_id) === dayToLookup);

  if (!today) {
    console.log(`Result: CLOSED (No hours found for Day ID ${dayToLookup})`);
    return { isOpen: false, closingTime: null };
  }

  const { open_time, close_time } = today;
  let isOpen = false;

  if (close_time < open_time) {
    isOpen = currentTimeStr >= open_time || currentTimeStr <= close_time;
  } else {
    isOpen = currentTimeStr >= open_time && currentTimeStr <= close_time;
  }

  console.log(`DB Range: ${open_time}-${close_time} | Final Result: ${isOpen}`);

  return {
    isOpen,
    closingTime: isOpen ? formatTime(close_time) : null
  };
}

export const formatTime = (time: string | undefined | null) => {

  if (!time) return "N/A";

  try {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (e) {
    return time;
  }
};
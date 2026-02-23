// types/bar.ts

// ---------- Core Ids ----------
export type BarId = string;

// ---------- Scheduling ----------
export type TimeRule =
  | {
      kind: "one-time";
      start: string; // ISO datetime
      end: string;   // ISO datetime
      tz: string;    // e.g., "America/Chicago"
    }
  | {
      kind: "weekly";
      tz: string;            // e.g., "America/Chicago"
      daysOfWeek: number[];  // 0 (Sun) ... 6 (Sat)
      startLocalTime: string; // "HH:mm"
      endLocalTime: string;   // "HH:mm"
    };

export type ScheduledDeal = {
  id: string;
  barId: BarId;
  title: string;
  subtitle?: string;
  image?: any;
  priority?: number;
  rule: TimeRule;
};

export type ScheduledEvent = {
  id: string;
  barId: BarId;
  name: string;
  description?: string;
  image?: any;
  priority?: number;
  rule: TimeRule;
};

// ---------- Menu ----------
export type Money = `${number}${"" | "."}${number}${"" | "0" | "00"}`;

export type MenuItem = {
  id: string;
  name: string;
  price?: Money | string; // allows "Mkt", "$2 Wells (7–9)", etc.
  desc?: string;
  tag?: "signature" | "draft" | "bottle" | "shot" | "well" | "food" | "nonalcoholic";
};

export type MenuSection = {
  id: string;
  title: string;   // e.g., "Signature Cocktails"
  items: MenuItem[];
};

export type BarMenu = {
  updatedAt?: string;       // e.g., "2025-10-15"
  sections: MenuSection[];
};

// ---------- Bar ----------
export type Bar = {
  id: BarId;
  name: string;
  description: string;

  favorite?: boolean;
  open?: boolean;            // from backend (whether bar is open today)
  openingTime?: string;     // display string (e.g., "4:00 PM")
  closingTime?: string;     // display string (e.g., "2:00 AM")
  status?: "Open" | "Closed";
  visits?: number;
  friends?: number;
  favorites?: number;

  dealsScheduled?: ScheduledDeal[];
  eventsScheduled?: ScheduledEvent[];

  location_type_id: number; // 1=Bar, 2=Restaurant, etc.

  // Local mock image assets
  logo?: any;
  cover?: any;
  mapImage?: any;
  galleryImage?: any;

  // Future backend URLs
  logoUrl?: string;
  coverUrl?: string;
  mapImageUrl?: string;
  galleryImageUrl?: string;

  // Menu (optional per bar)
  menu?: BarMenu;

  // Derived (client-only)
  __openNow?: boolean;
};

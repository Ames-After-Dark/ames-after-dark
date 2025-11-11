export type BarId = string;

export type ScheduleRule =
  | {
      kind: "weekly";
      tz: string;  // Keep flexible (not hard-coded "America/Chicago")
      daysOfWeek: number[];
      startLocalTime: string;
      endLocalTime: string;
    }
  | {
      kind: "one-time";
      start: string;
      end: string;
      tz: string; // ✅ add this line
    };

export type ScheduledDeal  = { title: string; subtitle?: string; rule: ScheduleRule };
export type ScheduledEvent = { name: string; rule: ScheduleRule };

// types/bar.ts
export type Money = `${number}${"" | "."}${number}${"" | "0" | "00"}`;

export type MenuItem = {
  id: string;
  name: string;
  price?: Money | string;   // keep flexible for things like "Mkt" or "$2 Wells (7–9)"
  desc?: string;
  tag?: "signature" | "draft" | "bottle" | "shot" | "well" | "food" | "nonalcoholic";
};

export type MenuSection = {
  id: string;
  title: string;            // e.g., "Signature Cocktails"
  items: MenuItem[];
};

export type BarMenu = {
  updatedAt?: string;
  sections: MenuSection[];
};

export type Bar = {
  id: BarId;
  name: string;
  description: string;
  favorite?: boolean;
  openingTime?: string;
  closingTime?: string;
  status?: "Open" | "Closed";
  visits?: number;
  friends?: number;
  favorites?: number;

  dealsScheduled?: ScheduledDeal[];
  eventsScheduled?: ScheduledEvent[];

  //allow BOTH mock requires and future URLs
  // mock (local require assets)
  logo?: any;
  cover?: any;
  mapImage?: any;
  galleryImage?: any;

  // backend (URLs)
  logoUrl?: string;
  coverUrl?: string;
  mapImageUrl?: string;
  menu?: BarMenu;  
  galleryImageUrl?: string;

  // derived (client)
  __openNow?: boolean;
};

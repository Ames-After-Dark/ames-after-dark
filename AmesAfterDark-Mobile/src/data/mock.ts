// AmesAfterDark-Mobile/data/mock.ts
// Updated mock data with scheduled deals/events support (hour-based)
import {IMG} from "../assets"
// ---------- Types ----------
export type BarId = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

export type ISODateTime = string;

export type TimeRule =
  | {
      kind: "one-time";
      start: ISODateTime;
      end: ISODateTime;
      tz: string;
    }
  | {
      kind: "weekly";
      tz: string;
      daysOfWeek: number[];
      startLocalTime: string;
      endLocalTime: string;
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

export type BarBase = {
  id: BarId;
  name: string;
  description: string;
  favorite?: boolean;
  openingTime?: string;   // e.g., "4:00 PM"
  closingTime?: string;   // e.g., "2:00 AM"
  status?: "Open" | "Closed"; // optional manual override
  visits?: number;
  friends?: number;
  favorites?: number;
  dealsScheduled?: ScheduledDeal[];
  eventsScheduled?: ScheduledEvent[];
  logo: any;
  cover: any;
  galleryImage: any;
  mapImage: any;
};

// ---------- Placeholder Assets ----------
const LOGO = IMG.LOGO
const COVER = LOGO;
const GALLERY = LOGO;
const MAP = LOGO;

const CHICAGO_TZ = "America/Chicago";

// ---------- Mock Time-Aware Data ----------
export const BARS_BASE: BarBase[] = [
  {
    id: "1",
    name: "Cy's Roost",
    description: "Lively college bar with DJs and dance floor.",
    favorite: true,
    openingTime: "4:00 PM",
    closingTime: "2:00 AM",
    visits: 120,
    friends: 6,
    favorites: 52,
    dealsScheduled: [
      {
        id: "deal1",
        barId: "1",
        title: "$2 Wells",
        subtitle: "Until 11PM",
        priority: 90,
        rule: {
          kind: "weekly",
          tz: CHICAGO_TZ,
          daysOfWeek: [3, 4, 5, 6],
          startLocalTime: "18:00",
          endLocalTime: "23:00",
        },
      },
    ],
    eventsScheduled: [
      {
        id: "event1",
        barId: "1",
        name: "DJ Night",
        description: "High-energy club set",
        priority: 80,
        rule: {
          kind: "one-time",
          tz: CHICAGO_TZ,
          start: "2025-10-28T21:00:00-05:00",
          end: "2025-10-28T23:59:00-05:00",
        },
      },
    ],
    logo: LOGO,
    cover: COVER,
    galleryImage: GALLERY,
    mapImage: MAP,
  },
  {
    id: "2",
    name: "Sips",
    description: "Cocktail lounge and nightclub.",
    favorite: false,
    openingTime: "6:00 PM",
    closingTime: "3:00 AM",
    visits: 90,
    friends: 2,
    favorites: 38,
    dealsScheduled: [
      {
        id: "deal2",
        barId: "2",
        title: "Half-Price Cherry Bombs",
        subtitle: "7–9PM",
        rule: {
          kind: "weekly",
          tz: CHICAGO_TZ,
          daysOfWeek: [5, 6],
          startLocalTime: "17:00",
          endLocalTime: "21:00",
        },
      },
    ],
    eventsScheduled: [
      {
        id: "event2",
        barId: "2",
        name: "Ladies Night",
        description: "No cover before 10PM",
        rule: {
          kind: "weekly",
          tz: CHICAGO_TZ,
          daysOfWeek: [6],
          startLocalTime: "21:00",
          endLocalTime: "23:59",
        },
      },
    ],
    logo: LOGO,
    cover: COVER,
    galleryImage: GALLERY,
    mapImage: MAP,
  },
  {
    id: "3",
    name: "Outlaws",
    description: "Live band and country bar.",
    favorite: false,
    openingTime: "5:00 PM",
    closingTime: "2:00 AM",
    visits: 200,
    friends: 5,
    favorites: 75,
    dealsScheduled: [
      {
        id: "deal3",
        barId: "3",
        title: "No Cover Before 10PM",
        rule: {
          kind: "one-time",
          tz: CHICAGO_TZ,
          start: "2025-10-28T18:00:00-05:00",
          end: "2025-10-28T22:00:00-05:00",
        },
      },
    ],
    eventsScheduled: [
      {
        id: "event3",
        barId: "3",
        name: "Live Band Tonight",
        rule: {
          kind: "one-time",
          tz: CHICAGO_TZ,
          start: "2025-10-28T20:00:00-05:00",
          end: "2025-10-28T23:59:00-05:00",
        },
      },
    ],
    logo: LOGO,
    cover: COVER,
    galleryImage: GALLERY,
    mapImage: MAP,
  },
];

// ---------- Derived Views (still used by app) ----------
export const BARS_LIST = BARS_BASE.map((b) => ({
  id: b.id,
  name: b.name,
  specials:
    b.dealsScheduled?.[0]?.title ??
    b.eventsScheduled?.[0]?.name ??
    "",
  status: b.status,
  closingTime: b.closingTime ?? "",
  favorite: !!b.favorite,
  image: b.logo,
}));

export const TONIGHT_ITEMS = BARS_BASE.map((b) => ({
  id: b.id,
  bar: b.name,
  event: b.eventsScheduled?.[0]?.name ?? "",
  specials: b.dealsScheduled?.[0]?.title ?? "",
  isOpen: b.status === "Open",
  hasDeal: (b.dealsScheduled?.length ?? 0) > 0,
}));

export const BAR_DETAILS_BY_ID = Object.fromEntries(
  BARS_BASE.map((b) => [
    b.id,
    {
      id: b.id,
      name: b.name,
      description: b.description,
      favorite: !!b.favorite,
      visits: b.visits ?? 0,
      friends: b.friends ?? 0,
      favorites: b.favorites ?? 0,
      dealsScheduled: b.dealsScheduled,
      eventsScheduled: b.eventsScheduled,
      cover: b.cover,
      image: b.logo,
      mapLocation: b.mapImage,
      galleryImage: b.galleryImage,
    },
  ])
) as Record<BarId, any>;

// ---------- Friends ----------
export type FriendItem = { id: string; name: string; bar: string; avatar: any };
export const FRIENDS: FriendItem[] = [
  { id: "f1", name: "Chase Anderson", bar: "Outlaws", avatar: LOGO },
  { id: "f2", name: "Jaya Davis", bar: "Paddy's Irish Pub", avatar: LOGO },
  { id: "f3", name: "Nathan Couture", bar: "Welch Ave Station", avatar: LOGO },
  { id: "f4", name: "Nathan Krieger", bar: "BNC Fieldhouse", avatar: LOGO },
  { id: "f5", name: "Analyn Seeman", bar: "Cy's Roost", avatar: LOGO },
  { id: "f6", name: "Maggie Sullivan", bar: "Paddy's Irish Pub", avatar: LOGO },
  { id: "f7", name: "Geni William", bar: "Outlaws", avatar: LOGO },
];

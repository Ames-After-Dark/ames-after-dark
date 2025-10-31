// AmesAfterDark-Mobile/data/mock.ts
// Updated mock data with scheduled deals/events support (hour-based)
import {IMG} from "../assets"
// ---------- Types ----------
export type BarId = 
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10";;

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
const PinkIcon = IMG.PinkIcon;
const BlueIcon = IMG.BlueIcon;
const YellowIcon = IMG.YellowIcon;

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
  {
  id: "4",
  name: "AJ’s Ultra Lounge",
  description: "Trendy nightclub on Welch Ave known for its LED dance floor and DJ sets.",
  favorite: true,
  openingTime: "8:00 PM",
  closingTime: "2:00 AM",
  visits: 320,
  friends: 9,
  favorites: 120,
  dealsScheduled: [
    {
      id: "deal4",
      barId: "4",
      title: "$3 Bombs",
      subtitle: "Fridays & Saturdays until 11PM",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [5, 6],
        startLocalTime: "20:00",
        endLocalTime: "23:00",
      },
    },
  ],
  eventsScheduled: [
    {
      id: "event4",
      barId: "4",
      name: "Ultra Fridays",
      description: "Resident DJs spinning hip-hop and EDM all night long.",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [5],
        startLocalTime: "22:00",
        endLocalTime: "02:00",
      },
    },
  ],
  logo: LOGO,
  cover: COVER,
  galleryImage: GALLERY,
  mapImage: MAP,
},
{
  id: "5",
  name: "Paddy’s Irish Pub",
  description: "Classic Irish pub with pool tables, cheap drinks, and trivia nights.",
  favorite: false,
  openingTime: "3:00 PM",
  closingTime: "3:00 AM",
  visits: 210,
  friends: 6,
  favorites: 84,
  dealsScheduled: [
    {
      id: "deal5",
      barId: "5",
      title: "$3 Bomb Shots",
      subtitle: "Trivia Shots 8–10PM",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [2],
        startLocalTime: "20:00",
        endLocalTime: "22:00",
      },
    },
  ],
  eventsScheduled: [
    {
      id: "event5",
      barId: "5",
      name: "Trivia Tuesday",
      description: "Bring your friends for team trivia and prizes!",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [2],
        startLocalTime: "19:00",
        endLocalTime: "22:00",
      },
    },
  ],
  logo: LOGO,
  cover: COVER,
  galleryImage: GALLERY,
  mapImage: MAP,
},
{
  id: "6",
  name: "Blue Owl Bar",
  description: "Cocktail and whiskey bar above Pizza Pit with a chill vibe and great music.",
  favorite: true,
  openingTime: "5:00 PM",
  closingTime: "2:00 AM",
  visits: 180,
  friends: 4,
  favorites: 99,
  dealsScheduled: [
    {
      id: "deal6",
      barId: "6",
      title: "$4 Old Fashioneds",
      subtitle: "Wednesdays 7–10PM",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [3],
        startLocalTime: "19:00",
        endLocalTime: "22:00",
      },
    },
  ],
  eventsScheduled: [
    {
      id: "event6",
      barId: "6",
      name: "Live Acoustic Thursdays",
      description: "Local artists and chill vibes on the upper level.",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [4],
        startLocalTime: "20:00",
        endLocalTime: "23:30",
      },
    },
  ],
  logo: LOGO,
  cover: COVER,
  galleryImage: GALLERY,
  mapImage: MAP,
},
{
  id: "7",
  name: "Mickey’s Irish Pub",
  description: "Welch Avenue staple with outdoor patio and live music.",
  favorite: false,
  openingTime: "4:00 PM",
  closingTime: "2:00 AM",
  visits: 165,
  friends: 5,
  favorites: 70,
  dealsScheduled: [
    {
      id: "deal7",
      barId: "7",
      title: "Half-Price Apps & $3 Pints",
      subtitle: "Daily 4–7PM",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [1, 2, 3, 4, 5],
        startLocalTime: "16:00",
        endLocalTime: "19:00",
      },
    },
  ],
  eventsScheduled: [
    {
      id: "event7",
      barId: "7",
      name: "Live Music Fridays",
      description: "Acoustic and indie artists on the back stage.",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [5],
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
  id: "8",
  name: "Mother’s Pub",
  description: "Classic dive bar with pool tables, darts, and cheap beer pitchers.",
  favorite: false,
  openingTime: "2:00 PM",
  closingTime: "2:00 AM",
  visits: 195,
  friends: 6,
  favorites: 77,
  dealsScheduled: [
    {
      id: "deal8",
      barId: "8",
      title: "$5 Pitchers",
      subtitle: "Every Monday 5–9PM",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [6],
        startLocalTime: "17:00",
        endLocalTime: "21:00",
      },
    },
  ],
  eventsScheduled: [
    {
      id: "event8",
      barId: "8",
      name: "Open Mic Night",
      description: "Grab a drink and take the stage every Wednesday!",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [3],
        startLocalTime: "20:00",
        endLocalTime: "23:00",
      },
    },
  ],
  logo: LOGO,
  cover: COVER,
  galleryImage: GALLERY,
  mapImage: MAP,
},
{
  id: "9",
  name: "Thumbs",
  description: "Laid-back Welch bar with signature drinks and darts in the back.",
  favorite: false,
  openingTime: "4:00 PM",
  closingTime: "2:00 AM",
  visits: 140,
  friends: 3,
  favorites: 58,
  dealsScheduled: [
    {
      id: "deal9",
      barId: "9",
      title: "$2 Busch Lights & $4 Wells",
      subtitle: "Thursday Power Hour 7–10PM",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [6],
        startLocalTime: "19:00",
        endLocalTime: "22:00",
      },
    },
  ],
  eventsScheduled: [
    {
      id: "event9",
      barId: "9",
      name: "DJ Saturdays",
      description: "Dance floor and drink specials every weekend.",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [6],
        startLocalTime: "21:00",
        endLocalTime: "02:00",
      },
    },
  ],
  logo: LOGO,
  cover: COVER,
  galleryImage: GALLERY,
  mapImage: MAP,
},
{
  id: "10",
  name: "Welch Ave Station",
  description: "Neighborhood bar with pool tables, darts, and strong drinks.",
  favorite: true,
  openingTime: "3:00 PM",
  closingTime: "2:00 AM",
  visits: 280,
  friends: 8,
  favorites: 95,
  dealsScheduled: [
    {
      id: "deal10",
      barId: "10",
      title: "$2 Wells & $2.50 Tallboys",
      subtitle: "Happy Hour 3–7PM",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [3, 4, 5],
        startLocalTime: "15:00",
        endLocalTime: "19:00",
      },
    },
  ],
  eventsScheduled: [
    {
      id: "event10",
      barId: "10",
      name: "Karaoke Thursdays",
      description: "Ames favorite karaoke night with rotating drink specials!",
      rule: {
        kind: "weekly",
        tz: CHICAGO_TZ,
        daysOfWeek: [4],
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
  { id: "f1", name: "Chase Anderson", bar: "Outlaws", avatar: PinkIcon },
  { id: "f2", name: "Jaya Davis", bar: "Paddy's Irish Pub", avatar: BlueIcon },
  { id: "f3", name: "Nathan Couture", bar: "Welch Ave Station", avatar: YellowIcon },
  { id: "f4", name: "Nathan Krieger", bar: "BNC Fieldhouse", avatar: PinkIcon },
  { id: "f5", name: "Analyn Seeman", bar: "Cy's Roost", avatar: BlueIcon },
  { id: "f6", name: "Maggie Sullivan", bar: "Paddy's Irish Pub", avatar: YellowIcon },
  { id: "f7", name: "Geni William", bar: "Outlaws", avatar: PinkIcon },
];

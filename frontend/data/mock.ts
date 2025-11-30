// AmesAfterDark-Mobile/data/mock.ts
// Updated mock data with scheduled deals/events support (hour-based)
import {IMG} from "@/assets/assets"
import type { Bar } from "@/types/bars";
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
// ---------- Tonight hero deal posters ----------

export type TonightPoster = {
  id: string;
  barId?: BarId;      // optional; lets you link poster → bar later
  title: string;      // short label if you ever want to use it
  subtitle?: string;  // optional extra line
  image: any;         // static require from IMG
};

export const TONIGHT_POSTERS: TonightPoster[] = [
  {
    id: "outlaws-tuesday",
    barId: "3", // Outlaws
    title: "Outlaws Live Band",
    subtitle: "No cover before 10PM",
    image: IMG.DealOutlawsTuesday,
  },
  {
    id: "blue-owl-pool-tuesday",
    barId: "6", // Blue Owl
    title: "Blue Owl Pool Tournament",
    subtitle: "Tuesday night",
    image: IMG.DealBlueOwlPoolTuesday,
  },
  {
    id: "paddys-disney-trivia",
    barId: "5", // Paddy's
    title: "Paddy’s Disney Trivia",
    subtitle: "Trivia Tuesday",
    image: IMG.DealPaddysDisneyTrivia,
  },
  {
    id: "cys-cherry-bombs",
    barId: "1", // Cy's
    title: "$3 Cherry Bombs",
    subtitle: "Tonight at Cy’s",
    image: IMG.DealCysCherryBombs,
  },
];


// ---------- Placeholder Assets ----------
const LOGO = IMG.LOGO
const COVER = IMG.BaseCover;
const GALLERY = LOGO;
const MAP = IMG.fakeMap;
const PinkIcon = IMG.PinkIcon;
const BlueIcon = IMG.BlueIcon;
const YellowIcon = IMG.YellowIcon;
const cy = IMG.CysRoost;
const aj = IMG.AJs;
const Blue = IMG.BlueOwl;
const bnc = IMG.bnc;
const mickeys = IMG.Mickey;
const outlaws = IMG.Outlaws;
const paddys = IMG.Paddys;
const sips = IMG.Sips;
const welchAve = IMG.Welch;

const CHICAGO_TZ = "America/Chicago";

// ---------- Mock Time-Aware Data ----------
export const BARS_BASE: Bar[] = [
  {
    id: "1",
    name: "Cy's",
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
    logo: cy,
    cover: IMG.CysCover2,
    galleryImage: GALLERY,
    mapImage: MAP,
    menu: {
      updatedAt: "2025-10-15",
      sections: [
        {
          id: "cys-sig",
          title: "Signature Cocktails",
          items: [
            { id: "cys-sig-1", name: "Cy Cyclone", price: "$8.00", desc: "Vodka, lime, blue curaçao, lemon-lime soda." , tag: "signature"},
            { id: "cys-sig-2", name: "Welch Wave", price: "$9.00", desc: "Rum, pineapple, coconut, grenadine.", tag: "signature" },
          ],
        },
        {
          id: "cys-wells",
          title: "Wells & Bombs",
          items: [
            { id: "cys-w-1", name: "$2 Wells (Happy Hour)", price: "$2.00", desc: "Until 11PM when active.", tag: "well" },
            { id: "cys-b-1", name: "Cherry Bomb", price: "$4.00", tag: "shot" },
          ],
        },
        {
          id: "cys-draft",
          title: "Drafts",
          items: [
            { id: "cys-d-1", name: "Busch Light Pint", price: "$3.00", tag: "draft" },
            { id: "cys-d-2", name: "Local Rotator", price: "$5.50", tag: "draft" },
          ],
        },
      ],
    }

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
    logo: sips,
    cover: IMG.SipsPaddysCover2,
    galleryImage: GALLERY,
    mapImage: MAP,
    menu: {
      updatedAt: "2025-10-12",
      sections: [
        {
          id: "sips-sig",
          title: "Signature Cocktails",
          items: [
            { id: "sips-s1", name: "Velvet Espresso Martini", price: "$10.00", desc: "Vodka, espresso, coffee liqueur.", tag: "signature" },
            { id: "sips-s2", name: "Pink Lemonade Spritz", price: "$9.00", tag: "signature" },
          ],
        },
        {
          id: "sips-bombs",
          title: "Bombs",
          items: [
            { id: "sips-b1", name: "Cherry Bomb", price: "Half-Price 7–9PM", desc: "Deal nights only.", tag: "shot" },
            { id: "sips-b2", name: "Vegas Bomb", price: "$6.00", tag: "shot" },
          ],
        },
        {
          id: "sips-wine",
          title: "Wine & Bubbles",
          items: [
            { id: "sips-w1", name: "Prosecco Split", price: "$8.00" },
            { id: "sips-w2", name: "House Red/White", price: "$7.00" },
          ],
        },
      ],
    }

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
    logo: outlaws,
    cover: IMG.OutlawsCover,
    galleryImage: GALLERY,
    mapImage: MAP,
    menu: {
      updatedAt: "2025-10-10",
      sections: [
        {
          id: "owl-whiskey",
          title: "Whiskey & Bourbon",
          items: [
            { id: "owl-w1", name: "Jack Daniel’s", price: "$6.00" },
            { id: "owl-w2", name: "Buffalo Trace", price: "$8.00" },
          ],
        },
        {
          id: "owl-signature",
          title: "Signature (Country)",
          items: [
            { id: "owl-s1", name: "Outlaw Old Fashioned", price: "$9.00", tag: "signature" },
            { id: "owl-s2", name: "Boot Scoot Mule", price: "$8.00", desc: "Whiskey, ginger beer, lime." },
          ],
        },
        {
          id: "owl-beer",
          title: "Beer",
          items: [
            { id: "owl-b1", name: "Domestic Pint", price: "$3.50", tag: "draft" },
            { id: "owl-b2", name: "Import Bottle", price: "$4.50", tag: "bottle" },
          ],
        },
      ],
    }

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
  logo: aj,
  cover: COVER,
  galleryImage: GALLERY,
  mapImage: MAP,
  menu: {
      updatedAt: "2025-10-20",
      sections: [
        {
          id: "aj-ultra",
          title: "Ultralight Signatures",
          items: [
            { id: "aj-u1", name: "Neon Berry Fizz", price: "$10.00", tag: "signature" },
            { id: "aj-u2", name: "LED Lemon Drop", price: "$9.00", tag: "signature" },
          ],
        },
        {
          id: "aj-bombs",
          title: "Bombs",
          items: [
            { id: "aj-b1", name: "$3 Bombs (until 11PM Fri/Sat)", price: "$3.00", tag: "shot" },
            { id: "aj-b2", name: "Jäger Bomb", price: "$5.00", tag: "shot" },
          ],
        },
        {
          id: "aj-draft",
          title: "Draft & Seltzer",
          items: [
            { id: "aj-d1", name: "Domestic Pint", price: "$3.50", tag: "draft" },
            { id: "aj-d2", name: "Hard Seltzer", price: "$4.50" },
          ],
        },
      ],
    }

  },
  {
    id: "5",
    name: "Paddy's",
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
    logo: paddys,
    cover: IMG.SipsPaddysCover2,
    galleryImage: GALLERY,
    mapImage: MAP,
      menu: {
      updatedAt: "2025-10-05",
      sections: [
        {
          id: "pad-pub",
          title: "Pub Staples",
          items: [
            { id: "pad-p1", name: "Guinness Draught", price: "$6.00", tag: "draft" },
            { id: "pad-p2", name: "Smithwick’s", price: "$6.00", tag: "draft" },
          ],
        },
        {
          id: "pad-bombs",
          title: "Bombs & Shots",
          items: [
            { id: "pad-b1", name: "$3 Bomb Shots (Trivia)", price: "$3.00", tag: "shot" },
            { id: "pad-b2", name: "Irish Slammer", price: "$6.00", tag: "shot" },
          ],
        },
        {
          id: "pad-food",
          title: "Bar Bites",
          items: [
            { id: "pad-f1", name: "Soft Pretzel", price: "$5.00", tag: "food" },
            { id: "pad-f2", name: "Fries", price: "$4.00", tag: "food" },
          ],
        },
      ],
    }

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
    logo: Blue,
    cover: COVER,
    galleryImage: GALLERY,
    mapImage: MAP,
    menu: {
      updatedAt: "2025-10-08",
      sections: [
        {
          id: "bowl-classics",
          title: "Classics",
          items: [
            { id: "bowl-c1", name: "Old Fashioned", price: "$8.00" },
            { id: "bowl-c2", name: "Manhattan", price: "$9.00" },
          ],
        },
        {
          id: "bowl-signature",
          title: "Signatures",
          items: [
            { id: "bowl-s1", name: "Blue Owl", price: "$10.00", desc: "Gin, elderflower, lemon.", tag: "signature" },
            { id: "bowl-s2", name: "Upper Room Sour", price: "$9.00", tag: "signature" },
          ],
        },
        {
          id: "bowl-draft",
          title: "Draft",
          items: [
            { id: "bowl-d1", name: "Pint – Domestic", price: "$4.00", tag: "draft" },
            { id: "bowl-d2", name: "Pint – Craft Rotator", price: "$6.00", tag: "draft" },
          ],
        },
      ],
    }

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
    logo: mickeys,
    cover: COVER,
    galleryImage: GALLERY,
    mapImage: MAP,
    menu: {
      updatedAt: "2025-10-09",
      sections: [
        {
          id: "mic-drafts",
          title: "Drafts",
          items: [
            { id: "mic-d1", name: "Hazy IPA", price: "$6.50", tag: "draft" },
            { id: "mic-d2", name: "Lager", price: "$4.50", tag: "draft" },
          ],
        },
        {
          id: "mic-apps",
          title: "Half-Price Apps (4–7PM)",
          items: [
            { id: "mic-a1", name: "Mozz Sticks", price: "$5.00", tag: "food" },
            { id: "mic-a2", name: "Wings (6pc)", price: "$6.00", tag: "food" },
          ],
        },
        {
          id: "mic-cocktails",
          title: "Cocktails",
          items: [
            { id: "mic-c1", name: "Irish Mule", price: "$8.00" },
            { id: "mic-c2", name: "Whiskey Sour", price: "$8.00" },
          ],
        },
      ],
    }

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
    menu: {
      updatedAt: "2025-10-07",
      sections: [
        {
          id: "mom-pitchers",
          title: "Pitchers",
          items: [
            { id: "mom-p1", name: "$5 Pitchers (Mondays 5–9PM)", price: "$5.00" },
            { id: "mom-p2", name: "Domestic Pitcher", price: "$8.00" },
          ],
        },
        {
          id: "mom-shots",
          title: "Shots",
          items: [
            { id: "mom-s1", name: "Green Tea", price: "$4.00", tag: "shot" },
            { id: "mom-s2", name: "Lemon Drop", price: "$4.00", tag: "shot" },
          ],
        },
        {
          id: "mom-games",
          title: "Bar Snacks",
          items: [
            { id: "mom-g1", name: "Nachos", price: "$7.00", tag: "food" },
            { id: "mom-g2", name: "Pizza Slices", price: "$4.00", tag: "food" },
          ],
        },
      ],
    }

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
    menu: {
      updatedAt: "2025-10-06",
      sections: [
        {
          id: "thu-power",
          title: "Power Hour Specials",
          items: [
            { id: "thu-p1", name: "$2 Busch Lights", price: "$2.00", tag: "draft" },
            { id: "thu-p2", name: "$4 Wells", price: "$4.00", tag: "well" },
          ],
        },
        {
          id: "thu-cocktails",
          title: "House Cocktails",
          items: [
            { id: "thu-c1", name: "Thumbs Up", price: "$8.00", tag: "signature" },
            { id: "thu-c2", name: "Backroom Mule", price: "$7.50" },
          ],
        },
      ],
    }

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
    logo: welchAve,
    cover: COVER,
    galleryImage: GALLERY,
    mapImage: MAP,
    menu: {
    updatedAt: "2025-10-18",
    sections: [
      {
        id: "was-happy",
        title: "Happy Hour (3–7PM)",
        items: [
          { id: "was-h1", name: "$2 Wells", price: "$2.00", tag: "well" },
          { id: "was-h2", name: "$2.50 Tallboys", price: "$2.50", tag: "draft" },
        ],
      },
      {
        id: "was-karaoke",
        title: "Karaoke Night Specials",
        items: [
          { id: "was-k1", name: "Singer’s Shot", price: "$3.00", tag: "shot" },
          { id: "was-k2", name: "Station Soda", price: "$6.00", tag: "signature" },
        ],
      },
      {
        id: "was-regular",
        title: "Regulars",
        items: [
          { id: "was-r1", name: "Domestic Pint", price: "$3.50", tag: "draft" },
          { id: "was-r2", name: "Well Cocktail", price: "$5.00", tag: "well" },
        ],
      },
    ],
  }

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

// AmesAfterDark-Mobile/data/mock.ts
// Updated mock data with scheduled deals/events support (hour-based)
import {IMG} from "@/assets/assets.ts"
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
  photos?: { id: string; uri: string }[];
};

// ---------- Placeholder Assets ----------
const LOGO = IMG.LOGO
const COVER = LOGO;
const GALLERY = LOGO;
const MAP = IMG.fakeMap;
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
    photos: [
      {
        id: "1-1",
        uri: "https://photos.smugmug.com/Big-4-10-1718/Cys-10-17/i-Hhf5TKW/0/LnHBxTs6LphJ7GCNdhntx72XchCjj28hJVm2Kzn8D/X3/_DSC2937-X3.jpg"
      },
      {
        id: "1-2",
        uri: "https://photos.smugmug.com/Big-4-10-1718/Cys-10-17/i-LH4Z9db/0/NVCDTJVdbg7KxXhVKJsKK2vfd9M3HChkF8hFgpkxQ/X3/_DSC2946-X3.jpg"
      },
      {
        id: "1-3",
        uri: "https://photos.smugmug.com/Big-4-10-1718/Cys-10-17/i-9HsLbrp/0/MGZQJ5K53rzSq9G6W5dzrHMpv9kJ3VtHcFt3RMw7T/X3/_DSC2958-X3.jpg"
      },
    ]
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
    photos: [
      {
        id: "2-1",
        uri: "https://photos.smugmug.com/Big-4-10-1718/Sips-10-17/i-5rstkrr/0/KKSsC6S23hx67m3gn5sXsp9S5Vmx8vzZWWSVMbcwV/X3/_DSC3296-X3.jpg"
      },
      {
        id: "2-2",
        uri: "https://photos.smugmug.com/Big-4-10-1718/Sips-10-17/i-K6hL9mM/0/KWSdnrCKmMXdfr3zSLrsm6DpkMNQCRvQsjKWDNTCH/X3/_DSC3330-X3.jpg"
      },
      {
        id: "2-3",
        uri: "https://photos.smugmug.com/Big-4-10-1718/Sips-10-17/i-WCx4wDp/0/Nc34Z4DskWRqrphM4q86Z7VvqcR6ZcxWTjr7mCjQx/X3/_DSC3372-X3.jpg"
      }
    ]
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
    photos: [
      {
        id: "3-1",
        uri: "https://photos.smugmug.com/Big-4-10-1718/Outlaws-10-18/i-Xbz77cP/0/KKrFt82j2QttC4WSd6FRwMtLRbXHBJSdFdz8b5FN8/X3/_DSC4308-X3.jpg"
      },
      {
        id: "3-2",
        uri: "https://photos.smugmug.com/Big-4-10-1718/Outlaws-10-18/i-R6vWdF9/0/KSkcZ3Wn7pzW2H2QJs9mPLJq2FbFHxRJKNGk8h825/X3/_DSC4839-X3.jpg"
      },
      {
        id: "3-3",
        uri: "https://photos.smugmug.com/Big-4-10-1718/Outlaws-10-18/i-QmWbXP4/0/MbZGrHZ7WFn298jWs48c9wKgk3V8d9j44w73VqCkK/X3/_DSC4883-X3.jpg"
      }
    ]
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
  photos: [
    {
      id: "4-1",
      uri: "https://photos.smugmug.com/Big-4-10-310-4/Paddys-10-3/i-mxGLkQ2/0/LPfMWVTvf7RsWDrJbPzhBNCHjnWkhRPhhcgdGr3ZN/X3/_DSC0660-X3.jpg"
    },
    {
      id: "4-2",
      uri: "https://photos.smugmug.com/Big-4-10-310-4/Paddys-10-3/i-tVS6K6F/0/MM4TFGbxCwXbt5nJS4KFBNQk6z7BbWTbjWQPJzb5N/X3/_DSC0668-X3.jpg"
    },
    {
      id: "4-3",
      uri: "https://photos.smugmug.com/Big-4-10-310-4/Paddys-10-3/i-g4MgQkF/0/KJB6DD3nBp4tngvFPxC97VhWrVN2CWSG7wTWLN3qc/X3/_DSC0798-X3.jpg"
    }
  ]
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
  photos: [
    {
      id: "5-1",
      uri: "https://photos.smugmug.com/Big-4-10-1718/Paddys-10-18/i-FhDtBG5/0/Kr99bGShFz7vFwTGFFk2KGk6q8XBPZWHVHgWb8GLr/X3/_DSC4578-X3.jpg"
    },
    {
      id: "5-2",
      uri: "https://photos.smugmug.com/Big-4-10-1718/Paddys-10-18/i-zXgQNVH/0/KnbpDdFt9fvvzkbt6QTdGDjhFSBDjcMngfrkwsV8j/X3/_DSC4583-X3.jpg"
    },
    {
      id: "5-3",
      uri: "https://photos.smugmug.com/Big-4-10-1718/Paddys-10-18/i-3cMbsMH/0/LHQRpKGCHmjBnHGWHWzD6qM9mH83qQPCCRs4XbPpS/X3/_DSC4562-X3.jpg"
    }
  ]
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
  photos: [
    {
      id: "6-1",
      uri: "https://photos.smugmug.com/Big4-919-920/Cys-9-19/i-hKp6NRG/0/LG9n7V3Sm8qgVqj3XCz72FGcWP9Bx5KvRdKWRQTwV/X3/_DSC8634-X3.jpg"
    },
    {
      id: "6-2",
      uri: "https://photos.smugmug.com/Big4-919-920/Cys-9-19/i-Fc8Xg2B/0/NhXnSwr8mhTZFnVBLM2X5dXZ4qxVfgLfPGVjc5gbD/X3/_DSC8639-X3.jpg"
    },
    {
      id: "6-3",
      uri: "https://photos.smugmug.com/Big4-919-920/Cys-9-19/i-qc9CRwP/0/LhWt4dbQVxdDMCGRpSMnBwHcz4w2MKqHRgFL4P5jG/X3/_DSC8668-X3.jpg"
    }
  ]
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
  photos: [
    {
      id: "7-1",
      uri: "https://photos.smugmug.com/Big4-919-920/Outlaws-9-19/i-NcWPHS7/0/MbM7Hb39DCGpJ4nFxThZVLnfrXcQwrTxrJ8MSNDxf/X3/_DSC9266-X3.jpg"
    },
    {
      id: "7-2",
      uri: "https://photos.smugmug.com/Big4-919-920/Outlaws-9-19/i-nxNTKkk/0/KRGxcCZGFbS5sPQbJw47wGB6tc9g3sRjkHgDJ5xQn/X3/_DSC9275-X3.jpg"
    },
    {
      id: "7-3",
      uri: "https://photos.smugmug.com/Big4-919-920/Outlaws-9-19/i-H2kxCBG/0/MXVMPgXXQRCdCMqPbJd62dgrj6K57d4WnDPmxsHVS/X3/_DSC9287-X3.jpg"
    }
  ]
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
  photos: [
    {
      id: "8-1",
      uri: "https://photos.smugmug.com/Big4-919-920/Paddys-9-19/i-TQRG4tT/0/M2hJdtHXrmrVk2HfcjKM4Sh7Q9WPmGbFt89QjmXMH/X3/_DSC8789-X3.jpg"
    },
    {
      id: "8-2",
      uri: "https://photos.smugmug.com/Big4-919-920/Paddys-9-19/i-s9xw5d3/0/MbbMMmcr66kMggLsqdpDjqnChXjLxNwR7K2rCKXbr/X3/_DSC8822-X3.jpg"
    },
    {
      id: "8-3",
      uri: "https://photos.smugmug.com/Big4-919-920/Paddys-9-19/i-rTbV4JK/0/Mhz9NphFkDDLDMWNRRXhD3gkB3d3gJqbFKQrkmjSr/X3/_DSC8833-X3.jpg"
    }
  ]
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
  photos: [
    {
      id: "9-1",
      uri: "https://photos.smugmug.com/Big4-919-920/Cys-9-20/i-Vf4Qmhm/0/KZnBJcF2jPpzhkJvn7LS2V9bJxQB6B4GCfFQQZn4k/X3/_DSC9505-X3.jpg"
    },
    {
      id: "9-2",
      uri: "http://photos.smugmug.com/Big4-919-920/Cys-9-20/i-XVDfkmx/0/LLdfgXbkzTfPG22rjHkFd68qtVSL9hRR5LHddp8sf/X3/_DSC9604-X3.jpg"
    },
    {
      id: "9-3",
      uri: "https://photos.smugmug.com/Big4-919-920/Cys-9-20/i-BkXqf8x/0/KPxX8zTXMkm9fpJwwVhhjzp7RzZ7R4qfd7DsS2dhr/X3/_DSC9791-X3.jpg"
    }
  ]
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
  photos: [
    {
      id: "10-1",
      uri: "https://photos.smugmug.com/Big-4-94/Beer-Garden-9-5/i-X6Wjt9x/0/KM24rV3tDmmhMh7P64k5cD5hfJr5vG4XPVL9JNvpV/X3/_DSC7734-X3.jpg"
    },
    {
      id: "10-2",
      uri: "https://photos.smugmug.com/Big-4-94/Beer-Garden-9-5/i-zq5fWq7/0/KdfwtC9NBbnCm3QF2qpVMGCjWt4g9fnwbvQKLmJ7d/X3/_DSC7740-X3.jpg"
    },
    {
      id: "10-3",
      uri: "https://photos.smugmug.com/Big-4-94/Beer-Garden-9-5/i-pgcn9Jk/0/Lr2BL2bWJDvFnCG5vMBrS67HdmkNb7rZX9R2VNWxb/X3/_DSC7748-X3.jpg"
    }
  ]
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

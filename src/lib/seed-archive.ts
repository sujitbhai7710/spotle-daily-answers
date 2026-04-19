// ─── Seed Archive Data ─────────────────────────────────────────────────────────
// This file contains historical Spotle data that gets seeded into localStorage
// on first visit. It ensures users always have historical data available,
// even before their own archive accumulates from daily visits.
//
// The archive grows over time as fetchSpotleData() saves new entries to localStorage.

export interface SeedEntry {
  isoDate: string;
  spotleNumber: number;
  artist: string;
  track: string;
  image: string;
  soundcloudUrl: string;
}

export const SEED_ARCHIVE: SeedEntry[] = [
  {
    isoDate: "2026-04-19",
    spotleNumber: 1451,
    artist: "The Who",
    track: "Baba O'Riley",
    image: "https://i.scdn.co/image/ab6761610000e5eb93d10db7e453c841d925d30b",
    soundcloudUrl: "https://soundcloud.com/the-who/baba-oriley-2",
  },
  {
    isoDate: "2026-04-18",
    spotleNumber: 1449,
    artist: "Steve Lacy",
    track: "Bad Habit",
    image: "https://i.scdn.co/image/ab67616d0000b273b0db9b2fc4dc19c07f37d020",
    soundcloudUrl: "https://soundcloud.com/stevelacy/bad-habit",
  },
  {
    isoDate: "2026-04-17",
    spotleNumber: 1448,
    artist: "No Doubt",
    track: "Don't Speak",
    image: "https://i.scdn.co/image/ab6761610000e5eb2c01915e0e5dc553f942f12e",
    soundcloudUrl: "https://soundcloud.com/nodoubt/dont-speak-2",
  },
  {
    isoDate: "2026-04-16",
    spotleNumber: 1447,
    artist: "Young Thug",
    track: "Best Friend",
    image: "https://i.scdn.co/image/ab6761610000e5ebad3b6e0c7f62c56e70b7c6ff",
    soundcloudUrl: "https://soundcloud.com/youngthug/best-friend",
  },
  {
    isoDate: "2026-04-15",
    spotleNumber: 1446,
    artist: "The Black Keys",
    track: "Lonely Boy",
    image: "https://i.scdn.co/image/ab6761610000e5eb6c2b7e0e9d59bc38e5c4c3e0",
    soundcloudUrl: "https://soundcloud.com/theblackkeys/lonely-boy-1",
  },
  {
    isoDate: "2026-04-14",
    spotleNumber: 1445,
    artist: "Blondie",
    track: "Heart of Glass",
    image: "https://i.scdn.co/image/ab6761610000e5eb02ae88c9e8e1d17b5e6a2a40",
    soundcloudUrl: "https://soundcloud.com/blondie/heart-of-glass-2",
  },
  {
    isoDate: "2026-04-13",
    spotleNumber: 1444,
    artist: "The Strokes",
    track: "Last Nite",
    image: "https://i.scdn.co/image/ab6761610000e5ebc3b7a5ec45b1e5a50c7d93a6",
    soundcloudUrl: "https://soundcloud.com/thestrokes/last-nite-1",
  },
];

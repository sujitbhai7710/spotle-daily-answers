// ─── Client-side Spotle data fetcher (for static/GitHub Pages deployment) ────
// This module replaces the server-side API route with direct browser fetching
// using CORS proxy services to bypass cross-origin restrictions from spotle.io

import { getArtistInfo, type ArtistInfo } from "./artists";
import { SEED_ARCHIVE } from "./seed-archive";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SpotleEntry {
  date: string;
  artist: string;
  track: string;
  image: string;
  soundcloudUrl: string;
  artistInfo: ArtistInfo | null;
}

export interface SpotleData {
  todaysDate: string;
  previousDay: string;
  spotleNumber: number;
  today: SpotleEntry;
  yesterday: SpotleEntry;
  archive: SpotleEntry[];
  availableDates: string[];
}

// ─── CORS Proxy Configuration ────────────────────────────────────────────────

const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const SPOTLE_DATA_URL = "https://spotle.io/__data.json";

// ─── SvelteKit Dehydrated Data Parser ────────────────────────────────────────

/**
 * spotle.io is built with SvelteKit. Its __data.json endpoint returns a
 * dehydrated data format where the actual data objects are stored in a flat
 * array, and references between them use integer indices into that array.
 *
 * This recursive resolver follows those integer references to reconstruct
 * the original data graph.
 */
function resolveRefs(flat: unknown[], value: unknown): unknown {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value < flat.length) {
    const resolved = flat[value];
    if (resolved === undefined) return value;
    return resolveRefs(flat, resolved);
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolveRefs(flat, v));
  }
  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = resolveRefs(flat, val);
    }
    return result;
  }
  return value;
}

function parseEntry(raw: Record<string, unknown>): SpotleEntry {
  const soundcloud = raw.soundcloud as Record<string, unknown> | undefined;
  const artistName = raw.artist as string;
  return {
    date: raw.date as string,
    artist: artistName,
    track: soundcloud?.track as string ?? "Unknown",
    image: raw.image_uri as string ?? "",
    soundcloudUrl: soundcloud?.url as string ?? "",
    artistInfo: getArtistInfo(artistName),
  };
}

function toISODate(dateStr: string): string {
  const [month, day, year] = dateStr.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// ─── localStorage Archive (replaces server-side file) ────────────────────────

const ARCHIVE_KEY = "spotle_archive";

interface ArchiveEntry {
  isoDate: string;
  spotleNumber: number;
  artist: string;
  track: string;
  image: string;
  soundcloudUrl: string;
}

/** Seed localStorage with bundled historical data on first visit */
function seedArchiveIfNeeded(): void {
  try {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(ARCHIVE_KEY)) return; // Already has data
    if (SEED_ARCHIVE.length === 0) return;

    const entries: ArchiveEntry[] = SEED_ARCHIVE.map((s) => ({
      isoDate: s.isoDate,
      spotleNumber: s.spotleNumber,
      artist: s.artist,
      track: s.track,
      image: s.image,
      soundcloudUrl: s.soundcloudUrl,
    }));
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(entries));
  } catch {
    // Silently fail
  }
}

function loadArchive(): Map<string, ArchiveEntry> {
  try {
    if (typeof window !== "undefined") {
      // Seed on first visit
      seedArchiveIfNeeded();

      const raw = localStorage.getItem(ARCHIVE_KEY);
      if (raw) {
        const data: ArchiveEntry[] = JSON.parse(raw);
        const map = new Map<string, ArchiveEntry>();
        for (const entry of data) {
          map.set(entry.isoDate, entry);
        }
        return map;
      }
    }
  } catch {
    // localStorage may not be available
  }
  return new Map();
}

function saveArchive(archive: Map<string, ArchiveEntry>) {
  try {
    if (typeof window !== "undefined") {
      const data = Array.from(archive.values()).sort((a, b) =>
        b.isoDate.localeCompare(a.isoDate)
      );
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(data));
    }
  } catch {
    // Silently fail if localStorage is not available
  }
}

function addEntriesToArchive(
  archive: Map<string, ArchiveEntry>,
  spotleNumber: number,
  entries: Array<{
    date: string;
    artist: string;
    track: string;
    image: string;
    soundcloudUrl: string;
  }>
) {
  const sorted = [...entries].sort((a, b) => {
    const [am, ad, ay] = a.date.split("/").map(Number);
    const [bm, bd, by] = b.date.split("/").map(Number);
    return new Date(ay, am - 1, ad).getTime() - new Date(by, bm - 1, bd).getTime();
  });

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const isoDate = toISODate(entry.date);
    if (!archive.has(isoDate)) {
      archive.set(isoDate, {
        isoDate,
        spotleNumber: spotleNumber - (sorted.length - 1 - i),
        artist: entry.artist,
        track: entry.track,
        image: entry.image,
        soundcloudUrl: entry.soundcloudUrl,
      });
    }
  }
  saveArchive(archive);
}

// ─── In-memory Cache ─────────────────────────────────────────────────────────

let cachedData: SpotleData | null = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Fetch with CORS Proxy Fallback ──────────────────────────────────────────

async function fetchWithProxy(url: string): Promise<Response> {
  // Try direct fetch first (in case CORS is allowed)
  try {
    const direct = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });
    if (direct.ok) return direct;
  } catch {
    // CORS blocked, try proxies
  }

  // Try each CORS proxy
  for (const makeProxyUrl of CORS_PROXIES) {
    try {
      const proxyUrl = makeProxyUrl(url);
      const response = await fetch(proxyUrl, { cache: "no-store" });
      if (response.ok) return response;
    } catch {
      continue;
    }
  }

  throw new Error("All fetch methods failed. Please try again later.");
}

// ─── Main Fetch Function ─────────────────────────────────────────────────────

export async function fetchSpotleData(): Promise<SpotleData> {
  // Return cached data if still fresh
  const now = Date.now();
  if (cachedData && now - cachedAt < CACHE_TTL) {
    const archive = loadArchive();
    const allDates = new Set(cachedData.availableDates);
    for (const key of archive.keys()) allDates.add(key);
    return { ...cachedData, availableDates: Array.from(allDates).sort().reverse() };
  }

  const response = await fetchWithProxy(SPOTLE_DATA_URL);
  const data = await response.json();

  const nodes = data.nodes as Array<{ type: string; data: unknown[] }>;
  const spotleNode = nodes[1];
  const flat = spotleNode.data;
  const descriptor = flat[0] as Record<string, unknown>;
  const resolved = resolveRefs(flat, descriptor) as Record<string, unknown>;

  const todaysDate = resolved.todaysDate as string;
  const previousDay = resolved.previousDay as string;
  const spotleNumber = resolved.spotleNumber as number;
  const today = parseEntry(resolved.todaysEntry as Record<string, unknown>);
  const yesterday = parseEntry(resolved.yesterdaysEntry as Record<string, unknown>);
  const rawArchive = (resolved.rewindEntries ?? []) as Record<string, unknown>[];
  const archiveEntries = rawArchive.map(parseEntry);

  const availableDates = new Set<string>();
  if (todaysDate) availableDates.add(toISODate(todaysDate));
  if (previousDay) availableDates.add(toISODate(previousDay));
  for (const entry of archiveEntries) {
    if (entry.date) availableDates.add(toISODate(entry.date));
  }

  // Save to localStorage archive
  const archiveMap = loadArchive();
  addEntriesToArchive(archiveMap, spotleNumber, [
    { date: todaysDate, artist: today.artist, track: today.track, image: today.image, soundcloudUrl: today.soundcloudUrl },
    { date: previousDay, artist: yesterday.artist, track: yesterday.track, image: yesterday.image, soundcloudUrl: yesterday.soundcloudUrl },
    ...archiveEntries.map((e) => ({ date: e.date, artist: e.artist, track: e.track, image: e.image, soundcloudUrl: e.soundcloudUrl })),
  ]);

  for (const key of archiveMap.keys()) availableDates.add(key);

  const result: SpotleData = {
    todaysDate,
    previousDay,
    spotleNumber,
    today,
    yesterday,
    archive: archiveEntries,
    availableDates: Array.from(availableDates).sort().reverse(),
  };

  cachedData = result;
  cachedAt = Date.now();

  return result;
}

// ─── Archive Lookup ──────────────────────────────────────────────────────────

export function getArchiveEntry(isoDate: string): SpotleEntry | null {
  const archive = loadArchive();
  const entry = archive.get(isoDate);
  if (!entry) return null;
  const [year, month, day] = entry.isoDate.split("-");
  return {
    date: `${month}/${day}/${year}`,
    artist: entry.artist,
    track: entry.track,
    image: entry.image,
    soundcloudUrl: entry.soundcloudUrl,
    artistInfo: getArtistInfo(entry.artist),
  };
}

export function getArchiveDates(): string[] {
  const archive = loadArchive();
  return Array.from(archive.keys()).sort().reverse();
}

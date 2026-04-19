// ─── Client-side Artist Data Module ─────────────────────────────────────────
// Loads artist info from the bundled JSON file (no server-side fs dependency)
// This works in static builds, GitHub Pages, and browser environments.

import artistsDataRaw from "@/../download/artists_data.json";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RawArtist {
  index: number;
  artist: string;
  country: string;
  genre: string;
  gender: string;
  group_size: number;
  debut_album_year: number;
  track_name: string;
  uri: string;
  image_uri: string;
  song_uri: string;
  song_image_uri: string;
  embedded_track: string;
}

export interface ArtistInfo {
  artist: string;
  country: string;
  countryName: string;
  genre: string;
  gender: string;
  genderName: string;
  groupSize: number;
  groupType: string;
  debutAlbumYear: number;
  spotifyUri: string;
  imageUri: string;
}

// ─── Country code → name mapping ────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  us: "USA", gb: "UK", ca: "Canada", pr: "Puerto Rico", kr: "South Korea",
  au: "Australia", in: "India", fr: "France", se: "Sweden", mx: "Mexico",
  tt: "Trinidad and Tobago", bb: "Barbados", co: "Colombia", de: "Germany",
  it: "Italy", es: "Spain", jp: "Japan", br: "Brazil", ar: "Argentina",
  cl: "Chile", pe: "Peru", ie: "Ireland", nl: "Netherlands", no: "Norway",
  dk: "Denmark", fi: "Finland", at: "Austria", be: "Belgium", ch: "Switzerland",
  pt: "Portugal", pl: "Poland", ru: "Russia", ua: "Ukraine", tr: "Turkey",
  za: "South Africa", ng: "Nigeria", gh: "Ghana", ke: "Kenya", sn: "Senegal",
  cm: "Cameroon", cd: "DR Congo", eg: "Egypt", ma: "Morocco", tn: "Tunisia",
  dz: "Algeria", il: "Israel", ae: "UAE", sa: "Saudi Arabia", iq: "Iraq",
  ir: "Iran", pk: "Pakistan", bd: "Bangladesh", id: "Indonesia", my: "Malaysia",
  ph: "Philippines", th: "Thailand", vn: "Vietnam", sg: "Singapore", tw: "Taiwan",
  hk: "Hong Kong", cn: "China", nz: "New Zealand", cu: "Cuba", do: "Dominican Republic",
  ec: "Ecuador", uy: "Uruguay", py: "Paraguay", bo: "Bolivia", ve: "Venezuela",
  pa: "Panama", gt: "Guatemala", hn: "Honduras", sv: "El Salvador", ni: "Nicaragua",
  cr: "Costa Rica", jm: "Jamaica", ht: "Haiti", bs: "Bahamas", is: "Iceland",
  lu: "Luxembourg", mt: "Malta", cy: "Cyprus", lv: "Latvia", lt: "Lithuania",
  ee: "Estonia", cz: "Czech Republic", sk: "Slovakia", hu: "Hungary",
  ro: "Romania", bg: "Bulgaria", rs: "Serbia", hr: "Croatia", si: "Slovenia",
  ba: "Bosnia and Herzegovina", mk: "North Macedonia", al: "Albania",
  me: "Montenegro", xk: "Kosovo", gr: "Greece",
};

const GENDER_NAMES: Record<string, string> = {
  m: "Male", f: "Female", nb: "Non-binary", x: "Other",
};

// ─── Build artist map at module load time ───────────────────────────────────

const rawArtists = artistsDataRaw as RawArtist[];

const artistMap = new Map<string, ArtistInfo>();
for (const raw of rawArtists) {
  artistMap.set(raw.artist.toLowerCase(), {
    artist: raw.artist,
    country: raw.country,
    countryName: COUNTRY_NAMES[raw.country] || raw.country.toUpperCase(),
    genre: raw.genre,
    gender: raw.gender,
    genderName: GENDER_NAMES[raw.gender] || raw.gender,
    groupSize: raw.group_size,
    groupType: raw.group_size <= 1 ? "Solo" : "Group",
    debutAlbumYear: typeof raw.debut_album_year === "number" ? raw.debut_album_year : Number(raw.debut_album_year),
    spotifyUri: raw.uri || "",
    imageUri: raw.image_uri || "",
  });
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function getArtistInfo(artistName: string): ArtistInfo | null {
  return artistMap.get(artistName.toLowerCase()) ?? null;
}

export function getAllArtists(): ArtistInfo[] {
  return Array.from(artistMap.values());
}

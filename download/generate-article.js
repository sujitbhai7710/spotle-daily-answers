const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, AlignmentType, HeadingLevel, WidthType,
  BorderStyle, ShadingType, ExternalHyperlink, PageBreak,
} = require("docx");
const fs = require("fs");

// ─── Palette: Dawn Mist Tech ──────────────────────────────────────────────
const P = { primary: "0A1628", body: "1A2B40", secondary: "6878A0", accent: "5B8DB8", surface: "F4F8FC" };
const c = (hex) => hex.replace("#", "");

// ─── Helpers ───────────────────────────────────────────────────────────────
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200, line: 312 },
    children: [new TextRun({ text, bold: true, font: { ascii: "Calibri" }, size: 32, color: c(P.primary) })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, font: { ascii: "Calibri" }, size: 28, color: c(P.primary) })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, font: { ascii: "Calibri" }, size: 24, color: c(P.secondary) })],
  });
}

function body(text, opts = {}) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(new TextRun({ text, size: 22, font: { ascii: "Calibri" }, color: c(P.body), ...opts }));
  } else {
    text.forEach(t => {
      if (typeof t === "string") runs.push(new TextRun({ text: t, size: 22, font: { ascii: "Calibri" }, color: c(P.body) }));
      else runs.push(new TextRun({ size: 22, font: { ascii: "Calibri" }, color: c(P.body), ...t }));
    });
  }
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 312 },
    indent: { firstLine: 0 },
    children: runs,
  });
}

function bullet(text) {
  const children = typeof text === "string"
    ? [new TextRun({ text, size: 22, font: { ascii: "Calibri" }, color: c(P.body) })]
    : text.map(t => typeof t === "string"
        ? new TextRun({ text: t, size: 22, font: { ascii: "Calibri" }, color: c(P.body) })
        : new TextRun({ size: 22, font: { ascii: "Calibri" }, color: c(P.body), ...t }));
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 312 },
    children: [
      new TextRun({ text: "\u2022  ", size: 22 }),
      ...children,
    ],
  });
}

function code(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80, line: 280 },
    shading: { type: ShadingType.CLEAR, fill: c(P.surface) },
    indent: { left: 360, right: 360 },
    children: [new TextRun({ text, size: 20, font: { ascii: "Consolas" }, color: c(P.accent) })],
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 60 }, children: [] });
}

function makeRow(cells, isHeader = false) {
  return new TableRow({
    tableHeader: isHeader,
    cantSplit: true,
    children: cells.map(([text, width]) =>
      new TableCell({
        width: { size: width, type: WidthType.PERCENTAGE },
        shading: isHeader ? { type: ShadingType.CLEAR, fill: c(P.accent) } : undefined,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "D0D0D0" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D0D0" },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({
            text, size: 20, font: { ascii: "Calibri" },
            bold: isHeader, color: isHeader ? "FFFFFF" : c(P.body),
          })],
        })],
      })
    ),
  });
}

function simpleTable(headers, rows) {
  const widths = headers.map(() => Math.floor(100 / headers.length));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      makeRow(headers.map((h, i) => [h, widths[i]]), true),
      ...rows.map(row => makeRow(row.map((cell, i) => [cell, widths[i]]))),
    ],
  });
}

// ─── Document ──────────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri" }, size: 22, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: { run: { font: { ascii: "Calibri" }, size: 32, bold: true, color: c(P.primary) } },
      heading2: { run: { font: { ascii: "Calibri" }, size: 28, bold: true, color: c(P.primary) } },
      heading3: { run: { font: { ascii: "Calibri" }, size: 24, bold: true, color: c(P.secondary) } },
    },
  },
  sections: [
    // ── Cover Section ──
    {
      properties: {
        page: {
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
          size: { width: 11906, height: 16838 },
        },
      },
      children: [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: allNoBorders,
          rows: [new TableRow({
            height: { value: 16838, rule: "exact" },
            verticalAlign: "top",
            children: [new TableCell({
              borders: allNoBorders,
              shading: { type: ShadingType.CLEAR, fill: c(P.primary) },
              children: [
                new Paragraph({ spacing: { before: 4000 }, children: [] }),
                new Paragraph({
                  spacing: { after: 200 },
                  children: [new TextRun({ text: "SPOTLE DAILY ANSWERS", size: 56, bold: true, font: { ascii: "Calibri" }, color: "FFFFFF" })],
                }),
                new Paragraph({
                  spacing: { after: 100 },
                  children: [new TextRun({ text: "How We Reverse-Engineered spotle.io", size: 30, font: { ascii: "Calibri" }, color: c(P.accent) })],
                }),
                new Paragraph({
                  spacing: { after: 80 },
                  indent: { left: 0 },
                  border: { top: { style: BorderStyle.SINGLE, size: 6, color: c(P.accent), space: 20 } },
                  children: [],
                }),
                new Paragraph({ spacing: { after: 80 }, children: [] }),
                new Paragraph({
                  children: [new TextRun({ text: "Technical Architecture & Data Pipeline Documentation", size: 22, font: { ascii: "Calibri" }, color: "A0AAB4" })],
                }),
                new Paragraph({
                  spacing: { before: 100 },
                  children: [new TextRun({ text: "Version 1.0  |  April 2026", size: 20, font: { ascii: "Calibri" }, color: "8090A0" })],
                }),
              ],
            })],
          })],
        }),
      ],
    },
    // ── Body Section ──
    {
      properties: {
        page: {
          margin: { top: 1417, bottom: 1417, left: 1701, right: 1417 },
          size: { width: 11906, height: 16838 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Spotle Daily Answers - Technical Documentation", size: 18, color: c(P.secondary), font: { ascii: "Calibri" } })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })],
          })],
        }),
      },
      children: [
        // ═══════════════════════════════════════════════════════════════════
        // 1. INTRODUCTION
        // ═══════════════════════════════════════════════════════════════════
        h1("1. Introduction"),
        body("Spotle is a popular daily music guessing game, similar to Wordle but for music lovers. Every day, a new song is featured, and players must guess the artist and track name based on a progressively revealed audio snippet. The game is hosted at spotle.io and is built using SvelteKit with Supabase as its backend. This project reverse-engineers the Spotle platform to extract the daily answer automatically, display it in a clean user interface, and maintain a growing archive of historical answers for users who want to browse past puzzles."),
        body("The Spotle Daily Answers website serves as a companion tool that reveals the current day's answer along with detailed artist information, including genre, country of origin, artist type (solo or group), debut album year, and gender. It also provides a calendar-based date picker for looking up past answers, an IST countdown timer that shows when the next puzzle will drop, and a persistent archive system that stores historical data across sessions. The site is deployed as a fully static application on GitHub Pages, fetching data directly from spotle.io's public endpoints via CORS proxy services."),

        // ═══════════════════════════════════════════════════════════════════
        // 2. DATA SOURCE
        // ═══════════════════════════════════════════════════════════════════
        h1("2. Data Source Discovery"),
        h2("2.1 Identifying the Endpoint"),
        body("The first step in reverse-engineering spotle.io was understanding how the website delivers data to the browser. Since spotle.io is built with SvelteKit (a full-stack React-like framework), it uses a server-side rendering approach that pre-fetches data and embeds it into the HTML response. By examining the network requests made when loading the website, we discovered that SvelteKit provides a special dehydrated data endpoint at the path /__data.json."),
        body("This endpoint is part of SvelteKit's built-in data loading mechanism. When a user visits the homepage, the server fetches all required data (today's puzzle, yesterday's puzzle, and the archive/rewind entries), serializes it into a compact dehydrated format using integer references, and sends it as a JSON response. This endpoint is publicly accessible and does not require any authentication or API keys. The URL is simply:"),

        code("https://spotle.io/__data.json"),

        body("This is the single source of truth for all daily puzzle data. Every piece of information shown on the website (artist name, track name, album art, SoundCloud preview URL, date, Spotle number) originates from this one endpoint. By fetching and parsing this JSON, we can extract the daily answer without ever actually playing the game or visiting the website in a browser."),

        h2("2.2 Response Structure"),
        body("The __data.json endpoint returns a JSON object containing a nodes array. Each node contains a type identifier and a data array. The second node (index 1) contains the actual Spotle data in a flat dehydrated format. The data uses integer references to avoid repeating objects - a common technique in SvelteKit's dehydrated data system. For example, instead of embedding the full artist object inside an entry, the data stores an integer that points to an index in the flat array. The resolveRefs() function in our codebase recursively follows these references to reconstruct the original data graph."),

        body("After resolving all references, the data provides the following fields:"),
        simpleTable(
          ["Field", "Type", "Description"],
          [
            ["todaysDate", "String (MM/DD/YYYY)", "The date of today's puzzle"],
            ["previousDay", "String (MM/DD/YYYY)", "The date of yesterday's puzzle"],
            ["spotleNumber", "Integer", "The sequential puzzle number (e.g., #1451)"],
            ["todaysEntry", "Object", "Today's answer (artist, track, image, soundcloud)"],
            ["yesterdaysEntry", "Object", "Yesterday's answer with the same structure"],
            ["rewindEntries", "Array of Objects", "Archive of 6 past puzzle entries"],
          ]
        ),

        emptyLine(),
        body("Each entry object contains the artist name, a nested soundcloud object with the track name and preview URL, an image_uri for the album artwork, and the date. The image_uri points to Spotify's CDN (i.scdn.co) and the SoundCloud URL provides a playable preview of the song."),

        h2("2.3 Data Update Schedule"),
        body("The Spotle puzzle updates daily at exactly 12:01 AM EST (Eastern Standard Time), which is equivalent to 1:01 PM IST (Indian Standard Time) or 05:01 UTC. This was determined by observing the todaysDate field in the __data.json response and correlating it with the server time. The countdown timer on our website counts down to 1:01 PM IST and automatically triggers a data refresh when the time is reached. The auto-refresh mechanism uses a useRef hook to track the last refreshed day and only fires once per day to prevent repeated refreshes."),

        simpleTable(
          ["Timezone", "Update Time", "UTC Offset"],
          [
            ["EST (Eastern)", "12:01 AM", "UTC-5"],
            ["UTC", "05:01", "UTC+0"],
            ["IST (Indian)", "1:01 PM", "UTC+5:30"],
            ["JST (Japan)", "2:01 PM", "UTC+9"],
          ]
        ),

        // ═══════════════════════════════════════════════════════════════════
        // 3. ARTIST DATA
        // ═══════════════════════════════════════════════════════════════════
        h1("3. Artist Information Database"),
        h2("3.1 Source of Artist Data"),
        body("The artist metadata (genre, country, type, debut year, gender) is scraped from spotle.io's JavaScript bundle. When the browser loads spotle.io, the page downloads several JS chunks. One of these chunks, identified by analyzing the network requests, contains a large array of artist objects with detailed metadata. This file was originally served from a path like /_app/immutable/chunks/BTpVM8E3.js (or a similar hash-based filename that changes with deployments)."),
        body("The original file format is a JavaScript const declaration with unquoted property names, making it invalid JSON but valid JavaScript. For example, the file starts with 'const e=[{index:0,artist:\"Drake\",country:\"ca\",genre:\"Hip Hop\",...}]'. Since JSON.parse() cannot handle unquoted keys, we use a Function constructor (new Function('return ' + arrayStr)()) to safely evaluate the JavaScript array notation."),

        h2("3.2 Artist Data Processing"),
        body("The raw artist data contains 1,081 artist entries, each with the following fields: index, artist (name), country (2-letter ISO code), genre, gender (m/f/nb/x), group_size, debut_album_year, track_name, uri (Spotify URI), image_uri (Spotify artist image), song_uri (Spotify preview MP3), song_image_uri, and embedded_track (Spotify embed URL). We convert the country codes to full names using a mapping dictionary and the gender codes to readable names (m=Male, f=Female, nb=Non-binary, x=Other). The group_size field is used to determine if an artist is Solo (size <= 1) or Group, with the count displayed alongside the type."),

        body("For the GitHub Pages static deployment, the artist data is pre-converted to a proper JSON file (download/artists_data.json) at build time. The client-side artists module imports this JSON file directly using TypeScript's resolveJsonModule feature, builds an in-memory Map keyed by lowercase artist name, and provides instant lookup without any network requests. This means the artist info panel renders instantly without any loading delay."),

        h2("3.3 File References"),
        simpleTable(
          ["File", "Purpose", "Size"],
          [
            ["download/artists_data.json", "Pre-converted artist database (1,081 entries)", "~550 KB"],
            ["src/lib/artists.ts", "Client-side artist lookup module", "~5 KB"],
            ["src/lib/spotle-fetcher.ts", "Main data fetching and parsing logic", "~8 KB"],
          ]
        ),

        // ═══════════════════════════════════════════════════════════════════
        // 4. DATA FETCHING
        // ═══════════════════════════════════════════════════════════════════
        h1("4. Data Fetching Pipeline"),
        h2("4.1 CORS Proxy Strategy"),
        body("Since spotle.io does not set Cross-Origin Resource Sharing (CORS) headers that allow requests from arbitrary domains, a direct browser fetch to https://spotle.io/__data.json would be blocked. To solve this in a purely static deployment (no server-side API route), we use a multi-tier CORS proxy strategy with automatic fallback. The system tries three approaches in sequence:"),

        bullet([
          { text: "Direct fetch: ", bold: true },
          "First attempts a direct fetch to spotle.io. If the browser allows it (e.g., in a server-side context or if CORS headers are present), this is the fastest path.",
        ]),
        bullet([
          { text: "corsproxy.io: ", bold: true },
          "Primary CORS proxy (https://corsproxy.io/?url=...). This is a free, reliable proxy that adds CORS headers to the response.",
        ]),
        bullet([
          { text: "api.allorigins.win: ", bold: true },
          "Fallback proxy (https://api.allorigins.win/raw?url=...). Used if the primary proxy fails.",
        ]),
        bullet([
          { text: "api.codetabs.com: ", bold: true },
          "Third fallback (https://api.codetabs.com/v1/proxy?quest=...). Last resort before giving up.",
        ]),

        body("The fetchWithProxy() function in src/lib/spotle-fetcher.ts implements this cascading approach. If all proxies fail, it throws an error that triggers the frontend's auto-retry mechanism (which waits 3 seconds and tries again). The in-memory cache ensures that even if the fetch succeeds once, subsequent page loads within 5 minutes use cached data without hitting the network again."),

        h2("4.2 Data Parsing Flow"),
        body("Once the raw JSON is obtained from the CORS proxy, the following parsing steps occur:"),
        bullet("The JSON is parsed to extract the nodes array. Node at index 1 contains the Spotle data."),
        bullet("The flat data array from node 1 is extracted, along with the descriptor object at index 0."),
        bullet("The resolveRefs() function recursively traverses the data, replacing integer references with their resolved values. For example, if an entry contains the number 42, the function looks up flat[42] and recursively resolves it."),
        bullet("After resolution, the todaysDate, previousDay, spotleNumber, todaysEntry, yesterdaysEntry, and rewindEntries fields are extracted from the descriptor."),
        bullet("Each entry is parsed through parseEntry(), which extracts the artist name, track name (from the nested soundcloud.track field), image URI, and SoundCloud URL."),
        bullet("The artist lookup function enriches each entry with metadata (genre, country, type, debut, gender) from the pre-loaded artist database."),
        bullet("All available dates are collected into a sorted array for the calendar date picker."),

        h2("4.3 Archive System"),
        body("The archive system solves a critical limitation: spotle.io only provides data for the last 7-8 days (today, yesterday, and 6 rewind entries). For users who want to look up older dates, we maintain a persistent archive that grows over time. Every time fresh data is fetched, all entries (typically 8 per fetch) are added to the archive if they don't already exist."),
        body("In the server-side version, the archive was stored in a JSON file (download/spotle_archive.json) on the filesystem. In the static/GitHub Pages version, the archive is stored in the browser's localStorage under the key 'spotle_archive'. Each archive entry contains the ISO date (YYYY-MM-DD), Spotle number, artist name, track name, image URL, and SoundCloud URL. When a user selects a date from the calendar that is not in the current live data (more than ~8 days old), the system checks the localStorage archive first. If found, the entry is displayed with full artist info. If not found, a 'No data available' message is shown."),
        body("The archive lookup endpoint is handled entirely client-side by the getArchiveEntry(isoDate) function in spotle-fetcher.ts. It loads the archive from localStorage, looks up the ISO date string, and if found, converts it back to the SpotleEntry format with artist info enrichment. This means historical data is only available on the same device/browser where it was first fetched, which is a trade-off of the static deployment approach."),

        // ═══════════════════════════════════════════════════════════════════
        // 5. TECHNICAL ARCHITECTURE
        // ═══════════════════════════════════════════════════════════════════
        h1("5. Technical Architecture"),
        h2("5.1 Technology Stack"),
        simpleTable(
          ["Technology", "Purpose", "Version"],
          [
            ["Next.js", "React framework (static export mode)", "16.1"],
            ["TypeScript", "Type-safe development", "5.x"],
            ["Tailwind CSS 4", "Utility-first styling", "4.x"],
            ["shadcn/ui", "UI component library", "Latest"],
            ["Framer Motion", "Animations and transitions", "12.x"],
            ["react-day-picker", "Calendar date picker", "9.x"],
            ["lucide-react", "Icon library", "0.525"],
            ["GitHub Actions", "CI/CD auto-deployment", "N/A"],
            ["GitHub Pages", "Static hosting", "N/A"],
          ]
        ),

        h2("5.2 Project Structure"),
        code("src/"),
        code("  app/"),
        code("    page.tsx          # Main page (client component)"),
        code("    layout.tsx        # Root layout with metadata"),
        code("    globals.css       # Global styles + Tailwind"),
        code("  lib/"),
        code("    artists.ts        # Artist data loader (JSON import)"),
        code("    spotle-fetcher.ts # Client-side data fetcher + archive"),
        code("    utils.ts          # Utility functions (cn, etc.)"),
        code("  components/ui/      # shadcn/ui components"),
        code("  hooks/              # React hooks (use-toast, use-mobile)"),
        code("download/"),
        code("  artists_data.json  # 1,081 artists (pre-converted)"),
        code("  spotle_archive.json # Server-side archive (dev only)"),
        code("public/"),
        code("  spotle-banner.png  # Hero banner image"),
        code(".github/workflows/"),
        code("  deploy.yml          # GitHub Actions CI/CD pipeline"),

        h2("5.3 Static Export Configuration"),
        body("The site is configured for Next.js static export (output: 'export' in next.config.ts). This means the entire site is pre-rendered to static HTML, CSS, and JavaScript at build time, with no server-side rendering. The images.unoptimized flag is set to true because Next.js Image optimization requires a server. All images use the unoptimized prop to bypass this. The build output is written to the out/ directory, which GitHub Actions uploads as a Pages artifact."),

        // ═══════════════════════════════════════════════════════════════════
        // 6. AUTO-DEPLOYMENT
        // ═══════════════════════════════════════════════════════════════════
        h1("6. GitHub Actions Auto-Deployment"),
        body("The project includes a GitHub Actions workflow (.github/workflows/deploy.yml) that automatically builds and deploys the site to GitHub Pages on every push to the main branch. The workflow has two jobs:"),
        bullet([
          { text: "Build job: ", bold: true },
          "Checks out the code, sets up Node.js 20, installs dependencies with npm install, runs 'npx next build' to generate the static output, and uploads the out/ directory as a GitHub Pages artifact.",
        ]),
        bullet([
          { text: "Deploy job: ", bold: true },
          "Depends on the build job and uses the actions/deploy-pages@v4 action to publish the artifact to GitHub Pages. The deployment URL is configured as https://sujitbhai7710.github.io/spotle-daily-answers/.",
        ]),
        body("The workflow uses the concurrency group 'pages' to prevent multiple deployments from running simultaneously. If a new push triggers a build while a previous one is still running, the older run is allowed to complete while the newer one waits. The workflow also supports manual triggering via workflow_dispatch for on-demand deployments. Permissions are scoped to read (contents), write (pages), and id-token for secure deployment."),

        // ═══════════════════════════════════════════════════════════════════
        // 7. KEY FEATURES
        // ═══════════════════════════════════════════════════════════════════
        h1("7. Key Features"),
        h2("7.1 Countdown Timer"),
        body("The countdown timer displays the time remaining until 1:01 PM IST (the daily puzzle update time). It uses timezone-safe calculations that work correctly regardless of the server or client timezone. The timer internally converts the current time to IST using UTC arithmetic (getUTCFullYear, getUTCHours, etc.) to avoid JavaScript Date object timezone inconsistencies. When the clock crosses 1:01 PM IST, it automatically triggers a data refresh using a useRef to track the last refreshed day, ensuring only one refresh per day. The timer updates every second with a clean monospaced display showing hours, minutes, and seconds."),

        h2("7.2 Calendar Date Picker"),
        body("The calendar is powered by react-day-picker integrated with a Popover from shadcn/ui. Available dates (dates with data) are highlighted with a purple background. The calendar shows dates from both the current live data (~8 days from spotle.io) and any dates stored in the localStorage archive. When a user selects a date, the system first checks the live data (in-memory Map), and if not found, queries the localStorage archive. The combined display uses the pattern: displayEntry = selectedEntry || archivedEntry."),

        h2("7.3 Artist Information Panel"),
        body("Each puzzle entry is enriched with artist metadata from the 1,081-entry database. The info panel displays five data points in a responsive grid: Genre (color-coded badge), Country (with flag image from flagcdn.com), Type (Solo/Group with icon from lucide-react), Debut Album Year, and Gender. The genre badges use a color mapping system where each genre gets a unique background and text color scheme (e.g., Pop is pink, Hip Hop is amber, Rock is red, R&B is purple). Country flags are loaded from flagcdn.com using the 2-letter ISO country code from the artist database."),

        h2("7.4 Error Handling and Auto-Retry"),
        body("The frontend implements a robust error handling strategy. If the initial data fetch fails (due to CORS proxy issues, network errors, or timeout), the system automatically retries after a 3-second delay. During loading, a skeleton UI is displayed with shimmer animations matching the layout of the actual content. If both the initial fetch and retry fail, an error screen is shown with a 'Try Again' button. The in-memory cache (5-minute TTL) ensures that once data is successfully fetched, subsequent page navigations and component re-renders use the cached data without additional network requests."),

        // ═══════════════════════════════════════════════════════════════════
        // 8. FUTURE ANSWERS
        // ═══════════════════════════════════════════════════════════════════
        h1("8. Can We See Future Answers?"),
        body("No, future answers cannot be retrieved. The __data.json endpoint only returns data for today, yesterday, and the 6 rewind entries from the past. The server-side logic on spotle.io determines the current puzzle based on the server's system date (America/New_York timezone). When the server date rolls over to the next day at midnight EST, the __data.json response updates with the new puzzle. There is no way to request data for a future date because the server simply does not have that information until the day arrives."),
        body("However, by running the archive system continuously, the site accumulates a growing database of historical answers. Over time, as the server keeps running and fetching data every day, the archive grows by 8 entries per day (1 today, 1 yesterday, 6 rewind). Since the rewind entries shift forward each day, some dates that were previously only in the rewind window eventually get archived permanently. This means the site can show answers for dates going back weeks or months, depending on how long the archive has been collecting data."),

        // ═══════════════════════════════════════════════════════════════════
        // 9. REPOSITORY
        // ═══════════════════════════════════════════════════════════════════
        h1("9. Repository & Live Site"),
        body("The complete source code is available on GitHub at:"),
        body([
          { text: "https://github.com/sujitbhai7710/spotle-daily-answers", color: c(P.accent) },
        ]),
        emptyLine(),
        body("The live site is deployed on GitHub Pages at:"),
        body([
          { text: "https://sujitbhai7710.github.io/spotle-daily-answers/", color: c(P.accent) },
        ]),
        emptyLine(),
        body("The repository contains only the essential project files: the Next.js source code, component library, data files, and CI/CD workflow. No build artifacts, environment files, or development logs are committed. The .gitignore file excludes node_modules, .next, out, .env, log files, and the raw artists_data.js (only the converted JSON is tracked)."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/Spotle_Daily_Answers_Technical_Documentation.docx", buf);
  console.log("Document generated successfully!");
});

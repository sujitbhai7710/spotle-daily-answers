"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music2,
  ExternalLink,
  RefreshCw,
  Clock,
  Calendar,
  History,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Volume2,
  Zap,
  Disc3,
  Globe,
  Users,
  Mic2,
  CalendarDays,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  fetchSpotleData,
  getArchiveEntry,
  type SpotleEntry,
  type SpotleData,
} from "@/lib/spotle-fetcher";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Base path for GitHub Pages deployment (matches next.config.ts basePath)
const BASE_PATH = "/spotle-daily-answers";

// IST offset from UTC in minutes (+5:30 = 330 minutes)
const IST_OFFSET_MINUTES = 330;

/** Get IST date components from a Date object (timezone-safe, uses UTC math) */
function getISTComponents(date: Date) {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const istMs = utcMs + IST_OFFSET_MINUTES * 60000;
  const d = new Date(istMs);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
    seconds: d.getUTCSeconds(),
    ms: d.getUTCMilliseconds(),
  };
}

/** Get the IST day string for a given date, e.g. "2026-04-20" */
function getISTDayString(date: Date): string {
  const c = getISTComponents(date);
  return `${c.year}-${String(c.month + 1).padStart(2, "0")}-${String(c.day).padStart(2, "0")}`;
}

/** Get time remaining until 1:01 PM IST (spotle.io daily update time) */
function getTimeUntilUpdateIST(): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const ist = getISTComponents(now);

  // Calculate seconds elapsed in today's IST
  const todaySecondsIST = ist.hours * 3600 + ist.minutes * 60 + ist.seconds;
  // Target: 13:01:00 IST = 13*3600 + 1*60 = 46860 seconds
  const targetSeconds = 13 * 3600 + 1 * 60;

  let diffSeconds = targetSeconds - todaySecondsIST;
  // If already past 1:01 PM IST today, count to tomorrow
  if (diffSeconds < 0) {
    diffSeconds += 24 * 3600;
  }

  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  return { hours, minutes, seconds };
}

/** Format "MM/DD/YYYY" to readable string */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [month, day, year] = dateStr.split("/");
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Convert "MM/DD/YYYY" to "YYYY-MM-DD" */
function toISODate(dateStr: string): string {
  const [month, day, year] = dateStr.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function padZero(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Genre color mapping */
function getGenreColor(genre: string): string {
  const colors: Record<string, string> = {
    Pop: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    "Hip Hop": "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Rock: "bg-red-500/20 text-red-300 border-red-500/30",
    "R&B": "bg-purple-500/20 text-purple-300 border-purple-500/30",
    Latin: "bg-green-500/20 text-green-300 border-green-500/30",
    Electronic: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    Alternative: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    Metal: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    Country: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    Indie: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    Soul: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    Funk: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
    Jazz: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    Classical: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };
  return colors[genre] || "bg-spotle-purple/20 text-spotle-purple-light border-spotle-purple/30";
}

// ─── Components ──────────────────────────────────────────────────────────────

function CountdownTimer({ refresh }: { refresh: () => void }) {
  const [time, setTime] = useState(getTimeUntilUpdateIST());
  const lastRefreshedDay = useRef<string>(getISTDayString(new Date()));
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = getTimeUntilUpdateIST();
      setTime(newTime);

      // Check if we just crossed 1:01 PM IST — only refresh once per day
      const ist = getISTComponents(new Date());
  const currentDay = `${ist.year}-${String(ist.month + 1).padStart(2, "0")}-${String(ist.day).padStart(2, "0")}`;
      const justCrossedUpdate = ist.hours === 13 && ist.minutes === 1;
      if (lastRefreshedDay.current !== currentDay && justCrossedUpdate) {
        lastRefreshedDay.current = currentDay;
        refreshRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-spotle-text-muted">
      <Clock className="h-4 w-4 text-spotle-purple" />
      <span className="hidden sm:inline">New puzzle in</span>
      <div className="flex gap-1 font-mono">
        {[
          { value: time.hours, label: "h" },
          { value: time.minutes, label: "m" },
          { value: time.seconds, label: "s" },
        ].map(({ value, label }) => (
          <span
            key={label}
            className="inline-flex items-center rounded-md bg-spotle-surface-light px-2 py-1 text-xs font-bold text-spotle-purple-light"
          >
            {padZero(value)}
            <span className="ml-0.5 text-spotle-text-muted">{label}</span>
          </span>
        ))}
      </div>
      <span className="text-xs">IST</span>
    </div>
  );
}

function ArtistInfoPanel({ info }: { info: ArtistInfo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-4 rounded-lg border border-spotle-border bg-spotle-surface-light/50 p-4"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Genre */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-spotle-text-muted">
            Genre
          </span>
          <Badge
            variant="outline"
            className={`w-fit text-xs ${getGenreColor(info.genre)}`}
          >
            {info.genre}
          </Badge>
        </div>

        {/* Country */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-spotle-text-muted">
            Country
          </span>
          <div className="flex items-center gap-1.5">
            {info.country && (
              <Image
                src={`https://flagcdn.com/24x18/${info.country}.png`}
                alt={info.countryName}
                width={24}
                height={18}
                className="rounded-sm object-cover"
                unoptimized
              />
            )}
            <span className="text-xs font-medium text-white">
              {info.countryName}
            </span>
          </div>
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-spotle-text-muted">
            Type
          </span>
          <div className="flex items-center gap-1.5">
            {info.groupType === "Solo" ? (
              <Mic2 className="h-3.5 w-3.5 text-spotle-purple-light" />
            ) : (
              <Users className="h-3.5 w-3.5 text-spotle-purple-light" />
            )}
            <span className="text-xs font-medium text-white">
              {info.groupType}
            </span>
            {info.groupSize > 1 && (
              <span className="text-xs text-spotle-text-muted">
                ({info.groupSize})
              </span>
            )}
          </div>
        </div>

        {/* Debut */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-spotle-text-muted">
            Debut Album
          </span>
          <span className="text-xs font-medium text-white">
            {info.debutAlbumYear}
          </span>
        </div>

        {/* Gender */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-spotle-text-muted">
            Gender
          </span>
          <span className="text-xs font-medium text-white">
            {info.genderName}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function EntryCard({
  entry,
  label,
  variant = "default",
  index,
}: {
  entry: SpotleEntry;
  label?: string;
  variant?: "today" | "yesterday" | "archive" | "selected";
  index?: number;
}) {
  const isToday = variant === "today" || variant === "selected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: (index ?? 0) * 0.1 }}
      whileHover={{ scale: 1.01 }}
      className="group"
    >
      <Card
        className={`relative overflow-hidden border-spotle-border bg-spotle-surface transition-all duration-300 ${
          isToday
            ? "border-spotle-purple/50 animate-pulse-glow"
            : "hover:border-spotle-purple/30"
        }`}
      >
        {isToday && (
          <div className="absolute inset-0 bg-gradient-to-br from-spotle-purple/10 to-transparent pointer-events-none" />
        )}

        {label && (
          <div className="relative flex items-center gap-2 px-6 pt-6 flex-wrap">
            {isToday ? (
              <Badge className="bg-spotle-purple text-white hover:bg-spotle-purple-dark">
                <Zap className="mr-1 h-3 w-3" />
                {label}
              </Badge>
            ) : variant === "yesterday" ? (
              <Badge variant="secondary" className="bg-spotle-surface-light text-spotle-text-muted">
                <History className="mr-1 h-3 w-3" />
                {label}
              </Badge>
            ) : null}
            {entry.date && (
              <span className="text-xs text-spotle-text-muted flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(entry.date)}
              </span>
            )}
          </div>
        )}

        <CardContent
          className={`relative flex flex-col gap-4 ${label ? "pt-4" : "pt-6"} pb-6`}
        >
          {/* Image */}
          <div
            className={`relative overflow-hidden rounded-lg ${
              isToday
                ? "aspect-square max-w-[320px] mx-auto w-full"
                : "aspect-video w-full"
            }`}
          >
            {entry.image ? (
              <Image
                src={entry.image}
                alt={`${entry.artist} - ${entry.track}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes={isToday ? "(max-width: 768px) 80vw, 320px" : "(max-width: 768px) 100vw, 300px"}
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-spotle-surface-light">
                <Disc3 className="h-12 w-12 text-spotle-text-muted" />
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-spotle-surface/80 via-transparent to-transparent" />
          </div>

          {/* Title: Artist — Song */}
          <div className="flex flex-col gap-1">
            <h3
              className={`font-bold leading-tight ${
                isToday
                  ? "text-xl md:text-2xl text-white"
                  : "text-base md:text-lg text-white"
              }`}
            >
              {entry.artist}
              <span className="mx-2 text-spotle-purple-light font-normal">
                —
              </span>
              <span
                className={`font-medium ${
                  isToday
                    ? "text-lg md:text-xl text-spotle-purple-light"
                    : "text-sm md:text-base text-spotle-text-muted"
                }`}
              >
                {entry.track}
              </span>
            </h3>

            {/* Soundcloud link */}
            {entry.soundcloudUrl && (
              <div className="pt-1">
                <a
                  href={entry.soundcloudUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-spotle-text-muted transition-colors hover:text-spotle-purple-light"
                >
                  <ExternalLink className="h-3 w-3" />
                  Listen on SoundCloud
                </a>
              </div>
            )}
          </div>

          {/* Artist Info Panel */}
          {entry.artistInfo && <ArtistInfoPanel info={entry.artistInfo} />}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ArchiveSection({ entries }: { entries: SpotleEntry[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="mt-12">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between rounded-xl border border-spotle-border bg-spotle-surface px-6 py-4 transition-colors hover:bg-spotle-surface-light"
      >
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-spotle-purple" />
          <h2 className="text-lg font-bold text-white">Archive / Rewind</h2>
          <Badge variant="secondary" className="bg-spotle-purple/20 text-spotle-purple-light text-xs">
            {entries.length} entries
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-spotle-text-muted" />
        ) : (
          <ChevronDown className="h-5 w-5 text-spotle-text-muted" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry, i) => (
                <EntryCard
                  key={entry.date}
                  entry={entry}
                  variant="archive"
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="flex flex-col items-center gap-4 text-center">
        <Skeleton className="h-10 w-64 rounded-lg animate-shimmer" />
        <Skeleton className="h-5 w-40 rounded animate-shimmer" />
        <Skeleton className="h-4 w-32 rounded animate-shimmer" />
      </div>

      {/* Today card skeleton */}
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-xl border border-spotle-border bg-spotle-surface p-6">
          <Skeleton className="mb-4 h-4 w-24 rounded animate-shimmer" />
          <Skeleton className="aspect-square w-full rounded-lg animate-shimmer" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-6 w-48 rounded animate-shimmer" />
            <Skeleton className="h-5 w-36 rounded animate-shimmer" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Skeleton className="h-8 w-20 rounded animate-shimmer" />
            <Skeleton className="h-8 w-20 rounded animate-shimmer" />
            <Skeleton className="h-8 w-20 rounded animate-shimmer" />
            <Skeleton className="h-8 w-20 rounded animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Yesterday card skeleton */}
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-xl border border-spotle-border bg-spotle-surface p-6">
          <Skeleton className="mb-4 h-4 w-20 rounded animate-shimmer" />
          <Skeleton className="aspect-video w-full rounded-lg animate-shimmer" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-5 w-40 rounded animate-shimmer" />
            <Skeleton className="h-4 w-32 rounded animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Home() {
  const [data, setData] = useState<SpotleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [archivedEntry, setArchivedEntry] = useState<SpotleEntry | null>(null);
  const [archivedLoading, setArchivedLoading] = useState(false);

  const fetchData = useCallback(async (isRetry = false) => {
    try {
      setLoading(true);
      setError(null);
      const json = await fetchSpotleData();
      setData(json);
      setLastFetchTime(new Date().toLocaleTimeString());
    } catch (err) {
      // Auto-retry once after 3 seconds if not already a retry
      if (!isRetry) {
        setTimeout(() => fetchData(true), 3000);
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Build a map of ISO date strings to entries for date picker lookup
  const entryByDate = useMemo(() => {
    const map = new Map<string, SpotleEntry>();
    if (!data) return map;
    if (data.today?.date) {
      map.set(toISODate(data.today.date), data.today);
    }
    if (data.yesterday?.date) {
      map.set(toISODate(data.yesterday.date), data.yesterday);
    }
    for (const entry of data.archive) {
      if (entry.date) {
        map.set(toISODate(entry.date), entry);
      }
    }
    return map;
  }, [data]);

  // Available dates as Date objects for calendar
  const availableDateObjects = useMemo(() => {
    if (!data?.availableDates) return [];
    return data.availableDates.map((d) => {
      const [year, month, day] = d.split("-").map(Number);
      return new Date(year, month - 1, day);
    });
  }, [data?.availableDates]);

  // Selected entry based on calendar pick (use local date, NOT toISOString which shifts to UTC)
  const selectedEntry = useMemo(() => {
    if (!selectedDate) return null;
    const iso = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return entryByDate.get(iso) ?? null;
  }, [selectedDate, entryByDate]);

  const fetchArchivedEntry = useCallback(async (isoDate: string) => {
    try {
      setArchivedLoading(true);
      // Small delay to show loading state
      await new Promise((r) => setTimeout(r, 300));
      const entry = getArchiveEntry(isoDate);
      setArchivedEntry(entry);
    } catch {
      setArchivedEntry(null);
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setCalendarOpen(false);
    setArchivedEntry(null);
    if (date) {
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      // Check live data first, then try archive
      if (!entryByDate.has(iso)) {
        fetchArchivedEntry(iso);
      }
    }
  };

  const clearDateSelection = () => {
    setSelectedDate(undefined);
    setArchivedEntry(null);
  };

  // Combined display entry: live data or archived data
  const displayEntry = selectedEntry || archivedEntry;

  return (
    <div className="min-h-screen flex flex-col bg-spotle-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-spotle-border bg-spotle-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-spotle-purple">
              <Music2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                Spotle Answers
              </h1>
              <p className="text-xs text-spotle-text-muted hidden sm:block">
                Daily song & artist reveal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!loading && data && <CountdownTimer refresh={handleRefresh} />}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="text-spotle-text-muted hover:text-spotle-purple hover:bg-spotle-surface-light"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Banner */}
          <div className="relative mb-10 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-spotle-bg via-spotle-purple/20 to-spotle-bg z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-spotle-bg via-transparent to-transparent z-10" />
            <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BASE_PATH}/spotle-banner.png`}
                alt="Spotle banner"
                className="object-cover opacity-40 h-full w-full"
              />
            </div>
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight"
              >
                Today&apos;s Spotle Answer
              </motion.h2>
              {data && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-2 flex items-center gap-3"
                >
                  <Badge className="bg-spotle-purple text-white text-sm px-3 py-1">
                    <span className="mr-1">#</span>
                    {data.spotleNumber}
                  </Badge>
                  <span className="text-sm text-spotle-text-muted">
                    {formatDate(data.todaysDate)}
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Date Picker Section */}
          {!loading && data && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8 flex items-center justify-center"
            >
              <div className="flex items-center gap-3 rounded-xl border border-spotle-border bg-spotle-surface px-4 py-3">
                <CalendarDays className="h-5 w-5 text-spotle-purple" />
                <span className="text-sm font-medium text-white">
                  Pick a Date
                </span>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-spotle-border bg-spotle-surface-light text-white hover:bg-spotle-border hover:text-white"
                    >
                      {selectedDate
                        ? selectedDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-spotle-border bg-spotle-surface" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      modifiers={{
                        hasData: availableDateObjects,
                      }}
                      modifiersClassNames={{
                        hasData: "bg-spotle-purple/20 text-spotle-purple-light font-semibold",
                      }}
                      className="bg-spotle-surface text-white p-3 rounded-lg"
                      classNames={{
                        months: "flex flex-col",
                        month: "flex flex-col gap-4",
                        month_caption: "flex items-center justify-center h-8 w-full px-8 text-sm font-medium text-white",
                        caption_label: "text-sm font-medium text-white",
                        nav: "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between px-1",
                        button_previous: "size-8 p-0 text-spotle-text-muted hover:text-white hover:bg-spotle-surface-light",
                        button_next: "size-8 p-0 text-spotle-text-muted hover:text-white hover:bg-spotle-surface-light",
                        weekdays: "flex",
                        weekday: "text-spotle-text-muted rounded-md flex-1 font-normal text-[0.8rem] select-none",
                        week: "flex w-full mt-2",
                        day: "relative w-full h-full p-0 text-center flex-1 select-none",
                        today: "bg-spotle-purple text-white rounded-md data-[selected=true]:rounded-none",
                        outside: "text-spotle-text-muted/50 aria-selected:text-spotle-text-muted/50",
                        disabled: "text-spotle-text-muted opacity-50",
                        hidden: "invisible",
                        day_button: "h-8 w-8 p-0 font-normal text-white hover:bg-spotle-surface-light rounded-md",
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {selectedDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateSelection}
                    className="text-spotle-text-muted hover:text-white hover:bg-spotle-surface-light"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.section>
          )}

          {/* Content */}
          {loading && !data ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="rounded-full bg-red-500/10 p-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Unable to load Spotle data
              </h3>
              <p className="text-sm text-spotle-text-muted max-w-md">
                {error}
              </p>
              <Button
                onClick={handleRefresh}
                className="bg-spotle-purple hover:bg-spotle-purple-dark text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : data ? (
            <div>
              {/* Selected date result */}
              {selectedDate && (
                <AnimatePresence mode="wait">
                  {archivedLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-8 flex justify-center"
                    >
                      <Card className="w-full max-w-md border-spotle-border bg-spotle-surface">
                        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-spotle-purple" />
                          <p className="text-sm text-spotle-text-muted">Looking up archive...</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : displayEntry ? (
                    <motion.div
                      key="found"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      className="mb-8"
                    >
                      <div className="flex justify-center">
                        <div className="w-full max-w-md">
                          <EntryCard
                            entry={displayEntry}
                            label={displayEntry.date ? formatDate(displayEntry.date) : selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            variant="selected"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="not-found"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-8 flex justify-center"
                    >
                      <Card className="w-full max-w-md border-spotle-border bg-spotle-surface">
                        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                          <CalendarDays className="h-10 w-10 text-spotle-text-muted" />
                          <h3 className="text-base font-semibold text-white">
                            No data available for this date
                          </h3>
                          <p className="text-sm text-spotle-text-muted">
                            Try selecting a different date from the calendar.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearDateSelection}
                            className="mt-2 border-spotle-border text-spotle-text-muted hover:text-white hover:bg-spotle-surface-light"
                          >
                            Clear Selection
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {/* Today + Yesterday Grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-[1fr_1fr] items-start">
                {/* Today's Answer */}
                <div className="flex justify-center md:justify-start">
                  <EntryCard
                    entry={data.today}
                    label={`Today's Answer #${data.spotleNumber}`}
                    variant="today"
                  />
                </div>

                {/* Yesterday's Answer */}
                <div className="flex justify-center md:justify-start">
                  <EntryCard
                    entry={data.yesterday}
                    label="Yesterday's Answer"
                    variant="yesterday"
                  />
                </div>
              </div>

              {/* Archive Section */}
              {data.archive && data.archive.length > 0 && (
                <ArchiveSection entries={data.archive} />
              )}
            </div>
          ) : null}

          {/* Footer Info */}
          {!loading && data && (
            <div className="mt-12 flex flex-col items-center gap-2 text-center">
              <Separator className="bg-spotle-border mb-6" />
              <p className="text-xs text-spotle-text-muted">
                Data fetched from Spotle. Auto-refreshes daily at 1:01 PM IST when the new puzzle drops.
              </p>
              {lastFetchTime && (
                <p className="text-xs text-spotle-text-muted/60">
                  Last updated: {lastFetchTime}
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-spotle-border bg-spotle-bg py-6 mt-auto">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2 text-spotle-text-muted">
              <Music2 className="h-4 w-4 text-spotle-purple" />
              <span className="text-sm font-medium">
                Spotle Daily Answers
              </span>
            </div>
            <p className="text-xs text-spotle-text-muted/60">
              Not affiliated with Spotle.io. For entertainment purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

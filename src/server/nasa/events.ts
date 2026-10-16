import "server-only";
import type { DateRange, NasaSkyEvent } from "@/contracts/reading";

const DEADLINE_MS = 4_000;
const DAY_MS = 86_400_000;
const METEOR_PAGES = ["quadrantids", "lyrids", "perseids", "orionids", "leonids", "geminids"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function plainText(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ")
    .replace(/&ndash;|&#8211;/g, "–").replace(/&mdash;|&#8212;/g, "—")
    .replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function calendarDate(year: number, month: string, day: number): string | null {
  const monthIndex = MONTHS.indexOf(month.slice(0, 3).toLowerCase());
  if (monthIndex < 0 || year < 1900 || year > 2100 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, monthIndex, day));
  return date.getUTCMonth() === monthIndex ? date.toISOString().slice(0, 10) : null;
}

export function parseEclipsePage(html: string, year: number, sourceUrl: string): NasaSkyEvent[] {
  const events: NasaSkyEvent[] = [];
  // The annual NASA summary identifies the date and type in the same anchor.
  for (const anchor of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
    const match = plainText(anchor[1]).match(/^(\d{4})\s+([A-Za-z]{3})\s+(\d{1,2}):\s+(Total|Partial|Annular|Hybrid|Penumbral)\s+(Solar|Lunar)\s+Eclipse$/i);
    if (!match || Number(match[1]) !== year) continue;
    const date = calendarDate(year, match[2], Number(match[3]));
    if (!date) continue;
    const kind = match[5].toLowerCase() === "solar" ? "solar-eclipse" : "lunar-eclipse";
    events.push({ id: `nasa-${kind}-${date}`, name: `${match[4]} ${match[5].toLowerCase()} eclipse`, kind, date,
      visibility: "Visible only in some regions; see NASA's eclipse maps.",
      source: { name: `NASA eclipses ${year}`, url: sourceUrl } });
  }
  return events;
}

export function parseMeteorPage(html: string, page: string, sourceUrl: string): NasaSkyEvent[] {
  // Use only the dated Active table row, never a generic annual peak or page metadata.
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => plainText(cell[1]));
    if (cells[0]?.toLowerCase() !== "active" || !cells[1]) continue;
    const text = cells[1];
    const peak = text.match(/\bPeak(?:\s+night)?\s*:?\s*([A-Za-z]+)\.?\s+(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?(?:,?\s+(20\d{2}))?\s*\)/i);
    if (!peak) continue;
    const activeYears = [...new Set((text.slice(0, peak.index).match(/\b20\d{2}\b/g) ?? []))];
    // Cross-year activity requires an explicit peak year; do not guess it.
    const year = peak[4] ? Number(peak[4]) : activeYears.length === 1 ? Number(activeYears[0]) : NaN;
    if (!Number.isFinite(year)) continue;
    const date = calendarDate(year, peak[1], Number(peak[2]));
    const endDate = calendarDate(year, peak[1], Number(peak[3] ?? peak[2]));
    if (!date || !endDate || endDate < date) continue;
    const title = page[0].toUpperCase() + page.slice(1);
    return [{ id: `nasa-meteor-${page}-${date}`, name: `${title} meteor shower`, kind: "meteor-shower", date,
      ...(endDate !== date ? { endDate } : {}), visibility: "Visibility depends on location, weather and darkness.",
      source: { name: `NASA · ${title}`, url: sourceUrl } }];
  }
  return [];
}

export function isSupportedNasaPeriod(period: DateRange): boolean {
  const start = Date.parse(period.start);
  const end = Date.parse(period.end);
  return Number.isFinite(start) && Number.isFinite(end) && end > start && end - start <= 367 * DAY_MS
    && new Date(start).getUTCFullYear() >= 1900 && new Date(end).getUTCFullYear() <= 2100;
}

export async function getNasaSkyEvents(period: DateRange, fetcher: typeof fetch = fetch): Promise<NasaSkyEvent[]> {
  if (!isSupportedNasaPeriod(period)) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEADLINE_MS);
  const firstYear = new Date(period.start).getUTCFullYear();
  const lastYear = new Date(Date.parse(period.end) - 1).getUTCFullYear();
  const sources = [
    ...Array.from({ length: lastYear - firstYear + 1 }, (_, i) => {
      const year = firstYear + i;
      const url = `https://eclipse.gsfc.nasa.gov/OH/OH${year}.html`;
      return { url, parse: (html: string) => parseEclipsePage(html, year, url) };
    }),
    ...METEOR_PAGES.map((page) => {
      const url = `https://science.nasa.gov/solar-system/meteors-meteorites/${page}/`;
      return { url, parse: (html: string) => parseMeteorPage(html, page, url) };
    }),
  ];
  try {
    // Fixed source URLs only. Failures are isolated and all fetches share one deadline.
    const batches = await Promise.all(sources.map(async ({ url, parse }) => {
      try {
        const response = await fetcher(url, { signal: controller.signal, cache: "no-store", redirect: "error" });
        if (!response.ok) return [];
        const html = await response.text();
        return html.length <= 2_000_000 ? parse(html) : [];
      } catch { return []; }
    }));
    const unique = new Map(batches.flat().map((event) => [event.id, event]));
    return [...unique.values()].filter((event) => {
      const start = Date.parse(`${event.date}T00:00:00Z`);
      const end = Date.parse(`${event.endDate ?? event.date}T00:00:00Z`) + DAY_MS;
      return start < Date.parse(period.end) && end > Date.parse(period.start);
    }).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)).slice(0, 3);
  } finally { clearTimeout(timer); }
}

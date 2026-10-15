import type { DateRange } from "@/contracts/reading";
import { importCalendarSources } from "@/server/calendar/import-calendar";
import { moonPhaseSourceSchema, retrogradeSourceSchema } from "@/server/calendar/schema";
import type { CalendarProvider } from "./types";

const API_ROOT = "https://zodiacs.org/api/v1";
const DEFAULT_DEADLINE_MS = 5_000;

type FetchCalendar = (input: string, init: RequestInit) => Promise<Response>;

interface ApiCalendarOptions {
  fetch?: FetchCalendar;
  deadlineMs?: number;
  now?: () => Date;
}

function requestedYears(period: DateRange): number[] | null {
  const start = Date.parse(period.start);
  const end = Date.parse(period.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  const startDate = new Date(start);
  const lastDayOfTargetMonth = new Date(Date.UTC(
    startDate.getUTCFullYear() + 1,
    startDate.getUTCMonth() + 1,
    0,
  )).getUTCDate();
  const maxEnd = Date.UTC(
    startDate.getUTCFullYear() + 1,
    startDate.getUTCMonth(),
    Math.min(startDate.getUTCDate(), lastDayOfTargetMonth),
    startDate.getUTCHours(),
    startDate.getUTCMinutes(),
    startDate.getUTCSeconds(),
    startDate.getUTCMilliseconds(),
  );
  if (end > maxEnd) return null;

  const firstYear = startDate.getUTCFullYear();
  const lastYear = new Date(end - 1).getUTCFullYear();
  if (lastYear - firstYear > 1) return null;
  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
}

export function createApiCalendarProvider(options: ApiCalendarOptions = {}): CalendarProvider {
  const fetchCalendar = options.fetch ?? fetch;
  const deadlineMs = options.deadlineMs ?? DEFAULT_DEADLINE_MS;
  const now = options.now ?? (() => new Date());

  return {
    async getEvents(period) {
      const years = requestedYears(period);
      if (!years || !Number.isFinite(deadlineMs) || deadlineMs <= 0) {
        return { status: "unavailable", events: [] };
      }

      const controller = new AbortController();
      let deadline: ReturnType<typeof setTimeout> | undefined;

      const fetchSource = async (kind: "retrogrades" | "moon-phases", year: number): Promise<unknown> => {
        try {
          const response = await fetchCalendar(`${API_ROOT}/${kind}/${year}.json`, {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!response.ok) throw new Error(`Calendar source returned HTTP ${response.status}.`);
          const value: unknown = await response.json();
          const source = kind === "retrogrades"
            ? retrogradeSourceSchema.parse(value)
            : moonPhaseSourceSchema.parse(value);
          if (source.year !== year) throw new Error("Calendar source returned the wrong year.");
          return source;
        } catch (error) {
          controller.abort(error);
          throw error;
        }
      };

      try {
        const timeout = new Promise<never>((_, reject) => {
          deadline = setTimeout(() => {
            const error = new Error("Calendar request deadline exceeded.");
            controller.abort(error);
            reject(error);
          }, deadlineMs);
        });
        const sources = Promise.all([
          Promise.all(years.map((year) => fetchSource("retrogrades", year))),
          Promise.all(years.map((year) => fetchSource("moon-phases", year))),
        ]);
        const [retrogrades, moonPhases] = await Promise.race([sources, timeout]);
        const snapshot = importCalendarSources({
          retrogrades,
          moonPhases,
          retrievedAt: now().toISOString(),
        });
        return { status: "available", events: snapshot.events };
      } catch {
        return { status: "unavailable", events: [] };
      } finally {
        if (deadline !== undefined) clearTimeout(deadline);
      }
    },
  };
}

export const calendarProvider = createApiCalendarProvider();

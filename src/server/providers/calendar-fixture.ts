import { calendarSnapshotSchema, type CalendarSnapshot } from "@/server/calendar/schema";
import type { CalendarProvider } from "./types";

function hasFullCoverage(snapshot: CalendarSnapshot, start: number, end: number): boolean {
  let coveredUntil = start;
  for (const range of snapshot.coverage) {
    const rangeStart = Date.parse(range.from);
    const rangeEnd = Date.parse(range.to);
    if (rangeEnd <= coveredUntil) continue;
    if (rangeStart > coveredUntil) return false;
    coveredUntil = rangeEnd;
    if (coveredUntil >= end) return true;
  }
  return false;
}

export function createSnapshotCalendarProvider(value: unknown): CalendarProvider {
  let snapshot: CalendarSnapshot | null;
  try {
    snapshot = calendarSnapshotSchema.parse(value);
  } catch {
    snapshot = null;
  }
  return {
    async getEvents(period) {
      const start = Date.parse(period.start);
      const end = Date.parse(period.end);
      if (!snapshot || !Number.isFinite(start) || !Number.isFinite(end) || end <= start
        || !hasFullCoverage(snapshot, start, end)) return { status: "unavailable", events: [] };
      return { status: "available", events: snapshot.events };
    },
  };
}

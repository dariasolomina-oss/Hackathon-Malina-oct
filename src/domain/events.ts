import type { AstroEvent, DateRange } from "@/contracts/reading";

export function selectEvents(events: AstroEvent[], period: DateRange): AstroEvent[] {
  const start = Date.parse(period.start);
  const end = Date.parse(period.end);
  return events.filter((event) => {
    const eventStart = Date.parse(event.start);
    if (!Number.isFinite(eventStart)) return false;
    if (event.end === null) return eventStart >= start && eventStart < end;
    const eventEnd = Date.parse(event.end);
    return eventEnd > eventStart && eventStart < end && eventEnd > start;
  }).sort((a, b) => Date.parse(a.start) - Date.parse(b.start)).slice(0, 3);
}

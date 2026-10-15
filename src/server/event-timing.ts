import type { AstroEvent, DateRange } from "@/contracts/reading";

export function formatEventTiming(event: AstroEvent, period: DateRange): string {
  if (event.end === null) {
    return `${event.name} occurs on ${formatUtcDate(event.start)}.`;
  }

  const activeStart = new Date(Math.max(Date.parse(event.start), Date.parse(period.start)));
  const exclusiveEnd = Math.min(Date.parse(event.end), Date.parse(period.end));
  const activeLastInstant = new Date(exclusiveEnd - 1);
  const startLabel = formatUtcDate(activeStart.toISOString());
  const endLabel = formatUtcDate(activeLastInstant.toISOString());
  const activeRange = startLabel === endLabel
    ? startLabel
    : activeStart.getUTCFullYear() === activeLastInstant.getUTCFullYear()
      ? `${formatUtcMonthDay(activeStart.toISOString())}–${endLabel}`
      : `${startLabel}–${endLabel}`;
  return `${event.name} is active during ${activeRange}.`;
}

function formatUtcMonthDay(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
  }).format(new Date(isoDate));
}

function formatUtcDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));
}

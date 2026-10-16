import type { AstroEvent, DateRange } from "@/contracts/reading";

const MAX_SELECTED_EVENTS = 3;
const ANNUAL_SPREAD_THRESHOLD_DAYS = 180;

export function overlaps(event: AstroEvent, start: number, end: number): boolean {
  const eventStart = Date.parse(event.start);
  if (!Number.isFinite(eventStart)) return false;
  if (event.end === null) return eventStart >= start && eventStart < end;
  const eventEnd = Date.parse(event.end);
  return Number.isFinite(eventEnd) && eventEnd > eventStart && eventStart < end && eventEnd > start;
}

function relevance(event: AstroEvent): number {
  const name = event.name.toLowerCase();
  if (name.includes("mercury")) return 100;
  if (name.includes("venus") || name.includes("jupiter")) return 90;
  if (event.kind === "lunation" && name.startsWith("new moon")) return 75;
  if (event.kind === "lunation") return 70;
  if (name.includes("mars") || name.includes("saturn")) return 65;
  return 50;
}

function family(event: AstroEvent): string {
  if (event.kind === "lunation") return event.name.toLowerCase().startsWith("new moon") ? "new-moon" : "full-moon";
  if (event.kind === "retrograde") {
    const planet = event.name.toLowerCase().match(/mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto/)?.[0];
    return planet ? `${planet}-retrograde` : "retrograde";
  }
  return event.kind;
}

function compareCandidates(a: AstroEvent, b: AstroEvent): number {
  return relevance(b) - relevance(a)
    || Date.parse(a.start) - Date.parse(b.start)
    || a.id.localeCompare(b.id);
}

function deduplicate(events: AstroEvent[]): AstroEvent[] {
  const byId = new Map<string, AstroEvent>();
  for (const event of events) {
    const existing = byId.get(event.id);
    if (!existing || compareCandidates(event, existing) < 0) byId.set(event.id, event);
  }
  return [...byId.values()];
}

export function selectEvents(events: AstroEvent[], period: DateRange): AstroEvent[] {
  const start = Date.parse(period.start);
  const end = Date.parse(period.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

  const candidates = deduplicate(events.filter((event) => overlaps(event, start, end)));
  const durationDays = (end - start) / 86_400_000;
  let selected: AstroEvent[];

  const choose = (pool: AstroEvent[], used: Set<string>) => pool
    .filter((event) => !used.has(family(event)))
    .sort(compareCandidates)[0] ?? pool.sort(compareCandidates)[0];

  if (durationDays >= ANNUAL_SPREAD_THRESHOLD_DAYS) {
    const chosen = new Set<string>();
    const usedFamilies = new Set<string>();
    selected = [];
    for (let bucket = 0; bucket < MAX_SELECTED_EVENTS; bucket += 1) {
      const bucketStart = start + ((end - start) * bucket) / MAX_SELECTED_EVENTS;
      const bucketEnd = start + ((end - start) * (bucket + 1)) / MAX_SELECTED_EVENTS;
      const bucketCandidates = candidates
        .filter((event) => !chosen.has(event.id))
        .filter((event) => {
          const time = Math.max(Date.parse(event.start), start);
          return time >= bucketStart && time < bucketEnd;
        });
      const best = choose(bucketCandidates, usedFamilies);
      if (best) {
        selected.push(best);
        chosen.add(best.id);
        usedFamilies.add(family(best));
      }
    }
    if (selected.length < MAX_SELECTED_EVENTS) {
      while (selected.length < MAX_SELECTED_EVENTS) {
        const best = choose(candidates.filter((event) => !chosen.has(event.id)), usedFamilies);
        if (!best) break;
        selected.push(best); chosen.add(best.id); usedFamilies.add(family(best));
      }
    }
  } else {
    selected = [];
    const usedFamilies = new Set<string>();
    while (selected.length < MAX_SELECTED_EVENTS) {
      const best = choose(candidates.filter((event) => !selected.some((item) => item.id === event.id)), usedFamilies);
      if (!best) break;
      selected.push(best); usedFamilies.add(family(best));
    }
  }

  return selected.sort((a, b) => Date.parse(a.start) - Date.parse(b.start) || a.id.localeCompare(b.id));
}

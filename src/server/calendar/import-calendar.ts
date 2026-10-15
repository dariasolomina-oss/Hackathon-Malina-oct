import type { AstroEvent, DateRange } from "@/contracts/reading";
import {
  calendarSnapshotSchema, moonPhaseSourceSchema, retrogradeSourceSchema, type CalendarSnapshot,
} from "./schema";

const SOURCE = { name: "Zodiacs.org" as const, url: "https://zodiacs.org" as const };
const ATTRIBUTION = "Data: Zodiacs.org — https://zodiacs.org" as const;
type RetrogradeSource = ReturnType<typeof retrogradeSourceSchema.parse>;
type RawRetrograde = RetrogradeSource["retrogrades"][number];

function assertYearCoverage(source: { year: number; coverage: { from: string; to: string } }): void {
  const expectedFrom = `${source.year}-01-01T00:00:00.000Z`;
  const expectedTo = `${source.year + 1}-01-01T00:00:00.000Z`;
  if (source.coverage.from !== expectedFrom || source.coverage.to !== expectedTo) {
    throw new Error(`Source coverage for ${source.year} does not cover the complete UTC year.`);
  }
}

function assertUniqueYears(files: Array<{ year: number }>, kind: string): void {
  const years = files.map((file) => file.year);
  if (new Set(years).size !== years.length) throw new Error(`Duplicate ${kind} source year.`);
}

function validateRetrogradeFile(file: RetrogradeSource): void {
  for (const event of file.retrogrades) {
    if (Date.parse(event.from) >= Date.parse(event.to)) throw new Error(`Invalid ${event.planet} retrograde interval.`);
    if (Date.parse(event.to) <= Date.parse(file.coverage.from) || Date.parse(event.from) >= Date.parse(file.coverage.to)) {
      throw new Error("A retrograde interval does not overlap its source coverage.");
    }
    if (event.clippedStart) {
      if (event.from !== file.coverage.from || event.stationRetrograde !== null) {
        throw new Error("A clipped retrograde start must be the source coverage boundary without a station date.");
      }
    } else if (event.stationRetrograde !== event.from) {
      throw new Error("An unclipped retrograde start must equal its station date.");
    }
    if (event.clippedEnd) {
      if (event.to !== file.coverage.to || event.stationDirect !== null) {
        throw new Error("A clipped retrograde end must be the source coverage boundary without a station date.");
      }
    } else if (event.stationDirect !== event.to) {
      throw new Error("An unclipped retrograde end must equal its station date.");
    }
  }
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function retrogradeInterpretation(planet: string, unresolvedStart: boolean, unresolvedEnd: boolean): string {
  const meanings: Record<string, string> = {
    Mercury: "Symbolically, review communication, contracts, schedules, and handoffs.",
    Venus: "Symbolically, reassess working relationships, values, and budgets.",
    Mars: "Symbolically, reconsider pace, conflict, and where effort is going.",
    Jupiter: "Symbolically, review growth plans, confidence, and assumptions about scale.",
    Saturn: "Symbolically, inspect structure, accountability, and long-term commitments.",
    Uranus: "Symbolically, revisit experiments, disruption, and proposed change.",
    Neptune: "Symbolically, clarify vague expectations and test appealing assumptions.",
    Pluto: "Symbolically, examine power, ownership, and slow organizational change.",
  };
  const caveats = [
    unresolvedStart ? "The recorded start is a coverage boundary, not a verified retrograde station." : "",
    unresolvedEnd ? "The recorded end is a coverage boundary, not a verified direct station." : "",
  ].filter(Boolean);
  return [meanings[planet] ?? "Symbolically, pause and review before making irreversible changes.", ...caveats].join(" ");
}

function mergeRetrogrades(records: RawRetrograde[]): RawRetrograde[] {
  const sorted = [...records].sort((a, b) => a.planet.localeCompare(b.planet) || Date.parse(a.from) - Date.parse(b.from));
  const merged: RawRetrograde[] = [];
  for (const record of sorted) {
    const previous = merged.at(-1);
    if (previous && previous.planet === record.planet
      && Date.parse(record.from) <= Date.parse(previous.to)) {
      const endsLater = Date.parse(record.to) > Date.parse(previous.to);
      merged[merged.length - 1] = {
        ...previous,
        to: endsLater ? record.to : previous.to,
        clippedEnd: endsLater ? record.clippedEnd : previous.clippedEnd,
        stationRetrograde: previous.stationRetrograde ?? record.stationRetrograde,
        stationDirect: record.stationDirect ?? previous.stationDirect,
      };
    } else {
      merged.push({ ...record });
    }
  }
  return merged;
}

function mergeCoverage(ranges: DateRange[]): DateRange[] {
  const sorted = [...ranges].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const merged: DateRange[] = [];
  for (const range of sorted) {
    const previous = merged.at(-1);
    if (previous && Date.parse(range.start) <= Date.parse(previous.end)) {
      if (Date.parse(range.end) > Date.parse(previous.end)) previous.end = range.end;
    } else merged.push({ ...range });
  }
  return merged;
}

export function importCalendarSources(input: {
  retrogrades: unknown[]; moonPhases: unknown[]; retrievedAt: string;
}): CalendarSnapshot {
  const retrogradeFiles = input.retrogrades.map((value) => retrogradeSourceSchema.parse(value));
  const moonFiles = input.moonPhases.map((value) => moonPhaseSourceSchema.parse(value));
  if (!retrogradeFiles.length || !moonFiles.length) throw new Error("Both retrograde and moon-phase sources are required.");
  [...retrogradeFiles, ...moonFiles].forEach(assertYearCoverage);
  assertUniqueYears(retrogradeFiles, "retrograde");
  assertUniqueYears(moonFiles, "moon-phase");
  retrogradeFiles.forEach(validateRetrogradeFile);
  moonFiles.forEach((file) => file.lunations.forEach((event) => {
    if (Date.parse(event.at) < Date.parse(file.coverage.from) || Date.parse(event.at) >= Date.parse(file.coverage.to)) {
      throw new Error("A lunation instant falls outside its source coverage.");
    }
  }));

  const retrogradeYears = new Set(retrogradeFiles.map((file) => file.year));
  const moonYears = new Set(moonFiles.map((file) => file.year));
  const commonYears = [...retrogradeYears].filter((year) => moonYears.has(year)).sort((a, b) => a - b);
  if (!commonYears.length || commonYears.length !== retrogradeYears.size || commonYears.length !== moonYears.size) {
    throw new Error("Retrograde and moon-phase sources must cover the same years.");
  }

  const coverage = mergeCoverage(commonYears.map((year) => ({
    start: `${year}-01-01T00:00:00.000Z`, end: `${year + 1}-01-01T00:00:00.000Z`,
  })));
  const retrogradeEvents: AstroEvent[] = mergeRetrogrades(retrogradeFiles.flatMap((file) => file.retrogrades)).map((event) => {
    const unresolvedStart = event.clippedStart && event.stationRetrograde === null;
    const unresolvedEnd = event.clippedEnd && event.stationDirect === null;
    const boundaryNote = unresolvedStart || unresolvedEnd ? " (partly clipped by source coverage)" : "";
    return {
      id: `retrograde-${slug(event.planet)}-${event.from}`,
      name: `${event.planet} retrograde${boundaryNote}`,
      kind: "retrograde", start: event.from, end: event.to,
      interpretation: retrogradeInterpretation(event.planet, unresolvedStart, unresolvedEnd), source: SOURCE,
    };
  });
  const lunationEvents: AstroEvent[] = moonFiles.flatMap((file) => file.lunations).map((event) => ({
    id: `lunation-${event.type}-${event.at}`,
    name: event.type === "new" ? "New Moon" : "Full Moon",
    kind: "lunation", start: event.at, end: null,
    interpretation: event.type === "new"
      ? "Symbolically, use this as a checkpoint for setting intentions or beginning a focused work cycle."
      : "Symbolically, use this as a checkpoint for review, visibility, and completing work already in motion.",
    source: SOURCE,
  }));

  return calendarSnapshotSchema.parse({
    version: 1, retrievedAt: input.retrievedAt,
    coverage: coverage.map((range) => ({ from: range.start, to: range.end })),
    source: { ...SOURCE, attribution: ATTRIBUTION, license: "CC BY 4.0" },
    sourceFiles: [
      ...retrogradeFiles.map((file) => ({ kind: "retrogrades" as const, year: file.year, url: `https://zodiacs.org/api/v1/retrogrades/${file.year}.json`, generatedAt: file.generatedAt })),
      ...moonFiles.map((file) => ({ kind: "moon-phases" as const, year: file.year, url: `https://zodiacs.org/api/v1/moon-phases/${file.year}.json`, generatedAt: file.generatedAt })),
    ].sort((a, b) => a.year - b.year || a.kind.localeCompare(b.kind)),
    events: [...retrogradeEvents, ...lunationEvents].sort((a, b) => Date.parse(a.start) - Date.parse(b.start) || a.id.localeCompare(b.id)),
  });
}

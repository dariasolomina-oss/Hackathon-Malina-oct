import assert from "node:assert/strict";
import test from "node:test";
import snapshotJson from "../src/server/calendar/data/calendar-snapshot.v1.json";
import { importCalendarSources } from "../src/server/calendar/import-calendar";
import { calendarSnapshotSchema } from "../src/server/calendar/schema";
import { createSnapshotCalendarProvider } from "../src/server/providers/calendar";
import { selectEvents } from "../src/domain/events";
import type { AstroEvent } from "../src/contracts/reading";

const metadata = {
  attribution: "Data: Zodiacs.org — https://zodiacs.org",
  license: "CC BY 4.0",
  generatedAt: "2026-09-30T07:54:56.476Z",
};

function retrogradeFile(year: number, retrogrades: unknown[]) {
  return {
    ...metadata, schema: "zodiacs.sky-api.retrogrades.v1", year,
    coverage: { from: `${year}-01-01T00:00:00.000Z`, to: `${year + 1}-01-01T00:00:00.000Z` },
    retrogrades,
  };
}

function moonFile(year: number) {
  return {
    ...metadata, schema: "zodiacs.sky-api.moon-phases.v1", year,
    coverage: { from: `${year}-01-01T00:00:00.000Z`, to: `${year + 1}-01-01T00:00:00.000Z` },
    lunations: [],
  };
}

function syntheticEvent(id: string, name: string, start: string, end: string | null = null): AstroEvent {
  return {
    id, name, start, end, kind: "retrograde", interpretation: "Test only.",
    source: { name: "Test fixture", url: "https://example.com" },
  };
}

test("checked calendar snapshot is valid, attributed, and covers the supported demo years", () => {
  const snapshot = calendarSnapshotSchema.parse(snapshotJson);
  assert.deepEqual(snapshot.coverage, [{
    from: "2026-01-01T00:00:00.000Z", to: "2029-01-01T00:00:00.000Z",
  }]);
  assert.equal(snapshot.source.attribution, "Data: Zodiacs.org — https://zodiacs.org");
  assert.equal(snapshot.sourceFiles.length, 6);
  assert.equal(snapshot.events.length, 103);
  assert.equal(new Set(snapshot.events.map((event) => event.id)).size, snapshot.events.length);
  assert.ok(snapshot.events.every((event) => !/\bin (Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/.test(event.name)));
});

test("source importer rejects invalid schemas and incomplete declared years", () => {
  assert.throws(() => importCalendarSources({
    retrogrades: [{ ...retrogradeFile(2026, []), schema: "unknown" }],
    moonPhases: [moonFile(2026)], retrievedAt: "2026-10-15T00:00:00.000Z",
  }));
  assert.throws(() => importCalendarSources({
    retrogrades: [{ ...retrogradeFile(2026, []), coverage: {
      from: "2026-02-01T00:00:00.000Z", to: "2027-01-01T00:00:00.000Z",
    } }],
    moonPhases: [moonFile(2026)], retrievedAt: "2026-10-15T00:00:00.000Z",
  }), /does not cover the complete UTC year/);
  assert.throws(() => importCalendarSources({
    retrogrades: [retrogradeFile(2026, []), retrogradeFile(2026, [])],
    moonPhases: [moonFile(2026), moonFile(2026)], retrievedAt: "2026-10-15T00:00:00.000Z",
  }), /Duplicate retrograde source year/);
});

test("source importer rejects station fields that contradict interval boundaries", () => {
  assert.throws(() => importCalendarSources({
    retrogrades: [retrogradeFile(2026, [{
      planet: "Mercury", from: "2026-02-01T00:00:00.000Z", to: "2026-02-20T00:00:00.000Z",
      clippedStart: false, clippedEnd: false,
      stationRetrograde: "2026-02-02T00:00:00.000Z", stationDirect: "2026-02-20T00:00:00.000Z",
    }])],
    moonPhases: [moonFile(2026)], retrievedAt: "2026-10-15T00:00:00.000Z",
  }), /start must equal its station date/);
  assert.throws(() => importCalendarSources({
    retrogrades: [retrogradeFile(2026, [{
      planet: "Mercury", from: "2026-02-01T00:00:00.000Z", to: "2026-12-30T00:00:00.000Z",
      clippedStart: false, clippedEnd: true,
      stationRetrograde: "2026-02-01T00:00:00.000Z", stationDirect: null,
    }])],
    moonPhases: [moonFile(2026)], retrievedAt: "2026-10-15T00:00:00.000Z",
  }), /clipped retrograde end must be the source coverage boundary/);
});

test("source importer joins clipped cross-year segments without presenting the boundary as a station", () => {
  const firstSegment = {
    planet: "Mercury", from: "2026-12-20T00:00:00.000Z", to: "2027-01-01T00:00:00.000Z",
    clippedStart: false, clippedEnd: true,
    stationRetrograde: "2026-12-20T00:00:00.000Z", stationDirect: null,
  };
  const secondSegment = {
    planet: "Mercury", from: "2027-01-01T00:00:00.000Z", to: "2027-01-10T00:00:00.000Z",
    clippedStart: true, clippedEnd: false,
    stationRetrograde: null, stationDirect: "2027-01-10T00:00:00.000Z",
  };
  const snapshot = importCalendarSources({
    retrogrades: [retrogradeFile(2026, [firstSegment]), retrogradeFile(2027, [secondSegment])],
    moonPhases: [moonFile(2026), moonFile(2027)], retrievedAt: "2026-10-15T00:00:00.000Z",
  });
  assert.equal(snapshot.events.length, 1);
  assert.deepEqual(snapshot.events[0], {
    id: "retrograde-mercury-2026-12-20T00:00:00.000Z", name: "Mercury retrograde", kind: "retrograde",
    start: "2026-12-20T00:00:00.000Z", end: "2027-01-10T00:00:00.000Z",
    interpretation: "Symbolically, review communication, contracts, schedules, and handoffs.",
    source: { name: "Zodiacs.org", url: "https://zodiacs.org" },
  });
});

test("snapshot provider distinguishes covered empty ranges from coverage gaps", async () => {
  const provider = createSnapshotCalendarProvider({
    ...snapshotJson,
    coverage: [
      { from: "2026-01-01T00:00:00.000Z", to: "2027-01-01T00:00:00.000Z" },
      { from: "2028-01-01T00:00:00.000Z", to: "2029-01-01T00:00:00.000Z" },
    ],
    events: [],
  });
  assert.equal((await provider.getEvents({
    start: "2026-04-01T00:00:00.000Z", end: "2026-05-01T00:00:00.000Z",
  })).status, "available");
  assert.deepEqual(await provider.getEvents({
    start: "2026-12-01T00:00:00.000Z", end: "2028-02-01T00:00:00.000Z",
  }), { status: "unavailable", events: [] });
});

test("snapshot provider covers a rolling annual demo range and rejects an unsupported range", async () => {
  const provider = createSnapshotCalendarProvider(snapshotJson);
  assert.equal((await provider.getEvents({
    start: "2026-10-15T00:00:00.000Z", end: "2027-10-15T00:00:00.000Z",
  })).status, "available");
  assert.equal((await provider.getEvents({
    start: "2028-10-15T00:00:00.000Z", end: "2029-10-15T00:00:00.000Z",
  })).status, "unavailable");
});

test("annual event selection ranks relevant events while spreading them across the full range", () => {
  const selected = selectEvents([
    syntheticEvent("early-low", "Pluto retrograde", "2026-01-10T00:00:00.000Z"),
    syntheticEvent("early-high", "Mercury retrograde", "2026-02-10T00:00:00.000Z"),
    syntheticEvent("middle", "Venus retrograde", "2026-06-10T00:00:00.000Z"),
    syntheticEvent("late", "Jupiter retrograde", "2026-11-10T00:00:00.000Z"),
    syntheticEvent("late", "Jupiter retrograde", "2026-11-10T00:00:00.000Z"),
  ], { start: "2026-01-01T00:00:00.000Z", end: "2027-01-01T00:00:00.000Z" });
  assert.deepEqual(selected.map((event) => event.id), ["early-high", "middle", "late"]);
});

test("event selection obeys start-inclusive and end-exclusive overlap bounds", () => {
  const selected = selectEvents([
    syntheticEvent("ends-at-start", "Mercury retrograde", "2026-09-01T00:00:00.000Z", "2026-10-01T00:00:00.000Z"),
    syntheticEvent("ongoing", "Mercury retrograde", "2026-09-02T00:00:00.000Z", "2026-10-02T00:00:00.000Z"),
    syntheticEvent("at-start", "New Moon", "2026-10-01T00:00:00.000Z"),
    syntheticEvent("at-end", "New Moon", "2026-11-01T00:00:00.000Z"),
  ], { start: "2026-10-01T00:00:00.000Z", end: "2026-11-01T00:00:00.000Z" });
  assert.deepEqual(selected.map((event) => event.id), ["ongoing", "at-start"]);
});

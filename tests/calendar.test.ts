import assert from "node:assert/strict";
import test from "node:test";
import snapshotJson from "../src/server/calendar/data/calendar-snapshot.v1.json";
import { importCalendarSources } from "../src/server/calendar/import-calendar";
import { calendarSnapshotSchema } from "../src/server/calendar/schema";
import { createApiCalendarProvider } from "../src/server/providers/calendar";
import { createSnapshotCalendarProvider } from "../src/server/providers/calendar-fixture";
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

function moonFile(year: number, lunations: unknown[] = []) {
  return {
    ...metadata, schema: "zodiacs.sky-api.moon-phases.v1", year,
    coverage: { from: `${year}-01-01T00:00:00.000Z`, to: `${year + 1}-01-01T00:00:00.000Z` },
    lunations,
  };
}

function sourceResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function emptySourceForUrl(url: string): unknown {
  const match = /\/(retrogrades|moon-phases)\/(\d{4})\.json$/.exec(url);
  assert.ok(match);
  const year = Number(match[2]);
  return match[1] === "retrogrades" ? retrogradeFile(year, []) : moonFile(year);
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

test("retrogrades outside source coverage are rejected by the importer and runtime provider", async () => {
  for (const [from, to] of [
    ["2025-12-20T00:00:00.000Z", "2026-01-01T00:00:00.000Z"],
    ["2027-01-01T00:00:00.000Z", "2027-01-20T00:00:00.000Z"],
  ]) {
    const retrogrades = retrogradeFile(2026, [{
      planet: "Mercury", from, to,
      clippedStart: false, clippedEnd: false,
      stationRetrograde: from, stationDirect: to,
    }]);
    assert.throws(() => importCalendarSources({
      retrogrades: [retrogrades], moonPhases: [moonFile(2026)],
      retrievedAt: "2026-10-15T00:00:00.000Z",
    }), /does not overlap its source coverage/);

    const provider = createApiCalendarProvider({
      fetch: async (url) => sourceResponse(url.includes("retrogrades") ? retrogrades : moonFile(2026)),
    });
    assert.deepEqual(await provider.getEvents({
      start: "2026-01-01T00:00:00.000Z", end: "2027-01-01T00:00:00.000Z",
    }), { status: "unavailable", events: [] });
  }
});

test("API provider accepts full station intervals crossing source year boundaries", async () => {
  const intervals = [
    { planet: "Mercury", from: "2025-12-20T00:00:00.000Z", to: "2026-01-20T00:00:00.000Z" },
    { planet: "Uranus", from: "2026-09-10T18:28:28.593Z", to: "2027-02-08T12:28:27.274Z" },
  ];
  const provider = createApiCalendarProvider({
    fetch: async (url) => sourceResponse(url.includes("retrogrades")
      ? retrogradeFile(2026, intervals.map((event) => ({
        ...event, clippedStart: false, clippedEnd: false,
        stationRetrograde: event.from, stationDirect: event.to,
      }))) : moonFile(2026)),
  });
  const result = await provider.getEvents({
    start: "2026-01-01T00:00:00.000Z", end: "2027-01-01T00:00:00.000Z",
  });
  assert.equal(result.status, "available");
  assert.deepEqual(result.events.map((event) => ({ from: event.start, to: event.end })),
    intervals.map(({ from, to }) => ({ from, to })));
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

test("API provider refetches every reading without cache and requests only UTC years touched", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const provider = createApiCalendarProvider({
    fetch: async (url, init) => {
      calls.push({ url, init });
      return sourceResponse(emptySourceForUrl(url));
    },
    now: () => new Date("2026-10-15T00:00:00.000Z"),
  });
  const exactYear = { start: "2026-01-01T00:00:00.000Z", end: "2027-01-01T00:00:00.000Z" };
  assert.equal((await provider.getEvents(exactYear)).status, "available");
  assert.equal((await provider.getEvents(exactYear)).status, "available");
  assert.deepEqual(calls.map((call) => call.url), [
    "https://zodiacs.org/api/v1/retrogrades/2026.json",
    "https://zodiacs.org/api/v1/moon-phases/2026.json",
    "https://zodiacs.org/api/v1/retrogrades/2026.json",
    "https://zodiacs.org/api/v1/moon-phases/2026.json",
  ]);
  assert.ok(calls.every((call) => call.init.cache === "no-store" && call.init.signal instanceof AbortSignal));

  calls.length = 0;
  await provider.getEvents({
    start: "2026-10-15T00:00:00.000Z", end: "2027-10-15T00:00:00.000Z",
  });
  assert.deepEqual(calls.map((call) => call.url), [
    "https://zodiacs.org/api/v1/retrogrades/2026.json",
    "https://zodiacs.org/api/v1/retrogrades/2027.json",
    "https://zodiacs.org/api/v1/moon-phases/2026.json",
    "https://zodiacs.org/api/v1/moon-phases/2027.json",
  ]);
});

test("API provider normalizes sources and joins a cross-year retrograde", async () => {
  const segments = new Map<number, unknown[]>([
    [2026, [{
      planet: "Mercury", from: "2026-12-20T00:00:00.000Z", to: "2027-01-01T00:00:00.000Z",
      clippedStart: false, clippedEnd: true,
      stationRetrograde: "2026-12-20T00:00:00.000Z", stationDirect: null,
    }]],
    [2027, [{
      planet: "Mercury", from: "2027-01-01T00:00:00.000Z", to: "2027-01-10T00:00:00.000Z",
      clippedStart: true, clippedEnd: false,
      stationRetrograde: null, stationDirect: "2027-01-10T00:00:00.000Z",
    }]],
  ]);
  const provider = createApiCalendarProvider({
    fetch: async (url) => {
      const match = /\/(retrogrades|moon-phases)\/(\d{4})\.json$/.exec(url);
      assert.ok(match);
      const year = Number(match[2]);
      return sourceResponse(match[1] === "retrogrades"
        ? retrogradeFile(year, segments.get(year) ?? [])
        : moonFile(year, [{ type: "new", at: `${year}-06-01T12:00:00.000Z` }]));
    },
    now: () => new Date("2026-10-15T00:00:00.000Z"),
  });
  const result = await provider.getEvents({
    start: "2026-10-15T00:00:00.000Z", end: "2027-10-15T00:00:00.000Z",
  });
  assert.equal(result.status, "available");
  assert.deepEqual(result.events.filter((event) => event.kind === "retrograde"), [{
    id: "retrograde-mercury-2026-12-20T00:00:00.000Z",
    name: "Mercury retrograde",
    kind: "retrograde",
    start: "2026-12-20T00:00:00.000Z",
    end: "2027-01-10T00:00:00.000Z",
    interpretation: "Symbolically, review communication, contracts, schedules, and handoffs.",
    source: { name: "Zodiacs.org", url: "https://zodiacs.org" },
  }]);
});

test("API provider returns unavailable without snapshot fallback for bad source responses", async (context) => {
  const cases: Array<{ name: string; response(url: string): Response }> = [
    { name: "HTTP error", response: () => sourceResponse({}, 404) },
    { name: "malformed JSON", response: () => new Response("{broken", { status: 200 }) },
    { name: "wrong declared year", response: (url) => sourceResponse(url.includes("retrogrades")
      ? retrogradeFile(2025, []) : moonFile(2025)) },
    { name: "incomplete year coverage", response: (url) => {
      const value = emptySourceForUrl(url) as { coverage: { from: string; to: string } };
      value.coverage.from = value.coverage.from.replace("-01-01", "-02-01");
      return sourceResponse(value);
    } },
  ];

  for (const failure of cases) {
    await context.test(failure.name, async () => {
      const provider = createApiCalendarProvider({ fetch: async (url) => failure.response(url) });
      assert.deepEqual(await provider.getEvents({
        start: "2026-04-01T00:00:00.000Z", end: "2026-05-01T00:00:00.000Z",
      }), { status: "unavailable", events: [] });
    });
  }
});

test("API provider never reuses a previous successful response", async () => {
  let shouldFail = false;
  const provider = createApiCalendarProvider({
    fetch: async (url) => shouldFail
      ? sourceResponse({}, 503)
      : sourceResponse(emptySourceForUrl(url)),
    now: () => new Date("2026-10-15T00:00:00.000Z"),
  });
  const period = { start: "2026-04-01T00:00:00.000Z", end: "2026-05-01T00:00:00.000Z" };
  assert.equal((await provider.getEvents(period)).status, "available");
  shouldFail = true;
  assert.deepEqual(await provider.getEvents(period), { status: "unavailable", events: [] });
});

test("API provider aborts sibling requests after a source failure", async () => {
  const signals: AbortSignal[] = [];
  const provider = createApiCalendarProvider({
    fetch: async (url, init) => {
      signals.push(init.signal as AbortSignal);
      if (url.includes("retrogrades")) return sourceResponse({}, 404);
      return new Promise<Response>((_, reject) => {
        init.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
      });
    },
  });
  assert.deepEqual(await provider.getEvents({
    start: "2026-04-01T00:00:00.000Z", end: "2026-05-01T00:00:00.000Z",
  }), { status: "unavailable", events: [] });
  assert.equal(signals.length, 2);
  assert.ok(signals.every((signal) => signal.aborted));
});

test("API provider deadline covers response parsing and aborts every request", async () => {
  const signals: AbortSignal[] = [];
  const provider = createApiCalendarProvider({
    deadlineMs: 10,
    fetch: async (_url, init) => {
      signals.push(init.signal as AbortSignal);
      return {
        ok: true,
        status: 200,
        json: () => new Promise<unknown>(() => undefined),
      } as Response;
    },
  });
  assert.deepEqual(await provider.getEvents({
    start: "2026-04-01T00:00:00.000Z", end: "2026-05-01T00:00:00.000Z",
  }), { status: "unavailable", events: [] });
  assert.equal(signals.length, 2);
  assert.ok(signals.every((signal) => signal.aborted));
});

test("API provider rejects periods longer than twelve months before fetching", async () => {
  let fetches = 0;
  const provider = createApiCalendarProvider({ fetch: async () => {
    fetches += 1;
    return sourceResponse({});
  } });
  assert.deepEqual(await provider.getEvents({
    start: "2026-01-01T00:00:00.000Z", end: "2027-01-02T00:00:00.000Z",
  }), { status: "unavailable", events: [] });
  assert.equal(fetches, 0);
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

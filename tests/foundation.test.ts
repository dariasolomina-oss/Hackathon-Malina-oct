import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { cards } from "../src/content/cards";
import { CARD_IDS } from "../src/contracts/catalog";
import { readingRequestSchema, type AstroEvent, type ReadingRequest } from "../src/contracts/reading";
import { shuffleDeck } from "../src/domain/deck";
import { selectEvents } from "../src/domain/events";
import { resolvePeriod } from "../src/domain/period";
import { createReading } from "../src/server/reading-service";
import { oracleProvider } from "../src/server/providers/oracle";
import { POST } from "../src/app/api/readings/route";

const request: ReadingRequest = {
  questionId: "employee-project-on-time", periodId: "one-month", answerCardId: "the-tower", recommendationCardId: "the-magician",
};
// Synthetic event dates are used only in tests, never in the product calendar.
function event(id: string, start: string, end: string | null): AstroEvent {
  return { id, start, end, name: "Synthetic test event", kind: "retrograde", interpretation: "Test only.",
    source: { name: "Test fixture", url: "https://example.com" } };
}

test("catalog matches the stable IDs and every artwork path exists", () => {
  assert.deepEqual(cards.map((card) => card.id), [...CARD_IDS]);
  assert.ok(cards.every((card) => existsSync(`public${card.image}`) && card.answerMeaning && card.recommendationMeaning));
});

test("deck contains each card once and does not mutate the catalog", () => {
  const deck = shuffleDeck(() => 0);
  assert.equal(CARD_IDS.length, 32);
  assert.equal(new Set(deck).size, 32);
  assert.deepEqual([...deck].sort(), [...CARD_IDS].sort());
  assert.equal(CARD_IDS[0], "the-fool");
});

test("request rejects duplicates, unknown IDs, and extra fields", () => {
  assert.ok(readingRequestSchema.safeParse(request).success);
  assert.equal(readingRequestSchema.safeParse({ ...request, recommendationCardId: "the-tower" }).success, false);
  assert.equal(readingRequestSchema.safeParse({ ...request, questionId: "unknown" }).success, false);
  assert.equal(readingRequestSchema.safeParse({ ...request, inventedEvent: "Venus" }).success, false);
});

test("calendar month arithmetic clamps month ends and handles leap years", () => {
  assert.deepEqual(resolvePeriod("one-month", new Date("2027-01-31T23:00:00Z")), {
    start: "2027-01-31T00:00:00.000Z", end: "2027-02-28T00:00:00.000Z",
  });
  assert.equal(resolvePeriod("one-month", new Date("2028-01-31T00:00:00Z")).end, "2028-02-29T00:00:00.000Z");
  assert.equal(resolvePeriod("three-months", new Date("2026-11-30T00:00:00Z")).end, "2027-02-28T00:00:00.000Z");
});

test("event overlap includes ongoing retrogrades and excludes end boundaries", () => {
  const period = { start: "2026-10-15T00:00:00Z", end: "2026-11-15T00:00:00Z" };
  const selected = selectEvents([
    event("ongoing", "2026-10-01T00:00:00Z", "2026-10-20T00:00:00Z"),
    event("ended", "2026-10-01T00:00:00Z", period.start),
    event("instant-start", period.start, null),
    event("instant-end", period.end, null),
    event("future", "2026-12-01T00:00:00Z", null),
    event("invalid", "invalid", null),
  ], period);
  assert.deepEqual(selected.map((item) => item.id), ["ongoing", "instant-start"]);
});

test("service passes exact card roles and only relevant events to the oracle", async () => {
  const relevant = event("relevant", "2026-10-16T00:00:00Z", null);
  const reading = await createReading(request, {
    now: new Date("2026-10-15T12:00:00Z"),
    calendar: { async getEvents() { return { status: "available", events: [relevant, event("later", "2027-01-01T00:00:00Z", null)] }; } },
    oracle: { mode: "mock", async generate(input) {
      assert.equal(input.answerCard.id, "the-tower");
      assert.equal(input.recommendationCard.id, "the-magician");
      assert.deepEqual(input.events, [relevant]);
      return { answer: "Answer", recommendation: "Advice", cosmicNote: "Test note" };
    } },
  });
  assert.equal(reading.cosmicNote, "Test note");
  assert.deepEqual(reading.request, request);
});

test("calendar failure produces an explicitly card-only mock reading", async () => {
  const result = await createReading(request, {
    calendar: { async getEvents() { throw new Error("Offline"); } }, oracle: oracleProvider,
  });
  assert.equal(result.meta.calendarStatus, "unavailable");
  assert.equal(result.meta.mode, "mock");
  assert.deepEqual(result.events, []);
  assert.equal(result.cosmicNote, null);
  assert.match(result.answer, /The Tower/);
  assert.match(result.recommendation, /The Magician/);
});

test("oracle failures propagate instead of silently switching to a sample", async () => {
  await assert.rejects(createReading(request, {
    calendar: { async getEvents() { return { status: "available", events: [] }; } },
    oracle: { mode: "live", async generate() { throw new Error("AI unavailable"); } },
  }), /AI unavailable/);
});

test("route accepts a valid reading and rejects malformed or duplicate requests", async () => {
  const valid = await POST(new Request("http://localhost/api/readings", { method: "POST", body: JSON.stringify(request) }));
  assert.equal(valid.status, 200);
  assert.equal((await valid.json()).meta.mode, "mock");
  for (const body of ["{broken", JSON.stringify({ ...request, answerCardId: request.recommendationCardId })]) {
    const result = await POST(new Request("http://localhost/api/readings", { method: "POST", body }));
    assert.equal(result.status, 400);
    assert.equal((await result.json()).error.code, "INVALID_REQUEST");
  }
});

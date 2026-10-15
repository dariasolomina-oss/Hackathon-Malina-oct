import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { cards } from "../src/content/cards";
import { CARD_IDS, PERIOD_IDS, QUESTIONS } from "../src/contracts/catalog";
import { readingRequestSchema, type AstroEvent, type ReadingRequest } from "../src/contracts/reading";
import { shuffleDeck } from "../src/domain/deck";
import { selectEvents } from "../src/domain/events";
import { resolvePeriod } from "../src/domain/period";
import { createReading } from "../src/server/reading-service";
import { oracleProvider } from "../src/server/providers/oracle";
import { createReadingsPost } from "../src/server/readings-handler";

const offlineCalendar = { async getEvents() { return { status: "available" as const, events: [] }; } };

const request: ReadingRequest = {
  questionId: "employee-project-deadline", periodId: "one-month", answerCardId: "the-challenge", recommendationCardId: "the-spark",
};
// Synthetic event dates are used only in tests, never in the product calendar.
function event(id: string, start: string, end: string | null): AstroEvent {
  return { id, start, end, name: "Synthetic test event", kind: "retrograde", interpretation: "Test only.",
    source: { name: "Test fixture", url: "https://example.com" } };
}

test("catalog matches the stable IDs and every artwork path exists", () => {
  assert.deepEqual(cards.map((card) => card.id), [...CARD_IDS]);
  assert.ok(cards.every((card) => existsSync(`public${card.image}`)
    && card.meanings.employee.answer && card.meanings.employee.recommendation
    && card.meanings.leadership.answer && card.meanings.leadership.recommendation));
});

test("question catalog has the exact audience, labels, and allowed periods", () => {
  assert.deepEqual(QUESTIONS.map(({ id, label, audience, allowedPeriodIds }) => ({
    id, label, audience, allowedPeriodIds: [...allowedPeriodIds],
  })), [
    { id: "employee-project-deadline", label: "Will I be able to finish my project on time?", audience: "employee", allowedPeriodIds: [...PERIOD_IDS] },
    { id: "employee-recognition", label: "Will my hard work be recognized?", audience: "employee", allowedPeriodIds: [...PERIOD_IDS] },
    { id: "employee-performance-review", label: "How will my performance review go?", audience: "employee", allowedPeriodIds: [...PERIOD_IDS] },
    { id: "employee-new-project", label: "Will an exciting new project come my way soon?", audience: "employee", allowedPeriodIds: [...PERIOD_IDS] },
    { id: "employee-jira-hours", label: "Will I finally manage to log my hours in Jira on time?", audience: "employee", allowedPeriodIds: ["one-year"] },
    { id: "employee-surprise-meetings", label: "Will I ever have a week without surprise meetings?", audience: "employee", allowedPeriodIds: [...PERIOD_IDS] },
    { id: "leadership-company-outlook", label: "What does the next year hold for our company?", audience: "leadership", allowedPeriodIds: ["one-year"] },
    { id: "leadership-customer-focus", label: "Which customers should we focus on attracting?", audience: "leadership", allowedPeriodIds: [...PERIOD_IDS] },
    { id: "leadership-growth-opportunities", label: "What new growth opportunities are on the horizon?", audience: "leadership", allowedPeriodIds: [...PERIOD_IDS] },
    { id: "leadership-team-motivation", label: "How can we strengthen our team and keep everyone motivated?", audience: "leadership", allowedPeriodIds: [...PERIOD_IDS] },
    { id: "leadership-strategic-priority", label: "What should be our top strategic priority?", audience: "leadership", allowedPeriodIds: [...PERIOD_IDS] },
    { id: "leadership-changing-priorities", label: "Will we finally make it through a quarter without changing our priorities?", audience: "leadership", allowedPeriodIds: ["three-months"] },
  ]);
});

test("question-period validation accepts 30 combinations and rejects the six fixed-period mismatches", () => {
  const outcomes = QUESTIONS.flatMap((question) => PERIOD_IDS.map((periodId) => ({
    questionId: question.id,
    periodId,
    success: readingRequestSchema.safeParse({ ...request, questionId: question.id, periodId }).success,
  })));
  assert.equal(outcomes.filter((outcome) => outcome.success).length, 30);
  assert.deepEqual(outcomes.filter((outcome) => !outcome.success).map(({ questionId, periodId }) => `${questionId}:${periodId}`), [
    "employee-jira-hours:one-month",
    "employee-jira-hours:three-months",
    "leadership-company-outlook:one-month",
    "leadership-company-outlook:three-months",
    "leadership-changing-priorities:one-month",
    "leadership-changing-priorities:one-year",
  ]);
});

test("deck contains each card once and does not mutate the catalog", () => {
  const deck = shuffleDeck(() => 0);
  assert.equal(new Set(deck).size, 32);
  assert.deepEqual([...deck].sort(), [...CARD_IDS].sort());
  assert.equal(CARD_IDS[0], "the-spark");
});

test("request rejects duplicates, unknown IDs, and extra fields", () => {
  assert.ok(readingRequestSchema.safeParse(request).success);
  assert.equal(readingRequestSchema.safeParse({ ...request, recommendationCardId: "the-challenge" }).success, false);
  assert.equal(readingRequestSchema.safeParse({ ...request, questionId: "unknown" }).success, false);
  assert.equal(readingRequestSchema.safeParse({ ...request, inventedEvent: "Venus" }).success, false);
});

test("calendar month arithmetic clamps month ends and handles leap years", () => {
  assert.deepEqual(resolvePeriod("one-month", new Date("2027-01-31T23:00:00Z")), {
    start: "2027-01-31T00:00:00.000Z", end: "2027-02-28T00:00:00.000Z",
  });
  assert.equal(resolvePeriod("one-month", new Date("2028-01-31T00:00:00Z")).end, "2028-02-29T00:00:00.000Z");
  assert.equal(resolvePeriod("three-months", new Date("2026-11-30T00:00:00Z")).end, "2027-02-28T00:00:00.000Z");
  assert.deepEqual(resolvePeriod("one-year", new Date("2028-02-29T18:30:00Z")), {
    start: "2028-02-29T00:00:00.000Z", end: "2029-02-28T00:00:00.000Z",
  });
  assert.equal(resolvePeriod("one-year", new Date("2027-02-28T00:00:00Z")).end, "2028-02-28T00:00:00.000Z");
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
      assert.equal(input.audience, "employee");
      assert.equal(input.question, "Will I be able to finish my project on time?");
      assert.equal(input.answerCard.id, "the-challenge");
      assert.equal(input.recommendationCard.id, "the-spark");
      assert.deepEqual(input.events, [relevant]);
      return { answer: "Answer", recommendation: "Advice", cosmicNote: "Test note" };
    } },
  });
  assert.equal(reading.cosmicNote, "Test note");
  assert.deepEqual(reading.request, request);
});

test("mock readings use the authoritative audience context", async () => {
  const leadershipRequest: ReadingRequest = {
    ...request, questionId: "leadership-strategic-priority", periodId: "three-months",
  };
  const [employee, leadership] = await Promise.all([
    createReading(request, { calendar: { async getEvents() { return { status: "available", events: [] }; } }, oracle: oracleProvider }),
    createReading(leadershipRequest, { calendar: { async getEvents() { return { status: "available", events: [] }; } }, oracle: oracleProvider }),
  ]);
  assert.match(employee.answer, /your own work and daily routine/);
  assert.match(leadership.answer, /company direction, customers, and the team/);
});

test("calendar failure produces an explicitly card-only mock reading", async () => {
  const result = await createReading(request, {
    calendar: { async getEvents() { throw new Error("Offline"); } }, oracle: oracleProvider,
  });
  assert.equal(result.meta.calendarStatus, "unavailable");
  assert.equal(result.meta.mode, "mock");
  assert.deepEqual(result.events, []);
  assert.equal(result.cosmicNote, null);
  assert.match(result.answer, /The Challenge/);
  assert.match(result.recommendation, /The Spark/);
});

test("oracle failures propagate instead of silently switching to a sample", async () => {
  await assert.rejects(createReading(request, {
    calendar: { async getEvents() { return { status: "available", events: [] }; } },
    oracle: { mode: "live", async generate() { throw new Error("AI unavailable"); } },
  }), /AI unavailable/);
});

test("route accepts a valid reading and rejects malformed, duplicate, or fixed-period requests", async () => {
  const POST = createReadingsPost((input) => createReading(input, { calendar: offlineCalendar, oracle: oracleProvider }));
  const valid = await POST(new Request("http://localhost/api/readings", { method: "POST", body: JSON.stringify(request) }));
  assert.equal(valid.status, 200);
  assert.equal((await valid.json()).meta.mode, "mock");
  for (const body of [
    "{broken",
    JSON.stringify({ ...request, answerCardId: request.recommendationCardId }),
    JSON.stringify({ ...request, questionId: "employee-jira-hours", periodId: "one-month" }),
    JSON.stringify({ ...request, questionId: "leadership-company-outlook", periodId: "three-months" }),
    JSON.stringify({ ...request, questionId: "leadership-changing-priorities", periodId: "one-year" }),
  ]) {
    const result = await POST(new Request("http://localhost/api/readings", { method: "POST", body }));
    assert.equal(result.status, 400);
    assert.equal((await result.json()).error.code, "INVALID_REQUEST");
  }
});

test("route maps configuration and provider failures to the existing retryable error", async () => {
  const POST = createReadingsPost(async () => { throw new Error("Missing live configuration"); });
  const result = await POST(new Request("http://localhost/api/readings", {
    method: "POST", body: JSON.stringify(request),
  }));
  assert.equal(result.status, 503);
  assert.deepEqual(await result.json(), {
    error: { code: "READING_FAILED", message: "The oracle is unavailable. Please try again with the same cards." },
  });
});

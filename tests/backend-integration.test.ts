import assert from "node:assert/strict";
import test from "node:test";
import { PERIOD_IDS, QUESTIONS, getQuestion, isPeriodAllowed } from "../src/contracts/catalog";
import type { ApiError, AstroEvent, ReadingRequest, ReadingResponse } from "../src/contracts/reading";
import { createReading } from "../src/server/reading-service";
import { createReadingsPost } from "../src/server/readings-handler";
import { createConfiguredOracleProvider } from "../src/server/providers/oracle";
import snapshotJson from "../src/server/calendar/data/calendar-snapshot.v1.json";
import { createSnapshotCalendarProvider } from "../src/server/providers/calendar-fixture";
import type { OracleInput, OracleProvider } from "../src/server/providers/types";

const fixedNow = new Date("2026-10-15T12:00:00.000Z");
const offlineCalendar = createSnapshotCalendarProvider(snapshotJson);
const cards = {
  answerCardId: "the-tower",
  recommendationCardId: "the-magician",
} as const;

function readingRequest(questionId: ReadingRequest["questionId"], periodId: ReadingRequest["periodId"]): Request {
  return new Request("http://localhost/api/readings", {
    method: "POST",
    body: JSON.stringify({ questionId, periodId, ...cards }),
  });
}

function overlaps(event: AstroEvent, start: number, end: number): boolean {
  const eventStart = Date.parse(event.start);
  if (event.end === null) return eventStart >= start && eventStart < end;
  return eventStart < end && Date.parse(event.end) > start;
}

test("route and service preserve the contract for all question-period combinations", async () => {
  const received: OracleInput[] = [];
  const fakeLiveOracle: OracleProvider = {
    mode: "live",
    async generate(input) {
      received.push(input);
      return {
        answer: `Answer from ${input.answerCard.name}`,
        recommendation: `Recommendation from ${input.recommendationCard.name}`,
        cosmicNote: input.events.length ? "Grounded by supplied events." : null,
      };
    },
  };
  const POST = createReadingsPost((input) => createReading(input, {
    now: fixedNow,
    calendar: offlineCalendar,
    oracle: fakeLiveOracle,
  }));

  let accepted = 0;
  let rejected = 0;
  for (const question of QUESTIONS) {
    for (const periodId of PERIOD_IDS) {
      const response = await POST(readingRequest(question.id, periodId));
      if (!isPeriodAllowed(question.id, periodId)) {
        rejected += 1;
        assert.equal(response.status, 400);
        assert.equal(((await response.json()) as ApiError).error.code, "INVALID_REQUEST");
        continue;
      }

      accepted += 1;
      assert.equal(response.status, 200);
      const reading = (await response.json()) as ReadingResponse;
      const oracleInput = received.at(-1)!;
      assert.deepEqual(reading.request, { questionId: question.id, periodId, ...cards });
      assert.deepEqual(reading.meta, { mode: "live", calendarStatus: "available" });
      assert.equal(oracleInput.audience, getQuestion(question.id).audience);
      assert.equal(oracleInput.question, question.label);
      assert.equal(oracleInput.answerCard.id, cards.answerCardId);
      assert.equal(oracleInput.recommendationCard.id, cards.recommendationCardId);
      assert.deepEqual(oracleInput.events, reading.events);
      assert.ok(reading.events.length > 0 && reading.events.length <= 3);
      const start = Date.parse(reading.period.start);
      const end = Date.parse(reading.period.end);
      assert.ok(reading.events.every((event) => overlaps(event, start, end)));
      assert.ok(reading.events.every((event) => event.source.name === "Zodiacs.org"
        && event.source.url === "https://zodiacs.org"));
    }
  }

  assert.equal(accepted, 30);
  assert.equal(rejected, 6);
  assert.equal(received.length, 30);
});

test("route keeps live card-only readings explicit when calendar data is unavailable", async () => {
  const POST = createReadingsPost((input) => createReading(input, {
    now: fixedNow,
    calendar: { async getEvents() { throw new Error("calendar unavailable"); } },
    oracle: {
      mode: "live",
      async generate(oracleInput) {
        assert.deepEqual(oracleInput.events, []);
        return { answer: "Card answer", recommendation: "Card action", cosmicNote: "Must be removed" };
      },
    },
  }));

  const response = await POST(readingRequest("employee-project-deadline", "one-month"));
  assert.equal(response.status, 200);
  const reading = (await response.json()) as ReadingResponse;
  assert.deepEqual(reading.meta, { mode: "live", calendarStatus: "unavailable" });
  assert.deepEqual(reading.events, []);
  assert.equal(reading.cosmicNote, null);
});

test("route hides keyless live configuration and provider failures", async () => {
  const failures = [
    createReadingsPost(async () => {
      await createConfiguredOracleProvider({ ORACLE_MODE: "live" });
      throw new Error("unreachable");
    }),
    createReadingsPost((input) => createReading(input, {
      now: fixedNow,
      calendar: offlineCalendar,
      oracle: { mode: "live", async generate() { throw new Error("provider-secret-detail"); } },
    })),
  ];

  for (const POST of failures) {
    const response = await POST(readingRequest("employee-project-deadline", "one-month"));
    assert.equal(response.status, 503);
    const body = await response.json() as ApiError;
    assert.deepEqual(body, {
      error: { code: "READING_FAILED", message: "The oracle is unavailable. Please try again with the same cards." },
    });
    assert.doesNotMatch(JSON.stringify(body), /OPENAI_API_KEY|provider-secret-detail/);
  }
});

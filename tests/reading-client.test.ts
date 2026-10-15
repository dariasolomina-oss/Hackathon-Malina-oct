import assert from "node:assert/strict";
import test from "node:test";
import { requestReading } from "../src/features/reading/client";
import type { ReadingRequest, ReadingResponse } from "../src/contracts/reading";

const request: ReadingRequest = {
  questionId: "employee-project-deadline", periodId: "one-month", answerCardId: "the-challenge", recommendationCardId: "the-spark",
};

test("reading client posts the selected question, period, and ordered cards", async () => {
  const originalFetch = globalThis.fetch;
  let captured: { url: string; init?: RequestInit } | undefined;
  const result: ReadingResponse = {
    answer: "Answer", recommendation: "Advice", cosmicNote: null, request,
    period: { start: "2026-10-15T00:00:00.000Z", end: "2026-11-15T00:00:00.000Z" },
    events: [], meta: { mode: "mock", calendarStatus: "available" },
  };
  globalThis.fetch = (async (input, init) => {
    captured = { url: String(input), init };
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  try {
    assert.deepEqual(await requestReading(request), result);
    assert.equal(captured?.url, "/api/readings");
    assert.deepEqual(JSON.parse(String(captured?.init?.body)), request);
    assert.equal((captured?.init?.headers as Record<string, string>)?.["Content-Type"], "application/json");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("reading client surfaces live API errors without a sample fallback", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ error: { code: "READING_FAILED", message: "Live oracle failed." } }), { status: 503 })) as typeof fetch;
  try {
    await assert.rejects(requestReading(request), /Live oracle failed\./);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

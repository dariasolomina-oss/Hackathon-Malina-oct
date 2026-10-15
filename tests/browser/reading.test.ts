import assert from "node:assert/strict";
import test from "node:test";
import { chromium, type Page } from "playwright";
import type { ReadingRequest, ReadingResponse } from "../../src/contracts/reading";
import { QUESTIONS, PERIODS } from "../../src/contracts/catalog";
import { cards } from "../../src/content/cards";

// Run against a local production server. Responses are controlled fixtures, not live AI.
const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

async function assertFits(page: Page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
}

test("both audiences use the shared questions and lock fixed periods", { timeout: 90_000 }, async () => {
  const browser = await chromium.launch({ executablePath: process.env.TEST_BROWSER_PATH || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await page.goto(baseURL);
    for (const audience of ["employee", "leadership"] as const) {
      await page.getByRole("button", { name: audience === "employee" ? "Employee" : "Leadership", exact: true }).click();
      assert.equal(await page.getByRole("group", { name: "Choose a workplace question" }).getByRole("button").count(), 6);
      for (const question of QUESTIONS.filter((item) => item.audience === audience)) {
        await page.getByRole("button").filter({ hasText: question.label }).click();
        for (const period of PERIODS) {
          const button = page.getByRole("button", { name: new RegExp(period.label) });
          const allowed = question.allowedPeriodIds.some((id) => id === period.id);
          assert.equal(await button.isDisabled(), !allowed);
          if (question.allowedPeriodIds.length === 1 && allowed) {
            assert.equal(await button.getAttribute("aria-pressed"), "true");
          }
        }
      }
    }
    await page.getByRole("button", { name: /Shuffle the deck/ }).click();
    assert.equal(await page.getByRole("button", { name: /Draw a face-down card/ }).count(), 32);
    await page.getByRole("button", { name: "Draw a face-down card, position 1", exact: true }).click();
    await page.getByRole("button", { name: "Draw a face-down card, position 2", exact: true }).click();
    await page.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>(".card-art img")]
      .every((img) => img.complete && img.naturalWidth === 1024 && img.src.endsWith(".webp")));
    await assertFits(page);
  } finally {
    await browser.close();
  }
});

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
  test(`reading journey, retry and restart at ${viewport.width}px`, { timeout: 90_000 }, async () => {
    const browser = await chromium.launch({
      executablePath: process.env.TEST_BROWSER_PATH || undefined,
    });
    try {
      const page = await browser.newPage({ viewport });
      const requests: ReadingRequest[] = [];
      let mode: "mock" | "live" = "mock";
      let releaseFailure!: () => void;
      const failureGate = new Promise<void>((resolve) => { releaseFailure = resolve; });
      await page.route("**/api/readings", async (route) => {
        const request = route.request().postDataJSON() as ReadingRequest;
        requests.push(request);
        if (requests.length === 1) {
          await failureGate;
          await route.fulfill({ status: 503, json: { error: { code: "READING_FAILED", message: "Oracle temporarily unavailable." } } });
          return;
        }
        const response: ReadingResponse = {
          request, answer: "Test answer", recommendation: "Test recommendation. Fixture event timing shapes this action.", cosmicNote: "Fixture event timing shapes this action.",
          period: { start: "2026-10-15T00:00:00.000Z", end: "2026-11-15T00:00:00.000Z" },
          events: [{ id: "fixture", name: "Fixture event", kind: "aspect", start: "2026-10-20T00:00:00.000Z", end: null,
            interpretation: "Test interpretation", source: { name: "Fixture calendar", url: "https://example.com/calendar" } }],
          meta: { mode, calendarStatus: "available" },
        };
        await route.fulfill({ json: response });
      });
      await page.goto(baseURL);
      await assertFits(page);

      // Use keyboard activation for question, period, shuffle, and both card roles.
      const question = page.getByRole("button", { name: /02/ }).first();
      await question.focus();
      await page.keyboard.press("Enter");
      assert.equal(await question.getAttribute("aria-pressed"), "true");
      await page.getByRole("button", { name: /Next three months/ }).press("Enter");
      await page.getByRole("button", { name: /Shuffle the deck/ }).press("Enter");
      await page.getByRole("button", { name: "Draw a face-down card, position 1", exact: true }).press("Enter");
      const answer = await page.getByRole("button", { name: /^What happens:/ }).getAttribute("aria-label");
      await page.getByRole("button", { name: "Draw a face-down card, position 2", exact: true }).press("Space");
      const recommendation = await page.getByRole("button", { name: /^What to do:/ }).getAttribute("aria-label");
      await assertFits(page);
      const pending = page.waitForRequest("**/api/readings");
      await page.getByRole("button", { name: /Reveal your reading/ }).press("Enter");
      await pending;
      assert.equal(await page.getByRole("button", { name: /Consulting the oracle/ }).isDisabled(), true);
      assert.equal(await page.getByRole("button", { name: "Start over" }).isDisabled(), true);
      releaseFailure();
      await page.getByRole("alert").waitFor();
      assert.equal(await page.getByText("Sample reading", { exact: true }).count(), 0);
      await page.getByRole("button", { name: "Retry this reading" }).press("Enter");
      await page.getByText("Sample reading", { exact: true }).waitFor();
      assert.deepEqual(requests[1], requests[0]);
      assert.notEqual(requests[0].answerCardId, requests[0].recommendationCardId);
      assert.equal(answer, `What happens: ${cards.find((card) => card.id === requests[0].answerCardId)!.name}`);
      assert.equal(recommendation, `What to do: ${cards.find((card) => card.id === requests[0].recommendationCardId)!.name}`);
      assert.equal(await page.getByRole("button", { name: /^What happens:/ }).getAttribute("aria-label"), answer);
      assert.equal(await page.getByRole("button", { name: /^What to do:/ }).getAttribute("aria-label"), recommendation);
      const readingContext = page.locator(".reading-context");
      assert.deepEqual(await readingContext.locator("dt").allTextContents(), ["Question", "Period"]);
      assert.equal(await readingContext.locator("dd").nth(0).textContent(), "Will my hard work be recognized?");
      assert.equal(await readingContext.locator("dd").nth(1).locator("strong").textContent(), "Next three months");
      assert.equal(await readingContext.locator("dd").nth(1).locator("span").textContent(), "Oct 15, 2026 – Nov 14, 2026");
      await page.getByText("Fixture event timing shapes this action.", { exact: false }).waitFor();
      assert.equal(await page.getByRole("link", { name: /Event source: Fixture calendar/ }).getAttribute("href"), "https://example.com/calendar");
      await assertFits(page);

      await page.getByRole("button", { name: "Start a new reading" }).press("Enter");
      assert.equal(await page.getByText("Sample reading", { exact: true }).count(), 0);
      await page.getByRole("button", { name: /Shuffle the deck/ }).press("Enter");
      assert.equal(await page.getByRole("button", { name: /^What happens:/ }).count(), 0);
      mode = "live";
      await page.getByRole("button", { name: "Draw a face-down card, position 1", exact: true }).press("Enter");
      await page.getByRole("button", { name: "Draw a face-down card, position 2", exact: true }).press("Enter");
      await page.getByRole("button", { name: /Reveal your reading/ }).press("Enter");
      await page.getByText("Personal reading", { exact: true }).waitFor();
      assert.equal(await page.getByText("Sample reading", { exact: true }).count(), 0);
      await assertFits(page);
    } finally {
      await browser.close();
    }
  });
}

test("reading explains unavailable and empty calendars", { timeout: 90_000 }, async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TEST_BROWSER_PATH || undefined,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    let calendarStatus: ReadingResponse["meta"]["calendarStatus"] = "unavailable";
    await page.route("**/api/readings", async (route) => {
      const request = route.request().postDataJSON() as ReadingRequest;
      const response: ReadingResponse = {
        request, answer: "Test answer", recommendation: "Test recommendation", cosmicNote: null,
        period: { start: "2026-10-15T00:00:00.000Z", end: "2026-11-15T00:00:00.000Z" },
        events: [], meta: { mode: "mock", calendarStatus },
      };
      await route.fulfill({ json: response });
    });

    await page.goto(baseURL);
    for (const [status, expected] of [
      ["unavailable", "The event calendar is unavailable, so this reading is based on your cards alone."],
      ["available", "No calendar events overlap this period, so this reading is based on your cards alone."],
    ] as const) {
      calendarStatus = status;
      await page.getByRole("button", { name: /Shuffle the deck/ }).click();
      await page.getByRole("button", { name: "Draw a face-down card, position 1", exact: true }).click();
      await page.getByRole("button", { name: "Draw a face-down card, position 2", exact: true }).click();
      await page.getByRole("button", { name: /Reveal your reading/ }).click();
      await page.getByText(expected, { exact: true }).waitFor();
      await page.getByRole("button", { name: "Start a new reading" }).click();
    }
  } finally {
    await browser.close();
  }
});

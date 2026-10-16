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

async function assertEveryCardIsReachable(page: Page, expectedFans: number) {
  const cards = page.locator(".card");
  await cards.first().waitFor();
  const centers = await cards.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top + rect.height / 2 + scrollY;
  }).sort((a, b) => a - b));
  const fanCenters: number[] = [];
  for (const center of centers) {
    if (!fanCenters.some((value) => Math.abs(value - center) < 45)) fanCenters.push(center);
  }
  const unreachable: string[] = [];
  for (let index = 0; index < await cards.count(); index += 1) {
    const card = cards.nth(index);
    await card.scrollIntoViewIfNeeded();
    await page.mouse.move(1, 1);
    const reachable = await card.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      for (let y = Math.max(0, rect.top); y <= Math.min(innerHeight - 1, rect.bottom); y += 4) {
        for (let x = Math.max(0, rect.left); x <= Math.min(innerWidth - 1, rect.right); x += 4) {
          if (document.elementFromPoint(x, y)?.closest(".card") === element) return true;
        }
      }
      return false;
    });
    if (!reachable) unreachable.push(await card.getAttribute("aria-label") ?? `position ${index + 1}`);
  }
  assert.deepEqual(unreachable, []);
  assert.equal(fanCenters.length, expectedFans);
}

async function openDraw(page: Page, options: { audience?: "Employee" | "Leadership"; question?: string; period?: string } = {}) {
  await page.getByRole("button", { name: options.audience ?? "Employee", exact: true }).click();
  await page.getByRole("button", { name: /Choose a question/ }).click();
  if (options.question) await page.getByRole("button").filter({ hasText: options.question }).click();
  await page.getByRole("button", { name: /Choose a time period/ }).click();
  if (options.period) await page.getByRole("button", { name: new RegExp(options.period) }).click();
  await page.getByRole("button", { name: /Shuffle the deck/ }).click();
  // Wait for the stage's focus handoff before sending the next keyboard action.
  await page.locator(".draw-instruction:focus").waitFor();
}

test("both audiences use the shared questions and lock fixed periods", { timeout: 90_000 }, async () => {
  const browser = await chromium.launch({ executablePath: process.env.TEST_BROWSER_PATH || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await page.route("**/api/nasa-events", (route) => route.fulfill({ json: { events: [] } }));
    await page.goto(baseURL);
    for (const audience of ["employee", "leadership"] as const) {
      await page.route("**/api/nasa-events", (route) => route.fulfill({ json: { events: [] } }));
    await page.goto(baseURL);
      await page.getByRole("button", { name: audience === "employee" ? "Employee" : "Leadership", exact: true }).click();
      await page.getByRole("button", { name: /Choose a question/ }).click();
      assert.equal(await page.getByRole("group", { name: "Choose a workplace question" }).getByRole("button").count(), 6);
      const questions = QUESTIONS.filter((item) => item.audience === audience);
      for (const [index, question] of questions.entries()) {
        await page.getByRole("button").filter({ hasText: question.label }).click();
        await page.getByRole("button", { name: /Choose a time period/ }).click();
        for (const period of PERIODS) {
          const button = page.getByRole("button", { name: new RegExp(period.label) });
          const allowed = question.allowedPeriodIds.some((id) => id === period.id);
          assert.equal(await button.isDisabled(), !allowed);
          if (question.allowedPeriodIds.length === 1 && allowed) assert.equal(await button.getAttribute("aria-pressed"), "true");
        }
        if (index < questions.length - 1) await page.getByRole("button", { name: "Back to question" }).click();
      }
    }
    await page.getByRole("button", { name: /Shuffle the deck/ }).click();
    assert.equal(await page.getByRole("button", { name: /Draw a face-down card/ }).count(), 32);
    await assertEveryCardIsReachable(page, 4);
    await page.getByRole("button", { name: "Draw a face-down card, position 1", exact: true }).press("Enter");
    await page.locator(".draw-instruction", { hasText: "Choose a card for what to do" }).waitFor();
    await page.getByRole("button", { name: "Draw a face-down card, position 2", exact: true }).press("Enter");
    await page.getByText("Ready to reveal your reading?", { exact: true }).waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>(".pair-card img")]
      .every((img) => img.complete && img.naturalWidth === 1024 && img.src.endsWith(".webp")));
    await assertFits(page);
  } finally {
    await browser.close();
  }
});

test("tablet fans keep every rotated card inside the draw panel", { timeout: 90_000 }, async () => {
  const browser = await chromium.launch({ executablePath: process.env.TEST_BROWSER_PATH || undefined });
  try {
    for (const width of [601, 760]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      await page.route("**/api/nasa-events", (route) => route.fulfill({ json: { events: [] } }));
    await page.goto(baseURL);
      await openDraw(page);
      await page.locator(".card").first().waitFor();
      await page.mouse.move(1, 1);
      const panel = await page.locator(".draw").boundingBox();
      assert.ok(panel);
      const bounds = await page.locator(".card").evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      }));
      for (const rect of bounds) {
        assert.ok(rect.left >= panel.x - 0.5);
        assert.ok(rect.right <= panel.x + panel.width + 0.5);
        assert.ok(rect.top >= panel.y - 0.5);
        assert.ok(rect.bottom <= panel.y + panel.height + 0.5);
      }
      await assertEveryCardIsReachable(page, 2);
      await assertFits(page);
      await page.close();
    }
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
      const reducedMotion = viewport.width === 390;
      const page = await browser.newPage({ viewport, reducedMotion: reducedMotion ? "reduce" : "no-preference" });
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
      await page.route("**/api/nasa-events", (route) => route.fulfill({ json: { events: [] } }));
    await page.goto(baseURL);
      const nasaRequests: unknown[] = [];
      await page.route("**/api/nasa-events", async (route) => {
        nasaRequests.push(route.request().postDataJSON());
        await route.fulfill({ json: { events: [{
          id: "nasa-fixture", name: "Fixture meteor shower", kind: "meteor-shower",
          date: "2026-10-21", endDate: "2026-10-22", visibility: "Northern Hemisphere; fixture only.",
          source: { name: "NASA Science", url: "https://science.nasa.gov/" },
        }, {
          id: "nasa-fixture-2", name: "Fixture lunar eclipse", kind: "lunar-eclipse",
          date: "2026-10-28", visibility: "Fixture visibility region.",
          source: { name: "NASA Science", url: "https://science.nasa.gov/" },
        }] } });
      });
      await assertFits(page);

      // Use keyboard activation for question, period, shuffle, and both card roles.
      await page.getByRole("button", { name: "Employee", exact: true }).press("Enter");
      await page.getByRole("button", { name: /Choose a question/ }).press("Enter");
      const question = page.getByRole("button").filter({ hasText: "Will my hard work be recognized?" });
      await question.focus();
      await page.keyboard.press("Enter");
      assert.equal(await question.getAttribute("aria-pressed"), "true");
      await page.getByRole("button", { name: /Choose a time period/ }).press("Enter");
      await page.getByRole("button", { name: /Next three months/ }).press("Enter");
      await page.getByRole("button", { name: /Shuffle the deck/ }).press("Enter");
      await assertEveryCardIsReachable(page, viewport.width === 390 ? 4 : 2);
      assert.equal(await page.getByRole("heading", { name: "Will my hard work be recognized?" }).count(), 1);
      assert.equal(await page.locator(".draw-instruction").textContent(), "Choose a card to read the situation");
      assert.equal(await page.locator(".draw-slots").count(), 0);
      const secondCard = page.getByRole("button", { name: "Draw a face-down card, position 2", exact: true });
      const stablePosition = await secondCard.evaluate((element) => { const rect = element.getBoundingClientRect(); return { x: rect.x, y: rect.y + scrollY, width: rect.width, height: rect.height }; });
      await page.getByRole("button", { name: "Draw a face-down card, position 1", exact: true }).press("Enter");
      const overlay = page.locator(".draw-overlay");
      await overlay.waitFor();
      await secondCard.evaluate((element) => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
      assert.equal(await page.locator(".card-chosen").count(), 0);
      assert.equal(requests.length, 0);
      await page.waitForTimeout(reducedMotion ? 250 : 1200);
      assert.equal(await overlay.isVisible(), true);
      const enlarged = await page.locator(".draw-overlay-card").boundingBox();
      assert.ok(enlarged);
      assert.ok(Math.abs(enlarged.x + enlarged.width / 2 - viewport.width / 2) < 2);
      assert.ok(Math.abs(enlarged.y + enlarged.height / 2 - viewport.height / 2) < 2);
      const face = page.locator(".draw-overlay-face");
      assert.deepEqual(await face.evaluate((image: HTMLImageElement) => ({ width: image.naturalWidth, height: image.naturalHeight, fit: getComputedStyle(image).objectFit })), { width: 1024, height: 1536, fit: "contain" });
      if (!reducedMotion) {
        const timing = await page.locator(".draw-overlay-card").evaluate((element) => {
          const animation = element.getAnimations()[0];
          const frames = (animation.effect as KeyframeEffect).getKeyframes();
          return { duration: Number(animation.effect!.getTiming().duration), dwell: (frames[3].computedOffset - frames[2].computedOffset) * Number(animation.effect!.getTiming().duration) };
        });
        assert.equal(timing.duration, 2288);
        assert.ok(Math.abs(timing.dwell - 1000) < 1);
        await page.waitForTimeout(300);
        assert.equal(await overlay.isVisible(), true);
        await page.locator(".draw-overlay-card").evaluate((element) => {
          const animation = element.getAnimations()[0];
          if (animation) animation.currentTime = Number(animation.effect!.getTiming().duration) - 10;
        });
        await page.waitForTimeout(20);
        const exiting = await page.locator(".draw-overlay-card").boundingBox();
        assert.ok(exiting && exiting.y >= viewport.height);
      }
      await page.locator(".draw-instruction", { hasText: "Choose a card for what to do" }).waitFor();
      const positionAfterDraw = await secondCard.evaluate((element) => { const rect = element.getBoundingClientRect(); return { x: rect.x, y: rect.y + scrollY, width: rect.width, height: rect.height }; });
      for (const key of ["x", "y", "width", "height"] as const) assert.ok(Math.abs(positionAfterDraw[key] - stablePosition[key]) < 0.1);
      assert.equal(await page.locator(".draw-instruction").textContent(), "Choose a card for what to do");
      await page.getByRole("button", { name: "Draw a face-down card, position 2", exact: true }).press("Space");
      await page.getByText("Ready to reveal your reading?", { exact: true }).waitFor();
      const answer = await page.locator(".pair-card strong").first().textContent();
      const recommendation = await page.locator(".pair-card strong").nth(1).textContent();
      const pair = page.locator(".pair-stage");
      const pairFonts = await pair.evaluate((element) => [
        getComputedStyle(element.querySelector("h2")!).fontFamily,
        getComputedStyle(element.querySelector(".pair-card-label")!).fontFamily,
        getComputedStyle(element.querySelector(".draw-instruction")!).fontFamily,
      ]);
      assert.equal(await pair.getByRole("heading", { level: 2 }).textContent(), "Will my hard work be recognized?");
      assert.equal(await pair.getByText("Next three months", { exact: true }).count(), 0);
      const layout = await pair.locator(".pair-card").evaluateAll((items) => items.map((item) => {
        const face = item.querySelector("img")!.getBoundingClientRect();
        const label = item.querySelector("h3")!.getBoundingClientRect();
        return { x: face.x, y: face.y, width: face.width, labelBottom: label.bottom };
      }));
      assert.ok(Math.abs(layout[0].y - layout[1].y) < 1);
      assert.ok(layout[1].x >= layout[0].x + layout[0].width);
      assert.ok(layout.every((item) => item.labelBottom < item.y));
      if (viewport.width === 1440) assert.equal(layout[0].width, 240);
      assert.equal(requests.length, 0);
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
      assert.equal(answer, cards.find((card) => card.id === requests[0].answerCardId)!.name);
      assert.equal(recommendation, cards.find((card) => card.id === requests[0].recommendationCardId)!.name);
      const readingContext = page.locator(".reading-context");
      assert.equal(await page.locator(".reading").getByRole("heading", { level: 2 }).textContent(), "Your reading");
      assert.equal(await readingContext.locator(".reading-question").textContent(), "Will my hard work be recognized?");
      assert.equal(await readingContext.locator(".reading-period").textContent(), "Next three months (October 15, 2026 – November 14, 2026)");
      assert.equal(await readingContext.getByText(/^(Your question|Question|Period)$/).count(), 0);
      assert.deepEqual(await page.locator(".reading-panel-copy h3").allTextContents(), [`Read the situation — ${answer}`, `What to do — ${recommendation}`]);
      assert.deepEqual(await page.locator(".reading-panel-card").allTextContents(), ["", ""]);
      assert.deepEqual(await page.locator(".reading-panel-card img").evaluateAll((images) => images.map((image) => image.getAttribute("alt"))), [answer, recommendation]);
      await page.getByText("Fixture event timing shapes this action.", { exact: false }).waitFor();
      assert.equal(await page.getByRole("link", { name: /Source: Fixture calendar/ }).getAttribute("href"), "https://example.com/calendar");
      await assertFits(page);

      await page.getByRole("heading", { name: "Look up — sky highlights" }).waitFor();
      assert.equal(await page.locator(".nasa-events .event-sources").count(), 0);
      assert.equal(await page.locator(".nasa-events .event-title").count(), 2);
      const nasaTitle = page.getByRole("link", { name: "Fixture meteor shower — NASA (opens in a new tab)" });
      assert.equal(await nasaTitle.getAttribute("href"), "https://science.nasa.gov/");
      assert.equal(await nasaTitle.getAttribute("target"), "_blank");
      assert.equal(await page.locator(".nasa-events .event-date").first().textContent(), "Peak: October 21, 2026 – October 22, 2026");
      assert.deepEqual(nasaRequests[0], { start: "2026-10-15T00:00:00.000Z", end: "2026-11-15T00:00:00.000Z" });
      assert.deepEqual(Object.keys(requests[1]).sort(), ["answerCardId", "periodId", "questionId", "recommendationCardId"]);
      const typography = await page.locator(".reading").evaluate((element) => {
        const question = getComputedStyle(element.querySelector(".reading-question")!);
        const heading = getComputedStyle(element.querySelector(".reading-panel-copy h3")!);
        const prose = getComputedStyle(element.querySelector(".reading-panel-copy p")!);
        return { questionSize: parseFloat(question.fontSize), headingSize: parseFloat(heading.fontSize), fonts: [question.fontFamily, heading.fontFamily, prose.fontFamily] };
      });
      assert.ok(typography.questionSize >= typography.headingSize);
      assert.deepEqual(typography.fonts, pairFonts);
      const activeStepColors = await page.locator('.step[aria-current="step"]').evaluate((element) =>
        [...element.querySelectorAll("span")].map((span) => getComputedStyle(span).color));
      assert.deepEqual(activeStepColors, ["rgb(224, 174, 85)", "rgb(224, 174, 85)"]);
      if (process.env.TEST_SCREENSHOTS) await page.locator(".reading").screenshot({ path: `/tmp/oracle-updated-final-${viewport.width}.png` });
      await assertFits(page);

      await page.getByRole("button", { name: "Start a new reading" }).press("Enter");
      assert.equal(await page.getByText("Sample reading", { exact: true }).count(), 0);
      await openDraw(page);
      mode = "live";
      await page.getByRole("button", { name: "Draw a face-down card, position 1", exact: true }).press("Enter");
      await page.locator(".draw-instruction", { hasText: "Choose a card for what to do" }).waitFor();
      await page.getByRole("button", { name: "Draw a face-down card, position 2", exact: true }).press("Enter");
      await page.getByText("Ready to reveal your reading?", { exact: true }).waitFor();
      await page.getByRole("button", { name: /Reveal your reading/ }).press("Enter");
      await page.locator("#reading-title").waitFor();
      assert.equal(await page.getByText("Personal reading", { exact: true }).count(), 0);
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

      await page.route("**/api/nasa-events", (route) => route.fulfill({ json: { events: [] } }));
    await page.goto(baseURL);
    for (const [status, expected] of [
      ["unavailable", "The event calendar is unavailable, so this reading is based on your cards alone."],
      ["available", "No calendar events overlap this period, so this reading is based on your cards alone."],
    ] as const) {
      calendarStatus = status;
      await openDraw(page);
      await page.getByRole("button", { name: "Draw a face-down card, position 1", exact: true }).press("Enter");
      await page.locator(".draw-instruction", { hasText: "Choose a card for what to do" }).waitFor();
      await page.getByRole("button", { name: "Draw a face-down card, position 2", exact: true }).press("Enter");
      await page.getByText("Ready to reveal your reading?", { exact: true }).waitFor();
      await page.getByRole("button", { name: /Reveal your reading/ }).click();
      await page.getByText(expected, { exact: true }).waitFor();
      await page.getByRole("button", { name: "Start a new reading" }).click();
    }
  } finally {
    await browser.close();
  }
});

test("back to question cancels shuffling and allows a fresh shuffle", { timeout: 30_000 }, async () => {
  const browser = await chromium.launch({ executablePath: process.env.TEST_BROWSER_PATH || undefined });
  try {
    const page = await browser.newPage({ reducedMotion: "no-preference" });
    await page.goto(baseURL);
    await page.getByRole("button", { name: /Choose a question/ }).click();
    await page.getByRole("button", { name: /Choose a time period/ }).click();
    for (let attempt = 0; attempt < 2; attempt++) {
      await page.getByRole("button", { name: "Shuffle the deck", exact: true }).press("Enter");
      assert.equal(await page.getByRole("button", { name: "Shuffling the deck…", exact: true }).isDisabled(), true);
      await page.getByRole("button", { name: "Back to question", exact: true }).press("Enter");
      // Wait beyond the cancelled shuffle deadline: no delayed jump to the deck.
      await page.waitForTimeout(1500);
      assert.equal(await page.locator("#question-title").isVisible(), true);
      assert.equal(await page.locator(".draw").count(), 0);
      assert.equal(await page.locator("#question-title:focus").count(), 1);
      await page.getByRole("button").filter({ hasText: "Will my hard work be recognized?" }).click();
      await page.getByRole("button", { name: /Choose a time period/ }).click();
      assert.equal(await page.getByRole("button", { name: "Shuffle the deck", exact: true }).isEnabled(), true);
    }
    await page.getByRole("button", { name: "Shuffle the deck", exact: true }).click();
    await page.locator(".draw-instruction:focus").waitFor();
    assert.equal(await page.locator("#draw-title").textContent(), "Will my hard work be recognized?");
    assert.equal(await page.locator(".card").count(), 32);
  } finally {
    await browser.close();
  }
});

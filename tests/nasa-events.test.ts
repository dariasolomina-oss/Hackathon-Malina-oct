import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getNasaSkyEvents, parseEclipsePage, parseMeteorPage } from "../src/server/nasa/events";
import { POST } from "../src/app/api/nasa-events/route";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/nasa/${name}.html`, import.meta.url), "utf8");
const period = { start: "2027-01-01T00:00:00.000Z", end: "2027-03-01T00:00:00.000Z" };
const fixtureFetch: typeof fetch = async (input) => {
  const url = String(input);
  const name = url.includes("OH2027") ? "eclipses-2027" : url.split("/").at(-2)!;
  try { return new Response(fixture(name)); } catch { return new Response("", { status: 404 }); }
};

test("real NASA summary anchors keep each eclipse's own date and type", () => {
  const events = parseEclipsePage(fixture("eclipses-2027"), 2027, "https://eclipse.gsfc.nasa.gov/OH/OH2027.html");
  assert.deepEqual(events.map(({ date, kind }) => [date, kind]), [
    ["2027-02-06", "solar-eclipse"], ["2027-02-20", "lunar-eclipse"], ["2027-07-18", "lunar-eclipse"],
    ["2027-08-02", "solar-eclipse"], ["2027-08-17", "lunar-eclipse"],
  ]);
  assert.equal(events[0].name, "Annular solar eclipse");
  assert.equal(parseEclipsePage('<a>2027 Feb 31: Total Solar Eclipse</a>', 2027, "test").length, 0);
});

test("real NASA Active rows use their explicit year, retaining both peak nights", () => {
  for (const [page, date, endDate] of [
    ["quadrantids", "2027-01-03", "2027-01-04"], ["orionids", "2026-10-21", "2026-10-22"],
    ["leonids", "2026-11-16", "2026-11-17"], ["geminids", "2026-12-13", "2026-12-14"],
    ["lyrids", "2027-04-22", "2027-04-23"], ["perseids", "2026-08-12", "2026-08-13"],
  ]) {
    const events = parseMeteorPage(fixture(page), page, "https://science.nasa.gov/");
    assert.equal(events.length, 1, page);
    assert.equal(events[0].date, date);
    assert.equal(events[0].endDate, endDate);
  }
  assert.deepEqual(parseMeteorPage('<p>Updated in 2027. Peak night: Jan 3-4</p>', "quadrantids", "test"), []);
  const ambiguous = '<tr><td>Active</td><td>Dec. 28, 2026 to Jan. 12, 2027 (Peak night: Jan 3-4)</td></tr>';
  assert.deepEqual(parseMeteorPage(ambiguous, "quadrantids", "test"), []);
});

test("NASA events combine all matching sources in chronological order", async () => {
  const events = await getNasaSkyEvents(period, fixtureFetch);
  assert.deepEqual(events.map((event) => event.date), ["2027-01-03", "2027-02-06", "2027-02-20"]);
  const upcoming = await getNasaSkyEvents({ start: "2026-10-16T00:00:00Z", end: "2027-10-16T00:00:00Z" }, fixtureFetch);
  assert.deepEqual(upcoming.map((event) => event.date), ["2026-10-21", "2026-11-16", "2026-12-13", "2027-01-03", "2027-02-06", "2027-02-20", "2027-04-22", "2027-07-18", "2027-08-02", "2027-08-17"]);
});

test("NASA filters peaks by overlap including second night, without inventing next-year recurrence", async () => {
  const events = await getNasaSkyEvents({ start: "2027-01-04T00:00:00Z", end: "2027-01-05T00:00:00Z" }, fixtureFetch);
  assert.equal(events[0].name, "Quadrantids meteor shower");
  assert.deepEqual(await getNasaSkyEvents({ start: "2027-01-05T00:00:00Z", end: "2027-01-06T00:00:00Z" }, fixtureFetch), []);
  const nextYear = await getNasaSkyEvents({ start: "2027-10-01T00:00:00Z", end: "2027-11-01T00:00:00Z" }, fixtureFetch);
  assert.deepEqual(nextYear, []);
});

test("a failed NASA source preserves events from healthy sources", async () => {
  const events = await getNasaSkyEvents(period, async (input, init) => {
    if (String(input).includes("eclipse.gsfc")) throw new Error("offline");
    assert.equal(init?.redirect, "error");
    return fixtureFetch(input, init);
  });
  assert.equal(events.length, 1);
  assert.equal(events[0].date, "2027-01-03");
});

test("NASA service rejects unbounded ranges without fetching and hides unavailable data", async () => {
  let calls = 0;
  const fail: typeof fetch = async () => { calls++; throw new Error("offline"); };
  assert.deepEqual(await getNasaSkyEvents({ ...period, end: "2029-01-01T00:00:00Z" }, fail), []);
  assert.equal(calls, 0);
  assert.deepEqual(await getNasaSkyEvents(period, fail), []);
  assert.ok(calls > 0);
});

test("NASA endpoint rejects invalid and overlong periods before calling sources", async () => {
  for (const body of [null, {}, { ...period, end: "2029-01-01T00:00:00Z" }, { ...period, extra: true }]) {
    const response = await POST(new Request("http://localhost/api/nasa-events", { method: "POST", body: JSON.stringify(body) }));
    assert.equal(response.status, 400);
  }
});

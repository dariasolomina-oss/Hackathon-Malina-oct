import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { importCalendarSources } from "../src/server/calendar/import-calendar";

const requestedYears = process.argv.slice(2).map(Number);
const years = requestedYears.length ? requestedYears : [2026, 2027, 2028];
if (years.some((year) => !Number.isInteger(year) || year < 2000 || year > 2100)) {
  throw new Error("Pass calendar years as integers, for example: 2026 2027 2028.");
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  return response.json();
}

async function main(): Promise<void> {
  const [retrogrades, moonPhases] = await Promise.all([
    Promise.all(years.map((year) => fetchJson(`https://zodiacs.org/api/v1/retrogrades/${year}.json`))),
    Promise.all(years.map((year) => fetchJson(`https://zodiacs.org/api/v1/moon-phases/${year}.json`))),
  ]);
  const snapshot = importCalendarSources({ retrogrades, moonPhases, retrievedAt: new Date().toISOString() });
  const outputDirectory = resolve("src/server/calendar/data");
  const outputPath = resolve(outputDirectory, "calendar-snapshot.v1.json");
  const temporaryPath = `${outputPath}.tmp`;
  await mkdir(outputDirectory, { recursive: true });
  try {
    await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    await rename(temporaryPath, outputPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
  console.log(`Imported ${snapshot.events.length} source-validated events covering ${snapshot.coverage[0].from} to ${snapshot.coverage.at(-1)?.to}.`);
}

void main();

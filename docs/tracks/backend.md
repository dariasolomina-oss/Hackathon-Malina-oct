# Backend track

Read `AGENTS.md`, `docs/product.md`, and `docs/architecture.md` first.

## Own

- `src/server/`
- `src/domain/`
- `src/app/api/readings/`
- `tests/` and shared contract changes coordinated with the frontend owner

## Build

Replace the calendar and oracle providers behind `src/server/providers/types.ts`. Verify an external event source, preserve attribution, and cache verified data. Keep calendar failures distinguishable from a covered period with no events.

Connect a live AI provider using server-only credentials. Supply the question, exact card roles and meanings, resolved period, and selected events. Validate generated output, set explicit timeouts, and retain the current response shape. Set oracle mode to `live` only when live generation is actually used. Use editorial examples from `src/content/oracle-voice.md` to shape the prompt.

Document needed environment-variable names in `.env.example`, with placeholders only. Coordinate new dependencies with the integration owner. Do not silently fall back to the mock oracle after an AI error.

## Work without the interface

Run `npm run dev` and call the example request in `docs/architecture.md` using an HTTP client or the curl command in the README. Tests can inject providers and a fixed date directly into `createReading`.

## Done when

Real responses use the exact two cards and supplied dated events, unavailable calendars produce honest card-only readings, and AI failures produce retryable errors. Add meaningful provider validation tests, run `npm run check` and `npm run build`, and share a real sample with the other tracks.

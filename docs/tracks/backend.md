# Backend track

Read `AGENTS.md`, [product scope](../product.md), and [architecture](../architecture.md) first. Current implementation status is in [the backend status](../backend-plan.md), and contributor setup is in [the backend handoff](../backend-handoff.md). Backend work uses `track/backend`.

## Owned areas

- `src/server/`
- `src/domain/`
- `src/app/api/readings/`
- `tests/` and shared contract changes coordinated with frontend/content owners

## Completed

- Twelve question IDs with authoritative audience and `allowedPeriodIds` metadata.
- Rolling 1-, 3-, and 12-month UTC periods with month-end and leap-day handling.
- Server rejection of the six invalid fixed-period combinations.
- Per-reading Zodiacs.org API retrieval with no runtime cache, a five-second total deadline, validated import, full-range coverage checks, cross-year interval joining, and deterministic event selection.
- Explicit mock/live provider selection and a server-only OpenAI Responses API adapter using Structured Outputs.
- Fixed answer/recommendation card roles, verified event references, server-formatted dates, bounded timeout, zero SDK retries, and controlled public errors.
- Complete no-network route/service verification for all 36 question-period combinations, including card roles, audience, offline fixture overlap, unavailable calendar behavior, keyless live mode, and sanitized 503 responses. Provider tests cover uncached repeat calls, year boundaries, malformed and incomplete data, deadlines, cancellation, and no stale fallback.

## Contract to preserve

Keep the existing `POST /api/readings` fields and derive audience from the validated question ID. A reading always uses two distinct cards: the first is the answer, and the second is the recommendation. Report `meta.mode: "live"` only for the live provider. Calendar failure may return a card-only reading with `calendarStatus: "unavailable"`; oracle failure must return `READING_FAILED` and must not switch to mock text.

Event dates and names must come from the validated API response fetched for that reading. The public event objects retain raw normalized boundaries. Cosmic timing prose may clip an interval to the reading period, but must not present that reading boundary as an astronomical station date. The checked 2026–2028 JSON is only an offline fixture and refresh utility.

Every source retrograde interval must overlap its declared year coverage. The API can supply full station-to-station intervals crossing a year boundary, as well as clipped segments; preserve verified full dates and merge overlapping segments after validation. Intervals wholly outside the source year make the calendar unavailable.

## Pending cross-track work

- The content owner's 32-card manifest is integrated. Preserve its names, IDs, image paths, and meanings; content editorial review remains open.
- The integrated frontend consumes `getQuestion(...).allowedPeriodIds`, locks fixed periods, displays resolved dates and exact attribution, and retries with the same cards.
- The deployment owner configures server-only environment variables, outbound Zodiacs.org access, a hosting timeout above 25 seconds, and platform-level request/spending controls. An in-memory counter is not a global serverless limit.
- Three live gateway smoke readings succeeded. Evaluate twelve real live samples before treating latency, cost, and editorial quality as verified.

## Final checks

Run `npm run check` and `npm run build`. Verify the integrated 32 unique cards, image paths, meanings, and two-card role consistency. Review valid live readings for all twelve questions across both audiences and all three periods, including a year-crossing annual range.

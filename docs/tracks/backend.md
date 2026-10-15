# Backend track

Read `AGENTS.md`, [product scope](../product.md), and [architecture](../architecture.md) first. The implementation sequence and setup checklist are in [the backend development plan](../backend-plan.md). Backend work uses `track/backend`.

## Own

- `src/server/`
- `src/domain/`
- `src/app/api/readings/`
- `tests/` and shared contract changes coordinated with frontend/content owners

## Migrate the shared foundation

- Replace the four starter question IDs with the twelve target IDs in the product scope. Store an audience and an allowed-period rule for every question in a shared catalog.
- Keep the HTTP request field structure unchanged. Derive Employee/Leadership from the validated question ID; do not trust a separate free-form role or question label from the client.
- Add `one-year` as twelve calendar months using existing UTC/month-end conventions. The current two-way month calculation must become explicit for all three options.
- Enforce fixed periods: `employee-jira-hours` and `leadership-company-outlook` require `one-year`; `leadership-changing-priorities` requires `three-months`. Return HTTP 400/`INVALID_REQUEST` for mismatches.
- Replace provisional card validation with the agreed 32-card manifest, preserving distinct answer and recommendation roles. Do not invent the missing card identities.
- Coordinate the ID migration with frontend defaults, content, tests, and API examples in one integrated change.

## Connect providers

Replace the calendar and oracle providers behind `src/server/providers/types.ts`. Verify and cache event data covering the entire chosen range, including every year touched by a rolling annual period. Validate source schemas, deduplicate cross-year events, preserve attribution, and distinguish unavailable coverage from an available empty calendar. Do not treat a clipped source boundary as a real station date.

For annual readings, select a small relevant set across the full range instead of only the first three events. Keep the response concise and the draw at two cards for every period.

Supply audience, exact question, dates, card roles/meanings, and selected events to the AI. Employee prompts focus on personal work; Leadership prompts focus on company-level choices. No real customer or company data is available: do not invent company-specific facts or actual customer identities. Use editorial examples from `src/content/oracle-voice.md`.

Validate generated output, keep credentials server-only, set bounded timeouts, and retain the public response shape. Report live mode only for genuine live generation. Never silently replace a failed live call with sample text.

## Work without the interface

Use the target request example in the architecture document once the ID migration is implemented. Until then, the README's legacy example still runs against the current starter. Tests can inject providers and dates directly into `createReading`.

## Done when

Validate all 36 question-period combinations: 30 are accepted, and six violate fixed-period rules and must be rejected. Verify the 32-card catalog, two-card uniqueness, leap-day annual ranges, multi-year coverage, audience-specific prompting, provider failures, and exact card-role preservation. Run `npm run check` and `npm run build`, then share real samples for both audiences and all three periods with the team.

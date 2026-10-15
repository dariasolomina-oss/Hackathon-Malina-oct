# Backend development plan

Branch: `track/backend`, based on the shared `main` foundation.

This is an implementation plan. The current application still uses a mock oracle and an unavailable calendar. The settings and modules proposed below are not implemented yet.

## Outcome

First coordinate the revised question/period IDs and the shared 32-card manifest, then replace the two providers while preserving the HTTP field structure. A valid request should produce a concise English reading based on the exact answer card, the exact recommendation card, and verified events overlapping the selected period.

## Updated requirements

The source of truth is [product.md](product.md): two audiences with six exact questions each, periods of 1/3/12 months, and one shared 32-card deck. The Jira-hours and company-outlook questions are fixed to a year; changing priorities is fixed to three months. The other nine questions allow all periods. Derive audience from the question catalog and validate allowed periods on the server.

The final card identities are pending the content owner's manifest. Do not assume the deck is 22 Major Arcana plus ten new cards. Update catalog validation, images, and tests together once agreed.

## Already available in the current foundation

- `POST /api/readings` with request validation and public error responses.
- A provisional catalog of 22 cards with separate answer and recommendation meanings; migration to the agreed 32-card deck is required.
- One-, three-, and twelve-month calculation with month-end clamping and leap-day tests.
- The twelve target questions, authoritative audience metadata, and fixed-period request validation.
- Overlap selection for events, including retrogrades already in progress.
- Injectable provider interfaces and foundation tests.
- A frontend that preserves card selection when retrying a failed request.

We do not need a new backend service, database, login flow, vector store, or agent framework for this MVP.

## Preparation

| Item | Action | Needed for |
| --- | --- | --- |
| Local tools | Use Node 22, run `npm ci`, then `npm run check` | All development |
| AI account | Use an OpenAI API project with available API quota and a project API key | First live reading |
| Local secrets | Store the key in ignored `.env.local`; never commit it or paste it into chat | Server-side authentication |
| Model | Choose an available text model supporting structured output; record its exact ID in configuration after a small quality/latency check | Consistent live behavior |
| Calendar | Start with one verified source, normalize its data, and retain attribution | Dated cosmic notes |
| Deployment | The frontend/integration owner configures the same server-only environment variables on the hosting platform | Shared demo |
| Editorial input | Use existing card meanings and voice examples now; incorporate content-track revisions later | Prompt quality |

Proposed configuration, to be added to `.env.example` when the implementation actually reads it:

```dotenv
ORACLE_MODE=mock
OPENAI_API_KEY=
OPENAI_MODEL=
```

`ORACLE_MODE=live` will require a valid key and model. Missing credentials in live mode should produce a configuration failure, not silently return sample text. No `NEXT_PUBLIC_` prefix belongs on any secret.

We will add the official `openai` SDK when implementing the provider and coordinate the dependency/lockfile change with the integration owner. Keep one model call per reading; do not enable browsing or other tools in the oracle request.

## Calendar feasibility check: October 15, 2026

Direct requests from the development machine returned HTTP 200 and JSON for:

- [Zodiacs.org retrogrades for 2026](https://zodiacs.org/api/v1/retrogrades/2026.json): 11 records, declared coverage from January 1, 2026 to January 1, 2027, CC BY 4.0, attribution required.
- [CosmyDay upcoming events](https://api.cosmyday.com/events/upcoming?days=90&min_importance=60): response contains coverage, timezone, count, and event fields.

This verifies endpoint accessibility and basic structure, not independent astronomical accuracy or all event types. Use Zodiacs.org as the first integration candidate. Keep CosmyDay as an alternative rather than implementing two providers at once.

The 2026 retrograde file clips some intervals at year boundaries and marks them with `clippedStart`/`clippedEnd`. Those boundaries must not be described as actual retrograde station dates. A rolling twelve-month reading can span two calendar years. Verify all necessary yearly files, preserve real station boundaries, and deduplicate overlapping segments before marking the full period covered.

## Development sequence

| Step | Work | Completion evidence |
| --- | --- | --- |
| 0. Shared scope migration | Add the twelve question IDs, audience/allowed-period metadata, and annual date calculation; reject fixed-period mismatches; synchronize the agreed 32-card manifest with frontend/content owners | All valid question-period combinations work, invalid ones fail, and the deck matches the agreed manifest |
| 1. Configuration and live card-only reading | Add explicit mock/live selection, a server-only AI client, a basic prompt, and structured response parsing | A real request returns the expected three text fields with `meta.mode: live` |
| 2. Verified calendar snapshot | Validate source data, normalize dates, preserve sources/coverage, and save a small reusable snapshot covering supported demo dates | Known dates and cross-year ranges return the correct overlapping events |
| 3. Combined oracle | Supply audience, card roles, meanings, exact question, dates, and up to three selected events; incorporate the editorial voice | One coherent reading uses both cards and references only supplied events |
| 4. Reliability | Add bounded timeouts, malformed-output handling, provider error mapping, and metadata-only diagnostics | Failures are controlled and retryable; a failed AI call never turns into a sample |
| 5. Integration and handoff | Verify both audiences, all twelve questions, all three periods and fixed-period rules, and the shared deployed endpoint with the frontend owner | The full live journey works from the shared URL |

Target: shared question/period migration and steps 1-3 on day 1; steps 4-5 and prompt refinement on day 2. The content owner can prepare the 32-card manifest in parallel; use clearly provisional existing cards for provider development until it is agreed. Get the first real card-only reading working before spending time on advanced event selection.

## Calendar implementation approach

Use a checked snapshot as the initial runtime source, with an explicit refresh/import script. This avoids calling a calendar service on every reading and works with read-only deployment filesystems. Store retrieval time, source attribution, coverage, and normalized events. Never claim coverage beyond what was verified.

Start with retrogrades and new/full moons. Add a small selection of relevant Venus/Jupiter aspects if their source data can be verified within the schedule; these support positive timing suggestions. A missing retrograde alone does not establish a favorable period. A larger aspect catalog and sophisticated ranking are optional.

For each request: confirm coverage of the full range (up to twelve months), select overlapping events, deduplicate them across files, rank a small set by workplace relevance, and attach curated symbolic meanings. Annual selection must consider the full range instead of merely taking the first three chronological events. No events in a covered period is different from unavailable coverage.

## Oracle implementation approach

Use the Responses API with a structured output schema for `answer`, `recommendation`, and nullable `cosmicNote`. Validate the result with Zod and handle refusal, incomplete responses, and empty/invalid fields. Structured formatting does not guarantee factual correctness.

The prompt must keep the first card as the answer and the second as advice, use English office humor, avoid guaranteed outcomes, and use only supplied event facts. Pass authoritative audience metadata: Employee means personal work and daily routines; Leadership means company-level strategy, customers, growth, and motivation. Do not invent real customers or internal company facts. Do not let the model choose new cards, calculate planets, invent dates, or reinterpret API metadata as instructions.

For traceability, consider internal event references selected from the supplied event IDs; validate those references before constructing the unchanged public response. Exact event names and dates should be formatted from source data. Manually evaluate the meaning of the generated prose as well: an ID or schema check cannot prove that a claim is supported.

Use a maximum server request budget below the browser's existing 30-second timeout. Start with an AI timeout around 20 seconds and explicitly bounded SDK retries. Tune against observed latency rather than assuming a model will always be fast.

## Files to change

- `src/server/providers/oracle.ts`: provider selection; keep the mock available for frontend development.
- New modules under `src/server/` for configuration, the live AI adapter, response validation, and the oracle prompt.
- `src/server/providers/calendar.ts` and a server-owned snapshot directory: validated calendar implementation.
- `scripts/refresh-calendar.ts`: proposed offline import/refresh entry point.
- `src/domain/period.ts`: explicit 1/3/12-month resolution and leap-day behavior.
- `src/domain/events.ts`: annual-range selection, relevance ranking, and deduplication.
- `src/contracts/catalog.ts`, request validation, and `src/content/questions.ts`: coordinated ID/metadata migration.
- `src/content/cards.ts` and artwork: content-owner changes coordinated with shared 32-card validation.
- `src/server/reading-service.ts` and `src/app/api/readings/route.ts`: controlled integration and errors.
- `tests/`: provider validation, failure, and grounding checks.
- `.env.example`, `package.json`, and the lockfile: coordinated setup changes only.

The new scope explicitly requires a coordinated question/period/card ID migration in `src/contracts`. Preserve the HTTP field structure and synchronize frontend defaults, content, fixtures, and examples; after that migration keep the agreed identifiers stable. Content contributors own artwork and editorial catalogs; consume those files rather than duplicating them in the backend.

## Validation and readiness

Keep the existing nine tests and add cases for invalid source payloads, missing coverage, clipped/year-crossing intervals, duplicate events, missing live configuration, timeouts, refusal/incomplete model output, invalid event references, and no-event readings. Automated tests should use injected fakes and fixtures, not paid live calls.

Test all 36 question-period combinations without paid calls: 30 valid and six invalid because of fixed-period restrictions. Validate exactly 32 unique catalog entries once the manifest is agreed. Manually review at least twelve live examples, one per question, distributing the flexible questions across all three periods and obeying fixed-period rules. Include an annual range spanning two calendar years and verify audience-specific tone. Check card roles, relevance, English tone, length, supplied dates, and absence of unsupported predictions. Record observed latency and usage. Run `npm run check` and `npm run build` before handoff.

For the shared demo, verify available API quota, server-only configuration, request limits appropriate to the deployment, and hosting timeout settings. A local memory counter is not a reliable global spending limit on serverless hosting. Keep logs to request IDs, status, duration, and usage rather than credentials or full prompt bodies.

## First implementation task

First migrate the question catalog, audience metadata, fixed-period validation, and annual date calculation with the frontend owner. Then add provider configuration and one live card-only reading behind the existing endpoint. Confirm and integrate the full 32-card manifest with the content owner when available. The user needs to prepare an API project/key; calendar normalization and tests can proceed independently while that is being configured.

## References

- [OpenAI API quickstart](https://developers.openai.com/api/docs/quickstart)
- [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Zodiacs.org developer documentation](https://zodiacs.org/developers/)
- [CosmyDay API documentation](https://cosmyday.com/api-docs)

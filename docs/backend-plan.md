# Backend implementation status

Branch: `track/backend`, based on the shared `main` foundation.

This document records completed backend work and the remaining integration dependencies as of October 15, 2026. The source of truth for product behavior remains [product.md](product.md), and setup details for other contributors are in [backend-handoff.md](backend-handoff.md).

## Implemented

- The shared catalog contains twelve questions, authoritative audience metadata, three rolling periods, and the three fixed-period rules.
- Request validation accepts 30 question-period combinations and rejects the six incompatible combinations with HTTP 400 and `INVALID_REQUEST`.
- Period calculation uses UTC start-inclusive/end-exclusive ranges for 1, 3, or 12 calendar months, including month-end and leap-day clamping.
- The runtime calendar uses a checked Zodiacs.org snapshot with 103 normalized retrograde and new/full-moon events covering 2026–2028. It makes no runtime calendar network calls.
- Calendar import validates schemas, full-year coverage, station boundaries, duplicates, and attribution. It joins clipped cross-year retrograde segments before runtime use.
- Event selection includes intervals already in progress, excludes the end boundary, and spreads annual selections across the full range.
- Explicit `mock` and `live` oracle modes are available. Live mode uses the official OpenAI SDK, the Responses API, Structured Outputs, no tools, zero SDK retries, and a 20-second request budget.
- The live prompt receives the derived audience, exact question, resolved dates, fixed card roles and meanings, and only selected verified events.
- Model event references are checked against supplied IDs. The server formats event names and dates, and invalid, incomplete, refused, or timed-out output fails safely.
- Calendar failure produces an explicitly marked card-only reading. Live configuration or provider failure returns HTTP 503 and `READING_FAILED`; it never switches to mock output or exposes provider details.

Automated no-network coverage exercises the complete route and service path for all 36 question-period combinations with an injected fake live oracle. It also covers calendar gaps, keyless live configuration, provider failures, prompt grounding, output validation, timeout behavior, cross-year event import, and annual selection.

Verification on October 15, 2026: all 33 automated tests and the production build passed. A running production server in explicit mock mode returned HTTP 200 for all 30 valid combinations, HTTP 400 for all six incompatible combinations, and HTTP 400 for malformed JSON and duplicate cards. The page returned HTTP 200. No paid API requests were made.

## Configuration

Mock mode is the default and needs no credentials:

```dotenv
ORACLE_MODE=mock
```

Live mode requires server-only variables:

```dotenv
ORACLE_MODE=live
OPENAI_API_KEY=
OPENAI_MODEL=gpt-6-luna
```

Do not use a `NEXT_PUBLIC_` prefix for the key. A missing key in live mode is a controlled configuration failure. The deployment request timeout must exceed the oracle's 20-second budget so the route can return its own controlled error.

## Calendar data

The checked snapshot is sourced from Zodiacs.org and licensed under CC BY 4.0. Display this exact attribution whenever calendar data is shown:

`Data: Zodiacs.org — https://zodiacs.org`

Refresh the snapshot offline with:

```bash
npm run calendar:refresh -- 2026 2027 2028
```

Review generated changes before committing them. The public `events` array retains raw source event boundaries. For a retrograde that begins before or ends after a reading, the server-rendered `cosmicNote` clips its displayed active range to the reading period without presenting that clipped boundary as a planetary station date.

## Remaining dependencies

- The content owner must deliver the final 32-card manifest and artwork. The current 22-card catalog is provisional. Card IDs, meanings, images, contract validation, and deck tests must migrate together; backend contributors must not invent the missing cards.
- The frontend owner must finish audience grouping, fixed-period controls, resolved-date and attribution display, retry with the same two cards, final integration, and deployment.
- A project key is still required for live verification. No real sample, latency, token use, cost, or editorial quality result has been measured yet. Review at least one valid period per question after a key is available.
- The deployment owner must configure request and spending controls appropriate to the hosting platform. An in-memory request counter would not be a reliable global limit on serverless or multi-instance hosting.
- The shared hosting timeout must be longer than 20 seconds, and available OpenAI quota must be checked before the demo.

## Validation checklist

Before final handoff, run:

```bash
npm run check
npm run build
```

After the final manifest arrives, verify 32 unique card IDs, artwork paths, meanings, two-card uniqueness, and role consistency. After a project key is configured, manually verify twelve live readings across both audiences and all three periods, including a rolling annual range that crosses a year boundary. Record latency and token usage without logging credentials or full prompts.

## References

- [Backend handoff](backend-handoff.md)
- [Architecture and HTTP contract](architecture.md)
- [Backend track](tracks/backend.md)
- [OpenAI API quickstart](https://developers.openai.com/api/docs/quickstart)
- [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Zodiacs.org developer documentation](https://zodiacs.org/developers/)

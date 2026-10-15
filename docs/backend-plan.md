# Backend implementation status

Backend work from `track/backend` is integrated into `main`.

This document records completed backend work and the remaining integration dependencies as of October 15, 2026. The source of truth for product behavior remains [product.md](product.md), and setup details for other contributors are in [backend-handoff.md](backend-handoff.md).

## Implemented

- The shared catalog contains twelve questions, authoritative audience metadata, three rolling periods, and the three fixed-period rules.
- Request validation accepts 30 question-period combinations and rejects the six incompatible combinations with HTTP 400 and `INVALID_REQUEST`.
- Period calculation uses UTC start-inclusive/end-exclusive ranges for 1, 3, or 12 calendar months, including month-end and leap-day clamping.
- Every reading fetches Zodiacs.org retrograde and moon-phase files for all UTC years touched by its range, with `cache: "no-store"` and one five-second deadline covering requests and JSON parsing.
- Calendar import validates schemas, requested years, full-year coverage, station boundaries, duplicates, and attribution. It joins clipped cross-year retrograde segments before selection. Any source failure returns unavailable data with no cache or snapshot fallback.
- Event selection includes intervals already in progress, excludes the end boundary, and spreads annual selections across the full range.
- Explicit `mock` and `live` oracle modes are available. Live mode uses the official OpenAI SDK, the Responses API, Structured Outputs, no tools, zero SDK retries, and a 20-second request budget.
- The live prompt receives the derived audience, exact question, resolved dates, fixed card roles and meanings, and only selected verified events.
- Model event references are checked against supplied IDs. The server formats event names and dates, and invalid, incomplete, refused, or timed-out output fails safely.
- Calendar failure produces an explicitly marked card-only reading. Live configuration or provider failure returns HTTP 503 and `READING_FAILED`; it never switches to mock output or exposes provider details.

Automated no-network coverage exercises the complete route and service path for all 36 question-period combinations with injected calendar and oracle dependencies. Calendar provider tests cover repeated uncached calls, end-exclusive year calculation, normalization, cross-year joining, HTTP and malformed responses, wrong years, incomplete coverage, total deadlines, sibling cancellation, stale-data avoidance, and bounded fan-out. Oracle tests cover keyless live configuration, provider failures, prompt grounding, output validation, and timeout behavior.

Verification on October 15, 2026: automated checks and the production build passed without making external or paid API requests. Separately, one direct provider smoke check fetched a year-crossing 2026–2027 range from Zodiacs.org successfully in 228 ms and found three overlapping Mercury intervals. Three live gateway readings completed in 3.140–4.230 seconds total each with grounded output, using 2,833 input and 545 output tokens in aggregate. These are observed checks, not latency or quality guarantees.

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

Do not use a `NEXT_PUBLIC_` prefix for the key. A missing key in live mode is a controlled configuration failure. The deployment request timeout must exceed 25 seconds so the route has room for the calendar's five-second budget followed by the oracle's 20-second budget and can return controlled errors.

## Calendar data

Runtime data is fetched from Zodiacs.org for every reading and is licensed under CC BY 4.0. Display this exact attribution whenever calendar data is shown:

`Data: Zodiacs.org — https://zodiacs.org`

The checked JSON is only an offline test fixture and review aid. Refresh it with:

```bash
npm run calendar:refresh -- 2026 2027 2028
```

Review generated changes before committing them. The public `events` array retains raw source event boundaries. The live model uses only timing overlapping the reading period and writes both complete paragraphs with broad temporal language. Event names and exact dates remain in calendar metadata; the server validates references and appends no prose.

## Remaining dependencies

- The content owner's Employee and Leadership answer/recommendation meanings are integrated. The remaining content work is the oracle examples and demo story; the 32-card manifest and artwork are already integrated.
- The integrated frontend implements audience grouping, fixed-period controls, resolved dates, attribution, and retry. Shared deployment remains open.
- Three live gateway samples have been measured. Cost and broad editorial quality remain unverified; review at least one valid period per question.
- The deployment owner must configure request and spending controls appropriate to the hosting platform. An in-memory request counter would not be a reliable global limit on serverless or multi-instance hosting.
- The shared hosting timeout must be longer than 25 seconds, outbound access to Zodiacs.org must be available, and OpenAI quota must be checked before the demo.

## Validation checklist

Before final handoff, run:

```bash
npm run check
npm run build
```

The integrated catalog checks cover 32 unique card IDs, matching names and artwork paths, meanings, two-card uniqueness, and role consistency. Manually verify twelve live readings across both audiences and all three periods, including a rolling annual range that crosses a year boundary. Record latency and token usage without logging credentials or full prompts.

## References

- [Backend handoff](backend-handoff.md)
- [Architecture and HTTP contract](architecture.md)
- [Backend track](tracks/backend.md)
- [OpenAI API quickstart](https://developers.openai.com/api/docs/quickstart)
- [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Zodiacs.org developer documentation](https://zodiacs.org/developers/)

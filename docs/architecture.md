# Architecture

## Application and data flow

One Next.js 16 application uses React 19 and TypeScript for the interface and a Node server route for readings. There is no database, authentication system, or separate backend service. Card content is stored in versioned files; credentials stay in server environment variables.

```mermaid
flowchart LR
  UI[Question, period, sequential card draw, pair review] --> API[POST /api/readings]
  API --> Service[Validate and resolve dates]
  Cards[Audience-specific card meanings] --> Service
  Service --> Calendar[Fetch and select calendar events]
  Calendar --> Oracle[Live AI or explicit mock provider]
  Oracle --> Result[Validate output and return reading]
  Result --> UI
```

| Area | Responsibility |
| --- | --- |
| `src/features/reading/` and `src/app/` | Question controls, shuffled deck, result, page styling, and HTTP entry point |
| `src/contracts/catalog.ts` | Question and card IDs, audiences, period metadata, and card types |
| `src/contracts/reading.ts` | Request validation and response types |
| `src/content/` and `public/cards/` | Audience labels, 32 cards with audience-specific meanings, and 33 WebP assets |
| `src/domain/` | Shuffling, calendar-month arithmetic, and event selection |
| `src/server/` | Reading orchestration, calendar retrieval, AI configuration, prompt, and output validation |
| `tests/` | Offline contract/provider tests and browser journeys |

Browser modules must not import server modules. The production prompt is defined in `src/server/oracle-prompt.ts`; the editorial rules are in [product.md](product.md).

## Typography

Bodoni Moda is used for headings, question text, and card titles, with Bodoni 72, Didot, and Georgia fallbacks. Inter Tight is used for body text, buttons, cues, summaries, and navigation, with Avenir Next, Avenir, and Arial fallbacks. The local Witch font is reserved for “Malina” in the wordmark. Shared CSS font variables keep the draw, pair, and reading screens consistent.

## Reading pipeline

The browser uses a Fisher–Yates shuffle with `Math.random()` once per new deck. Click order assigns **Read the situation** and **What to do** roles. Desktop uses two curved fans of 16 cards; phones use four fans of eight. A draw keeps every card in its shuffled position, leaves a gap, and shows the selected face in a viewport-fixed overlay before moving it below the viewport. Input stays locked through that sequence. Reduced-motion mode shows the face without spatial movement for a short pause. After the second card exits, a selected-pair stage replaces the deck; only its reveal button requests a reading. Retrying preserves the ordered selection but makes a new reading request. Restarting or leaving the component cancels pending draw work. This entertainment app validates card IDs and uniqueness; it does not prevent a caller from deliberately choosing another valid pair.

The server derives the audience from the validated question ID. It selects the answer meaning of the first card and recommendation meaning of the second card for that audience. Other audience meanings are not sent to the model.

Periods start at midnight UTC on the request date and end after 1, 3, or 12 calendar months, clamping month ends and leap days. Ranges include the start and exclude the end. The interface shows the last included date. Fixed-period questions and exact labels are documented in [product.md](product.md).

## Calendar

Every reading, including mock readings, requests these Zodiacs.org endpoints for each UTC year touched by the period:

- `https://zodiacs.org/api/v1/retrogrades/{year}.json`
- `https://zodiacs.org/api/v1/moon-phases/{year}.json`

Requests run concurrently with `cache: "no-store"`; one five-second deadline covers retrieval and parsing. The importer validates schemas, requested years, coverage, station boundaries, and duplicates, and joins cross-year intervals. A source or validation failure returns `calendarStatus: "unavailable"` with no events. There is no runtime snapshot fallback.

Selection keeps at most three events overlapping the reading range, including intervals already in progress. Candidates are ranked by curated workplace relevance, with Mercury ranked highest. Each next selection prefers an unused planet or moon-phase type. Ranges of at least 180 days apply this preference within each of three time buckets to preserve coverage across the period; a bucket may repeat a family if it has no alternative. The response also carries `availableEvents`, the deduplicated chronological list of all verified events overlapping the requested period for the expandable calendar. The interface initially shows the selected three events; `View all events` reveals the full list and `Show fewer events` restores the selection without another API request. The AI receives only the selected `events` subset. Symbolic workplace interpretations are curated in the importer; they are not scientific forecasts.

The checked calendar snapshot and `calendar-fixture.ts` are used by offline tests, not the production route. To refresh the fixture intentionally:

```bash
npm run calendar:refresh -- 2026 2027 2028
```

Review the changed data before committing. Public event metadata retains source dates. The interface lists names, start dates, and source links, and displays `Data: Zodiacs.org — https://zodiacs.org` for CC BY 4.0 attribution.

## NASA sky highlights

The final screen requests NASA sky highlights through a separate `/api/nasa-events` route after the reading response arrives. The route fetches allowlisted NASA Eclipse Web Site annual pages and NASA Science meteor-shower pages with a shared four-second deadline, bounds requests to at most one year, parses only explicitly dated eclipse or meteor peak entries, and returns every verified matching event in chronological order. The interface shows the nearest three first and lets users expand the full returned list. Failed sources are omitted while successful sources remain. Meteor peaks use only the explicit year in the published Active row; dates are never repeated into an unpublished future year. Overnight peaks retain both dates. There is no snapshot fallback or guarantee of complete year-ahead meteor coverage. This payload is rendered independently and is never passed to the oracle prompt, so NASA availability cannot change recommendations or make a reading fail. Source links retain NASA provenance and visibility wording is broad because no observer location is collected.

## Oracle

`ORACLE_MODE=mock` is the default. It uses deterministic sample text from card meanings and, if available, the first selected event. It is visibly labeled and does not reproduce the live model's prose style.

Live mode uses the Responses API with Structured Outputs through the OpenAI SDK. `OPENAI_API_KEY` is required; `OPENAI_MODEL` defaults to `gpt-6-luna`. `OPENAI_BASE_URL` optionally selects an OpenAI-compatible gateway and must be an HTTPS URL without embedded credentials, query, or fragment. Model availability is provider-specific. Setup is in [How to Run](../README.md#how-to-run).

Each call has a 20-second timeout, no SDK retries or tools, `store: false`, and a 1,200-output-token limit. Logs contain status, duration, and usage rather than prompts or credentials.

The model receives the audience, exact question, resolved dates, card names and role-specific meanings, and selected events with dates, interpretations, and sources. It writes both complete paragraphs with broad temporal language. The internal structured output has `answer`, `recommendation`, and nullable `cosmicReferences` containing `{ eventId }` objects. Validation checks non-empty bounded text and unique, known event IDs overlapping the reading period. Events require at least one reference; no events require null references.

The server trims outer whitespace but does not append or rewrite prose. Live responses retain `cosmicNote: null` for public contract compatibility; the interface renders `answer` and `recommendation`. Reference validation does not prove that every claim or timing phrase is semantically correct. The T1A-only scope and style are prompt rules and still need editorial testing. A failed live call returns an error, never a mock reading.

## HTTP API

`POST /api/readings` accepts JSON:

```json
{
  "questionId": "employee-performance-review",
  "periodId": "three-months",
  "answerCardId": "the-adaptability",
  "recommendationCardId": "the-reflection"
}
```

Example request against a running local app:

```bash
curl http://localhost:3000/api/readings \
  -H 'Content-Type: application/json' \
  -d '{"questionId":"employee-performance-review","periodId":"three-months","answerCardId":"the-adaptability","recommendationCardId":"the-reflection"}'
```

| Response field | Meaning |
| --- | --- |
| `answer`, `recommendation` | Text shown as Read the situation and What to do |
| `cosmicNote` | Compatibility field; null in live mode, may contain text in mock mode |
| `request` | Validated question, period, and ordered card IDs |
| `period` | Resolved UTC `start` and exclusive `end` |
| `events` | Up to three selected events supplied to the oracle, with dates, interpretation, and source |
| `availableEvents` | All verified events overlapping the period, deduplicated and chronological; optional for older clients |
| `meta.mode` | `mock` or `live` |
| `meta.calendarStatus` | `available` or `unavailable` |

- `200`: reading generated. An available but empty calendar and an unavailable calendar both allow card-only output, with different explanatory UI messages.
- `400`: `INVALID_REQUEST` for malformed JSON, extra fields, unknown IDs, duplicate cards, or incompatible question/period choices.
- `503`: `READING_FAILED` for configuration or oracle failure; the user can retry with the same cards.

Errors have shape `{ "error": { "code": "...", "message": "..." } }`. The browser request timeout is 30 seconds. Shared types in `src/contracts/reading.ts` are the implementation source of truth.

## Deployment

Use a Node-capable Next.js host; static-only hosting cannot execute the reading route. Configure the server environment from `.env.example`, allow outbound HTTPS to the calendar and AI provider, and set the hosting request timeout above 25 seconds to cover both provider budgets. Configure request and spending limits at the hosting/provider level before a public live demo; the application does not implement authentication or rate limiting.

Build and verification commands are in the [README](../README.md). A shared deployment URL has not been documented. Current verified behavior and planned product development are summarized in the [project write-up](project-overview.md).

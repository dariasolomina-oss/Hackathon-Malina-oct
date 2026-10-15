# Hackathon Malina: Corporate Oracle

A playful corporate oracle that combines two tarot cards with dated astrological events to answer workplace questions with humor.

Starting token: `ODYSSEY-2026-UNLEASH-THE-GODS`

## User journey

1. Choose Employee or Leadership, then one of its six questions and an allowed time period (one month, three months, or one year).
2. Draw two different cards from one shared 32-card deck: one answers the question, the other suggests what to do.
3. Read a short AI-generated interpretation with relevant calendar events woven into the story.

The cards establish the story; astrological events add timing and atmosphere. This is an entertainment experience, not a factual prediction.

## Project status

Runnable Next.js + TypeScript foundation for a two-day, three-person hackathon. The complete interaction works with placeholder artwork and a clearly labeled mock oracle. Every reading fetches source-validated calendar events from Zodiacs.org, including mock-oracle readings. The live OpenAI oracle is implemented, fake-tested, and has passed three limited gateway smoke tests. Final artwork and deployment remain track work.

The application contract now contains the twelve target questions, two audiences, three periods, and fixed-period validation. The interface migration is still in progress, and the final 32-card manifest is pending; the runnable starter continues to use 22 provisional cards.

Backend implementation and integration details are summarized in the [backend handoff](docs/backend-handoff.md). Automated checks cover the live-provider boundary with no-network fakes. Three live smoke readings verified the gateway path; the full twelve-question editorial review and cost evaluation remain pending.

## Run locally

Use Node.js 22 or later. If you use nvm, run `nvm use` first.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. No API key or environment file is needed for the default mock oracle.

```bash
npm run check
npm run build
npm start
```

`check` runs TypeScript validation and foundation tests. Tests inject offline calendar fixtures and do not call Zodiacs.org. `start` serves the production build after `build` succeeds.

## Live oracle

Copy `.env.example` to `.env.local`, set `ORACLE_MODE=live`, and add a server-side `OPENAI_API_KEY`. `OPENAI_MODEL` defaults to `gpt-6-luna`. The direct OpenAI API is the default; set the optional server-only `OPENAI_BASE_URL` for an OpenAI-compatible gateway. Use an exact model ID returned by that gateway's `/models` endpoint. Live mode makes one Responses API call with Structured Outputs, no tools, no SDK retries, and a 20-second timeout. A missing key or failed live request returns `READING_FAILED`; it never falls back to mock text. Gateway usage and billing are governed by the gateway, independently of OpenAI's public model pricing.

## Try the API independently

With the development server running:

```bash
curl http://localhost:3000/api/readings \
  -H 'Content-Type: application/json' \
  -d '{"questionId":"employee-project-deadline","periodId":"one-month","answerCardId":"the-tower","recommendationCardId":"the-magician"}'
```

The response reports `meta.mode: "mock"`. The server still requests calendar data for the resolved period. A source failure, invalid response, incomplete coverage, or five-second calendar deadline returns a card-only reading with `meta.calendarStatus: "unavailable"`.

## Calendar data

Each reading fetches retrograde and moon-phase files for every UTC year touched by its start-inclusive/end-exclusive range. Requests run concurrently with `cache: "no-store"` under one five-second deadline. The importer validates schemas, requested years, full-year coverage, station boundaries, duplicates, and source attribution before events become available. There is no runtime cache or snapshot fallback.

The checked 2026–2028 JSON remains an offline fixture for tests and source review. Refresh that fixture with `npm run calendar:refresh -- 2026 2027 2028`, then review generated changes before committing them.

Calendar data is licensed under CC BY 4.0. Attribution: [Data: Zodiacs.org](https://zodiacs.org).

## Project documents

- [Product scope](docs/product.md)
- [Team workflow](docs/team.md)
- [Architecture and API contract](docs/architecture.md)
- [Frontend assignment](docs/tracks/frontend.md)
- [Backend assignment](docs/tracks/backend.md)
- [Backend integration handoff](docs/backend-handoff.md)
- [Content and artwork assignment](docs/tracks/content.md)
- [Codex repository instructions](AGENTS.md)

All repository content and product copy are written in English.

# Hackathon Malina: Corporate Oracle

A playful corporate oracle that combines two tarot cards with dated astrological events to answer workplace questions with humor.

Starting token: `ODYSSEY-2026-UNLEASH-THE-GODS`

## User journey

1. Choose Employee or Leadership, then one of its six questions and an allowed time period (one month, three months, or one year).
2. Draw two different cards from one shared 32-card deck: one answers the question, the other suggests what to do.
3. Read a short AI-generated interpretation with relevant calendar events woven into the story.

The cards establish the story; astrological events add timing and atmosphere. This is an entertainment experience, not a factual prediction.

## Project status

Runnable Next.js + TypeScript foundation for a two-day, three-person hackathon. The complete interaction works with placeholder artwork and a clearly labeled mock oracle. A checked calendar snapshot supplies source-validated events for 2026–2028. The live OpenAI oracle is implemented and fake-tested but has not been exercised with a project key. Final artwork and deployment remain track work.

The application contract now contains the twelve target questions, two audiences, three periods, and fixed-period validation. The interface migration is still in progress, and the final 32-card manifest is pending; the runnable starter continues to use 22 provisional cards.

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

`check` runs TypeScript validation and foundation tests. `start` serves the production build after `build` succeeds.

## Live oracle

Copy `.env.example` to `.env.local`, set `ORACLE_MODE=live`, and add a server-side `OPENAI_API_KEY`. `OPENAI_MODEL` defaults to `gpt-6-luna`. Live mode makes one OpenAI Responses API call with Structured Outputs, no tools, no SDK retries, and a 20-second timeout. A missing key or failed live request returns `READING_FAILED`; it never falls back to mock text. The integration is covered with no-network fakes; a real live response still needs verification with an available project key.

## Try the API independently

With the development server running:

```bash
curl http://localhost:3000/api/readings \
  -H 'Content-Type: application/json' \
  -d '{"questionId":"employee-project-deadline","periodId":"one-month","answerCardId":"the-tower","recommendationCardId":"the-magician"}'
```

The response reports `meta.mode: "mock"`. For ranges fully inside 2026–2028, `meta.calendarStatus` is `"available"`; ranges outside that snapshot are `"unavailable"` and remain card-only. Runtime requests never call an external calendar service.

## Calendar snapshot

The checked snapshot contains retrograde intervals and exact new/full-moon instants from Zodiacs.org. Refresh it offline with `npm run calendar:refresh -- 2026 2027 2028`, then review and commit the generated JSON. The importer validates schemas, full-year coverage, station boundaries, duplicates, and source attribution before replacing the snapshot atomically.

Calendar data is licensed under CC BY 4.0. Attribution: [Data: Zodiacs.org](https://zodiacs.org).

## Project documents

- [Product scope](docs/product.md)
- [Team workflow](docs/team.md)
- [Architecture and API contract](docs/architecture.md)
- [Frontend assignment](docs/tracks/frontend.md)
- [Backend assignment](docs/tracks/backend.md)
- [Content and artwork assignment](docs/tracks/content.md)
- [Codex repository instructions](AGENTS.md)

All repository content and product copy are written in English.

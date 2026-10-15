# Hackathon Malina: Corporate Oracle

A playful corporate oracle that combines two tarot cards with dated astrological events to answer workplace questions with humor.

Starting token: `ODYSSEY-2026-UNLEASH-THE-GODS`

## User journey

1. Choose Employee or Leadership, then one of its six questions and an allowed time period (one month, three months, or one year).
2. Draw two different cards from one shared 32-card deck: one answers the question, the other suggests what to do.
3. Read a short AI-generated interpretation with relevant calendar events woven into the story.

The cards establish the story; astrological events add timing and atmosphere. This is an entertainment experience, not a factual prediction.

## Project status

Runnable Next.js + TypeScript foundation for a two-day, three-person hackathon. The complete interaction works with placeholder artwork and a clearly labeled mock oracle. Live AI, verified event data, final artwork, and deployment remain track work.

The updated target scope is documented in [product scope](docs/product.md). Application code has not yet migrated: it still uses four ungrouped questions, two periods, and 22 placeholder cards. The final 32-card manifest is pending. Three target questions have fixed periods, as defined in the product scope.

## Run locally

Use Node.js 22 or later. If you use nvm, run `nvm use` first.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. No API key or environment file is needed for the starter.

```bash
npm run check
npm run build
npm start
```

`check` runs TypeScript validation and foundation tests. `start` serves the production build after `build` succeeds.

## Try the API independently

Legacy starter example (still valid before the revised IDs are implemented), with the development server running:

```bash
curl http://localhost:3000/api/readings \
  -H 'Content-Type: application/json' \
  -d '{"questionId":"project","periodId":"one-month","answerCardId":"the-tower","recommendationCardId":"the-magician"}'
```

The response reports `meta.mode: "mock"` and `meta.calendarStatus: "unavailable"`. This is intentional. The starter makes no external AI or calendar requests.

## Project documents

- [Product scope](docs/product.md)
- [Team workflow](docs/team.md)
- [Architecture and API contract](docs/architecture.md)
- [Frontend assignment](docs/tracks/frontend.md)
- [Backend assignment](docs/tracks/backend.md)
- [Content and artwork assignment](docs/tracks/content.md)
- [Codex repository instructions](AGENTS.md)

All repository content and product copy are written in English.

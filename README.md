# Hackathon Malina: Corporate Oracle

A playful corporate oracle that combines two tarot cards with dated astrological events to answer workplace questions with humor.

Starting token: `ODYSSEY-2026-UNLEASH-THE-GODS`

## User journey

1. Choose a workplace question and a time period.
2. Draw two different cards: one answers the question, the other suggests what to do.
3. Read a short AI-generated interpretation with relevant calendar events woven into the story.

The cards establish the story; astrological events add timing and atmosphere. This is an entertainment experience, not a factual prediction.

## Project status

Runnable Next.js + TypeScript foundation for a two-day, three-person hackathon. The complete interaction works with placeholder artwork and a clearly labeled mock oracle. Live AI, verified event data, final artwork, and deployment remain track work.

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

With the development server running:

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

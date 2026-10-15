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

## Frontend browser checks

Install the test browser once with `npx playwright install chromium`. Run `npm run build` and `npm start`, then run `npm run test:browser` in a second terminal. The browser suite uses the existing Node test runner with Playwright to exercise the rendered journey at 390px and 1440px widths: keyboard activation, card roles, loading, failed requests, retries with the same cards, restart, resolved dates, event attribution, and mock/live labels. API responses are test fixtures; this does not verify a live AI integration.

The server defaults to `http://localhost:3000`; set `TEST_BASE_URL` for another local port. `TEST_BROWSER_PATH` can select an existing Chromium executable. Browser tests require permission to launch Chromium and connect to the local server.

Also inspect the journey visually at phone and desktop sizes and check focus visibility and keyboard navigation manually. On October 15, 2026, the user reported both browser tests passing locally at 390px and 1440px. Manual visual and keyboard acceptance remain pending. Type checking, all 11 existing tests, and the production build also passed.

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

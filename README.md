# Corporate Oracle

A playful workplace oracle for T1A, built by team **Malina**. Choose a question, draw two cards, and receive a reading that combines their meanings with real astrological calendar data. Built with Next.js, React, and TypeScript for a two-day hackathon.

Read the [short project write-up](docs/project-overview.md) for the problem, what we built, how it works, what is working, and what comes next.

Starting token: `ODYSSEY-2026-UNLEASH-THE-GODS`

## How to Run

### Requirements

- Node.js 22 or later and npm. With nvm installed, run `nvm use` in the repository.
- Internet access for dependency installation, Zodiacs.org calendar data, NASA sky highlights, and Google Fonts. Live readings also require a model API key; neither calendar integration needs a key.

### Start locally

```bash
git clone https://github.com/dariasolomina-oss/Hackathon-Malina-oct.git
cd Hackathon-Malina-oct
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without environment configuration, the app uses **mock mode**: deterministic text labeled “Sample reading,” with no paid AI calls. It still fetches real calendar data; if the calendar is unavailable, the reading works from the cards alone. Existing `.env.local` settings can select live mode instead.

### Enable AI readings

For a fresh setup, copy `.env.example` to `.env.local` (preserve the file if you already have one):

```bash
cp .env.example .env.local
```

Edit these settings locally, then restart the server:

```dotenv
ORACLE_MODE=live
OPENAI_API_KEY=your-project-api-key
OPENAI_MODEL=your-provider-model-id
# Optional: use an OpenAI-compatible gateway instead of the direct OpenAI API.
# OPENAI_BASE_URL=https://gateway.example/api/v1
```

Use a model available to your account that supports the Responses API, Structured Outputs, and the configured `reasoning.effort: "none"` option. The application's default model is `gpt-6-luna`; set the exact model ID offered by your provider. Keep credentials server-side in `.env.local`, which is ignored by Git. Everyone using the same running server uses its configured key and provider budget. A separate local checkout needs its own environment configuration for live mode. Each live reading, including a retry, makes a paid API request. A live AI failure shows an error and keeps your selected cards for retry.

### Try the experience

1. Choose Employee or Leadership, a question, and an allowed period.
2. Shuffle the deck and draw two cards in order: **Read the situation**, then **What to do**.
3. Review the selected pair, then reveal the oracle. The result shows your question, period and dates, both cards, and the two reading paragraphs.
4. Explore **In the cosmic calendar** and, when published events are available, **Look up — sky highlights** from NASA. Each list starts with up to three events; **View all events** expands it without another AI call.

### Production build

```bash
npm run build
npm start
```

This starts the production app at [http://localhost:3000](http://localhost:3000). Deployment needs a Node-capable host; see [deployment requirements](docs/architecture.md#deployment).

## Checks

```bash
npm run check
```

Runs TypeScript validation and automated tests with offline fixtures and fake AI responses. No API credentials or paid calls are needed.

For browser tests, first run the production app using the commands above. In another terminal:

```bash
npx playwright install chromium
npm run test:browser
```

Set `TEST_BASE_URL` for another port, or `TEST_BROWSER_PATH` to use an installed Chrome executable. Browser tests intercept both reading and NASA responses and do not call the AI or live calendar providers.

## Documentation

- [Project write-up](docs/project-overview.md): problem, solution, working features, and next steps.
- [Product rules](docs/product.md): questions, periods, deck, and reading style.
- [Architecture](docs/architecture.md): data flow, API, integrations, and deployment.
- [Team responsibilities](docs/team.md): ownership and contribution workflow.
- [Codex instructions](AGENTS.md): repository conventions.

For entertainment and reflection. Astrological calendar data: [Zodiacs.org](https://zodiacs.org), licensed under CC BY 4.0. Sky highlights link to their NASA sources and are displayed separately from the oracle interpretation.

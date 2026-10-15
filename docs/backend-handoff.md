# Backend handoff

The backend contract, calendar snapshot, and configurable oracle are ready for frontend, content, and deployment integration. Automated tests use fakes and make no paid API calls. Real live output has not been verified because no project key was available.

## Frontend integration

Import `QUESTIONS` or use `getQuestion(questionId)` from `src/contracts/catalog.ts`. Each question supplies `audience` and `allowedPeriodIds`. For a fixed-period question, select its only allowed ID and disable the period control. Do not infer the period from label text.

The fixed rules are:

- `employee-jira-hours` → `one-year`
- `leadership-company-outlook` → `one-year`
- `leadership-changing-priorities` → `three-months`

All other questions allow `one-month`, `three-months`, and `one-year`. The server rejects mismatches instead of substituting a period.

Send the two revealed cards in click order and keep them unchanged on retry:

```json
{
  "questionId": "employee-jira-hours",
  "periodId": "one-year",
  "answerCardId": "the-tower",
  "recommendationCardId": "the-magician"
}
```

A successful response follows this shape:

```json
{
  "answer": "...",
  "recommendation": "...",
  "cosmicNote": null,
  "request": {
    "questionId": "employee-jira-hours",
    "periodId": "one-year",
    "answerCardId": "the-tower",
    "recommendationCardId": "the-magician"
  },
  "period": {
    "start": "2026-10-15T00:00:00.000Z",
    "end": "2027-10-15T00:00:00.000Z"
  },
  "events": [],
  "meta": {
    "mode": "mock",
    "calendarStatus": "available"
  }
}
```

Display mock results as samples. `meta.mode: "live"` is returned only by the configured live provider. If `meta.calendarStatus` is `"unavailable"`, explain that the reading is card-only; an empty `events` array with `"available"` means the period was covered but no event was selected. Whenever calendar data is displayed, show:

`Data: Zodiacs.org — https://zodiacs.org`

The `events` array contains raw normalized event dates. A retrograde may start before or end after the resolved reading period. The server-generated `cosmicNote` clips the displayed active range to the reading dates. Use `period` as the authoritative range shown to the user.

HTTP 400 with `INVALID_REQUEST` means the selection is invalid. HTTP 503 with `READING_FAILED` is retryable with the same cards. Do not replace a failed live response with sample text.

## Content integration

The final 32-card manifest is still pending. The current 22 cards are provisional. Deliver stable IDs, names, image paths, answer meanings, and recommendation meanings together. Coordinate one migration across `src/contracts/catalog.ts`, `src/content/cards.ts`, artwork files, and tests. Preserve exactly two distinct roles: answer first, recommendation second.

## Deployment setup

Mock mode needs no environment file. Live mode requires server-only `ORACLE_MODE=live`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL` (default `gpt-6-luna`). Keep the key out of browser variables, version control, logs, and chat.

Set the hosting request timeout above 20 seconds so the oracle can time out and return a controlled 503. Configure platform-level request and spending controls before enabling a public live demo; an in-memory counter is not global across serverless instances. Confirm project quota and use a Node-capable deployment because a static host cannot run `POST /api/readings`.

No live sample, latency, token usage, cost, or quality result is verified yet. Once a key is available, review twelve valid live readings, covering both audiences and all three periods, before presenting live mode as demo-ready.

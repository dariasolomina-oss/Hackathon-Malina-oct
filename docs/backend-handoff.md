# Backend handoff

The backend contract, request-time calendar provider, and configurable oracle are ready for frontend, content, and deployment integration. Every reading calls Zodiacs.org, including readings using the mock oracle. Automated tests inject offline fixtures and make no external or paid API calls. Three limited live gateway smoke tests have also succeeded; the full editorial review remains pending.

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

Mock mode needs no environment file. Live mode requires server-only `ORACLE_MODE=live`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL` (default `gpt-6-luna`). It uses the direct OpenAI API by default. For an OpenAI-compatible gateway, also set `OPENAI_BASE_URL`; the application accepts only HTTPS URLs without embedded credentials, queries, or fragments. Keep all credentials out of browser variables, version control, logs, and chat.

For example, use `OPENAI_BASE_URL=https://gateway.example/api/v1`. Set `OPENAI_MODEL` to an exact ID returned by the gateway's authenticated `/models` endpoint; `gpt-6-luna` was present in the corporate gateway response verified on October 15, 2026. Gateway availability, quotas, and billing are separate from OpenAI's public model list and pricing.

Allow outbound HTTPS access to Zodiacs.org. Each reading makes concurrent uncached calendar requests under one five-second deadline; failures produce an explicitly card-only result and never use the checked fixture as a fallback. Set the hosting request timeout above 25 seconds so the calendar and subsequent 20-second oracle budgets can expire cleanly. Configure platform-level request and spending controls before enabling a public live demo; an in-memory counter is not global across serverless instances. Confirm project quota and use a Node-capable deployment because a static host cannot run `POST /api/readings`.

Live verification on October 15, 2026 used `gpt-6-luna` through the configured gateway and real calendar API data:

| Question | Period | End-to-end latency | Input / output tokens |
| --- | --- | --- | --- |
| Employee project deadline | One month | 4.230 s | 936 / 202 |
| Leadership changing priorities | Three months | 3.690 s | 949 / 168 |
| Leadership company outlook | One year | 3.140 s | 948 / 175 |

The Employee sample exercised the reading service; both Leadership samples exercised the running production HTTP endpoint. All returned live mode and an available calendar. Manual review confirmed card-role meanings, audience context, English office humor, supplied event references, and timing clipped to the reading period. These three observations do not establish a latency or quality guarantee. The gateway reported 3,378 total tokens but no pricing; the exact charge must be checked in its usage/billing dashboard. The full twelve-question editorial review remains pending.

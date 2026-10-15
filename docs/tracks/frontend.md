# Frontend track

Read `AGENTS.md`, [product scope](../product.md), and [architecture](../architecture.md) first. The question table in the product scope is the source of truth for labels and allowed periods.

## Own

- `src/features/reading/`
- `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`
- Root tooling and deployment configuration, as the integration owner

## Build

1. Add the Employee/Leadership choice before question selection. Show exactly the selected audience's six questions.
2. Offer `one-month`, `three-months`, and `one-year` for flexible questions. Automatically set and lock the period for the three fixed-period questions: Jira hours and company outlook use a year; changing priorities uses three months.
3. Clear stale question/card/result state when starting a different audience or question flow. Keep selections locked during an active reading, or provide an explicit restart.
4. Render one shared 32-card deck with two reveals in fixed order: answer, then recommendation. Do not hardcode the current 22-card count or create separate audience decks.
5. Refine loading, retry, result presentation, and mobile/keyboard interactions. A failed request must retry with the same pair.

Use the agreed shared catalog and `requestReading`. The request continues to carry question ID, period ID, and the two card IDs; the backend derives audience from the question. Keep the sample-mode label until a response reports live mode. Display the resolved dates, source attribution, and an honest card-only state when calendar coverage is unavailable.

## Coordinate

This scope update requires a coordinated migration of shared question/period IDs; the 32-card manifest is already integrated. After migration, do not independently rename IDs or change request/response fields. The current starter still has four questions and two periods.

Keep visual changes out of server/domain/API files. Coordinate any card image path changes with the content owner and contract changes with the backend owner. Preserve the integrated card IDs and display role labels without repeating printed card names.

## Done when

Both audiences show the correct six labels; all flexible and fixed period paths behave correctly; the agreed deck contains 32 cards; two-card roles and retry behavior are preserved. Verify role switching and stale-selection prevention, then run `npm run check`, `npm run build`, and a browser journey on mobile and desktop. Establish the shared deployment and document it in the README.

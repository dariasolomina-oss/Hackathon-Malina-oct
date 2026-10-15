# Complete the Frontend Reading Experience

## Overview

Finish and integrate the frontend question-to-reading journey. Existing changes already add a new visual design, responsive layouts, card roles, loading and retry states, restart behavior, resolved dates, and event-source links. Review those changes against the frontend assignment, address remaining gaps, and verify mock and live response compatibility while preserving other contributors' changes.

## Context

- Files involved: `src/features/reading/ReadingExperience.tsx`, `src/features/reading/client.ts`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `README.md`, and relevant tests under `tests/`.
- Related patterns: Use `requestReading` and shared types in `src/contracts/reading.ts`. The first distinct card is the answer; the second is the recommendation. Display mock mode clearly, show the server-resolved period and event-source attribution, and keep server modules out of browser code.
- Ownership: Frontend owns the listed UI files and root integration configuration. Do not change `src/server/`, `src/domain/`, API routes, shared card IDs, or content assets as visual work. Coordinate required shared-contract, artwork-dimension, or API changes with their owners.
- Existing changes: `src/app/globals.css`, `src/app/layout.tsx`, and `src/features/reading/ReadingExperience.tsx` contain uncommitted frontend edits. Review and extend them in place; preserve unrelated and concurrent work.
- Dependencies: No new dependencies are indicated. The project provides `npm run check` and `npm run build`.

## Development Approach

- **Testing approach**: Regular (review and complete the implementation, then run project checks).
- Complete each task before moving to the next.
- Keep changes within frontend ownership and use the existing shared request and response contract.
- Add or update relevant automated coverage for each code task using existing project test patterns; do not introduce a new test framework for presentation-only checks.
- Run `npm run check` and `npm run build` after code changes. Browser inspection at mobile and desktop sizes is part of post-completion verification.

## Implementation Steps

### Task 1: Review and complete the reading journey

**Files:**
- Modify: `src/features/reading/ReadingExperience.tsx`
- Modify: `src/features/reading/client.ts`
- Modify or create: relevant tests under `tests/`

- [x] Compare setup, draw, consult, loading, failure, retry, result, and restart behavior with the frontend assignment.
- [x] Keep retries bound to the same question, period, and two distinct cards; preserve answer and recommendation order.
- [x] Confirm mock responses remain visibly labeled and failed live requests show an error rather than sample text.
- [x] Confirm the result displays the server-resolved period, relevant event details and source attribution, and correct behavior when the calendar is unavailable or empty.
- [x] Fix frontend gaps without changing the shared API contract.
- [x] Add or update automated coverage for frontend-owned behavior where supported by existing test patterns.
- [x] Run `npm run check`; require it to pass before Task 2.

### Task 2: Refine responsive and accessible presentation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx` only if needed
- Modify: `src/features/reading/ReadingExperience.tsx` only if needed
- Modify or create: relevant tests under `tests/`

- [x] Review styling at narrow and wide viewport sizes and fix layout issues in setup, deck, actions, and reading result.
- [x] Confirm question choices and card draws work with keyboard controls and expose selection, roles, loading, and errors accessibly.
- [x] Preserve reduced-motion handling and visible focus styles.
- [x] Check metadata, external event-source links, and image labels against the rendered experience.
- [x] Add or update automated coverage for any changed frontend logic.
- [x] Run `npm run check`; require it to pass before Task 3.

### Task 3: Integrate setup documentation and verify acceptance

**Files:**
- Modify: `README.md` only if setup or demo instructions need updating
- Modify frontend-owned files identified in Tasks 1–2 if verification finds a defect
- Modify or create: relevant tests under `tests/`

- [x] Confirm browser code imports no modules from `src/server/`.
- [x] Confirm the frontend works with the shared mock response and supports live responses using the existing contract.
- [x] Update README instructions if frontend setup or demo behavior changed (no update needed; current instructions match the demo).
- [x] Run `npm run check` and `npm run build`.

### Task 4: Update documentation

**Files:**
- Modify relevant project documentation if observed frontend behavior, setup, or ownership boundaries changed.

- [x] Record proposed or unverified integrations honestly; README and architecture docs state that live AI, verified event data, and deployment remain unconfigured or unverified.
- [x] Update relevant documentation for any behavior or setup changes (no additional setup or behavior changes from this review required documentation updates).

## Post-Completion

- Inspect the full journey in a browser at mobile and desktop sizes, including retry and restart behavior.
- Manually confirm keyboard interaction and presentation against the frontend assignment.

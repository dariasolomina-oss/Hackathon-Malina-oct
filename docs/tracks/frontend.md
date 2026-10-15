# Frontend track

Read `AGENTS.md`, `docs/product.md`, and `docs/architecture.md` first.

## Own

- `src/features/reading/`
- `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`
- Root tooling and deployment configuration, as the integration owner

## Build

Refine question selection, the two-card reveal, loading and retry states, and the reading display. The current interface is a functional development scaffold, not the final design. Use `requestReading` and the shared contracts. The backend's mock response is sufficient to work independently.

Show the cards in their fixed roles. Retry a failed reading with the same pair. Preserve the visible mock-mode label until the backend reports live mode. Display the resolved period and event-source attribution.

## Coordinate

Do not change `src/server`, `src/domain`, API routes, or shared IDs as part of visual work. Coordinate image dimensions with the content owner and API changes with the backend owner.

## Done when

The journey works on mobile and desktop, supports keyboard interaction, handles loading/failure/retry/restart, and can switch from mock to live responses without UI changes. Run `npm run check` and `npm run build`, then manually check the journey. Establish the shared deployment and document it in the README.

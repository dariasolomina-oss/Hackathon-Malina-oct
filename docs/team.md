# Team workflow

## Parallel workstreams

The runnable foundation and fixed boundaries are documented in [architecture.md](architecture.md). Start from the same integrated base commit, then use separate branches such as `track/frontend`, `track/backend`, and `track/content`. Task briefs are in [tracks/frontend.md](tracks/frontend.md), [tracks/backend.md](tracks/backend.md), and [tracks/content.md](tracks/content.md).

| Owner | Responsibility | Independent starting point |
| --- | --- | --- |
| Technical contributor 1 | Interface, card reveal interaction, result display, integration, and deployment | Placeholder cards and a sample response |
| Technical contributor 2 | Card selection, event calendar, AI integration, response format, and error handling | Fixed sample inputs without the interface |
| Content contributor | Card artwork, deck back, card meanings, oracle voice examples, copy review, and demo story | One reference card and a short reading example |

Technical contributor 1 owns the final integrated build. Technical contributor 2 owns the data exchange format and production oracle prompt. The content contributor supplies examples and editorial feedback for that prompt.

## Updated shared scope

Both audiences use one 32-card deck and two draws. Employee and Leadership each have six exact questions. Periods are one month, three months, and one year, with three fixed-period exceptions defined in [product.md](product.md).

Backend owns shared validation, audience derivation, annual calculation, and calendar coverage. Frontend owns audience/question selection and period locking. The content owner supplied the integrated 32-card composition, meanings, and artwork, and preserves the supplied question labels. Other owners coordinate technical IDs, paths, and fixtures, not approval of creative decisions.

## Agree before splitting work

- Use the twelve exact questions and allowed periods from the product scope; integrate the 32-card manifest supplied by Developer 3.
- Input and output fields between the interface and reading logic, with one sample request and response.
- Illustration dimensions, file naming, and a shared visual reference.
- Repository areas owned by each contributor and the owner of shared configuration.

The shared contract, frontend, and backend use the twelve question identifiers, audience metadata, three periods, and fixed-period rules. Preserve those identifiers. The supplied 32-card deck and artwork are integrated; keep card labels in the interface and preserve the agreed card IDs when changing assets or meanings.

## Current handoff status

The backend contract, per-reading Zodiacs.org API provider, live OpenAI adapter, validation, and failure handling are implemented and covered with no-network fakes. Three limited live gateway readings also succeeded. The checked calendar JSON remains only an offline fixture. Frontend and content contributors should use [backend-handoff.md](backend-handoff.md) for fixed-period metadata, request/response fields, attribution, and retry behavior. Deployment must allow the five-second calendar budget plus the 20-second oracle budget. The final 32-card manifest, frontend migration, deployment, and full live-output review remain open.

## Working with Codex

Give each contributor's Codex chat the same product scope, its assigned area, and a concrete completion criterion. Use separate branches and local checkouts; use separate worktrees when multiple chats share one computer.

Integrate small completed changes several times a day. Coordinate changes to shared files before editing them. Do not wait for finished artwork or live calendar integration to connect the interface to the reading service.

## Two-day checkpoints

| Checkpoint | Expected result |
| --- | --- |
| First 45 minutes | Agree scope, data format, card IDs, ownership, and one visual reference |
| Day 1, first half | Clickable interface with samples; first real AI response; first artwork and voice examples |
| End of day 1 | Integrated question-to-cards-to-AI flow on a shared URL |
| Day 2, first half | Final assets, improved readings, mobile layout, and error handling |
| Final 3-4 hours | Fixes, stability checks, and demo rehearsal; no new features |

At each checkpoint, check both audiences, exact question lists, fixed-period restrictions, all three date ranges, the 32-card catalog, two-card uniqueness and role consistency, annual calendar coverage, and service failures. Prioritize a complete working journey over additional effects or event types.

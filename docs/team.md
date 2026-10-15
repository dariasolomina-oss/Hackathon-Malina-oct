# Team workflow

## Parallel workstreams

The runnable foundation and fixed boundaries are documented in [architecture.md](architecture.md). Start from the same integrated base commit, then use separate branches such as `track/frontend`, `track/backend`, and `track/content`. Task briefs are in [tracks/frontend.md](tracks/frontend.md), [tracks/backend.md](tracks/backend.md), and [tracks/content.md](tracks/content.md).

| Owner | Responsibility | Independent starting point |
| --- | --- | --- |
| Technical contributor 1 | Interface, card reveal interaction, result display, integration, and deployment | Placeholder cards and a sample response |
| Technical contributor 2 | Card selection, event calendar, AI integration, response format, and error handling | Fixed sample inputs without the interface |
| Content contributor | Card artwork, deck back, card meanings, oracle voice examples, copy review, and demo story | One reference card and a short reading example |

Technical contributor 1 owns the final integrated build. Technical contributor 2 owns the data exchange format and production oracle prompt. The content contributor supplies examples and editorial feedback for that prompt.

## Agree before splitting work

- Final questions, period options, and the shared list of card IDs.
- Input and output fields between the interface and reading logic, with one sample request and response.
- Illustration dimensions, file naming, and a shared visual reference.
- Repository areas owned by each contributor and the owner of shared configuration.

The starter establishes shared IDs, data types, artwork paths, and default question wording. Refine wording and visuals without changing IDs. Keep card labels in the interface rather than embedded in generated artwork. Deliver artwork and meanings using the agreed card IDs so placeholders can be replaced without changing logic.

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

At each checkpoint, check all question types, two-card uniqueness, role consistency, date overlap, and behavior when a service fails. Prioritize a complete working journey over additional effects or event types.

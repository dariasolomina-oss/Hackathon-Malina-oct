# Team responsibilities

Team **Malina** builds **Corporate Oracle**.

| Contributor | Owns | Main files |
| --- | --- | --- |
| Developer 1 — Frontend and integration | Interface, interactions, accessibility, styling, shared tooling, and deployment | `src/features/reading/`, `src/app/` except API routes, root configuration |
| Developer 2 — Backend | HTTP contract, date/event logic, Zodiacs.org and NASA integrations, AI prompt/provider, and backend verification | `src/app/api/`, `src/server/`, `src/domain/`, `src/contracts/` |
| Developer 3 — Content | Card composition, names, audience-specific meanings, artwork, and editorial feedback | `src/content/cards.ts`, `public/cards/` |

Question wording and period rules follow [product.md](product.md) and the shared catalog. Coordinate shared contract and configuration changes with the relevant owner. Content decisions belong to Developer 3; other contributors coordinate identifiers and integration without redefining approved meanings or artwork.

Each card has separate answer/recommendation meanings for Employee and Leadership. Keep the 32 names, IDs, and image paths consistent. Artwork consists of 32 faces and one shared back, all 1024 × 1536 WebP files; preserve the printed titles.

## Working together

- Start from current `main` and use a personal branch. Use separate worktrees when concurrent Codex chats share one computer.
- Read [architecture.md](architecture.md) and [AGENTS.md](../AGENTS.md) before changing implementation.
- Keep changes focused, preserve other contributors' work, and coordinate edits to shared files.
- Run the checks appropriate to the change; see [README](../README.md#checks). Check interface changes on mobile and desktop.
- Keep API keys in local or hosting environment configuration, never in commits.
- Integrate verified changes into `main` and keep behavior documentation aligned with the code.

Remaining product work is tracked in the [project write-up](project-overview.md#what-comes-next), rather than separate track plans.

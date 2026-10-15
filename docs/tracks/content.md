# Content and artwork track

Read `AGENTS.md`, `docs/product.md`, and `docs/architecture.md` first.

## Own

- `src/content/cards.ts`: card names, image paths, and two meanings per card
- `src/content/questions.ts`: question wording and period labels, preserving IDs
- `src/content/oracle-voice.md`: style and example readings
- `public/cards/`: card artwork and shared back

## Build

Start with one face and the shared card back. Agree on the visual direction with the team before producing the other 21 faces. Use a 2:3 ratio, preferably 600 by 900 pixels for the initial assets. Do not embed card titles; the interface renders those consistently.

Preserve the 22 card IDs in `src/contracts/catalog.ts`. Replace placeholder images individually. PNG and WebP are welcome: update each card's `image` path when the extension changes. Coordinate a card-back path change with the frontend owner.

Refine separate answer and recommendation meanings for each card. Add 3-5 short example readings that sound warm, specific, and funny. Mark examples as samples, and do not invent real planetary dates. The backend owner translates these examples into the production prompt.

## Done when

All 22 cards and the back have a coherent style, every catalog image loads, meanings are distinct, and example readings cover the four question types. Run `npm test` for catalog integrity, review the app visually, and prepare a short demo story.

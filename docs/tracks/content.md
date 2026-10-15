# Content and artwork track

Read `AGENTS.md`, [product scope](../product.md), and [architecture](../architecture.md) first. Preserve the twelve exact question labels supplied in the product scope.

## Own

- `src/content/cards.ts`: card names, image paths, and meanings
- `src/content/questions.ts`: audience grouping, exact question labels, and period labels, coordinated with backend contract rules
- `src/content/oracle-voice.md`: voice and example readings
- `public/cards/`: artwork and one shared back

## Agree the 32-card manifest first

There is one shared deck for Employee and Leadership, with 32 unique cards. Final card names and composition have not been supplied. Deliver a manifest containing stable ID, display name, image path, answer meaning, and recommendation meaning for all 32 cards. Agree it with the other owners before generating the full series.

Do not assume the existing 22 Major Arcana plus ten additional cards is the intended deck. Current IDs are provisional until the complete manifest is agreed; after that, preserve them across artwork, code, and prompts.

## Build

Start with one face and one shared back, agree the visual direction, then produce the other 31 faces. Use a 2:3 ratio, preferably 600 by 900 pixels initially. Do not embed titles; the interface renders them. PNG or WebP may replace SVG placeholders by updating catalog image paths. Coordinate changes to the back path with frontend.

Provide distinct answer and recommendation meanings for each card that work for both audiences. Use audience-specific examples where helpful, without duplicating the deck. Questions and period restrictions come from the product scope: six labels per audience, three available periods, and three fixed-period exceptions.

Write 4-6 short oracle examples covering both audiences, all three period lengths, and the fixed-period questions. Employee examples focus on personal work; Leadership examples focus on company strategy, customer segments, growth, or motivation. Do not invent real client names, company facts, or planetary dates. The backend owner incorporates these examples into the production prompt.

## Done when

The agreed 32-card manifest, all 32 faces, and one back are consistent; every image loads; each card has both meanings; all twelve question labels are exact. Review tone for both audiences and provide a short demo story. Run catalog checks once the shared code migration is complete and review the app visually.

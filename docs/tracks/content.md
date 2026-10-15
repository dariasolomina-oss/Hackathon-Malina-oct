# Content and artwork track

Read `AGENTS.md`, [product scope](../product.md), and [architecture](../architecture.md) first. Preserve the twelve exact question labels supplied in the product scope.

## Own

- `src/content/cards.ts`: card names, image paths, and meanings
- `src/content/questions.ts`: audience grouping, exact question labels, and period labels, coordinated with backend contract rules
- `src/content/oracle-voice.md`: voice and example readings
- `public/cards/`: artwork and one shared back

## Define the 32-card manifest

There is one shared deck for Employee and Leadership, with 32 unique cards. Developer 3 (Content) owns the decision on card composition, names, meanings, and artwork. Deliver a manifest containing stable ID, display name, image path, answer meaning, and recommendation meaning for all 32 cards. Coordinate technical IDs and paths with the other owners; their approval is not required for content or visual decisions.

The content owner has supplied the 32-card composition, names, meanings, and artwork. The manifest is integrated across the shared catalog, prompts, and UI. Preserve its IDs across artwork, code, and prompts.

## Build

Start with one face and one shared back, establish a consistent visual direction, then produce the other 31 faces. Developer 3 determines the imagery and style. Use a 2:3 ratio, preferably 600 by 900 pixels initially. Do not embed titles; the interface renders them. PNG or WebP may replace SVG placeholders by updating catalog image paths. Coordinate changes to the back path with frontend.

Provide distinct answer and recommendation meanings for each card that work for both audiences. Use audience-specific examples where helpful, without duplicating the deck. Questions and period restrictions come from the product scope: six labels per audience, three available periods, and three fixed-period exceptions.

Write 4-6 short oracle examples covering both audiences, all three period lengths, and the fixed-period questions. Employee examples focus on personal work; Leadership examples focus on company strategy, customer segments, growth, or motivation. Do not invent real client names, company facts, or planetary dates. The backend owner incorporates these examples into the production prompt.

## Done when

The agreed 32-card manifest, all 32 faces, and one back are consistent; every image loads; each card has both meanings; all twelve question labels are exact. Review tone for both audiences and provide a short demo story. Run catalog checks once the shared code migration is complete and review the app visually.

# Content and artwork track

Read `AGENTS.md`, [product scope](../product.md), and [architecture](../architecture.md) first. Preserve the twelve exact question labels supplied in the product scope.

## Own

- `src/content/cards.ts`: card names, image paths, and meanings
- `src/content/questions.ts`: audience grouping, exact question labels, and period labels, coordinated with backend contract rules
- `src/content/oracle-voice.md`: voice and example readings
- `public/cards/`: artwork and one shared back

## Define the 32-card manifest

There is one shared deck for Employee and Leadership, with 32 unique cards. Developer 3 (Content) owns the decision on card composition, names, meanings, and artwork. The supplied 32 names are integrated with stable IDs, image paths, and draft answer/recommendation meanings in the shared manifest. Coordinate technical IDs and paths with the other owners; their approval is not required for content or visual decisions.

Preserve the integrated 32 IDs across artwork, code, and prompts.

## Build

The 32 faces and one shared back are supplied in `public/cards/` as 1024 by 1536 WebP images. They use a consistent pink-purple illustrated style and include printed titles and numerals at the content owner's direction. Keep role labels in the interface without repeating the card title. Do not add unused artwork to this directory.

Provide distinct answer and recommendation meanings for each card that work for both audiences. Use audience-specific examples where helpful, without duplicating the deck. Questions and period restrictions come from the product scope: six labels per audience, three available periods, and three fixed-period exceptions.

Write 4-6 short oracle examples covering both audiences, all three period lengths, and the fixed-period questions. Employee examples focus on personal work; Leadership examples focus on company strategy, customer segments, growth, or motivation. Do not invent real client names, company facts, or planetary dates. The backend owner incorporates these examples into the production prompt.

## Done when

The 32-card manifest, faces, and shared back are consistent; every image loads; each card has both meanings; all twelve question labels are exact. Review the draft meanings and tone for both audiences, add 4-6 oracle examples, and provide a short demo story. Run catalog checks and review the app visually.

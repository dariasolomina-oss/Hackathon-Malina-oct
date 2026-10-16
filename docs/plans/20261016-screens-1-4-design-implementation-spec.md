# Screens 1–4 Design Implementation Specification

## Purpose

Make the first four screens feel like one intentional Malina experience: expressive but easy to read, consistently scaled, and connected by a clear visual rhythm. Give the opening screen a restrained tarot moment in which a small spread unfolds behind the box-cover card.

This document specifies design and frontend behavior only. Preserve the product contract, question copy, period rules, card IDs, and reading behavior in `docs/product.md`.

## Scope

1. **Screen 1 — Welcome:** Malina Corporate Oracle wordmark, “Turn the cards.” on one line, “Read the sky.”, concise introduction, box-cover artwork, animated supporting card spread, and “Begin your reading” action with a candle symbol.
2. **Screen 2 — Audience:** Employee or Leadership selection.
3. **Screen 3 — Question:** Exactly the six authoritative questions for the selected audience.
4. **Screen 4 — Period and shuffle:** The allowed rolling period choices, fixed-period explanation/locking, and shared-deck shuffle action.

Do not redesign the draw or result screens in this implementation. Keep the existing transitions and reading contract intact.

## Design direction

Create a single visual system across all four screens. The welcome screen may be more cinematic, but screens 2–4 must share its scale, typography, color, and spacing rather than feeling like a separate form.

### Typography

- Use **Bodoni Moda**, followed by `Bodoni 72`, `Didot`, and `Georgia`, for the main headline, setup headings, and large card/deck titles.
- Use one readable interface family everywhere else: `Inter Tight`, followed by `Avenir Next`, `Avenir`, and `Arial`, then `sans-serif`.
- Use the interface family for question copy, explanatory text, labels, progress, buttons, and status messages. Keep the supplied Witch lettering isolated to the “Malina” brandmark; do not use it for interface copy or headings.
- Define shared type tokens instead of styling individual screens ad hoc. Keep a clear scale: display, screen heading, option text, supporting copy, and metadata. Supporting copy and metadata must remain comfortably readable at desktop and mobile sizes.
- Keep the approved headline wording. At desktop widths, “Turn the cards.” must remain unbroken on its own line; let the second phrase follow the established two-line hero composition. At narrow widths, scale the first line down enough to prevent clipping or horizontal page overflow.

### Scale and layout

- Use one shared content width and alignment grid for screens 1–4. Align the wordmark, hero text, setup panel, and progress indicator to that grid.
- Preserve the desktop hero’s left-text/right-artwork composition. Keep the box cover legible and prominent, with its existing gold edge and soft shadow.
- Reduce excess vertical space after the hero so the first audience decision is visible sooner, while retaining generous space around the title and artwork.
- Make setup headings, choice labels, question text, period options, and primary actions visibly larger than metadata. Do not enlarge all elements indiscriminately: maintain clear hierarchy and avoid crowding.
- Keep choices in a consistent component style across audience, question, and period screens. Selected, hover, keyboard-focus, disabled, and pressed states must be distinct without relying on color alone.
- On mobile, stack the hero text and art without overlap; keep the title, CTA, and the beginning of the next step discoverable in a normal scroll. Set touch targets to at least 44 px high.

### Welcome-screen card-spread animation

- Use the approved `/box-cover.webp` as the front object. Place a small layered spread behind it, emerging visually from the illustrated deck box.
- Animate a **small representative spread of real deck cards** (recommended: five to seven cards, using existing card assets and IDs) from a compact stack into a shallow tarot fan behind the cover. Keep the cover foremost and unobscured.
- Give the reveal one authored entrance on page load: cards lift, fan into place with slightly staggered timing, and settle with a restrained warm glint or a few soft light flecks. Keep the animation magical and tactile, not a looping spectacle.
- After the entrance, leave the spread still. Do not animate all 32 cards continuously, randomize card identities, or make the hero card appear to be a selected reading result.
- Keep the card artwork’s aspect ratio and face/title legibility. Ensure the spread remains decorative and does not intercept pointer or keyboard input.
- Respect `prefers-reduced-motion`: show the final spread immediately, with no movement or flashing. If animation assets fail to load, the static cover and deck illustration must still form a complete hero.
- Keep motion lightweight: CSS transforms/opacity for card placement; avoid a new animation dependency or large visual asset unless the existing assets cannot produce the effect.

### Flow continuity

- Keep the step indicator’s active state synchronized with the current setup screen.
- Preserve the user’s current audience, question, and period while moving between screens 2–4. Returning to an earlier screen must not silently discard valid choices; changing audience must continue to select a valid question and period according to existing rules.
- On screen 4, show a compact, readable summary of the selected audience and question above the period choices so the user can confirm what they are setting a time frame for.
- Keep fixed-period questions locked to their authoritative period and explain why. Preserve the exact labels and rolling-period behavior from `docs/product.md`.
- Keep “Begin your reading” as the welcome CTA and retain existing next/back actions on setup screens.

## Implementation boundaries

- Frontend files: `src/features/reading/ReadingExperience.tsx` and `src/app/globals.css`; add a small presentational component only if it improves clarity and reuse.
- Use `src/contracts/catalog.ts` and the existing question/card content as sources of truth. Do not duplicate or rename IDs, modify question wording, add cards to the 32-card catalog, or change API/domain behavior.
- Keep the box cover outside `public/cards/`. That directory remains limited to the shared back and the 32 approved card faces.
- Do not change screens after the shuffle action as part of this work.

## Acceptance criteria

### Visual and responsive

- The first line “Turn the cards.” stays on one line without overlapping the box cover at common desktop widths.
- The title, introduction, CTA, artwork, and masthead form one balanced desktop hero; the first audience choice is not pushed excessively far below it.
- Screens 2–4 use the same typography roles, content alignment, spacing rhythm, and control language as screen 1.
- Body copy and all six questions remain easy to read without zoom at 1440 px desktop and 390 px mobile widths.
- No horizontal overflow, clipped title, overlapping card art, or inaccessible action appears at 1440 px, 1024 px, 768 px, and 390 px viewport widths.
- The card spread settles behind the box cover, does not obscure its focal artwork, and remains visually complete with reduced motion enabled.

### Interaction and accessibility

- Audience, question, period, fixed-period, and back/next behavior remain consistent with `docs/product.md`.
- Screen 4’s summary matches the current audience and question after forward/back navigation and audience changes.
- All actions work with keyboard navigation and have visible focus. Selected and disabled states are announced or represented accessibly.
- The hero artwork has useful alternative text; decorative spread cards and glints are hidden from assistive technology.
- Reduced-motion mode skips the entrance animation and presents the same final composition.

### Verification

- Run `npm run check` and `npm run build`.
- Verify screens 1–4 in a browser at 1440 px and 390 px, plus the listed intermediate breakpoints for layout/overflow.
- Verify the full screen-1-to-screen-4 path for both audiences, all six question lists, flexible periods, fixed periods, back navigation, audience switching, and reduced motion.
- Record only behavior actually verified; do not claim the animation or browser states passed without inspecting them.

## Suggested implementation sequence

1. Consolidate font roles and responsive type/spacing tokens for screens 1–4.
2. Align setup stages to the shared grid; tune desktop and mobile scale before adding motion.
3. Add the audience/question summary to screen 4 and verify back/switch behavior.
4. Build the static card-fan composition, then add the one-time entrance and reduced-motion path.
5. Run the verification matrix and make one final responsive correction pass.

## Implementation record — October 16, 2026

- Added shared display and interface font tokens. Bodoni Moda heads the display stack; the interface uses Inter Tight with the agreed system fallbacks, and Witch is limited to the “Malina” brandmark.
- Added a one-time, staggered fan of seven fixed cards behind `/box-cover.webp`. The spread is decorative, keyboard-inert, and static when reduced motion is enabled.
- Moved the audience and question summary to the period screen. “Edit choices” returns to question selection while retaining the current choices.
- Verified `npm run check`, `npm run build`, and `git diff --check`.
- Inspected the flow in a browser at 1280 px, 768 px, and 390 px; checked viewport and horizontal overflow at 1440 px, 1024 px, 768 px, and 390 px. Verified six questions for each audience and the locked year and quarter questions. Reduced-motion rendering was reviewed in CSS, but not emulated in the browser.

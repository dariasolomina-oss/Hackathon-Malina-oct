# Question and Period Screens: Refinement Specification

## Goal

Make the six-question screen feel aligned, legible, and deliberate on desktop, then make the period step immediately understandable. Keep the existing product copy for all six questions and preserve the question and period contract in `docs/product.md`.

## Design brief

- **Question layout:** Use a stable two-column by three-row grid at desktop widths. Give all six cards the same dimensions, padding, corner treatment, and top-aligned content. Align card text to a shared left edge; long questions may wrap, but must not shift the position of neighboring content or controls. Use consistent row and column gaps.
- **Navigation:** On the question step, place **Back to audience** at the left edge of the content grid and **Continue** at the right edge. Keep both on one baseline, with clear primary/secondary hierarchy and adequate spacing from the question cards.
- **Typography:** Limit the setup flow to two roles: the existing display serif for screen headings and the interface sans for question text, labels, supporting text, and controls. Use the existing font stacks and shared size tokens. Avoid one-off font sizes, weights, or decorative treatments. Question text should be comfortably readable at desktop scale.
- **Period step:** Replace **“How far ahead should we look?”** with the direct heading **“Choose a time period”**. Add one short supporting line that explains the choice in plain language. Remove duplicate or vague period prompts. Keep the three existing period labels, rolling-date behavior, and fixed-period rules unchanged.
- **Context and hierarchy:** Keep the selected audience and question visible as a compact summary above the period options, so users know what the time period applies to. Present the period choices as the main decision, with any fixed-period explanation adjacent to the locked choice.
- **Responsive behavior:** Preserve the desktop grid at wide widths. At narrower widths, reduce to one column without changing question order, navigation meaning, or readable type size. Keep controls usable without horizontal scrolling.

## Acceptance criteria

1. At 1440 px, the six questions form an even 2×3 grid with matching card edges, consistent internal alignment, and no awkward card-height variation.
2. **Back to audience** and **Continue** sit at opposite ends of the same navigation row, aligned to the question grid.
3. A user can identify the period step from its heading alone; selected audience and question remain visible nearby.
4. The setup uses only the approved display and interface font roles, with no stray type styles creating a “many fonts” impression.
5. All exact question labels, period IDs, rolling ranges, and fixed-period behavior remain unchanged.
6. At 1024 px and 390 px, text wraps cleanly, controls remain visible and usable, and there is no horizontal overflow.

## Scope and verification

Limit implementation to the question and period setup screens and their shared styles. Do not change the API, catalog, question wording, draw flow, or result screen. Verify the visual layout in a browser at 1440 px, 1024 px, and 390 px, and run the repository-required `npm run check` and `npm run build` after implementation.

# Repository instructions

- Read `README.md` and `docs/product.md` before implementation. Read `docs/team.md` when coordinating work.
- Read `docs/architecture.md` and the relevant assignment under `docs/tracks/` before changing application code. Preserve the shared request/response contract and card IDs across tracks.
- Write all project files, documentation, comments, prompts, UI copy, filenames, and commit messages in English. Conversation may follow the user's language.
- Keep explanations short and precise. Explain behavior and algorithms for an analyst; avoid unnecessary implementation details.
- Optimize for a working two-day hackathon demo. Prefer small changes and reuse the existing stack once it is established.
- Keep work within the assigned area. Preserve other contributors' changes and coordinate changes to shared formats and project configuration.
- Follow `docs/product.md` for the revised two-audience, twelve-question, three-period scope and fixed-period rules. The 32-card manifest is integrated; the question and period migration remains pending. Coordinate that shared contract migration before treating new question/period IDs as implemented.
- Use the same card IDs and meanings across artwork, selection logic, and oracle prompts. A reading contains exactly two distinct cards with fixed roles: answer and recommendation.
- Developer 3 (Content) determines the 32-card composition, meanings, and artwork. Other tracks coordinate technical IDs and paths and consume that manifest; they do not approve or independently redefine the creative content.
- Pass verified, dated event data to the AI. Never ask it to invent planetary events or favorable date ranges. Separate astronomical facts from playful interpretations.
- Keep API credentials on the server and out of version control. Track placeholder configuration only.
- Run `npm run check` for logic or contract changes and `npm run build` for application changes. Check UI changes in a browser. Report what was actually verified.
- Keep mock readings visibly labeled. A live AI failure must not silently switch to sample text. Browser code must not import `src/server` modules.
- Update relevant documentation when behavior or setup changes. Label proposed features and unverified integrations honestly.

Instruction-file reference: [OpenAI Codex documentation](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide#using-agentsmd).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

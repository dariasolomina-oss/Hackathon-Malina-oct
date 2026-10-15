# Repository instructions

- Read `README.md` and `docs/product.md` before implementation. Read `docs/team.md` when coordinating work.
- Write all project files, documentation, comments, prompts, UI copy, filenames, and commit messages in English. Conversation may follow the user's language.
- Keep explanations short and precise. Explain behavior and algorithms for an analyst; avoid unnecessary implementation details.
- Optimize for a working two-day hackathon demo. Prefer small changes and reuse the existing stack once it is established.
- Keep work within the assigned area. Preserve other contributors' changes and coordinate changes to shared formats and project configuration.
- Use the same card IDs and meanings across artwork, selection logic, and oracle prompts. A reading contains exactly two distinct cards with fixed roles: answer and recommendation.
- Pass verified, dated event data to the AI. Never ask it to invent planetary events or favorable date ranges. Separate astronomical facts from playful interpretations.
- Keep API credentials on the server and out of version control. Track placeholder configuration only.
- Run checks appropriate to the change and report what was actually verified. Until application tooling exists, do not invent build or test commands.
- Update relevant documentation when behavior or setup changes. Label proposed features and unverified integrations honestly.

Instruction-file reference: [OpenAI Codex documentation](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide#using-agentsmd).

# Project write-up

## The problem

Work questions often arrive before clear answers: will a project finish on time, how should someone prepare for a performance review, or where should a team focus next? We wanted to turn that uncertainty into a light, engaging moment of reflection for T1A employees and leaders, with a useful next step and a little office humor.

The experience is entertainment, not an assessment of employees or a prediction of actual company outcomes. It does not require birth details, personal zodiac signs, or confidential company data.

## What we built

Corporate Oracle is a web app built by team Malina, with two perspectives, Employee and Leadership, six ready-made questions for each, and three time horizons. Users draw two distinct cards from a shuffled deck of 32 original illustrated cards. Every card has separate answer and recommendation meanings for each perspective.

The final reading shows the question and resolved dates, followed by **Read the situation** and **What to do**. In live mode, AI writes both paragraphs, combining the question, the two card meanings, and the symbolic interpretation of relevant calendar events. The tone is warm, practical, and specific to work at T1A.

## How it works

In live mode:

1. The user selects an audience, question, and period, draws two cards in order, and confirms the selected pair with **Reveal your reading**.
2. The server validates the selection, derives the audience from the question, and calculates the date range.
3. It fetches retrograde and moon-phase data from Zodiacs.org for the years covered by that range, then selects up to three overlapping events, preferring different planets or moon phases and spreading yearly selections across the period.
4. It sends the exact question, audience, dates, role-specific card meanings, and selected events to the configured AI provider.
5. AI writes the complete reading. The server checks its structure and event references and returns the text, the selected events, and the full verified calendar for the period without appending extra prose.
6. The browser separately requests dated eclipse and meteor-shower highlights from NASA pages. These facts appear below the cosmic calendar and never go to the AI.

The prompt translates astrology into ordinary workplace language, such as “in early November, check that your contributions are clearly documented.” The calendars below the reading show event names, dates or date ranges, and sources separately. Each starts with up to three events and can be expanded independently without generating another reading. When calendar data is missing, the reading uses the cards alone.

## What is working

- The full question → shuffled deck → two cards → reading journey, including mobile layouts, keyboard controls, loading, retry with the same cards, and restart.
- All twelve questions, three rolling periods, and automatic period locking for the three fixed-period questions.
- All 32 card illustrations and audience-specific meanings, with one shared card back, overlapping card fans, and a face-up preview before pair review.
- Request-time calendar retrieval and a live oracle through an OpenAI-compatible gateway, plus an explicitly labeled mock mode for development.
- Expandable cosmic and NASA calendars with source links. NASA highlights use only explicitly published dates, so future coverage can be incomplete.
- A shared Bodoni Moda / Inter Tight type system, Witch lettering for the Malina wordmark, and a transparent crystal-ball browser icon.
- T1A-focused prompt instructions and separate handling of unavailable calendar data and AI errors.

Automated checks cover request validation, period rules, event selection, provider failures, AI output validation, and NASA parsing using offline fixtures. Browser scenarios cover the main journeys, keyboard interaction, responsive card fans, calendar expansion, retry, and restart. Build and test commands are in the [README](../README.md#checks). Automated checks do not establish consistent editorial quality for every generated reading.

## What comes next

1. **Custom workplace questions:** let users describe a specific work situation alongside the ready-made questions, while keeping readings focused on work at T1A.
2. **Follow-up conversations:** let users ask how to apply a recommendation and explore it further using the same cards and reading context.
3. **Save and share:** let users save a reading as a designed image and share it with colleagues.
4. **Feedback on readings:** let users rate how useful a response was and use that feedback to improve the specificity of recommendations and the oracle's tone.

Custom questions and follow-up conversations are the first development priorities. These features are planned extensions, not part of the current MVP.

No account system, database, saved reading history, or personalized birth-chart calculation is part of this MVP.

For setup, see [How to Run](../README.md#how-to-run). For implementation details, see [architecture](architecture.md).

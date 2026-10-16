# Project write-up

## The problem

Work questions often arrive before clear answers: will a project finish on time, how should someone prepare for a performance review, or where should a team focus next? We wanted to turn that uncertainty into a light, engaging moment of reflection for T1A employees and leaders, with a useful next step and a little office humor.

The experience is entertainment, not an assessment of employees or a prediction of actual company outcomes. It does not require birth details, personal zodiac signs, or confidential company data.

## What we built

Corporate Oracle is a web app built by team Malina, with two perspectives, Employee and Leadership, six ready-made questions for each, and three time horizons. Users draw two distinct cards from a shuffled deck of 32 original illustrated cards. Every card has separate answer and recommendation meanings for each perspective.

The final reading shows the question and resolved dates, followed by **What happens** and **What to do**. In live mode, AI writes both paragraphs, combining the question, the two card meanings, and the symbolic interpretation of relevant calendar events. The tone is warm, practical, and specific to work at T1A.

## How it works

1. The user selects a question and period, then draws two cards in order.
2. The server validates the selection, derives the audience from the question, and calculates the date range.
3. It fetches retrograde and moon-phase data from Zodiacs.org for the years covered by that range, then selects up to three overlapping events.
4. It sends the exact question, audience, dates, role-specific card meanings, and selected events to the configured AI provider.
5. AI writes the complete reading. The server checks its structure and event references and returns the text without appending extra prose.

The prompt translates astrology into ordinary workplace language, such as “in early November, check that your contributions are clearly documented.” The calendar below the reading lists event names, start dates, and sources separately. When calendar data is missing, the reading uses the cards alone.

## What is working

- The full question → shuffled deck → two cards → reading journey, including mobile layouts, keyboard controls, loading, retry with the same cards, and restart.
- All twelve questions, three rolling periods, and automatic period locking for the three questions that specify a year or quarter.
- All 32 card illustrations and audience-specific meanings, with one shared card back.
- Request-time calendar retrieval and a live oracle through an OpenAI-compatible gateway, plus an explicitly labeled mock mode for development.
- T1A-focused prompt instructions and separate handling of unavailable calendar data and AI errors.

Verification recorded on October 15, 2026: 57 automated tests and a production build passed; four browser scenarios covered the main journeys at mobile and desktop widths. The final prompt was also checked with three successful live scenarios: an Employee performance review, a Leadership strategy question, and an Employee reading with an empty calendar. The examples connected the card meanings to the question and used plain-language timing. These checks do not establish consistent editorial quality for every possible reading.

## What comes next

1. **Custom workplace questions:** let users describe a specific work situation alongside the ready-made questions, while keeping readings focused on work at T1A.
2. **Follow-up conversations:** let users ask how to apply a recommendation and explore it further using the same cards and reading context.
3. **Save and share:** let users save a reading as a designed image and share it with colleagues.
4. **Feedback on readings:** let users rate how useful a response was and use that feedback to improve the specificity of recommendations and the oracle's tone.

Custom questions and follow-up conversations are the first development priorities. These features are planned extensions, not part of the current MVP.

No account system, database, saved reading history, or personalized birth-chart calculation is part of this MVP.

For setup, see [How to Run](../README.md#how-to-run). For implementation details, see [architecture](architecture.md).

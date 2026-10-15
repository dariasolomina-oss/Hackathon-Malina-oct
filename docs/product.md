# Product scope

## Core experience

The user selects Employee Arcana or Leadership Arcana, chooses a question and period, draws two cards, and receives a human-sounding corporate oracle reading. The first card answers the question; the second recommends an action. Relevant astrological events enrich the same narrative.

## Proposed MVP defaults

- Six fixed questions for each audience: project delivery, recognition, performance review, new projects, and time management for employees; company outlook, customer attraction, growth, team motivation, and strategy for leadership.
- Three periods: the next month, next three months, and next year, displayed as explicit dates.
- A 32-card upright deck: all 22 Major Arcana and ten selected Minor Arcana, with no repeated card within a reading.
- A short result with an answer, a recommendation, and an optional cosmic timing note.
- No birth data or personal zodiac sign required.

### Fixed questions

Employee Arcana:

1. Will I be able to finish my project on time?
2. Will my hard work be recognized?
3. How will my performance review go?
4. Will an exciting new project come my way soon?
5. Will I finally manage to log my hours in Jira on time?
6. Will I ever have a week without surprise meetings?

Leadership Arcana:

1. What does the next year hold for our company?
2. Which customers should we focus on attracting?
3. What new growth opportunities are on the horizon?
4. How can we strengthen our team and keep everyone motivated?
5. What should be our top strategic priority?
6. Will we finally make it through a quarter without changing our priorities?

These defaults are implemented in the starter. The stack is Next.js + TypeScript; see [architecture.md](architecture.md). Final visual style and editorial wording remain track work.

## Reading algorithm

1. Resolve the selected period into explicit start and end dates.
2. Randomly select two different cards and reveal them in the user's chosen sequence.
3. Select calendar events that overlap the period, including retrogrades that started before it.
4. Send the question, dates, card roles and meanings, and a small set of relevant events to the AI.
5. Generate one coherent reading. The answer card sets the story; the recommendation card suggests an action; events provide optional timing context.

If no relevant events are available, produce a card-based reading without inventing an event. If the AI request fails, show a clear retry option rather than presenting a sample as a live result.

## Event data

Candidate sources are [Zodiacs.org](https://zodiacs.org/developers/) and [CosmyDay](https://cosmyday.com/api-docs). Their documentation has been reviewed, but a working API response has not yet been verified for this project.

Validate the chosen source before integration, retain its attribution, and cache a verified calendar covering the supported period. Normalize event times consistently. A saved calendar can keep the demo working if the source is unavailable.

Event dates are data; claims about their workplace meaning are entertainment. For example, an actual Mercury retrograde can inspire a joke about checking meeting notes. A positive Venus-related suggestion must refer to a supplied event and an explicit symbolic interpretation, not an invented favorable month.

## Voice

Warm, witty, readable, and specific to office life. Use recognizable situations such as changing requirements, client approvals, Slack messages, and unfinished Jira tasks. Avoid vague filler, frightening certainty, and guaranteed career outcomes.

## MVP completion

- A user can complete the entire question-to-reading journey.
- The reading uses the exact two revealed cards in their correct roles.
- Any event mentioned comes from supplied data and overlaps the chosen dates.
- Loading, retry, and restart behavior work.
- The interface is usable on a phone and a laptop.
- The demo runs from a shared URL, with setup instructions recorded in the README.

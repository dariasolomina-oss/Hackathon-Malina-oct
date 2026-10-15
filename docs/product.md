# Product scope

## Core experience

The user selects one of three or four workplace questions and a period, draws two cards, and receives a human-sounding corporate oracle reading. The first card answers the question; the second recommends an action. Relevant astrological events enrich the same narrative.

## Proposed MVP defaults

- Four questions: project outlook, recognition or promotion, changing jobs or teams, and client negotiations.
- Two periods: the next month and the next three months, displayed as explicit dates.
- A deck of 22 Major Arcana, upright only, with no repeated card within a reading.
- A short result with an answer, a recommendation, and an optional cosmic timing note.
- No birth data or personal zodiac sign required.

These defaults are a starting point for the team. Final question wording, visual style, and the technology stack remain to be selected.

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

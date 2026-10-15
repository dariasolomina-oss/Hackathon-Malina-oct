# Product scope

## Core experience

The user chooses Employee or Leadership, selects a question and its allowed period, draws two cards from one shared 32-card deck, and receives a human-sounding corporate oracle reading. The first card answers the question; the second recommends an action. Verified astrological events add timing and atmosphere.

## Requirements updated October 15, 2026

- Two audiences: Employee and Leadership. These are experience choices, not authenticated account roles.
- Six questions per audience, with the exact labels below. The previous four starter questions are superseded.
- Three periods: the next month, the next three months, and the next year. Three questions have fixed periods.
- One shared 32-card deck for both audiences, upright only, with exactly two distinct cards per reading.
- A short answer, a recommendation, and an optional cosmic timing note.
- No birth data or personal zodiac sign required.

The stack remains Next.js + TypeScript. The shared contract and backend now implement the twelve questions, audience metadata, three periods, and fixed-period validation. The interface migration is pending, and the current 22-card catalog remains provisional until the content owner supplies the final manifest. See [architecture.md](architecture.md) for the migration boundaries.

## Question catalog

The labels are the user's supplied wording. The IDs below are the shared implementation target: update contracts, content, UI defaults, tests, and API examples together.

### Employee

| Question ID | Exact label | Allowed period |
| --- | --- | --- |
| `employee-project-deadline` | Will I be able to finish my project on time? | All three |
| `employee-recognition` | Will my hard work be recognized? | All three |
| `employee-performance-review` | How will my performance review go? | All three |
| `employee-new-project` | Will an exciting new project come my way soon? | All three |
| `employee-jira-hours` | Will I finally manage to log my hours in Jira on time next year? | Fixed: `one-year` |
| `employee-surprise-meetings` | Will I ever have a week without surprise meetings? | All three |

### Leadership

| Question ID | Exact label | Allowed period |
| --- | --- | --- |
| `leadership-company-outlook` | What does the next year hold for our company? | Fixed: `one-year` |
| `leadership-customer-focus` | Which customers should we focus on attracting? | All three |
| `leadership-growth-opportunities` | What new growth opportunities are on the horizon? | All three |
| `leadership-team-motivation` | How can we strengthen our team and keep everyone motivated? | All three |
| `leadership-strategic-priority` | What should be our top strategic priority? | All three |
| `leadership-changing-priorities` | Will we finally make it through a quarter without changing our priorities? | Fixed: `three-months` |

## Period rules

| Period ID | Label | Duration |
| --- | --- | --- |
| `one-month` | Next month | One calendar month from the request date |
| `three-months` | Next three months | Three calendar months from the request date |
| `one-year` | Next year | Twelve calendar months from the request date |

The user confirmed that questions explicitly referring to next year or a quarter use a fixed year or quarter. Selecting one of the three fixed-period questions automatically sets its allowed period and prevents choosing another. Display the fixed period clearly. The backend rejects an incompatible question-period pair with `INVALID_REQUEST`; it must not silently substitute another range.

Use rolling periods from the request date, not the next calendar year or quarter. Keep the existing UTC start-inclusive/end-exclusive convention and clamp month ends, including February 29. Display the resolved date range. The mention of a meeting-free week describes a desired outcome within the selected period; it does not introduce a fourth, weekly period.

## Shared deck

There is one deck with exactly 32 unique cards and one shared back. Audience and period do not change the deck or the number of draws. A yearly reading still uses two cards, not one per quarter.

Developer 3 (Content) determines the final composition, names, meanings, and artwork of the 32-card deck and delivers its manifest. Frontend and backend owners coordinate only technical integration: stable IDs, image paths, and data fields. Content decisions do not require their approval. Other tracks must not invent additions to the provisional 22-card catalog. Once Developer 3 supplies the manifest, synchronize ID validation, images, meanings, and tests.

## Reading algorithm

1. Validate the question ID and allowed period; derive the audience from the shared question catalog.
2. Resolve the period into explicit dates and use the two distinct cards revealed in click order.
3. Select verified calendar events overlapping the range, including retrogrades already in progress.
4. Send the audience, exact question, dates, card roles and meanings, and selected events to the AI.
5. Generate one coherent reading: the first card sets the story, the second suggests action, and events supply optional timing context.

If no relevant events are available, produce a card-only reading without inventing an event. If AI fails, return a retryable error instead of presenting sample text as live output.

## Event data

The implemented runtime source is a checked [Zodiacs.org](https://zodiacs.org/developers/) snapshot containing 103 validated retrograde and new/full-moon events for 2026–2028. Runtime reading requests do not call an external calendar service. The importer validates schemas, complete-year coverage, station boundaries, duplicates, and required attribution before replacing the snapshot.

The provider verifies coverage for the complete selected range, including all years touched by a twelve-month reading. It distinguishes unavailable coverage from a covered period with no selected events. Annual selection considers the full period. Public event metadata retains normalized source dates; generated timing text clips an interval to the reading range without describing the clipped boundary as a planetary station date. Display `Data: Zodiacs.org — https://zodiacs.org` when calendar data is shown.

Event dates are data; their workplace significance is entertainment. Positive timing suggestions must also refer to supplied events and curated symbolic meanings.

The live OpenAI oracle is implemented behind explicit server configuration and verified with no-network fakes. Real latency, token use, cost, and editorial quality have not been measured because no project key was available.

## Voice

Warm, witty, readable, and specific to office life. Employee readings focus on personal work, recognition, reviews, and daily routines. Leadership readings focus on the company, customer segments, growth, motivation, and priorities.

Use recognizable situations such as changing requirements, client approvals, Slack messages, and Jira tasks. Avoid frightening certainty and guaranteed career or business outcomes. No company or customer data is collected: do not invent actual customer names, revenue, internal performance, or company-specific evidence.

## Completion criteria

- Each audience displays exactly its six questions.
- Nine questions allow all three periods; three questions enforce their fixed period.
- Both audiences use the same agreed 32-card catalog and reveal exactly two distinct cards.
- The result uses the exact card roles and the correct audience context.
- Annual ranges handle year boundaries, leap years, and full-period calendar coverage.
- Every event mentioned is supplied and overlaps the resolved dates.
- Loading, retry with the same cards, and restart work on mobile and desktop.
- The shared demo runs from a URL with setup instructions in the README.

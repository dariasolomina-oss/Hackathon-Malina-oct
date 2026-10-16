# Product rules

## Experience

Choose Employee or Leadership, select one of its six questions and an allowed period, then reveal two distinct cards from one shuffled 32-card deck. The first card shapes **What happens**; the second shapes **What to do**. Restart creates a new selection; retry keeps the same cards and question.

The result shows the selected question, period label and resolved dates, both cards, both text blocks, and calendar source information. Loading, failure, retry, restart, and explicit sample/live labels are part of the experience. There are no accounts, stored reading histories, birth details, or personal zodiac inputs.

For the motivation, delivered features, and next steps, read the [project write-up](project-overview.md). Implementation details are in [architecture.md](architecture.md).

## Question catalog

The labels are the agreed product wording. IDs and allowed periods are implemented in `src/contracts/catalog.ts`; update the catalog, interface, and tests together when changing them.

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

Questions explicitly referring to next year or a quarter use a fixed year or quarter. Selecting one of the three fixed-period questions automatically sets and locks its allowed period. The backend rejects an incompatible question-period pair with `INVALID_REQUEST` rather than substituting another range.

Use rolling periods from the request date, not the next calendar year or quarter. Keep the existing UTC start-inclusive/end-exclusive convention and clamp month ends, including February 29. Display the resolved date range. The mention of a meeting-free week describes a desired outcome within the selected period; it does not introduce a fourth, weekly period.

## Shared deck

The same 32 cards serve both audiences and every period, upright only. A yearly reading still uses two cards. Each card has an answer and recommendation meaning for each audience in `src/content/cards.ts`. The live prompt receives only the first card's answer meaning and second card's recommendation meaning for the question's audience.

Names match image filenames (for example, The Spark → `the-spark.webp`). Keep the content owner's names, IDs, meanings, and artwork consistent. The artwork contains printed titles and numerals. `public/cards/` contains only 32 WebP faces and `back.webp`, each 1024 × 1536.

## Reading style and scope

The live model writes both complete paragraphs, combining the exact question, the assigned card meaning, and supplied event interpretations:

- **What happens:** two or three sentences describing a plausible scenario that answers the question.
- **What to do:** three or four sentences with specific, useful workplace actions and an explanation of why they fit the situation.

Use warm, witty English and recognizable office situations. Translate event meanings into ordinary workplace advice with broad timing such as "in early November," grounded in the overlap of the event and reading period. Keep exact dates, planet names, retrograde terminology, event IDs, and citations out of these paragraphs. The calendar lists event names, start dates, and source links separately.

Avoid opening with a card definition, repeating the question, or adding a detached horoscope. The server does not append text to live readings. `src/server/oracle-prompt.ts` contains the actual system instructions and style example; mock mode is a deterministic development sample, not a demonstration of live prose quality.

Every part of the reading concerns work at T1A. Employee readings concern projects, collaboration, recognition, reviews, meetings, and routines. Leadership readings concern company strategy, customer segments, growth, team motivation, projects, and priorities. Do not discuss romance, family, health, private finances, firing, layoffs, leaving T1A, or threatening HR outcomes. Do not guarantee success or job security, invent internal company/client facts, or issue blanket bans on decisions.

Astronomical dates come from the supplied calendar; their workplace interpretation is entertainment. Do not invent events, favorable windows, zodiac personalization, or unsupported improvements after an event ends. Prompt instructions guide the model but cannot guarantee semantic compliance.

## Failure behavior

An unavailable calendar produces a card-only reading with an explicit message. An available calendar with no selected events also produces a card-only reading, without invented timing. A live AI failure shows a retryable error and preserves the selected cards; it never silently switches to sample text.

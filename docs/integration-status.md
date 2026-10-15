# Integrated project status

Updated October 15, 2026. `main` combines `track/backend`, `Mashenka_Solnyshko`, and `ds-1`; the foundation branch is already included in their history.

## Working together

- The twilight interface uses the authoritative Employee/Leadership questions and fixed-period rules. Question IDs follow the shared backend catalog.
- All 32 card names, meanings, IDs, and WebP images are preserved from the content owner's branch. Display names match filenames, for example The Spark and `the-spark.webp`. The shared back is connected, and `public/cards/` contains only the active deck assets.
- Two cards retain their answer/recommendation order. Loading, retry with the same pair, restart, resolved dates, calendar source attribution, and explicit sample/live labels are connected.
- The live oracle supports the corporate gateway, structured output, T1A-only prompt rules, and controlled errors. Each reading fetches real calendar data without a runtime snapshot fallback.
- Source retrogrades may span a year boundary with verified station dates. Validation accepts those full intervals, checks clipped segments separately, and rejects intervals wholly outside the declared source year.

## Verification

- `npm run check`: 52 passing tests, including catalog/file-name consistency, all question-period combinations, API failure paths, and cross-year calendar intervals.
- `npm run build`: production build passed.
- Browser tests: four passing scenarios covering both audiences and all question period controls, 32 loaded card images, keyboard interaction, retry, restart, empty/unavailable calendars, and 390px/1440px layouts.
- The local production HTTP route returned 200 with `calendarStatus: available` and three selected events for both one-month Employee and one-year Leadership requests. These checks used the real calendar and the mock oracle, with no paid AI calls.
- Desktop and mobile screenshots were inspected. No horizontal overflow or browser runtime errors were observed in the checked journey.
- The content manifest and all WebP files match `origin/Mashenka_Solnyshko` unchanged.

Run browser checks against a running local server with `npm run test:browser`. Set `TEST_BASE_URL` when using a port other than 3000. Install Playwright Chromium with `npx playwright install chromium`, or set `TEST_BROWSER_PATH` to an existing compatible Chrome executable. Browser tests intercept AI responses and do not spend API credits.

## Remaining before the shared demo

1. **Live editorial review:** review outputs for all twelve questions, both audiences, and all three periods with the final deck and T1A-only prompt. Earlier three gateway smoke tests used provisional cards and an older prompt. Record latency and gateway usage; pricing remains subject to the corporate gateway's billing.
2. **Content completion:** the content owner reviews the supplied draft answer/recommendation meanings, adds the requested 4–6 oracle examples, and prepares the short demo story. The artwork and manifest are already integrated.
3. **Shared deployment:** publish a Node-capable build, configure server-only gateway credentials, outbound calendar access, a request timeout above 25 seconds, and request/spending limits. No shared deployment URL is configured in this repository.
4. **Demo rehearsal:** repeat the mobile/desktop journey against the deployed live configuration, including a retry and a calendar outage.

The local preview launched during integration uses `ORACLE_MODE=mock`; it shows sample oracle text with real calendar data. `.env.local` credentials were not changed or committed. Prompt instructions constrain model behavior but do not guarantee semantic compliance.

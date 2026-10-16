"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { CelestialSky } from "./CelestialSky";
import { MagicTrail } from "./MagicTrail";
import { cards } from "@/content/cards";
import { audiences } from "@/content/questions";
import { PERIODS, QUESTIONS, getQuestion, isPeriodAllowed, type Audience, type CardId, type PeriodId, type QuestionId } from "@/contracts/catalog";
import type { AstroEvent, NasaSkyEvent, ReadingResponse } from "@/contracts/reading";
import { shuffleDeck } from "@/domain/deck";
import { requestReading } from "./client";

type DrawAnimation = {
  id: CardId;
  originX: number;
  originY: number;
  originScale: number;
};

const DRAW_DURATION_MS = 2288;
const REDUCED_DRAW_DURATION_MS = 700;

function formatDate(date: string, dateStyle: "medium" | "long" = "medium") {
  return new Intl.DateTimeFormat("en", { dateStyle, timeZone: "UTC" }).format(new Date(date));
}

function formatEventDates(event: AstroEvent) {
  const start = formatDate(event.start, "long");
  // Calendar intervals are end-exclusive, just like the reading period.
  const end = event.end ? formatDate(new Date(Date.parse(event.end) - 1).toISOString(), "long") : null;
  return !end || start === end ? start : `${start} – ${end}`;
}

function CalendarSources({ sources }: { sources: AstroEvent["source"][] }) {
  const uniqueSources = Array.from(new Map(sources.map((source) => [source.url, source])).values());
  return <div className="event-sources">{uniqueSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.name === "Zodiacs.org" ? "Data: Zodiacs.org — https://zodiacs.org" : `Source: ${source.name}`} ↗</a>)}</div>;
}

const QUESTION_CUES: Record<QuestionId, string> = {
  "employee-project-deadline": "Planning & delivery",
  "employee-recognition": "Visibility & appreciation",
  "employee-performance-review": "Feedback & growth",
  "employee-new-project": "New opportunities",
  "employee-jira-hours": "Routines & follow-through",
  "employee-surprise-meetings": "Time & focus",
  "leadership-company-outlook": "Company direction",
  "leadership-customer-focus": "Customer strategy",
  "leadership-growth-opportunities": "Growth & expansion",
  "leadership-team-motivation": "Team energy",
  "leadership-strategic-priority": "Strategic focus",
  "leadership-changing-priorities": "Stability & priorities",
};

const HERO_SPREAD_IDS: CardId[] = [
  "the-spark", "the-crossroads", "the-momentum", "the-pause", "the-shift", "the-spotlight", "the-fog",
];

export function ReadingExperience() {
  const [audienceId, setAudience] = useState<Audience>("employee");
  const [questionId, setQuestion] = useState<QuestionId>("employee-project-deadline");
  const [periodId, setPeriod] = useState<PeriodId>("one-month");
  const [setupStage, setSetupStage] = useState<1 | 2 | 3>(1);
  const [deck, setDeck] = useState<CardId[]>([]);
  const [chosen, setChosen] = useState<CardId[]>([]);
  const [result, setResult] = useState<ReadingResponse | null>(null);
  const [nasaEvents, setNasaEvents] = useState<NasaSkyEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [animatingCard, setAnimatingCard] = useState<DrawAnimation | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const drawTimer = useRef<number | null>(null);
  const shuffleTimer = useRef<number | null>(null);
  const drawLocked = useRef(false);
  const drawSequence = useRef(0);
  const stageHeadingRef = useRef<HTMLHeadingElement>(null);
  const drawHeadingRef = useRef<HTMLHeadingElement>(null);
  const readingHeadingRef = useRef<HTMLHeadingElement>(null);
  const pairHeadingRef = useRef<HTMLHeadingElement>(null);
  const hasMounted = useRef(false);

  useEffect(() => () => {
    drawSequence.current += 1;
    if (shuffleTimer.current !== null) window.clearTimeout(shuffleTimer.current);
    if (drawTimer.current !== null) window.clearTimeout(drawTimer.current);
  }, []);

  useLayoutEffect(() => {
    if (hasMounted.current && !deck.length && !result) {
      stageHeadingRef.current?.focus();
    }
    hasMounted.current = true;
  }, [setupStage, deck.length, result]);

  useLayoutEffect(() => {
    if (deck.length && chosen.length < 2) drawHeadingRef.current?.focus();
  }, [deck.length, chosen.length]);

  useLayoutEffect(() => {
    if (result) readingHeadingRef.current?.focus();
  }, [result]);
  useLayoutEffect(() => {
    if (chosen.length === 2 && !result) pairHeadingRef.current?.focus();
  }, [chosen.length, result]);

  function selectQuestion(id: QuestionId) {
    setQuestion(id);
    if (!isPeriodAllowed(id, periodId)) setPeriod(getQuestion(id).allowedPeriodIds[0]);
  }

  function cancelShuffle() {
    if (shuffleTimer.current !== null) window.clearTimeout(shuffleTimer.current);
    shuffleTimer.current = null;
    setShuffling(false);
  }

  function shuffle() {
    if (shuffling) return;
    setShuffling(true);
    setAnnouncement("Shuffling the shared deck.");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDeck(shuffleDeck());
      setShuffling(false);
      setAnnouncement("The shared deck is ready. Choose two cards.");
      return;
    }
    shuffleTimer.current = window.setTimeout(() => {
      setDeck(shuffleDeck());
      setShuffling(false);
      setAnnouncement("The shared deck is ready. Choose two cards.");
      shuffleTimer.current = null;
    }, 1520);
  }

  async function consult() {
    if (chosen.length !== 2 || busy) return;
    setBusy(true);
    setError("");
    setAnnouncement("Reading your two cards.");
    try {
      const reading = await requestReading({ questionId, periodId, answerCardId: chosen[0], recommendationCardId: chosen[1] });
      setResult(reading);
      setNasaEvents([]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The oracle is unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    cancelShuffle();
    drawSequence.current += 1;
    drawLocked.current = false;
    if (drawTimer.current !== null) window.clearTimeout(drawTimer.current);
    setDeck([]);
    setChosen([]);
    setResult(null);
    setNasaEvents([]);
    setError("");
    setSetupStage(1);
    setAnnouncement("Reading reset. Choose your audience.");
    setAnimatingCard(null);
  }

  async function chooseCard(id: CardId, element: HTMLButtonElement) {
    if (drawLocked.current || chosen.length >= 2 || chosen.includes(id) || animatingCard) return;
    drawLocked.current = true;
    const sequence = ++drawSequence.current;
    const nextCount = chosen.length + 1;
    const card = cards.find((item) => item.id === id)!;
    const preview = new Image();
    preview.src = card.image;
    try {
      await preview.decode();
    } catch {
      await new Promise<void>((resolve) => {
        if (preview.complete) resolve();
        else {
          preview.onload = () => resolve();
          preview.onerror = () => resolve();
        }
      });
    }
    if (sequence !== drawSequence.current) return;
    const from = element.querySelector(".card-art")!.getBoundingClientRect();
    const targetWidth = Math.min(300, window.innerWidth - 32, (window.innerHeight - 32) * 2 / 3);
    setAnimatingCard({
      id,
      originX: from.left + from.width / 2 - window.innerWidth / 2,
      originY: from.top + from.height / 2 - window.innerHeight / 2,
      originScale: from.width / targetWidth,
    });
    setAnnouncement(nextCount === 1 ? "Reading the situation card." : "Reading the action card.");
    const finish = () => {
      if (sequence !== drawSequence.current) return;
      setChosen((previous) => previous.length < 2 && !previous.includes(id) ? [...previous, id] : previous);
      setAnimatingCard(null);
      drawLocked.current = false;
      setAnnouncement(nextCount === 2 ? "Two cards selected. Reveal your reading when ready." : "First card selected. Choose one more card.");
      drawTimer.current = null;
    };
    drawTimer.current = window.setTimeout(finish, reducedMotion ? REDUCED_DRAW_DURATION_MS : DRAW_DURATION_MS);
  }

  const step = result ? 3 : deck.length ? 2 : 1;
  const visibleDeck = deck;
  const visibleQuestions = QUESTIONS.filter((question) => question.audience === audienceId);
  const resultQuestion = result ? getQuestion(result.request.questionId) : null;
  const resultPeriod = result ? PERIODS.find((period) => period.id === result.request.periodId) : null;
  const fixedPeriod = getQuestion(questionId).allowedPeriodIds.length === 1 ? PERIODS.find((period) => period.id === periodId) : null;

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!result) return;
    const controller = new AbortController();
    fetch("/api/nasa-events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result.period), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(6_000)]) })
      .then((response) => response.ok ? response.json() as Promise<{ events?: NasaSkyEvent[] }> : null)
      .then((payload) => { if (!controller.signal.aborted) setNasaEvents(payload?.events ?? []); })
      .catch(() => { if (!controller.signal.aborted) setNasaEvents([]); });
    return () => controller.abort();
  }, [result]);

  return <main className="page-shell">
    <CelestialSky />
    <MagicTrail />
    <header className="masthead">
      <a className="wordmark" href="#top" aria-label="Malina Corporate Oracle home"><span className="wordmark-name">Malina</span> Corporate Oracle</a>
    </header>

    <section className="intro" id="top" aria-labelledby="page-title">
      <div className="intro-content">
        <h1 id="page-title"><span className="headline-first-line">Turn the cards.</span><br className="desktop-break" /> <span className="headline-second-line">Read the sky.</span></h1>
        <p className="intro-copy">Choose a work question and a time frame. The cards reveal the story; dated sky events add a little timing.</p>
        <a className="begin-link" href="#experience">Begin your reading <span className="begin-candle" aria-hidden="true">🕯️</span></a>
      </div>
      <div className="intro-art">
        <div className="deck-box" aria-hidden="true"><span /><span /><span /></div>
        <div className="hero-spread" aria-hidden="true">
          {HERO_SPREAD_IDS.map((id, index) => {
            const card = cards.find((item) => item.id === id)!;
            const spread = index - (HERO_SPREAD_IDS.length - 1) / 2;
            const style = {
              "--spread-transform": `translateX(calc(-50% + ${spread * 32}px)) translateY(${Math.abs(spread) * 8}px) rotate(${spread * 8}deg)`,
              "--spread-delay": `${index * 95}ms`,
            } as CSSProperties;
            return <img className="spread-card" key={id} src={card.image} alt="" style={style} />;
          })}
        </div>
        <div className="hero-card"><img src="/box-cover.webp" alt="Malina Corporate Oracle box cover with three women beneath a starry sky" width="2559" height="3840" /></div>
        <span className="intro-art-spark" aria-hidden="true">✦</span>
      </div>
    </section>

    <div className="experience" id="experience">
      <nav className="steps" aria-label="Reading steps">
        {["Set your reading", "Draw two cards", "Read your oracle"].map((label, index) => <div className={`step ${step >= index + 1 ? "is-current" : ""} ${step > index + 1 ? "is-complete" : ""}`} aria-current={step === index + 1 ? "step" : undefined} key={label}>
          <span className="step-number">{step > index + 1 ? "✓" : index + 1}</span><span>{label}</span>
        </div>)}
      </nav>

      {!deck.length && <section className="setup" aria-label="Set up your reading">
        {setupStage === 1 && <div className="setup-stage" aria-labelledby="audience-title">
          <p className="section-kicker">First, choose your audience</p>
          <h2 id="audience-title" tabIndex={-1} ref={stageHeadingRef}>Who are we reading for?</h2>
          <p className="setup-help">Pick the perspective that fits your workplace question.</p>
          <div className="deck-options" role="group" aria-label="Choose an audience">
            {audiences.map((audience) => <button className={`deck-option ${audienceId === audience.id ? "selected" : ""}`} type="button" key={audience.id} aria-pressed={audienceId === audience.id} onClick={() => {
              setAudience(audience.id);
              selectQuestion(QUESTIONS.find((question) => question.audience === audience.id)!.id);
            }}>{audience.label}</button>)}
          </div>
          <div className="setup-nav setup-nav-end">
            <button className="primary-button" type="button" onClick={() => { setSetupStage(2); setAnnouncement("Audience selected. Choose a question."); }}>Choose a question <span aria-hidden="true">→</span></button>
          </div>
        </div>}
        {setupStage === 2 && <div className="setup-stage" aria-labelledby="question-title">
          <p className="section-kicker">Next, pick a question</p>
          <h2 id="question-title" tabIndex={-1} ref={stageHeadingRef}>What’s on your mind?</h2>
          <p className="setup-help">Choose the question you’d like the cards to explore.</p>
          <div className="question-grid" role="group" aria-label="Choose a workplace question">
            {visibleQuestions.map((question, index) => <button className={`question-option ${questionId === question.id ? "selected" : ""}`} type="button" key={question.id} aria-pressed={questionId === question.id} onClick={() => selectQuestion(question.id)}>
              <span className="question-topline"><span className="question-index">{String(index + 1).padStart(2, "0")}</span><span className="option-check" aria-hidden="true">{questionId === question.id ? "✓" : ""}</span></span>
              <span className="question-cue">{QUESTION_CUES[question.id]}</span>
              <span className="question-label">{question.label}</span>
            </button>)}
          </div>
          <div className="setup-nav">
            <button className="text-button" type="button" onClick={() => setSetupStage(1)}>Back to audience</button>
            <button className="primary-button" type="button" onClick={() => { setSetupStage(3); setAnnouncement("Question selected. Choose a time period."); }}>Choose a time period <span aria-hidden="true">→</span></button>
          </div>
        </div>}
        {setupStage === 3 && <div className="setup-stage" aria-labelledby="period-title">
          <p className="section-kicker">Last, choose a time period</p>
          <h2 id="period-title" tabIndex={-1} ref={stageHeadingRef}>Choose a time period</h2>
          <p className="setup-help">Choose the time frame you want this reading to explore.</p>
          <div className="reading-summary" aria-label="Your reading choices">
            <div><span>Reading for</span><strong>{audiences.find((audience) => audience.id === audienceId)?.label}</strong></div>
            <div><span>Your question</span><strong>{getQuestion(questionId).label}</strong></div>
            <button className="text-button" type="button" onClick={() => { setSetupStage(2); setAnnouncement("Your choices are saved. Edit your question or audience."); }}>Edit choices</button>
          </div>
          <div className="period-section">
            {fixedPeriod && <p className="fixed-period-note" id="fixed-period-note"><strong>Fixed for this question.</strong> Reading period: {fixedPeriod.label}.</p>}
            <div className="period-options" role="group" aria-label="Choose a time period">
              {PERIODS.map((period, index) => <button className={`period-option ${periodId === period.id ? "selected" : ""}`} type="button" key={period.id} aria-pressed={periodId === period.id} aria-describedby={fixedPeriod ? "fixed-period-note" : undefined} disabled={!isPeriodAllowed(questionId, period.id)} onClick={() => setPeriod(period.id)}>
                <span className="period-symbol" aria-hidden="true">{["☾", "◒", "☼"][index]}</span><span>{period.label}</span>
              </button>)}
            </div>
          </div>
          <div className="setup-nav period-nav">
            <div className={`deck-stack ${shuffling ? "is-shuffling" : ""}`} aria-hidden="true">
              {Array.from({ length: 32 }, (_, index) => {
                const offset = (index - 15.5) * 0.7;
                const angle = (index - 15.5) * 0.36;
                const ribbonSlot = index % 10;
                const style = {
                  "--stack-offset-x": `${offset}px`,
                  top: `calc(22px + ${Math.abs(offset) * 0.12}px)`,
                  "--rest-transform": `rotate(${angle}deg) translateY(${Math.abs(offset) * 0.1}px)`,
                  "--shuffle-delay": `${index * 18}ms`,
                  "--trail-tilt": index % 2 === 0 ? "-2deg" : "2deg",
                  "--ribbon-x": `${(ribbonSlot - 4.5) * 22}px`,
                  "--ribbon-y": `${ribbonSlot * 10}px`,
                  "--ribbon-mobile-x": `${(ribbonSlot - 4.5) * 12}px`,
                  "--ribbon-mobile-y": `${ribbonSlot * 5.5}px`,
                  "--ribbon-rotation": index % 2 === 0 ? "15deg" : "11deg",
                  zIndex: 32 - index,
                } as CSSProperties;
                return <span key={index} style={style} />;
              })}
            </div>
            <div className="period-nav-controls">
              <button className="text-button" type="button" onClick={() => {
                cancelShuffle();
                setSetupStage(2);
                setAnnouncement("Choose a question.");
              }}>Back to question</button>
              <div className={`deck-action ${shuffling ? "is-shuffling" : ""}`}>
                <button className="primary-button" type="button" disabled={shuffling} onClick={shuffle} aria-live="polite">
                  <span className="shuffle-orb" aria-hidden="true">🔮</span>{shuffling ? "Shuffling the deck…" : "Shuffle the deck"}
                </button>
                <p>{shuffling ? "The cards are finding their places." : "Your cards are ready when you are."}</p>
              </div>
            </div>
          </div>
        </div>}
      </section>}

      {!!deck.length && chosen.length < 2 && <section className="draw panel" aria-labelledby="draw-title" aria-busy={!!animatingCard}>
        <div className="draw-heading">
          <h2 id="draw-title">{getQuestion(questionId).label}</h2>
          <p className="draw-instruction" tabIndex={-1} ref={drawHeadingRef}>{chosen.length === 0 ? "Choose a card to read the situation" : "Choose a card for what to do"}</p>
        </div>
        <div className="deck" aria-label="Shared 32-card deck">
          {visibleDeck.map((id, index) => {
            const card = cards.find((item) => item.id === id)!;
            const position = chosen.indexOf(id);
            const role = position === 0 ? "Read the situation" : "What to do";
            const desktopItem = index % 16;
            const desktopRow = Math.floor(index / 16);
            const desktopArc = (desktopItem - 7.5) / 7.5;
            const mobileItem = index % 8;
            const mobileRow = Math.floor(index / 8);
            const mobileArc = (mobileItem - 3.5) / 3.5;
            const repeatedHeight = (count: number) => Array.from({ length: count }, () => "var(--fan-card-height)").join(" + ");
            const fanTop = (row: number, curve: number, gap: number) => row === 0 ? `${curve}px` : `calc(${repeatedHeight(row)} + ${row * gap + curve}px)`;
            const style = {
              "--deck-index": index,
              "--desktop-left": `${11 + desktopItem * 78 / 15 + desktopRow * 0.4}%`,
              "--desktop-top": fanTop(desktopRow, 24 * desktopArc * desktopArc, 26),
              "--desktop-angle": `${desktopArc * 18}deg`,
              "--tablet-left": `${16 + desktopItem * 68 / 15 + desktopRow * 0.15}%`,
              "--tablet-angle": `${desktopArc * 15}deg`,
              "--mobile-left": `${18 + mobileItem * 64 / 7 + (mobileRow % 2 === 0 ? -0.4 : 0.4)}%`,
              "--mobile-top": fanTop(mobileRow, 17 * mobileArc * mobileArc, 19),
              "--mobile-angle": `${mobileArc * 15}deg`,
            } as CSSProperties;
            return <button className={`card ${position >= 0 ? "card-chosen" : ""} ${animatingCard?.id === id ? "card-animating" : ""}`} type="button" key={id} style={style} disabled={position >= 0 || !!animatingCard || chosen.length === 2 || busy}
              aria-label={position >= 0 ? `${role}: ${card.name}` : `Draw a face-down card, position ${index + 1}`}
              onClick={(event) => void chooseCard(id, event.currentTarget)}>
              <span className="card-art"><img src="/cards/back.webp" alt="" width="1024" height="1536" /></span>
            </button>;
          })}
        </div>
      </section>}

      {animatingCard && (() => {
        const card = cards.find((item) => item.id === animatingCard.id)!;
        const style = {
          "--origin-x": `${animatingCard.originX}px`,
          "--origin-y": `${animatingCard.originY}px`,
          "--origin-scale": animatingCard.originScale,
          "--draw-duration": `${DRAW_DURATION_MS}ms`,
        } as CSSProperties;
        return <div className={`draw-overlay ${reducedMotion ? "reduced-motion" : ""}`} role="img" aria-label={`${card.name}, selected card`}>
          <span className="draw-overlay-card" style={style}>
            <img className="draw-overlay-back" src="/cards/back.webp" alt="" width="1024" height="1536" />
            <img className="draw-overlay-face" src={card.image} alt="" width="1024" height="1536" />
          </span>
        </div>;
      })()}

      {!!deck.length && chosen.length === 2 && !result && <section className="pair-stage panel" aria-labelledby="pair-title">
        <div className="draw-heading">
          <h2 id="pair-title" tabIndex={-1} ref={pairHeadingRef}>{getQuestion(questionId).label}</h2>
          <p className="draw-instruction">Ready to reveal your reading?</p>
        </div>
        <div className="pair-cards">{chosen.map((id, index) => {
          const card = cards.find((item) => item.id === id)!;
          return <article key={id} className="pair-card">
            <h3 className="pair-card-label"><span>{index === 0 ? "Read the situation" : "What to do"}</span> — <strong>{card.name}</strong></h3>
            <img src={card.image} alt={card.name} width="1024" height="1536" />
          </article>;
        })}</div>
        <div className="action-row draw-actions"><button className="primary-button consult-button" type="button" disabled={busy} aria-describedby={busy ? "consult-status" : undefined} onClick={consult}>{busy ? <><span className="spinner" aria-hidden="true" /> Consulting the oracle…</> : error ? "Retry this reading" : "Reveal your reading"}<span aria-hidden="true">↗</span></button></div>
      </section>}

      {!!deck.length && <div className="action-row"><button className="text-button" type="button" disabled={busy} onClick={restart}>{result ? "Start a new reading" : "Start over"}</button></div>}

      {busy && <p className="sr-only" id="consult-status" role="status">Consulting the oracle. Your two cards are saved.</p>}
      {error && <div className="error-message" role="alert"><span aria-hidden="true">✳</span><p>{error}</p><span>Your cards are saved. Try again when you’re ready.</span></div>}

      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      <div>{result && <section className="reading panel" aria-labelledby="reading-title">
        <div className="reading-topline">
          <h2 id="reading-title" tabIndex={-1} ref={readingHeadingRef}>Your reading</h2>
          {result.meta.mode === "mock" && <span className="mode-label mock">Sample reading</span>}
        </div>
        <div className="reading-context">
          <p className="reading-question">{resultQuestion?.label}</p>
          <p className="reading-period">{resultPeriod?.label} ({formatDate(result.period.start, "long")} – {formatDate(new Date(Date.parse(result.period.end) - 1).toISOString(), "long")})</p>
        </div>
        <div className="reading-panels">{chosen.map((id, index) => {
          const card = cards.find((item) => item.id === id)!;
          const role = index === 0 ? "Read the situation" : "What to do";
          const copy = index === 0 ? result.answer : result.recommendation;
          return <article className="reading-panel" key={id}>
            <div className="reading-panel-card"><img src={card.image} alt={card.name} width="1024" height="1536" /></div>
            <div className="reading-panel-copy">
              <span className="reading-number">{index === 0 ? "I" : "II"}</span>
              <h3><span>{role}</span> — <strong>{card.name}</strong></h3>
              <p>{copy}</p>
            </div>
          </article>;
        })}</div>
        {result.meta.calendarStatus === "unavailable" && <p className="calendar-status">The event calendar is unavailable, so this reading is based on your cards alone.</p>}
        {result.meta.calendarStatus === "available" && result.events.length === 0 && <p className="calendar-status">No calendar events overlap this period, so this reading is based on your cards alone.</p>}
        {!!result.events.length && <section className="events" aria-labelledby="cosmic-calendar-title">
          <h3 className="section-kicker" id="cosmic-calendar-title">In the cosmic calendar</h3>
          <ul>{result.events.map((event) => <li key={event.id}>
            <strong>{event.name}</strong><span className="event-date">{formatEventDates(event)}</span>
          </li>)}</ul>
          <CalendarSources sources={result.events.map((event) => event.source)} />
        </section>}
        {!!nasaEvents.length && <section className="events nasa-events" aria-labelledby="nasa-calendar-title">
          <h3 className="section-kicker" id="nasa-calendar-title">Look up — sky highlights</h3>
          <ul>{nasaEvents.map((event) => <li key={event.id}>
            <span><strong><a className="event-title" href={event.source.url} target="_blank" rel="noopener noreferrer" aria-label={`${event.name} — NASA (opens in a new tab)`}>{event.name} <span aria-hidden="true">↗</span></a></strong><small>{event.visibility}</small></span>
            <span className="event-date">{event.kind === "meteor-shower" ? "Peak: " : ""}{formatDate(event.date, "long")}{event.endDate && event.endDate !== event.date ? ` – ${formatDate(event.endDate, "long")}` : ""}</span>
          </li>)}</ul>
        </section>}
        <p className="disclaimer">For entertainment and reflection. The universe is not your project manager.</p>
      </section>}</div>

      {!deck.length && <p className="sample-note">The cards tell the story. Dated sky events add timing when they overlap your period.</p>}
    </div>

    <footer className="site-footer"><span>Malina oracle</span><span>For entertainment, reflection & a better Monday.</span><span>© 2026</span></footer>
  </main>;
}

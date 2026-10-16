"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { CelestialSky } from "./CelestialSky";
import { MagicTrail } from "./MagicTrail";
import { cards } from "@/content/cards";
import { audiences } from "@/content/questions";
import { PERIODS, QUESTIONS, getQuestion, isPeriodAllowed, type Audience, type CardId, type PeriodId, type QuestionId } from "@/contracts/catalog";
import type { ReadingResponse } from "@/contracts/reading";
import { shuffleDeck } from "@/domain/deck";
import { requestReading } from "./client";

type DrawAnimation = {
  id: CardId;
  originX: number;
  originY: number;
  originScale: number;
};

const DRAW_DURATION_MS = 2800;
const REDUCED_DRAW_DURATION_MS = 700;

function formatDate(date: string, dateStyle: "medium" | "long" = "medium") {
  return new Intl.DateTimeFormat("en", { dateStyle, timeZone: "UTC" }).format(new Date(date));
}

export function ReadingExperience() {
  const [audienceId, setAudience] = useState<Audience>("employee");
  const [questionId, setQuestion] = useState<QuestionId>("employee-project-deadline");
  const [periodId, setPeriod] = useState<PeriodId>("one-month");
  const [setupStage, setSetupStage] = useState<1 | 2 | 3>(1);
  const [deck, setDeck] = useState<CardId[]>([]);
  const [chosen, setChosen] = useState<CardId[]>([]);
  const [result, setResult] = useState<ReadingResponse | null>(null);
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

  function shuffle() {
    if (shuffling) return;
    setShuffling(true);
    setAnnouncement("Shuffling the shared deck.");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDeck(shuffleDeck());
      setShuffling(false);
      return;
    }
    shuffleTimer.current = window.setTimeout(() => {
      setDeck(shuffleDeck());
      setShuffling(false);
      setAnnouncement("The shared deck is ready. Choose two cards.");
      shuffleTimer.current = null;
    }, 1250);
  }

  async function consult() {
    if (chosen.length !== 2 || busy) return;
    setBusy(true);
    setError("");
    setAnnouncement("Reading your two cards.");
    try {
      setResult(await requestReading({
        questionId,
        periodId,
        answerCardId: chosen[0],
        recommendationCardId: chosen[1],
      }));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The oracle is unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    drawSequence.current += 1;
    drawLocked.current = false;
    if (drawTimer.current !== null) window.clearTimeout(drawTimer.current);
    setDeck([]);
    setChosen([]);
    setResult(null);
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

  return <main className="page-shell">
    <CelestialSky />
    <MagicTrail />
    <header className="masthead">
      <a className="wordmark" href="#top" aria-label="Malina Corporate Oracle home"><span className="wordmark-name">Malina</span> <span className="wordmark-divider">/</span> Corporate oracle</a>
      <span className="masthead-note">A reading for the working week</span>
    </header>

    <section className="intro" id="top" aria-labelledby="page-title">
      <p className="eyebrow">Tarot for work, under the stars</p>
      <h1 id="page-title">Turn over the cards.<br className="desktop-break" /> <span className="headline-second-line">Read the sky.</span></h1>
      <p className="intro-copy">Choose a work question and a time frame. The cards reveal the story; dated sky events add a little timing.</p>
      <a className="begin-link" href="#experience">Begin your reading <span aria-hidden="true">↘</span></a>
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
          <h2 id="period-title" tabIndex={-1} ref={stageHeadingRef}>How far ahead should we look?</h2>
          <p className="setup-help">The cards will reflect this rolling time frame.</p>
          <div className="period-section">
            {fixedPeriod && <p className="fixed-period-note" id="fixed-period-note"><strong>Fixed for this question.</strong> Reading period: {fixedPeriod.label}.</p>}
            <div className="period-options" role="group" aria-label="Choose a time period">
              {PERIODS.map((period, index) => <button className={`period-option ${periodId === period.id ? "selected" : ""}`} type="button" key={period.id} aria-pressed={periodId === period.id} aria-describedby={fixedPeriod ? "fixed-period-note" : undefined} disabled={!isPeriodAllowed(questionId, period.id)} onClick={() => setPeriod(period.id)}>
                <span className="period-symbol" aria-hidden="true">{["☾", "◒", "☼"][index]}</span><span>{period.label}</span>
              </button>)}
            </div>
          </div>
          <div className="setup-nav">
            <button className="text-button" type="button" onClick={() => setSetupStage(2)}>Back to question</button>
            <div className={`deck-action ${shuffling ? "is-shuffling" : ""}`}>
              <div className={`deck-stack ${shuffling ? "is-shuffling" : ""}`} aria-hidden="true">
                {Array.from({ length: 32 }, (_, index) => {
                  const offset = (index - 15.5) * 0.7;
                  const angle = (index - 15.5) * 0.36;
                  const style = {
                    left: `calc(136px + ${offset}px)`,
                    top: `calc(22px + ${Math.abs(offset) * 0.12}px)`,
                    "--rest-transform": `rotate(${angle}deg) translateY(${Math.abs(offset) * 0.1}px)`,
                    "--shuffle-delay": `${(index % 8) * 32}ms`,
                    "--shuffle-direction": index % 2 === 0 ? -1 : 1,
                    "--fan-x": `${(index - 15.5) * 7}px`,
                    "--fan-y": `${-Math.abs(index - 15.5) * 2}px`,
                    "--fan-angle": `${(index - 15.5) * 1.6}deg`,
                  } as CSSProperties;
                  return <span key={index} style={style} />;
                })}
              </div>
              <button className="primary-button" type="button" disabled={shuffling} onClick={shuffle} aria-live="polite">
                <span className="shuffle-orb" aria-hidden="true"><span /></span>{shuffling ? "Shuffling the deck…" : "Shuffle the deck"}
              </button>
              <p>{shuffling ? "The cards are finding their places." : "Your cards are ready when you are."}</p>
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
          <span className={`mode-label ${result.meta.mode}`}>{result.meta.mode === "mock" ? "Sample reading" : "Personal reading"}</span>
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
              <h3>{role} — {card.name}</h3>
              <p>{copy}</p>
            </div>
          </article>;
        })}</div>
        {result.meta.calendarStatus === "unavailable" && <p className="calendar-status">The event calendar is unavailable, so this reading is based on your cards alone.</p>}
        {result.meta.calendarStatus === "available" && result.events.length === 0 && <p className="calendar-status">No calendar events overlap this period, so this reading is based on your cards alone.</p>}
        {!!result.events.length && <div className="events"><span className="section-kicker">In the cosmic calendar</span><ul>{result.events.map((event) => <li key={event.id}><span><strong>{event.name}</strong><small>{formatDate(event.start)}</small></span><a href={event.source.url} target="_blank" rel="noopener noreferrer" aria-label={`Event source: ${event.source.name} (opens in a new tab)`}>Source: {event.source.name} ↗</a></li>)}</ul></div>}
        {result.events.some((event) => event.source.name === "Zodiacs.org") && <p className="calendar-status">Data: <a href="https://zodiacs.org" target="_blank" rel="noopener noreferrer">Zodiacs.org — https://zodiacs.org</a></p>}
        <p className="disclaimer">For entertainment and reflection. The universe is not your project manager.</p>
      </section>}</div>

      {!deck.length && <p className="sample-note">The cards tell the story. Dated sky events add timing when they overlap your period.</p>}
    </div>

    <footer className="site-footer"><span>Malina oracle</span><span>For entertainment, reflection & a better Monday.</span><span>© 2026</span></footer>
  </main>;
}

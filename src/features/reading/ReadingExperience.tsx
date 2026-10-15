"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CelestialSky } from "./CelestialSky";
import { MagicTrail } from "./MagicTrail";
import { cards } from "@/content/cards";
import { audiences, periods, questions } from "@/content/questions";
import { getQuestion, isPeriodAllowed, type Audience, type CardId, type PeriodId, type QuestionId } from "@/contracts/catalog";
import type { ReadingResponse } from "@/contracts/reading";
import { shuffleDeck } from "@/domain/deck";
import { requestReading } from "./client";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(date));
}

export function ReadingExperience() {
  const [audienceId, setAudience] = useState<Audience>("employee");
  const [questionId, setQuestion] = useState<QuestionId>("employee-project-deadline");
  const [periodId, setPeriod] = useState<PeriodId>("one-month");
  const [deck, setDeck] = useState<CardId[]>([]);
  const [chosen, setChosen] = useState<CardId[]>([]);
  const [result, setResult] = useState<ReadingResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [error, setError] = useState("");
  const shuffleTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (shuffleTimer.current !== null) window.clearTimeout(shuffleTimer.current);
  }, []);

  function selectQuestion(id: QuestionId) {
    setQuestion(id);
    if (!isPeriodAllowed(id, periodId)) setPeriod(getQuestion(id).allowedPeriodIds[0]);
  }

  function shuffle() {
    if (shuffling) return;
    setShuffling(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDeck(shuffleDeck());
      setShuffling(false);
      return;
    }
    shuffleTimer.current = window.setTimeout(() => {
      setDeck(shuffleDeck());
      setShuffling(false);
      shuffleTimer.current = null;
    }, 1050);
  }

  async function consult() {
    if (chosen.length !== 2 || busy) return;
    setBusy(true);
    setError("");
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
    setDeck([]);
    setChosen([]);
    setResult(null);
    setError("");
  }

  const step = result ? 4 : chosen.length === 2 ? 3 : deck.length ? 2 : 1;
  const visibleDeck = chosen.length === 2 ? chosen : deck;
  const visibleQuestions = questions.filter((question) => question.audience === audienceId);

  return <main className="page-shell">
    <CelestialSky />
    <MagicTrail />
    <header className="masthead">
      <a className="wordmark" href="#top" aria-label="Malina Corporate Oracle home">Malina <span className="wordmark-divider">/</span> Corporate oracle</a>
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
        {["Set your question", "Draw two cards", "Read your oracle"].map((label, index) => <div className={`step ${step >= index + 1 ? "is-current" : ""} ${step > index + 1 ? "is-complete" : ""}`} aria-current={step === index + 1 ? "step" : undefined} key={label}>
          <span className="step-number">{step > index + 1 ? "✓" : index + 1}</span><span>{label}</span>
        </div>)}
      </nav>

      {!deck.length && <section className="setup" aria-labelledby="question-title">
        <div className="deck-select">
          <span className="section-kicker">Choose your perspective</span>
          <div className="deck-options" role="group" aria-label="Choose a perspective">
            {audiences.map((audience) => <button className={`deck-option ${audienceId === audience.id ? "selected" : ""}`} type="button" key={audience.id} aria-pressed={audienceId === audience.id} onClick={() => {
              setAudience(audience.id);
              selectQuestion(questions.find((question) => question.audience === audience.id)!.id);
            }}>{audience.label}</button>)}
          </div>
        </div>
        <div className="section-heading"><h2 id="question-title">What’s on your mind</h2><p>Pick the question you want the cards to answer.</p></div>
        <div className="question-grid" role="group" aria-label="Choose a workplace question">
          {visibleQuestions.map((question, index) => <button className={`question-option ${questionId === question.id ? "selected" : ""}`} type="button" key={question.id} aria-pressed={questionId === question.id} onClick={() => selectQuestion(question.id)}>
            <span className="question-topline"><span className="question-index">{String(index + 1).padStart(2, "0")}</span><span className="option-check" aria-hidden="true">{questionId === question.id ? "✓" : ""}</span></span>
            <span className="question-label">{question.label}</span>
          </button>)}
        </div>
        <div className="period-section">
          <span className="section-kicker">Choose your moon</span>
          <div className="period-options" role="group" aria-label="Choose a time period">
            {periods.map((period, index) => <button className={`period-option ${periodId === period.id ? "selected" : ""}`} type="button" key={period.id} aria-pressed={periodId === period.id} disabled={!isPeriodAllowed(questionId, period.id)} onClick={() => setPeriod(period.id)}>
              <span className="period-symbol" aria-hidden="true">{["☾", "◒", "☼"][index]}</span><span>{period.label}</span>
            </button>)}
          </div>
        </div>
        {getQuestion(questionId).allowedPeriodIds.length === 1 && <p className="sample-note">This question uses a fixed period: {periods.find((period) => period.id === periodId)!.label}.</p>}
        <div className={`deck-action ${shuffling ? "is-shuffling" : ""}`}>
          <div className={`deck-stack ${shuffling ? "is-shuffling" : ""}`} aria-hidden="true">
            {Array.from({ length: 32 }, (_, index) => {
              const offset = (index - 15.5) * 0.7;
              const angle = (index - 15.5) * 0.36;
              const style = {
                left: `calc(16px + ${offset}px)`,
                top: `calc(7px + ${Math.abs(offset) * 0.12}px)`,
                "--rest-transform": `rotate(${angle}deg) translateY(${Math.abs(offset) * 0.1}px)`,
                "--shuffle-delay": `${(index % 8) * 32}ms`,
                "--shuffle-direction": index % 2 === 0 ? -1 : 1,
              } as CSSProperties;
              return <span className={index === 31 ? "deck-top-card" : ""} key={index} style={style} />;
            })}
          </div>
          <button className="primary-button" type="button" disabled={shuffling} onClick={shuffle} aria-live="polite">
            {shuffling ? "Shuffling the deck…" : "Shuffle the deck"}<span aria-hidden="true">↗</span>
          </button>
          <p>{shuffling ? "The cards are finding their places." : "Your cards are ready when you are."}</p>
        </div>
      </section>}

      {!!deck.length && <section className="draw panel" aria-labelledby="draw-title" aria-busy={busy}>
        <div className="draw-heading">
          <h2 id="draw-title">Choose 2 cards</h2>
          <span className="draw-count" aria-live="polite">{chosen.length} <span>/ 2</span></span>
        </div>
        <div className={`deck ${chosen.length === 2 ? "deck-revealed" : ""}`}>
          {visibleDeck.map((id, index) => {
            const card = cards.find((item) => item.id === id)!;
            const position = chosen.indexOf(id);
            const role = position === 0 ? "What happens" : "What to do";
            return <button className={`card ${position >= 0 ? "card-chosen" : ""}`} type="button" key={id} disabled={position >= 0 || chosen.length === 2 || busy}
              aria-label={position >= 0 ? `${role}: ${card.name}` : `Draw a face-down card, position ${index + 1}`}
              onClick={() => setChosen((previous) => previous.length < 2 && !previous.includes(id) ? [...previous, id] : previous)}>
              <span className="card-art"><img src={position >= 0 ? card.image : "/cards/back.webp"} alt={position >= 0 ? card.name : ""} width="1024" height="1536" /></span>
              {position >= 0 && <span className="card-caption"><span className="card-role">{role}</span></span>}
            </button>;
          })}
        </div>
      </section>}

      {!!deck.length && <div className="action-row">
        {chosen.length === 2 && !result && <button className="primary-button consult-button" type="button" disabled={busy} aria-describedby={busy ? "consult-status" : undefined} onClick={consult}>
          {busy ? <><span className="spinner" aria-hidden="true" /> Consulting the oracle…</> : error ? "Retry this reading" : "Reveal your reading"}<span aria-hidden="true">↗</span>
        </button>}
        <button className="text-button" type="button" disabled={busy} onClick={restart}>{result ? "Start a new reading" : "Start over"}</button>
      </div>}

      {busy && <p className="sr-only" id="consult-status" role="status">Consulting the oracle. Your two cards are saved.</p>}
      {error && <div className="error-message" role="alert"><span aria-hidden="true">✳</span><p>{error}</p><span>Your cards are saved. Try again when you’re ready.</span></div>}

      <div aria-live="polite" aria-atomic="true">{result && <section className="reading panel" aria-labelledby="reading-title">
        <div className="reading-topline"><span className="section-kicker">Your reading</span><span className={`mode-label ${result.meta.mode}`}>{result.meta.mode === "mock" ? "Sample reading" : "Personal reading"}</span></div>
        <h2 id="reading-title">Your tarot reading</h2>
        <p className="reading-period">For {formatDate(result.period.start)} – {formatDate(new Date(Date.parse(result.period.end) - 1).toISOString())}</p>
        <div className="reading-cards">{chosen.map((id, index) => { const card = cards.find((item) => item.id === id)!; return <div className="reading-card" key={id}><img src={card.image} alt="" /><div><span>{index === 0 ? "What happens" : "What to do"}</span><strong>{card.name}</strong></div></div>; })}</div>
        <div className="reading-copy"><div><span className="reading-number">I</span><h3>What happens</h3><p>{result.answer}</p></div><div><span className="reading-number">II</span><h3>What to do</h3><p>{result.recommendation}</p></div></div>
        {result.cosmicNote && <aside className="cosmic-note"><span className="section-kicker">A note on timing</span><p>{result.cosmicNote}</p></aside>}
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

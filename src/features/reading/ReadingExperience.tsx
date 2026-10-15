"use client";

import { useState } from "react";
import { cards } from "@/content/cards";
import { periods, questions } from "@/content/questions";
import type { CardId, PeriodId, QuestionId } from "@/contracts/catalog";
import type { ReadingResponse } from "@/contracts/reading";
import { shuffleDeck } from "@/domain/deck";
import { requestReading } from "./client";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(date));
}

export function ReadingExperience() {
  const [questionId, setQuestion] = useState<QuestionId>("project");
  const [periodId, setPeriod] = useState<PeriodId>("one-month");
  const [deck, setDeck] = useState<CardId[]>([]);
  const [chosen, setChosen] = useState<CardId[]>([]);
  const [result, setResult] = useState<ReadingResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  return <main className="page-shell">
    <header className="masthead">
      <a className="wordmark" href="#top" aria-label="Malina Corporate Oracle home"><span className="wordmark-mark">✳</span> MALINA <span className="wordmark-divider">/</span> CORPORATE ORACLE</a>
      <span className="masthead-note">A little perspective for the working week</span>
    </header>

    <section className="intro" id="top" aria-labelledby="page-title">
      <p className="eyebrow"><span className="eyebrow-line" /> YOUR WORKPLACE, WRITTEN IN THE STARS</p>
      <h1 id="page-title">The universe has<br className="desktop-break" /> <em>read the brief.</em></h1>
      <p className="intro-copy">Bring a work question. Draw two cards. Leave with a fresh perspective (and maybe one fewer open Jira ticket).</p>
      <div className="intro-orbit" aria-hidden="true"><span>✳</span><i>✦</i><b>·</b></div>
    </section>

    <div className="experience">
      <nav className="steps" aria-label="Reading steps">
        {["Set your question", "Draw two cards", "Read your oracle"].map((label, index) => <div className={`step ${step >= index + 1 ? "is-current" : ""} ${step > index + 1 ? "is-complete" : ""}`} key={label}>
          <span className="step-number">{step > index + 1 ? "✓" : `0${index + 1}`}</span><span>{label}</span>
        </div>)}
      </nav>

      {!deck.length && <section className="setup panel" aria-labelledby="question-title">
        <div className="section-heading"><span className="section-kicker">01 / THE QUESTION</span><h2 id="question-title">What’s on your mind?</h2><p>Choose the situation that feels closest.</p></div>
        <div className="question-grid" role="group" aria-label="Choose a workplace question">
          {questions.map((question, index) => <button className={`question-option ${questionId === question.id ? "selected" : ""}`} type="button" key={question.id} aria-pressed={questionId === question.id} onClick={() => setQuestion(question.id)}>
            <span className="question-index">0{index + 1}</span><span>{question.label}</span><span className="option-check" aria-hidden="true">{questionId === question.id ? "✦" : "↗"}</span>
          </button>)}
        </div>
        <div className="setup-bottom"><label className="period-control" htmlFor="period"><span className="section-kicker">LOOKING AHEAD</span><select id="period" value={periodId} onChange={(event) => setPeriod(event.target.value as PeriodId)}>
          {periods.map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}
        </select></label>
          <button className="primary-button" type="button" onClick={() => setDeck(shuffleDeck())}>Shuffle the deck <span aria-hidden="true">↗</span></button>
        </div>
      </section>}

      {!!deck.length && <section className="draw panel" aria-labelledby="draw-title">
        <div className="draw-heading">
          <div><span className="section-kicker">02 / THE REVEAL</span><h2 id="draw-title">{chosen.length === 0 ? "Draw the answer" : chosen.length === 1 ? "Now draw your next move" : "Your cards are on the table"}</h2>
            <p>{chosen.length === 0 ? "Choose a card to see what the situation is telling you." : chosen.length === 1 ? "One more card for the action to take." : "The first card answers. The second offers a recommendation."}</p></div>
          <span className="draw-count" aria-live="polite">{chosen.length} <span>/ 2</span></span>
        </div>
        <div className={`deck ${chosen.length === 2 ? "deck-revealed" : ""}`}>
          {visibleDeck.map((id, index) => {
            const card = cards.find((item) => item.id === id)!;
            const position = chosen.indexOf(id);
            const role = position === 0 ? "Answer" : "Recommendation";
            return <button className={`card ${position >= 0 ? "card-chosen" : ""}`} type="button" key={id} disabled={position >= 0 || chosen.length === 2 || busy}
              aria-label={position >= 0 ? `${role}: ${card.name}` : `Draw a face-down card, position ${index + 1}`}
              onClick={() => setChosen((previous) => previous.length < 2 && !previous.includes(id) ? [...previous, id] : previous)}>
              <span className="card-art"><img src={position >= 0 ? card.image : "/cards/back.svg"} alt={position >= 0 ? card.name : ""} width="600" height="900" /></span>
              <span className="card-caption">{position >= 0 ? <><span className="card-role">{role}</span><strong>{card.name}</strong></> : <><span className="card-placeholder">✳</span><strong>Choose this card</strong></>}</span>
            </button>;
          })}
        </div>
      </section>}

      {!!deck.length && <div className="action-row">
        {chosen.length === 2 && !result && <button className="primary-button consult-button" type="button" disabled={busy} onClick={consult}>
          {busy ? <><span className="spinner" aria-hidden="true" /> Consulting the oracle…</> : error ? "Retry this reading" : "Reveal your reading"}<span aria-hidden="true">↗</span>
        </button>}
        <button className="text-button" type="button" disabled={busy} onClick={restart}>{result ? "Start a new reading" : "Start over"}</button>
      </div>}

      {error && <div className="error-message" role="alert"><span aria-hidden="true">✳</span><p>{error}</p><span>Your cards are saved. Try again when you’re ready.</span></div>}

      <div aria-live="polite" aria-atomic="true">{result && <section className="reading panel" aria-labelledby="reading-title">
        <div className="reading-topline"><span className="section-kicker">03 / YOUR READING</span><span className={`mode-label ${result.meta.mode}`}>{result.meta.mode === "mock" ? "SAMPLE READING" : "PERSONAL READING"}</span></div>
        <h2 id="reading-title">A note from the cosmos</h2>
        <p className="reading-period">For {formatDate(result.period.start)} – {formatDate(new Date(Date.parse(result.period.end) - 1).toISOString())}</p>
        <div className="reading-cards">{chosen.map((id, index) => { const card = cards.find((item) => item.id === id)!; return <div className="reading-card" key={id}><img src={card.image} alt="" /><div><span>{index === 0 ? "THE ANSWER" : "YOUR NEXT MOVE"}</span><strong>{card.name}</strong></div></div>; })}</div>
        <div className="reading-copy"><div><span className="reading-number">I</span><h3>The answer</h3><p>{result.answer}</p></div><div><span className="reading-number">II</span><h3>Your next move</h3><p>{result.recommendation}</p></div></div>
        {result.cosmicNote && <aside className="cosmic-note"><span className="section-kicker">A COSMIC TIMING NOTE</span><p>{result.cosmicNote}</p></aside>}
        {result.meta.calendarStatus === "unavailable" && <p className="calendar-status">The event calendar is unavailable, so this reading is based on your cards alone.</p>}
        {result.meta.calendarStatus === "available" && result.events.length === 0 && <p className="calendar-status">No calendar events overlap this period, so this reading is based on your cards alone.</p>}
        {!!result.events.length && <div className="events"><span className="section-kicker">IN THE COSMIC CALENDAR</span><ul>{result.events.map((event) => <li key={event.id}><span><strong>{event.name}</strong><small>{formatDate(event.start)}</small></span><a href={event.source.url} target="_blank" rel="noreferrer">Source: {event.source.name} ↗</a></li>)}</ul></div>}
        <p className="disclaimer">For entertainment and reflection. The universe is not your project manager.</p>
      </section>}</div>

      {!deck.length && <p className="sample-note">The oracle is in demo mode. Sample readings are clearly labeled.</p>}
    </div>

    <footer className="site-footer"><span>✳ MALINA ORACLE</span><span>For entertainment, reflection & a better Monday.</span><span>© 2026</span></footer>
  </main>;
}

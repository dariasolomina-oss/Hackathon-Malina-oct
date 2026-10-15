"use client";

import { useState } from "react";
import { cards } from "@/content/cards";
import { periods, questions } from "@/content/questions";
import type { CardId, PeriodId, QuestionId } from "@/contracts/catalog";
import type { ReadingResponse } from "@/contracts/reading";
import { shuffleDeck } from "@/domain/deck";
import { requestReading } from "./client";

export function ReadingExperience() {
  const [questionId, setQuestion] = useState<QuestionId>("employee-project-deadline");
  const [periodId, setPeriod] = useState<PeriodId>("one-month");
  const [deck, setDeck] = useState<CardId[]>([]);
  const [chosen, setChosen] = useState<CardId[]>([]);
  const [result, setResult] = useState<ReadingResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function consult() {
    if (chosen.length !== 2 || busy) return;
    setBusy(true); setError("");
    try {
      setResult(await requestReading({ questionId, periodId, answerCardId: chosen[0], recommendationCardId: chosen[1] }));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Please try again.");
    } finally { setBusy(false); }
  }

  return <main>
    <p className="eyebrow">MALINA / CORPORATE ORACLE</p>
    <h1>The stars have reviewed<br />your performance.</h1>
    <p>Choose a question. Draw two cards. Get a little perspective.</p>
    <p className="notice">Development starter: readings use sample text. Live AI and astrology calendar are not connected.</p>

    <fieldset disabled={deck.length > 0}>
      <legend>Your question</legend>
      <div className="options">{questions.map((question) => <button key={question.id}
        aria-pressed={questionId === question.id} onClick={() => setQuestion(question.id)}>{question.label}</button>)}</div>
      <label>Time period <select value={periodId} onChange={(event) => setPeriod(event.target.value as PeriodId)}>
        {periods.map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}
      </select></label>
    </fieldset>

    {!deck.length && <button className="primary" onClick={() => setDeck(shuffleDeck())}>Shuffle the deck</button>}
    {!!deck.length && <section aria-label="Draw cards">
      <h2>{chosen.length === 0 ? "Draw your answer card" : chosen.length === 1 ? "Draw your recommendation card" : "Your two cards"}</h2>
      <div className="deck">{deck.map((id, index) => {
        const card = cards.find((item) => item.id === id)!;
        const position = chosen.indexOf(id);
        return <button className="card" key={id} disabled={position >= 0 || chosen.length === 2 || busy}
          aria-label={position >= 0 ? `${position === 0 ? "Answer" : "Recommendation"}: ${card.name}` : `Draw face-down card ${index + 1}`}
          onClick={() => setChosen((previous) => previous.length < 2 && !previous.includes(id) ? [...previous, id] : previous)}>
          <img src={position >= 0 ? card.image : "/cards/back.webp"} alt="" width="120" height="180" />
          <span>{position >= 0 ? (position === 0 ? "Answer" : "Recommendation") : "Draw"}</span>
        </button>;
      })}</div>
    </section>}

    {chosen.length === 2 && !result && <button className="primary" disabled={busy} onClick={consult}>
      {busy ? "Consulting the oracle…" : error ? "Try again with these cards" : "Consult the oracle"}
    </button>}
    {error && <p role="alert">{error}</p>}
    <div aria-live="polite">{result && <section className="reading">
      <p className="eyebrow">{result.meta.mode === "mock" ? "SAMPLE READING" : "YOUR READING"}</p>
      <p>{result.period.start.slice(0, 10)} through {new Date(Date.parse(result.period.end) - 86_400_000).toISOString().slice(0, 10)}</p>
      <h2>The answer</h2><p>{result.answer}</p>
      <h2>Your next move</h2><p>{result.recommendation}</p>
      {result.cosmicNote && <><h2>Cosmic timing</h2><p>{result.cosmicNote}</p></>}
      {result.meta.calendarStatus === "unavailable" && <p>Calendar unavailable — this reading uses only your cards.</p>}
      {!!result.events.length && <ul>{result.events.map((event) => <li key={event.id}>
        {event.name}: <a href={event.source.url}>{event.source.name}</a>
      </li>)}</ul>}
    </section>}</div>
    {!!deck.length && <button disabled={busy} onClick={() => { setDeck([]); setChosen([]); setResult(null); setError(""); }}>Start over</button>}
    <footer>For entertainment and reflection. The universe is not your project manager.</footer>
  </main>;
}

// Shared identifiers for the 32-card Corporate Oracle deck.
export const CARD_IDS = [
  "the-spark", "the-crossroads", "the-momentum", "the-pause", "the-shift", "the-spotlight",
  "the-fog", "the-bridge", "the-challenge", "the-opening", "the-turning-point", "the-balance",
  "the-revelation", "the-growth", "the-alignment", "the-harvest", "the-focus", "the-courage",
  "the-patience", "the-clarity", "the-connection", "the-curiosity", "the-adaptability",
  "the-preparation", "the-voice", "the-reflection", "the-simplicity", "the-trust",
  "the-perspective", "the-harmony", "the-experiment", "the-consistency",
] as const;

export const QUESTION_IDS = ["project", "recognition", "career-change", "client"] as const;
export const PERIOD_IDS = ["one-month", "three-months"] as const;
export type CardId = (typeof CARD_IDS)[number];
export type QuestionId = (typeof QUESTION_IDS)[number];
export type PeriodId = (typeof PERIOD_IDS)[number];

export interface Card {
  id: CardId;
  name: string;
  image: string;
  answerMeaning: string;
  recommendationMeaning: string;
}

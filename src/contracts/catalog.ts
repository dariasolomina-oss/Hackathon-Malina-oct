// Shared identifiers. Coordinate changes with all three tracks.
export const CARD_IDS = [
  "the-fool", "the-magician", "the-high-priestess", "the-empress", "the-emperor",
  "the-hierophant", "the-lovers", "the-chariot", "strength", "the-hermit",
  "wheel-of-fortune", "justice", "the-hanged-man", "death", "temperance",
  "the-devil", "the-tower", "the-star", "the-moon", "the-sun", "judgement", "the-world",
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

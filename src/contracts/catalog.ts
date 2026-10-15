// Shared identifiers. Coordinate changes with all three tracks.
export const CARD_IDS = [
  "the-fool", "the-magician", "the-high-priestess", "the-empress", "the-emperor",
  "the-hierophant", "the-lovers", "the-chariot", "strength", "the-hermit",
  "wheel-of-fortune", "justice", "the-hanged-man", "death", "temperance",
  "the-devil", "the-tower", "the-star", "the-moon", "the-sun", "judgement", "the-world",
  "ace-of-pentacles", "three-of-pentacles", "eight-of-pentacles", "two-of-wands", "three-of-wands",
  "eight-of-wands", "six-of-swords", "page-of-swords", "queen-of-swords", "ten-of-wands",
] as const;

export const QUESTION_IDS = [
  "employee-project-on-time", "employee-recognition", "employee-performance-review",
  "employee-new-project", "employee-jira-hours", "employee-surprise-meetings",
  "leadership-company-year", "leadership-customers", "leadership-growth-opportunities",
  "leadership-team-motivation", "leadership-strategic-priority", "leadership-priority-changes",
] as const;
export const AUDIENCE_IDS = ["employee", "leadership"] as const;
export const PERIOD_IDS = ["one-month", "three-months", "one-year"] as const;
export type CardId = (typeof CARD_IDS)[number];
export type QuestionId = (typeof QUESTION_IDS)[number];
export type AudienceId = (typeof AUDIENCE_IDS)[number];
export type PeriodId = (typeof PERIOD_IDS)[number];

export interface Card {
  id: CardId;
  name: string;
  image: string;
  answerMeaning: string;
  recommendationMeaning: string;
}

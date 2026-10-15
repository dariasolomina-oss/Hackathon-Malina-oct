// Shared identifiers. Coordinate changes with all three tracks.
export const CARD_IDS = [
  "the-fool", "the-magician", "the-high-priestess", "the-empress", "the-emperor",
  "the-hierophant", "the-lovers", "the-chariot", "strength", "the-hermit",
  "wheel-of-fortune", "justice", "the-hanged-man", "death", "temperance",
  "the-devil", "the-tower", "the-star", "the-moon", "the-sun", "judgement", "the-world",
] as const;

export type CardId = (typeof CARD_IDS)[number];

export const PERIODS = [
  { id: "one-month", label: "Next month", months: 1 },
  { id: "three-months", label: "Next three months", months: 3 },
  { id: "one-year", label: "Next year", months: 12 },
] as const;
export type PeriodId = (typeof PERIODS)[number]["id"];
export const PERIOD_IDS = PERIODS.map((period) => period.id) as [PeriodId, ...PeriodId[]];

export const AUDIENCE_IDS = ["employee", "leadership"] as const;
export type Audience = (typeof AUDIENCE_IDS)[number];

const ALL_PERIOD_IDS = PERIOD_IDS;
export const QUESTIONS = [
  {
    id: "employee-project-deadline",
    label: "Will I be able to finish my project on time?",
    audience: "employee",
    allowedPeriodIds: ALL_PERIOD_IDS,
  },
  {
    id: "employee-recognition",
    label: "Will my hard work be recognized?",
    audience: "employee",
    allowedPeriodIds: ALL_PERIOD_IDS,
  },
  {
    id: "employee-performance-review",
    label: "How will my performance review go?",
    audience: "employee",
    allowedPeriodIds: ALL_PERIOD_IDS,
  },
  {
    id: "employee-new-project",
    label: "Will an exciting new project come my way soon?",
    audience: "employee",
    allowedPeriodIds: ALL_PERIOD_IDS,
  },
  {
    id: "employee-jira-hours",
    label: "Will I finally manage to log my hours in Jira on time next year?",
    audience: "employee",
    allowedPeriodIds: ["one-year"],
  },
  {
    id: "employee-surprise-meetings",
    label: "Will I ever have a week without surprise meetings?",
    audience: "employee",
    allowedPeriodIds: ALL_PERIOD_IDS,
  },
  {
    id: "leadership-company-outlook",
    label: "What does the next year hold for our company?",
    audience: "leadership",
    allowedPeriodIds: ["one-year"],
  },
  {
    id: "leadership-customer-focus",
    label: "Which customers should we focus on attracting?",
    audience: "leadership",
    allowedPeriodIds: ALL_PERIOD_IDS,
  },
  {
    id: "leadership-growth-opportunities",
    label: "What new growth opportunities are on the horizon?",
    audience: "leadership",
    allowedPeriodIds: ALL_PERIOD_IDS,
  },
  {
    id: "leadership-team-motivation",
    label: "How can we strengthen our team and keep everyone motivated?",
    audience: "leadership",
    allowedPeriodIds: ALL_PERIOD_IDS,
  },
  {
    id: "leadership-strategic-priority",
    label: "What should be our top strategic priority?",
    audience: "leadership",
    allowedPeriodIds: ALL_PERIOD_IDS,
  },
  {
    id: "leadership-changing-priorities",
    label: "Will we finally make it through a quarter without changing our priorities?",
    audience: "leadership",
    allowedPeriodIds: ["three-months"],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  audience: Audience;
  allowedPeriodIds: readonly PeriodId[];
}[];

export type QuestionId = (typeof QUESTIONS)[number]["id"];
export type Question = (typeof QUESTIONS)[number];
export const QUESTION_IDS = QUESTIONS.map((question) => question.id) as [QuestionId, ...QuestionId[]];

export function getQuestion(id: QuestionId): Question {
  return QUESTIONS.find((question) => question.id === id)!;
}

export function isPeriodAllowed(questionId: QuestionId, periodId: PeriodId): boolean {
  return getQuestion(questionId).allowedPeriodIds.some((allowedId) => allowedId === periodId);
}

export interface Card {
  id: CardId;
  name: string;
  image: string;
  answerMeaning: string;
  recommendationMeaning: string;
}

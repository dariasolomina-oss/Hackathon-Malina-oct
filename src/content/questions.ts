import type { QuestionId, PeriodId } from "@/contracts/catalog";

export const questions: { id: QuestionId; label: string }[] = [
  { id: "project", label: "What is ahead for my project?" },
  { id: "recognition", label: "Will my work get the recognition it deserves?" },
  { id: "career-change", label: "Should I change my job or team?" },
  { id: "client", label: "How will my client negotiations go?" },
];
export const periods: { id: PeriodId; label: string }[] = [
  { id: "one-month", label: "Next month" },
  { id: "three-months", label: "Next three months" },
];

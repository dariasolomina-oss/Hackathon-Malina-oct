import type { QuestionId, PeriodId, Audience } from "@/contracts/catalog";

export const questions: { id: QuestionId; label: string; audience: Audience }[] = [
  { id: "project", label: "What is ahead for my project?", audience: "employee" },
  { id: "recognition", label: "Will my work get the recognition it deserves?", audience: "employee" },
  { id: "career-change", label: "Should I change my job or team?", audience: "employee" },
  { id: "client", label: "How will my client negotiations go?", audience: "leadership" },
];
export const periods: { id: PeriodId; label: string }[] = [
  { id: "one-month", label: "Next month" },
  { id: "three-months", label: "Next three months" },
];

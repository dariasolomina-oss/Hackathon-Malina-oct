import type { AudienceId, PeriodId, QuestionId } from "@/contracts/catalog";

export const audiences: { id: AudienceId; label: string }[] = [
  { id: "employee", label: "Employee Arcana" },
  { id: "leadership", label: "Leadership Arcana" },
];

export const questions: { id: QuestionId; audienceId: AudienceId; label: string }[] = [
  { id: "employee-project-on-time", audienceId: "employee", label: "Will I be able to finish my project on time?" },
  { id: "employee-recognition", audienceId: "employee", label: "Will my hard work be recognized?" },
  { id: "employee-performance-review", audienceId: "employee", label: "How will my performance review go?" },
  { id: "employee-new-project", audienceId: "employee", label: "Will an exciting new project come my way soon?" },
  { id: "employee-jira-hours", audienceId: "employee", label: "Will I finally manage to log my hours in Jira on time?" },
  { id: "employee-surprise-meetings", audienceId: "employee", label: "Will I ever have a week without surprise meetings?" },
  { id: "leadership-company-year", audienceId: "leadership", label: "What does the next year hold for our company?" },
  { id: "leadership-customers", audienceId: "leadership", label: "Which customers should we focus on attracting?" },
  { id: "leadership-growth-opportunities", audienceId: "leadership", label: "What new growth opportunities are on the horizon?" },
  { id: "leadership-team-motivation", audienceId: "leadership", label: "How can we strengthen our team and keep everyone motivated?" },
  { id: "leadership-strategic-priority", audienceId: "leadership", label: "What should be our top strategic priority?" },
  { id: "leadership-priority-changes", audienceId: "leadership", label: "Will we finally make it through a quarter without changing our priorities?" },
];

export const periods: { id: PeriodId; label: string }[] = [
  { id: "one-month", label: "Next month" },
  { id: "three-months", label: "Next three months" },
  { id: "one-year", label: "Next year" },
];

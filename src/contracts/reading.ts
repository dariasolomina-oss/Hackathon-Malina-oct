import { z } from "zod";
import { CARD_IDS, PERIOD_IDS, QUESTION_IDS, isPeriodAllowed } from "./catalog";

export const readingRequestSchema = z.object({
  questionId: z.enum(QUESTION_IDS),
  periodId: z.enum(PERIOD_IDS),
  answerCardId: z.enum(CARD_IDS),
  recommendationCardId: z.enum(CARD_IDS),
}).strict().refine((value) => value.answerCardId !== value.recommendationCardId, {
  message: "Choose two different cards.", path: ["recommendationCardId"],
}).refine((value) => isPeriodAllowed(value.questionId, value.periodId), {
  message: "The selected period is not available for this question.", path: ["periodId"],
});

export type ReadingRequest = z.infer<typeof readingRequestSchema>;
// UTC instants; every range is start-inclusive and end-exclusive.
export interface DateRange { start: string; end: string }
export interface AstroEvent {
  id: string;
  name: string;
  kind: "retrograde" | "lunation" | "eclipse" | "aspect";
  start: string;
  // Null means an instantaneous event. Otherwise, the end is exclusive.
  end: string | null;
  interpretation: string;
  source: { name: string; url: string };
}
export interface CalendarResult {
  status: "available" | "unavailable";
  events: AstroEvent[];
}
export interface OracleText {
  answer: string;
  recommendation: string;
  cosmicNote: string | null;
}

export interface NasaSkyEvent {
  id: string;
  name: string;
  kind: "solar-eclipse" | "lunar-eclipse" | "meteor-shower";
  date: string;
  // Inclusive date-only endpoint for a meteor peak spanning two nights.
  endDate?: string;
  visibility: string;
  source: { name: string; url: string };
}

export interface ReadingResponse extends OracleText {
  request: ReadingRequest;
  period: DateRange;
  events: AstroEvent[];
  /** All verified events overlapping the period; the oracle receives only `events`. */
  availableEvents?: AstroEvent[];
  meta: {
    mode: "mock" | "live";
    calendarStatus: CalendarResult["status"];
  };
}
export interface ApiError {
  error: { code: "INVALID_REQUEST" | "READING_FAILED"; message: string };
}

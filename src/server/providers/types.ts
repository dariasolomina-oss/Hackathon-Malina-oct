import type { Audience, Card } from "@/contracts/catalog";
import type { AstroEvent, CalendarResult, DateRange, OracleText } from "@/contracts/reading";

export interface OracleInput {
  audience: Audience;
  question: string;
  period: DateRange;
  answerCard: Card;
  recommendationCard: Card;
  events: AstroEvent[];
}
export interface OracleProvider {
  mode: "mock" | "live";
  generate(input: OracleInput): Promise<OracleText>;
}
export interface CalendarProvider {
  getEvents(period: DateRange): Promise<CalendarResult>;
}

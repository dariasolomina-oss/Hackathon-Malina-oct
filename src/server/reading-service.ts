import { cards } from "@/content/cards";
import { questions } from "@/content/questions";
import { readingRequestSchema, type ReadingRequest, type ReadingResponse } from "@/contracts/reading";
import { resolvePeriod } from "@/domain/period";
import { selectEvents } from "@/domain/events";
import { calendarProvider } from "./providers/calendar";
import { oracleProvider } from "./providers/oracle";
import type { CalendarProvider, OracleProvider } from "./providers/types";

export async function createReading(
  input: ReadingRequest,
  dependencies: { calendar: CalendarProvider; oracle: OracleProvider; now?: Date } = {
    calendar: calendarProvider, oracle: oracleProvider,
  },
): Promise<ReadingResponse> {
  const request = readingRequestSchema.parse(input);
  const answerCard = cards.find((card) => card.id === request.answerCardId);
  const recommendationCard = cards.find((card) => card.id === request.recommendationCardId);
  const question = questions.find((item) => item.id === request.questionId);
  if (!answerCard || !recommendationCard || !question) throw new Error("Incomplete content catalog.");
  const period = resolvePeriod(request.periodId, dependencies.now);
  const calendar = await dependencies.calendar.getEvents(period).catch(() => ({
    status: "unavailable" as const, events: [],
  }));
  const events = calendar.status === "available" ? selectEvents(calendar.events, period) : [];
  const text = await dependencies.oracle.generate({
    question: question.label, period, answerCard, recommendationCard, events,
  });
  return {
    ...text, cosmicNote: events.length ? text.cosmicNote : null,
    request, period, events,
    meta: { mode: dependencies.oracle.mode, calendarStatus: calendar.status },
  };
}

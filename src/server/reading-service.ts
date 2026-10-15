import { cards } from "@/content/cards";
import { getQuestion } from "@/contracts/catalog";
import { readingRequestSchema, type ReadingRequest, type ReadingResponse } from "@/contracts/reading";
import { resolvePeriod } from "@/domain/period";
import { selectEvents } from "@/domain/events";
import { calendarProvider } from "./providers/calendar";
import { createConfiguredOracleProvider } from "./providers/oracle";
import type { CalendarProvider, OracleProvider } from "./providers/types";

interface ReadingDependencies {
  calendar?: CalendarProvider;
  oracle?: OracleProvider;
  now?: Date;
}

export async function createReading(
  input: ReadingRequest,
  dependencies: ReadingDependencies = {},
): Promise<ReadingResponse> {
  const request = readingRequestSchema.parse(input);
  const calendarDependency = dependencies.calendar ?? calendarProvider;
  const oracleDependency = dependencies.oracle ?? await createConfiguredOracleProvider();
  const answerCard = cards.find((card) => card.id === request.answerCardId);
  const recommendationCard = cards.find((card) => card.id === request.recommendationCardId);
  const question = getQuestion(request.questionId);
  if (!answerCard || !recommendationCard) throw new Error("Incomplete content catalog.");
  const period = resolvePeriod(request.periodId, dependencies.now);
  const calendar = await calendarDependency.getEvents(period).catch(() => ({
    status: "unavailable" as const, events: [],
  }));
  const events = calendar.status === "available" ? selectEvents(calendar.events, period) : [];
  const text = await oracleDependency.generate({
    audience: question.audience, question: question.label, period, answerCard, recommendationCard, events,
  });
  return {
    ...text, cosmicNote: events.length ? text.cosmicNote : null,
    request, period, events,
    meta: { mode: oracleDependency.mode, calendarStatus: calendar.status },
  };
}

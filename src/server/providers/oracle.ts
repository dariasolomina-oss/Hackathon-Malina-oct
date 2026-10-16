import type { OracleProvider } from "./types";
import { getOracleConfig, type OracleConfig } from "../oracle-config";
import { formatEventTiming } from "../event-timing";

type LiveOracleConfig = Extract<OracleConfig, { mode: "live" }>;
type LiveOracleFactory = (config: LiveOracleConfig) => Promise<OracleProvider> | OracleProvider;

// Deterministic development placeholder. Never label this as a live AI result.
export const mockOracleProvider: OracleProvider = {
  mode: "mock",
  async generate({ audience, question, period, answerCard, recommendationCard, events }) {
    const answerMeaning = answerCard.meanings[audience].answer;
    const recommendationMeaning = recommendationCard.meanings[audience].recommendation;
    const context = audience === "employee"
      ? "Keep the next step practical for your own work and daily routine."
      : "Frame the next step around company direction, customers, and the team.";
    const event = events[0];
    const cosmicNote = event ? `${formatEventTiming(event, period)} ${event.interpretation}` : null;
    const recommendation = `${recommendationCard.name} suggests: ${recommendationMeaning} Even cosmic alignment benefits from a clear owner and a written next step.`;
    return {
      answer: `You asked: "${question}" ${answerCard.name} replies: ${answerMeaning} ${context}`,
      recommendation: cosmicNote ? `${recommendation} ${cosmicNote}` : recommendation,
      cosmicNote,
    };
  },
};

export async function createConfiguredOracleProvider(
  environment: Record<string, string | undefined> = process.env,
  createLiveOracle: LiveOracleFactory = async (config) => {
    const { createOpenAIOracleProvider } = await import("../openai-oracle");
    return createOpenAIOracleProvider(config);
  },
): Promise<OracleProvider> {
  const config = getOracleConfig(environment);
  if (config.mode === "mock") return mockOracleProvider;

  // The SDK and credentials stay behind the server-only live-mode boundary.
  return createLiveOracle(config);
}

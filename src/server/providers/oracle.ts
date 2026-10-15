import type { OracleProvider } from "./types";
import { getOracleConfig, type OracleConfig } from "../oracle-config";

type LiveOracleConfig = Extract<OracleConfig, { mode: "live" }>;
type LiveOracleFactory = (config: LiveOracleConfig) => Promise<OracleProvider> | OracleProvider;

// Deterministic development placeholder. Never label this as a live AI result.
export const mockOracleProvider: OracleProvider = {
  mode: "mock",
  async generate({ audience, question, answerCard, recommendationCard }) {
    const context = audience === "employee"
      ? "Keep the next step practical for your own work and daily routine."
      : "Frame the next step around company direction, customers, and the team.";
    return {
      answer: `You asked: "${question}" ${answerCard.name} replies: ${answerCard.answerMeaning} ${context}`,
      recommendation: `${recommendationCard.name} suggests: ${recommendationCard.recommendationMeaning} Even cosmic alignment benefits from a clear owner and a written next step.`,
      cosmicNote: null,
    };
  },
};

// Compatibility export for injected tests and frontend development.
export const oracleProvider = mockOracleProvider;

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

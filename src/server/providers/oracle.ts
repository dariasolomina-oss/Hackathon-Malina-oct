import type { OracleProvider } from "./types";

// Deterministic development placeholder. Never label this as a live AI result.
export const oracleProvider: OracleProvider = {
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

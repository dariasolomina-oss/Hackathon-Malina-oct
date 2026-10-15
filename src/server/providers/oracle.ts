import type { OracleProvider } from "./types";

// Deterministic development placeholder. Never label this as a live AI result.
export const oracleProvider: OracleProvider = {
  mode: "mock",
  async generate({ question, answerCard, recommendationCard }) {
    return {
      answer: `You asked: "${question}" ${answerCard.name} replies: ${answerCard.answerMeaning} The universe has reviewed the meeting notes. Apparently, someone still owes you an update.`,
      recommendation: `${recommendationCard.name} suggests: ${recommendationCard.recommendationMeaning} Put it in writing. Even cosmic alignment needs a paper trail.`,
      cosmicNote: null,
    };
  },
};

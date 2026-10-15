import type { OracleProvider } from "./types";

// Deterministic development placeholder. Never label this as a live AI result.
export const oracleProvider: OracleProvider = {
  mode: "mock",
  async generate({ audience, question, answerCard, recommendationCard }) {
    const answerMeaning = answerCard.meanings[audience];
    const recommendationMeaning = recommendationCard.meanings[audience];
    return {
      answer: `You asked: "${question}" ${answerCard.name} replies: ${answerMeaning.answer} The universe has reviewed the meeting notes. Apparently, someone still owes you an update.`,
      recommendation: `${recommendationCard.name} suggests: ${recommendationMeaning.recommendation} Put it in writing. Even cosmic alignment needs a paper trail.`,
      cosmicNote: null,
    };
  },
};

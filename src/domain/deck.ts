import { CARD_IDS, type CardId } from "@/contracts/catalog";

// Run once per reading, then reveal cards from this order. Retries keep the same cards.
export function shuffleDeck(random: () => number = Math.random): CardId[] {
  const result = [...CARD_IDS];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

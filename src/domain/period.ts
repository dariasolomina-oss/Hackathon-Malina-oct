import { PERIODS, type PeriodId } from "@/contracts/catalog";
import type { DateRange } from "@/contracts/reading";

export function resolvePeriod(id: PeriodId, now = new Date()): DateRange {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const months = PERIODS.find((period) => period.id === id)!.months;
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return { start: start.toISOString(), end: end.toISOString() };
}

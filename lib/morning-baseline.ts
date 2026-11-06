import { witaDate } from './normalize';

export interface MorningBaseline { date: string; capturedAt: string; counts: Record<string, number> }

// Only actual captures in the first five minutes after 08:00 WITA are eligible.
// A later first report must never be mislabeled as an 08:00 snapshot.
export function isMorningCapture(value: string | Date): boolean {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.valueOf()) && date.getUTCHours() === 0 && date.getUTCMinutes() < 5;
}
export function usableMorningBaseline(baseline: MorningBaseline | null, reportDate: string, fetchedAt: string): boolean {
  return !!baseline && baseline.date === reportDate && isMorningCapture(baseline.capturedAt)
    && witaDate(new Date(baseline.capturedAt)) === reportDate && Date.parse(baseline.capturedAt) <= Date.parse(fetchedAt);
}

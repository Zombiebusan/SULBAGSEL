import type { Workzone, Ticket } from './types';
import { counts } from './db';
import { isReferenceUnspecTicket, normalizeTickets } from './normalize';
import { usableMorningBaseline, type MorningBaseline } from './morning-baseline';

export function previousReportDate(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

export function botReportPayload(current: { date: string; capturedAt: string; counts: Record<string, number>; mapping: Record<string, Workzone> }, previous: Ticket[] | null, morning: MorningBaseline | null = null) {
  const codes = Object.keys(current.mapping).filter(code => current.mapping[code].region === 'SULBAGSEL').sort();
  const aggregate = (balances: Record<string, number>) => {
    const countsByWorkzone = Object.fromEntries(codes.map(code => [code, balances[code] || 0]));
    return { countsByWorkzone, total: Object.values(countsByWorkzone).reduce((sum, value) => sum + value, 0) };
  };
  return {
    version: 1, scope: 'SULBAGSEL', cohort: 'PROACTIVE_UNSPEC', complete: true,
    date: current.date, fetchedAt: current.capturedAt, current: aggregate(current.counts),
    previous: previous === null ? null : {
      date: previousReportDate(current.date),
      ...aggregate(counts(normalizeTickets(previous.filter(isReferenceUnspecTicket), current.mapping))),
    },
    morning: morning && usableMorningBaseline(morning, current.date, current.capturedAt) ? {
      date: morning.date, scheduledTime: '08:00', timeZone: 'Asia/Makassar', capturedAt: morning.capturedAt,
      ...aggregate(morning.counts),
    } : null,
  };
}

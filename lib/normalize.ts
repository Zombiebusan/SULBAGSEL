import type { Ticket, Workzone } from './types';

export const code = (v: unknown) => String(v ?? '').trim().toUpperCase();
// Matches the proactive UNSPEC cohort in the HTML reference and export (45).csv.
// SOURCE_TICKET differs between the CSV (PROACTIVE) and API (UNSPEC).
export function isReferenceUnspecTicket(row: Record<string, unknown>) {
  const summary = String(row.SUMMARY ?? '').trim();
  const reportedBy = code(row.REPORTED_BY ?? row['REPORTED BY']);
  return /^\[UNSPEC\](?:\s|$)/i.test(summary)
    && /proactive\s+underspec/i.test(summary)
    && (!reportedBy || reportedBy === 'PROACTIVE_OHI');
}
export function normalizeMapping(rows: Record<string, unknown>[]) {
  const mapping: Record<string, Workzone> = {};
  for (const row of rows) {
    const workzone = code(row.WORKZONE);
    if (!workzone) continue;
    mapping[workzone] = {
      branch: code(row.BRANCH) === 'PAREPARE' ? 'PARE-PARE' : code(row.BRANCH),
      sa: code(row.SERVICE_AREA), region: code(row.REGIONAL),
    };
  }
  return mapping;
}
export function normalizeTickets(rows: Record<string, unknown>[], mapping: Record<string, Workzone>): Ticket[] {
  const unique = new Map<string, Ticket>();
  for (const row of rows) {
    const incident = code(row.INCIDENT), workzone = code(row.WORKZONE);
    if (!incident || mapping[workzone]?.region !== 'SULBAGSEL') continue;
    unique.set(incident, {
      INCIDENT: incident, WORKZONE: workzone,
      'SERVICE NO': String(row.SERVICE_NO ?? row['SERVICE NO'] ?? ''),
      'CUSTOMER NAME': String(row.CUSTOMER_NAME ?? row['CUSTOMER NAME'] ?? ''),
      'REPORTED DATE': String(row.REPORTED_DATE ?? row['REPORTED DATE'] ?? ''),
      STATUS: String(row.STATUS ?? ''), SUMMARY: String(row.SUMMARY ?? ''),
      'REPORTED BY': String(row.REPORTED_BY ?? row['REPORTED BY'] ?? ''),
      'SOURCE TICKET': String(row.SOURCE_TICKET ?? row['SOURCE TICKET'] ?? ''),
    });
  }
  return [...unique.values()];
}
export function witaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = (key: string) => parts.find(p => p.type === key)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

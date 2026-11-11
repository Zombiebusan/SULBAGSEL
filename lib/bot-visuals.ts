import { database, initialize } from './db';
import { reference } from './reference';
import { validBotRequestId, readBotRequest } from './bot-requests';

export interface VisualHistory {
  version: 1;
  requestId: string;
  date: string;
  fetchedAt: string;
  daily: Record<string, Record<string, number>>;
  monthly: Record<string, { saldo: Record<string, number>; customers: Record<string, number> }>;
  customers: Record<string, number>;
  imjas: { weight: number; branch: Record<string, number>; sa: Record<string, number>; regionalReported: number };
}

export function visualOperationalDate(fetchedAt: string): string {
  // Midnight UTC equals 08:00 WITA; avoid using the dashboard's calendar date before 08:00.
  return new Date(fetchedAt).toISOString().slice(0, 10);
}

export async function botVisualHistory(requestId: string): Promise<VisualHistory | null> {
  if (!validBotRequestId(requestId)) return null;
  const job = await readBotRequest(requestId);
  if (job?.status !== 'complete' || !job.payload) return null;
  const payload = job.payload;
  // The bot's operational day switches at 08:00 WITA, which equals 00:00 UTC.
  const reportDate = visualOperationalDate(payload.fetchedAt);
  await initialize();
  const sql = database();
  // Small aggregate-only history: no incidents, customer names or raw tickets leave the dashboard.
  const [dailyRows, monthlyRows] = await sql.transaction([
    sql`SELECT date, counts FROM unspec_snapshots WHERE date <= ${payload.date} AND date >= ((${payload.date}::date - interval '45 days')::date)::text ORDER BY date`,
    sql`SELECT DISTINCT ON (left(date, 7)) date, counts FROM unspec_snapshots
      WHERE date <= ${payload.date} AND (date NOT LIKE '2026-10-%' OR date <= '2026-10-30')
      ORDER BY left(date, 7), date DESC`,
  ], { isolationLevel: 'RepeatableRead', readOnly: true });
  const { initial } = await reference();
  const onlySulbagsel = (values: Record<string, number>): Record<string, number> => Object.fromEntries(Object.entries(values).filter(([code]) => initial.mapping[code]?.region === 'SULBAGSEL'));
  const daily: VisualHistory['daily'] = Object.fromEntries(dailyRows.map(row => [row.date, row.counts]));
  if (payload.date !== reportDate) delete daily[payload.date];
  daily[reportDate] = payload.current.countsByWorkzone;
  const monthly: VisualHistory['monthly'] = Object.fromEntries(Object.entries(initial.monthly).map(([month, value]) => [month, { saldo: onlySulbagsel(value.saldo), customers: onlySulbagsel(value.customers) }]));
  for (const row of monthlyRows) {
    const month = String(row.date).slice(0, 7);
    if (month >= '2026-10') monthly[month] = { saldo: onlySulbagsel(row.counts), customers: onlySulbagsel(initial.customers) };
  }
  if (reportDate.slice(0, 7) !== '2026-10' || reportDate <= '2026-10-30')
    monthly[reportDate.slice(0, 7)] = { saldo: payload.current.countsByWorkzone, customers: onlySulbagsel(initial.customers) };
  return { version: 1, requestId, date: reportDate, fetchedAt: payload.fetchedAt, daily, monthly,
    customers: onlySulbagsel(initial.customers), imjas: initial.imjas };
}

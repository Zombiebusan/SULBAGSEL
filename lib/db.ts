import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';
import { reference } from './reference';
import { isReferenceUnspecTicket, normalizeTickets, witaDate } from './normalize';
import { fetchComplete } from './upstream';
import type { Ticket, Workzone } from './types';
import { isMorningCapture, type MorningBaseline } from './morning-baseline';

export function counts(rows: Ticket[]) {
  const result: Record<string, number> = {};
  for (const r of rows) result[r.WORKZONE] = (result[r.WORKZONE] || 0) + 1;
  return result;
}
export const databaseConfigured = () => !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('USER:PASSWORD');
export function database() {
  if (!databaseConfigured()) throw new Error('DATABASE_URL Neon belum dikonfigurasi.');
  return neon(process.env.DATABASE_URL!);
}
let ready: Promise<void> | undefined;
export function initialize() {
  return ready ??= setup().catch(error => { ready = undefined; throw error; });
}
async function setup() {
  const sql = database();
  await sql`CREATE TABLE IF NOT EXISTS unspec_snapshots (
    date text PRIMARY KEY CHECK (date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
    tickets jsonb NOT NULL, counts jsonb NOT NULL,
    captured_at timestamptz NOT NULL DEFAULT now(), source text NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS unspec_state (
    id integer PRIMARY KEY CHECK (id = 1), mapping jsonb,
    synced_at timestamptz, error text, lock_token text, lock_until timestamptz,
    source_total integer, seeded boolean NOT NULL DEFAULT false
  )`;
  await sql`CREATE TABLE IF NOT EXISTS unspec_bot_requests (
    request_id text PRIMARY KEY,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','complete','failed')),
    requested_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
    owner_token text, lease_until timestamptz, payload jsonb, error_code text
  )`;
  await sql`CREATE TABLE IF NOT EXISTS unspec_morning_baselines (
    date text PRIMARY KEY CHECK (date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
    counts jsonb NOT NULL, captured_at timestamptz NOT NULL,
    CHECK ((captured_at AT TIME ZONE 'Asia/Makassar')::date::text = date),
    CHECK ((captured_at AT TIME ZONE 'Asia/Makassar')::time >= TIME '08:00:00'
      AND (captured_at AT TIME ZONE 'Asia/Makassar')::time < TIME '08:05:00')
  )`;
  await sql`INSERT INTO unspec_state (id) VALUES (1) ON CONFLICT DO NOTHING`;
  const state = await sql`SELECT seeded FROM unspec_state WHERE id = 1`;
  if (!state[0].seeded) {
    const { initial } = await reference();
    const today = witaDate();
    const snapshots = Object.entries(initial.snapshots).filter(([date]) => date <= today);
    await sql.transaction([
      ...snapshots.map(([date, raw]) => {
        const rows = normalizeTickets(raw, initial.mapping);
        return sql`INSERT INTO unspec_snapshots (date, tickets, counts, source)
          VALUES (${date}, ${JSON.stringify(rows)}::jsonb, ${JSON.stringify(counts(rows))}::jsonb, 'reference') ON CONFLICT DO NOTHING`;
      }),
      sql`UPDATE unspec_state SET seeded = true WHERE id = 1`,
    ]);
  }
}
export async function dashboardState() {
  const { initial } = await reference();
  if (!databaseConfigured()) return {
    snapshots: Object.fromEntries(Object.entries(initial.snapshots).map(([d, rs]) => [d, counts(normalizeTickets(rs, initial.mapping))])),
    mapping: initial.mapping, syncedAt: null, error: 'Neon belum dikonfigurasi. Menampilkan histori referensi.', persisted: false,
  };
  await initialize();
  const sql = database();
  const [snapshots, state] = await Promise.all([
    sql`SELECT date, counts FROM unspec_snapshots ORDER BY date`,
    sql`SELECT mapping, synced_at, error, source_total FROM unspec_state WHERE id = 1`,
  ]);
  return {
    snapshots: Object.fromEntries(snapshots.map(row => [row.date, row.counts])),
    mapping: state[0].mapping || initial.mapping,
    syncedAt: state[0].synced_at, error: state[0].error,
    sourceTotal: state[0].source_total, persisted: true,
  };
}
export async function snapshot(date: string): Promise<Ticket[] | null> {
  if (!databaseConfigured()) {
    const { initial } = await reference();
    return initial.snapshots[date] ? normalizeTickets(initial.snapshots[date], initial.mapping) : null;
  }
  await initialize();
  const rows = await database()`SELECT tickets FROM unspec_snapshots WHERE date = ${date}`;
  return rows[0]?.tickets ?? null;
}

export async function dashboardExportState() {
  const { initial } = await reference();
  if (!databaseConfigured()) {
    const snapshots = Object.fromEntries(Object.entries(initial.snapshots).map(([date, rows]) => [date, normalizeTickets(rows, initial.mapping)]));
    return { state: await dashboardState(), snapshots };
  }
  await initialize();
  const sql = database();
  const [rows, states] = await sql.transaction([
    sql`SELECT date, tickets FROM unspec_snapshots ORDER BY date`,
    sql`SELECT mapping, synced_at, error FROM unspec_state WHERE id = 1`,
  ], { isolationLevel: 'RepeatableRead', readOnly: true });
  const snapshots: Record<string, Ticket[]> = Object.fromEntries(rows.map(row => [row.date, row.tickets]));
  return {
    snapshots,
    state: {
      snapshots: Object.fromEntries(Object.entries(snapshots).map(([date, tickets]) => [date, counts(tickets)])),
      mapping: states[0]?.mapping || initial.mapping,
      syncedAt: states[0]?.synced_at ?? null, error: states[0]?.error ?? null, persisted: true,
    },
  };
}
export interface SynchronizedSnapshot { date: string; count: number; counts: Record<string, number>; mapping: Record<string, Workzone>; capturedAt: string }

export async function morningBaseline(date: string): Promise<MorningBaseline | null> {
  if (!databaseConfigured()) return null;
  await initialize();
  const rows = await database()`SELECT date, counts, captured_at FROM unspec_morning_baselines WHERE date = ${date}`;
  return rows[0] ? { date: rows[0].date, counts: rows[0].counts, capturedAt: new Date(rows[0].captured_at).toISOString() } : null;
}

export async function synchronizedAfter(minimumTime: string): Promise<SynchronizedSnapshot | null> {
  await initialize();
  const rows = await database()`SELECT p.date, p.counts, jsonb_array_length(p.tickets) AS count, s.mapping, s.synced_at
    FROM unspec_state s JOIN unspec_snapshots p ON p.date = to_char(s.synced_at AT TIME ZONE 'Asia/Makassar', 'YYYY-MM-DD')
    WHERE s.id = 1 AND s.synced_at >= ${minimumTime}::timestamptz AND p.source = 'api'`;
  const row = rows[0];
  return row ? { date: row.date, counts: row.counts, count: Number(row.count), mapping: row.mapping, capturedAt: new Date(row.synced_at).toISOString() } : null;
}

export async function synchronize(signal?: AbortSignal, requestTimeoutMs = 25000) {
  await initialize();
  const sql = database(), token = randomUUID();
  const lease = await sql`UPDATE unspec_state SET lock_token = ${token}, lock_until = now() + interval '240 seconds'
    WHERE id = 1 AND (lock_until IS NULL OR lock_until < now()) RETURNING id`;
  if (!lease.length) return { skipped: true as const };
  try {
    const { mapping, tickets, sourceTotal } = await fetchComplete(signal, requestTimeoutMs);
    signal?.throwIfAborted();
    const capturedAt = new Date().toISOString(), date = witaDate(new Date(capturedAt));
    const balances = counts(tickets);
    const [written] = await sql.transaction([
      sql`INSERT INTO unspec_snapshots (date, tickets, counts, source)
        SELECT ${date}, ${JSON.stringify(tickets)}::jsonb, ${JSON.stringify(balances)}::jsonb, 'api'
        WHERE EXISTS (SELECT 1 FROM unspec_state WHERE id = 1 AND lock_token = ${token} AND lock_until > now())
        ON CONFLICT (date) DO UPDATE SET tickets = EXCLUDED.tickets, counts = EXCLUDED.counts, captured_at = now(), source = 'api' RETURNING date`,
      ...(isMorningCapture(capturedAt) ? [sql`INSERT INTO unspec_morning_baselines (date, counts, captured_at)
        SELECT ${date}, ${JSON.stringify(balances)}::jsonb, ${capturedAt}::timestamptz
        WHERE EXISTS (SELECT 1 FROM unspec_state WHERE id = 1 AND lock_token = ${token} AND lock_until > now())
        ON CONFLICT (date) DO NOTHING`] : []),
      sql`UPDATE unspec_state SET mapping = ${JSON.stringify(mapping)}::jsonb, synced_at = ${capturedAt}, error = NULL,
        source_total = ${sourceTotal}, lock_token = NULL, lock_until = NULL WHERE id = 1 AND lock_token = ${token} AND lock_until > now()`,
    ]);
    if (!written.length) throw new Error('Lease sinkronisasi berakhir sebelum snapshot disimpan.');
    return { skipped: false as const, date, count: tickets.length, counts: balances, mapping, capturedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sinkronisasi gagal.';
    await sql`UPDATE unspec_state SET error = ${message}, lock_token = NULL, lock_until = NULL WHERE id = 1 AND lock_token = ${token}`;
    throw error;
  }
}
export async function importSnapshots(input: Record<string, unknown>) {
  await initialize();
  const { initial } = await reference();
  const sql = database(), state = await sql`SELECT mapping FROM unspec_state WHERE id = 1`;
  const mapping: Record<string, Workzone> = { ...initial.mapping, ...state[0].mapping };
  const entries = Object.entries(input);
  if (!entries.length || entries.length > 400) throw new Error('Jumlah snapshot tidak valid (maksimal 400 per impor).');
  const prepared = entries.map(([date, raw]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date > witaDate() || !Array.isArray(raw) || raw.length > 30000) throw new Error('Tanggal atau isi snapshot tidak valid.');
    if (raw.some(row => !row || typeof row !== 'object' || !String(row.INCIDENT ?? '').trim() || !mapping[String(row.WORKZONE ?? '').trim().toUpperCase()])) throw new Error('INCIDENT kosong atau WORKZONE belum terpetakan.');
    const rows = normalizeTickets(raw.filter(isReferenceUnspecTicket), mapping);
    if (raw.length && !rows.length) throw new Error('Tidak ada tiket proactive UNSPEC Sulbagsel yang sesuai referensi.');
    if (JSON.stringify(rows).length > 3_000_000) throw new Error('Ukuran snapshot terlalu besar.');
    return { date, rows };
  });
  await sql.transaction(prepared.map(({ date, rows }) => sql`INSERT INTO unspec_snapshots (date, tickets, counts, source)
    VALUES (${date}, ${JSON.stringify(rows)}::jsonb, ${JSON.stringify(counts(rows))}::jsonb, 'import')
    ON CONFLICT (date) DO UPDATE SET tickets = EXCLUDED.tickets, counts = EXCLUDED.counts, captured_at = now(), source = 'import'`));
  return prepared.length;
}

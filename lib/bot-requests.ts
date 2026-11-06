import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { database, initialize, morningBaseline, snapshot, synchronize, synchronizedAfter, type SynchronizedSnapshot } from './db';
import { botReportPayload, previousReportDate } from './bot-report';
import { UpstreamHttpError } from './upstream';
import type { Ticket } from './types';
import type { MorningBaseline } from './morning-baseline';

export type BotFailureCode = 'UPSTREAM_TIMEOUT' | 'UPSTREAM_HTTP_ERROR' | 'UPSTREAM_CHANGED' | 'SYNC_FAILED';
export type BotPayload = ReturnType<typeof botReportPayload> & { requestId: string; requestedAt: string; completedAt: string };
export interface BotRequest {
  requestId: string; status: 'pending' | 'running' | 'complete' | 'failed'; requestedAt: string;
  payload: BotPayload | null; errorCode: BotFailureCode | null; needsWork: boolean;
}
export const validBotRequestId = (id: string) => /^[A-Za-z0-9_-]{8,100}$/.test(id);

export async function readBotRequest(id: string): Promise<BotRequest | null> {
  await initialize();
  const rows = await database()`SELECT request_id, status, requested_at, payload, error_code,
    (status = 'pending' OR (status = 'running' AND (lease_until IS NULL OR lease_until < now()))) AS needs_work
    FROM unspec_bot_requests WHERE request_id = ${id}`;
  const row = rows[0];
  return row ? { requestId: row.request_id, status: row.status, requestedAt: new Date(row.requested_at).toISOString(), payload: row.payload, errorCode: row.error_code, needsWork: row.needs_work } : null;
}
export async function createBotRequest(id: string): Promise<BotRequest> {
  await initialize();
  await database()`INSERT INTO unspec_bot_requests (request_id) VALUES (${id}) ON CONFLICT DO NOTHING`;
  return (await readBotRequest(id))!;
}
async function claim(id: string, owner: string): Promise<string | null> {
  const rows = await database()`UPDATE unspec_bot_requests SET status = 'running', owner_token = ${owner},
    lease_until = now() + interval '240 seconds', updated_at = now()
    WHERE request_id = ${id} AND (status = 'pending' OR (status = 'running' AND (lease_until IS NULL OR lease_until < now())))
    RETURNING requested_at`;
  return rows[0] ? new Date(rows[0].requested_at).toISOString() : null;
}
async function complete(id: string, owner: string, payload: BotPayload) {
  await database()`UPDATE unspec_bot_requests SET status = 'complete', payload = ${JSON.stringify(payload)}::jsonb,
    error_code = NULL, lease_until = NULL, updated_at = now() WHERE request_id = ${id} AND owner_token = ${owner}`;
}
async function fail(id: string, owner: string, code: BotFailureCode) {
  await database()`UPDATE unspec_bot_requests SET status = 'failed', error_code = ${code},
    lease_until = NULL, updated_at = now() WHERE request_id = ${id} AND owner_token = ${owner}`;
}
export function botFailureCode(error: unknown): BotFailureCode {
  if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) return 'UPSTREAM_TIMEOUT';
  if (error instanceof UpstreamHttpError) return 'UPSTREAM_HTTP_ERROR';
  if (error instanceof Error && /berubah selama pagination|Pagination tidak lengkap/.test(error.message)) return 'UPSTREAM_CHANGED';
  return 'SYNC_FAILED';
}
export interface BotWorkerDependencies {
  claim: typeof claim;
  fresh: (minimumTime: string) => Promise<SynchronizedSnapshot | null>;
  sync: (signal: AbortSignal) => Promise<({ skipped: false } & SynchronizedSnapshot) | { skipped: true }>;
  previous: (date: string) => Promise<Ticket[] | null>;
  morning: (date: string) => Promise<MorningBaseline | null>;
  complete: (id: string, owner: string, payload: BotPayload) => Promise<void>;
  fail: (id: string, owner: string, code: BotFailureCode) => Promise<void>;
  pause: (signal: AbortSignal) => Promise<void>;
}
const dependencies: BotWorkerDependencies = {
  claim, fresh: synchronizedAfter, sync: signal => synchronize(signal, 45000), previous: snapshot, morning: morningBaseline, complete, fail,
  pause: signal => delay(2000, undefined, { signal }),
};

export async function runBotRequest(id: string, deps = dependencies): Promise<void> {
  const owner = randomUUID(), requestedAt = await deps.claim(id, owner);
  if (!requestedAt) return;
  const signal = AbortSignal.timeout(210000);
  let transientRetries = 0;
  try {
    for (;;) {
      signal.throwIfAborted();
      let current = await deps.fresh(requestedAt);
      if (!current) {
        let result: Awaited<ReturnType<BotWorkerDependencies['sync']>>;
        try { result = await deps.sync(signal); }
        catch (error) {
          const code = botFailureCode(error);
          if (!signal.aborted && transientRetries < 2 && ['UPSTREAM_TIMEOUT', 'UPSTREAM_HTTP_ERROR', 'UPSTREAM_CHANGED'].includes(code)) {
            transientRetries++;await deps.pause(signal);continue;
          }
          throw error;
        }
        if (result.skipped) { await deps.pause(signal); continue; }
        current = result;
      }
      const previous = await deps.previous(previousReportDate(current.date));
      const morning = await deps.morning(current.date);
      signal.throwIfAborted();
      await deps.complete(id, owner, { ...botReportPayload(current, previous, morning), requestId: id, requestedAt, completedAt: new Date().toISOString() });
      return;
    }
  } catch (error) { await deps.fail(id, owner, botFailureCode(error)); }
}

export const botFailureMessage: Record<BotFailureCode, string> = {
  UPSTREAM_TIMEOUT: 'API sumber MONICA terlalu lama merespons. Silakan tekan cetak kembali beberapa saat lagi.',
  UPSTREAM_HTTP_ERROR: 'API sumber MONICA sedang bermasalah. Silakan tekan cetak kembali beberapa saat lagi.',
  UPSTREAM_CHANGED: 'Data sumber berubah saat pengambilan sehingga belum lengkap. Silakan cetak kembali.',
  SYNC_FAILED: 'Sinkronisasi sumber atau database belum berhasil. Silakan cetak kembali.',
};

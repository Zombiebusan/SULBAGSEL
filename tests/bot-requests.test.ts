import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runBotRequest, validBotRequestId, botFailureCode, type BotWorkerDependencies, type BotPayload, type BotFailureCode } from '../lib/bot-requests';
import { UpstreamHttpError } from '../lib/upstream';
import type { SynchronizedSnapshot } from '../lib/db';

const current: SynchronizedSnapshot = { date: '2026-11-06', capturedAt: '2026-11-06T00:01:00Z', count: 2, counts: { ANT: 2 }, mapping: {
  ANT: { branch: 'MAKASSAR', sa: 'SA TAMALANREA', region: 'SULBAGSEL' },
  WTP: { branch: 'BONE', sa: 'SA BONE', region: 'SULBAGSEL' },
} };
function worker(overrides: Partial<BotWorkerDependencies> = {}) {
  const completed: BotPayload[] = [], failures: BotFailureCode[] = [];
  let syncs = 0;
  const deps: BotWorkerDependencies = {
    claim: async () => '2026-11-06T00:00:00Z', fresh: async () => null,
    sync: async () => { syncs++;return { skipped: false, ...current }; },
    previous: async date => { assert.equal(date, '2026-11-05');return null; },
    complete: async (_id, _owner, payload) => { completed.push(payload); },
    fail: async (_id, _owner, code) => { failures.push(code); }, pause: async () => {}, ...overrides,
  };
  return { deps, completed, failures, syncs: () => syncs };
}
test('background worker stores one complete request-bound snapshot without customer identities', async () => {
  const run = worker();await runBotRequest('tg-test-12345', run.deps);
  assert.equal(run.completed.length, 1);assert.equal(run.failures.length, 0);
  const payload = run.completed[0]!;
  assert.equal(payload.requestId, 'tg-test-12345');assert.equal(payload.current.total, 2);
  assert.deepEqual(payload.current.countsByWorkzone, { ANT: 2, WTP: 0 });
  assert.equal(payload.requestedAt, '2026-11-06T00:00:00Z');assert.equal(payload.previous, null);
});
test('duplicate worker claims and snapshots newer than request do not trigger another source fetch', async () => {
  const duplicate = worker({ claim: async () => null });await runBotRequest('tg-test-12345', duplicate.deps);
  assert.equal(duplicate.syncs(), 0);assert.equal(duplicate.completed.length, 0);
  const reused = worker({ fresh: async minimum => { assert.equal(minimum, '2026-11-06T00:00:00Z');return current; } });
  await runBotRequest('tg-test-12345', reused.deps);assert.equal(reused.syncs(), 0);assert.equal(reused.completed.length, 1);
});
test('busy source lease is awaited and failure never produces a partial result', async () => {
  let ready = false;
  const busy = worker({ fresh: async () => ready ? current : null, sync: async () => ({ skipped: true }), pause: async () => { ready = true; } });
  await runBotRequest('tg-test-12345', busy.deps);assert.equal(busy.completed.length, 1);
  for (const [error, code] of [[new DOMException('deadline', 'TimeoutError'), 'UPSTREAM_TIMEOUT'], [new UpstreamHttpError(530), 'UPSTREAM_HTTP_ERROR'], [new Error('Data sumber berubah selama pagination.'), 'UPSTREAM_CHANGED']] as const) {
    const failure = worker({ sync: async () => { throw error; } });await runBotRequest('tg-test-12345', failure.deps);
    assert.equal(failure.completed.length, 0);assert.deepEqual(failure.failures, [code]);
  }
});
test('request identifiers and errors are bounded and do not expose raw internal messages', () => {
  assert.ok(validBotRequestId('tg-example-123'));assert.ok(!validBotRequestId('../secret'));assert.ok(!validBotRequestId('x'.repeat(101)));
  assert.equal(botFailureCode(new Error('private credentials must not be returned')), 'SYNC_FAILED');
});

test('transient upstream changes are retried within the same worker before reporting failure', async () => {
  let attempts = 0;
  const retry = worker({ sync: async () => {
    if (++attempts === 1) throw new Error('Data sumber berubah selama pagination.');
    return { skipped: false, ...current };
  } });
  await runBotRequest('tg-test-12345', retry.deps);
  assert.equal(attempts, 2);assert.equal(retry.completed.length, 1);assert.equal(retry.failures.length, 0);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isMorningCapture, usableMorningBaseline } from '../lib/morning-baseline';
import { botReportPayload } from '../lib/bot-report';

test('only actual captures around 08:00 WITA are eligible, including year boundaries', () => {
  assert.ok(!isMorningCapture('2026-11-06T07:59:59+08:00'));
  assert.ok(isMorningCapture('2026-11-06T08:00:00+08:00'));
  assert.ok(isMorningCapture('2026-11-06T08:04:59+08:00'));
  assert.ok(!isMorningCapture('2026-11-06T08:05:00+08:00'));
  assert.ok(!isMorningCapture('2026-11-06T15:00:00+08:00'));
  assert.ok(isMorningCapture('2027-01-01T00:00:01Z'));
  assert.ok(!isMorningCapture('not-a-date'));
});
test('morning baseline is same-day and never comes from the future or H-1', () => {
  const morning = { date: '2026-11-06', capturedAt: '2026-11-06T00:01:00Z', counts: { ANT: 18 } };
  assert.ok(usableMorningBaseline(morning, '2026-11-06', '2026-11-06T04:00:00Z'));
  assert.ok(!usableMorningBaseline(morning, '2026-11-07', '2026-11-07T04:00:00Z'));
  assert.ok(!usableMorningBaseline(morning, '2026-11-06', '2026-11-05T23:59:59Z'));
  assert.ok(!usableMorningBaseline(null, '2026-11-06', '2026-11-06T04:00:00Z'));
});
test('bot API carries immutable morning counts separately from current and H-1', () => {
  const current = { date: '2026-11-06', capturedAt: '2026-11-06T04:00:00Z', counts: { ANT: 17 }, mapping: {
    ANT: { branch: 'MAKASSAR', sa: 'SA', region: 'SULBAGSEL' }, WTP: { branch: 'BONE', sa: 'SA', region: 'SULBAGSEL' },
  } };
  const morning = { date: current.date, capturedAt: '2026-11-06T00:01:00Z', counts: { ANT: 18 } };
  const result = botReportPayload(current, null, morning);
  assert.equal(result.current.total, 17);assert.equal(result.previous, null);
  assert.equal(result.morning!.total, 18);assert.equal(result.morning!.scheduledTime, '08:00');
  assert.deepEqual(result.morning!.countsByWorkzone, { ANT: 18, WTP: 0 });
  assert.equal(botReportPayload({ ...current, capturedAt: '2026-11-05T23:59:00Z' }, null, morning).morning, null);
});

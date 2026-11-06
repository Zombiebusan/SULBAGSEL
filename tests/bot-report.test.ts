import { test } from 'node:test';
import assert from 'node:assert/strict';
import { botReportPayload, previousReportDate } from '../lib/bot-report';

test('bot payload contains zero-filled Sulbagsel counts and exact calendar H-1 without customer data', () => {
  const current = { date: '2026-11-05', capturedAt: '2026-11-05T06:00:00Z', counts: { ANT: 2 }, mapping: {
    ANT: { branch: 'MAKASSAR', sa: 'SA', region: 'SULBAGSEL' },
    WTP: { branch: 'BONE', sa: 'SA', region: 'SULBAGSEL' },
    PKA: { branch: 'PALU', sa: 'SA', region: 'SULBAGUT' },
  } };
  const result = botReportPayload(current, [
    { INCIDENT: 'INC1', WORKZONE: 'ANT', SUMMARY: '[UNSPEC] [TEST] Proactive underspec -27' },
    { INCIDENT: 'INC2', WORKZONE: 'ANT', SUMMARY: 'Unspec[-27 dBm]' },
    { INCIDENT: 'INC3', WORKZONE: 'PKA', SUMMARY: '[UNSPEC] [TEST] Proactive underspec -27' },
  ]);
  assert.deepEqual(result.current, { total: 2, countsByWorkzone: { ANT: 2, WTP: 0 } });
  assert.deepEqual(result.previous, { date: '2026-11-04', total: 1, countsByWorkzone: { ANT: 1, WTP: 0 } });
  assert.equal(botReportPayload(current, null).previous, null);
  assert.ok(!JSON.stringify(result).includes('INC1'));
  assert.equal(previousReportDate('2027-01-01'), '2026-12-31');
});

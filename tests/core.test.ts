import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { isReferenceUnspecTicket, normalizeMapping, normalizeTickets, witaDate } from '../lib/normalize';
import { dashboardHtml } from '../lib/dashboard-html';
import { reference } from '../lib/reference';

test('wilayah hanya memakai WORKZONE; INCIDENT unik per snapshot', () => {
  const mapping = normalizeMapping([
    { WORKZONE: ' pre ', BRANCH: 'PAREPARE', SERVICE_AREA: 'SA PRE', REGIONAL: 'SULBAGSEL' },
    { WORKZONE: 'PKA', BRANCH: 'PALU', SERVICE_AREA: 'SA PALU', REGIONAL: 'SULBAGUT' },
  ]);
  const rows = normalizeTickets([
    { INCIDENT: ' inc1 ', WORKZONE: ' pre ', WITEL: 'PALU', SERVICE_AREA: 'SALAH', SERVICE_NO: '001' },
    { INCIDENT: 'INC1', WORKZONE: 'PRE', SERVICE_NO: '002' },
    { INCIDENT: 'INC2', WORKZONE: 'PKA', WITEL: 'MAKASSAR' },
    { INCIDENT: 'INC3', WORKZONE: 'UNKNOWN' },
  ], mapping);
  assert.equal(mapping.PRE.branch, 'PARE-PARE');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].INCIDENT, 'INC1');
  assert.equal(rows[0]['SERVICE NO'], '002');
  assert.equal(normalizeTickets([rows[0]], mapping).length, 1);
});

test('batas hari snapshot mengikuti WITA termasuk pergantian bulan', () => {
  assert.equal(witaDate(new Date('2026-11-30T15:59:59Z')), '2026-11-30');
  assert.equal(witaDate(new Date('2026-11-30T16:00:00Z')), '2026-12-01');
});

test('cakupan proactive mengikuti CSV meski label sumber API berbeda dan tiket lama tidak ikut', () => {
  const summary = '[UNSPEC] [TEST] Proactive underspec -27.21';
  assert.ok(isReferenceUnspecTicket({ SUMMARY: summary, REPORTED_BY: 'PROACTIVE_OHI', SOURCE_TICKET: 'UNSPEC' }));
  assert.ok(isReferenceUnspecTicket({ SUMMARY: summary, 'REPORTED BY': 'PROACTIVE_OHI', 'SOURCE TICKET': 'PROACTIVE' }));
  assert.ok(isReferenceUnspecTicket({ SUMMARY: summary }), 'snapshot referensi lama tanpa metadata reporter tetap didukung');
  assert.ok(!isReferenceUnspecTicket({ SUMMARY: 'Unspec[-27.21 dBm] TEST', REPORTED_BY: 'PROMAN-TEST', SOURCE_TICKET: 'UNSPEC' }));
  assert.ok(!isReferenceUnspecTicket({ SUMMARY: summary, REPORTED_BY: 'PROMAN-TEST' }));
  assert.ok(!isReferenceUnspecTicket({ SUMMARY: '[OTHER] Proactive underspec -27.21', REPORTED_BY: 'PROACTIVE_OHI' }));
});

test('HTML hasil migrasi valid dan seluruh panel referensi dipertahankan', async () => {
  const result = await dashboardHtml();
  const scripts = [...result.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 4);
  for (const script of scripts) assert.doesNotThrow(() => new Script(script[1]));
  for (const id of ['page-progress','page-monthly','page-business','detailPanel','recap','monthlyChart','monthlySaChart','imjasTrend','import','restore']) assert.ok(result.includes(`id="${id}"`), id);
  assert.ok(!result.includes("localStorage.getItem('unspec-v1')"));
  assert.ok(result.includes('periodMonths()'));
  assert.ok(!result.includes('function parseCSV') || result.includes('Kolom INCIDENT dan WORKZONE wajib tersedia.'));
});

test('histori bawaan memiliki basis pelanggan dan IMJAS untuk perhitungan', async () => {
  const { initial } = await reference();
  assert.ok(initial.snapshots['2026-10-30']);
  assert.ok(Object.keys(initial.customers).length > 0);
  assert.equal(initial.imjas.weight, 6);
  assert.ok(initial.monthly['2026-07']);
  assert.equal(normalizeTickets(initial.snapshots['2026-11-04'], initial.mapping).length, 411, 'koreksi snapshot November pada script data referensi ikut diterapkan');
});

test('tampilan pertama memakai snapshot Neon terbaru, bukan saldo bawaan referensi', async () => {
  const result = await dashboardHtml({
    snapshots: { '2026-11-04': { ANT: 411 }, '2026-11-05': { ANT: 1119 } },
    mapping: { ANT: { branch: 'MAKASSAR', sa: 'SERVICE AREA TAMALANREA', region: 'SULBAGSEL' } },
    syncedAt: '2026-11-05T05:57:04Z', error: null, persisted: true,
  });
  const firstScript = [...result.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(match => match[1].startsWith('const INITIAL = '))![1];
  const initial = new Script(firstScript+';INITIAL').runInNewContext();
  assert.equal(Object.keys(initial.snapshots).sort().at(-1), '2026-11-05');
  assert.equal(initial.snapshots['2026-11-05'].length, 1119);
  assert.equal(initial.snapshots['2026-11-04'].length, 411);
});

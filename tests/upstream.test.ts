import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchComplete } from '../lib/upstream';

const ticket = (INCIDENT: string, WORKZONE = 'ANT') => ({ INCIDENT, WORKZONE, SUMMARY: '[UNSPEC] [TEST] Proactive underspec -27.21', REPORTED_BY: 'PROACTIVE_OHI', SOURCE_TICKET: 'UNSPEC' });

test('seluruh halaman diambil sebelum filter Sulbagsel diterapkan', async () => {
  const original = globalThis.fetch;
  const visited: string[] = [];
  globalThis.fetch = async input => {
    const url = String(input); visited.push(url);
    if (url.includes('get_workzone_filter')) return Response.json([
      { WORKZONE: 'ANT', BRANCH: 'MAKASSAR', SERVICE_AREA: 'SERVICE AREA TAMALANREA', REGIONAL: 'SULBAGSEL' },
      { WORKZONE: 'PKA', BRANCH: 'PALU', SERVICE_AREA: 'SERVICE AREA DONGGALA', REGIONAL: 'SULBAGUT' },
    ]);
    const page = Number(new URL(url).searchParams.get('page'));
    return Response.json({ page, limit: 2, total_tabel: 3, total: 3, data: page === 1
      ? [ticket('INC1'), ticket('INC2', 'PKA')]
      : [ticket('INC3')] });
  };
  try {
    const result = await fetchComplete();
    assert.equal(result.sourceTotal, 3);
    assert.deepEqual(result.tickets.map(t => t.INCIDENT), ['INC1', 'INC3']);
    assert.ok(visited.some(url => url.includes('page=2')));
  } finally { globalThis.fetch = original; }
});

test('snapshot tidak diterima bila halaman hilang atau total berubah; duplikasi stabil dihitung sekali', async () => {
  const original = globalThis.fetch;
  try {
    for (const scenario of ['missing', 'changed', 'duplicate']) {
      globalThis.fetch = async input => {
        const url = String(input);
        if (url.includes('get_workzone_filter')) return Response.json([{ WORKZONE: 'ANT', BRANCH: 'MAKASSAR', SERVICE_AREA: 'SA', REGIONAL: 'SULBAGSEL' }]);
        const page = Number(new URL(url).searchParams.get('page'));
        return Response.json({ page, limit: 2, total_tabel: scenario === 'changed' && page === 2 ? 4 : 3, total: 3,
          data: page === 1 ? [ticket('INC1'), ticket('INC2')]
            : scenario === 'missing' ? [] : [ticket(scenario === 'duplicate' ? 'INC1' : 'INC3')] });
      };
      if (scenario === 'duplicate') {
        const result = await fetchComplete();
        assert.equal(result.sourceTotal, 3);
        assert.equal(result.tickets.length, 2);
      } else await assert.rejects(fetchComplete(), /tidak lengkap|berubah/);
    }
  } finally { globalThis.fetch = original; }
});

test('tiket legacy Sulbagsel tidak menaikkan saldo proactive saat sinkronisasi API', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async input => {
    if (String(input).includes('get_workzone_filter')) return Response.json([{ WORKZONE: 'ANT', BRANCH: 'MAKASSAR', SERVICE_AREA: 'SA', REGIONAL: 'SULBAGSEL' }]);
    return Response.json({ page: 1, limit: 500, total: 2, total_tabel: 2, data: [ticket('INC-PROACTIVE'), {
      INCIDENT: 'INC-LEGACY', WORKZONE: 'ANT', SUMMARY: 'Unspec[-27 dBm] TEST', REPORTED_BY: 'PROMAN-TEST', SOURCE_TICKET: 'UNSPEC',
    }] });
  };
  try {
    const result = await fetchComplete();
    assert.equal(result.sourceTotal, 2);
    assert.deepEqual(result.tickets.map(r => r.INCIDENT), ['INC-PROACTIVE']);
    assert.equal(result.tickets[0]['REPORTED BY'], 'PROACTIVE_OHI');
  } finally { globalThis.fetch = original; }
});

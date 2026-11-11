import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../app/api/bot/visuals/route';
import { visualOperationalDate } from '../lib/bot-visuals';

test('visuals keep the bot operational day through 07:59 WITA', () => {
  assert.equal(visualOperationalDate('2026-11-10T23:59:59Z'), '2026-11-10');
  assert.equal(visualOperationalDate('2026-11-11T00:00:00Z'), '2026-11-11');
  assert.equal(visualOperationalDate('2027-01-01T00:00:00Z'), '2027-01-01');
});

test('visual data route requires the bot token and rejects malformed ids before database access', async () => {
  const previous = process.env.UNSPEC_BOT_API_TOKEN;
  process.env.UNSPEC_BOT_API_TOKEN = 'test-visual-token-32-characters-long';
  try {
    assert.equal((await GET(new Request('https://example.test/api/bot/visuals?requestId=valid-request-123'))).status, 401);
    assert.equal((await GET(new Request('https://example.test/api/bot/visuals?requestId=x', { headers: { authorization: `Bearer ${process.env.UNSPEC_BOT_API_TOKEN}` } }))).status, 400);
  } finally { if (previous === undefined) delete process.env.UNSPEC_BOT_API_TOKEN;else process.env.UNSPEC_BOT_API_TOKEN = previous; }
});

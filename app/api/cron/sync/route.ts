import { timingSafeEqual } from 'node:crypto';
import { synchronize } from '@/lib/db';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const actual = request.headers.get('authorization') || '';
  const a = Buffer.from(actual), b = Buffer.from(`Bearer ${expected}`);
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await synchronize();
    return Response.json(result.skipped ? { ok: true, skipped: true } : { ok: true, skipped: false, date: result.date, count: result.count });
  }
  catch (error) {
    console.error('Cron:', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Sinkronisasi gagal; snapshot sebelumnya dipertahankan.' }, { status: 503 });
  }
}

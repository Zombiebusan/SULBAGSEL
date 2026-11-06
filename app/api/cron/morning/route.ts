import { timingSafeEqual } from 'node:crypto';
import { after } from 'next/server';
import { createBotRequest, runBotRequest } from '@/lib/bot-requests';
import { morningBaseline } from '@/lib/db';
import { isMorningCapture } from '@/lib/morning-baseline';
import { witaDate } from '@/lib/normalize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get('authorization') || ''), expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const now = new Date(), date = witaDate(now), headers = { 'Cache-Control': 'private, no-store' };
  try {
    const existing = await morningBaseline(date);
    if (existing) return Response.json({ recorded: true, date, capturedAt: existing.capturedAt }, { headers });
    if (!isMorningCapture(now)) return Response.json({ recorded: false, date, error: 'Acuan 08.00 hanya dapat direkam pada 08.00–08.05 WITA; saldo saat ini tidak dijadikan pengganti.' }, { status: 409, headers });
    const job = await createBotRequest(`morning08-${date}`);
    if (job.needsWork) after(() => runBotRequest(job.requestId).catch(() => { console.error('Pencatatan baseline pagi belum selesai.'); }));
    return Response.json({ recorded: false, date, requestId: job.requestId, status: job.status }, { status: job.status === 'failed' || job.status === 'complete' ? 503 : 202, headers });
  } catch { return Response.json({ error: 'Database baseline pagi belum dapat diakses.' }, { status: 503, headers }); }
}

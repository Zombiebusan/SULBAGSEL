import { timingSafeEqual } from 'node:crypto';
import { snapshot, synchronize } from '@/lib/db';
import { botReportPayload, previousReportDate } from '@/lib/bot-report';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function POST(request: Request) {
  const token = process.env.UNSPEC_BOT_API_TOKEN;
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!token || token.length < 32) return Response.json({ error: 'Integrasi bot belum dikonfigurasi.' }, { status: 503, headers });
  const actual = Buffer.from(request.headers.get('authorization') || ''), expected = Buffer.from(`Bearer ${token}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  try {
    const result = await synchronize(AbortSignal.timeout(38000));
    if (result.skipped) return Response.json({ error: 'Sinkronisasi lain sedang berlangsung. Silakan cetak ulang.' }, { status: 409, headers: { ...headers, 'Retry-After': '3' } });
    const old = await snapshot(previousReportDate(result.date));
    return Response.json(botReportPayload(result, old), { headers });
  } catch {
    return Response.json({ error: 'Data API terbaru belum dapat diambil secara lengkap. Silakan cetak ulang.' }, { status: 503, headers });
  }
}

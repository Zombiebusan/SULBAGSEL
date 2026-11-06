import { timingSafeEqual } from 'node:crypto';
import { snapshot, synchronize } from '@/lib/db';
import { botReportPayload, previousReportDate } from '@/lib/bot-report';
import { after } from 'next/server';
import { botFailureCode, botFailureMessage, createBotRequest, readBotRequest, runBotRequest, validBotRequestId, type BotRequest } from '@/lib/bot-requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
const headers = { 'Cache-Control': 'private, no-store' };
function authorize(request: Request): Response | null {
  const token = process.env.UNSPEC_BOT_API_TOKEN;
  if (!token || token.length < 32) return Response.json({ code: 'BOT_NOT_CONFIGURED', error: 'Integrasi bot belum dikonfigurasi.' }, { status: 503, headers });
  const actual = Buffer.from(request.headers.get('authorization') || ''), expected = Buffer.from(`Bearer ${token}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return Response.json({ code: 'UNAUTHORIZED', error: 'Unauthorized' }, { status: 401, headers });
  return null;
}
function resultResponse(job: BotRequest): Response {
  if (job.status === 'complete') return Response.json(job.payload, { headers });
  if (job.status === 'failed') {
    const code = job.errorCode || 'SYNC_FAILED';
    return Response.json({ code, error: botFailureMessage[code] }, { status: code === 'UPSTREAM_TIMEOUT' ? 504 : 503, headers });
  }
  return Response.json({ requestId: job.requestId, status: 'pending', requestedAt: job.requestedAt }, { status: 202, headers: { ...headers, 'Retry-After': '3' } });
}
export async function GET(request: Request) {
  const denied = authorize(request); if (denied) return denied;
  const id = new URL(request.url).searchParams.get('requestId') || '';
  if (!validBotRequestId(id)) return Response.json({ code: 'INVALID_REQUEST_ID', error: 'Request ID tidak valid.' }, { status: 400, headers });
  try {
    const job = await readBotRequest(id);
    return job ? resultResponse(job) : Response.json({ code: 'REQUEST_NOT_FOUND', error: 'Permintaan tidak ditemukan.' }, { status: 404, headers });
  } catch { return Response.json({ code: 'DATABASE_UNAVAILABLE', error: 'Database integrasi belum dapat diakses.' }, { status: 503, headers }); }
}
export async function POST(request: Request) {
  const denied = authorize(request); if (denied) return denied;
  let id: string | undefined;
  try {
    const text = await request.text();
    if (text.length > 2000) return Response.json({ code: 'INVALID_REQUEST_ID', error: 'Permintaan terlalu besar.' }, { status: 413, headers });
    if (text.trim()) {
      const body = JSON.parse(text);
      if (typeof body.requestId !== 'string' || !validBotRequestId(body.requestId)) throw new Error('Invalid request');
      id = body.requestId;
    }
  } catch { return Response.json({ code: 'INVALID_REQUEST_ID', error: 'Request ID tidak valid.' }, { status: 400, headers }); }
  if (id) {
    try {
      const job = await createBotRequest(id);
      if (job.needsWork) after(() => runBotRequest(job.requestId).catch(() => { console.error('Worker integrasi bot belum selesai; lease dapat dicoba ulang.'); }));
      return resultResponse(job);
    } catch { return Response.json({ code: 'DATABASE_UNAVAILABLE', error: 'Database integrasi belum dapat diakses.' }, { status: 503, headers }); }
  }
  // Compatibility for callers using the earlier synchronous contract.
  try {
    const result = await synchronize(AbortSignal.timeout(38000));
    if (result.skipped) return Response.json({ error: 'Sinkronisasi lain sedang berlangsung. Silakan cetak ulang.' }, { status: 409, headers: { ...headers, 'Retry-After': '3' } });
    const old = await snapshot(previousReportDate(result.date));
    return Response.json(botReportPayload(result, old), { headers });
  } catch (error) {
    const code = botFailureCode(error);
    return Response.json({ code, error: botFailureMessage[code] }, { status: code === 'UPSTREAM_TIMEOUT' ? 504 : 503, headers });
  }
}

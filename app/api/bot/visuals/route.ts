import { timingSafeEqual } from 'node:crypto';
import { botVisualHistory } from '@/lib/bot-visuals';
import { validBotRequestId } from '@/lib/bot-requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const token = process.env.UNSPEC_BOT_API_TOKEN;
  const actual = Buffer.from(request.headers.get('authorization') || ''), expected = Buffer.from(`Bearer ${token}`);
  if (!token || token.length < 32 || actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const requestId = new URL(request.url).searchParams.get('requestId') || '';
  if (!validBotRequestId(requestId)) return Response.json({ error: 'Request ID tidak valid.' }, { status: 400 });
  try {
    const visuals = await botVisualHistory(requestId);
    return visuals ? Response.json(visuals, { headers: { 'Cache-Control': 'private, no-store' } }) : Response.json({ error: 'Snapshot belum tersedia.' }, { status: 404 });
  } catch {
    return Response.json({ error: 'Histori visual belum dapat dimuat.' }, { status: 503 });
  }
}

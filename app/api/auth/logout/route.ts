import { destroySession, sameOrigin } from '@/lib/auth';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Origin tidak valid.' }, { status: 403 });
  await destroySession();
  return Response.json({ ok: true });
}

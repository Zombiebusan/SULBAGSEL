import { createSession, sameOrigin, verifyCredentials } from '@/lib/auth';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Origin tidak valid.' }, { status: 403 });
  try {
    const body = await request.json();
    if (typeof body.username !== 'string' || typeof body.password !== 'string' || body.username.length > 100 || body.password.length > 256) {
      return Response.json({ error: 'Username atau password tidak valid.' }, { status: 400 });
    }
    if (!verifyCredentials(body.username, body.password)) return Response.json({ error: 'Username atau password salah.' }, { status: 401 });
    await createSession();
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Login:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'Login belum dapat diproses. Periksa konfigurasi server.' }, { status: 503 });
  }
}

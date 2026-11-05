import { authenticated } from '@/lib/auth';
import { dashboardHtml } from '@/lib/dashboard-html';
import { dashboardState } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (!await authenticated()) return Response.redirect(new URL('/login', request.url));
  let html: string;
  try {
    html = await dashboardHtml(await dashboardState());
  } catch {
    return new Response('Snapshot terakhir belum dapat dimuat dari database. Silakan refresh halaman untuk mencoba lagi.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'private, no-store' },
    });
  }
  return new Response(html, { headers: {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  } });
}

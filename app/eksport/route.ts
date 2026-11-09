import { authenticated } from '@/lib/auth';
import { dashboardHtml } from '@/lib/dashboard-html';
import { dashboardExportState } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!await authenticated()) return Response.redirect(new URL('/login', request.url));
  try {
    const { state, snapshots } = await dashboardExportState();
    const exportedAt = new Date().toISOString();
    const html = await dashboardHtml(state, { snapshots, exportedAt });
    const stamp = exportedAt.replace(/[:.]/g, '-');
    return new Response(html, { headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="UNSPEC-Sulbagsel-${stamp}.html"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch {
    return new Response('Ekspor HTML belum dapat dibuat. Silakan coba lagi.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'private, no-store' },
    });
  }
}

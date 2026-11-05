import { authenticated } from '@/lib/auth';
import { snapshot } from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (!await authenticated()) return Response.json({ error: 'Sesi berakhir.' }, { status: 401 });
  const date = new URL(request.url).searchParams.get('date') || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ error: 'Tanggal tidak valid.' }, { status: 400 });
  try {
    const rows = await snapshot(date);
    if (!rows) return Response.json({ error: 'Snapshot tidak tersedia.' }, { status: 404 });
    return Response.json({ date, tickets: rows }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return Response.json({ error: 'Detail tiket belum dapat diambil.' }, { status: 503 }); }
}

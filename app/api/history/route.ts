import { authenticated, sameOrigin } from '@/lib/auth';
import { importSnapshots } from '@/lib/db';

export const maxDuration = 300;
export async function POST(request: Request) {
  if (!await authenticated()) return Response.json({ error: 'Sesi berakhir.' }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: 'Origin tidak valid.' }, { status: 403 });
  try {
    const text = await request.text();
    if (Buffer.byteLength(text) > 4_000_000) return Response.json({ error: 'Maksimal 4 MB per permintaan impor.' }, { status: 413 });
    const body = JSON.parse(text);
    if (!body.snapshots || typeof body.snapshots !== 'object' || Array.isArray(body.snapshots)) throw new Error('Format snapshot tidak valid.');
    const count = await importSnapshots(body.snapshots);
    return Response.json({ ok: true, count });
  } catch (error) {
    console.error('Import:', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Impor gagal. Periksa tanggal, INCIDENT, WORKZONE, ukuran file, dan koneksi Neon.' }, { status: 400 });
  }
}

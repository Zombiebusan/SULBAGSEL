import { authenticated, sameOrigin } from '@/lib/auth';
import { dashboardState, synchronize } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
async function respond(sync: boolean) {
  let syncError: string | null = null;
  if (sync) {
    try { await synchronize(); }
    catch (error) {
      console.error('Sync:', error instanceof Error ? error.message : error);
      syncError = 'Sinkronisasi gagal. Data terakhir dipertahankan; periksa konfigurasi Neon atau API sumber.';
    }
  }
  try {
    const state = await dashboardState();
    return Response.json({ ...state, error: state.error || syncError }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Dashboard data:', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Database belum dapat diakses. Histori yang sudah tampil tetap dipertahankan.' }, { status: 503 });
  }
}
export async function GET() {
  if (!await authenticated()) return Response.json({ error: 'Sesi berakhir.' }, { status: 401 });
  return respond(false);
}
export async function POST(request: Request) {
  if (!await authenticated()) return Response.json({ error: 'Sesi berakhir.' }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: 'Origin tidak valid.' }, { status: 403 });
  return respond(true);
}

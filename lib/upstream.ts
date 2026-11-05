import { isReferenceUnspecTicket, normalizeMapping, normalizeTickets } from './normalize';

const BASE = 'https://monica.pamasuka.id/android/android/';
type Page = { data: Record<string, unknown>[]; total: number; total_tabel: number; page: number; limit: number };
async function json(url: string) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`API sumber mengembalikan HTTP ${response.status}.`);
  return response.json();
}
export async function fetchComplete() {
  const rawMapping = await json(`${BASE}get_workzone_filter.php`);
  if (!Array.isArray(rawMapping) || !rawMapping.length) throw new Error('Mapping wilayah dari API tidak valid.');
  const mapping = normalizeMapping(rawMapping);
  if (!Object.values(mapping).some(m => m.region === 'SULBAGSEL')) throw new Error('Mapping Sulbagsel tidak tersedia.');
  const load = async (page: number): Promise<Page> => {
    const result = await json(`${BASE}tiket_bar_unspec.php?page=${page}&limit=500`);
    if (!Array.isArray(result.data) || !Number.isInteger(result.total_tabel) || result.total_tabel < 0 || result.page !== page || !Number.isInteger(result.limit) || result.limit < 1) {
      throw new Error('Format pagination tiket tidak valid.');
    }
    return result;
  };
  const first = await load(1), pages = Math.max(1, Math.ceil(first.total_tabel / first.limit));
  if (pages > 50) throw new Error('Jumlah halaman melebihi batas sinkronisasi.');
  let previousSignature = '';
  // Metadata counts rows, not necessarily distinct incidents. For repeated IDs,
  // require two stable full passes before accepting the deduplicated result.
  for (let attempt = 0; attempt < 3; attempt++) {
    const unique = new Map<string, Record<string, unknown>>();
    const results: Page[] = [attempt === 0 ? first : await load(1)];
    for (let start = 2; start <= pages; start += 4) {
      results.push(...await Promise.all(Array.from({ length: Math.min(4, pages - start + 1) }, (_, i) => load(start + i))));
    }
    if (results.some(p => p.total_tabel !== first.total_tabel || p.limit !== first.limit)) throw new Error('Data sumber berubah selama pagination. Sinkronisasi akan dicoba lagi.');
    const rows = results.flatMap(p => p.data);
    if (rows.length !== first.total_tabel) throw new Error('Pagination tidak lengkap. Data terakhir dipertahankan.');
    for (const row of rows) {
      const incident = String(row.INCIDENT ?? '').trim().toUpperCase();
      if (!incident) throw new Error('API mengembalikan tiket tanpa INCIDENT.');
      unique.set(incident, row);
    }
    const signature = [...unique.keys()].sort().join(',');
    if (unique.size === first.total_tabel || signature === previousSignature) return { mapping, tickets: normalizeTickets([...unique.values()].filter(isReferenceUnspecTicket), mapping), sourceTotal: first.total_tabel };
    previousSignature = signature;
  }
  throw new Error('Pagination tidak lengkap setelah pengambilan ulang. Data terakhir dipertahankan.');
}

import { loadEnvConfig } from '@next/env';
import { neon } from '@neondatabase/serverless';

async function main() {
  loadEnvConfig(process.cwd());
  const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
  const targetUrl = process.env.TARGET_DATABASE_URL;
  if (!sourceUrl || !targetUrl) throw new Error('Isi SOURCE_DATABASE_URL (atau DATABASE_URL) dan TARGET_DATABASE_URL.');
  const identity = (value: string) => { const url = new URL(value); return url.hostname.replace('-pooler.', '.') + url.pathname; };
  if (identity(sourceUrl) === identity(targetUrl)) throw new Error('Database sumber dan tujuan harus berbeda.');
  const source = neon(sourceUrl), target = neon(targetUrl);
  const [snapshots, states] = await source.transaction([
    source`SELECT date, tickets, counts, captured_at, source, md5(tickets::text) AS ticket_hash, md5(counts::text) AS count_hash FROM unspec_snapshots ORDER BY date`,
    source`SELECT mapping, synced_at, error, source_total, seeded FROM unspec_state WHERE id = 1`,
  ], { isolationLevel: 'RepeatableRead', readOnly: true });
  if (!snapshots.length || !states.length) throw new Error('Database sumber tidak berisi histori dan state yang lengkap.');

  await target`CREATE TABLE IF NOT EXISTS unspec_snapshots (
    date text PRIMARY KEY CHECK (date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
    tickets jsonb NOT NULL, counts jsonb NOT NULL,
    captured_at timestamptz NOT NULL DEFAULT now(), source text NOT NULL
  )`;
  await target`CREATE TABLE IF NOT EXISTS unspec_state (
    id integer PRIMARY KEY CHECK (id = 1), mapping jsonb,
    synced_at timestamptz, error text, lock_token text, lock_until timestamptz,
    source_total integer, seeded boolean NOT NULL DEFAULT false
  )`;
  const state = states[0];
  await target.transaction([
    ...snapshots.map(row => target`INSERT INTO unspec_snapshots (date, tickets, counts, captured_at, source)
      VALUES (${row.date}, ${JSON.stringify(row.tickets)}::jsonb, ${JSON.stringify(row.counts)}::jsonb, ${row.captured_at}, ${row.source})
      ON CONFLICT (date) DO NOTHING`),
    target`INSERT INTO unspec_state (id, mapping, synced_at, error, source_total, seeded)
      VALUES (1, ${JSON.stringify(state.mapping)}::jsonb, ${state.synced_at}, ${state.error}, ${state.source_total}, ${state.seeded})
      ON CONFLICT (id) DO NOTHING`,
  ]);

  const copied = await target`SELECT date, jsonb_array_length(tickets) AS tickets, md5(tickets::text) AS ticket_hash, md5(counts::text) AS count_hash FROM unspec_snapshots ORDER BY date`;
  const byDate = new Map(copied.map(row => [row.date, row]));
  for (const row of snapshots) {
    const found = byDate.get(row.date);
    if (!found || found.ticket_hash !== row.ticket_hash || found.count_hash !== row.count_hash) {
      throw new Error('Verifikasi histori gagal pada tanggal ' + row.date + '. Data tujuan yang sudah ada tidak ditimpa.');
    }
  }
  const latest = copied.at(-1)!;
  console.log(JSON.stringify({ migratedSnapshots: snapshots.length, verified: true, latestDate: latest.date, latestTickets: latest.tickets, stateCopied: true, activeSourceLeaseNotCopied: true }));
}

main().catch(error => {
  // Report operational errors without printing connection strings or ticket data.
  console.error('Migrasi Neon gagal:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});

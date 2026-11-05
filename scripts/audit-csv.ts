import { readFile } from 'node:fs/promises';
import { loadEnvConfig } from '@next/env';
import { snapshot } from '../lib/db';
import { isReferenceUnspecTicket, normalizeMapping, normalizeTickets } from '../lib/normalize';

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], value = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(value); value = ''; }
    else if ((char === '\r' || char === '\n') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(value); if (row.some(Boolean)) rows.push(row);
      row = []; value = '';
    } else value += char;
  }
  if (quoted) throw new Error('CSV tidak lengkap.');
  row.push(value); if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift()?.map(h => h.trim()) || [];
  if (!headers.includes('INCIDENT') || !headers.includes('WORKZONE')) throw new Error('Kolom INCIDENT dan WORKZONE wajib tersedia.');
  return rows.map(cells => Object.fromEntries(headers.map((key, i) => [key, cells[i] ?? ''])));
}
const tally = (values: string[]) => values.reduce<Record<string, number>>((result, key) => {
  result[key] = (result[key] || 0) + 1; return result;
}, {});

async function main() {
  loadEnvConfig(process.cwd());
  const filename = process.argv[2] || 'export (45).csv';
  const date = process.argv[3] || '2026-11-05';
  const raw = parseCsv(await readFile(filename, 'utf8'));
  const mapping = normalizeMapping(JSON.parse(await readFile('get_workzone_filter.php.json', 'utf8')));
  const csv = normalizeTickets(raw, mapping);
  const stored = await snapshot(date) || [];
  const csvIds = new Set(csv.map(r => r.INCIDENT));
  const storedIds = new Set(stored.map(r => r.INCIDENT));
  const proactive = stored.filter(isReferenceUnspecTicket);
  const proactiveIds = new Set(proactive.map(r => r.INCIDENT));
  console.log(JSON.stringify({
    file: filename, snapshotDate: date, totalCsv: raw.length, sulbagselCsv: csv.length,
    outsideSulbagsel: raw.filter(r => mapping[r.WORKZONE.trim()]?.region !== 'SULBAGSEL').length,
    branches: tally(csv.map(r => mapping[r.WORKZONE].branch)),
    reportedBy: tally(raw.map(r => r['REPORTED BY'])), sourceTicket: tally(raw.map(r => r['SOURCE TICKET'])),
    snapshotTotal: stored.length, snapshotProactive: proactive.length,
    csvMissingFromSnapshot: csv.filter(r => !storedIds.has(r.INCIDENT)).length,
    extraInSnapshot: stored.filter(r => !csvIds.has(r.INCIDENT)).length,
    csvMissingFromProactive: csv.filter(r => !proactiveIds.has(r.INCIDENT)).length,
    extraInProactive: proactive.filter(r => !csvIds.has(r.INCIDENT)).length,
    ...(process.argv.includes('--details') ? {
      missingTickets: csv.filter(r => !storedIds.has(r.INCIDENT)).map(r => ({
        incident: r.INCIDENT, workzone: r.WORKZONE, branch: mapping[r.WORKZONE].branch,
        statusCsv: r.STATUS, reportedBy: r['REPORTED BY'], summary: r.SUMMARY,
      })),
    } : {}),
  }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Script } from 'node:vm';
import type { Reference } from './types';

let cached: Promise<{ html: string; initial: Reference }> | undefined;
export function initialSpan(html: string) {
  const marker = '<script>const INITIAL = ';
  const start = html.indexOf(marker) + marker.length;
  if (start < marker.length || html[start] !== '{') throw new Error('Data INITIAL tidak ditemukan pada HTML referensi.');
  let depth = 0, quoted = false, escaped = false;
  for (let end = start; end < html.length; end++) {
    const char = html[end];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return { start, end: end + 1 };
  }
  throw new Error('Data INITIAL tidak lengkap.');
}
export function reference() {
  return cached ??= readFile(path.join(process.cwd(), 'UNSPEC-Sulbagsel november.html'), 'utf8').then(html => {
    const { start } = initialSpan(html);
    const scriptStart = html.lastIndexOf('<script>', start) + '<script>'.length;
    const scriptEnd = html.indexOf('</script>', start);
    // The trusted reference applies November corrections after its initial JSON.
    // Evaluate only this bundled data script, never API or uploaded content.
    const initial = new Script(html.slice(scriptStart, scriptEnd)+'\n;INITIAL;').runInNewContext({}, {
      timeout: 1000, contextCodeGeneration: { strings: false, wasm: false },
    }) as Reference;
    return { html, initial: JSON.parse(JSON.stringify(initial)) as Reference };
  });
}

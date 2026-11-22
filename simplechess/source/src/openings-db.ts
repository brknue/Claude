import { Chess } from 'chessops/chess';
import { repKey, uciToMove } from './chess';

export interface Opening { eco: string; name: string; family: string; variation: string; sans: string[]; ucis: string[]; key?: string }

let cache: Promise<Opening[]> | null = null;
let byKey: Map<string, Opening> | null = null;

export function loadOpenings(): Promise<Opening[]> {
  if (!cache) {
    cache = fetch(new URL('data/openings.json', document.baseURI).href).then(r => r.json()).then((rows: string[][]) =>
      rows.map(([eco, name, sans, ucis]) => {
        const i = name.indexOf(':');
        return { eco, name, family: i >= 0 ? name.slice(0, i) : name, variation: i >= 0 ? name.slice(i + 1).trim() : '', sans: sans.split(' '), ucis: ucis.split(' ') };
      }));
    cache.catch(() => { cache = null; });
  }
  return cache;
}

/** Map from position key -> opening, so transpositions are recognised. */
export async function openingIndex(): Promise<Map<string, Opening>> {
  if (byKey) return byKey;
  const list = await loadOpenings();
  const m = new Map<string, Opening>();
  for (const o of list) {
    const pos = Chess.default();
    let ok = true;
    for (const u of o.ucis) { const mv = uciToMove(pos, u); if (!mv) { ok = false; break; } pos.play(mv); }
    if (!ok) continue;
    const k = repKey(pos);
    o.key = k;
    const prev = m.get(k);
    if (!prev || o.ucis.length < prev.ucis.length || (o.ucis.length === prev.ucis.length && o.name.length < prev.name.length)) m.set(k, o);
  }
  byKey = m;
  return m;
}

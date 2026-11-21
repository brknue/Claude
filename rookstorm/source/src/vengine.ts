/** Main-thread client for the variant engine worker. */
import type { VJob, VResult } from './vsearch';
import type { Rules } from 'chessops/types';

let worker: Worker | null = null;
let seq = 0;
const waiting = new Map<number, (r: VResult | null) => void>();

function get(): Worker {
  if (!worker) {
    // Old Safari cannot start module workers; the production build is a classic script, so fall back to that.
    try { worker = new Worker(new URL('./vworker.ts', import.meta.url), { type: 'module' }); }
    catch { worker = new Worker(new URL('./vworker.ts', import.meta.url)); }
    worker.onmessage = (e) => { const f = waiting.get(e.data.id); waiting.delete(e.data.id); f?.(e.data.res); };
    worker.onerror = () => { waiting.forEach(f => f(null)); waiting.clear(); worker?.terminate(); worker = null; };
  }
  return worker;
}

export function variantMove(fen: string, rules: Rules, elo: number, ms: number): Promise<VResult | null> {
  return new Promise(resolve => {
    const id = ++seq;
    waiting.set(id, resolve);
    get().postMessage({ id, job: { fen, rules, elo, ms } as VJob });
  });
}

/** Abandon pending answers (e.g. after a takeback); the worker finishes its current search on its own. */
export function variantStop() { waiting.forEach(f => f(null)); waiting.clear(); }

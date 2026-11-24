/**
 * How many players are searching in each online pool right now (shown on the Online menu).
 * Uses Supabase Realtime presence: a searching player is "present" with their pool until paired or cancelled.
 */
import type { RealtimeChannel } from '@supabase/supabase-js';
import { sb, accountsEnabled } from './account';

type Counts = Map<string, number>;
let ch: RealtimeChannel | null = null;
let chP: Promise<RealtimeChannel | null> | null = null;
let counts: Counts = new Map();
const watchers = new Set<(c: Counts) => void>();
let myPool: string | null = null;
let users = 0;

function recount() {
  const c: Counts = new Map();
  const state = ch?.presenceState() as Record<string, { pool?: string }[]> | undefined;
  for (const metas of Object.values(state || {})) for (const m of metas) if (m.pool) c.set(m.pool, (c.get(m.pool) || 0) + 1);
  counts = c;
  watchers.forEach(f => f(c));
}

function channel(): Promise<RealtimeChannel | null> {
  if (!accountsEnabled()) return Promise.resolve(null);
  if (!chP) {
    chP = sb().then(c => {
      const key = Math.random().toString(36).slice(2, 12);
      const channel = c.channel('queues', { config: { presence: { key } } });
      channel.on('presence', { event: 'sync' }, recount);
      channel.subscribe((status: string) => { if (status === 'SUBSCRIBED' && myPool) channel.track({ pool: myPool }).catch(() => {}); });
      ch = channel;
      return channel;
    }).catch(() => { chP = null; return null; });
  }
  return chP;
}

function release() {
  users--;
  if (users > 0 || myPool) return;
  const c = ch; ch = null; chP = null;
  setTimeout(() => { try { c?.unsubscribe(); } catch { /* */ } }, 200);
}

/** Live counts per pool; returns a stop function. */
export function watchQueues(f: (c: Counts) => void): () => void {
  users++;
  watchers.add(f);
  f(counts);
  channel();
  return () => { watchers.delete(f); release(); };
}

/** Count me as searching in this pool until the returned function is called. */
export function joinQueue(pool: string): () => void {
  users++;
  myPool = pool;
  channel().then(c => c?.track({ pool }).catch(() => {}));
  let done = false;
  return () => {
    if (done) return; done = true;
    if (myPool === pool) myPool = null;
    ch?.untrack().catch(() => {});
    release();
  };
}

/** Same key as the matchmaking pool in play.ts. */
export const poolKey = (variant: string, time: number, inc: number, rated: boolean) => `${variant}-${time}-${inc}${rated ? '-r' : ''}`.replace('.', '_');

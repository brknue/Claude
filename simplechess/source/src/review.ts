/**
 * Background game review for signed-in players: finds the brilliant moves of finished games
 * (same rule as the Game review page) and saves the counts to the account, for the profile.
 */
import { Game } from './game';
import { engine, whiteCp, winPct } from './engine';
import { VariantKey, variantInfo, fenOf, uciToMove, PIECE_VALUE, Position, Move } from './chess';
import { openingIndex } from './openings-db';
import { me, rpc } from './account';
import { loadRaw, save } from './ui';

export interface BrilliantResult { white: number; black: number; plies: number[] }
interface QueueItem { id: string; variant: VariantKey; fen: string; moves: string }

export function isSacrifice(prev: Position, m: Move, next: Position): boolean {
  if (!('from' in m)) return false;
  const piece = prev.board.get(m.from);
  if (!piece || piece.role === 'pawn' || piece.role === 'king') return false;
  const v = PIECE_VALUE[m.promotion || piece.role];
  const captured = prev.board.get(m.to);
  const c = captured && captured.color !== piece.color ? PIECE_VALUE[captured.role] : 0;
  if (v - c < 2) return false;
  const opp = piece.color === 'white' ? 'black' : 'white';
  const occ = next.board.occupied;
  const attackers = next.kingAttackers(m.to, opp, occ);
  if (attackers.isEmpty()) return false;
  let minA = 99;
  for (const s of attackers) { const p = next.board.get(s)!; minA = Math.min(minA, p.role === 'king' ? 50 : PIECE_VALUE[p.role]); }
  const defenders = next.kingAttackers(m.to, piece.color, occ.without(m.to));
  return defenders.isEmpty() ? minA < 50 : minA < v;
}

/** Returns null if the engine was interrupted (the player started something else); try again later. */
export async function findBrilliants(variant: VariantKey, startFen: string, ucis: string[], depth = 11): Promise<BrilliantResult | null> {
  const out: BrilliantResult = { white: 0, black: 0, plies: [] };
  if (!variantInfo(variant).sf || !ucis.length) return out;
  const g = new Game(variant, startFen);
  for (const u of ucis) if (!g.playUci(u)) break;
  const book = variant === 'standard' ? await openingIndex().catch(() => null) : null;
  const evals: { cp: number; best?: string }[] = [];
  for (let i = 0; i <= g.ply; i++) {
    const pos = g.positions[i];
    if (pos.isEnd()) { evals.push({ cp: pos.isCheckmate() ? (pos.turn === 'white' ? -10000 : 10000) : 0 }); continue; }
    const r = await engine.analyse({ fen: fenOf(pos), depth, multipv: 1, chess960: variant === 'chess960' }, false);
    if (!r) return null;
    evals.push({ cp: whiteCp(r.lines[0], pos.turn), best: r.lines[0]?.pv[0] || r.bestmove });
  }
  for (let i = 0; i < g.ply; i++) {
    const prev = g.positions[i], next = g.positions[i + 1], m = g.moves[i];
    const sign = prev.turn === 'white' ? 1 : -1;
    const before = winPct(sign * evals[i].cp), after = winPct(sign * evals[i + 1].cp);
    const loss = Math.max(0, before - after);
    if (book && i < 40 && book.get(fenOf(next).split(' ').slice(0, 4).join(' '))) continue;
    let legal = 0; for (const [, d] of prev.allDests()) legal += d.size();
    if (legal === 1) continue;
    const bestMove = evals[i].best ? uciToMove(prev, evals[i].best!) : undefined;
    let isBest = false;
    if (bestMove) { const c = prev.clone(); c.play(bestMove); isBest = fenOf(c) === fenOf(next); }
    if ((isBest || loss < 1) && isSacrifice(prev, m, next) && after >= 45 && before < 97 && loss < 2) {
      out.plies.push(i + 1);
      if (prev.turn === 'white') out.white++; else out.black++;
    }
  }
  return out;
}

/** false once the database turned out not to have the brilliant-move functions yet */
let available = true;
let running = false;
const listeners = new Set<() => void>();
export const onReviewsSaved = (f: () => void) => { listeners.add(f); return () => listeners.delete(f); };
export const reviewsRunning = () => running;

export async function saveReview(id: string, r: BrilliantResult): Promise<boolean> {
  if (!available || !me) return false;
  try { await rpc('save_review', { p_id: id, p_white: r.white, p_black: r.black, p_plies: r.plies.join(',') }); return true; }
  catch (e: any) { if (/could not find|does not exist|schema cache/i.test(String(e?.message))) available = false; return false; }
}

function queue(): QueueItem[] { return loadRaw('reviewQueue', [] as QueueItem[]); }
function setQueue(q: QueueItem[]) { save('reviewQueue', q.slice(0, 25)); }

export function queueReview(id: string, variant: VariantKey, fen: string, ucis: string[]) {
  if (!me || !variantInfo(variant).sf || ucis.length < 2) return;
  const q = queue().filter(x => x.id !== id);
  q.push({ id, variant, fen, moves: ucis.join(' ') });
  setQueue(q);
}
export function dropQueued(id: string) { setQueue(queue().filter(x => x.id !== id)); }

/** Work through the queue while the engine is free. Stops quietly when interrupted. */
export async function runReviews() {
  if (running || !available || !me) return;
  running = true;
  try {
    for (let q = queue(); q.length; q = queue()) {
      const it = q[0];
      const r = await findBrilliants(it.variant, it.fen, it.moves.split(' '));
      if (!r) break; // engine busy with something the player is doing
      const ok = await saveReview(it.id, r);
      if (!ok && !available) break;
      dropQueued(it.id);
      listeners.forEach(f => f());
    }
  } finally { running = false; }
}

/** Own profile: pick up games that were never reviewed (other devices, older games) and review them. */
export async function reviewBacklog() {
  if (!available || !me) return;
  try {
    const rows = await rpc<any[]>('unreviewed_games', { p_limit: 5 });
    for (const g of rows || []) queueReview(g.id, g.variant, g.start_fen, String(g.moves).split(' ').filter(Boolean));
  } catch (e: any) { if (/could not find|does not exist|schema cache/i.test(String(e?.message))) { available = false; return; } }
  runReviews();
}
export const brilliantsAvailable = () => available;
/** call with an RPC error: switches the feature off if the database add-on is missing */
export function noteMissing(e: any) { if (/could not find|does not exist|schema cache|404/i.test(String(e?.message || e?.code || ''))) available = false; }

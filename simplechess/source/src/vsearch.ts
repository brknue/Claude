/**
 * Small alpha-beta engine for the chess variants Stockfish does not play
 * (Crazyhouse, King of the Hill, Three-check, Atomic, Antichess, Horde, Racing Kings).
 * Runs inside a Web Worker (vworker.ts). Strength is scaled by Elo through depth, time and noise.
 */
import { parseFen } from 'chessops/fen';
import { setupPosition } from 'chessops/variant';
import { makeUci, squareRank, squareFile } from 'chessops/util';
import type { Position } from 'chessops/chess';
import type { Move, Rules, Role } from 'chessops/types';

const VAL: Record<Role, number> = { pawn: 100, knight: 310, bishop: 330, rook: 500, queen: 920, king: 0 };
const MATE = 100000;

export interface VJob { fen: string; rules: Rules; elo: number; ms: number }
export interface VResult { uci: string | null; score: number; depth: number; nodes: number }

let nodes = 0;
let deadline = 0;
let stopped = false;
let rules: Rules = 'chess';

function centre(sq: number) {
  const f = squareFile(sq), r = squareRank(sq);
  return 3.5 - Math.max(Math.abs(f - 3.5), Math.abs(r - 3.5)); // 0 edge .. 3 centre
}

/** Static evaluation from the side to move's point of view. */
function evaluate(pos: Position): number {
  const us = pos.turn, them = us === 'white' ? 'black' : 'white';
  let score = 0;
  const b = pos.board;
  for (const sq of b.occupied) {
    const p = b.get(sq)!;
    const sign = p.color === us ? 1 : -1;
    let v = VAL[p.role];
    if (p.role === 'knight' || p.role === 'bishop') v += centre(sq) * 8;
    else if (p.role === 'pawn') v += (p.color === 'white' ? squareRank(sq) - 1 : 6 - squareRank(sq)) * 6 + (centre(sq) > 2 ? 6 : 0);
    else if (p.role === 'king') {
      if (rules === 'kingofthehill') v += centre(sq) * 90;
      else if (rules === 'racingkings') v += squareRank(sq) * 130;
      else if (rules !== 'antichess') v += (b.occupied.size() > 16 ? -centre(sq) * 6 : centre(sq) * 6);
    }
    score += sign * v;
  }
  if (rules === 'antichess') score = -score; // fewer pieces is better
  if (rules === 'crazyhouse' && pos.pockets) {
    for (const r of ['pawn', 'knight', 'bishop', 'rook', 'queen'] as Role[]) {
      score += (pos.pockets[us][r] - pos.pockets[them][r]) * VAL[r] * 0.9;
    }
    // king safety matters a lot when pieces can drop next to it
    const kUs = b.kingOf(us), kThem = b.kingOf(them);
    if (kUs !== undefined) score -= pos.kingAttackers(kUs, them, b.occupied).size() * 60;
    if (kThem !== undefined) score += pos.kingAttackers(kThem, us, b.occupied).size() * 60;
  }
  if (rules === '3check' && pos.remainingChecks) {
    score += (3 - pos.remainingChecks[us]) * 260 - (3 - pos.remainingChecks[them]) * 260;
  }
  if (rules === 'atomic') {
    // keep our king away from the enemy king's blast radius is irrelevant; prefer kings touching (cannot be captured)
    const kUs = b.kingOf(us);
    if (kUs !== undefined && pos.kingAttackers(kUs, them, b.occupied).nonEmpty()) score -= 80;
  }
  return score;
}

function genMoves(pos: Position): Move[] {
  const out: Move[] = [];
  const ctx = pos.ctx();
  for (const [from, dests] of pos.allDests(ctx)) {
    const p = pos.board.get(from)!;
    for (const to of dests) {
      if (p.role === 'pawn' && (squareRank(to) === 0 || squareRank(to) === 7)) {
        out.push({ from, to, promotion: 'queen' }, { from, to, promotion: 'knight' });
        if (rules === 'antichess') out.push({ from, to, promotion: 'king' }, { from, to, promotion: 'rook' });
      } else out.push({ from, to });
    }
  }
  if (rules === 'crazyhouse' && pos.pockets) {
    const drops = pos.dropDests(ctx);
    if (drops.nonEmpty()) {
      for (const role of ['queen', 'rook', 'bishop', 'knight', 'pawn'] as Role[]) {
        if (!pos.pockets[pos.turn][role]) continue;
        for (const to of drops) {
          if (role === 'pawn' && (squareRank(to) === 0 || squareRank(to) === 7)) continue;
          out.push({ role, to });
        }
      }
    }
  }
  return out;
}

function isCapture(pos: Position, m: Move): boolean {
  if (!('from' in m)) return false;
  const t = pos.board.get(m.to);
  return (!!t && t.color !== pos.turn) || (pos.board.get(m.from)?.role === 'pawn' && m.to === pos.epSquare);
}

function orderScore(pos: Position, m: Move, killer?: string): number {
  if (!('from' in m)) return 50 + VAL[m.role] / 100; // drops: medium priority
  let s = 0;
  const t = pos.board.get(m.to);
  if (t && t.color !== pos.turn) s += 1000 + VAL[t.role] - VAL[pos.board.get(m.from)!.role] / 10;
  if (m.promotion === 'queen') s += 900;
  if (killer && makeUci(m) === killer) s += 500;
  return s;
}

function terminal(pos: Position, ply: number): number | null {
  if (!pos.isEnd()) return null;
  const o = pos.outcome();
  if (!o || !o.winner) return 0;
  return o.winner === pos.turn ? MATE - ply : -MATE + ply;
}

const killers: string[] = [];

function quiesce(pos: Position, alpha: number, beta: number, ply: number, qd: number): number {
  nodes++;
  const term = terminal(pos, ply);
  if (term !== null) return term;
  const stand = evaluate(pos);
  if (qd <= 0) return stand;
  // In antichess captures are forced, so "standing pat" is not an option when a capture exists.
  if (rules !== 'antichess') {
    if (stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
  }
  const moves = genMoves(pos).filter(m => isCapture(pos, m) || (('from' in m) && m.promotion === 'queen'));
  if (!moves.length) return stand;
  moves.sort((a, b) => orderScore(pos, b) - orderScore(pos, a));
  let best = rules === 'antichess' ? -Infinity : stand;
  for (const m of moves) {
    const next = pos.clone(); next.play(m);
    const v = -quiesce(next, -beta, -alpha, ply + 1, qd - 1);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

function search(pos: Position, depth: number, alpha: number, beta: number, ply: number): number {
  if ((nodes & 1023) === 0 && performance.now() > deadline) stopped = true;
  if (stopped) return 0;
  const term = terminal(pos, ply);
  if (term !== null) return term;
  if (depth <= 0) return quiesce(pos, alpha, beta, ply, 4);
  nodes++;
  const moves = genMoves(pos);
  const k = killers[ply];
  moves.sort((a, b) => orderScore(pos, b, k) - orderScore(pos, a, k));
  let best = -Infinity;
  for (const m of moves) {
    const next = pos.clone(); next.play(m);
    // check extension keeps tactics in view (important for 3check / crazyhouse)
    const ext = next.isCheck() && ply < 6 ? 1 : 0;
    const v = -search(next, depth - 1 + ext, -beta, -alpha, ply + 1);
    if (stopped) return best === -Infinity ? 0 : best;
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) { if (!isCapture(pos, m)) killers[ply] = makeUci(m); break; }
  }
  return best;
}

export function think(job: VJob): VResult {
  rules = job.rules;
  const setup = parseFen(job.fen);
  if (setup.isErr) return { uci: null, score: 0, depth: 0, nodes: 0 };
  const p = setupPosition(rules, setup.value);
  if (p.isErr) return { uci: null, score: 0, depth: 0, nodes: 0 };
  const pos = p.value;
  const moves = genMoves(pos);
  if (!moves.length) return { uci: null, score: 0, depth: 0, nodes: 0 };
  if (moves.length === 1) return { uci: makeUci(moves[0]), score: 0, depth: 0, nodes: 0 };

  const elo = Math.max(100, Math.min(3200, job.elo));
  const maxDepth = elo < 600 ? 1 : elo < 1000 ? 2 : elo < 1500 ? 3 : elo < 2000 ? 4 : 8;
  const noise = elo < 2000 ? Math.round((2000 - elo) / 6) : 0; // centipawns of randomness
  nodes = 0; stopped = false; killers.length = 0;
  deadline = performance.now() + Math.max(150, job.ms);

  let scored: { m: Move; v: number }[] = moves.map(m => ({ m, v: 0 }));
  let doneDepth = 0;
  for (let d = 1; d <= maxDepth; d++) {
    const res: { m: Move; v: number }[] = [];
    let alpha = -Infinity;
    for (const { m } of scored) {
      const next = pos.clone(); next.play(m);
      // full window for the first few moves so we get comparable scores for the "human" noise
      const v = -search(next, d - 1, -Infinity, noise ? Infinity : -alpha, 1);
      if (stopped) break;
      res.push({ m, v });
      if (v > alpha) alpha = v;
    }
    if (stopped && res.length < scored.length) {
      // keep the partial result only if it found something better than the previous best
      if (res.length && doneDepth) { const pb = res.reduce((a, b) => (b.v > a.v ? b : a)); if (pb.v > scored[0].v + 30) scored = [pb, ...scored.filter(x => x.m !== pb.m)]; }
      break;
    }
    scored = res.sort((a, b) => b.v - a.v);
    doneDepth = d;
    if (Math.abs(scored[0].v) > MATE - 100) break;
  }
  let pick = scored[0];
  if (noise && Math.abs(pick.v) < MATE - 100) {
    let bestV = -Infinity;
    for (const s of scored) {
      const v = s.v + (Math.random() * 2 - 1) * noise;
      if (s.v > -MATE + 100 && v > bestV) { bestV = v; pick = s; }
    }
  }
  return { uci: makeUci(pick.m), score: pick.v, depth: doneDepth, nodes };
}

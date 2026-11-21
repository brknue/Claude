/** Simple computer player for the party variants: grabs material, avoids hanging pieces, goes for kings. */
import { Variant, State, Move, legalMoves, pieceMoves, VALUE, onBoard, duckSquares, inCheck } from './rules';

function attackedBy(v: Variant, st: State, seat: number): Set<number> {
  const set = new Set<number>();
  st.board.forEach((p, i) => {
    if (!p || p.o === seat || !st.alive[p.o] || (v.teams && p.o % 2 === seat % 2)) return;
    for (const m of pieceMoves(v, st, i)) set.add(m.t);
    if (p.t === 'p') { // pawns attack diagonally even when the square is empty
      const w = v.w, x = i % w, y = Math.floor(i / w);
      for (const dx of [-1, 1]) for (const dy of [-1, 1]) if (onBoard(v, x + dx, y + dy)) set.add((y + dy) * w + x + dx);
    }
  });
  return set;
}

export function botMove(v: Variant, st: State, seat: number, now = 0): Move | null {
  const moves = legalMoves(v, st, seat, now);
  if (!moves.length) return null;
  const danger = attackedBy(v, st, seat);
  let best: Move | null = null, bestScore = -Infinity;
  for (const m of moves) {
    const p = st.board[m.f]!;
    const victim = st.board[m.t];
    let s = Math.random() * 0.6;
    if (victim) s += v.royal.includes(victim.t) ? 1000 : VALUE[victim.t] * 1.2;
    if (m.promo) s += 8;
    const mine = v.royal.includes(p.t) ? 50 : VALUE[p.t];
    if (danger.has(m.t)) s -= mine * 0.9;
    if (danger.has(m.f)) s += mine * 0.6; // escaping an attack
    // drift towards the centre / forwards early on
    const cx = (v.w - 1) / 2, cy = (v.h - 1) / 2, x = m.t % v.w, y = Math.floor(m.t / v.w);
    s += 0.15 * (Math.max(cx, cy) - Math.max(Math.abs(x - cx), Math.abs(y - cy))) / Math.max(cx, cy);
    if (v.royal.includes(p.t) && st.ply < 30 && !victim) s -= 0.8; // keep the king home
    if (v.mate && !v.duck && givesCheck(v, st, seat, m)) s += 0.7;
    if (s > bestScore) { bestScore = s; best = m; }
  }
  return best;
}

/** Duck Chess: drop the duck next to the opponent's king if possible, else anywhere free. */
export function botDuck(v: Variant, st: State, seat: number): number {
  const free = duckSquares(v, st, seat);
  const king = st.board.findIndex(p => p && p.o !== seat && v.royal.includes(p.t));
  if (king >= 0) {
    const near = free.filter(i => Math.abs((i % v.w) - (king % v.w)) <= 1 && Math.abs(Math.floor(i / v.w) - Math.floor(king / v.w)) <= 1);
    if (near.length) return near[Math.floor(Math.random() * near.length)];
  }
  return free[Math.floor(Math.random() * free.length)];
}

/** Check rules: does this move put an opponent in check? (a nudge for the bot) */
function givesCheck(v: Variant, st: State, seat: number, m: Move): boolean {
  const b = st.board.slice(); const p = b[m.f]!; b[m.t] = { ...p, t: m.promo || p.t }; b[m.f] = null;
  const after = { ...st, board: b };
  return after.alive.some((a, s) => a && s !== seat && !(v.teams && s % 2 === seat % 2) && inCheck(v, after, s));
}

import { Position, normalizeMove } from 'chessops/chess';
import { setupPosition, defaultPosition } from 'chessops/variant';
import { parseFen, makeFen, INITIAL_FEN } from 'chessops/fen';
import { parseUci, makeUci, makeSquare, squareFile, squareRank } from 'chessops/util';
import { makeSanAndPlay } from 'chessops/san';
import { chessgroundDests } from 'chessops/compat';
import type { Move, Rules, Color, Role, NormalMove } from 'chessops/types';
import { t } from './i18n';

export type VariantKey = 'standard' | 'chess960' | 'crazyhouse' | 'kingofthehill' | '3check' | 'atomic' | 'antichess' | 'horde' | 'racingkings';

/** sf: Stockfish can play and analyse it; other variants use Simple Chess's own variant engine. */
export interface VariantInfo { key: VariantKey; name: string; rules: Rules; desc: string; sf: boolean }

export const VARIANTS: VariantInfo[] = [
  { key: 'standard', name: 'Standard', rules: 'chess', desc: 'Classic chess.', sf: true },
  { key: 'chess960', name: 'Chess960', rules: 'chess', desc: 'Random back rank (Fischer Random). 960 possible starts.', sf: true },
  { key: 'crazyhouse', name: 'Crazyhouse', rules: 'crazyhouse', desc: 'Captured pieces change sides: drop them back onto the board as your move.', sf: false },
  { key: 'kingofthehill', name: 'King of the Hill', rules: 'kingofthehill', desc: 'Bring your king to the 4 center squares to win.', sf: false },
  { key: '3check', name: 'Three-check', rules: '3check', desc: 'Give check three times to win.', sf: false },
  { key: 'atomic', name: 'Atomic', rules: 'atomic', desc: 'Captures explode all nearby pieces except pawns.', sf: false },
  { key: 'antichess', name: 'Antichess', rules: 'antichess', desc: 'Lose all your pieces to win. Captures are forced.', sf: false },
  { key: 'horde', name: 'Horde', rules: 'horde', desc: 'White has 36 pawns. Black must destroy the horde.', sf: false },
  { key: 'racingkings', name: 'Racing Kings', rules: 'racingkings', desc: 'Race your king to the 8th rank. No checks allowed.', sf: false },
];

export const variantInfo = (k: VariantKey) => VARIANTS.find(v => v.key === k) || VARIANTS[0];
export const variantName = (k: VariantKey) => t(variantInfo(k).name);
export const variantDesc = (k: VariantKey) => t(variantInfo(k).desc);

/** Random Chess960 back rank. */
export function random960Fen(): string {
  const r: string[] = Array(8).fill('');
  const free = () => r.map((p, i) => (p ? -1 : i)).filter(i => i >= 0);
  const pick = (arr: number[]) => arr[Math.floor(Math.random() * arr.length)];
  r[pick([0, 2, 4, 6])] = 'b';
  r[pick([1, 3, 5, 7])] = 'b';
  r[pick(free())] = 'q';
  r[pick(free())] = 'n';
  r[pick(free())] = 'n';
  const f = free();
  r[f[0]] = 'r'; r[f[1]] = 'k'; r[f[2]] = 'r';
  const back = r.join('');
  return `${back}/pppppppp/8/8/8/8/PPPPPPPP/${back.toUpperCase()} w KQkq - 0 1`;
}

export function startFenFor(v: VariantKey): string {
  if (v === 'chess960') return random960Fen();
  if (v === 'standard') return INITIAL_FEN;
  return makeFen(defaultPosition(variantInfo(v).rules).toSetup());
}

export function posFromFen(fen: string, v: VariantKey = 'standard'): Position | null {
  const setup = parseFen(fen.trim());
  if (setup.isErr) return null;
  const p = setupPosition(variantInfo(v).rules, setup.value);
  return p.isErr ? null : p.value;
}

export function positionError(fen: string, v: VariantKey = 'standard'): string | null {
  const setup = parseFen(fen.trim());
  if (setup.isErr) return t('Invalid FEN');
  const p = setupPosition(variantInfo(v).rules, setup.value);
  if (p.isErr) {
    const m = p.error.message;
    const map: Record<string, string> = {
      ERR_EMPTY: 'The board is empty.', ERR_KINGS: 'Each side needs exactly one king.',
      ERR_OPPOSITE_CHECK: 'The side not to move is in check.', ERR_PAWNS_ON_BACKRANK: 'Pawns cannot be on the first or last rank.',
      ERR_IMPOSSIBLE_CHECK: 'This check is impossible.', ERR_VARIANT: 'Invalid position for this variant.',
    };
    return t(map[m] || 'Invalid position for this variant.');
  }
  return null;
}

export const fenOf = (pos: Position) => makeFen(pos.toSetup());
/** Position key for repetition detection. */
export const repKey = (pos: Position) => fenOf(pos).split(' ').slice(0, 4).join(' ');

export function dests(pos: Position, chess960 = false) {
  return chessgroundDests(pos, { chess960 }) as Map<any, any[]>;
}

export const isPromotion = (pos: Position, from: number, to: number): boolean => {
  const p = pos.board.get(from);
  if (!p || p.role !== 'pawn') return false;
  const rank = squareRank(to);
  return rank === 0 || rank === 7;
};

/** Move from chessground orig/dest (with optional promotion) -> normalized chessops move. */
export function cgToMove(pos: Position, orig: string, dest: string, promotion?: Role): Move {
  const from = sq(orig), to = sq(dest);
  const m: NormalMove = { from, to };
  if (promotion) m.promotion = promotion;
  return normalizeMove(pos, m);
}

export const sq = (name: string) => {
  const f = name.charCodeAt(0) - 97, r = name.charCodeAt(1) - 49;
  return r * 8 + f;
};
export const sqName = (s: number) => makeSquare(s);

/** Is this move a castling move (king onto own rook)? */
export function isCastle(pos: Position, m: Move): boolean {
  if (!('from' in m)) return false;
  const p = pos.board.get(m.from), t = pos.board.get(m.to);
  return !!p && p.role === 'king' && !!t && t.role === 'rook' && t.color === p.color;
}

/** UCI for the engine. Standard chess wants e1g1 for castling; chess960 wants king-takes-rook. */
export function engineUci(pos: Position, m: Move, chess960: boolean): string {
  if (!chess960 && 'from' in m && isCastle(pos, m)) {
    const toFile = squareFile(m.to) > squareFile(m.from) ? 6 : 2;
    return makeSquare(m.from) + makeSquare(squareRank(m.from) * 8 + toFile);
  }
  return makeUci(m);
}

/** Parse a UCI string (engine or internal) into a normalized move legal in pos. */
export function uciToMove(pos: Position, uci: string): Move | undefined {
  const m = parseUci(uci);
  if (!m) return undefined;
  const n = normalizeMove(pos, m);
  return pos.isLegal(n) ? n : undefined;
}

/** chessground [orig, dest] for highlighting/arrows from a normalized move */
export function moveSquares(pos: Position, m: Move): [string, string] | null {
  if (!('from' in m)) return [makeSquare(m.to), makeSquare(m.to)]; // drop
  if (isCastle(pos, m)) {
    const toFile = squareFile(m.to) > squareFile(m.from) ? 6 : 2;
    return [makeSquare(m.from), makeSquare(squareRank(m.from) * 8 + toFile)];
  }
  return [makeSquare(m.from), makeSquare(m.to)];
}

export function pvToSan(pos: Position, ucis: string[], max = 12): string {
  const p = pos.clone();
  const out: string[] = [];
  let ply = p.fullmoves * 2 - (p.turn === 'white' ? 2 : 1);
  for (const u of ucis.slice(0, max)) {
    const m = uciToMove(p, u);
    if (!m) break;
    const num = Math.floor(ply / 2) + 1;
    if (p.turn === 'white') out.push(num + '.');
    else if (out.length === 0) out.push(num + '...');
    out.push(makeSanAndPlay(p, m));
    ply++;
  }
  return out.join(' ');
}

export const PIECE_VALUE: Record<Role, number> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };

export function materialDiff(pos: Position): { white: Role[]; black: Role[]; score: number } {
  const counts = { white: {} as Record<string, number>, black: {} as Record<string, number> };
  for (const s of pos.board.occupied) {
    const p = pos.board.get(s)!;
    counts[p.color][p.role] = (counts[p.color][p.role] || 0) + 1;
  }
  const white: Role[] = [], black: Role[] = [];
  let score = 0;
  for (const r of ['queen', 'rook', 'bishop', 'knight', 'pawn'] as Role[]) {
    const d = (counts.white[r] || 0) - (counts.black[r] || 0);
    for (let i = 0; i < Math.abs(d); i++) (d > 0 ? white : black).push(r);
    score += d * PIECE_VALUE[r];
  }
  return { white, black, score };
}

export type Outcome = { winner?: Color; reason: string };

export const reasonText = (r: string) => { const s = t(r); return s.charAt(0).toUpperCase() + s.slice(1); };
export function outcomeText(o: Outcome): string {
  if (!o.winner) return t('Draw') + ' · ' + t(o.reason);
  return (o.winner === 'white' ? t('White wins') : t('Black wins')) + ' · ' + t(o.reason);
}

export type { Position, Move, Color, Role };

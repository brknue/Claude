/**
 * "Party" variants engine: any board size, 2 or 4 players, turn-based or real-time (kung fu).
 * Variants with `mate` use normal check rules (no moving into check, checkmate wins, stalemate draws);
 * the others use capture-the-king rules: there is no check, you win by capturing the royal piece.
 */
export type PT = 'p' | 'n' | 'b' | 'r' | 'q' | 'k' | 'm' | 'x'; // m = commoner (moves like a king, not royal), x = royal knight
export interface P { t: PT; o: number; mv?: 1; cd?: number }
export interface Move { f: number; t: number; promo?: PT; rf?: number; rt?: number }

export interface Variant {
  key: string; name: string; desc: string;
  players: 2 | 4; realtime?: boolean; teams?: boolean; group: 'four' | 'live' | 'twist' | 'small';
  w: number; h: number; holes?: (x: number, y: number) => boolean;
  rows?: string[];            // 2-player setup, top row first; upper case = seat 0 (bottom), lower case = seat 1
  royal: PT[];
  win?: 'royal' | 'extinction' | 'promote';
  movesPerTurn?: (turnNo: number, seat: number) => number;
  /** normal check rules: checkmate wins (otherwise capture the royal piece) */
  mate?: boolean;
  fog?: boolean; duck?: boolean; dice?: boolean; torpedo?: boolean; noDouble?: boolean; noCastle?: boolean;
  promoteAt: number;          // distance from own back rank where pawns promote
  promo: PT;
}

const CORNER = (x: number, y: number) => (x < 3 || x > 10) && (y < 3 || y > 10);
const STD = ['rnbqkbnr', 'pppppppp', '........', '........', '........', '........', 'PPPPPPPP', 'RNBQKBNR'];

export const PARTY_VARIANTS: Variant[] = [
  { key: 'fourffa', name: '4-Player Chess', desc: 'Four armies on a cross-shaped board. Checkmate a king to knock that player out; the last king standing wins.', players: 4, mate: true, group: 'four', w: 14, h: 14, holes: CORNER, royal: ['k'], promoteAt: 7, promo: 'q' },
  { key: 'fourteams', name: '4-Player Teams', desc: 'Two against two: you and the player opposite you are a team. Checkmate an enemy king to win.', players: 4, mate: true, teams: true, group: 'four', w: 14, h: 14, holes: CORNER, royal: ['k'], promoteAt: 7, promo: 'q' },
  { key: 'fourkungfu', name: '4-Player Kung Fu Chess', desc: 'Four players, no turns: move any piece whenever it is ready. Each piece rests for a moment after it moves.', players: 4, realtime: true, group: 'four', w: 14, h: 14, holes: CORNER, royal: ['k'], promoteAt: 7, promo: 'q' },
  { key: 'kungfu', name: 'Kung Fu Chess', desc: 'Real-time chess: no turns, both players move at the same time. Each piece rests for a moment after it moves. Capture the king to win.', players: 2, realtime: true, group: 'live', w: 8, h: 8, rows: STD, royal: ['k'], promoteAt: 7, promo: 'q' },
  { key: 'fog', name: 'Fog of War', desc: 'You only see the squares your pieces can reach. There is no check: capture the king to win.', players: 2, fog: true, group: 'twist', w: 8, h: 8, rows: STD, royal: ['k'], promoteAt: 7, promo: 'q' },
  { key: 'duck', name: 'Duck Chess', desc: 'After every move you must move the duck to an empty square. Nobody can pass or capture the duck, but it can block a check. Checkmate to win.', players: 2, duck: true, mate: true, group: 'twist', w: 8, h: 8, rows: STD, royal: ['k'], promoteAt: 7, promo: 'q' },
  { key: 'dice', name: 'Dice Chess', desc: 'A die decides which kind of piece you must move this turn. Capture the king to win.', players: 2, dice: true, group: 'twist', w: 8, h: 8, rows: STD, royal: ['k'], promoteAt: 7, promo: 'q' },
  { key: 'marseillais', name: 'Double-Move Chess', desc: 'Every turn has two moves (White\'s very first turn has one). Giving check ends your turn. Checkmate to win.', players: 2, mate: true, group: 'twist', w: 8, h: 8, rows: STD, royal: ['k'], promoteAt: 7, promo: 'q', movesPerTurn: (n) => (n === 0 ? 1 : 2) },
  { key: 'progressive', name: 'Progressive Chess', desc: 'One move, then two, then three… each turn has one more move than the last. Giving check ends your turn. Checkmate to win.', players: 2, mate: true, group: 'twist', w: 8, h: 8, rows: STD, royal: ['k'], promoteAt: 7, promo: 'q', movesPerTurn: (n) => n + 1 },
  { key: 'monster', name: 'Monster Chess', desc: 'White has only a king and four pawns but makes two moves every turn. Giving check ends the turn. Checkmate to win.', players: 2, mate: true, group: 'twist', w: 8, h: 8, rows: ['rnbqkbnr', 'pppppppp', '........', '........', '........', '........', '..PPPP..', '....K...'], royal: ['k'], promoteAt: 7, promo: 'q', movesPerTurn: (_n, s) => (s === 0 ? 2 : 1) },
  { key: 'knightmate', name: 'Knightmate', desc: 'The royal piece moves like a knight, and the knights are replaced by commoners that move like kings. Checkmate the royal knight to win.', players: 2, mate: true, group: 'twist', w: 8, h: 8, rows: ['rmbqxbmr', 'pppppppp', '........', '........', '........', '........', 'PPPPPPPP', 'RMBQXBMR'], royal: ['x'], promoteAt: 7, promo: 'q' },
  { key: 'extinction', name: 'Extinction Chess', desc: 'Lose all pieces of any one kind (all pawns, both knights, the queen…) and you lose. The king can be captured too.', players: 2, win: 'extinction', group: 'twist', w: 8, h: 8, rows: STD, royal: ['k'], promoteAt: 7, promo: 'q' },
  { key: 'kingcapture', name: 'Capture the King', desc: 'Normal chess without check: moving into danger is allowed, and capturing the king wins.', players: 2, group: 'twist', w: 8, h: 8, rows: STD, royal: ['k'], promoteAt: 7, promo: 'q' },
  { key: 'pawnwars', name: 'Pawn Wars', desc: 'Only kings and pawns. The first pawn to reach the last rank wins (capturing the king wins too).', players: 2, win: 'promote', group: 'twist', w: 8, h: 8, rows: ['....k...', 'pppppppp', '........', '........', '........', '........', 'PPPPPPPP', '....K...'], royal: ['k'], promoteAt: 7, promo: 'q' },
  { key: 'torpedo', name: 'Torpedo Chess', desc: 'Pawns may move two squares forward from anywhere on the board. Checkmate to win.', players: 2, mate: true, torpedo: true, group: 'twist', w: 8, h: 8, rows: STD, royal: ['k'], promoteAt: 7, promo: 'q' },
  { key: 'gardner', name: 'Mini Chess 5×5', desc: 'Gardner\'s minichess on a 5×5 board: every piece, no castling, no double pawn step. Checkmate to win.', players: 2, mate: true, noDouble: true, noCastle: true, group: 'small', w: 5, h: 5, rows: ['rnbqk', 'ppppp', '.....', 'PPPPP', 'RNBQK'], royal: ['k'], promoteAt: 4, promo: 'q' },
  { key: 'losalamos', name: 'Los Alamos 6×6', desc: 'The first computer chess game: 6×6 board without bishops, castling or double pawn steps. Checkmate to win.', players: 2, mate: true, noDouble: true, noCastle: true, group: 'small', w: 6, h: 6, rows: ['rnqknr', 'pppppp', '......', '......', 'PPPPPP', 'RNQKNR'], royal: ['k'], promoteAt: 5, promo: 'q' },
];
export const partyVariant = (k: string) => PARTY_VARIANTS.find(v => v.key === k) || PARTY_VARIANTS[0];

export const SPEEDS: [string, string, number][] = [['lightning', 'Lightning', 1000], ['fast', 'Fast', 2500], ['classic', 'Classic', 6000]];
export const cooldownMs = (speed?: string) => (SPEEDS.find(s => s[0] === speed) || SPEEDS[1])[2];

/** forward direction of each seat */
export function fwd(v: Variant, seat: number): [number, number] {
  if (v.players === 2) return seat === 0 ? [0, 1] : [0, -1];
  return ([[0, 1], [1, 0], [0, -1], [-1, 0]] as [number, number][])[seat];
}
/** distance of (x,y) from a seat's own back rank */
export function depth(v: Variant, seat: number, x: number, y: number): number {
  const [fx, fy] = fwd(v, seat);
  return fy === 1 ? y : fy === -1 ? v.h - 1 - y : fx === 1 ? x : v.w - 1 - x;
}

export interface State {
  v: string; speed?: string; board: (P | null)[]; turn: number; movesLeft: number; turnNo: number;
  alive: boolean[]; over: boolean; winners: number[]; reason: string;
  duck: number; duckPending: boolean; dice: PT | null; last: { f: number; t: number } | null; ply: number;
  startTypes: PT[][];
  /** moves since the last capture or pawn move (50-move rule in two-player variants with check rules) */
  quiet?: number;
  /** pieces each seat has captured: type + original owner */
  caps?: { t: PT; o: number }[][];
}

export const onBoard = (v: Variant, x: number, y: number) => x >= 0 && y >= 0 && x < v.w && y < v.h && !(v.holes && v.holes(x, y));

export function initialBoard(v: Variant): (P | null)[] {
  const b: (P | null)[] = Array(v.w * v.h).fill(null);
  if (v.players === 2) {
    v.rows!.forEach((row, i) => {
      const y = v.h - 1 - i;
      [...row].forEach((c, x) => { if (c !== '.') b[y * v.w + x] = { t: c.toLowerCase() as PT, o: c === c.toUpperCase() ? 0 : 1 }; });
    });
    return b;
  }
  // 4 players on the 14×14 cross. Seats: 0 red (bottom), 1 blue (left), 2 yellow (top), 3 green (right).
  const back: Record<number, string> = { 0: 'rnbqkbnr', 1: 'rnbkqbnr', 2: 'rnbkqbnr', 3: 'rnbqkbnr' };
  for (let i = 0; i < 8; i++) {
    const a = 3 + i;
    const put = (x: number, y: number, t: string, o: number) => { b[y * v.w + x] = { t: t as PT, o }; };
    put(a, 0, back[0][i], 0); put(a, 1, 'p', 0);
    put(0, a, back[1][i], 1); put(1, a, 'p', 1);
    put(a, 13, back[2][i], 2); put(a, 12, 'p', 2);
    put(13, a, back[3][i], 3); put(12, a, 'p', 3);
  }
  return b;
}

export function newState(v: Variant, speed?: string): State {
  const board = initialBoard(v);
  const startTypes: PT[][] = [];
  for (let s = 0; s < v.players; s++) startTypes.push([...new Set(board.filter(p => p && p.o === s).map(p => p!.t))]);
  const st: State = {
    v: v.key, speed, board, turn: 0, movesLeft: v.movesPerTurn ? v.movesPerTurn(0, 0) : 1, turnNo: 0,
    alive: Array(v.players).fill(true), over: false, winners: [], reason: '',
    duck: -1, duckPending: false, dice: null, last: null, ply: 0, startTypes,
  };
  if (v.dice) st.dice = rollDice(v, st, 0);
  return st;
}

const KN: [number, number][] = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const ORTH: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Pseudo-legal moves of one piece (capture-the-king rules: no check test). */
export function pieceMoves(v: Variant, st: State, from: number): Move[] {
  const p = st.board[from];
  if (!p) return [];
  const out: Move[] = [];
  const x0 = from % v.w, y0 = Math.floor(from / v.w);
  const free = (x: number, y: number) => onBoard(v, x, y) && !st.board[y * v.w + x] && st.duck !== y * v.w + x;
  const enemy = (x: number, y: number) => {
    if (!onBoard(v, x, y)) return false;
    const q = st.board[y * v.w + x];
    if (!q || q.o === p.o || !st.alive[q.o]) return false;
    if (v.teams && q.o % 2 === p.o % 2) return false;
    return true;
  };
  const add = (x: number, y: number) => {
    const t = y * v.w + x;
    const m: Move = { f: from, t };
    if (p.t === 'p' && depth(v, p.o, x, y) >= v.promoteAt) m.promo = v.promo;
    out.push(m);
  };
  const step = (dirs: [number, number][]) => { for (const [dx, dy] of dirs) { const x = x0 + dx, y = y0 + dy; if (free(x, y) || enemy(x, y)) add(x, y); } };
  const slide = (dirs: [number, number][]) => {
    for (const [dx, dy] of dirs) {
      let x = x0 + dx, y = y0 + dy;
      while (onBoard(v, x, y) && st.duck !== y * v.w + x) {
        if (free(x, y)) add(x, y);
        else { if (enemy(x, y)) add(x, y); break; }
        x += dx; y += dy;
      }
    }
  };
  switch (p.t) {
    case 'n': case 'x': step(KN); break;
    case 'b': slide(DIAG); break;
    case 'r': slide(ORTH); break;
    case 'q': slide(ORTH); slide(DIAG); break;
    case 'm': step([...ORTH, ...DIAG]); break;
    case 'k': {
      step([...ORTH, ...DIAG]);
      if (!v.noCastle && !p.mv) {
        // castling: along the back rank towards an unmoved own rook with empty squares between
        const fy = fwd(v, p.o)[1];
        const side: [number, number][] = fy !== 0 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
        for (const [dx, dy] of side) {
          let x = x0 + dx, y = y0 + dy, n = 1;
          while (free(x, y)) { x += dx; y += dy; n++; }
          if (!onBoard(v, x, y) || n < 3) continue;
          const r = st.board[y * v.w + x];
          if (!r || r.t !== 'r' || r.o !== p.o || r.mv) continue;
          const kt = (y0 + 2 * dy) * v.w + (x0 + 2 * dx);
          out.push({ f: from, t: kt, rf: y * v.w + x, rt: (y0 + dy) * v.w + (x0 + dx) });
        }
      }
      break;
    }
    case 'p': {
      const [fx, fy] = fwd(v, p.o);
      const x1 = x0 + fx, y1 = y0 + fy;
      if (free(x1, y1)) {
        add(x1, y1);
        const canDouble = !v.noDouble && (v.torpedo || (!p.mv && depth(v, p.o, x0, y0) === 1));
        if (canDouble && free(x0 + 2 * fx, y0 + 2 * fy)) add(x0 + 2 * fx, y0 + 2 * fy);
      }
      const caps: [number, number][] = fy !== 0 ? [[1, fy], [-1, fy]] : [[fx, 1], [fx, -1]];
      for (const [dx, dy] of caps) if (enemy(x0 + dx, y0 + dy)) add(x0 + dx, y0 + dy);
      break;
    }
  }
  return out;
}

export function legalMoves(v: Variant, st: State, seat: number, now = 0): Move[] {
  if (st.over || !st.alive[seat]) return [];
  if (!v.realtime && (st.turn !== seat || st.duckPending)) return [];
  const out: Move[] = [];
  st.board.forEach((p, i) => {
    if (!p || p.o !== seat) return;
    if (v.realtime && p.cd && p.cd > now) return;
    if (v.dice && st.dice && p.t !== st.dice) return;
    out.push(...pieceMoves(v, st, i));
  });
  return v.mate ? out.filter(m => safeAfter(v, st, seat, m)) : out;
}

/** Is any royal piece of `seat` attacked by an opponent? (duck = where the duck stands for this test) */
export function inCheck(v: Variant, st: State, seat: number, duck = st.duck): boolean {
  const kings: number[] = [];
  st.board.forEach((p, i) => { if (p && p.o === seat && v.royal.includes(p.t)) kings.push(i); });
  if (!kings.length) return false;
  const s2: State = duck === st.duck ? st : { ...st, duck };
  for (let i = 0; i < st.board.length; i++) {
    const p = st.board[i];
    if (!p || sameTeam(v, p.o, seat) || !st.alive[p.o]) continue;
    for (const m of pieceMoves(v, s2, i)) if (kings.includes(m.t)) return true;
  }
  return false;
}

/** Board after a move (no turn bookkeeping), for check tests. */
function boardAfter(st: State, m: Move): State {
  const b = st.board.slice();
  const p = b[m.f]!;
  b[m.t] = { ...p, t: m.promo || p.t, mv: 1 };
  b[m.f] = null;
  if (m.rf !== undefined && m.rt !== undefined) { b[m.rt] = { ...b[m.rf]!, mv: 1 }; b[m.rf] = null; }
  return { ...st, board: b };
}

/** Check rules: the move must not leave your own king in check (Duck Chess: some duck square must shield it). */
function safeAfter(v: Variant, st: State, seat: number, m: Move): boolean {
  if (m.rf !== undefined && m.rt !== undefined) { // castling: not out of or through check
    if (inCheck(v, st, seat)) return false;
    if (inCheck(v, boardAfter(st, { f: m.f, t: m.rt }), seat)) return false;
  }
  const after = boardAfter(st, m);
  if (!v.duck) return !inCheck(v, after, seat);
  if (!inCheck(v, after, seat, -1)) return true;
  return duckSquares(v, after, seat, st.duck).length > 0;
}

/** Duck Chess: empty squares where the duck may go (with check rules: only squares that leave your king safe). */
export function duckSquares(v: Variant, st: State, seat: number, oldDuck = st.duck): number[] {
  const out: number[] = [];
  for (let i = 0; i < st.board.length; i++) {
    if (st.board[i] || i === oldDuck || !onBoard(v, i % v.w, Math.floor(i / v.w))) continue;
    if (v.mate && inCheck(v, st, seat, i)) continue;
    out.push(i);
  }
  return out;
}

function rollDice(v: Variant, st: State, seat: number): PT | null {
  const movable = new Set<PT>();
  st.board.forEach((p, i) => { if (p && p.o === seat && pieceMoves(v, st, i).length) movable.add(p.t); });
  const types = [...movable];
  return types.length ? types[Math.floor(Math.random() * types.length)] : null;
}

const sameTeam = (v: Variant, a: number, b: number) => a === b || (!!v.teams && a % 2 === b % 2);

function eliminate(v: Variant, st: State, seat: number) {
  const out = v.teams ? [seat, (seat + 2) % 4] : [seat];
  for (const s of out) {
    st.alive[s] = false;
    st.board.forEach((p, i) => { if (p && p.o === s) st.board[i] = null; });
  }
}

function checkEnd(v: Variant, st: State) {
  const alive = st.alive.map((a, i) => (a ? i : -1)).filter(i => i >= 0);
  if (v.teams) {
    const teams = new Set(alive.map(s => s % 2));
    if (teams.size <= 1) { st.over = true; st.winners = alive; if (!st.reason) st.reason = 'king captured'; }
  } else if (alive.length <= 1) { st.over = true; st.winners = alive; if (!st.reason) st.reason = 'king captured'; }
  if (!st.over) {
    // only royal pieces left everywhere: nobody can win
    const anyArmy = st.board.some(p => p && !v.royal.includes(p.t));
    if (!anyArmy) { st.over = true; st.winners = []; st.reason = 'only kings left'; }
  }
}

function nextTurn(v: Variant, st: State) {
  let s = st.turn;
  for (let i = 0; i < v.players; i++) { s = (s + 1) % v.players; if (st.alive[s]) break; }
  st.turn = s;
  st.turnNo++;
  st.movesLeft = v.movesPerTurn ? v.movesPerTurn(st.turnNo, s) : 1;
  if (v.dice) st.dice = rollDice(v, st, s);
}

/** Apply a move for `seat`. Returns false if it is not allowed. */
export function applyMove(v: Variant, st: State, seat: number, m: Move, now = 0, cooldown = 2500): boolean {
  const legal = legalMoves(v, st, seat, now).find(x => x.f === m.f && x.t === m.t);
  if (!legal) return false;
  const p = st.board[legal.f]!;
  const victim = st.board[legal.t];
  st.board[legal.t] = { ...p, t: legal.promo || p.t, mv: 1, cd: v.realtime ? now + cooldown : undefined };
  st.board[legal.f] = null;
  if (legal.rf !== undefined && legal.rt !== undefined) {
    const r = st.board[legal.rf]!;
    st.board[legal.rt] = { ...r, mv: 1, cd: v.realtime ? now + cooldown : undefined };
    st.board[legal.rf] = null;
  }
  st.last = { f: legal.f, t: legal.t };
  st.ply++;
  st.quiet = victim || p.t === 'p' ? 0 : (st.quiet || 0) + 1;
  if (victim) { if (!st.caps) st.caps = Array.from({ length: v.players }, () => []); st.caps[seat].push({ t: victim.t, o: victim.o }); }
  if (victim && !sameTeam(v, victim.o, seat)) {
    if (v.royal.includes(victim.t)) { st.reason = 'king captured'; eliminate(v, st, victim.o); }
    else if (v.win === 'extinction') {
      const left = new Set(st.board.filter(q => q && q.o === victim.o).map(q => q!.t));
      if (st.startTypes[victim.o].some(t => !left.has(t))) { st.reason = 'a piece type died out'; eliminate(v, st, victim.o); }
    }
  }
  if (v.win === 'promote' && legal.promo) { st.reason = 'pawn promoted'; for (let s = 0; s < v.players; s++) if (s !== seat) st.alive[s] = false; }
  checkEnd(v, st);
  if (!st.over && v.mate && v.players === 2 && (st.quiet || 0) >= 100) { st.over = true; st.winners = []; st.reason = '50-move rule'; }
  if (st.over || v.realtime) return true;
  if (v.duck) { st.duckPending = true; return true; }
  // multi-move turns with check rules: giving check ends the turn
  if (v.mate && v.movesPerTurn && st.alive.some((a, s) => a && !sameTeam(v, s, seat) && inCheck(v, st, s))) st.movesLeft = 0;
  if (--st.movesLeft <= 0) nextTurn(v, st);
  else if (v.dice) st.dice = rollDice(v, st, seat);
  skipStuck(v, st);
  return true;
}

/** Duck Chess: place the duck after moving. */
export function placeDuck(v: Variant, st: State, seat: number, sq: number): boolean {
  if (!v.duck || st.over || !st.duckPending || st.turn !== seat) return false;
  if (sq === st.duck || st.board[sq] || !onBoard(v, sq % v.w, Math.floor(sq / v.w))) return false;
  if (v.mate && inCheck(v, st, seat, sq)) return false; // the duck may not leave your own king in check
  st.duck = sq; st.duckPending = false;
  nextTurn(v, st);
  skipStuck(v, st);
  return true;
}

export function resign(v: Variant, st: State, seat: number) {
  if (st.over || !st.alive[seat]) return;
  st.reason = 'resignation';
  const wasTurn = st.turn === seat;
  eliminate(v, st, seat);
  checkEnd(v, st);
  if (!st.over && wasTurn && !v.realtime) { st.duckPending = false; nextTurn(v, st); skipStuck(v, st); }
}

/** A turn-based player with no moves at all is knocked out (2 players: draw). */
function skipStuck(v: Variant, st: State) {
  for (let i = 0; i < v.players + 4 && !st.over; i++) {
    if (legalMoves(v, st, st.turn).length) return;
    // part-way through a multi-move turn with nothing left to play: the turn simply ends
    if (v.mate && v.movesPerTurn && st.movesLeft < v.movesPerTurn(st.turnNo, st.turn)) { nextTurn(v, st); continue; }
    if (v.mate) {
      const mated = inCheck(v, st, st.turn);
      if (v.players === 2) { st.over = true; st.winners = mated ? [1 - st.turn] : []; st.reason = mated ? 'checkmate' : 'stalemate'; return; }
      st.reason = mated ? 'checkmate' : 'stalemate';
      eliminate(v, st, st.turn);
      checkEnd(v, st);
      if (!st.over) nextTurn(v, st);
      continue;
    }
    if (v.players === 2) { st.over = true; st.winners = []; st.reason = 'no moves left'; return; }
    st.reason = 'no moves left';
    eliminate(v, st, st.turn);
    checkEnd(v, st);
    if (!st.over) nextTurn(v, st);
  }
}

/** Squares a player can see in Fog of War. */
export function visibleSquares(v: Variant, st: State, seat: number): Set<number> {
  const vis = new Set<number>();
  st.board.forEach((p, i) => {
    if (!p || p.o !== seat) return;
    vis.add(i);
    for (const m of pieceMoves(v, st, i)) vis.add(m.t);
    if (p.t === 'p') {
      const [fx, fy] = fwd(v, seat); const x = i % v.w, y = Math.floor(i / v.w);
      const caps: [number, number][] = fy !== 0 ? [[1, fy], [-1, fy]] : [[fx, 1], [fx, -1]];
      for (const [dx, dy] of caps) if (onBoard(v, x + dx, y + dy)) vis.add((y + dy) * v.w + x + dx);
    }
  });
  return vis;
}

/** Copy of the state with hidden squares removed (sent to Fog of War players). */
export function fogView(v: Variant, st: State, seat: number | null): State {
  if (!v.fog || seat === null || st.over) return st;
  const vis = visibleSquares(v, st, seat);
  return { ...st, board: st.board.map((p, i) => (vis.has(i) ? p : null)), last: st.last && vis.has(st.last.t) ? st.last : null };
}

export const VALUE: Record<PT, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100, m: 3, x: 100 };

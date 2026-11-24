import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
import type { Config } from 'chessground/config';
import type { DrawShape } from 'chessground/draw';
import { h, settings, sound } from './ui';
import { t } from './i18n';
import { makeSquare } from 'chessops/util';
import { Position, Move, Role, Color, fenOf, dests, cgToMove, isPromotion, sq, moveSquares, uciToMove, PIECE_VALUE } from './chess';

export interface BoardOpts {
  orientation?: Color;
  onMove?: (m: Move, pos: Position) => void;
  viewOnly?: boolean;
  extra?: Config;
}

/** A chessground board bound to a chessops position. */
export class Board {
  el: HTMLElement;
  cg: Api;
  pos: Position | null = null;
  movableColor: Color | 'both' | null = 'both';
  /** colour allowed to premove while it is the opponent's turn (null = premoves off) */
  premoveColor: Color | null = null;
  /** how many premoves can be queued (Infinity, or 1 when a friend game turned infinite premoves off) */
  premoveLimit = Infinity;
  /** queued premoves, played one after another as soon as it is our turn again */
  private queue: { orig: string; dest: string; promo?: Role }[] = [];
  private lastSq: [string, string] | null = null;
  private interactiveFlag = true;
  private clearBtn: HTMLElement;
  chess960 = false;
  antichess = false;
  private ro: ResizeObserver | null = null;
  /** Crazyhouse: pocket piece picked by tapping, waiting for a target square */
  pendingDrop: Role | null = null;
  onPendingDrop: (r: Role | null) => void = () => {};

  constructor(public opts: BoardOpts = {}) {
    this.el = h('div.board-wrap');
    const inner = h('div.board');
    this.el.appendChild(inner);
    this.cg = Chessground(inner, {
      orientation: opts.orientation || 'white',
      coordinates: settings.coords,
      animation: { enabled: settings.animation, duration: 180 },
      viewOnly: opts.viewOnly,
      movable: { free: false, showDests: true, events: { after: (o, d, meta) => this.userMove(o, d, !!meta?.premove), afterNewPiece: (role, key) => this.userDrop(role as Role, key) } },
      events: { select: (key) => { if (this.pendingDrop) { const r = this.pendingDrop; this.setPendingDrop(null); this.userDrop(r, key); } } },
      premovable: { enabled: false, showDests: true, castle: true },
      draggable: { showGhost: true },
      highlight: { lastMove: true, check: true },
      drawable: { enabled: true, visible: true },
      trustAllEvents: import.meta.env.DEV,
      ...opts.extra,
    });
    this.ro = new ResizeObserver(() => this.cg.redrawAll());
    this.ro.observe(this.el);
    // right-click (like chess.com) or the small button clears all premoves
    this.el.addEventListener('contextmenu', (e) => { if (this.queue.length) { e.preventDefault(); e.stopPropagation(); this.cancelPremove(); } }, true);
    // tapping an empty square (or a square the picked piece cannot go to) clears the premoves, also on phones and tablets
    this.el.addEventListener('pointerdown', (e) => {
      if (!this.queue.length || (e.pointerType === 'mouse' && e.button !== 0) || (e.target as HTMLElement).closest('.pm-clear')) return;
      const key = this.cg.getKeyAtDomPos([e.clientX, e.clientY]);
      if (!key) return;
      const st = this.cg.state;
      const sel = st.selected;
      if (sel && (key === sel || st.movable.dests?.get(sel)?.includes(key))) return; // a premove destination: queue it
      if (!sel && st.pieces.get(key)?.color === this.premoveColor) return; // picking up a piece for another premove
      e.preventDefault();
      this.cancelPremove();
    }, true);
    this.clearBtn = h('button.pm-clear', { type: 'button', onclick: (e: Event) => { e.stopPropagation(); this.cancelPremove(); } });
    this.el.appendChild(this.clearBtn);
  }

  destroy() { this.ro?.disconnect(); this.cg.destroy(); }

  /** Show a position. lastMove optional normalized move that led to it (needs previous position for castle display). */
  setPosition(pos: Position, lastMove?: [string, string] | null, interactive = true) {
    this.pos = pos;
    this.lastSq = lastMove || null;
    this.interactiveFlag = interactive;
    this.redraw();
  }

  /** true while it is the opponent's turn and we may queue premoves */
  private get premoveMode(): boolean {
    const pos = this.pos;
    if (!pos || !this.premoveColor) return false;
    const canMove = this.interactiveFlag && (this.movableColor === 'both' || this.movableColor === pos.turn);
    return !canMove && this.premoveColor !== pos.turn;
  }

  /** The real position with the queued premoves played on it (the opponent "passes"), for display and new premoves. */
  private virtualPos(): { pos: Position; applied: number } {
    const p = this.pos!.clone();
    const me = this.premoveColor!;
    p.turn = me;
    let applied = 0;
    for (const q of this.queue) {
      const m = cgToMove(p, q.orig, q.dest, q.promo);
      if (p.isLegal(m)) p.play(m);
      else {
        // not legal yet (e.g. taking back on a square your own piece stands on): show it anyway
        const piece = p.board.get(sq(q.orig));
        if (!piece || piece.color !== me) break;
        p.board.take(sq(q.orig));
        p.board.set(sq(q.dest), q.promo ? { role: q.promo, color: me, promoted: true } : piece);
      }
      p.turn = me;
      applied++;
    }
    return { pos: p, applied };
  }

  private redraw() {
    const pos = this.pos;
    if (!pos) return;
    const turn = pos.turn;
    const canMove = this.interactiveFlag && (this.movableColor === 'both' || this.movableColor === turn);
    if (this.premoveMode) {
      const { pos: v, applied } = this.virtualPos();
      const custom = new Map<any, string>();
      this.queue.slice(0, applied).forEach(q => { custom.set(q.orig, 'premove-sq'); custom.set(q.dest, 'premove-sq'); });
      this.cg.set({
        fen: fenOf(v), turnColor: this.premoveColor!, check: false,
        lastMove: (applied ? undefined : this.lastSq || undefined) as any,
        highlight: { custom },
        movable: { color: this.premoveColor!, dests: premoveDests(v, this.premoveColor!, this.chess960) },
      });
    } else {
      this.cg.set({
        fen: fenOf(pos), turnColor: turn,
        check: pos.isCheck() ? turn : false,
        lastMove: (this.lastSq || undefined) as any,
        highlight: { custom: new Map() },
        movable: { color: canMove ? turn : undefined, dests: canMove ? dests(pos, this.chess960) : new Map() },
      });
    }
    this.el.classList.toggle('has-premoves', this.queue.length > 0);
    this.clearBtn.textContent = this.queue.length ? `✕ ${this.queue.length}` : '';
    this.clearBtn.title = t('Clear premoves'); this.clearBtn.setAttribute('aria-label', t('Clear premoves') + ` (${this.queue.length})`);
  }

  /** Play the first queued premove if it is legal now; if it is not, every premove is dropped. */
  playPremove(): boolean {
    const pos = this.pos;
    if (!pos || !this.queue.length || pos.turn !== this.premoveColor) return false;
    const q = this.queue[0];
    const m = cgToMove(pos, q.orig, q.dest, q.promo);
    if (!pos.isLegal(m)) { this.cancelPremove(); return false; }
    this.queue.shift();
    this.opts.onMove?.(m, pos);
    return true;
  }
  cancelPremove() { if (!this.queue.length) return; this.queue = []; this.redraw(); }
  get premoveCount() { return this.queue.length; }

  setOrientation(c: Color) { this.cg.set({ orientation: c }); }
  flip() { this.cg.toggleOrientation(); }
  get orientation(): Color { return this.cg.state.orientation; }

  arrows(shapes: DrawShape[]) { this.cg.setAutoShapes(shapes); }

  setPendingDrop(r: Role | null) { this.pendingDrop = r; this.el.classList.toggle('placing', !!r); this.onPendingDrop(r); }

  /** Start dragging a pocket piece (Crazyhouse). */
  dragDrop(role: Role, color: Color, e: MouseEvent | TouchEvent) { this.cg.dragNewPiece({ role, color }, e as any); }

  private userDrop(role: Role, key: string) {
    const pos = this.pos;
    if (!pos) return;
    const m: Move = { role, to: sq(key) };
    if (!pos.isLegal(m)) { this.setPosition(pos, null); return; }
    this.opts.onMove?.(m, pos);
  }

  private async userMove(orig: string, dest: string, premove = false) {
    const pos = this.pos;
    if (!pos) return;
    if (this.premoveMode) {
      // queue a premove on the virtual board; pawns reaching the last rank become queens
      const v = this.virtualPos().pos;
      const promo: Role | undefined = isPromotion(v, sq(orig), sq(dest)) ? 'queen' : undefined;
      const item = { orig, dest, promo };
      if (this.premoveLimit <= 1) this.queue = [item];
      else if (this.queue.length < this.premoveLimit) this.queue.push(item);
      this.redraw();
      return;
    }
    let promo: Role | undefined;
    if (isPromotion(pos, sq(orig), sq(dest))) {
      promo = premove ? 'queen' : await this.askPromotion(pos.turn, dest);
      if (!promo) { this.setPosition(pos, null); return; }
    }
    const m = cgToMove(pos, orig, dest, promo);
    if (!pos.isLegal(m)) { this.setPosition(pos, null); return; }
    this.opts.onMove?.(m, pos);
  }

  askPromotion(color: Color, dest: string): Promise<Role | undefined> {
    return new Promise(resolve => {
      const roles: Role[] = this.antichess ? ['queen', 'knight', 'rook', 'bishop', 'king'] : ['queen', 'knight', 'rook', 'bishop'];
      const file = dest.charCodeAt(0) - 97;
      const fromTop = (color === 'white') === (this.orientation === 'white');
      // Sizes in pixels: percentage heights and aspect-ratio inside buttons render empty on some Safari versions.
      const sqPx = Math.max(24, this.el.getBoundingClientRect().width / 8);
      const left = (this.orientation === 'white' ? file : 7 - file) * sqPx;
      const done = (r?: Role) => { ov.remove(); resolve(r); };
      const ov = h('div.promo-overlay', { onclick: () => done() },
        h('div.promo-col.cg-wrap', { style: { left: left + 'px', width: sqPx + 'px', [fromTop ? 'top' : 'bottom']: '0', flexDirection: fromTop ? 'column' : 'column-reverse' } },
          roles.map(r => h('button.promo-piece', { type: 'button', 'aria-label': t('Promote to {0}', t(r)), style: { width: sqPx + 'px', height: sqPx + 'px' }, onclick: (e: Event) => { e.stopPropagation(); done(r); } },
            h('piece', { class: `${r} ${color}`, style: { width: Math.round(sqPx * 0.86) + 'px', height: Math.round(sqPx * 0.86) + 'px' } })))));
      this.el.appendChild(ov);
    });
  }

  /** Square position (percent of board) for overlays, respecting orientation. */
  private sqBox(key: string) {
    const f = key.charCodeAt(0) - 97, r = key.charCodeAt(1) - 49;
    const white = this.orientation === 'white';
    return { left: (white ? f : 7 - f) * 12.5, top: (white ? 7 - r : r) * 12.5 };
  }

  /** Classification badge in the corner of a square (analysis). */
  setBadge(key: string | null, sym = '', color = '', label = '') {
    const old = this.el.querySelector('.sq-badge') as HTMLElement | null;
    const id = `${key}|${sym}|${this.orientation}`;
    // Live analysis re-renders many times a second: keep an unchanged badge so its pop-in animation can finish.
    if (old && key && old.dataset.id === id) return;
    old?.remove();
    if (!key) return;
    const b = this.sqBox(key);
    const px = Math.max(20, Math.round(this.el.getBoundingClientRect().width / 8 * 0.42));
    this.el.appendChild(h('div.sq-badge', { style: { left: `calc(${b.left + 12.5}% - 3px)`, top: `calc(${b.top}% + 3px)`, background: color, width: px + 'px', height: px + 'px', fontSize: Math.round(px * 0.45) + 'px' }, 'data-id': id, title: label, 'aria-label': label }, sym));
  }

  /** "+3" / "−3" floating over the square where a piece was captured. */
  private capturePopup(key: string, value: number, mine: boolean) {
    if (!settings.points || value <= 0) return;
    const b = this.sqBox(key);
    const el = h('div.cap-pop', { class: mine ? 'gain' : 'loss', style: { left: b.left + 6.25 + '%', top: b.top + '%' } }, (mine ? '+' : '−') + value);
    this.el.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  /** Play a move visually + sound; caller supplies new position. */
  showMove(prev: Position, m: Move, next: Position, interactive = true) {
    const sqs = moveSquares(prev, m);
    this.setPosition(next, sqs, interactive);
    playMoveSound(prev, m, next);
    if (settings.points) {
      const opp = prev.turn === 'white' ? 'black' : 'white';
      const lost = material(prev, opp) - material(next, opp);
      if (lost > 0) this.capturePopup(makeSquare(m.to), lost, prev.turn === this.orientation);
    }
  }
}

export function playMoveSound(prev: Position, m: Move, next: Position) {
  if (next.isCheck()) sound.check();
  else if ('from' in m && (prev.board.get(m.to) && prev.board.get(m.to)!.color !== prev.turn || (prev.board.get(m.from)?.role === 'pawn' && m.to === prev.epSquare))) sound.capture();
  else sound.move();
}

export function arrowFor(pos: Position, uci: string, brush = 'green'): DrawShape | null {
  const m = uciToMove(pos, uci);
  if (!m) return null;
  const s = moveSquares(pos, m);
  if (!s) return null;
  return { orig: s[0] as any, dest: s[1] as any, brush };
}

function material(pos: Position, c: Color): number {
  let v = 0;
  for (const s of pos.board[c]) { const p = pos.board.get(s); if (p) v += PIECE_VALUE[p.role]; }
  return v;
}

/**
 * Premove targets by piece movement only (like lichess / chess.com): the opponent's reply is unknown,
 * so a premove may go to a square your own piece stands on (to take back), pawns may premove diagonally,
 * and sliding pieces may premove through pieces that could move away. Checked for real when it is played.
 */
export function premoveDests(pos: Position, color: Color, chess960 = false): Map<any, any[]> {
  const out = new Map<any, any[]>();
  const name = (f: number, r: number) => 'abcdefgh'[f] + (r + 1);
  const on = (f: number, r: number) => f >= 0 && f < 8 && r >= 0 && r < 8;
  for (const [s, piece] of pos.board) {
    if (piece.color !== color) continue;
    const f0 = s & 7, r0 = s >> 3;
    const t: string[] = [];
    const ray = (dirs: number[][], far: boolean) => { for (const [df, dr] of dirs) { let f = f0 + df, r = r0 + dr; while (on(f, r)) { t.push(name(f, r)); if (!far) break; f += df; r += dr; } } };
    const KD = [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
    switch (piece.role) {
      case 'pawn': {
        const dir = color === 'white' ? 1 : -1, start = color === 'white' ? 1 : 6;
        if (on(f0, r0 + dir)) t.push(name(f0, r0 + dir));
        if (r0 === start || (pos.rules === 'horde' && color === 'white' && r0 === 0)) t.push(name(f0, r0 + 2 * dir));
        for (const df of [-1, 1]) if (on(f0 + df, r0 + dir)) t.push(name(f0 + df, r0 + dir));
        break;
      }
      case 'knight': for (const [df, dr] of [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]) if (on(f0 + df, r0 + dr)) t.push(name(f0 + df, r0 + dr)); break;
      case 'bishop': ray(KD.slice(0, 4), true); break;
      case 'rook': ray(KD.slice(4), true); break;
      case 'queen': ray(KD, true); break;
      case 'king': {
        ray(KD, false);
        // castling while the rights are still there (two squares, or onto the rook in Chess960)
        const back = color === 'white' ? 0 : 7;
        if (r0 === back) for (const rs of pos.castles.castlingRights) {
          const rr = rs >> 3, rf = rs & 7;
          if (rr !== back) continue;
          const rook = pos.board.get(rs);
          if (!rook || rook.role !== 'rook' || rook.color !== color) continue;
          t.push(name(rf, back));
          if (!chess960) t.push(name(rf > f0 ? 6 : 2, back));
        }
        break;
      }
    }
    if (t.length) out.set(name(f0, r0) as any, [...new Set(t)]);
  }
  return out;
}

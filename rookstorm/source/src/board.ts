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
  }

  destroy() { this.ro?.disconnect(); this.cg.destroy(); }

  /** Show a position. lastMove optional normalized move that led to it (needs previous position for castle display). */
  setPosition(pos: Position, lastMove?: [string, string] | null, interactive = true, premoveColor: Color | null = this.premoveColor) {
    this.pos = pos;
    const turn = pos.turn;
    const canMove = interactive && (this.movableColor === 'both' || this.movableColor === turn);
    const premove = !canMove && !!premoveColor && premoveColor !== turn;
    if (!premoveColor) this.cg.cancelPremove();
    this.cg.set({
      fen: fenOf(pos),
      turnColor: turn,
      check: pos.isCheck() ? turn : false,
      lastMove: (lastMove || undefined) as any,
      premovable: { enabled: !!premoveColor },
      movable: {
        color: canMove ? turn : premove ? premoveColor! : undefined,
        dests: canMove ? dests(pos, this.chess960) : new Map(),
      },
    });
  }

  /** Execute a queued premove (if any and legal). Returns true if one was played. */
  playPremove(): boolean { return this.cg.playPremove(); }
  cancelPremove() { this.cg.cancelPremove(); }

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

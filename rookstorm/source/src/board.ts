import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
import type { Config } from 'chessground/config';
import type { DrawShape } from 'chessground/draw';
import { h, settings, sound } from './ui';
import { Position, Move, Role, Color, fenOf, dests, cgToMove, isPromotion, sq, moveSquares, uciToMove } from './chess';

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

  constructor(public opts: BoardOpts = {}) {
    this.el = h('div.board-wrap');
    const inner = h('div.board');
    this.el.appendChild(inner);
    this.cg = Chessground(inner, {
      orientation: opts.orientation || 'white',
      coordinates: settings.coords,
      animation: { enabled: settings.animation, duration: 180 },
      viewOnly: opts.viewOnly,
      movable: { free: false, showDests: true, events: { after: (o, d, meta) => this.userMove(o, d, !!meta?.premove) } },
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
      const left = (this.orientation === 'white' ? file : 7 - file) * 12.5;
      const done = (r?: Role) => { ov.remove(); resolve(r); };
      const ov = h('div.promo-overlay', { onclick: () => done() },
        h('div.promo-col', { style: { left: left + '%', [fromTop ? 'top' : 'bottom']: '0', flexDirection: fromTop ? 'column' : 'column-reverse' } },
          roles.map(r => h('button.promo-piece', { type: 'button', 'aria-label': 'Promote to ' + r, onclick: (e: Event) => { e.stopPropagation(); done(r); } },
            h('piece', { class: `${r} ${color}` })))));
      this.el.appendChild(ov);
    });
  }

  /** Play a move visually + sound; caller supplies new position. */
  showMove(prev: Position, m: Move, next: Position, interactive = true) {
    const sqs = moveSquares(prev, m);
    this.setPosition(next, sqs, interactive);
    playMoveSound(prev, m, next);
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

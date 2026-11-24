/** Board for the party variants: any size, 2–4 players, rotates so your own army is at the bottom. Tap or drag. */
import { h, settings } from '../ui';
import { t } from '../i18n';
import { Variant, State, Move, P, legalMoves, pieceMoves, visibleSquares, onBoard, cooldownMs, duckSquares, inCheck, depth } from './rules';

const ROLE: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king', m: 'king', x: 'knight' };
export const SEAT_COLORS_4 = ['red', 'blue', 'yellow', 'green'];
export const seatColor = (v: Variant, s: number) => (v.players === 2 ? (s === 0 ? 'white' : 'black') : SEAT_COLORS_4[s]);

export function pieceEl(v: Variant, p: P): HTMLElement {
  const color = v.players === 2 ? (p.o === 0 ? 'white' : 'black') : 'white';
  const cls = `${ROLE[p.t]} ${color}${v.players === 4 ? ' tint-' + p.o : ''}${p.t === 'x' ? ' royal' : ''}${p.t === 'm' ? ' commoner' : ''}`;
  return h('piece', { class: cls });
}

export class PartyBoard {
  el: HTMLElement;
  private grid: HTMLElement;
  private cells: HTMLElement[] = [];
  private st: State | null = null;
  private sel: number | null = null;
  private targets: Move[] = [];
  private canAct = false;
  private clockOffset = 0; // local time - host time
  private drag: { from: number; ghost: HTMLElement | null; x: number; y: number } | null = null;
  onMove: (m: Move) => void = () => {};
  onDuck: (sq: number) => void = () => {};
  /** premoves queued while the others are moving (turn-based variants without duck or dice) */
  private queue: Move[] = [];
  private clearBtn: HTMLElement;
  private premoveOk: boolean;

  constructor(public v: Variant, public seat: number | null) {
    this.grid = h('div.pgrid.cg-wrap', { style: { gridTemplateColumns: `repeat(${v.w}, 1fr)` } });
    this.el = h('div.pboard-wrap', null, this.grid);
    const rot = this.rotation();
    const cx = (v.w - 1) / 2, cy = (v.h - 1) / 2;
    // build squares in screen order
    const order: number[] = Array(v.w * v.h);
    for (let y = 0; y < v.h; y++) for (let x = 0; x < v.w; x++) {
      let dx = x - cx, dy = y - cy;
      for (let r = 0; r < rot; r++) [dx, dy] = [-dy, dx];
      const col = Math.round(dx + cx), row = Math.round(v.h - 1 - (dy + cy));
      order[row * v.w + col] = y * v.w + x;
    }
    this.cells = Array(v.w * v.h);
    for (const i of order) {
      const x = i % v.w, y = Math.floor(i / v.w);
      const c = h('div.psq', { class: onBoard(v, x, y) ? ((x + y) % 2 ? 'l' : 'd') : 'hole', 'data-i': i });
      this.cells[i] = c;
      this.grid.appendChild(c);
    }
    this.premoveOk = !v.realtime && !v.duck && !v.dice;
    this.clearBtn = h('button.pm-clear', { type: 'button', title: t('Clear premoves'), 'aria-label': t('Clear premoves'), onclick: (e: Event) => { e.stopPropagation(); this.cancelPremoves(); } });
    this.el.appendChild(this.clearBtn);
    // 4-player boards: mark the row where your pawns promote
    if (v.players === 4 && seat !== null) {
      for (let i = 0; i < v.w * v.h; i++) { const x = i % v.w, y = Math.floor(i / v.w); if (onBoard(v, x, y) && depth(v, seat, x, y) === v.promoteAt) this.cells[i].classList.add('promo-row'); }
      const row = v.h - 1 - v.promoteAt; // after rotating, your army is at the bottom
      this.el.appendChild(h('div.promo-tag', { style: { top: (row / v.h) * 100 + '%', height: 100 / v.h + '%' } }, h('span', null, t('Promotion line'))));
    }
    this.grid.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointermove', this.moveH);
    window.addEventListener('pointerup', this.upH);
    this.grid.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  destroy() { window.removeEventListener('pointermove', this.moveH); window.removeEventListener('pointerup', this.upH); }

  private rotation(): number {
    if (this.seat === null) return 0;
    return this.v.players === 2 ? (this.seat === 1 ? 2 : 0) : this.seat;
  }

  /** local "now" expressed in host time */
  now() { return Date.now() - this.clockOffset; }
  setClock(hostNow: number) { this.clockOffset = Date.now() - hostNow; }

  update(st: State, canAct: boolean) {
    const prevPly = this.st?.ply;
    this.st = st; this.canAct = canAct;
    if (!canAct || st.over) this.queue = [];
    // a takeback (or a new round) went back in time: drop the premoves
    if (prevPly !== undefined && st.ply < prevPly) this.queue = [];
    const b = this.premoveMode ? this.virtualBoard() : st.board;
    if (this.sel !== null && (!b[this.sel] || b[this.sel]!.o !== this.seat)) this.sel = null;
    this.refreshTargets();
    this.draw();
    this.playPremove();
  }

  /** It is someone else's turn and we may plan our next moves. */
  private get premoveMode() {
    const st = this.st;
    return !!st && this.premoveOk && settings.premove && this.canAct && this.seat !== null && !st.over && st.turn !== this.seat;
  }
  /** The board with our queued premoves already played (the others "pass"). */
  private virtualBoard(): (P | null)[] {
    const b = this.st!.board.slice();
    for (const q of this.queue) { b[q.t] = b[q.f]; b[q.f] = null; }
    return b;
  }
  cancelPremoves() { if (!this.queue.length) return; this.queue = []; this.sel = null; this.targets = []; this.draw(); }
  /** Our turn came: play the first premove if it is legal now, otherwise drop them all. */
  private playPremove() {
    const st = this.st;
    if (!st || !this.queue.length || this.seat === null || st.turn !== this.seat || !this.canAct || st.duckPending) return;
    const q = this.queue[0];
    const legal = legalMoves(this.v, st, this.seat, this.now()).find(m => m.f === q.f && m.t === q.t);
    if (!legal) { this.cancelPremoves(); return; }
    this.queue.shift();
    setTimeout(() => this.onMove(legal), 60);
  }

  private refreshTargets() {
    const st = this.st;
    if (!st || this.sel === null || this.seat === null || !this.canAct) { this.targets = []; return; }
    if (this.premoveMode) {
      const vst: State = { ...st, board: this.virtualBoard(), duck: -1, turn: this.seat };
      this.targets = pieceMoves(this.v, vst, this.sel);
      return;
    }
    this.targets = legalMoves(this.v, st, this.seat, this.now()).filter(m => m.f === this.sel);
  }

  private draw() {
    const st = this.st!; const v = this.v;
    const vis = v.fog && this.seat !== null && !st.over ? visibleSquares(v, st, this.seat) : null;
    const now = this.now();
    const cd = cooldownMs(st.speed);
    const duckMode = v.duck && st.duckPending && st.turn === this.seat && this.canAct;
    const duckOk = duckMode ? new Set(duckSquares(v, st, this.seat!)) : null;
    // royal pieces under attack glow red (every variant, every seat)
    const vb = this.queue.length ? this.virtualBoard() : null;
    const pre = new Set(this.queue.flatMap(q => [q.f, q.t]));
    this.el.classList.toggle('has-premoves', this.queue.length > 0);
    this.clearBtn.textContent = this.queue.length ? '✕ ' + this.queue.length : '';
    const checked = new Set<number>();
    if (!st.over) for (let s = 0; s < v.players; s++) {
      if (!st.alive[s] || !inCheck(v, st, s)) continue;
      st.board.forEach((p, i) => { if (p && p.o === s && v.royal.includes(p.t)) checked.add(i); });
    }
    for (let i = 0; i < this.cells.length; i++) {
      const c = this.cells[i];
      if (c.classList.contains('hole')) continue;
      const hidden = !!vis && !vis.has(i);
      // Fog of War: never draw what is hidden (the host and games against the computer hold the full position)
      const p = hidden ? null : (this.queue.length ? vb![i] : st.board[i]);
      c.classList.toggle('fog', hidden);
      c.classList.toggle('last', !hidden && !!st.last && (st.last.f === i || st.last.t === i));
      c.classList.toggle('in-check', !hidden && checked.has(i));
      c.classList.toggle('sel', this.sel === i);
      c.classList.toggle('premove-sq', pre.has(i));
      c.classList.toggle('dest', this.targets.some(m => m.t === i));
      c.classList.toggle('cap', this.targets.some(m => m.t === i) && !!p);
      c.classList.toggle('duckable', !!duckOk && duckOk.has(i));
      c.replaceChildren();
      if (st.duck === i && !hidden) c.appendChild(h('span.duck', { 'aria-label': 'duck' }, '🦆'));
      if (p && !(this.drag && this.drag.ghost && this.drag.from === i)) {
        const pe = pieceEl(v, p);
        c.appendChild(pe);
        if (v.realtime && p.cd && p.cd > now) {
          const left = p.cd - now;
          const bar = h('span.cdbar', { style: { height: Math.min(100, (left / cd) * 100) + '%' } });
          c.appendChild(bar);
          c.classList.add('resting');
          requestAnimationFrame(() => { bar.style.transition = `height ${left}ms linear`; bar.style.height = '0%'; });
          setTimeout(() => { c.classList.remove('resting'); if (this.sel === i) { this.refreshTargets(); this.draw(); } }, left + 30);
        } else c.classList.remove('resting');
      }
    }
  }

  private sqAt(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const c = el?.closest('.psq') as HTMLElement | null;
    if (!c || !this.grid.contains(c) || c.classList.contains('hole')) return null;
    return +c.dataset.i!;
  }

  private tryMove(to: number): boolean {
    const m = this.targets.find(t => t.t === to);
    if (!m) return false;
    this.sel = null; this.targets = [];
    if (this.premoveMode) { this.queue.push({ f: m.f, t: m.t }); this.draw(); return true; }
    this.onMove(m);
    return true;
  }

  private down(e: PointerEvent) {
    const st = this.st;
    if (!st || this.seat === null || !this.canAct) return;
    if ((e.target as HTMLElement).closest('.pm-clear')) return;
    const i = this.sqAt(e.clientX, e.clientY);
    if (i === null) return;
    e.preventDefault();
    if (this.v.duck && st.duckPending && st.turn === this.seat) { if (duckSquares(this.v, st, this.seat).includes(i)) this.onDuck(i); return; }
    if (this.sel !== null && this.tryMove(i)) return;
    const b = this.premoveMode ? this.virtualBoard() : st.board;
    const p = b[i];
    if (p && p.o === this.seat) {
      this.sel = this.sel === i ? null : i;
      this.refreshTargets(); this.draw();
      if (this.sel !== null) this.drag = { from: i, ghost: null, x: e.clientX, y: e.clientY };
    } else if (this.sel === null && this.queue.length) this.cancelPremoves(); // tap an empty square: clear premoves
    else { this.sel = null; this.targets = []; this.draw(); }
  }

  private moveH = (e: PointerEvent) => {
    const d = this.drag;
    if (!d) return;
    if (!d.ghost) {
      const piece = (this.queue.length ? this.virtualBoard() : this.st?.board || [])[d.from];
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6 || !piece) return;
      const size = this.cells[d.from].getBoundingClientRect().width;
      d.ghost = h('div.pghost.cg-wrap', { style: { width: size + 'px', height: size + 'px' } }, pieceEl(this.v, piece));
      document.body.appendChild(d.ghost);
      this.draw();
    }
    d.ghost.style.left = e.clientX + 'px'; d.ghost.style.top = e.clientY + 'px';
  };

  private upH = (e: PointerEvent) => {
    const d = this.drag;
    this.drag = null;
    if (!d || !d.ghost) return;
    d.ghost.remove();
    const to = this.sqAt(e.clientX, e.clientY);
    if (to === null || !this.tryMove(to)) this.draw();
  };
}

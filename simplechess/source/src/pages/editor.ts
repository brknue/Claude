import { Chessground } from 'chessground';
import { h, icon, btn, iconBtn, toast, copyText, settings, engineLock, liveGameActive } from '../ui';
import { posFromFen, positionError, fenOf, pvToSan, Color, Role } from '../chess';
import { arrowFor } from '../board';
import { engine, Line, fmtScore, whiteCp, winPct } from '../engine';
import { setAnalysisInput } from './analysis';
import { startGame } from './play';
import { go } from '../main';
import { t } from '../i18n';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

export function editorPage(root: HTMLElement, arg?: string) {
  let turn: Color = 'white';
  let castle = { K: true, Q: true, k: true, q: true };
  let boardFen = START;
  if (arg) {
    const parts = arg.split(' ');
    boardFen = parts[0];
    turn = parts[1] === 'b' ? 'black' : 'white';
    const c = parts[2] || '-';
    castle = { K: c.includes('K'), Q: c.includes('Q'), k: c.includes('k'), q: c.includes('q') };
  }
  let tool: { role: Role; color: Color } | 'trash' | 'hand' = 'hand';
  let lines: Line[] = [];
  let analysing = false;
  let alive = true;

  const boardEl = h('div.board');
  const wrap = h('div.board-wrap', null, boardEl);
  const cg = Chessground(boardEl, {
    fen: boardFen, orientation: 'white', coordinates: settings.coords,
    movable: { free: true, color: 'both', showDests: false },
    draggable: { deleteOnDropOff: true, showGhost: true },
    highlight: { lastMove: false, check: false },
    animation: { enabled: false },
    drawable: { enabled: true },
    trustAllEvents: import.meta.env.DEV,
    events: {
      change: () => { boardFen = cg.getFen(); changed(); },
      select: (key) => {
        if (tool === 'hand') return;
        if (tool === 'trash') cg.setPieces(new Map([[key, undefined]]));
        else cg.setPieces(new Map([[key, { role: tool.role, color: tool.color }]]));
        cg.selectSquare(null);
        boardFen = cg.getFen(); changed();
      },
    },
  });
  const ro = new ResizeObserver(() => cg.redrawAll());
  ro.observe(wrap);

  const ROLES: Role[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
  const palette = (color: Color) => h('div.palette.cg-wrap.pc', null, ROLES.map(r => {
    const b = h('button.pal', { type: 'button', 'aria-label': t(r), title: t('Click to select, or drag onto the board') }, h('piece', { class: `${r} ${color}` }));
    const pick = () => { tool = typeof tool === 'object' && tool.role === r && tool.color === color ? 'hand' : { role: r, color }; renderTools(); };
    // Touch: the board library cancels the tap's click when the touch ends, so a short tap is detected here.
    let touchAt: { x: number; y: number } | null = null, lastTouch = 0;
    b.addEventListener('click', () => { if (Date.now() - lastTouch > 700) pick(); });
    b.addEventListener('mousedown', (e) => { if (e.button === 0) cg.dragNewPiece({ role: r, color }, e as any, true); });
    b.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) return;
      e.preventDefault(); // no page scroll while dragging a new piece
      touchAt = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      cg.dragNewPiece({ role: r, color }, e as any, true);
    }, { passive: false });
    b.addEventListener('touchend', (e) => {
      const p = e.changedTouches[0];
      if (touchAt && p && Math.hypot(p.clientX - touchAt.x, p.clientY - touchAt.y) < 12) { lastTouch = Date.now(); pick(); }
      touchAt = null;
    });
    return b;
  }));
  const palTop = palette('black'), palBot = palette('white');
  const toolRow = h('div.toolrow');

  const err = h('div.err');
  const fenInput = h('input.fen-input', { 'aria-label': t('FEN'), spellcheck: false }) as HTMLInputElement;
  fenInput.addEventListener('change', () => {
    const f = fenInput.value.trim();
    const parts = f.split(/\s+/);
    try {
      cg.set({ fen: parts[0] });
      boardFen = cg.getFen();
      turn = parts[1] === 'b' ? 'black' : 'white';
      const c = parts[2] || '-';
      castle = { K: c.includes('K'), Q: c.includes('Q'), k: c.includes('k'), q: c.includes('q') };
      renderControls(); changed();
    } catch { toast(t('Invalid FEN')); }
  });
  const controls = h('div.ed-controls');
  const result = h('div.ed-result');

  function fullFen(): string {
    const pos = posFromFen(`${boardFen} w - - 0 1`);
    let c = '';
    const at = (s: string) => { const m = cg.state.pieces.get(s as any); return m ? m.color[0] + m.role : ''; };
    if (castle.K && at('e1') === 'wking' && at('h1') === 'wrook') c += 'K';
    if (castle.Q && at('e1') === 'wking' && at('a1') === 'wrook') c += 'Q';
    if (castle.k && at('e8') === 'bking' && at('h8') === 'brook') c += 'k';
    if (castle.q && at('e8') === 'bking' && at('a8') === 'brook') c += 'q';
    void pos;
    return `${boardFen} ${turn[0]} ${c || '-'} - 0 1`;
  }

  function renderTools() {
    toolRow.replaceChildren(
      h('button.tool', { type: 'button', class: tool === 'hand' ? 'on' : '', onclick: () => { tool = 'hand'; renderTools(); } }, t('Move pieces')),
      h('button.tool', { type: 'button', class: tool === 'trash' ? 'on' : '', onclick: () => { tool = 'trash'; renderTools(); } }, icon('trash'), t('Delete')));
    document.querySelectorAll('.pal').forEach(b => b.classList.remove('on'));
    if (typeof tool === 'object') {
      const pal = tool.color === 'white' ? palBot : palTop;
      pal.children[ROLES.indexOf(tool.role)]?.classList.add('on');
    }
    wrap.classList.toggle('placing', tool !== 'hand');
  }

  function renderControls() {
    const ck = (k: keyof typeof castle, label: string) => h('label.check.small', null, h('input', { type: 'checkbox', checked: castle[k], onchange: (e: any) => { castle[k] = e.target.checked; changed(); } }), label);
    controls.replaceChildren(
      h('div.field', null, h('span.lbl', null, t('Side to move')), h('div.seg', null, (['white', 'black'] as Color[]).map(c =>
        h('button', { type: 'button', class: turn === c ? 'on' : '', onclick: () => { turn = c; renderControls(); changed(); } }, h('span.cdot.' + c), c === 'white' ? t('White') : t('Black'))))),
      h('div.field', null, h('span.lbl', null, t('Castling rights')), h('div.row.wrap', null, ck('K', 'White O-O'), ck('Q', 'White O-O-O'), ck('k', 'Black O-O'), ck('q', 'Black O-O-O'))),
      h('div.row.wrap', null,
        btn(t('Starting position'), () => { cg.set({ fen: START }); boardFen = START; castle = { K: true, Q: true, k: true, q: true }; turn = 'white'; renderControls(); changed(); }),
        btn(h('span', null, icon('trash'), t('Clear board')), () => { cg.set({ fen: '8/8/8/8/8/8/8/8' }); boardFen = cg.getFen(); changed(); }),
        iconBtn('flip', t('Flip board'), () => cg.toggleOrientation())),
      h('label.field', null, h('span.lbl', null, t('FEN')), h('div.row', null, fenInput, iconBtn('copy', t('Copy FEN'), () => copyText(fullFen())))));
  }

  let token = 0;
  function changed() {
    const fen = fullFen();
    fenInput.value = fen;
    const e = positionError(fen);
    err.textContent = e || '';
    err.style.display = e ? '' : 'none';
    lines = [];
    cg.setAutoShapes([]);
    renderResult();
    if (!e && analysing) analyse();
    history.replaceState(null, '', '#/editor/' + encodeURIComponent(fen));
  }

  async function analyse() {
    if (liveGameActive()) return;
    const fen = fullFen();
    if (positionError(fen)) return;
    const pos = posFromFen(fen)!;
    analysing = true;
    const t = ++token;
    lines = [];
    renderResult();
    if (pos.isEnd()) { renderResult(); return; }
    await engine.analyse({
      fen, depth: 24, multipv: 3,
      onInfo: (ls) => {
        if (!alive || t !== token) return;
        lines = ls; renderResult();
        const a = ls[0] && arrowFor(pos, ls[0].pv[0], 'green');
        const b = ls[1] && arrowFor(pos, ls[1].pv[0], 'blue');
        cg.setAutoShapes([a, b].filter(Boolean) as any);
      },
    });
  }

  function renderResult() {
    result.replaceChildren();
    const fen = fullFen();
    const e = positionError(fen);
    const actions = h('div.row.wrap', null,
      btn(h('span', null, icon('bulb'), t('Find best move')), () => { if (!e) analyse(); else toast(e); }, 'primary' + (e ? ' disabled' : '')),
      btn(h('span', null, icon('chart'), t('Open in analysis')), () => { if (e) { toast(e); return; } setAnalysisInput({ variant: 'standard', startFen: fen, ucis: [], orientation: cg.state.orientation }); go('analysis'); }),
      btn(h('span', null, icon('cpu'), t('Play from here')), () => {
        if (e) { toast(e); return; }
        if (posFromFen(fen)!.isEnd()) { toast(t('The game is already over in this position.')); return; }
        startGame({ mode: 'bot', variant: 'standard', startFen: fen, time: 0, inc: 0, myColor: turn, elo: settings.lastElo || 1500, oppName: `Stockfish · ${settings.lastElo || 1500}` });
      }));
    result.append(actions);
    if (e) return;
    const pos = posFromFen(fen)!;
    if (pos.isEnd()) {
      result.append(h('div.best', null, pos.isCheckmate() ? (pos.turn === 'white' ? t('Checkmate — Black wins.') : t('Checkmate — White wins.')) : t('Stalemate / draw — no moves available.')));
      return;
    }
    if (lines.length) {
      const l0 = lines[0];
      const bestSan = pvToSan(pos, l0.pv, 1).replace(/^\d+\.+\s*/, '');
      const w = winPct(whiteCp(l0, pos.turn));
      result.append(h('div.best', null, h('div.muted.small', null, (pos.turn === 'white' ? t('Best move for White') : t('Best move for Black')) + ' · ' + t('depth {0}', l0.depth)),
        h('div.best-move', null, bestSan, h('span.score', null, fmtScore(l0, pos.turn))),
        h('div.winbar', { title: t('Winning chances') }, h('div', { style: { width: w + '%' } })),
        h('div.lines', null, lines.map(l => h('div.line', null, h('span.score', { class: whiteCp(l, pos.turn) >= 0 ? 'w' : 'b' }, fmtScore(l, pos.turn)), h('span.pv', null, pvToSan(pos, l.pv, 10)))))));
    }
  }

  root.append(h('div.game-layout.editor', null,
    h('div.board-col', null, palTop, wrap, palBot, toolRow, h('p.muted.small.ed-hint', null, t('Click to select, or drag onto the board'))),
    h('aside.side.card', null, h('h2', null, t('Board editor')), h('p.muted.small', null, t('Drag pieces from the trays, or pick one and tap squares. Drag a piece off the board to remove it. Then let Stockfish find the best move.')), controls, err, result)));
  renderTools(); renderControls(); changed();

  const unlock = engineLock(root, (locked) => { if (locked) { analysing = false; engine.stop(); } });
  return () => { unlock(); alive = false; engine.stop(); ro.disconnect(); cg.destroy(); };
}

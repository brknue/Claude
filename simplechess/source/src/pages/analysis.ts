import { parsePgn, startingPosition } from 'chessops/pgn';
import { parseSan } from 'chessops/san';
import { makeFen } from 'chessops/fen';
import { makeSquare } from 'chessops/util';
import { h, icon, btn, iconBtn, scrollInside, toast, copyText, loadRaw, debounce, engineLock } from '../ui';
import { VariantKey, variantInfo, posFromFen, fenOf, uciToMove, moveSquares, pvToSan, PIECE_VALUE, Position, Move, Color, startFenFor, positionError } from '../chess';
import { Game } from '../game';
import { Board, arrowFor } from '../board';
import { engine, Line, whiteCp, fmtScore, winPct } from '../engine';
import { openingIndex, Opening } from '../openings-db';
import { go } from '../main';
import { saveReview, dropQueued } from '../review';
import { t } from '../i18n';

export interface AnalysisInput {
  variant: VariantKey; startFen: string; ucis: string[]; orientation?: Color; white?: string; black?: string; autoReview?: boolean; ply?: number;
  /** account game id: the review result (brilliant moves) is saved to the profile */
  gameId?: string;
}
let pending: AnalysisInput | null = null;
let lastInput: AnalysisInput | null = null;
export function setAnalysisInput(a: AnalysisInput) { pending = a; }

type Cls = 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'book' | 'inaccuracy' | 'mistake' | 'miss' | 'blunder' | 'forced';
export const CLS: Record<Cls, { label: string; sym: string; color: string }> = {
  brilliant: { label: t('Brilliant'), sym: '!!', color: '#1baca6' },
  great: { label: t('Great move'), sym: '!', color: '#5c8bb0' },
  best: { label: t('Best move'), sym: '*', color: '#81b64c' },
  excellent: { label: t('Excellent'), sym: '+', color: '#98bc4b' },
  good: { label: t('Good'), sym: '✓', color: '#97af8b' },
  book: { label: t('Book'), sym: 'B', color: '#a88865' },
  forced: { label: t('Forced'), sym: '→', color: '#97af8b' },
  inaccuracy: { label: t('Inaccuracy'), sym: '?!', color: '#e6b833' },
  mistake: { label: t('Mistake'), sym: '?', color: '#e58f2a' },
  miss: { label: t('Miss'), sym: '✕', color: '#ee6b55' },
  blunder: { label: t('Blunder'), sym: '??', color: '#ca3431' },
};
const SUMMARY_ORDER: Cls[] = ['brilliant', 'great', 'best', 'excellent', 'good', 'book', 'inaccuracy', 'mistake', 'miss', 'blunder'];

interface Eval { cp: number; best?: string; second?: number; lines: Line[]; terminal?: boolean }
interface MoveReview { cls: Cls; loss: number; acc: number; bestSan?: string; bestUci?: string; opening?: string }

export function analysisPage(root: HTMLElement): () => void {
  const input = pending || lastInput || { variant: 'standard' as VariantKey, startFen: startFenFor('standard'), ucis: [], orientation: 'white' as Color };
  pending = null;
  lastInput = input;

  let main: Game = buildGame(input);
  let vari: { from: number; game: Game } | null = null;
  let cur = { inVar: false, ply: Math.min(input.ply ?? (input.autoReview ? 0 : main.ply), main.ply) };
  let engineOn = variantInfo(main.variant).sf;
  let liveLines: Line[] = [];
  let lastBar: { cp: number; txt: string } | null = null;
  let liveDepth = 0;
  let evals: (Eval | null)[] = [];
  let reviews: (MoveReview | null)[] = [];
  let reviewing = false;
  let reviewed = false;
  let alive = true;
  let openingName = '';
  const names = { white: input.white || t('White'), black: input.black || t('Black') };

  const board = new Board({ orientation: input.orientation || 'white', onMove: (m) => userMove(m) });
  board.chess960 = main.variant === 'chess960';
  board.movableColor = 'both';

  const evalBar = h('div.evalbar', { 'aria-hidden': 'true' }, h('div.evalfill'), h('span.evaltxt'));
  const linesBox = h('div.lines');
  const engineHead = h('div.engine-head');
  const moveList = h('div.movelist.analysis-moves');
  const varBox = h('div.varbox');
  const explain = h('div.explain');
  const summary = h('div.summary');
  const graph = h('div.graph');
  const toolsBox = h('div.tools');
  const openingEl = h('div.opening-name.muted.small');

  // ▶ plays the game from the current move (from the start if at the end), one move per second
  let playT: any = 0;
  const playBtn = iconBtn('play', t('Play through the game'), () => togglePlay(), 'play-btn');
  function stopPlay() {
    if (!playT) return;
    clearInterval(playT); playT = 0;
    playBtn.replaceChildren(icon('play')); playBtn.classList.remove('on'); playBtn.title = t('Play through the game');
  }
  function togglePlay() {
    if (playT) { stopPlay(); return; }
    if (cur.ply >= curGame().ply) goto(0);
    playBtn.replaceChildren(icon('pause')); playBtn.classList.add('on'); playBtn.title = t('Pause');
    playT = setInterval(() => { if (!alive || cur.ply >= curGame().ply) { stopPlay(); return; } step(1); }, 1000);
  }
  const side = h('aside.side.card', null, engineHead, linesBox, graph, explain, openingEl, moveList, varBox,
    h('div.navrow', null,
      iconBtn('first', t('First'), () => { stopPlay(); goto(0); }), iconBtn('prev', t('Previous'), () => { stopPlay(); step(-1); }),
      playBtn,
      iconBtn('next', t('Next'), () => { stopPlay(); step(1); }), iconBtn('last', t('Last'), () => { stopPlay(); goto(Infinity); }),
      iconBtn('flip', t('Flip board'), () => { board.flip(); renderEngine(); })),
    summary, toolsBox);
  root.append(h('div.game-layout.analysis', null, h('div.board-col', null, h('div.board-eval', null, evalBar, board.el)), side));

  function buildGame(a: AnalysisInput): Game {
    const g = new Game(a.variant, a.startFen);
    for (const u of a.ucis) if (!g.playUci(u)) break;
    g.result = null; // allow continuing analysis past game end
    return g;
  }

  const curGame = () => (cur.inVar && vari ? vari.game : main);
  const curPos = (): Position => curGame().positions[cur.ply];
  const curMove = (): { prev: Position; m: Move } | null => {
    const g = curGame();
    if (cur.ply > 0) return { prev: g.positions[cur.ply - 1], m: g.moves[cur.ply - 1] };
    if (cur.inVar && vari && vari.from > 0) return null;
    return null;
  };

  function goto(ply: number) {
    const g = curGame();
    cur.ply = Math.max(0, Math.min(g.ply, ply));
    update();
  }
  function step(d: number) {
    if (cur.inVar && vari && cur.ply + d < 0) { cur = { inVar: false, ply: vari.from }; update(); return; }
    goto(cur.ply + d);
  }

  function userMove(m: Move) {
    stopPlay();
    const pos = curPos();
    if (!cur.inVar) {
      if (cur.ply < main.ply && main.positions[cur.ply] === pos) {
        const nextUci = main.ucis[cur.ply];
        const g = new Game(main.variant, fenOf(pos));
        if (!g.play(m)) { update(); return; }
        if (g.ucis[0] === nextUci) { cur.ply++; update(); return; }
        vari = { from: cur.ply, game: g };
        cur = { inVar: true, ply: 1 };
        update(); return;
      }
      // At end of main line: extend main line
      if (!main.play(m)) { update(); return; }
      main.result = null;
      cur.ply = main.ply;
      evals.length = Math.min(evals.length, main.ply);
      update(); return;
    }
    // In variation
    const g = vari!.game;
    if (cur.ply < g.ply) {
      const keep = g.ucis.slice(0, cur.ply);
      const ng = new Game(g.variant, g.startFen);
      keep.forEach(u => ng.playUci(u));
      vari!.game = ng;
    }
    if (!vari!.game.play(m)) { update(); return; }
    vari!.game.result = null;
    cur.ply = vari!.game.ply;
    update();
  }

  // ----- live engine -----
  const runLive = debounce(async () => {
    if (!alive || !engineOn || reviewing) return;
    const pos = curPos();
    if (pos.isEnd()) { liveLines = []; renderEngine(); return; }
    const fen = fenOf(pos);
    liveLines = []; liveDepth = 0; renderEngine();
    await engine.analyse({
      fen, depth: 22, multipv: 3, chess960: main.variant === 'chess960',
      onInfo: (ls) => { if (curPos() !== pos) return; liveLines = ls; liveDepth = ls[0]?.depth || 0; renderEngine(); },
    });
  }, 120);

  function renderEngine() {
    const pos = curPos();
    const supported = variantInfo(main.variant).sf;
    engineHead.replaceChildren(
      h('label.switch', null, h('input', { type: 'checkbox', checked: engineOn, disabled: !supported, onchange: (e: any) => { engineOn = e.target.checked; if (!engineOn) { engine.stop(); liveLines = []; } update(); } }), h('span'), ' Stockfish 17'),
      h('span.muted.small', null, !supported ? t('Not available for this variant') : reviewing ? t('Reviewing game…') : engineOn ? (liveDepth ? t('depth {0}', liveDepth) : t('thinking…')) : t('off')));
    linesBox.replaceChildren();
    let cp: number | null = null;
    let txt = '';
    const term = terminalEval(pos);
    const saved = !cur.inVar ? evals[cur.ply] : null;
    if (term) { cp = term.cp; txt = term.label; }
    else if (engineOn && liveLines.length) {
      // the bar follows the engine only once its reading is solid (early depths jump around)
      if (liveDepth >= 10 || !saved) { cp = whiteCp(liveLines[0], pos.turn); txt = fmtScore(liveLines[0], pos.turn); }
      else { cp = saved.cp; txt = scoreText(saved.cp); }
      liveLines.forEach(l => {
        linesBox.append(h('button.line', { type: 'button', onclick: () => { const m = uciToMove(pos, l.pv[0]); if (m) userMove(m); } },
          h('span.score', { class: whiteCp(l, pos.turn) >= 0 ? 'w' : 'b' }, fmtScore(l, pos.turn)), h('span.pv', null, pvToSan(pos, l.pv, 10))));
      });
    } else if (saved) { cp = saved.cp; txt = scoreText(saved.cp); }
    // no reading yet for this position: keep the bar where it is instead of dropping to the middle
    if (cp === null && lastBar && engineOn && supported) { cp = lastBar.cp; txt = lastBar.txt; }
    if (cp !== null) lastBar = { cp, txt };
    setBar(cp, txt);
    // arrows
    const shapes: any[] = [];
    const cm = curMove();
    const rv = !cur.inVar && cur.ply > 0 ? reviews[cur.ply - 1] : null;
    if (rv && cm && rv.bestUci && ['inaccuracy', 'mistake', 'blunder', 'miss'].includes(rv.cls)) {
      const a = arrowFor(cm.prev, rv.bestUci, 'green'); if (a) shapes.push(a);
    }
    if (engineOn && liveLines[0] && !term) { const a = arrowFor(pos, liveLines[0].pv[0], 'blue'); if (a) shapes.push(a); }
    board.arrows(shapes);
    // classification badge on the piece that just moved (like chess.com)
    if (rv && cm) {
      const sqs = moveSquares(cm.prev, cm.m);
      const dest = sqs ? sqs[1] : 'to' in cm.m ? makeSquare(cm.m.to) : null;
      board.setBadge(dest, CLS[rv.cls].sym, CLS[rv.cls].color, t(CLS[rv.cls].label));
    } else board.setBadge(null);
  }

  function setBar(cp: number | null, txt: string) {
    const w = cp === null ? 50 : winPct(cp);
    const flipped = board.orientation === 'black';
    (evalBar.firstChild as HTMLElement).style.height = w + '%';
    evalBar.classList.toggle('flipped', flipped);
    (evalBar.lastChild as HTMLElement).textContent = txt.replace(/^\+/, '');
    evalBar.classList.toggle('black-adv', cp !== null && cp < 0);
  }

  function terminalEval(pos: Position): { cp: number; label: string } | null {
    if (!pos.isEnd()) return null;
    if (pos.isCheckmate()) return { cp: pos.turn === 'white' ? -10000 : 10000, label: pos.turn === 'white' ? '0-1' : '1-0' };
    return { cp: 0, label: '½' };
  }

  // ----- move list -----
  function renderMoves() {
    const rows: HTMLElement[] = [];
    let row: HTMLElement | null = null;
    main.sans.forEach((san, i) => {
      const { num, white } = main.moveNumber(i);
      if (white || !row) { row = h('div.mrow', null, h('span.mnum', null, num + '.')); if (!white) row.append(h('span.mv.empty', null, '…')); rows.push(row); }
      const rv = reviews[i];
      const c = rv ? CLS[rv.cls] : null;
      row.append(h('button.mv', {
        type: 'button', class: !cur.inVar && cur.ply === i + 1 ? 'cur' : '', onclick: () => { stopPlay(); cur = { inVar: false, ply: i + 1 }; update(); },
        title: c ? t(c.label) : undefined,
      }, san, c && !['best', 'excellent', 'good'].includes(rv!.cls) ? h('span.badge', { style: { background: c.color } }, c.sym) : null));
    });
    moveList.replaceChildren(...rows);
    if (!rows.length) moveList.append(h('p.muted.small.empty-moves', null, t('Play moves on the board, paste a PGN or FEN below, or finish a game and press Game review.')));
    scrollInside(moveList, moveList.querySelector('.cur'));
    varBox.replaceChildren();
    if (vari) {
      const vg = vari.game;
      const items: HTMLElement[] = [];
      vg.sans.forEach((san, i) => {
        const { num, white } = vg.moveNumber(i);
        if (white || i === 0) items.push(h('span.mnum', null, num + (white ? '.' : '…')));
        items.push(h('button.mv', { type: 'button', class: cur.inVar && cur.ply === i + 1 ? 'cur' : '', onclick: () => { cur = { inVar: true, ply: i + 1 }; update(); } }, san));
      });
      varBox.append(h('div.var-head', null, h('b', null, t('Variation')), btn(t('Back to game'), () => { cur = { inVar: false, ply: vari!.from }; vari = null; update(); }, 'small')), h('div.var-moves', null, items));
    }
  }

  // ----- review -----
  async function runReview(depth: number) {
    if (reviewing || !variantInfo(main.variant).sf) return;
    if (!main.ply) { toast(t('No moves to review yet.')); return; }
    reviewing = true; engine.stop();
    vari = null; cur.inVar = false;
    const n = main.ply;
    evals = []; reviews = [];
    const bar = h('div.progress', null, h('div'));
    summary.replaceChildren(h('div.review-progress', null, h('b', null, t('Reviewing game')), bar, btn(t('Cancel'), () => { reviewing = false; engine.stop(); }, 'small')));
    renderEngine();
    const book = await openingIndex().catch(() => new Map<string, Opening>());
    for (let i = 0; i <= n; i++) {
      if (!alive || !reviewing) break;
      const pos = main.positions[i];
      const term = terminalEval(pos);
      if (term) { evals[i] = { cp: term.cp, lines: [], terminal: true }; }
      else {
        const r = await engine.analyse({ fen: fenOf(pos), depth, multipv: 2, chess960: main.variant === 'chess960' }, false);
        if (!r) break;
        evals[i] = { cp: whiteCp(r.lines[0], pos.turn), best: r.lines[0]?.pv[0] || r.bestmove, second: r.lines[1] ? whiteCp(r.lines[1], pos.turn) : undefined, lines: r.lines };
      }
      (bar.firstChild as HTMLElement).style.width = Math.round(((i + 1) / (n + 1)) * 100) + '%';
      if (i % 4 === 0) { renderGraph(); }
    }
    const complete = reviewing && alive && evals.length === n + 1;
    reviewing = false;
    if (!alive) return;
    if (!complete) { summary.replaceChildren(); evals = []; update(); toast(t('Review cancelled')); return; }
    // classify
    for (let i = 0; i < n; i++) reviews[i] = classify(i, book);
    if (input.gameId) {
      const plies: number[] = []; let wb = 0, bb = 0;
      reviews.forEach((r, i) => { if (r?.cls === 'brilliant') { plies.push(i + 1); if (main.positions[i].turn === 'white') wb++; else bb++; } });
      const gid = input.gameId;
      saveReview(gid, { white: wb, black: bb, plies }).then(ok => { if (ok) dropQueued(gid); });
    }
    reviewed = true;
    cur = { inVar: false, ply: Math.min(cur.ply, main.ply) };
    renderSummary();
    update();
  }

  function classify(i: number, book: Map<string, Opening>): MoveReview {
    const prev = main.positions[i], next = main.positions[i + 1], m = main.moves[i];
    const mover = prev.turn;
    const sign = mover === 'white' ? 1 : -1;
    const eb = evals[i]!, ea = evals[i + 1]!;
    const before = winPct(sign * eb.cp), after = winPct(sign * ea.cp);
    const loss = Math.max(0, before - after);
    const acc = Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * loss) - 3.1669));
    const bestUci = eb.best;
    const bestMove = bestUci ? uciToMove(prev, bestUci) : undefined;
    const bestSan = bestMove ? pvToSan(prev, [bestUci!], 1).replace(/^\d+\.+\s*/, '') : undefined;
    const played = main.ucis[i];
    const isBest = !!bestMove && fenOf(bestPlay(prev, bestMove)) === fenOf(next);
    const res: MoveReview = { cls: 'good', loss, acc, bestSan, bestUci };
    const o = book.get(fenOf(next).split(' ').slice(0, 4).join(' '));
    let legal = 0; for (const [, d] of prev.allDests()) legal += d.size();
    if (o && i < 40) { res.cls = 'book'; res.opening = o.name; return res; }
    if (legal === 1) { res.cls = 'forced'; return res; }
    const prevCls = i > 0 ? reviews[i - 1]?.cls : undefined;
    if (isBest || loss < 1) {
      res.cls = 'best';
      const second = eb.second !== undefined ? winPct(sign * eb.second) : null;
      if (isSacrifice(prev, m, next) && after >= 45 && before < 97 && loss < 2) res.cls = 'brilliant';
      else if (isBest && second !== null && before - second >= 18 && before < 92 && after > 35) res.cls = 'great';
      return res;
    }
    // same cut-offs as chess.com (expected points lost, in %)
    if (loss < 2) res.cls = 'excellent';
    else if (loss < 5) res.cls = 'good';
    else if (loss < 10) res.cls = 'inaccuracy';
    else if (loss < 20) res.cls = 'mistake';
    else res.cls = 'blunder';
    if ((prevCls === 'mistake' || prevCls === 'blunder') && loss >= 8 && before >= 60 && res.cls !== 'blunder') res.cls = 'miss';
    void played;
    return res;
  }

  function bestPlay(pos: Position, m: Move) { const p = pos.clone(); p.play(m); return p; }

  function isSacrifice(prev: Position, m: Move, next: Position): boolean {
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

  function renderSummary() {
    summary.replaceChildren();
    if (!reviewed) return;
    const stats = (color: Color) => {
      const idx = reviews.map((r, i) => ({ r, i })).filter(({ i }) => main.positions[i].turn === color);
      const accs = idx.map(({ r }) => r!.acc);
      const acc = accs.length ? accs.reduce((a, b) => a + b, 0) / accs.length : 0;
      const counts: Partial<Record<Cls, number>> = {};
      idx.forEach(({ r }) => { const k = r!.cls === 'forced' ? 'best' : r!.cls; counts[k] = (counts[k] || 0) + 1; });
      // like chess.com: book and forced moves say nothing about strength
      const rated = idx.filter(({ r }) => r!.cls !== 'book' && r!.cls !== 'forced');
      return { acc, counts, elo: gameElo(rated.map(({ r, i }) => ({ loss: r!.loss, cpl: cpLoss(i), ply: i }))) };
    };
    const w = stats('white'), b = stats('black');
    summary.append(h('div.sum-card', null,
      h('div.sum-head', null, h('div.acc', null, h('span.cdot.white'), h('b', null, names.white), h('div.accnum', null, w.acc.toFixed(1))), h('div.muted.small', null, t('Accuracy')), h('div.acc', null, h('span.cdot.black'), h('b', null, names.black), h('div.accnum', null, b.acc.toFixed(1)))),
      h('div.sum-elo', { title: t('Estimated from the accuracy of the moves played in this game') },
        h('div.game-elo', null, h('b', null, w.elo ? String(w.elo) : '–')), h('div.muted.small', null, t('Game rating')), h('div.game-elo', null, h('b', null, b.elo ? String(b.elo) : '–'))),
      h('div.sum-table', null, SUMMARY_ORDER.map(k => h('div.sum-row', null,
        h('span.n', null, String(w.counts[k] || 0)),
        h('span.lab', null, h('span.badge', { style: { background: CLS[k].color } }, CLS[k].sym), t(CLS[k].label)),
        h('span.n', null, String(b.counts[k] || 0)))))));
  }

  /** centipawn loss of move i from the mover's point of view, capped like Lichess */
  function cpLoss(i: number): number {
    const eb = evals[i], ea = evals[i + 1];
    if (!eb || !ea) return 0;
    const sign = main.positions[i].turn === 'white' ? 1 : -1;
    const cap = (v: number) => Math.max(-1000, Math.min(1000, v));
    return Math.max(0, cap(sign * eb.cp) - cap(sign * ea.cp));
  }

  /**
   * Game rating: performance estimate from how often the player made each kind of move
   * (best/excellent, inaccuracy, mistake, blunder) and the average centipawn loss, without book and forced moves.
   * Fitted on games between the site's Stockfish bots, full games and short ones; it knows that
   * opening moves are easier than later ones, so short games are not over-rated.
   */
  function gameElo(mv: { loss: number; cpl: number; ply: number }[]): number {
    const n = mv.length;
    if (n < 5) return 0;
    const rate = (f: (l: number) => boolean) => mv.filter(m => f(m.loss)).length / n;
    const la = Math.log(mv.reduce((a, m) => a + m.cpl, 0) / n + 5);
    const bl = rate(l => l >= 20), mi = rate(l => l >= 10 && l < 20), ia = rate(l => l >= 5 && l < 10), top = rate(l => l < 2);
    const early = mv.filter(m => m.ply < 24).length / n;
    const W = [4023.77, -764.72, 497.39, -263.13, -40.73, 935.73, -1318.4, 315.84, -253.93];
    const lin = W[0] + W[1] * la + W[2] * bl + W[3] * mi + W[4] * ia + W[5] * top + W[6] * early + W[7] * early * la + W[8] * early * top;
    const est = 1469 + 1.3 * (lin - 1469);
    return Math.round(Math.max(100, Math.min(3200, est)) / 10) * 10;
  }

  function renderGraph() {
    graph.replaceChildren();
    if (!evals.length || main.ply < 1) return;
    const n = main.ply;
    const W = 600, H = 90;
    const pts = evals.map((e, i) => e ? [i / n * W, H - winPct(e.cp) / 100 * H] : null).filter(Boolean) as number[][];
    if (pts.length < 2) return;
    const path = `M0,${H} ` + pts.map(p => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${pts[pts.length - 1][0].toFixed(1)},${H} Z`;
    let dots = '';
    reviews.forEach((r, i) => {
      if (!r || !['blunder', 'mistake', 'brilliant', 'great', 'miss'].includes(r.cls) || !evals[i + 1]) return;
      const x = (i + 1) / n * W, y = H - winPct(evals[i + 1]!.cp) / 100 * H;
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${CLS[r.cls].color}" stroke="#000" stroke-opacity=".3"/>`;
    });
    const cx = (cur.inVar ? (vari?.from ?? 0) : cur.ply) / n * W;
    const svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${t('Evaluation graph')}"><rect width="${W}" height="${H}" class="g-black"/><path d="${path}" class="g-white"/><line x1="0" x2="${W}" y1="${H / 2}" y2="${H / 2}" class="g-mid"/><line x1="${cx}" x2="${cx}" y1="0" y2="${H}" class="g-cur"/>${dots}</svg>`;
    const el = h('div.graph-svg', { html: svg, title: t('Click to jump to a move') });
    el.addEventListener('click', (e) => {
      const r = el.getBoundingClientRect();
      const ply = Math.round((e.clientX - r.left) / r.width * n);
      cur = { inVar: false, ply: Math.max(0, Math.min(n, ply)) }; update();
    });
    graph.append(el);
  }

  function renderExplain() {
    explain.replaceChildren();
    if (cur.inVar || cur.ply === 0) return;
    const rv = reviews[cur.ply - 1];
    if (!rv) return;
    const san = main.sans[cur.ply - 1];
    const c = CLS[rv.cls];
    const e = evals[cur.ply];
    let text = '';
    switch (rv.cls) {
      case 'book': text = t('{0} is a book move.', san) + (rv.opening ? ' ' + rv.opening : ''); break;
      case 'brilliant': text = t('{0} is brilliant! A strong sacrifice.', san); break;
      case 'great': text = t('{0} is a great move — the only good option here.', san); break;
      case 'best': text = t('{0} is the best move.', san); break;
      case 'forced': text = t('{0} was the only legal move.', san); break;
      case 'excellent': text = t('{0} is excellent. Best was {1}.', san, rv.bestSan || ''); break;
      case 'good': text = t('{0} is good. Best was {1}.', san, rv.bestSan || ''); break;
      case 'miss': text = t('{0} misses the chance to punish your opponent\'s error. Best was {1}.', san, rv.bestSan || ''); break;
      default: text = rv.cls === 'inaccuracy' ? t('{0} is an inaccuracy. Best was {1}.', san, rv.bestSan || '') : rv.cls === 'mistake' ? t('{0} is a mistake. Best was {1}.', san, rv.bestSan || '') : t('{0} is a blunder. Best was {1}.', san, rv.bestSan || '');
    }
    explain.append(h('div.explain-card', { style: { borderColor: c.color } },
      h('span.badge.big', { style: { background: c.color } }, c.sym),
      h('div', null, h('b', { style: { color: c.color } }, t(c.label)), h('div', null, text)),
      e ? h('span.score', null, scoreText(e.cp)) : null,
      rv.bestUci && !['best', 'book', 'brilliant', 'great', 'forced'].includes(rv.cls) ? btn(t('Show best'), () => {
        const prev = main.positions[cur.ply - 1];
        const m = uciToMove(prev, rv.bestUci!);
        if (m) { cur = { inVar: false, ply: cur.ply - 1 }; userMove(m); }
      }, 'small') : null));
  }

  function scoreText(cp: number) {
    if (Math.abs(cp) >= 9000) return (cp > 0 ? '#' : '#-') + Math.max(0, 10000 - Math.abs(cp));
    const v = cp / 100; return (v > 0 ? '+' : '') + v.toFixed(1);
  }

  function renderTools() {
    const pgnArea = h('textarea.pgn-in', { placeholder: t('Paste a PGN or FEN here…'), rows: 3, 'aria-label': t('PGN or FEN') }) as HTMLTextAreaElement;
    const hist = loadRaw('history', [] as any[]);
    toolsBox.replaceChildren(
      variantInfo(main.variant).sf ? h('div.row.wrap', null,
        btn(h('span', null, icon('chart'), reviewed ? t('Review again') : t('Game review')), () => runReview(14), 'primary'),
        btn(t('Deep review'), () => runReview(18), '', t('Slower, more accurate'))) : '',
      h('details.load', null, h('summary', null, t('Load PGN / FEN, export')),
        pgnArea,
        h('div.row.wrap', null,
          btn(t('Load'), () => loadText(pgnArea.value)),
          btn(h('span', null, icon('copy'), t('Copy PGN')), () => copyText(main.pgn({ White: names.white, Black: names.black }))),
          btn(h('span', null, icon('copy'), t('Copy FEN')), () => copyText(fenOf(curPos()))),
          h('a.btn', { href: '#/editor/' + encodeURIComponent(fenOf(curPos())) }, icon('edit'), t('Edit position')))),
      hist.length ? h('details.load', null, h('summary', null, t('Your recent games')),
        h('div.hist', null, hist.map((g: any) => h('button.hist-item', {
          type: 'button', onclick: () => {
            setAnalysisInput({ variant: g.variant, startFen: g.fen, ucis: g.ucis, white: g.w, black: g.b, orientation: g.my || 'white' });
            route();
          },
        }, h('b', null, `${g.w} – ${g.b}`), h('span.muted.small', null, ` ${t(variantInfo(g.variant).name)} · ${g.r === 'draw' ? '½–½' : g.r === 'white' ? '1–0' : g.r === 'black' ? '0–1' : '*'} · ${t('{0} moves', Math.ceil(g.ucis.length / 2))} · ${new Date(g.d).toLocaleDateString()}`), g.hints ? h('span.hint-badge', { title: t('Hints used: {0}', g.hints) }, t('Hints used: {0}', g.hints)) : null)))) : '');
  }

  const route = () => go('analysis');

  function loadText(text: string) {
    text = text.trim();
    if (!text) return;
    // FEN?
    if (/^[rnbqkpRNBQKP1-8]+(\/[rnbqkpRNBQKP1-8]+){7}/.test(text)) {
      const fen = text.split('\n')[0].trim();
      const err = positionError(fen);
      if (err) { toast(err); return; }
      const p = posFromFen(fen)!;
      setAnalysisInput({ variant: 'standard', startFen: fenOf(p), ucis: [] });
      route(); return;
    }
    try {
      const games = parsePgn(text);
      const g = games[0];
      if (!g) throw new Error('No game found');
      const variantH = (g.headers.get('Variant') || '').toLowerCase();
      const variant: VariantKey = variantH.includes('960') ? 'chess960' : 'standard';
      if (variantH && !variantH.includes('960') && variantH !== 'standard' && variantH !== 'from position') { toast(t('Only standard and Chess960 games can be analyzed.')); return; }
      const sp = startingPosition(g.headers);
      if (sp.isErr) throw new Error('Bad starting position');
      const pos = sp.value;
      const startFen = makeFen(pos.toSetup());
      const ucis: string[] = [];
      for (const node of g.moves.mainline()) {
        const mv = parseSan(pos, node.san);
        if (!mv) break;
        const t = new Game(variant, fenOf(pos));
        t.play(mv);
        ucis.push(t.ucis[0]);
        pos.play(mv);
      }
      setAnalysisInput({ variant, startFen, ucis, white: g.headers.get('White') || 'White', black: g.headers.get('Black') || 'Black' });
      route();
    } catch (e: any) { toast(t('Could not read that PGN: ') + (e?.message || 'invalid')); }
  }

  function update() {
    const g = curGame();
    const pos = curPos();
    const last = cur.ply > 0 ? moveSquares(g.positions[cur.ply - 1], g.moves[cur.ply - 1]) : null;
    board.setPosition(pos, last, true);
    renderMoves(); renderEngine(); renderExplain(); renderGraph();
    updateOpening();
    if (engineOn && !reviewing) runLive();
  }

  async function updateOpening() {
    if (main.variant !== 'standard') { openingEl.textContent = ''; return; }
    const idx = await openingIndex().catch(() => null);
    if (!idx || !alive) return;
    // deepest named position along the main line up to current ply
    const upto = cur.inVar ? vari!.from : cur.ply;
    let name = '';
    for (let i = 0; i <= upto && i <= 40; i++) {
      const o = idx.get(fenOf(main.positions[i]).split(' ').slice(0, 4).join(' '));
      if (o) name = `${o.eco} · ${o.name}`;
    }
    openingName = name;
    openingEl.textContent = openingName;
  }

  const keys = (e: KeyboardEvent) => {
    const t = (e.target as HTMLElement).tagName;
    if (t === 'INPUT' || t === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') { stopPlay(); step(-1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { stopPlay(); step(1); e.preventDefault(); }
    else if (e.key === 'ArrowUp' || e.key === 'Home') { stopPlay(); goto(0); e.preventDefault(); }
    else if (e.key === 'ArrowDown' || e.key === 'End') { stopPlay(); goto(Infinity); e.preventDefault(); }
    else if (e.key === ' ') { togglePlay(); e.preventDefault(); }
    else if (e.key === 'f') board.flip();
  };
  document.addEventListener('keydown', keys);

  const unlock = engineLock(root, (locked) => { if (locked) { reviewing = false; engineOn = false; engine.stop(); liveLines = []; update(); } });
  function cleanup() {
    stopPlay();
    unlock();
    alive = false; reviewing = false;
    engine.stop();
    document.removeEventListener('keydown', keys);
    board.destroy();
  }

  renderTools();
  update();
  if (input.autoReview && variantInfo(main.variant).sf && main.ply) { input.autoReview = false; runReview(14); }
  return cleanup;
}

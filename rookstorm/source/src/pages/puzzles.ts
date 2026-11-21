import { h, icon, btn, iconBtn, toast, sound, loadRaw, save } from '../ui';
import { Board } from '../board';
import { Game } from '../game';
import { posFromFen, uciToMove, fenOf, moveSquares, Position, Move, Color } from '../chess';
import { setAnalysisInput } from './analysis';
import { go } from '../main';
import { t } from '../i18n';

type Raw = [string, string, string, number, string];
interface Puzzle { id: string; fen: string; moves: string[]; rating: number; themes: string[] }
interface PState {
  rating: number; games: number; wins: number; streak: number; bestStreak: number; bestRun: number;
  seen: string[]; hist: { id: string; r: number; win: boolean; d: number; pr: number }[]; theme: string; mode: 'rated' | 'streak'; autoNext: boolean;
}
const DEF: PState = { rating: 1500, games: 0, wins: 0, streak: 0, bestStreak: 0, bestRun: 0, seen: [], hist: [], theme: 'mix', mode: 'rated', autoNext: false };
const state: PState = { ...DEF, ...loadRaw('puzzle', DEF) };
const persist = () => save('puzzle', state);
export const puzzleRating = () => state.rating;

export const THEMES: [string, string][] = [
  ['mix', 'Healthy mix'], ['mateIn1', 'Mate in 1'], ['mateIn2', 'Mate in 2'], ['mateIn3', 'Mate in 3'], ['mate', 'Any checkmate'],
  ['fork', 'Fork'], ['pin', 'Pin'], ['skewer', 'Skewer'], ['discoveredAttack', 'Discovered attack'], ['doubleCheck', 'Double check'],
  ['sacrifice', 'Sacrifice'], ['deflection', 'Deflection'], ['attraction', 'Attraction'], ['hangingPiece', 'Hanging piece'], ['trappedPiece', 'Trapped piece'],
  ['backRankMate', 'Back-rank mate'], ['smotheredMate', 'Smothered mate'], ['kingsideAttack', 'Kingside attack'], ['quietMove', 'Quiet move'], ['defensiveMove', 'Defensive move'],
  ['promotion', 'Promotion'], ['advancedPawn', 'Advanced pawn'], ['endgame', 'Endgame'], ['rookEndgame', 'Rook endgame'], ['pawnEndgame', 'Pawn endgame'],
  ['queenEndgame', 'Queen endgame'], ['knightEndgame', 'Knight endgame'], ['bishopEndgame', 'Bishop endgame'], ['zugzwang', 'Zugzwang'], ['crushing', 'Crushing'], ['equality', 'Equalize'],
];
const themeName = (k: string) => t(THEMES.find(x => x[0] === k)?.[1] || k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()));

let bandIndex: Promise<Record<string, number>> | null = null;
const bands = new Map<number, Promise<Puzzle[]>>();
function getIndex() {
  if (!bandIndex) { bandIndex = fetch(new URL('data/puzzles/index.json', document.baseURI).href).then(r => r.json()); bandIndex.catch(() => { bandIndex = null; }); }
  return bandIndex;
}
function getBand(b: number): Promise<Puzzle[]> {
  if (!bands.has(b)) {
    const p = fetch(new URL(`data/puzzles/r${b}.json`, document.baseURI).href).then(r => r.json())
      .then((rows: Raw[]) => rows.map(([id, fen, moves, rating, themes]) => ({ id, fen, moves: moves.split(' '), rating, themes: themes ? themes.split(' ') : [] })));
    p.catch(() => bands.delete(b));
    bands.set(b, p);
  }
  return bands.get(b)!;
}

async function pickPuzzle(target: number, theme: string, exclude: Set<string>): Promise<Puzzle | null> {
  const idx = await getIndex();
  const all = Object.keys(idx).map(Number).sort((a, b) => a - b);
  const want = target + (Math.random() * 200 - 100);
  const order = all.slice().sort((a, b) => Math.abs(a + 50 - want) - Math.abs(b + 50 - want));
  for (const b of order.slice(0, theme === 'mix' ? 4 : 10)) {
    const list = await getBand(b);
    const ok = list.filter(p => !exclude.has(p.id) && (theme === 'mix' || p.themes.includes(theme)));
    if (ok.length) return ok[Math.floor(Math.random() * ok.length)];
  }
  // Everything seen: allow repeats
  if (exclude.size) return pickPuzzle(target, theme, new Set());
  return null;
}

export function puzzlesPage(root: HTMLElement) {
  let pz: Puzzle | null = null;
  let positions: Position[] = [];
  let moves: Move[] = [];
  let step = 0;             // index in pz.moves of the next expected move
  let failed = false, done = false, rated = false, hintUsed = 0, solutionShown = false;
  let viewPly: number | null = null;
  let alive = true;
  let streakRun = 0;
  let streakOver = false;
  let busy = false;

  const board = new Board({ onMove: (m) => userMove(m) });
  const info = h('div.pz-info');
  const feedback = h('div.pz-feedback');
  const controls = h('div.pz-controls');
  const stats = h('div.pz-stats');
  const topBar = h('div.pz-top');

  root.append(h('div.game-layout.puzzles', null,
    h('div.board-col', null, topBar, board.el),
    h('aside.side.card', null, stats, info, feedback, controls,
      h('div.navrow', null, iconBtn('prev', t('Back'), () => stepView(-1)), iconBtn('next', t('Forward'), () => stepView(1)), iconBtn('flip', t('Flip'), () => board.flip())))));

  const userColor = (): Color => (positions[0] ? (positions[0].turn === 'white' ? 'black' : 'white') : 'white');

  async function next() {
    if (busy) return;
    busy = true;
    feedback.replaceChildren(h('div.spinner-row', null, h('span.spinner'), t('Loading puzzle…')));
    const target = state.mode === 'streak' ? 500 + streakRun * 60 : state.rating;
    let p: Puzzle | null = null;
    try { p = await pickPuzzle(target, state.mode === 'streak' ? 'mix' : state.theme, new Set(state.seen)); }
    catch { feedback.replaceChildren(h('p.err', null, t('Could not load puzzles. If you are offline, open the site once while online so they can be saved.'))); busy = false; return; }
    busy = false;
    if (!alive || !p) return;
    load(p);
  }

  function load(p: Puzzle) {
    pz = p; failed = false; done = false; rated = false; hintUsed = 0; solutionShown = false; viewPly = null;
    const start = posFromFen(p.fen);
    if (!start) { next(); return; }
    positions = [start]; moves = []; step = 0;
    board.movableColor = null;
    board.setPosition(start, null, false);
    const opp = start.turn;
    board.setOrientation(opp === 'white' ? 'black' : 'white');
    board.arrows([]);
    render();
    setTimeout(() => { if (alive && pz === p) { playSolutionMove(); board.movableColor = userColor(); sync(); render(); } }, 600);
  }

  function playSolutionMove() {
    const pos = positions[positions.length - 1];
    const m = uciToMove(pos, pz!.moves[step]);
    if (!m) return;
    const next = pos.clone(); next.play(m);
    positions.push(next); moves.push(m); step++;
    board.showMove(pos, m, next, false);
  }

  function sync() {
    const i = viewPly ?? positions.length - 1;
    const pos = positions[i];
    const last = i > 0 ? moveSquares(positions[i - 1], moves[i - 1]) : null;
    const canMove = viewPly === null && !done && pos.turn === userColor() && step < (pz?.moves.length || 0);
    board.setPosition(pos, last, canMove);
  }

  function stepView(d: number) {
    if (!positions.length) return;
    const i = Math.max(0, Math.min(positions.length - 1, (viewPly ?? positions.length - 1) + d));
    viewPly = i === positions.length - 1 ? null : i;
    sync();
  }

  function userMove(m: Move) {
    if (!pz || done) return;
    const pos = positions[positions.length - 1];
    const expected = uciToMove(pos, pz.moves[step]);
    const played = pos.clone(); played.play(m);
    const exp = expected ? (() => { const c = pos.clone(); c.play(expected); return c; })() : null;
    const correct = (exp && fenOf(exp) === fenOf(played)) || played.isCheckmate();
    if (!correct) {
      board.showMove(pos, m, played, false);
      sound.bad();
      if (!failed) { failed = true; finishRating(false); }
      feedback.replaceChildren(h('div.fb.bad', null, h('b', null, t('✕ Not the move')), h('span', null, state.mode === 'streak' ? t('Streak over!') : t('Try again, or view the solution.'))));
      if (state.mode === 'streak') { streakOver = true; done = true; }
      setTimeout(() => { if (alive && pz) { sync(); render(); } }, 700);
      return;
    }
    positions.push(played); moves.push(m); step++;
    board.showMove(pos, m, played, false);
    if (step >= pz.moves.length || played.isCheckmate()) { solved(); return; }
    feedback.replaceChildren(h('div.fb.good', null, h('b', null, t('✓ Best move!')), h('span', null, t('Keep going…'))));
    setTimeout(() => {
      if (!alive || pz === null || done) return;
      playSolutionMove();
      sync(); render();
    }, 380);
  }

  function solved() {
    done = true;
    sound.good();
    if (!failed) {
      finishRating(true);
      if (state.mode === 'streak') { streakRun++; state.bestRun = Math.max(state.bestRun, streakRun); persist(); }
    }
    sync(); render();
    // solved after a mistake or hint: stay a few seconds so the player can see it, then move on
    const p = pz;
    if (state.autoNext && (!failed || state.mode === 'rated')) setTimeout(() => { if (alive && done && pz === p && !solutionShown) next(); }, failed ? 3000 : 1100);
  }

  function finishRating(win: boolean) {
    if (rated || !pz) return;
    rated = true;
    state.seen.push(pz.id);
    if (state.seen.length > 6000) state.seen = state.seen.slice(-6000);
    if (state.mode === 'streak') { persist(); return; }
    const k = state.games < 20 ? 48 : state.games < 60 ? 32 : 20;
    const exp = 1 / (1 + Math.pow(10, (pz.rating - state.rating) / 400));
    const delta = Math.round(k * ((win && !hintUsed ? 1 : 0) - exp));
    state.rating = Math.max(400, state.rating + delta);
    state.games++;
    if (win && !hintUsed) { state.wins++; state.streak++; state.bestStreak = Math.max(state.bestStreak, state.streak); } else state.streak = 0;
    state.hist.push({ id: pz.id, r: state.rating, win: win && !hintUsed, d: Date.now(), pr: pz.rating });
    if (state.hist.length > 200) state.hist = state.hist.slice(-200);
    persist();
    lastDelta = delta;
  }
  let lastDelta = 0;

  function hint() {
    if (!pz || done) return;
    const pos = positions[positions.length - 1];
    const m = uciToMove(pos, pz.moves[step]);
    if (!m) return;
    hintUsed++;
    const s = moveSquares(pos, m)!;
    if (hintUsed === 1) board.arrows([{ orig: s[0] as any, brush: 'green' }]);
    else board.arrows([{ orig: s[0] as any, dest: s[1] as any, brush: 'green' }]);
    if (!failed) { failed = true; finishRating(false); }
    render();
  }

  function showSolution() {
    if (!pz) return;
    if (!failed) { failed = true; finishRating(false); }
    done = true; solutionShown = true;
    const run = () => {
      if (!alive || !pz || step >= pz.moves.length) { sync(); render(); return; }
      playSolutionMove(); sync(); render();
      setTimeout(run, 650);
    };
    viewPly = null;
    run();
  }

  function retry() { if (pz) { const p = pz; const wasFailed = failed; load(p); failed = wasFailed; rated = true; render(); } }

  function render() {
    // stats
    const recent = state.hist.slice(-30);
    const spark = recent.length > 1 ? sparkline(recent.map(x => x.r)) : '';
    stats.replaceChildren(
      h('div.pz-mode.seg', null,
        h('button', { type: 'button', class: state.mode === 'rated' ? 'on' : '', onclick: () => { if (state.mode !== 'rated') { state.mode = 'rated'; persist(); next(); } render(); } }, t('Rated')),
        h('button', { type: 'button', class: state.mode === 'streak' ? 'on' : '', onclick: () => { if (state.mode !== 'streak') { state.mode = 'streak'; streakRun = 0; streakOver = false; persist(); next(); } render(); } }, icon('fire'), t('Streak'))),
      state.mode === 'rated'
        ? h('div.pz-rating', null,
          h('div', null, h('div.muted.small', null, t('Puzzle rating')), h('div.rating-num', null, String(Math.round(state.rating)), rated && lastDelta ? h('span.delta', { class: lastDelta > 0 ? 'up' : 'down' }, (lastDelta > 0 ? '+' : '') + lastDelta) : null)),
          h('div.spark', { html: spark }),
          h('div.mini-stats', null, h('div', null, h('b', null, String(state.games)), h('span', null, t('played'))), h('div', null, h('b', null, state.games ? Math.round(state.wins / state.games * 100) + '%' : '–'), h('span', null, t('solved'))), h('div', null, h('b', null, String(state.streak)), h('span', null, t('streak')))))
        : h('div.pz-rating', null, h('div', null, h('div.muted.small', null, t('Current streak')), h('div.rating-num', null, String(streakRun))), h('div.mini-stats', null, h('div', null, h('b', null, String(state.bestRun)), h('span', null, t('best'))))),
      state.mode === 'rated' ? h('label.field', null, h('span.lbl', null, t('Theme')), h('select', { onchange: (e: any) => { state.theme = e.target.value; persist(); next(); } }, THEMES.map(([k, n]) => h('option', { value: k, selected: state.theme === k }, t(n))))) : '');

    if (!pz) { info.replaceChildren(); return; }
    const col = userColor();
    topBar.replaceChildren(h('div.pz-turn', null, h('span.cdot.' + col), done ? (solutionShown || streakOver ? t('Puzzle failed') : t('Puzzle solved!')) : (col === 'white' ? t('Find the best move for White') : t('Find the best move for Black'))));
    info.replaceChildren(done || failed
      ? h('div.pz-meta', null, h('div', null, t('Puzzle') + ' ', h('b', null, '#' + pz.id), ' · ' + t('rated') + ' ', h('b', null, String(pz.rating))), h('div.tags', null, pz.themes.slice(0, 6).map(th => h('span.tag', null, themeName(th)))))
      : h('div.pz-meta.muted.small', null, state.mode === 'rated' ? (state.theme === 'mix' ? t('Rated puzzle') : themeName(state.theme)) : t('Streak puzzle {0}', streakRun + 1)));
    if (done) {
      const bad = solutionShown || streakOver;
      feedback.replaceChildren(h('div.fb', { class: bad ? 'bad' : 'good' },
        h('b', null, streakOver ? t('Streak over · {0} solved', streakRun) : solutionShown ? t('Solution shown') : '✓ ' + t('Correct!')),
        h('span', null, bad ? '' : failed ? t('Solved, but not on the first try, so it counts as a miss for your rating.') : t('Well played.'))));
    }
    else if (!failed && step <= 1) feedback.replaceChildren();
    const c: HTMLElement[] = [];
    if (!done) {
      c.push(btn(h('span', null, icon('bulb'), t('Hint')), hint, '', t('Hints count as a failed puzzle for rating')));
      c.push(btn(h('span', null, icon('eye'), t('Solution')), showSolution));
    } else {
      if (streakOver) c.push(btn(h('span', null, icon('fire'), t('New streak')), () => { streakRun = 0; streakOver = false; next(); }, 'primary'));
      else c.push(btn(h('span', null, icon('next'), t('Next puzzle')), next, 'primary'));
      if (!streakOver) c.push(btn(h('span', null, icon('retry'), t('Retry')), retry));
      c.push(btn(h('span', null, icon('chart'), t('Analyze')), () => {
        const g = new Game('standard', pz!.fen); for (const u of pz!.moves) if (!g.playUci(u)) break;
        setAnalysisInput({ variant: 'standard', startFen: pz!.fen, ucis: g.ucis.slice(), orientation: userColor(), ply: 1 });
        go('analysis');
      }));
    }
    if (state.mode === 'rated') c.push(h('label.check.small', null, h('input', { type: 'checkbox', checked: state.autoNext, onchange: (e: any) => { state.autoNext = e.target.checked; persist(); } }), t(t(t('Auto-next')))));
    controls.replaceChildren(...c);
  }

  function sparkline(vals: number[]) {
    const W = 120, H = 32;
    const min = Math.min(...vals) - 10, max = Math.max(...vals) + 10;
    const pts = vals.map((v, i) => `${(i / (vals.length - 1) * W).toFixed(1)},${(H - (v - min) / (max - min) * H).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-label="Rating trend"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/></svg>`;
  }

  const keys = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return;
    if (e.key === 'ArrowLeft') stepView(-1);
    else if (e.key === 'ArrowRight') stepView(1);
    else if (e.key === 'Enter' && done) next();
  };
  document.addEventListener('keydown', keys);

  render();
  next();
  void toast;
  return () => { alive = false; document.removeEventListener('keydown', keys); board.destroy(); };
}

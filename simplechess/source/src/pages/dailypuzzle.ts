/**
 * Daily puzzle (new every day at 00:00 UTC) and weekly puzzle (new every Monday 00:00 UTC).
 *  - Daily: the hardest puzzles (rated 2750+), no hints, the solution appears when the day is over.
 *  - Weekly: the very hardest puzzles in the collection (rated ~2900–3000 with the longest lines), no hints and
 *    only one try: one wrong move ends it until the week is over.
 *  - Only the first result on the puzzle's own day / week counts (and is shown on the profile).
 *    Past puzzles from the calendar are practice: retry freely and view the solution.
 */
import { h, icon, btn, iconBtn, sound, loadRaw, save, toast } from '../ui';
import { Board } from '../board';
import { Game } from '../game';
import { posFromFen, uciToMove, fenOf, moveSquares, Position, Move, Color } from '../chess';
import { setAnalysisInput } from './analysis';
import { go } from '../main';
import { t, lang } from '../i18n';
import { me, rpc, accountsEnabled } from '../account';
import { getBand, Puzzle } from './puzzles';

export type Kind = 'daily' | 'weekly';
const DAY = 86400000;
/** first daily puzzle (#1) and first weekly puzzle (#1, a Monday) */
const DAILY_EPOCH = Math.floor(Date.UTC(2026, 10, 1) / DAY);
const WEEKLY_EPOCH = Math.floor(Date.UTC(2026, 9, 26) / DAY);

export const todayNum = () => Math.floor(Date.now() / DAY);
export const weekStart = (d: number) => d - ((d + 3) % 7); // day 0 (1970-01-01) was a Thursday
export const isoDay = (d: number) => new Date(d * DAY).toISOString().slice(0, 10);
export const dayOf = (iso: string) => Math.floor(Date.parse(iso + 'T00:00:00Z') / DAY);
export const currentPeriod = (k: Kind) => (k === 'daily' ? todayNum() : weekStart(todayNum()));
const firstPeriod = (k: Kind) => (k === 'daily' ? DAILY_EPOCH : WEEKLY_EPOCH);
const step = (k: Kind) => (k === 'daily' ? 1 : 7);
export const periodNumber = (k: Kind, d: number) => Math.floor((d - firstPeriod(k)) / step(k)) + 1;
/** ms until the next daily / weekly puzzle */
export const msLeft = (k: Kind) => (currentPeriod(k) + step(k)) * DAY - Date.now();
const fmtDay = (d: number, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(d * DAY).toLocaleDateString(lang, { ...opts, timeZone: 'UTC' });

export function countdown(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60000)), hr = Math.floor(m / 60), d = Math.floor(hr / 24);
  if (d >= 1) return t('{0} d {1} h', d, hr % 24);
  if (hr >= 1) return t('{0} h {1} min', hr, m % 60);
  return t('{0} min', Math.max(1, m));
}

// ---------------------------------------------------------------- which puzzle belongs to which day
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
function shuffled<T>(arr: T[], seed: number): T[] { const a = arr.slice(), r = rng(seed); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
let poolsP: Promise<{ daily: Puzzle[]; weekly: Puzzle[] }> | null = null;
function pools() {
  if (!poolsP) {
    poolsP = Promise.all([2700, 2800, 2900, 3000].map(getBand)).then(([b27, b28, b29, b30]) => {
      const byId = (a: Puzzle, b: Puzzle) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
      const strong = [...b28, ...b29, ...b30];
      // weekly: the hardest of all — highest rating, longest solution
      const score = (p: Puzzle) => p.rating + 30 * p.moves.length;
      const weekly = strong.slice().sort((a, b) => score(b) - score(a) || byId(a, b)).slice(0, 104);
      const wIds = new Set(weekly.map(p => p.id));
      const daily = [...b27.filter(p => p.rating >= 2750), ...strong.filter(p => !wIds.has(p.id))].sort(byId);
      return { daily: shuffled(daily, 20261101), weekly: shuffled(weekly.sort(byId), 20261026) };
    });
    poolsP.catch(() => { poolsP = null; });
  }
  return poolsP;
}
export async function puzzleFor(k: Kind, d: number): Promise<Puzzle> {
  const p = await pools();
  const list = p[k];
  const n = periodNumber(k, d) - 1;
  return list[((n % list.length) + list.length) % list.length];
}

// ---------------------------------------------------------------- results (this device, plus the account)
interface Result { solved: boolean; ms?: number; at: number }
const KEY = 'pdays';
const results = (): Record<string, Result> => loadRaw(KEY, {} as Record<string, Result>);
const practice = (): Record<string, boolean> => loadRaw('pdaysPractice', {} as Record<string, boolean>);
const rkey = (k: Kind, d: number) => `${k}:${isoDay(d)}`;
export const resultOf = (k: Kind, d: number): Result | undefined => results()[rkey(k, d)];
export const practiced = (k: Kind, d: number) => !!practice()[rkey(k, d)];
function storeResult(k: Kind, d: number, r: Result) { const all = results(); if (all[rkey(k, d)]) return; all[rkey(k, d)] = r; save(KEY, all); }
/** results saved on the account (another device) count as played here too */
export async function syncResults(): Promise<void> {
  if (!accountsEnabled() || !me) return;
  try {
    const r = await rpc<any>('puzzle_days_of', { p_username: me.username });
    const all = results(); let changed = false;
    for (const x of r?.recent || []) { const k = `${x.kind}:${x.period}`; if (!all[k]) { all[k] = { solved: x.solved, ms: x.ms ?? undefined, at: 0 }; changed = true; } }
    if (changed) save(KEY, all);
  } catch { /* add-on not installed or offline */ }
}

// ---------------------------------------------------------------- the puzzle page
export function puzzleDayPage(k: Kind, root: HTMLElement, arg?: string) {
  const cur = currentPeriod(k);
  let d = arg && /^\d{4}-\d{2}-\d{2}$/.test(arg) ? dayOf(arg) : cur;
  if (k === 'weekly') d = weekStart(d);
  if (d > cur || d < firstPeriod(k)) d = cur;
  const live = d === cur; // today's / this week's puzzle: counts, no hints, no solution
  let pz: Puzzle | null = null;
  let positions: Position[] = [], moves: Move[] = [];
  let at = 0, failed = false, done = false, locked = false, solutionShown = false, viewPly: number | null = null;
  let started = 0;
  let alive = true;

  const board = new Board({ onMove: (m) => userMove(m) });
  board.movableColor = null;
  const top = h('div.pz-top');
  const info = h('div.pz-info');
  const feedback = h('div.pz-feedback');
  const controls = h('div.pz-controls');
  const head = h('div.pday-head');
  root.append(h('div.game-layout.puzzles.pday', null,
    h('div.board-col', null, top, board.el),
    h('aside.side.card', null, head, info, feedback, controls,
      h('div.navrow', null, iconBtn('prev', t('Back'), () => stepView(-1)), iconBtn('next', t('Forward'), () => stepView(1)), iconBtn('flip', t('Flip'), () => board.flip())))));

  const userColor = (): Color => (positions[0] ? (positions[0].turn === 'white' ? 'black' : 'white') : 'white');
  const title = () => (k === 'daily' ? t('Daily puzzle') : t('Weekly puzzle'));
  const prior = () => resultOf(k, d);

  function load(p: Puzzle) {
    pz = p; at = 0; failed = false; done = false; solutionShown = false; viewPly = null;
    const start = posFromFen(p.fen)!;
    positions = [start]; moves = [];
    board.setOrientation(start.turn === 'white' ? 'black' : 'white');
    board.setPosition(start, null, false); board.arrows([]);
    // weekly, live, already tried: the puzzle stays locked until the week is over
    locked = live && k === 'weekly' && !!prior() && !prior()!.solved;
    render();
    if (locked) { autoplayFirst(); return; }
    setTimeout(() => { if (alive && pz === p) { autoplayFirst(); started = Date.now(); render(); } }, 600);
  }
  function autoplayFirst() { playSolutionMove(); board.movableColor = locked ? null : userColor(); sync(); }
  function playSolutionMove() {
    const pos = positions[positions.length - 1];
    const m = uciToMove(pos, pz!.moves[at]);
    if (!m) return;
    const next = pos.clone(); next.play(m);
    positions.push(next); moves.push(m); at++;
    board.showMove(pos, m, next, false);
  }
  function sync() {
    const i = viewPly ?? positions.length - 1;
    const pos = positions[i];
    const last = i > 0 ? moveSquares(positions[i - 1], moves[i - 1]) : null;
    const canMove = viewPly === null && !done && !locked && pos.turn === userColor() && at < (pz?.moves.length || 0);
    board.movableColor = canMove ? userColor() : null;
    board.setPosition(pos, last, canMove);
  }
  function stepView(dd: number) {
    if (!positions.length) return;
    const i = Math.max(0, Math.min(positions.length - 1, (viewPly ?? positions.length - 1) + dd));
    viewPly = i === positions.length - 1 ? null : i;
    sync();
  }

  function record(solved: boolean) {
    if (!live || prior()) return; // only the first result on the puzzle's own day / week counts
    const ms = started ? Date.now() - started : undefined;
    storeResult(k, d, { solved, ms, at: Date.now() });
    if (accountsEnabled() && me) rpc('record_puzzle_day', { p_kind: k, p_period: isoDay(d), p_puzzle: pz!.id, p_solved: solved, p_ms: ms ?? null }).catch(() => {});
  }

  function userMove(m: Move) {
    if (!pz || done || locked) return;
    const pos = positions[positions.length - 1];
    const expected = uciToMove(pos, pz.moves[at]);
    const played = pos.clone(); played.play(m);
    const exp = expected ? (() => { const c = pos.clone(); c.play(expected); return c; })() : null;
    const correct = (exp && fenOf(exp) === fenOf(played)) || played.isCheckmate();
    if (!correct) {
      board.showMove(pos, m, played, false);
      sound.bad();
      const first = !failed && !prior();
      failed = true;
      if (first) record(false);
      if (live && k === 'weekly') locked = true;
      render();
      setTimeout(() => { if (alive && pz) { sync(); render(); } }, 700);
      return;
    }
    positions.push(played); moves.push(m); at++;
    board.showMove(pos, m, played, false);
    if (at >= pz.moves.length || played.isCheckmate()) { solvedNow(); return; }
    feedback.replaceChildren(h('div.fb.good', null, h('b', null, t('✓ Best move!')), h('span', null, t('Keep going…'))));
    setTimeout(() => { if (!alive || !pz || done) return; playSolutionMove(); sync(); render(); }, 380);
  }
  function solvedNow() {
    done = true; sound.good();
    if (live) { if (!failed) record(true); }
    else if (!solutionShown) { const p = practice(); p[rkey(k, d)] = true; save('pdaysPractice', p); }
    sync(); render();
  }
  function showSolution() {
    if (!pz || live) return;
    // replay the whole line from the start
    const p = pz, start = posFromFen(p.fen)!;
    positions = [start]; moves = []; at = 0; viewPly = null;
    done = true; solutionShown = true;
    board.setPosition(start, null, false); board.arrows([]);
    render();
    const run = () => { if (!alive || pz !== p || at >= p.moves.length) { sync(); render(); return; } playSolutionMove(); sync(); render(); setTimeout(run, 700); };
    setTimeout(run, 500);
  }
  function retry() { if (pz && !(live && k === 'weekly')) { const p = pz; const was = failed; load(p); failed = was; render(); } }

  async function loadStats(el: HTMLElement) {
    if (!accountsEnabled() || !me) return;
    try {
      const s = await rpc<any>('puzzle_day_stats', { p_kind: k, p_period: isoDay(d) });
      if (alive && s && s.played) el.textContent = t('Solved by {0} of {1} players', s.solved, s.played);
    } catch { /* add-on missing */ }
  }

  function render() {
    const r = prior();
    const stats = h('span.muted.small');
    head.replaceChildren(
      h('div.pday-title', null, h('span.pday-badge', { class: k }, k === 'daily' ? 'D' : 'W'), h('div', null,
        h('b', null, `${title()} #${periodNumber(k, d)}`),
        h('span.muted.small.block', null, k === 'daily' ? fmtDay(d) : t('Week of {0}', fmtDay(d, { day: 'numeric', month: 'short', year: 'numeric' }))))),
      h('div.pday-meta.muted.small', null,
        live ? h('span', null, icon('calendar'), ' ', k === 'daily' ? t('New puzzle in {0}', countdown(msLeft(k))) : t('New weekly puzzle in {0}', countdown(msLeft(k)))) : h('span', null, t('Past puzzle: practice only, it does not count.')),
        stats),
      h('p.pday-rules.small', null, k === 'daily'
        ? t('Ultra hard (puzzle rating 2750+). No hints. Only your first try counts. The solution appears when the day is over.')
        : t('The hardest puzzles in the collection (rated about 2900–3000, long lines). No hints and only one try: one wrong move ends it. The solution appears when the week is over.')));
    loadStats(stats);
    if (!pz) return;
    const col = userColor();
    top.replaceChildren(h('div.pz-turn', null, h('span.cdot.' + col),
      done ? (solutionShown ? t('Solution') : t('Puzzle solved!')) : locked ? t('Out of tries') : (col === 'white' ? t('Find the best move for White') : t('Find the best move for Black'))));
    const showRating = !live || done || (r && !live);
    info.replaceChildren(h('div.pz-meta.muted.small', null, showRating || !live ? h('span', null, t('Puzzle') + ' ', h('b', null, '#' + pz.id), ' · ' + t('rated') + ' ', h('b', null, String(pz.rating))) : t('Rated puzzle')));
    // feedback
    let fb: HTMLElement | null = null;
    if (done && !solutionShown) fb = h('div.fb.good', null, h('b', null, '✓ ' + t('Correct!')), h('span', null, live ? (failed || (r && !r.solved) ? t('Solved, but not on the first try: your result stays failed.') : t('Well played! It counts on your profile.')) : t('Practice puzzle solved.')));
    else if (solutionShown) fb = h('div.fb', null, h('b', null, t('Solution shown')));
    else if (locked) fb = h('div.fb.bad', null, h('b', null, t('✕ Not the move')), h('span', null, t('This week\'s puzzle is over for you. The solution appears when the week is over.')));
    else if (failed) fb = h('div.fb.bad', null, h('b', null, t('✕ Not the move')), h('span', null, live ? t('Your result: failed. You can keep trying for fun; the solution appears tomorrow.') : t('Try again, or view the solution.')));
    else if (live && r) fb = h('div.fb', { class: r.solved ? 'good' : 'bad' }, h('b', null, r.solved ? '✓ ' + t('You solved this one') : '✕ ' + t('You missed this one')), h('span', null, t('You can play it again for fun; it does not change your result.')));
    else if (!live && r) fb = h('div.fb', { class: r.solved ? 'good' : 'bad' }, h('b', null, r.solved ? t('On its day you solved it') : t('On its day you missed it')), r.ms && r.solved ? h('span', null, t('Time: {0}', fmtMs(r.ms))) : null);
    feedback.replaceChildren(...(fb ? [fb] : []));
    // controls
    const c: HTMLElement[] = [];
    if (!live && !done) c.push(btn(h('span', null, icon('eye'), t('Solution')), showSolution));
    if ((failed || done) && !(live && k === 'weekly')) c.push(btn(h('span', null, icon('retry'), t('Retry')), retry));
    if (done && !live || solutionShown) c.push(btn(h('span', null, icon('chart'), t('Analyze')), () => {
      const g = new Game('standard', pz!.fen); for (const u of pz!.moves) if (!g.playUci(u)) break;
      setAnalysisInput({ variant: 'standard', startFen: pz!.fen, ucis: g.ucis.slice(), orientation: userColor(), ply: 1 });
      go('analysis');
    }));
    c.push(h('a.btn', { href: '#/pcalendar' }, icon('calendar'), t('Puzzle calendar')));
    if (k === 'daily') c.push(h('a.btn.ghost', { href: '#/wpuzzle' }, t('Weekly puzzle')));
    else c.push(h('a.btn.ghost', { href: '#/dpuzzle' }, t('Daily puzzle')));
    controls.replaceChildren(...c);
  }

  syncResults().then(() => { if (alive && pz) { locked = live && k === 'weekly' && !!prior() && !prior()!.solved; sync(); render(); } });
  puzzleFor(k, d).then(p => { if (alive) load(p); }).catch(() => feedback.replaceChildren(h('p.err', null, t('Could not load puzzles. If you are offline, open the site once while online so they can be saved.'))));
  const tick = setInterval(() => {
    if (!alive) return;
    if (live && currentPeriod(k) !== d) { toast(k === 'daily' ? t('A new daily puzzle is here!') : t('A new weekly puzzle is here!')); go(k === 'daily' ? 'dpuzzle/' + isoDay(d) : 'wpuzzle/' + isoDay(d)); return; }
    render();
  }, 60000);
  return () => { alive = false; clearInterval(tick); board.destroy(); };
}
const fmtMs = (ms: number) => { const s = Math.round(ms / 1000); return s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

// ---------------------------------------------------------------- calendar
export function puzzleCalendarPage(root: HTMLElement, arg?: string) {
  const today = todayNum();
  const nowD = new Date(today * DAY);
  let ym = arg && /^\d{4}-\d{2}$/.test(arg) ? arg : `${nowD.getUTCFullYear()}-${String(nowD.getUTCMonth() + 1).padStart(2, '0')}`;
  const first = new Date(DAILY_EPOCH * DAY);
  const minYm = `${first.getUTCFullYear()}-${String(first.getUTCMonth() + 1).padStart(2, '0')}`;
  const maxYm = `${nowD.getUTCFullYear()}-${String(nowD.getUTCMonth() + 1).padStart(2, '0')}`;
  if (ym < minYm) ym = minYm; if (ym > maxYm) ym = maxYm;
  const wrap = h('div.pcal-page');
  root.append(wrap);
  const mark = (k: Kind, dd: number, isCur: boolean) => {
    const r = resultOf(k, dd);
    return r ? (r.solved ? 'solved' : 'failed') : practiced(k, dd) ? 'practiced' : isCur ? 'open' : '';
  };
  function draw() {
    const [y, m] = ym.split('-').map(Number);
    const startD = Math.floor(Date.UTC(y, m - 1, 1) / DAY);
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const lead = (startD + 3) % 7; // Monday first
    const cells: HTMLElement[] = [];
    for (let i = 0; i < 7; i++) cells.push(h('div.pcal-dow.muted.small', null, new Date((WEEKLY_EPOCH + i) * DAY).toLocaleDateString(lang, { weekday: 'narrow', timeZone: 'UTC' })));
    for (let i = 0; i < lead; i++) cells.push(h('div.pcal-cell.empty'));
    for (let i = 0; i < days; i++) {
      const dd = startD + i;
      const avail = dd >= DAILY_EPOCH && dd <= today;
      const cls = avail ? mark('daily', dd, dd === today) : 'future';
      cells.push(avail
        ? h('a.pcal-cell', { href: '#/dpuzzle/' + isoDay(dd), class: cls + (dd === today ? ' today' : ''), title: fmtDay(dd) }, h('span', null, String(i + 1)), h('i', null, cls === 'solved' ? '✓' : cls === 'failed' ? '✕' : cls === 'practiced' ? '•' : ''))
        : h('div.pcal-cell.future', null, h('span', null, String(i + 1))));
    }
    const prev = ym > minYm ? (() => { const dt = new Date(Date.UTC(y, m - 2, 1)); return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`; })() : null;
    const next = ym < maxYm ? (() => { const dt = new Date(Date.UTC(y, m, 1)); return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`; })() : null;
    const weeks: HTMLElement[] = [];
    for (let w = weekStart(today); w >= WEEKLY_EPOCH; w -= 7) {
      const cls = mark('weekly', w, w === weekStart(today));
      weeks.push(h('a.pcal-week', { href: '#/wpuzzle/' + isoDay(w), class: cls },
        h('span.pday-badge.weekly', null, 'W'),
        h('span.pw-main', null, h('b', null, `${t('Weekly puzzle')} #${periodNumber('weekly', w)}`), h('span.muted.small.block', null, t('Week of {0}', fmtDay(w, { day: 'numeric', month: 'short', year: 'numeric' })))),
        h('span.pw-state', null, cls === 'solved' ? '✓ ' + t('Solved') : cls === 'failed' ? '✕ ' + t('Missed') : cls === 'practiced' ? t('Practiced') : w === weekStart(today) ? t('This week') : '')));
    }
    wrap.replaceChildren(
      h('section.card', null,
        h('h1', null, icon('calendar'), ' ', t('Puzzle calendar')),
        h('p.muted', null, t('Play any past daily or weekly puzzle. Past puzzles are practice: they do not count, and you can view the solution.')),
        h('div.row.wrap', null, h('a.btn.primary', { href: '#/dpuzzle' }, t('Today\'s daily puzzle')), h('a.btn', { href: '#/wpuzzle' }, t('This week\'s puzzle')))),
      h('section.card', null,
        h('div.pcal-head', null,
          prev ? h('a.btn.icon.ghost', { href: '#/pcalendar/' + prev, 'aria-label': t('Previous month') }, icon('prev')) : h('span.pcal-sp'),
          h('h2', null, new Date(startD * DAY).toLocaleDateString(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' })),
          next ? h('a.btn.icon.ghost', { href: '#/pcalendar/' + next, 'aria-label': t('Next month') }, icon('next')) : h('span.pcal-sp')),
        h('div.pcal-grid', null, cells),
        h('div.pcal-legend.muted.small', null, h('span', null, h('i.solved', null, '✓'), ' ', t('Solved on its day')), h('span', null, h('i.failed', null, '✕'), ' ', t('Missed on its day')), h('span', null, h('i.practiced', null, '•'), ' ', t('Solved as practice')))),
      h('section.card', null, h('h2', null, t('Weekly puzzles')), h('div.pcal-weeks', null, weeks)));
  }
  draw();
  syncResults().then(() => { if (wrap.isConnected) draw(); });
}

/** Card for the profile: daily / weekly puzzles solved on their day (practice does not count). */
export function puzzleDaysCard(username: string): HTMLElement {
  const card = h('section.card.pdays-card', { style: { display: 'none' } });
  rpc<any>('puzzle_days_of', { p_username: username }).then(r => {
    if (!r || !card.isConnected) return;
    const map = new Map<string, boolean>();
    for (const x of r.recent || []) map.set(`${x.kind}:${x.period}`, x.solved);
    const today = todayNum();
    // current daily streak: consecutive days solved, ending today (or yesterday if today is not played yet)
    let streak = 0;
    for (let dd = map.has(`daily:${isoDay(today)}`) ? today : today - 1; map.get(`daily:${isoDay(dd)}`) === true; dd--) streak++;
    const dots: HTMLElement[] = [];
    for (let dd = today - 27; dd <= today; dd++) {
      const v = map.get(`daily:${isoDay(dd)}`);
      dots.push(h('span.pd-dot', { class: v === true ? 'solved' : v === false ? 'failed' : '', title: `${fmtDay(dd)}: ${v === true ? t('Solved') : v === false ? t('Missed') : t('Not played')}` }));
    }
    const wdots: HTMLElement[] = [];
    for (let w = weekStart(today) - 7 * 11; w <= weekStart(today); w += 7) {
      const v = map.get(`weekly:${isoDay(w)}`);
      wdots.push(h('span.pd-dot.wk', { class: v === true ? 'solved' : v === false ? 'failed' : '', title: `${t('Week of {0}', fmtDay(w, { day: 'numeric', month: 'short' }))}: ${v === true ? t('Solved') : v === false ? t('Missed') : t('Not played')}` }, w === weekStart(today) ? '' : ''));
    }
    card.style.display = '';
    card.replaceChildren(
      h('h2', null, t('Daily and weekly puzzles')),
      h('div.pdays-stats', null,
        h('div', null, h('b', null, String(r.daily_solved)), h('span.muted.small', null, t('daily solved'))),
        h('div', null, h('b', null, String(streak)), h('span.muted.small', null, t('day streak'))),
        h('div', null, h('b', null, String(r.weekly_solved)), h('span.muted.small', null, t('weekly solved'))),
        h('div', null, h('b', null, r.daily_played ? Math.round(r.daily_solved / r.daily_played * 100) + '%' : '–'), h('span.muted.small', null, t('daily success')))),
      h('div.muted.small', null, t('Last 4 weeks of daily puzzles')), h('div.pd-dots', null, dots),
      h('div.muted.small', null, t('Last 12 weekly puzzles')), h('div.pd-dots', null, wdots),
      h('p.muted.small', null, t('Only puzzles solved on their own day or week count. Past puzzles from the calendar are practice.')));
  }).catch(() => { /* add-on not installed */ });
  return card;
}


/**
 * Learn: lessons (checkmates, tactics, endgames; the exercises are real puzzles from the puzzle database)
 * and opening courses (real lines from the opening database, first guided, then from memory).
 */
import { h, icon, btn, sound, loadRaw, save } from '../ui';
import { Board } from '../board';
import { posFromFen, uciToMove, fenOf, moveSquares, startFenFor, Move, Color } from '../chess';
import type { Position } from 'chessops/chess';
import { t } from '../i18n';
import { go } from '../main';
import { getBand, Puzzle } from './puzzles';
import { loadOpenings, Opening } from '../openings-db';

// ------------------------------------------------------------------ data
type Group = 'mate' | 'tactics' | 'endgame';
interface Lesson { key: string; title: string; group: Group; text: string }
export const LESSONS: Lesson[] = [
  { key: 'mateIn1', title: 'Mate in 1', group: 'mate', text: 'Checkmate means the king is attacked and cannot escape: no safe square, no block, no capture. Look at every check and find the one that leaves the king nowhere to go.' },
  { key: 'backRankMate', title: 'Back-rank mate', group: 'mate', text: 'A king stuck behind its own pawns can be mated by a rook or queen on the back rank. Watch for back ranks without a defender, yours and your opponent\'s.' },
  { key: 'smotheredMate', title: 'Smothered mate', group: 'mate', text: 'When a king is surrounded by its own pieces, a single knight check can be mate. Often a sacrifice first forces the pieces into place.' },
  { key: 'mateIn2', title: 'Mate in 2', group: 'mate', text: 'Start with a forcing move, usually a check or a sacrifice, that leaves your opponent only replies after which you can mate.' },
  { key: 'hangingPiece', title: 'Hanging piece', group: 'tactics', text: 'A hanging piece is attacked and not defended. Before every move, check what your opponent left unprotected, and take it.' },
  { key: 'fork', title: 'Fork', group: 'tactics', text: 'A fork is one piece attacking two or more enemy pieces at once. Knights are famous for it, but every piece, even a pawn, can fork.' },
  { key: 'pin', title: 'Pin', group: 'tactics', text: 'A pinned piece cannot move without exposing a more valuable piece behind it. Pinned pieces are easy targets: attack them again.' },
  { key: 'skewer', title: 'Skewer', group: 'tactics', text: 'A skewer is a pin in reverse: you attack a valuable piece, it has to move away, and you take the piece behind it.' },
  { key: 'discoveredAttack', title: 'Discovered attack', group: 'tactics', text: 'Move one piece out of the way and the piece behind it attacks. The piece that moves can make its own threat at the same time.' },
  { key: 'doubleCheck', title: 'Double check', group: 'tactics', text: 'In a double check two pieces give check at once. The king must move, because no single move can block or capture both attackers.' },
  { key: 'capturingDefender', title: 'Removing the defender', group: 'tactics', text: 'If a piece is protected only once, capture or chase away its defender first, then take the piece.' },
  { key: 'deflection', title: 'Deflection', group: 'tactics', text: 'Force a defender away from its job, for example by offering it something to capture, so that the square or piece it guarded falls.' },
  { key: 'trappedPiece', title: 'Trapped piece', group: 'tactics', text: 'A trapped piece is attacked and has no safe square to go to. Take away its escape squares, then win it.' },
  { key: 'pawnEndgame', title: 'Pawn endgame', group: 'endgame', text: 'In pawn endgames every move counts. Use your king actively, count the moves to the promotion square, and fight for the opposition.' },
  { key: 'promotion', title: 'Promotion', group: 'endgame', text: 'A pawn that reaches the last rank becomes a queen or another piece. Clear its way, and stop the opponent from blocking the promotion square.' },
  { key: 'rookEndgame', title: 'Rook endgame', group: 'endgame', text: 'Rook endgames are the most common endgames. Keep your rook active, cut off the enemy king, and put rooks behind passed pawns.' },
  { key: 'zugzwang', title: 'Zugzwang', group: 'endgame', text: 'Zugzwang: your opponent would like to pass, but must move, and every move makes things worse. Sometimes the strongest move is a quiet one.' },
];
const GROUPS: [Group, string][] = [['mate', 'Checkmates'], ['tactics', 'Tactics'], ['endgame', 'Endgames']];
const EXERCISES = 5;
const TARGETS = [600, 800, 1000, 1200, 1400];

interface Course { key: string; name: string; color: Color; lines: string[] }
export const COURSES: Course[] = [
  { key: 'italian', name: 'Italian Game', color: 'white', lines: ['e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6', 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4', 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4', 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5', 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7'] },
  { key: 'ruy', name: 'Ruy Lopez', color: 'white', lines: ['e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O', 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6 O-O', 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 d6 c3', 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6', 'e4 e5 Nf3 Nc6 Bb5 f5 Nc3 fxe4 Nxe4 Nf6'] },
  { key: 'qg', name: 'Queen\'s Gambit', color: 'white', lines: ['d4 d5 c4 e6 Nc3 Nf6 Nf3 Be7 e3 O-O', 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7 e3 c6', 'd4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6', 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3', 'd4 d5 c4 e5 dxe5 d4 Nf3 Nc6 g3'] },
  { key: 'sicilian', name: 'Sicilian Defense', color: 'black', lines: ['e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5', 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3', 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6 Nc3', 'e4 c5 c3 d5 exd5 Qxd5 d4 Nf6 Nf3 Bg4', 'e4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 d3 d6'] },
  { key: 'carokann', name: 'Caro-Kann Defense', color: 'black', lines: ['e4 c6 d4 d5 Nd2 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7', 'e4 c6 d4 d5 e5 Bf5 c3 e6 Be2', 'e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Bb4', 'e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4', 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nf6 Nxf6+ exf6'] },
  { key: 'french', name: 'French Defense', color: 'black', lines: ['e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6 a3', 'e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Ba5', 'e4 e6 d4 d5 Nd2 c5 exd5 exd5 Ngf3 Nc6', 'e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Ne4', 'e4 e6 d4 d5 exd5 exd5 Nc3 Nf6 Bg5 Nc6'] },
  { key: 'kid', name: 'King\'s Indian Defense', color: 'black', lines: ['d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2', 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O', 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f4 Na6', 'd4 Nf6 c4 g6 Nf3 Bg7 g3 d6 Bg2 O-O O-O c5', 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Be2 O-O Bg5'] },
];

// ------------------------------------------------------------------ progress (this device)
interface Progress { lessons: Record<string, string[]>; courses: Record<string, number[]> }
const prog: Progress = { lessons: {}, courses: {}, ...loadRaw('learn', {}) };
const persist = () => save('learn', prog);
const lessonDone = (k: string) => (prog.lessons[k] || []).length;
const courseDone = (k: string) => (prog.courses[k] || []).length;

/** The exercises of a lesson: real puzzles with that theme, from easy to harder; the same ones every time. */
const exCache = new Map<string, Promise<Puzzle[]>>();
function exercisesFor(theme: string): Promise<Puzzle[]> {
  if (!exCache.has(theme)) {
    const p = (async () => {
      const out: Puzzle[] = [];
      for (const target of TARGETS) {
        for (let b = Math.floor(target / 100) * 100; b <= 2700 && out.length < TARGETS.indexOf(target) + 1; b += 100) {
          let list: Puzzle[] = [];
          try { list = await getBand(b); } catch { continue; }
          const pick = list.filter(x => x.themes.includes(theme) && !out.some(o => o.id === x.id)).sort((a, z) => a.rating - z.rating || (a.id < z.id ? -1 : 1))[0];
          if (pick) out.push(pick);
        }
      }
      return out;
    })();
    p.catch(() => exCache.delete(theme));
    exCache.set(theme, p);
  }
  return exCache.get(theme)!;
}

/** phones and tablets: bring the board back into view when a new exercise or line starts */
function toBoard() { if (matchMedia('(max-width: 860px)').matches && window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ------------------------------------------------------------------ hub
export function learnPage(root: HTMLElement) {
  const lessonCard = (l: Lesson) => {
    const n = lessonDone(l.key);
    return h('a.card.learn-card', { href: '#/lesson/' + l.key, class: n >= EXERCISES ? 'done' : '' },
      h('b', null, t(l.title)), h('span.muted.small', null, n >= EXERCISES ? '✓ ' + t('Completed') : n ? t('{0} of {1} exercises', n, EXERCISES) : t('{0} exercises', EXERCISES)),
      h('span.learn-bar', null, h('i', { style: { width: Math.min(100, n / EXERCISES * 100) + '%' } })));
  };
  const courseCard = (c: Course) => {
    const n = courseDone(c.key);
    return h('a.card.learn-card.course', { href: '#/course/' + c.key, class: n >= c.lines.length ? 'done' : '' },
      h('b', null, c.name), h('span.muted.small', null, (c.color === 'white' ? t('As White') : t('As Black')) + ' · ' + (n >= c.lines.length ? '✓ ' + t('Completed') : t('{0} of {1} lines', n, c.lines.length))),
      h('span.learn-bar', null, h('i', { style: { width: Math.min(100, n / c.lines.length * 100) + '%' } })));
  };
  const total = LESSONS.length, doneL = LESSONS.filter(l => lessonDone(l.key) >= EXERCISES).length;
  root.append(h('div.learn', null,
    h('h1', null, t('Learn')),
    h('p.lead.muted', null, t('Short lessons with exercises on the board, and opening courses that teach you real lines move by move.')),
    h('section.learn-sec', null, h('h2', null, icon('puzzle'), ' ', t('Lessons'), h('span.muted.small', null, ` · ${doneL}/${total}`)),
      GROUPS.map(([g, label]) => h('div.learn-group', null, h('h3.set-h', null, t(label)), h('div.learn-grid', null, LESSONS.filter(l => l.group === g).map(lessonCard))))),
    h('section.learn-sec', null, h('h2', null, icon('book'), ' ', t('Courses')),
      h('p.muted', null, t('Each course has five important lines of an opening. First you play them with arrows showing the way, then from memory.')),
      h('div.learn-grid', null, COURSES.map(courseCard)))));
}

// ------------------------------------------------------------------ one lesson
export function lessonPage(root: HTMLElement, key?: string) {
  const lesson = LESSONS.find(l => l.key === key);
  if (!lesson) { go('learn'); return; }
  let alive = true;
  let list: Puzzle[] = [];
  let idx = 0;
  let pz: Puzzle | null = null;
  let positions: Position[] = [];
  let moves: Move[] = [];
  let step = 0, done = false, mistakes = 0, helped = false;

  const board = new Board({ onMove: (m) => userMove(m) });
  board.movableColor = null;
  const top = h('div.pz-top');
  const dots = h('div.learn-dots');
  const feedback = h('div.pz-feedback');
  const controls = h('div.pz-controls');
  root.append(h('div.game-layout.puzzles.lesson', null,
    h('div.board-col', null, top, board.el),
    h('aside.side.card', null,
      h('div.learn-head', null, h('a.muted.small', { href: '#/learn' }, '← ' + t('Learn')), h('h2', null, t(lesson.title))),
      h('p.learn-text', null, t(lesson.text)), dots, feedback, controls)));

  const userColor = (): Color => (positions[0] ? (positions[0].turn === 'white' ? 'black' : 'white') : 'white');
  const solvedSet = () => new Set(prog.lessons[lesson.key] || []);

  function drawDots() {
    const s = solvedSet();
    dots.replaceChildren(...list.map((p, i) => h('button.learn-dot', {
      type: 'button', class: (s.has(p.id) ? 'ok' : '') + (i === idx ? ' cur' : ''), 'aria-label': t('Exercise {0}', i + 1),
      onclick: () => { idx = i; load(); },
    }, String(i + 1))));
  }

  function load() {
    pz = list[idx] || null;
    if (!pz) return;
    const start = posFromFen(pz.fen);
    if (!start) return;
    positions = [start]; moves = []; step = 0; done = false; mistakes = 0; helped = false;
    board.arrows([]);
    toBoard();
    board.setOrientation(start.turn === 'white' ? 'black' : 'white');
    board.setPosition(start, null, false);
    drawDots(); render();
    const p = pz;
    setTimeout(() => { if (alive && pz === p) { playLine(); sync(); render(); } }, 500);
  }

  function playLine() {
    const pos = positions[positions.length - 1];
    const m = uciToMove(pos, pz!.moves[step]);
    if (!m) return;
    const nx = pos.clone(); nx.play(m);
    positions.push(nx); moves.push(m); step++;
    board.showMove(pos, m, nx, false);
  }

  function sync() {
    const pos = positions[positions.length - 1];
    const last = positions.length > 1 ? moveSquares(positions[positions.length - 2], moves[moves.length - 1]) : null;
    board.movableColor = userColor();
    board.setPosition(pos, last, !done && pos.turn === userColor() && step < (pz?.moves.length || 0));
  }

  function userMove(m: Move) {
    if (!pz || done) return;
    const pos = positions[positions.length - 1];
    const expected = uciToMove(pos, pz.moves[step]);
    const played = pos.clone(); played.play(m);
    const exp = expected ? (() => { const c = pos.clone(); c.play(expected); return c; })() : null;
    if (!((exp && fenOf(exp) === fenOf(played)) || played.isCheckmate())) {
      mistakes++;
      board.showMove(pos, m, played, false);
      sound.bad();
      feedback.replaceChildren(h('div.fb.bad', null, h('b', null, t('✕ Not the move')), h('span', null, mistakes >= 2 ? t('Use a hint if you are stuck.') : t('Try again.'))));
      setTimeout(() => { if (alive) { sync(); render(); } }, 650);
      return;
    }
    board.arrows([]);
    positions.push(played); moves.push(m); step++;
    board.showMove(pos, m, played, false);
    if (step >= pz.moves.length || played.isCheckmate()) { finish(); return; }
    feedback.replaceChildren(h('div.fb.good', null, h('b', null, t('✓ Best move!')), h('span', null, t('Keep going…'))));
    setTimeout(() => { if (alive && !done) { playLine(); sync(); render(); } }, 380);
  }

  function finish() {
    done = true; sound.good();
    if (!helped) {
      const s = solvedSet(); s.add(pz!.id);
      prog.lessons[lesson!.key] = [...s].filter(id => list.some(p => p.id === id)); persist();
    }
    sync(); drawDots(); render();
  }

  function hint() {
    if (!pz || done) return;
    const pos = positions[positions.length - 1];
    const m = uciToMove(pos, pz.moves[step]);
    if (!m) return;
    helped = true;
    const s = moveSquares(pos, m)!;
    board.arrows([{ orig: s[0] as any, dest: s[1] as any, brush: 'green' }]);
    render();
  }

  function solution() {
    if (!pz) return;
    helped = true; done = true;
    const run = () => { if (!alive || !pz || step >= pz.moves.length) { sync(); render(); return; } playLine(); sync(); render(); setTimeout(run, 650); };
    run();
  }

  function render() {
    if (!pz) return;
    const col = userColor();
    top.replaceChildren(h('div.pz-turn', null, h('span.cdot.' + col), t('Exercise {0}', idx + 1) + ' · ' + (done ? (helped ? t('Solution shown') : t('Solved!')) : col === 'white' ? t('Find the best move for White') : t('Find the best move for Black'))));
    if (done) feedback.replaceChildren(h('div.fb', { class: helped ? 'bad' : 'good' }, h('b', null, helped ? t('Solution shown') : '✓ ' + t('Correct!')), h('span', null, helped ? t('Try it again without help to count it.') : '')));
    else if (step <= 1 && !mistakes) feedback.replaceChildren();
    const c: HTMLElement[] = [];
    const allDone = list.length && list.every(p => solvedSet().has(p.id));
    if (!done) { c.push(btn(h('span', null, icon('bulb'), t('Hint')), hint)); c.push(btn(h('span', null, icon('eye'), t('Solution')), solution)); }
    else {
      if (idx < list.length - 1) c.push(btn(h('span', null, icon('next'), t('Next exercise')), () => { idx++; load(); }, 'primary'));
      else c.push(h('a.btn.primary', { href: '#/learn' }, allDone ? '✓ ' + t('Lesson complete') : t('Back to lessons')));
      c.push(btn(h('span', null, icon('retry'), t('Retry')), () => load()));
    }
    controls.replaceChildren(...c);
  }

  feedback.replaceChildren(h('div.spinner-row', null, h('span.spinner'), t('Loading…')));
  exercisesFor(lesson.key).then(ps => {
    if (!alive) return;
    list = ps.slice(0, EXERCISES);
    if (!list.length) { feedback.replaceChildren(h('p.err', null, t('Could not load puzzles. If you are offline, open the site once while online so they can be saved.'))); return; }
    const s = solvedSet();
    idx = Math.max(0, list.findIndex(p => !s.has(p.id)));
    load();
  }).catch(() => feedback.replaceChildren(h('p.err', null, t('Could not load puzzles. If you are offline, open the site once while online so they can be saved.'))));

  return () => { alive = false; board.destroy(); };
}

// ------------------------------------------------------------------ one course
export function coursePage(root: HTMLElement, key?: string) {
  const course = COURSES.find(c => c.key === key);
  if (!course) { go('learn'); return; }
  let alive = true;
  let lines: { name: string; ucis: string[]; sans: string[] }[] = [];
  let li = 0, ply = 0, mode: 'learn' | 'practice' = 'learn', mistakes = 0, done = false;
  let positions: Position[] = [];
  let moves: Move[] = [];

  const board = new Board({ onMove: (m) => userMove(m) });
  board.setOrientation(course.color);
  const top = h('div.pz-top');
  const chapters = h('div.course-lines');
  const feedback = h('div.pz-feedback');
  const controls = h('div.pz-controls');
  const movesEl = h('div.course-moves.muted.small');
  root.append(h('div.game-layout.puzzles.lesson', null,
    h('div.board-col', null, top, board.el),
    h('aside.side.card', null,
      h('div.learn-head', null, h('a.muted.small', { href: '#/learn' }, '← ' + t('Learn')), h('h2', null, course.name), h('span.muted.small', null, course.color === 'white' ? t('As White') : t('As Black'))),
      feedback, controls, movesEl, chapters)));

  const mine = () => (ply % 2 === 0 ? 'white' : 'black') === course.color;
  const doneSet = () => new Set(prog.courses[course.key] || []);

  function drawChapters() {
    const s = doneSet();
    chapters.replaceChildren(...lines.map((l, i) => h('button.course-line', {
      type: 'button', class: (s.has(i) ? 'ok' : '') + (i === li ? ' cur' : ''),
      onclick: () => { li = i; mode = 'learn'; start(); },
    }, h('span.cl-num', null, s.has(i) ? '✓' : String(i + 1)), h('span', null, l.name))));
  }

  function start() {
    const startPos = posFromFen(startFenFor('standard'))!;
    positions = [startPos]; moves = []; ply = 0; mistakes = 0; done = false;
    board.arrows([]);
    toBoard();
    board.setPosition(startPos, null, false);
    drawChapters(); render();
    setTimeout(() => { if (alive) advance(); }, 300);
  }

  /** play the opponent's moves; on our move show the way (learn mode) and wait */
  function advance() {
    const l = lines[li];
    if (!alive || !l) return;
    if (ply >= l.ucis.length) { complete(); return; }
    const pos = positions[positions.length - 1];
    if (!mine()) {
      const m = uciToMove(pos, l.ucis[ply]);
      if (!m) return;
      const nx = pos.clone(); nx.play(m);
      positions.push(nx); moves.push(m); ply++;
      board.showMove(pos, m, nx, false);
      setTimeout(() => { if (alive) advance(); }, 420);
      return;
    }
    if (mode === 'learn') showArrow();
    sync(); render();
  }

  function showArrow() {
    const l = lines[li]; const pos = positions[positions.length - 1];
    const m = uciToMove(pos, l.ucis[ply]); if (!m) return;
    const s = moveSquares(pos, m)!;
    board.arrows([{ orig: s[0] as any, dest: s[1] as any, brush: 'green' }]);
  }

  function sync() {
    const pos = positions[positions.length - 1];
    const last = positions.length > 1 ? moveSquares(positions[positions.length - 2], moves[moves.length - 1]) : null;
    board.movableColor = course!.color;
    board.setPosition(pos, last, !done && mine());
  }

  function userMove(m: Move) {
    const l = lines[li];
    if (!l || done || !mine()) return;
    const pos = positions[positions.length - 1];
    const expected = uciToMove(pos, l.ucis[ply]);
    const played = pos.clone(); played.play(m);
    const exp = expected ? (() => { const c = pos.clone(); c.play(expected); return c; })() : null;
    if (!exp || fenOf(exp) !== fenOf(played)) {
      mistakes++;
      board.showMove(pos, m, played, false);
      sound.bad();
      feedback.replaceChildren(h('div.fb.bad', null, h('b', null, t('✕ Not the move in this line')), h('span', null, t('The line continues with {0}.', '…'))));
      feedback.querySelector('span')!.textContent = mistakes >= 2 || mode === 'learn' ? t('The line continues with {0}.', l.sans[ply]) : t('Try again.');
      if (mistakes >= 2 || mode === 'learn') showArrow();
      setTimeout(() => { if (alive) { sync(); render(); } }, 650);
      return;
    }
    board.arrows([]);
    positions.push(played); moves.push(m); ply++;
    board.showMove(pos, m, played, false);
    feedback.replaceChildren();
    setTimeout(() => { if (alive) advance(); }, 300);
  }

  function complete() {
    done = true; sound.good();
    if (mode === 'practice' && mistakes === 0) {
      const s = doneSet(); s.add(li);
      prog.courses[course!.key] = [...s].sort(); persist();
    }
    sync(); drawChapters(); render();
  }

  function render() {
    const l = lines[li];
    if (!l) return;
    top.replaceChildren(h('div.pz-turn', null, h('span.cdot.' + course!.color), (mode === 'learn' ? t('Learn') : t('From memory')) + ' · ' + t('Line {0} of {1}', li + 1, lines.length)));
    movesEl.replaceChildren(...l.sans.map((s, i) => h('span', { class: i < ply ? 'played' : i === ply ? 'next' : '' }, (i % 2 === 0 ? `${i / 2 + 1}. ` : '') + (i < ply || mode === 'learn' ? s : '?'))));
    const c: HTMLElement[] = [];
    if (done) {
      const ok = mode === 'practice' && mistakes === 0;
      feedback.replaceChildren(h('div.fb', { class: ok || mode === 'learn' ? 'good' : 'bad' }, h('b', null, mode === 'learn' ? '✓ ' + t('Line learned') : ok ? '✓ ' + t('Perfect, from memory!') : t('Line finished with {0} mistakes', mistakes)),
        h('span', null, mode === 'learn' ? t('Now play it from memory, without arrows.') : ok ? '' : t('Play it once more without mistakes to complete it.'))));
      if (mode === 'learn') c.push(btn(h('span', null, icon('play'), t('Play from memory')), () => { mode = 'practice'; start(); }, 'primary'));
      else if (!ok) c.push(btn(h('span', null, icon('retry'), t('Try again')), () => start(), 'primary'));
      else if (li < lines.length - 1) c.push(btn(h('span', null, icon('next'), t('Next line')), () => { li++; mode = 'learn'; start(); }, 'primary'));
      else c.push(h('a.btn.primary', { href: '#/learn' }, '✓ ' + t('Course complete')));
      if (mode === 'practice' && ok) c.push(btn(h('span', null, icon('retry'), t('Again')), () => start()));
    } else {
      if (mode === 'practice') c.push(btn(h('span', null, icon('bulb'), t('Hint')), () => { mistakes++; showArrow(); }));
      c.push(btn(h('span', null, icon('retry'), t('Restart line')), () => start()));
    }
    controls.replaceChildren(...c);
  }

  feedback.replaceChildren(h('div.spinner-row', null, h('span.spinner'), t('Loading…')));
  loadOpenings().then((all: Opening[]) => {
    if (!alive) return;
    lines = course.lines.map(s => { const o = all.find(x => x.sans.join(' ') === s); return o ? { name: o.variation || o.name, ucis: o.ucis, sans: o.sans } : null; }).filter(Boolean) as any;
    const s = doneSet();
    li = Math.max(0, lines.findIndex((_, i) => !s.has(i)));
    feedback.replaceChildren();
    start();
  }).catch(() => feedback.replaceChildren(h('p.err', null, t('Could not load the openings. Check your connection.'))));

  return () => { alive = false; board.destroy(); };
}

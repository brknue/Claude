import { h, icon, btn, iconBtn, toast, sound, debounce } from '../ui';
import { Game } from '../game';
import { Board, arrowFor } from '../board';
import { moveSquares, fenOf, Color, startFenFor, Move } from '../chess';
import { loadOpenings, openingIndex, Opening } from '../openings-db';
import { setAnalysisInput } from './analysis';
import { go } from '../main';

export function openingsPage(root: HTMLElement) {
  let all: Opening[] = [];
  let idx: Map<string, Opening> = new Map();
  let line: string[] = [];
  let ply = 0;
  let game = new Game('standard', startFenFor('standard'));
  let selected: Opening | null = null;
  let practice: { op: Opening; color: Color; mistakes: number } | null = null;
  let query = '';
  let openFamily: string | null = null;
  let alive = true;

  const board = new Board({ onMove: (m) => userMove(m) });
  board.movableColor = 'both';

  const nameEl = h('div.op-current');
  const movesEl = h('div.op-moves');
  const bookEl = h('div.op-book');
  const listEl = h('div.op-list');
  const practiceEl = h('div.op-practice');
  const search = h('input.search', { type: 'search', placeholder: 'Search 3,800+ openings, e.g. "Sicilian Najdorf" or "B90"', 'aria-label': 'Search openings' }) as HTMLInputElement;
  search.addEventListener('input', debounce(() => { query = search.value.trim().toLowerCase(); renderList(); }, 150));

  const sideTop = h('div.card.op-panel', null, nameEl, movesEl,
    h('div.navrow', null, iconBtn('first', 'Start', () => setPly(0)), iconBtn('prev', 'Back', () => setPly(ply - 1)), iconBtn('next', 'Forward', () => setPly(ply + 1)), iconBtn('last', 'End', () => setPly(line.length)), iconBtn('flip', 'Flip', () => board.flip())),
    practiceEl, bookEl);
  const sideList = h('div.card.op-panel', null, h('div.search-wrap', null, icon('search'), search), listEl);

  root.append(h('div.game-layout.openings', null, h('div.board-col', null, board.el), h('aside.side.op-side', null, sideTop, sideList)));

  function rebuild() {
    game = new Game('standard', startFenFor('standard'));
    for (const u of line) if (!game.playUci(u)) break;
    line = game.ucis.slice();
    ply = Math.min(ply, line.length);
  }

  function setPly(p: number) { ply = Math.max(0, Math.min(line.length, p)); render(); }

  function userMove(m: Move) {
    const g = new Game('standard', fenOf(game.positions[ply]));
    if (!g.play(m)) { render(); return; }
    const u = g.ucis[0];
    if (practice) { practiceMove(u); return; }
    if (line[ply] === u) { ply++; render(); return; }
    line = line.slice(0, ply).concat(u);
    ply++;
    selected = null;
    rebuild(); render();
  }

  function render() {
    const pos = game.positions[ply];
    const last = ply > 0 ? moveSquares(game.positions[ply - 1], game.moves[ply - 1]) : null;
    board.setPosition(pos, last, !practice || pos.turn === practice.color);
    // name
    let named: Opening | null = null;
    for (let i = 0; i <= ply; i++) { const o = idx.get(fenOf(game.positions[i]).split(' ').slice(0, 4).join(' ')); if (o) named = o; }
    const exact = selected && selected.ucis.join(' ') === line.slice(0, ply).join(' ') ? selected : named;
    nameEl.replaceChildren(exact ? h('div', null, h('span.eco', null, exact.eco), h('h2', null, exact.family), exact.variation ? h('div.var', null, exact.variation) : null) : h('div', null, h('h2', null, ply ? 'Unnamed position' : 'Starting position'), h('div.muted.small', null, ply ? 'This exact position is not a named opening line.' : 'Play a move or pick an opening below.')));
    // moves
    const items: HTMLElement[] = [];
    game.sans.forEach((san, i) => {
      if (practice && i >= ply) return;
      if (i % 2 === 0) items.push(h('span.mnum', null, (i / 2 + 1) + '.'));
      items.push(h('button.mv', { type: 'button', class: i + 1 === ply ? 'cur' : '', onclick: () => setPly(i + 1) }, san));
    });
    movesEl.replaceChildren(...items);
    if (!items.length) movesEl.append(h('span.muted.small', null, 'No moves yet'));
    renderBook();
    renderPractice();
    const shapes: any[] = [];
    if (practice && ply < practice.op.ucis.length && pos.turn === practice.color && practice.mistakes > 1) {
      const a = arrowFor(pos, practice.op.ucis[ply], 'green'); if (a) shapes.push(a);
    }
    board.arrows(shapes);
  }

  function renderBook() {
    bookEl.replaceChildren();
    if (practice || !all.length) return;
    const prefix = line.slice(0, ply).join(' ');
    const children = new Map<string, { uci: string; san: string; count: number; best: Opening | null }>();
    for (const o of all) {
      if (o.ucis.length <= ply) continue;
      if (ply && o.ucis.slice(0, ply).join(' ') !== prefix) continue;
      const u = o.ucis[ply];
      const c = children.get(u) || { uci: u, san: o.sans[ply], count: 0, best: null };
      c.count++;
      if (o.ucis.length === ply + 1) c.best = o;
      else if (!c.best || (c.best.ucis.length > ply + 1 && o.ucis.length < c.best.ucis.length)) c.best = o;
      children.set(u, c);
    }
    const list = [...children.values()].sort((a, b) => b.count - a.count);
    if (!list.length) { bookEl.append(h('p.muted.small', null, ply ? 'End of known theory for this line.' : '')); return; }
    const pos = game.positions[ply];
    bookEl.append(h('div.lbl', null, 'Book moves from here'), h('div.book-list', null, list.slice(0, 30).map(c => h('button.book-move', {
      type: 'button',
      onclick: () => { line = line.slice(0, ply).concat(c.uci); ply++; selected = null; rebuild(); render(); },
      onmouseenter: () => { const a = arrowFor(pos, c.uci, 'blue'); board.arrows(a ? [a] : []); },
      onmouseleave: () => board.arrows([]),
    }, h('b', null, c.san), h('span.bm-name', null, c.best ? (c.best.ucis.length === ply + 1 ? c.best.name : c.best.family) : ''), h('span.bm-count', null, c.count + (c.count === 1 ? ' line' : ' lines'))))));
  }

  function renderPractice() {
    practiceEl.replaceChildren();
    const op = practice?.op || selected;
    if (!practice) {
      if (selected) practiceEl.append(h('div.row.wrap', null,
        btn(h('span', null, icon('play'), 'Drill as White'), () => startPractice(selected!, 'white'), 'primary small'),
        btn('Drill as Black', () => startPractice(selected!, 'black'), 'small'),
        btn(h('span', null, icon('chart'), 'Analyze'), () => { setAnalysisInput({ variant: 'standard', startFen: startFenFor('standard'), ucis: line.slice(), orientation: board.orientation }); go('analysis'); }, 'small')));
      return;
    }
    const done = ply >= op!.ucis.length;
    practiceEl.append(h('div.practice-box', { class: done ? 'done' : '' },
      h('b', null, done ? '✓ Line complete!' : `Drilling as ${practice.color}`),
      h('div.muted.small', null, done ? `${practice.mistakes} mistake${practice.mistakes === 1 ? '' : 's'}.` : 'Play the book move. After two mistakes a hint arrow appears.'),
      h('div.row.wrap', null,
        done ? btn('Again', () => startPractice(op!, practice!.color), 'primary small') : null,
        btn('Random line in this family', () => { const fam = all.filter(o => o.family === op!.family && o.ucis.length >= 3); startPractice(fam[Math.floor(Math.random() * fam.length)] || op!, practice!.color); }, 'small'),
        btn('Stop drill', () => { practice = null; render(); }, 'small'))));
  }

  function startPractice(op: Opening, color: Color) {
    practice = { op, color, mistakes: 0 };
    selected = op;
    line = op.ucis.slice(); ply = 0;
    rebuild();
    board.setOrientation(color);
    render();
    autoReply();
  }

  function practiceMove(u: string) {
    const p = practice!;
    const expected = p.op.ucis[ply];
    if (ply >= p.op.ucis.length) { toast('Line complete — press Again or pick another.'); render(); return; }
    if (u !== expected) {
      p.mistakes++;
      sound.bad();
      toast(p.mistakes > 1 ? `Not the book move. Try ${p.op.sans[ply]}.` : 'Not the book move — try again.');
      render(); return;
    }
    const prev = game.positions[ply];
    ply++;
    board.showMove(prev, game.moves[ply - 1], game.positions[ply]);
    render();
    if (ply >= p.op.ucis.length) { sound.good(); return; }
    autoReply();
  }

  function autoReply() {
    const p = practice!;
    if (ply < p.op.ucis.length && game.positions[ply].turn !== p.color) {
      setTimeout(() => {
        if (!alive || practice !== p) return;
        const prev = game.positions[ply];
        ply++;
        board.showMove(prev, game.moves[ply - 1], game.positions[ply]);
        render();
        if (ply >= p.op.ucis.length) sound.good();
      }, 450);
    }
  }

  function select(o: Opening) {
    practice = null;
    selected = o;
    line = o.ucis.slice(); ply = line.length;
    rebuild(); render();
    if (matchMedia('(max-width: 900px)').matches) board.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderList() {
    listEl.replaceChildren();
    if (!all.length) { listEl.append(h('div.spinner-row', null, h('span.spinner'), 'Loading openings…')); return; }
    if (query) {
      const words = query.split(/\s+/);
      const res = all.filter(o => { const t = (o.eco + ' ' + o.name).toLowerCase(); return words.every(w => t.includes(w)); }).sort((a, b) => a.name.length - b.name.length || a.ucis.length - b.ucis.length);
      listEl.append(h('div.muted.small', null, `${res.length} result${res.length === 1 ? '' : 's'}`));
      res.slice(0, 150).forEach(o => listEl.append(opRow(o, true)));
      if (res.length > 150) listEl.append(h('div.muted.small', null, 'Refine your search to see more.'));
      return;
    }
    const fams = new Map<string, Opening[]>();
    for (const o of all) { const a = fams.get(o.family) || []; a.push(o); fams.set(o.family, a); }
    const sorted = [...fams.entries()].sort((a, b) => b[1].length - a[1].length);
    listEl.append(h('div.muted.small', null, `${all.length} lines in ${fams.size} opening families · sorted by number of variations`));
    for (const [fam, ops] of sorted) {
      const isOpen = openFamily === fam;
      const head = h('button.fam', { type: 'button', 'aria-expanded': String(isOpen), onclick: () => { openFamily = isOpen ? null : fam; renderList(); if (!isOpen) select(ops.slice().sort((a, b) => a.ucis.length - b.ucis.length)[0]); } },
        h('span.fam-name', null, fam), h('span.fam-count', null, String(ops.length)));
      listEl.append(head);
      if (isOpen) {
        const box = h('div.fam-body');
        ops.slice().sort((a, b) => a.ucis.length - b.ucis.length || a.name.localeCompare(b.name)).forEach(o => box.append(opRow(o, false)));
        listEl.append(box);
        setTimeout(() => head.scrollIntoView({ block: 'nearest' }), 0);
      }
    }
  }

  function opRow(o: Opening, full: boolean) {
    return h('button.op-row', { type: 'button', class: selected === o ? 'on' : '', onclick: () => { select(o); listEl.querySelectorAll('.op-row.on').forEach(e => e.classList.remove('on')); } },
      h('span.eco', null, o.eco), h('span.op-name', null, full ? o.name : (o.variation || o.family)), h('span.op-pgn.muted', null, o.sans.slice(0, 10).map((s, i) => (i % 2 === 0 ? (i / 2 + 1) + '.' : '') + s).join(' ') + (o.sans.length > 10 ? '…' : '')));
  }

  renderList(); render();
  Promise.all([loadOpenings(), openingIndex()]).then(([a, i]) => { if (!alive) return; all = a; idx = i; renderList(); render(); })
    .catch(() => { listEl.replaceChildren(h('p.err', null, 'Could not load the opening database.')); });

  return () => { alive = false; board.destroy(); };
}

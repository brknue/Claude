import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.cburnett.css';
import './style.css';
import { h, icon, settings, saveSettings, applyTheme, modal, btn } from './ui';
import { playSetupPage, gamePage, joinPage } from './pages/play';
import { analysisPage } from './pages/analysis';
import { editorPage } from './pages/editor';
import { openingsPage } from './pages/openings';
import { puzzlesPage } from './pages/puzzles';
import { puzzleRating } from './pages/puzzles';

export type Cleanup = (() => void) | void;
type PageFn = (root: HTMLElement, arg?: string) => Cleanup;

const routes: Record<string, PageFn> = {
  '': homePage, play: playSetupPage, game: gamePage, join: joinPage,
  analysis: analysisPage, editor: editorPage, openings: openingsPage, puzzles: puzzlesPage,
};

const NAV = [
  ['play', 'Play', 'play'], ['puzzles', 'Puzzles', 'puzzle'], ['openings', 'Openings', 'book'],
  ['analysis', 'Analysis', 'chart'], ['editor', 'Editor', 'edit'],
] as const;

let cleanup: Cleanup;
const main = h('main', { id: 'app' });

/** Hook a page can set to confirm leaving (e.g. a game in progress). */
export let leaveGuard: (() => boolean) | null = null;
export const setLeaveGuard = (f: (() => boolean) | null) => { leaveGuard = f; };
let lastHash = location.hash;

function route() {
  if (leaveGuard && location.hash !== lastHash) {
    if (!leaveGuard()) { history.replaceState(null, '', lastHash || '#/'); return; }
    leaveGuard = null;
  }
  lastHash = location.hash;
  const [name, arg] = location.hash.replace(/^#\/?/, '').split('/');
  const fn = routes[name] || homePage;
  if (typeof cleanup === 'function') cleanup();
  cleanup = undefined;
  main.innerHTML = '';
  main.className = 'page-' + (name || 'home');
  document.querySelectorAll('.nav a, .tabbar a').forEach(a => a.classList.toggle('active', a.getAttribute('data-r') === (name === 'game' || name === 'join' ? 'play' : name)));
  document.body.classList.remove('nav-open');
  window.scrollTo(0, 0);
  cleanup = fn(main, arg ? decodeURIComponent(arg) : undefined);
}

export function go(path: string) {
  if (location.hash === '#/' + path) route(); else location.hash = '#/' + path;
}

function themeIcon() { return icon(settings.theme === 'dark' ? 'moon' : settings.theme === 'light' ? 'sun' : 'half'); }

function header() {
  const themeBtn = btn(themeIcon(), () => {
    settings.theme = settings.theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark') : settings.theme === 'dark' ? 'light' : 'dark';
    saveSettings(); themeBtn.replaceChildren(themeIcon());
  }, 'icon ghost', 'Toggle dark / light mode');
  return h('header.topbar', null,
    h('a.brand', { href: '#/' }, logo(), h('span', null, 'ROOK', h('b', null, 'STORM'))),
    h('nav.nav', null, NAV.map(([r, label, ic]) => h('a', { href: '#/' + r, 'data-r': r }, icon(ic), h('span', null, label)))),
    h('div.top-actions', null,
      themeBtn,
      btn(icon('gear'), openSettings, 'icon ghost', 'Settings'),
      btn(icon('menu'), () => document.body.classList.toggle('nav-open'), 'icon ghost menu-btn', 'Menu')));
}

export function logo() {
  const d = h('span.logo', { html: '<svg viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="112" fill="currentColor" opacity=".12"/><path d="M168 132h40v40h32v-40h32v40h32v-40h40v88l-36 30v104l36 34v42H168v-42l36-34V250l-36-30z" fill="var(--gold)"/><path d="M300 96l-70 150h52l-36 150 104-176h-56l42-124z" fill="var(--accent)"/></svg>' });
  return d;
}

function openSettings() {
  const sel = (label: string, key: keyof typeof settings, opts: [string, string][]) =>
    h('label.field', null, h('span', null, label),
      h('select', { onchange: (e: any) => { (settings as any)[key] = e.target.value; saveSettings(); } },
        opts.map(([v, t]) => h('option', { value: v, selected: settings[key] === v }, t))));
  const chk = (label: string, key: keyof typeof settings) =>
    h('label.check', null, h('input', { type: 'checkbox', checked: !!settings[key], onchange: (e: any) => { (settings as any)[key] = e.target.checked; saveSettings(); } }), label);
  const close = modal(h('div.settings', null,
    h('h2', null, 'Settings'),
    sel('Theme', 'theme', [['system', 'Match my device'], ['light', 'Light'], ['dark', 'Dark']]),
    sel('Board colors', 'board', [['wood', 'Wood'], ['blue', 'Ice blue'], ['green', 'Tournament green'], ['slate', 'Slate']]),
    h('label.field', null, h('span', null, 'Your name (shown to online opponents)'),
      h('input', { value: settings.name, maxLength: 20, placeholder: 'Anonymous', oninput: (e: any) => { settings.name = e.target.value.slice(0, 20); saveSettings(); } })),
    chk('Sounds', 'sound'), chk('Board coordinates', 'coords'), chk('Piece animation', 'animation'),
    h('p.muted.small', null, 'Board and animation changes apply to newly opened boards.'),
    h('div.row.end', null, btn('Done', () => close(), 'primary'))));
}

function homePage(root: HTMLElement) {
  const card = (href: string, ic: string, title: string, text: string, cls = '') =>
    h('a.card.feature' + (cls ? '.' + cls : ''), { href: '#/' + href }, h('div.f-ic', null, icon(ic)), h('h3', null, title), h('p', null, text));
  root.append(
    h('section.hero', null,
      h('div.hero-text', null,
        h('h1', null, 'Play. Learn. ', h('span.grad', null, 'Dominate.')),
        h('p.lead', null, 'Face Stockfish 17 at any rating from 100 to 3200, review your games move by move, master every named opening and train on an endless stream of puzzles. Everything works offline.'),
        h('div.row.wrap', null,
          h('a.btn.primary.big', { href: '#/play' }, icon('cpu'), 'Play the bot'),
          h('a.btn.big', { href: '#/play/online' }, icon('globe'), 'Play online'),
          h('a.btn.big', { href: '#/puzzles' }, icon('puzzle'), 'Puzzles'))),
      h('div.hero-board', { 'aria-hidden': 'true', html: heroBoard() })),
    h('section.features', null,
      card('play', 'cpu', 'Bot at any Elo', 'Type a rating from 100 to 3200. Stockfish adapts, from beginner to engine strength.'),
      card('play/friend', 'link', 'Play a friend', 'Send a link and play in real time, or pass-and-play on one device with auto-flip.'),
      card('play/online', 'globe', 'Online arena', 'Get matched with another player in your chosen time control.'),
      card('puzzles', 'puzzle', 'Infinite puzzles', `Rated puzzles that adapt to you. Your rating: ${Math.round(puzzleRating())}.`),
      card('openings', 'book', 'Opening library', 'All 3,800+ named openings and variations. Browse, explore and drill them.'),
      card('analysis', 'chart', 'Game review', 'Accuracy, blunders, mistakes, brilliant moves and the best alternatives.'),
      card('editor', 'edit', 'Board editor', 'Set up any position and ask the engine for the best move.')),
    h('p.footer-note', null, 'Engine: Stockfish 17.1 (GPLv3). Openings and puzzles: lichess.org open databases (CC0).'));
}

function heroBoard(): string {
  const pos = 'r1bqk2r/pppp1Bpp/2n2n2/2b1p3/4P3/5N2/PPPP1PPP/RNBQK2R';
  const roles: Record<string, string> = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' };
  let cells = '';
  pos.split('/').forEach((row, r) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { for (let i = 0; i < +ch; i++, f++) cells += `<div class="hb-sq ${(r + f) % 2 ? 'd' : 'l'}"></div>`; }
      else { const color = ch === ch.toUpperCase() ? 'white' : 'black'; cells += `<div class="hb-sq ${(r + f) % 2 ? 'd' : 'l'}"><piece class="${roles[ch.toLowerCase()]} ${color}"></piece></div>`; f++; }
    }
  });
  return `<div class="hb cg-wrap pc">${cells}</div>`;
}

function init() {
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  document.body.append(header(), main,
    h('nav.tabbar', null, [['', 'Home', 'home'], ...NAV].map(([r, label, ic]) =>
      h('a', { href: '#/' + r, 'data-r': r }, icon(ic), h('span', null, label.split(' ')[0])))));
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', (e) => { if (leaveGuard) { e.preventDefault(); e.returnValue = ''; } });
  route();
}

init();

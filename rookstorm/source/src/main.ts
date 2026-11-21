import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.cburnett.css';
import './style.css';
import { h, icon, settings, saveSettings, applyTheme, modal, btn, offerBar, clearOffers, toast } from './ui';
import { t, LANGS, setLang, detectLang } from './i18n';
import { accountPage, profilePage, friendsPage, watchPage, legalPage } from './pages/social';
import { me, initAccount, onAccount, onChallenges, accountsEnabled, rpc, niceError, Challenge } from './account';
import { variantName } from './chess';
import { tcLabel } from './pages/play';
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
  account: accountPage, profile: profilePage, friends: friendsPage, watch: watchPage,
  privacy: (r) => legalPage(r, 'privacy'), terms: (r) => legalPage(r, 'terms'),
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
  const navName = name === 'game' || name === 'join' ? 'play' : name === 'profile' ? 'account' : name === 'watch' ? 'friends' : name;
  document.querySelectorAll('.nav a, .tabbar a, .top-actions a').forEach(a => a.classList.toggle('active', a.getAttribute('data-r') === navName));
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
  }, 'icon ghost', t('Toggle dark / light mode'));
  const friendsBtn = h('a.btn.icon.ghost.friends-btn', { href: '#/friends', 'data-r': 'friends', title: t('Friends'), 'aria-label': t('Friends') }, icon('users'), h('span.badge-dot'));
  const accBtn = h('a.btn.ghost.acc-btn', { href: '#/account', 'data-r': 'account' });
  const renderAcc = () => {
    friendsBtn.style.display = accountsEnabled() && me ? '' : 'none';
    accBtn.style.display = accountsEnabled() ? '' : 'none';
    accBtn.replaceChildren(...(me ? [h('span.avatar.xs', null, me.username[0].toUpperCase()), h('span.acc-name', null, me.username)] : [h('span.acc-name', null, t('Sign in'))]));
    accBtn.setAttribute('title', me ? t('Your profile') : t('Sign in'));
  };
  renderAcc();
  onAccount(renderAcc);
  return h('header.topbar', null,
    h('a.brand', { href: '#/', 'aria-label': 'Rookstorm' }, logo(), h('span', null, 'ROOK', h('b', null, 'STORM'))),
    h('nav.nav', null, NAV.map(([r, label, ic]) => h('a', { href: '#/' + r, 'data-r': r }, icon(ic), h('span', null, t(label))))),
    h('div.top-actions', null,
      friendsBtn, accBtn, themeBtn,
      btn(icon('gear'), openSettings, 'icon ghost', t('Settings')),
      btn(icon('menu'), () => document.body.classList.toggle('nav-open'), 'icon ghost menu-btn', t('Menu'))));
}

export function logo() {
  const d = h('span.logo', { html: '<svg viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="112" fill="currentColor" opacity=".12"/><path d="M168 132h40v40h32v-40h32v40h32v-40h40v88l-36 30v104l36 34v42H168v-42l36-34V250l-36-30z" fill="var(--gold)"/><path d="M300 96l-70 150h52l-36 150 104-176h-56l42-124z" fill="var(--accent)"/></svg>' });
  return d;
}

function openSettings() {
  const sel = (label: string, key: keyof typeof settings, opts: [string, string][], after?: () => void) =>
    h('label.field', null, h('span', null, label),
      h('select', { onchange: (e: any) => { (settings as any)[key] = e.target.value; saveSettings(); after?.(); } },
        opts.map(([v, tx]) => h('option', { value: v, selected: settings[key] === v }, tx))));
  const chk = (label: string, key: keyof typeof settings, hint?: string) =>
    h('label.check', null, h('input', { type: 'checkbox', checked: !!settings[key], onchange: (e: any) => { (settings as any)[key] = e.target.checked; saveSettings(); } }),
      h('span', null, label, hint ? h('span.muted.small.block', null, hint) : null));
  const close = modal(h('div.settings', null,
    h('h2', null, t('Settings')),
    h('h3.set-h', null, t('Appearance')),
    sel(t('Language'), 'lang', [['', t('Match my device')], ...LANGS], async () => { await setLang(detectLang(settings.lang)); close(); rebuild(); }),
    sel(t('Theme'), 'theme', [['system', t('Match my device')], ['light', t('Light')], ['dark', t('Dark')]]),
    sel(t('Board colors'), 'board', [['wood', t('Wood')], ['blue', t('Ice blue')], ['green', t('Tournament green')], ['slate', t('Slate')]]),
    chk(t('Board coordinates'), 'coords'), chk(t('Piece animation'), 'animation'),
    h('h3.set-h', null, t('Game')),
    chk(t('Sounds'), 'sound'),
    chk(t('Premoves'), 'premove', t('Plan your next move while your opponent is thinking')),
    chk(t('Show capture points on the board'), 'points', t('Taking a bishop shows +3, losing one shows −3.')),
    me ? null : h('label.field', null, h('span', null, t('Your name (shown to online opponents)')),
      h('input', { value: settings.name, maxLength: 20, placeholder: t('Anonymous'), oninput: (e: any) => { settings.name = e.target.value.slice(0, 20); saveSettings(); } })),
    h('p.muted.small', null, t('Board and animation changes apply to newly opened boards.')),
    h('div.row.end', null, btn(t('Done'), () => close(), 'primary'))));
}

function homePage(root: HTMLElement) {
  const card = (href: string, ic: string, title: string, text: string) =>
    h('a.card.feature', { href: '#/' + href }, h('div.f-ic', null, icon(ic)), h('h3', null, title), h('p', null, text));
  root.append(
    h('section.hero', null,
      h('div.hero-text', null,
        h('h1', null, t('Play. Learn.') + ' ', h('span.grad', null, t('Dominate.'))),
        h('p.lead', null, t('Face Stockfish 17 at any rating from 100 to 3200, play every chess variant, review your games move by move, master every named opening and train on an endless stream of puzzles. Everything works offline.')),
        h('div.row.wrap', null,
          h('a.btn.primary.big', { href: '#/play' }, icon('cpu'), t('Play the bot')),
          h('a.btn.big', { href: '#/play/online' }, icon('globe'), t('Play online')),
          h('a.btn.big', { href: '#/puzzles' }, icon('puzzle'), t('Puzzles')))),
      h('div.hero-board', { 'aria-hidden': 'true', html: heroBoard() })),
    h('section.features', null,
      card('play', 'cpu', t('Bot at any Elo'), t('Type a rating from 100 to 3200. Stockfish adapts, from beginner to engine strength.')),
      card('play/friend', 'link', t('Play a friend'), t('Send a link and play in real time, or pass-and-play on one device with auto-flip.')),
      card('play/online', 'globe', t('Online arena'), t('Get matched with another player in your chosen time control.')),
      accountsEnabled() ? card(me ? 'friends' : 'account/new', 'users', t('Accounts and friends'), t('Keep your ratings (everyone starts at 1500), add friends, challenge them and watch their games live.')) : null,
      card('puzzles', 'puzzle', t('Infinite puzzles'), t('Rated puzzles that adapt to you. Your rating: {0}.', Math.round(puzzleRating()))),
      card('openings', 'book', t('Opening library'), t('All 3,800+ named openings and variations. Browse, explore and drill them.')),
      card('analysis', 'chart', t('Game review'), t('Accuracy, game rating, blunders, mistakes, brilliant moves and the best alternatives.')),
      card('editor', 'edit', t('Board editor'), t('Set up any position and ask the engine for the best move.'))),
    h('p.footer-note', null, t('Engine: Stockfish 17.1 (GPLv3). Openings and puzzles: lichess.org open databases (CC0).'), ' ',
      h('a', { href: '#/privacy' }, t('Privacy policy')), ' · ', h('a', { href: '#/terms' }, t('Terms'))));
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

let headerEl: HTMLElement | null = null, tabbarEl: HTMLElement | null = null;
function buildChrome() {
  headerEl?.remove(); tabbarEl?.remove();
  headerEl = header();
  tabbarEl = h('nav.tabbar', null, [['', 'Home', 'home'], ...NAV].map(([r, label, ic]) =>
    h('a', { href: '#/' + r, 'data-r': r }, icon(ic), h('span', null, t(label)))));
  document.body.prepend(headerEl);
  document.body.append(tabbarEl);
}
/** Re-render everything after a language change. */
function rebuild() {
  buildChrome();
  if (location.hash.startsWith('#/game')) { toast(t('The new language applies to the next game.')); return; }
  route();
}

// challenge notifications from friends
const shownChallenges = new Set<string>();
function showChallenges(list: Challenge[]) {
  const incoming = list.filter(c => c.incoming);
  const dot = document.querySelector('.friends-btn .badge-dot') as HTMLElement | null;
  if (dot) dot.style.display = incoming.length ? 'block' : 'none';
  document.querySelectorAll('#offers [data-kind^="ch-"]').forEach(el => { if (!incoming.some(c => 'ch-' + c.id === el.getAttribute('data-kind'))) el.remove(); });
  for (const c of incoming) {
    if (shownChallenges.has(c.id)) continue;
    shownChallenges.add(c.id);
    const color = c.color === 'random' ? t('random colors') : c.color === 'white' ? t('they play White') : t('they play Black');
    offerBar('ch-' + c.id, t('{0} challenges you: {1}, {2}, {3}', c.from_name, variantName(c.variant), c.time_base ? tcLabel(c.time_base, c.time_inc) : '∞', color) + (c.rated ? ', ' + t('rated') : ''), [
      btn(t('Accept'), async () => {
        clearOffers('ch-' + c.id);
        try { const code = await rpc<string | null>('challenge_respond', { p_id: c.id, p_accept: true }); if (code) go('join/' + code); else toast(t('This challenge has expired.')); }
        catch (e) { toast(niceError(e)); }
      }, 'primary small'),
      btn(t('Decline'), () => { clearOffers('ch-' + c.id); rpc('challenge_respond', { p_id: c.id, p_accept: false }).catch(() => {}); }, 'small')]);
  }
}

async function init() {
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  await setLang(detectLang(settings.lang));
  document.body.append(main);
  buildChrome();
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', (e) => { if (leaveGuard) { e.preventDefault(); e.returnValue = ''; } });
  onChallenges(showChallenges);
  route();
  initAccount().catch(() => {});
}

init();

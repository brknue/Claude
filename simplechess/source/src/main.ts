import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.cburnett.css';
import './style.css';
import './plain.css';
import { h, icon, settings, saveSettings, applyTheme, modal, closeModals, btn, offerBar, clearOffers, toast, appBridge, inApp, isIOS, isAndroid, installed, loadRaw, save, askConfirm } from './ui';
import { t, LANGS, setLang, detectLang } from './i18n';
import { accountPage, profilePage, friendsPage, watchPage, legalPage } from './pages/social';
import { me, initAccount, onAccount, onChallenges, accountsEnabled, rpc, niceError, Challenge } from './account';
import { variantName } from './chess';
import { tcLabel } from './pages/play';
import { tablePage } from './pages/party';
import { playSetupPage, gamePage, joinPage, hasPendingGame } from './pages/play';
import { analysisPage } from './pages/analysis';
import { learnPage, lessonPage, coursePage } from './pages/learn';
import { newsPage, announceVersion, VERSION } from './pages/news';
import { editorPage } from './pages/editor';
import { openingsPage } from './pages/openings';
import { puzzlesPage } from './pages/puzzles';
import { puzzleRating } from './pages/puzzles';
import { chatListPage } from './pages/chat';
import { adminPage, staff } from './pages/admin';
import { badgeEls } from './badges';
import { dailyPage } from './pages/daily';
import { puzzleDayPage, puzzleCalendarPage, resultOf, currentPeriod, msLeft, countdown } from './pages/dailypuzzle';
import { initNotify, onCounts, setPopup, setNotify, notifyOn, webNotifySupported } from './notify';

export type Cleanup = (() => void) | void;
type PageFn = (root: HTMLElement, arg?: string) => Cleanup;

const routes: Record<string, PageFn> = {
  '': homePage, play: playSetupPage, game: gamePage, join: joinPage,
  analysis: analysisPage, editor: editorPage, openings: openingsPage, puzzles: puzzlesPage,
  learn: learnPage, lesson: lessonPage, course: coursePage, news: newsPage,
  table: tablePage, chat: chatListPage, daily: dailyPage, app: appPage, admin: adminPage,
  dpuzzle: (r, a) => puzzleDayPage('daily', r, a), wpuzzle: (r, a) => puzzleDayPage('weekly', r, a), pcalendar: puzzleCalendarPage,
  account: accountPage, profile: profilePage, friends: friendsPage, watch: watchPage,
  privacy: (r) => legalPage(r, 'privacy'), terms: (r) => legalPage(r, 'terms'),
};

const NAV = [
  ['play', 'Play', 'play'], ['puzzles', 'Puzzles', 'puzzle'], ['learn', 'Learn', 'school'], ['openings', 'Openings', 'book'],
  ['analysis', 'Analysis', 'chart'], ['editor', 'Editor', 'edit'],
] as const;

let cleanup: Cleanup;
/** true inside the window that shows a page on top of a running game (see openAside) */
export const embedded = new URLSearchParams(location.search).has('embed');
const IN_GAME = 'sc.inGame';
const inGameElsewhere = () => { try { return Date.now() - Number(localStorage.getItem(IN_GAME) || 0) < 7000; } catch { return false; } };
/** pages where a game is on screen: links open without leaving it */
const gameRoute = () => /^#\/(game|table|watch|daily\/[0-9a-f-]{8,})/.test(location.hash);

/**
 * Open a page without leaving the current game: a new tab in browsers; in the installed apps (no tabs) a
 * full-screen window on top of the game with a "Back to the game" button. The game keeps running either way.
 */
export function openAside(href: string) {
  const standalone = inApp || !!(navigator as any).standalone || matchMedia('(display-mode: standalone)').matches;
  const url = location.href.split('#')[0].split('?')[0];
  if (!standalone) {
    const w = window.open(url + href, '_blank');
    if (w) return;
  }
  document.querySelector('.aside-win')?.remove();
  const close = () => { win.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  const win = h('div.aside-win', { role: 'dialog', 'aria-modal': 'true' },
    h('div.aside-bar', null, btn(h('span', null, icon('back'), t('Back to the game')), close, 'primary small'), h('b', null, 'Simple Chess')),
    h('iframe', { src: url + '?embed=1' + href, title: 'Simple Chess' }));
  document.body.appendChild(win);
  document.addEventListener('keydown', onKey);
}
const main = h('main', { id: 'app' });

/** Hook a page can set to confirm leaving (e.g. a game in progress). */
export let leaveGuard: (() => boolean) | null = null;
export const setLeaveGuard = (f: (() => boolean) | null) => { leaveGuard = f; };
let lastHash = location.hash;

/**
 * A game against a person can be left without losing it: the page is "parked" (kept running, off screen) and a bar
 * on every other page leads back. The game page describes itself with this hook while it can be parked.
 */
export interface ParkHook { label: () => string; over: () => boolean; onPark: () => void; onResume: () => void }
let parkHook: ParkHook | null = null;
export const setParkable = (p: ParkHook | null) => { parkHook = p; };
let parked: { el: HTMLElement; cleanup: Cleanup; hook: ParkHook } | null = null;
export const gameParked = () => !!parked && !parked.hook.over();

function parkBar() {
  let bar = document.querySelector('.parked-bar') as HTMLElement | null;
  if (!parked || /^#\/game/.test(location.hash) || embedded) { bar?.remove(); return; }
  const over = parked.hook.over();
  if (!bar) {
    bar = h('div.announce.parked-bar', null, h('span.parked-text'), btn('', () => go('game'), 'small primary'));
    document.body.insertBefore(bar, document.querySelector('main'));
  }
  bar.classList.toggle('over', over);
  bar.querySelector('.parked-text')!.textContent = parked.hook.label();
  const b = bar.querySelector('button')!;
  const label = over ? t('See the result') : t('Back to the game');
  if (b.textContent !== label) b.textContent = label;
}
setInterval(parkBar, 1000);

function route() {
  const canPark = !!parkHook && !parkHook.over();
  if (leaveGuard && !canPark && location.hash !== lastHash) {
    // leaving a running game (back button, typed address): ask in the page, stay until confirmed
    const target = location.hash;
    history.replaceState(null, '', lastHash || '#/');
    if (leaveGuard()) askConfirm(t('Leave this game? It will be lost.'), { ok: t('Leave'), danger: true }).then(ok => { if (ok) { leaveGuard = null; location.hash = target; } });
    return;
  }
  lastHash = location.hash;
  closeModals();
  const [name, arg] = location.hash.replace(/^#\/?/, '').split('/');
  const fn = routes[name] || homePage;
  // leaving a running game against a person: keep it going in the background
  if (canPark && main.className === 'page-game' && name !== 'game') {
    if (parked) parked.cleanup?.();
    const el = document.createElement('div');
    while (main.firstChild) el.appendChild(main.firstChild);
    parked = { el, cleanup, hook: parkHook! };
    parkHook = null; leaveGuard = null; cleanup = undefined;
    parked.hook.onPark();
  }
  // back to the parked game
  if (name === 'game' && parked && !hasPendingGame()) {
    if (typeof cleanup === 'function') cleanup();
    main.innerHTML = '';
    main.className = 'page-game';
    document.querySelectorAll('.nav a, .tabbar a, .top-actions a').forEach(a => a.classList.toggle('active', a.getAttribute('data-r') === 'play'));
    document.body.classList.remove('nav-open');
    window.scrollTo(0, 0);
    const p = parked; parked = null;
    while (p.el.firstChild) main.appendChild(p.el.firstChild);
    cleanup = p.cleanup; parkHook = p.hook;
    p.hook.onResume();
    parkBar();
    return;
  }
  // a new game replaces the parked one (it counts as left)
  if (name === 'game' && parked) { const p = parked; parked = null; p.cleanup?.(); }
  if (typeof cleanup === 'function') cleanup();
  cleanup = undefined;
  main.innerHTML = '';
  main.className = 'page-' + (name || 'home');
  const navName = name === 'lesson' || name === 'course' ? 'learn' : name === 'dpuzzle' || name === 'wpuzzle' || name === 'pcalendar' ? 'puzzles' : name === 'game' || name === 'join' || name === 'table' || name === 'daily' ? 'play' : name === 'profile' ? 'account' : name === 'watch' ? 'friends' : name;
  document.querySelectorAll('.nav a, .tabbar a, .top-actions a').forEach(a => a.classList.toggle('active', a.getAttribute('data-r') === navName));
  document.body.classList.remove('nav-open');
  window.scrollTo(0, 0);
  cleanup = fn(main, arg ? decodeURIComponent(arg) : undefined);
  parkBar();
}

export function go(path: string) {
  if (location.hash === '#/' + path) route(); else location.hash = '#/' + path;
}

/**
 * Offline copy + updates. The service worker keeps the site on the device; when a new version is published it is
 * downloaded in the background and this page switches to it (reloads), unless a game is in progress: then a
 * "Reload" button waits. Checks on start, whenever the app comes back to the screen, and every 30 minutes.
 */
/** Site-wide message from the admins (read without loading the account library). */
async function showAnnouncement() {
  if (!accountsEnabled()) return;
  let a: any = null;
  try { const c = JSON.parse(sessionStorage.getItem('sc.announce') || 'null'); if (c && Date.now() - c.t < 300000) a = c.a; } catch { /* */ }
  if (!a) {
    try {
      const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('./config');
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_announcement`, { method: 'POST', headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: '{}' });
      a = r.ok ? await r.json() : null;
      try { sessionStorage.setItem('sc.announce', JSON.stringify({ t: Date.now(), a })); } catch { /* */ }
    } catch { return; }
  }
  if (!a?.text || loadRaw('announceClosed', '') === a.at) return;
  const bar = h('div.announce', { class: a.level || 'info' }, h('span', null, a.text),
    h('button.btn.icon.ghost.small', { type: 'button', 'aria-label': t('Close'), onclick: () => { save('announceClosed', a.at); bar.remove(); } }, '✕'));
  document.body.insertBefore(bar, document.querySelector('main'));
}
function showBan() {
  document.querySelector('.ban-bar')?.remove();
  const b = (me as any)?.banned_until;
  if (!b || Date.parse(b) < Date.now()) return;
  document.body.insertBefore(h('div.announce.warning.ban-bar', null, h('span', null, t('Your account is banned until {0}.', new Date(b).toLocaleString()), (me as any).ban_reason ? ' ' + t('Reason: {0}', (me as any).ban_reason) : '')), document.querySelector('main'));
}

function backBar() {
  const show = !embedded && !leaveGuard && inGameElsewhere() && !gameRoute();
  const bar = document.querySelector('.game-elsewhere');
  if (!show) { bar?.remove(); return; }
  if (bar) return;
  const canClose = !!window.opener;
  document.body.insertBefore(h('div.announce.success.game-elsewhere', null, h('span', null, t('Your game is still running in your other tab.')),
    canClose ? btn(t('Back to the game'), () => { try { window.opener?.focus(); } catch { /* */ } window.close(); }, 'small primary') : null), document.querySelector('main'));
}

function setupUpdates() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  let hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  const busy = () => !!leaveGuard || gameParked() || /^#\/(game|table|join)/.test(location.hash)
    || [...document.querySelectorAll('textarea, input:not([type=checkbox]):not([type=range])')].some(el => (el as HTMLInputElement).value && el === document.activeElement);
  const reload = () => { if (reloading) return; reloading = true; location.reload(); };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return; } // first install took over this page: nothing to switch from
    if (!busy()) { reload(); return; }
    offerBar('update', t('A new version of Simple Chess is ready.'), [btn(t('Reload'), () => reload(), 'primary small'), btn(t('Later'), () => clearOffers('update'), 'small ghost')]);
  });
  const start = async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
      const check = () => { reg.update().catch(() => {}); };
      setInterval(check, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
      window.addEventListener('online', check);
    } catch { /* private mode etc.: the site still works online */ }
  };
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
}

/** Android app version from its user agent ("SimpleChessApp/3"), 0 when not in the app */
const appVer = () => Number(/SimpleChessApp\/(\d+)/.exec(navigator.userAgent)?.[1] || 0);

/** Settings → Check for updates: a newer Android app (download it?) and a newer website version (reload?). */
async function checkUpdates() {
  toast(t('Checking for updates…'));
  let v: { build: string; android: number } | null = null;
  try { v = await (await fetch('version.json?t=' + Date.now(), { cache: 'no-store' })).json(); } catch { toast(t('No connection. Try again when you are online.')); return; }
  if (!v) return;
  const { APK_DOWNLOAD } = await import('./config');
  // 1. the Android app itself
  if (inApp && appVer() && v.android > appVer()) {
    if (await askConfirm(t('A new Android app (version {0}) is available. Download it to update?', v.android) + ' ' + t('After the download, open the file and tap Install. Your games and settings stay.'), { ok: t('Download') })) location.href = APK_DOWNLOAD;
    return;
  }
  // 2. the website (also what the iPhone / Android apps show)
  if (v.build !== __BUILD__) {
    if (await askConfirm(t('A new version of Simple Chess is ready ({0}). Update now?', v.build), { ok: t('Update') })) {
      try { const reg = await navigator.serviceWorker?.getRegistration(); await reg?.update(); } catch { /* */ }
      setTimeout(() => location.reload(), 1200);
    }
    return;
  }
  toast(t('You have the newest version.'));
}

function themeIcon() { return icon(settings.theme === 'dark' ? 'moon' : settings.theme === 'light' ? 'sun' : 'half'); }

function header() {
  const themeBtn = btn(themeIcon(), () => {
    settings.theme = settings.theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark') : settings.theme === 'dark' ? 'light' : 'dark';
    saveSettings(); themeBtn.replaceChildren(themeIcon());
  }, 'icon ghost theme-btn', t('Toggle dark / light mode'));
  const adminBtn = h('a.btn.icon.ghost.admin-btn', { href: '#/admin', 'data-r': 'admin', title: 'Admin', 'aria-label': 'Admin' }, 'Admin');
  const chatBtn = h('a.btn.icon.ghost.chat-btn', { href: '#/chat', 'data-r': 'chat', title: t('Messages'), 'aria-label': t('Messages') }, icon('chat'), h('span.count-badge.hdr'));
  const friendsBtn = h('a.btn.icon.ghost.friends-btn', { href: '#/friends', 'data-r': 'friends', title: t('Friends'), 'aria-label': t('Friends') }, icon('users'), h('span.badge-dot'));
  const accBtn = h('a.btn.ghost.acc-btn', { href: '#/account', 'data-r': 'account' });
  const renderAcc = () => {
    friendsBtn.style.display = accountsEnabled() && me ? '' : 'none';
    chatBtn.style.display = accountsEnabled() && me ? '' : 'none';
    adminBtn.style.display = staff() ? '' : 'none';
    bar?.classList.toggle('signed', accountsEnabled() && !!me);
    accBtn.style.display = accountsEnabled() ? '' : 'none';
    accBtn.replaceChildren(...(me ? [h('span.avatar.xs', null, me.username[0].toUpperCase()), h('span.acc-name', null, me.username, ...badgeEls(((me as any).roles || []).slice(0, 2)))] : [icon('user'), h('span.acc-name.signin', null, t('Sign in'))]));
    accBtn.setAttribute('aria-label', me ? t('Your profile') : t('Sign in'));
    accBtn.setAttribute('title', me ? t('Your profile') : t('Sign in'));
  };
  let bar: HTMLElement | null = null;
  onAccount(renderAcc);
  bar = h('header.topbar', null,
    h('a.brand', { href: '#/', 'aria-label': 'Simple Chess' }, logo(), h('span', null, 'Simple Chess')),
    h('nav.nav', null, NAV.map(([r, label, ic]) => h('a', { href: '#/' + r, 'data-r': r }, icon(ic), h('span', null, t(label))))),
    h('div.top-actions', null,
      adminBtn, chatBtn, friendsBtn, accBtn, themeBtn,
      btn(icon('gear'), openSettings, 'icon ghost', t('Settings')),
      btn(icon('menu'), () => document.body.classList.toggle('nav-open'), 'icon ghost menu-btn', t('Menu'))));
  renderAcc();
  return bar;
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
    accountsEnabled() ? [
      h('h3.set-h', null, t('Notifications')),
      appBridge && !appBridge.notify ? h('p.muted.small', null, t('Update the Android app to get notifications:'), ' ', h('a', { href: APK, download: 'simplechess.apk' }, t('Install the Android app')))
      : appBridge || webNotifySupported() ? h('label.check', null, h('input', { type: 'checkbox', checked: notifyOn(), onchange: async (e: any) => { const on = await setNotify(e.target.checked); e.target.checked = on; if (e.target.checked !== on || (!on && !appBridge && 'Notification' in window && Notification.permission === 'denied')) toast(t('Notifications are blocked. Allow them for this site in your browser settings.')); } }),
        h('span', null, t('Notify me about messages, challenges and daily games'), h('span.muted.small.block', null, appBridge ? t('Also when the app is closed (checked about every 15 minutes).') : t('While Simple Chess is open in a tab, even in the background.'))))
        : h('p.muted.small', null, t('This browser does not support notifications. On iPhone, add Simple Chess to the Home Screen first.'))] : null,
    inApp ? null : [
      h('h3.set-h', null, isIOS ? t('iPhone app') : t('Android app')),
      isIOS
        ? (installed ? h('p.muted.small', null, t('Simple Chess is installed on this device.')) : [h('a.btn.block', { href: '#/app', onclick: () => close() }, icon('phone'), t('Install on iPhone or iPad')),
          h('p.muted.small', null, t('Free, from Safari: Share, then Add to Home Screen.'))])
        : [h('a.btn.block', { href: APK, download: 'simplechess.apk' }, icon('phone'), t('Install the Android app')),
          h('p.muted.small', null, t('Free, about 20 KB. Plays with website players. When you open the file, Android asks you to allow installing it.'))]],
    h('h3.set-h', null, t('App updates')),
    h('div.row.wrap.update-row', null, btn(h('span', null, icon('retry'), t('Check for updates')), () => checkUpdates(), ''), h('span.muted.small.version', null, t('Version {0}', VERSION), ' (' + __BUILD__ + ')', appVer() ? ' · ' + t('Android app {0}', appVer()) : '')),
    h('a.btn.block.news-link', { href: '#/news', onclick: () => close() }, icon('star'), t('What\'s new')),
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
          h('a.btn.big', { href: '#/puzzles' }, icon('puzzle'), t('Puzzles')),
          !inApp && isAndroid ? h('a.btn.big', { href: APK, download: 'simplechess.apk' }, icon('phone'), t('Android app')) : null,
          isIOS && !installed ? h('a.btn.big', { href: '#/app' }, icon('phone'), t('iPhone app')) : null)),
      h('div.hero-board', { 'aria-hidden': 'true', html: heroBoard() })),
    h('section.features', null,
      card('play', 'cpu', t('Bot at any Elo'), t('Type a rating from 100 to 3200. Stockfish adapts, from beginner to engine strength.')),
      accountsEnabled() ? card('daily', 'calendar', t('Daily games'), t('Play friends at your own pace: a few days per move, with notifications and a daily rating.')) : null,
      accountsEnabled() ? card(me ? 'chat' : 'account/new', 'chat', t('Chat with friends'), t('Message your friends and send them games you played to replay and analyse.')) : null,
      card('play/friend', 'link', t('Play a friend'), t('Send a link and play in real time, or pass-and-play on one device with auto-flip.')),
      card('play/online', 'globe', t('Online arena'), t('Get matched with another player in your chosen time control.')),
      accountsEnabled() ? card(me ? 'friends' : 'account/new', 'users', t('Accounts and friends'), t('Keep your ratings (everyone starts at 1500), add friends, challenge them and watch their games live.')) : null,
      card('dpuzzle', 'calendar', t('Daily and weekly puzzles'), dailyCardText()),
      card('puzzles', 'puzzle', t('Infinite puzzles'), t('Rated puzzles that adapt to you. Your rating: {0}.', Math.round(puzzleRating()))),
      card('learn', 'school', t('Lessons and courses'), t('Learn checkmates, tactics and endgames with exercises, and opening courses move by move.')),
      card('openings', 'book', t('Opening library'), t('All 3,800+ named openings and variations. Browse, explore and drill them.')),
      card('analysis', 'chart', t('Game review'), t('Accuracy, game rating, blunders, mistakes, brilliant moves and the best alternatives.')),
      card('editor', 'edit', t('Board editor'), t('Set up any position and ask the engine for the best move.'))),
    h('p.footer-note', null, t('Engine: Stockfish 17.1 (GPLv3). Openings and puzzles: lichess.org open databases (CC0).'), ' ',
      h('a', { href: '#/news' }, t('What\'s new') + ' · ' + VERSION), ' · ', h('a', { href: '#/privacy' }, t('Privacy policy')), ' · ', h('a', { href: '#/terms' }, t('Terms')),
      installed ? null : [' · ', h('a', { href: '#/app' }, t('Get the app'))]));
  if (isIOS && !installed && !loadRaw('iosBannerClosed', false)) {
    const banner = h('div.notify-banner.ios-banner', null, h('span', null, icon('phone'), ' ', t('Get Simple Chess on your iPhone: free, full screen, works offline.')),
      h('div.row', null, h('a.btn.small.primary', { href: '#/app' }, t('How to install')),
        h('button.btn.small.ghost', { type: 'button', onclick: () => { save('iosBannerClosed', true); banner.remove(); } }, t('Not now'))));
    root.prepend(banner);
  }
}

/** How to get the app on every kind of device. */
function appPage(root: HTMLElement) {
  const shareIc = '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 11v10h14V11"/></svg>';
  const addIc = '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><path d="M4 4h16v16H4zM12 8v8M8 12h8"/></svg>';
  const step = (n: number, text: string, extra?: HTMLElement | string) => h('li.app-step', null, h('span.app-num', null, String(n)), h('div', null, h('b', null, text), extra ? h('div.muted.small', null, extra) : null));
  // in-app browsers (Instagram, Facebook, …) cannot add to the Home Screen; Safari, Chrome and Edge can
  const inAppBrowser = /Instagram|FBAN|FBAV|Line\//.test(navigator.userAgent);
  const ios = h('section.card.app-card', { id: 'iphone' },
    h('h2', null, t('iPhone and iPad')),
    installed && isIOS ? h('p.app-done', null, '✓ ', t('Simple Chess is installed on this device.')) : null,
    h('p.muted', null, t('Install Simple Chess from Safari in a few seconds. It is free, gets its own icon, opens full screen, works offline and always has the newest version.')),
    h('ol.app-steps', null,
      step(1, t('Open this page in Safari.'), inAppBrowser ? t('You are in another app: tap its menu and choose Open in Safari.') : t('Chrome and Edge on iPhone work too, through their Share menu.')),
      step(2, t('Tap the Share button.'), h('span', { html: shareIc + ' ' + t('At the bottom of the screen (on iPad: at the top).') })),
      step(3, t('Scroll down and tap Add to Home Screen.'), h('span', { html: addIc + ' ' + t('If you do not see it, tap Edit Actions and add it.') })),
      step(4, t('Tap Add.'), t('Simple Chess now has its own icon on your Home Screen.'))),
    h('p.muted.small', null, t('Notifications: open Simple Chess from the Home Screen icon, sign in, then turn on notifications in Settings (needs iOS 16.4 or newer).')));
  const android = h('section.card.app-card', { id: 'android' },
    h('h2', null, t('Android')),
    inApp ? h('p.app-done', null, '✓ ', t('Simple Chess is installed on this device.')) : null,
    h('p.muted', null, t('Free, about 30 KB. Plays with website players. When you open the file, Android asks you to allow installing it.')),
    inApp ? null : h('a.btn.primary', { href: APK, download: 'simplechess.apk' }, icon('phone'), t('Install the Android app')));
  const pc = h('section.card.app-card', { id: 'computer' },
    h('h2', null, t('Computer')),
    h('p.muted', null, t('In Chrome or Edge, click the install icon at the right end of the address bar. Simple Chess then opens in its own window and works offline.')));
  const cards = isIOS ? [ios, android, pc] : isAndroid ? [android, ios, pc] : [pc, ios, android];
  root.append(h('div.app-page', null, h('h1', null, t('Get the app')),
    h('p.lead.muted', null, t('Simple Chess works on every device. App, website and Android players all play each other.')), ...cards));
}
const APK = 'simplechess.apk';

function dailyCardText(): string {
  const r = resultOf('daily', currentPeriod('daily'));
  const state = r ? (r.solved ? '✓ ' + t('Solved today') : '✕ ' + t('Missed today')) : t('New puzzle in {0}', countdown(msLeft('daily')));
  return t('One ultra-hard puzzle a day and a brutal one every week.') + ' ' + state;
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
  tabbarEl = h('nav.tabbar', null, [['', 'Home', 'home'], ...NAV.filter(n => n[0] !== 'editor')].map(([r, label, ic]) =>
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
  // Inside the Android app the WebView has no Web Share API: route it to Android's share sheet.
  const bridge = appBridge;
  if (bridge && !(navigator as any).share) {
    (navigator as any).share = (d: { title?: string; text?: string; url?: string }) => { bridge.share(d.title || '', d.text || '', d.url || ''); return Promise.resolve(); };
  }
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  await setLang(detectLang(settings.lang));
  document.body.append(main);
  buildChrome();
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', (e) => { if ((leaveGuard && leaveGuard()) || gameParked()) { e.preventDefault(); e.returnValue = ''; } });
  onChallenges(showChallenges);
  if (embedded) document.documentElement.classList.add('embedded');
  if (!embedded) { initNotify(); setupUpdates(); showAnnouncement(); }
  // links clicked while a game is on screen open beside it, so the game is never left
  document.addEventListener('click', (e) => {
    if (embedded || e.defaultPrevented || (e as MouseEvent).button !== 0) return;
    const a = (e.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#/') || href === location.hash) return;
    // a game against a person keeps running when you leave it (parked), so menu links just go there
    const parkable = !!parkHook && !parkHook.over();
    if (!((leaveGuard && !parkable) || (gameRoute() && a.classList.contains('plink')))) return;
    e.preventDefault(); e.stopPropagation();
    openAside(href);
  }, true);
  // a game in progress tells other tabs about itself; other tabs offer the way back
  setInterval(() => { if (leaveGuard && !embedded) { try { localStorage.setItem(IN_GAME, String(Date.now())); } catch { /* */ } } backBar(); }, 2500);
  onAccount(showBan); showBan();
  setPopup((_a, tx) => {
    const kind = 'al-' + _a.key;
    offerBar(kind, `${tx.title}: ${tx.body}`, [btn(t('Open'), () => { clearOffers(kind); location.hash = tx.url.slice(1); }, 'primary small'), btn(t('Close'), () => clearOffers(kind), 'small ghost')]);
    setTimeout(() => clearOffers(kind), 9000);
  });
  onCounts((c) => {
    const n = c.unread;
    document.querySelectorAll('.chat-btn .count-badge').forEach(el => { el.textContent = n > 9 ? '9+' : String(n); (el as HTMLElement).style.display = n ? '' : 'none'; });
    const d = c.my_turn + c.invites;
    document.querySelectorAll('.nav a[data-r="play"], .tabbar a[data-r="play"]').forEach(a => {
      let b = a.querySelector('.count-badge.nav') as HTMLElement | null;
      if (!b) { b = h('span.count-badge.nav'); a.appendChild(b); }
      b.textContent = d > 9 ? '9+' : String(d); b.style.display = d ? '' : 'none'; b.title = t('Daily games: your move');
    });
  });
  route();
  setTimeout(announceVersion, 2500);
  initAccount().catch(() => {});
}

init();

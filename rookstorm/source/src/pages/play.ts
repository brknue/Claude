import { newDailyDialog } from './daily';
import { h, icon, btn, iconBtn, settings, saveSettings, toast, modal, sound, fmtClock, copyText, loadRaw, save, offerBar, clearOffers } from '../ui';
import { t } from '../i18n';
import { VARIANTS, VariantKey, variantInfo, variantName, variantDesc, startFenFor, materialDiff, outcomeText, reasonText, Color, Outcome, uciToMove, fenOf, moveSquares, Role } from '../chess';
import { Game } from '../game';
import { Board } from '../board';
import { engine, botMove, MIN_ELO, MAX_ELO, whiteCp } from '../engine';
import { variantMove, variantStop } from '../vengine';
import { Link, Msg, cleanCode } from '../net';
import { go, setLeaveGuard } from '../main';
import { setAnalysisInput } from './analysis';
import { me, ratingMode, ratingIn, rpc, niceError, refreshMe, accountsEnabled } from '../account';
import { Recorder, FinishInfo } from '../record';
import { partySetup } from './party';
import { queueReview, runReviews } from '../review';

type Mode = 'bot' | 'local' | 'friend' | 'online' | 'daily' | 'party';

export interface GameConfig {
  mode: Mode; variant: VariantKey; startFen: string; time: number; inc: number;
  myColor: Color; elo?: number; link?: Link; oppName: string; autoFlip?: boolean; isHost?: boolean;
  /** network games: opponent's account id / rating, and whether the host asked for a rated game */
  oppId?: string | null; oppRating?: number | null; rated?: boolean;
  /** friend games: the host turned 'Infinite premoves' off, so only one premove can be queued */
  premoveOne?: boolean;
}

let pendingConfig: GameConfig | null = null;
export function startGame(c: GameConfig) { pendingConfig = c; go('game'); }

export const TIME_PRESETS: [number, number, string][] = [
  [1, 0, 'Bullet'], [2, 1, 'Bullet'], [3, 0, 'Blitz'], [3, 2, 'Blitz'], [5, 0, 'Blitz'], [5, 3, 'Blitz'],
  [10, 0, 'Rapid'], [10, 5, 'Rapid'], [15, 10, 'Rapid'], [30, 0, 'Classical'], [30, 20, 'Classical'], [0, 0, 'Unlimited'],
];

export function eloLabel(e: number): string {
  if (e >= 3190) return t('Stockfish at full strength');
  if (e >= 2800) return t('Super grandmaster');
  if (e >= 2500) return t('Grandmaster');
  if (e >= 2200) return t('Master');
  if (e >= 1800) return t('Expert');
  if (e >= 1400) return t('Club player');
  if (e >= 1000) return t('Intermediate');
  if (e >= 600) return t('Novice');
  return t('Beginner');
}

export const tcLabel = (tm: number, i: number) => (tm === 0 ? '∞' : `${tm < 1 ? tm * 60 + 's' : tm} + ${i}`);
const myName = () => me?.username || settings.name || '';
const colorName = (c: Color) => (c === 'white' ? t('White') : t('Black'));
export const modeLabel = (m: string) => ({ bullet: 'Bullet', blitz: 'Blitz', rapid: 'Rapid', classical: 'Classical', daily: 'Daily', puzzle: 'Puzzles' } as Record<string, string>)[m] || variantInfo(m as VariantKey).name;

// ---------------- Setup page ----------------
export function playSetupPage(root: HTMLElement, arg?: string) {
  const saved = loadRaw('setup', { mode: 'bot', variant: 'standard', time: 10, inc: 0, color: 'random', autoFlip: true, rated: false }) as any;
  let mode: Mode = (['bot', 'local', 'friend', 'online', 'daily', 'party'].includes(arg || '') ? arg : saved.mode) as Mode;
  let variant: VariantKey = VARIANTS.some(v => v.key === saved.variant) ? saved.variant : 'standard';
  let time = saved.time, inc = saved.inc;
  let color: 'white' | 'black' | 'random' = saved.color;
  let elo = settings.lastElo || 1200;
  let autoFlip = saved.autoFlip !== false;
  let rated = !!saved.rated;
  let infPremoves = saved.infPremoves !== false;

  const body = h('div.setup-body');
  const tabs = h('div.seg.mode-tabs', { role: 'tablist' });
  const modes: [Mode, string, string][] = [['bot', 'Computer', 'cpu'], ['local', 'Same device', 'users'], ['friend', 'Friend link', 'link'], ['online', 'Online', 'globe'], ['daily', 'Daily', 'calendar'], ['party', 'Party', 'party']];

  const persist = () => save('setup', { mode, variant, time, inc, color, autoFlip, rated, infPremoves });

  function render() {
    tabs.replaceChildren(...modes.map(([m, label, ic]) => h('button', {
      type: 'button', role: 'tab', 'aria-selected': String(m === mode), class: m === mode ? 'on' : '',
      onclick: () => { mode = m; persist(); render(); },
    }, icon(ic), h('span', null, t(label)))));
    body.replaceChildren();
    if (mode === 'party') { partySetup(body); return; }
    if (mode === 'daily') {
      body.append(h('p.muted', null, t('Play friends at your own pace: each player has a few days for every move. You get a notification when it is your turn.')));
      if (!accountsEnabled() || !me) body.append(h('p.muted.small.rated-note', null, h('a', { href: '#/account' }, t('Sign in')), ' ' + t('to play daily games with your friends.')));
      else body.append(h('div.row.wrap', null, btn(h('span', null, icon('calendar'), t('New daily game')), () => newDailyDialog(), 'primary big'), h('a.btn.big', { href: '#/daily' }, t('Your daily games'))));
      return;
    }
    const sf = variantInfo(variant).sf;

    if (mode === 'bot') {
      const num = h('input.elo-num', { type: 'number', min: MIN_ELO, max: MAX_ELO, step: 1, value: elo, inputmode: 'numeric', 'aria-label': t('Bot Elo rating') }) as HTMLInputElement;
      const range = h('input.elo-range', { type: 'range', min: MIN_ELO, max: MAX_ELO, step: 50, value: elo, 'aria-label': t('Bot Elo slider') }) as HTMLInputElement;
      const lab = h('div.elo-label', null, eloLabel(elo));
      const setElo = (v: number, from: 'num' | 'range' | 'other') => {
        if (!isFinite(v)) return;
        elo = Math.round(v);
        const c = Math.max(MIN_ELO, Math.min(MAX_ELO, elo));
        if (from !== 'num') num.value = String(c);
        if (from !== 'range') range.value = String(c);
        lab.textContent = elo < MIN_ELO || elo > MAX_ELO ? t('Allowed range: {0}–{1}', MIN_ELO, MAX_ELO) : eloLabel(c);
        lab.classList.toggle('warn', elo < MIN_ELO || elo > MAX_ELO);
      };
      num.addEventListener('input', () => setElo(parseInt(num.value), 'num'));
      num.addEventListener('blur', () => { elo = Math.max(MIN_ELO, Math.min(MAX_ELO, elo || 1200)); num.value = String(elo); setElo(elo, 'num'); });
      range.addEventListener('input', () => setElo(parseInt(range.value), 'range'));
      body.append(h('div.field', null, h('span.lbl', null, t('Bot strength (Elo)')),
        h('div.elo-row', null, num, h('div.elo-side', null, lab, range)),
        h('div.chips', null, [400, 800, 1200, 1600, 2000, 2400, 2800, 3200].map(v => h('button.chip', { type: 'button', onclick: () => setElo(v, 'other') }, String(v)))),
        h('p.muted.small', null, sf
          ? t('Type any rating from {0} to {1}. 1320+ uses Stockfish\'s calibrated strength limiter; lower ratings use a human-like error model. {1} is full strength.', MIN_ELO, MAX_ELO)
          : t('Stockfish does not play this variant, so Rookstorm\'s own variant engine plays it. Its ratings are approximate.'))));
    }

    const vSel = h('select', { 'aria-label': t('Variant'), onchange: (e: any) => { variant = e.target.value; persist(); render(); } },
      VARIANTS.map(v => h('option', { value: v.key, selected: v.key === variant }, t(v.name))));
    body.append(h('label.field', null, h('span.lbl', null, t('Variant')), vSel, h('span.muted.small', null, variantDesc(variant))));

    const custom = !TIME_PRESETS.some(([tm, i]) => tm === time && i === inc);
    const grid = h('div.tc-grid', null, TIME_PRESETS.map(([tm, i, cat]) => h('button.tc', {
      type: 'button', class: tm === time && i === inc ? 'on' : '', onclick: () => { time = tm; inc = i; persist(); render(); },
    }, h('b', null, tcLabel(tm, i)), h('small', null, t(cat)))),
    h('button.tc', { type: 'button', class: custom ? 'on' : '', onclick: () => { if (!custom) { time = 7; inc = 2; } persist(); render(); } }, h('b', null, t('Custom')), h('small', null, custom ? tcLabel(time, inc) : t('Any time'))));
    body.append(h('div.field', null, h('span.lbl', null, t('Time control')), grid));
    if (custom) {
      body.append(h('div.row.custom-tc', null,
        h('label.field', null, h('span.lbl', null, t('Minutes per side')), h('input', { type: 'number', min: 0.25, max: 180, step: 0.25, value: time, onchange: (e: any) => { time = Math.max(0.25, Math.min(180, parseFloat(e.target.value) || 5)); e.target.value = time; persist(); render(); } })),
        h('label.field', null, h('span.lbl', null, t('Increment (seconds)')), h('input', { type: 'number', min: 0, max: 180, step: 1, value: inc, onchange: (e: any) => { inc = Math.max(0, Math.min(180, parseInt(e.target.value) || 0)); e.target.value = inc; persist(); render(); } }))));
    }

    if (mode !== 'local' && mode !== 'online') {
      body.append(h('div.field', null, h('span.lbl', null, t('Play as')), h('div.seg', null,
        (['white', 'random', 'black'] as const).map(c => h('button', { type: 'button', class: c === color ? 'on' : '', onclick: () => { color = c; persist(); render(); } },
          h('span.cdot.' + c), c === 'white' ? t('White') : c === 'black' ? t('Black') : t('Random'))))));
    }
    if (mode === 'local') {
      body.append(h('label.check', null, h('input', { type: 'checkbox', checked: autoFlip, onchange: (e: any) => { autoFlip = e.target.checked; persist(); } }), t('Flip the board after every move')));
    }
    if (mode === 'friend' || mode === 'online') body.append(ratedBox() || '');
    if (mode === 'friend') body.append(premoveBox(infPremoves, (v) => { infPremoves = v; persist(); }));
    if (mode === 'friend') {
      body.append(h('p.muted', null, t('You get a link to send to your friend (message, AirDrop, email…). The game starts as soon as they open it. Moves travel directly between your devices.')));
      const codeIn = h('input', { placeholder: t('Got a code or link? Paste it here'), 'aria-label': t('Game code'), autocapitalize: 'off', autocomplete: 'off', spellcheck: false }) as HTMLInputElement;
      const join = () => { const c = cleanCode(codeIn.value); if (c.length < 4) { toast(t('Enter the code your friend sent you')); return; } go('join/' + c); };
      codeIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });
      body.append(h('div.field', null, h('span.lbl', null, t('Join a friend')), h('div.row', null, codeIn, btn(t('Join'), join))));
    }
    if (mode === 'online') {
      if (!me) body.append(h('label.field', null, h('span.lbl', null, t('Your name')), h('input', { value: settings.name, maxLength: 20, placeholder: t('Anonymous'), oninput: (e: any) => { settings.name = e.target.value.slice(0, 20); saveSettings(); } })));
      body.append(h('p.muted', null, t('You are paired with the next player searching for the same variant and time control. Needs an internet connection.')));
    }
    const label = mode === 'bot' ? (sf ? t('Play vs Stockfish') : t('Play vs computer')) : mode === 'local' ? t('Start game') : mode === 'friend' ? t('Create invite link') : t('Find opponent');
    body.append(btn(h('span', null, icon('play'), label), start, 'primary big block'));
  }

  function ratedBox(): HTMLElement | null {
    const rm = ratingMode(variant, time, inc);
    if (!accountsEnabled()) return null;
    if (!me) return h('p.muted.small.rated-note', null, h('a', { href: '#/account' }, t('Sign in')), ' ' + t('to play rated games and keep your rating.'));
    if (!rm) return h('p.muted.small.rated-note', null, t('Games without a clock cannot be rated.'));
    return h('div.field', null,
      h('label.check', null, h('input', { type: 'checkbox', checked: rated, onchange: (e: any) => { rated = e.target.checked; persist(); } }),
        t('Rated game'), h('span.muted.small', null, ` · ${t(modeLabel(rm))} ${ratingIn(me.ratings, rm)}`)),
      h('span.muted.small', null, mode === 'friend' ? t('Both players need an account and must be friends on Rookstorm.') : t('You are only paired with other signed-in players looking for a rated game.')));
  }

  function start() {
    persist();
    const myColor: Color = color === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : color;
    const startFen = startFenFor(variant);
    const isRated = rated && !!me && !!ratingMode(variant, time, inc);
    if (mode === 'bot') {
      elo = Math.max(MIN_ELO, Math.min(MAX_ELO, elo || 1200));
      settings.lastElo = elo; saveSettings();
      const sf = variantInfo(variant).sf;
      startGame({ mode, variant, startFen, time, inc, myColor, elo, oppName: sf ? (elo >= 3190 ? 'Stockfish 17' : `Stockfish · ${elo}`) : `${t('Computer')} · ${elo}` });
    } else if (mode === 'local') {
      startGame({ mode, variant, startFen, time, inc, myColor: 'white', oppName: t('Black'), autoFlip });
    } else if (mode === 'friend') hostFriend({ variant, startFen, time, inc, myColor, rated: isRated, pm1: !infPremoves });
    else findOnline(variant, time, inc, isRated);
  }

  render();
  root.append(h('section.setup.card', null, h('h1', null, t('New game')), tabs, body));
}

const NO_RTC = () => t('This browser cannot make live peer-to-peer connections (WebRTC is turned off or missing). Try Safari, Chrome, Edge or Firefox, and turn off Lockdown Mode if it is on.');
const noRtc = () => typeof (window as any).RTCPeerConnection === 'undefined';

interface HostInfo { code?: string; variant: VariantKey; startFen: string; time: number; inc: number; myColor: Color; rated?: boolean; pm1?: boolean }

/** 'Infinite premoves' checkbox for games against a friend (off = one premove at a time for both players). */
export function premoveBox(on: boolean, set: (v: boolean) => void): HTMLElement {
  return h('label.check', null, h('input', { type: 'checkbox', checked: on, onchange: (e: any) => set(e.target.checked) }),
    h('span', null, t('Infinite premoves'), h('span.muted.small.block', null, t('Off: each player can queue only one premove.'))));
}
const myRatingFor = (v: VariantKey, tm: number, i: number) => { const m = ratingMode(v, tm, i); return me && m ? ratingIn(me.ratings, m) : undefined; };

/**
 * Host a game and wait for the friend. With `challenge`, the friend was invited from the friend list:
 * they get a notification and join with the same code.
 */
export function hostFriend(info: HostInfo, challenge?: { to: string; toName: string }) {
  const link = new Link();
  const status = h('p.muted', null, t('Creating your game…'));
  const linkBox = h('div.linkbox');
  let started = false;
  let challengeId: string | null = null;
  let poll: any = 0;
  const cancel = () => {
    link.destroy(); close(); clearInterval(poll);
    if (challengeId) rpc('challenge_cancel', { p_id: challengeId }).catch(() => {});
    try { sessionStorage.removeItem('rs.hosting'); } catch { /* */ }
    if (location.hash.startsWith('#/join/')) go('play/friend');
  };
  const close = modal(h('div', null, h('h2', null, challenge ? t('Challenge {0}', challenge.toName) : t('Invite a friend')), status, linkBox,
    h('div.row.end', null, btn(t('Cancel'), cancel))), { dismissable: false });
  link.host(info.code).then(async code => {
    if (started) return;
    if (challenge) {
      try {
        challengeId = await rpc<string>('challenge_send', { p_to: challenge.to, p_variant: info.variant, p_base: info.time, p_inc: info.inc, p_color: info.myColor, p_rated: !!info.rated, p_code: code });
      } catch (e) { status.textContent = niceError(e); return; }
      status.textContent = t('Waiting for {0} to accept…', challenge.toName);
      linkBox.replaceChildren(h('div.spinner-row', null, h('span.spinner'), t('{0} gets a notification on Rookstorm.', challenge.toName)));
      poll = setInterval(async () => {
        if (started) { clearInterval(poll); return; }
        try {
          const list = await rpc<any[]>('my_challenges');
          if (!list.some(c => c.id === challengeId) && !started) {
            clearInterval(poll);
            setTimeout(() => { if (!started) { status.textContent = t('{0} declined or did not answer.', challenge.toName); linkBox.replaceChildren(); link.destroy(); challengeId = null; } }, 6000);
          }
        } catch { /* offline */ }
      }, 5000);
      return;
    }
    const url = location.href.split('#')[0] + '#/join/' + code;
    // Put the invite in the address bar too, so Safari's own Share / AirDrop button sends the right link.
    try { sessionStorage.setItem('rs.hosting', JSON.stringify({ ...info, code })); } catch { /* */ }
    history.replaceState(null, '', '#/join/' + code);
    status.textContent = t('Send this link to your friend (message, AirDrop, anything). Keep this page open — the game starts when they open it.');
    const share = (navigator as any).share ? btn(h('span', null, icon('share'), t('Share / AirDrop')), () => (navigator as any).share({ title: t('Play chess with me on Rookstorm'), text: t('Play chess with me on Rookstorm:'), url }).catch(() => {}), 'primary') : null;
    linkBox.replaceChildren(h('input.link-input', { value: url, readOnly: true, onclick: (e: any) => e.target.select(), 'aria-label': t('Invite link') }),
      h('div.row.wrap', null, share, btn(h('span', null, icon('copy'), t('Copy link')), () => copyText(url), share ? '' : 'primary')),
      h('div.code-box', null, h('span.muted.small', null, t('Or they can enter this code under Play → Friend link:')), h('b.code', null, code)),
      info.rated ? h('p.muted.small', null, t('Rated game: your friend must be signed in and on your friend list.')) : '',
      h('div.spinner-row', null, h('span.spinner'), t('Waiting for your friend…')));
  }).catch(() => { status.textContent = noRtc() ? NO_RTC() : t('Could not reach the connection server. Check your internet connection and try again.'); });
  link.onMsg = (m) => {
    if (m.t === 'hello' && !started) {
      started = true; clearInterval(poll);
      try { sessionStorage.removeItem('rs.hosting'); } catch { /* */ }
      link.send({ t: 'start', variant: info.variant, fen: info.startFen, time: info.time, inc: info.inc, hostColor: info.myColor, name: myName(), uid: me?.id, rating: myRatingFor(info.variant, info.time, info.inc), rated: info.rated, pm1: !!info.pm1 });
      close();
      startGame({ mode: 'friend', variant: info.variant, startFen: info.startFen, time: info.time, inc: info.inc, myColor: info.myColor, link, premoveOne: !!info.pm1, oppName: m.name || t('Friend'), isHost: true, oppId: m.uid || null, oppRating: m.rating ?? null, rated: !!info.rated && !!m.uid });
    }
  };
}

function findOnline(variant: VariantKey, time: number, inc: number, rated: boolean) {
  const link = new Link();
  const status = h('p', null, t('Connecting…'));
  const close = modal(h('div.center', null, h('h2', null, t('Finding an opponent')),
    h('p.muted', null, `${variantName(variant)} · ${tcLabel(time, inc)}${rated ? ' · ' + t('Rated') : ''}`), h('div.spinner-row', null, h('span.spinner'), status),
    h('p.muted.small', null, t('Tip: ask a friend to search for the same variant and time control to play each other.')),
    h('div.row.center', null, btn(t('Cancel'), () => { link.destroy(); close(); }))), { dismissable: false });
  const pool = `${variant}-${time}-${inc}${rated ? '-r' : ''}`.replace('.', '_');
  const myRating = myRatingFor(variant, time, inc);
  link.matchmake(pool, s => { status.textContent = s; }).then(role => {
    if (role === 'host') {
      link.onMsg = (m) => {
        if (m.t === 'hello') {
          const myColor: Color = Math.random() < 0.5 ? 'white' : 'black';
          const fen = startFenFor(variant);
          link.send({ t: 'start', variant, fen, time, inc, hostColor: myColor, name: myName(), uid: me?.id, rating: myRating, rated });
          close();
          startGame({ mode: 'online', variant, startFen: fen, time, inc, myColor, link, oppName: m.name || t('Anonymous'), isHost: true, oppId: m.uid || null, oppRating: m.rating ?? null, rated: rated && !!m.uid });
        }
      };
    } else {
      link.onMsg = (m) => {
        if (m.t === 'start') {
          close();
          startGame({ mode: 'online', variant: m.variant as VariantKey, startFen: m.fen, time: m.time, inc: m.inc, myColor: m.hostColor === 'white' ? 'black' : 'white', link, oppName: m.name || t('Anonymous'), oppId: m.uid || null, oppRating: m.rating ?? null, rated: !!m.rated && !!me });
        }
      };
      link.send({ t: 'hello', name: myName(), v: 1, uid: me?.id, rating: myRating });
    }
  }).catch((e) => { status.textContent = noRtc() ? NO_RTC() : String(e?.message || t('Connection failed.')); });
}

export function joinPage(root: HTMLElement, raw?: string) {
  const code = cleanCode(raw || '');
  if (!code) { go('play/friend'); return; }
  let hosting: HostInfo | null = null;
  try { const h0 = JSON.parse(sessionStorage.getItem('rs.hosting') || 'null'); if (h0?.code === code) hosting = h0; } catch { /* */ }
  if (hosting) {
    root.append(h('section.card.setup.center', null, h('h1', null, t('Your game')), h('p.muted', null, t('Waiting for your friend to open the invite link.'))));
    hostFriend(hosting);
    return;
  }
  const status = h('p', null, t('Connecting to your friend…'));
  root.append(h('section.card.setup.center', null, h('h1', null, t('Joining game')), h('div.spinner-row', null, h('span.spinner'), status),
    h('p.muted.small', null, t('Game code:') + ' ', h('b', null, code)),
    h('a.btn', { href: '#/play/friend' }, t('Back'))));
  const link = new Link();
  let started = false;
  let helloTimer: any = 0;
  link.onMsg = (m: Msg) => {
    if (m.t === 'start' && !started) {
      started = true; clearInterval(helloTimer);
      const mr = me ? ratingIn(me.ratings, ratingMode(m.variant as VariantKey, m.time, m.inc) || 'x') : undefined;
      // tell the host our rating now that we know the time control
      if (mr) link.send({ t: 'hello', name: myName(), v: 1, uid: me?.id, rating: mr });
      startGame({ mode: 'friend', variant: m.variant as VariantKey, startFen: m.fen, time: m.time, inc: m.inc, myColor: m.hostColor === 'white' ? 'black' : 'white', link, premoveOne: !!m.pm1, oppName: m.name || t('Friend'), oppId: m.uid || null, oppRating: m.rating ?? null, rated: !!m.rated && !!me });
    } else if (m.t === 'busy') { status.textContent = t('This game already has two players. Ask your friend for a new link.'); clearInterval(helloTimer); }
  };
  link.join(code, (s) => { if (!started) status.textContent = s; }).then(() => {
    status.textContent = t('Connected! Starting the game…');
    const hello = () => link.send({ t: 'hello', name: myName(), v: 1, uid: me?.id });
    hello();
    helloTimer = setInterval(() => { if (!started) hello(); }, 3000);
  }).catch((e) => {
    status.textContent = noRtc() ? NO_RTC() : e?.message && e.message !== 'timeout' ? e.message : t('Could not reach your friend. Ask them to keep the Rookstorm page open and send a new link.');
  });
  return () => { clearInterval(helloTimer); if (!started) link.destroy(); };
}

// ---------------- Clock ----------------
class Clock {
  t: Record<Color, number>;
  running: Color | null = null;
  last = 0;
  constructor(public base: number, public inc: number) { this.t = { white: base, black: base }; }
  get enabled() { return this.base > 0; }
  now(c: Color) { return this.running === c ? this.t[c] - (performance.now() - this.last) : this.t[c]; }
  start(c: Color) { if (!this.enabled) return; this.running = c; this.last = performance.now(); }
  press(c: Color, addInc: boolean) {
    if (!this.enabled) return;
    if (this.running === c) this.t[c] -= performance.now() - this.last;
    if (addInc) this.t[c] += this.inc;
    this.running = null;
  }
  stop() { if (this.running) { this.t[this.running] -= performance.now() - this.last; this.running = null; } }
}

// ---------------- Game page ----------------
export function gamePage(root: HTMLElement): (() => void) | void {
  const cfg = pendingConfig;
  if (!cfg) { go('play'); return; }
  pendingConfig = null;
  let game = new Game(cfg.variant, cfg.startFen);
  let clock = new Clock(cfg.time * 60000, cfg.inc * 1000);
  const net = cfg.mode === 'friend' || cfg.mode === 'online';
  const sf = variantInfo(cfg.variant).sf;
  const zh = cfg.variant === 'crazyhouse';
  let alive = true;
  let botBusy = false;
  let viewPly: number | null = null;
  let drawOffered = false;
  let rematchAsked = false;
  let takebackPending = false;
  let closeEndModal: (() => void) | null = null;
  let gameToken = 0;
  let rec: Recorder | null = null;
  let ratingInfo: FinishInfo | null = null;
  let ratedNow = false;
  let shown = false;

  const board = new Board({ orientation: cfg.myColor, onMove: (m) => onUserMove(m) });
  board.chess960 = cfg.variant === 'chess960';
  board.antichess = cfg.variant === 'antichess';
  board.premoveLimit = cfg.premoveOne ? 1 : Infinity; // online games always allow unlimited premoves
  board.movableColor = cfg.mode === 'local' ? 'both' : cfg.myColor;
  board.onPendingDrop = () => renderStrips();
  if (cfg.mode === 'local' && cfg.autoFlip) board.setOrientation('white');

  const topStrip = h('div.pstrip.top'), botStrip = h('div.pstrip.bottom');
  const moveList = h('div.movelist', { role: 'list' });
  const status = h('div.status');
  const actions = h('div.actions');
  const endBox = h('div.endbox');
  const chatLog = h('div.chat-log');
  const headInfo = h('span.muted');
  const nav = h('div.navrow', null,
    iconBtn('first', t('First move'), () => view(0)), iconBtn('prev', t('Previous move'), () => view((viewPly ?? game.ply) - 1)),
    iconBtn('next', t('Next move'), () => view((viewPly ?? game.ply) + 1)), iconBtn('last', t('Latest move'), () => view(game.ply)),
    iconBtn('flip', t('Flip board'), () => { board.flip(); renderStrips(); }));

  const side = h('aside.side.card', null,
    h('div.side-head', null, h('div', null, h('b', null, variantName(cfg.variant)), headInfo), status),
    moveList, nav, endBox, actions, h('div.game-opts', null, premoveToggle()),
    net ? h('div.chat', null, chatLog, h('form.chat-form', { onsubmit: (e: Event) => { e.preventDefault(); const inp = (e.target as HTMLFormElement).querySelector('input')!; const text = inp.value.trim().slice(0, 140); if (!text) return; cfg.link!.send({ t: 'chat', text }); addChat(t('You'), text); inp.value = ''; } },
      h('input', { placeholder: t('Say something nice…'), maxLength: 140, 'aria-label': t('Chat message') }), btn(t('Send'), () => {}, 'small'))) : null);

  root.append(h('div.game-layout', null, h('div.board-col', null, topStrip, board.el, botStrip), side));

  function renderHead() {
    headInfo.textContent = ' · ' + (cfg!.time ? tcLabel(cfg!.time, cfg!.inc) : t('Unlimited')) + ' · ' + modeName() + (ratedNow ? ' · ' + t('Rated') : '');
  }

  function premoveToggle() {
    if (cfg!.mode === 'local' || zh) return null;
    const inp = h('input', { type: 'checkbox', checked: settings.premove, onchange: (e: any) => { settings.premove = e.target.checked; saveSettings(); if (!settings.premove) board.cancelPremove(); sync(); toast(settings.premove ? t('Premoves on') : t('Premoves off')); } });
    return h('label.switch', { title: t('Plan your next move while your opponent is thinking') }, inp, h('span'), ' ' + t('Premoves'));
  }

  function modeName() { return cfg!.mode === 'bot' ? t('vs computer') : cfg!.mode === 'local' ? t('same device') : cfg!.mode === 'friend' ? t('vs friend') : t('online'); }
  function addChat(who: string, text: string) { chatLog.append(h('div', null, h('b', null, who + ': '), text)); chatLog.scrollTop = chatLog.scrollHeight; }

  function nameOf(c: Color) {
    if (cfg!.mode === 'local') return colorName(c);
    return c === cfg!.myColor ? (myName() || t('You')) : cfg!.oppName;
  }
  function ratingOf(c: Color): number | null {
    if (!ratedNow) return null;
    const m = ratingMode(cfg!.variant, cfg!.time, cfg!.inc);
    if (c === cfg!.myColor) return me && m ? ratingIn(me.ratings, m) : null;
    return cfg!.oppRating ?? null;
  }

  const stripEls: Record<Color, { clock: HTMLElement; mat: HTMLElement; el: HTMLElement; name: HTMLElement; pocket: HTMLElement }> = {} as any;
  function buildStrip(c: Color) {
    const clockEl = h('div.clock', { 'aria-label': c === 'white' ? t('White clock') : t('Black clock') });
    const mat = h('div.mat.cg-wrap.pc');
    const name = h('b');
    const pocket = h('div.pocket.cg-wrap.pc');
    const el = h('div.pinfo', null, h('span.cdot.' + c), h('div.pname', null, name, mat), clockEl);
    stripEls[c] = { clock: clockEl, mat, el, name, pocket };
    return h('div.pwrap', null, el, zh ? pocket : null);
  }
  const wStrip = buildStrip('white'), bStrip = buildStrip('black');
  function renderStrips() {
    const top: Color = board.orientation === 'white' ? 'black' : 'white';
    topStrip.replaceChildren(top === 'white' ? wStrip : bStrip);
    botStrip.replaceChildren(top === 'white' ? bStrip : wStrip);
    const pos = game.positions[viewPly ?? game.ply];
    const md = materialDiff(pos);
    for (const c of ['white', 'black'] as Color[]) {
      const r = ratingOf(c);
      stripEls[c].name.textContent = nameOf(c) + (r ? ` (${r})` : '');
      const roles = c === 'white' ? md.white : md.black;
      const adv = c === 'white' ? md.score : -md.score;
      stripEls[c].mat.replaceChildren(...(zh ? [] : roles.map(r2 => h('piece', { class: `${r2} ${c === 'white' ? 'black' : 'white'}` }))), !zh && adv > 0 ? h('span.adv', null, '+' + adv) : '');
      if (zh) renderPocket(c, pos);
    }
    renderClocks();
  }
  function renderPocket(c: Color, pos: any) {
    const el = stripEls[c].pocket;
    const pockets = pos.pockets;
    if (!pockets) { el.replaceChildren(); return; }
    const mine = interactive() && pos.turn === c && (cfg!.mode === 'local' || c === cfg!.myColor);
    el.replaceChildren(...(['queen', 'rook', 'bishop', 'knight', 'pawn'] as Role[]).filter(r => pockets[c][r] > 0).map(r => {
      const n = pockets[c][r];
      const b = h('button.pk', { type: 'button', disabled: !n || !mine, class: board.pendingDrop === r && mine ? 'on' : '', 'aria-label': `${t(r)} ×${n}`, title: mine ? t('Tap, then tap a square — or drag onto the board') : '' },
        h('piece', { class: `${r} ${c}` }), n ? h('span.pk-n', null, String(n)) : null);
      if (n && mine) {
        b.addEventListener('click', () => board.setPendingDrop(board.pendingDrop === r ? null : r));
        b.addEventListener('mousedown', (e) => { if (e.button === 0) board.dragDrop(r, c, e); });
        b.addEventListener('touchstart', (e) => { board.dragDrop(r, c, e); }, { passive: false });
      }
      return b;
    }));
  }
  function renderClocks() {
    for (const c of ['white', 'black'] as Color[]) {
      const el = stripEls[c].clock;
      if (!clock.enabled) { el.style.display = 'none'; continue; }
      const ms = clock.now(c);
      el.textContent = fmtClock(ms);
      el.classList.toggle('run', clock.running === c);
      el.classList.toggle('low', ms < 20000);
    }
    const turn = game.pos.turn;
    stripEls.white.el.classList.toggle('turn', !game.result && turn === 'white');
    stripEls.black.el.classList.toggle('turn', !game.result && turn === 'black');
  }

  let lowWarned: Record<Color, boolean> = { white: false, black: false };
  const timer = setInterval(() => {
    if (!alive || !clock.running || game.result) return;
    const c = clock.running;
    const ms = clock.now(c);
    if (ms <= 0) {
      clock.t[c] = 0; clock.stop();
      const winner: Color = c === 'white' ? 'black' : 'white';
      const insufficient = !hasMatingMaterial(winner);
      finish({ winner: insufficient ? undefined : winner, reason: insufficient ? 'timeout vs insufficient material' : 'time out' });
      if (net) cfg.link!.send({ t: 'flag', color: c });
    } else if (ms < 10000 && !lowWarned[c] && (cfg.mode !== 'bot' || c === cfg.myColor)) { lowWarned[c] = true; sound.low(); }
    renderClocks();
  }, 100);

  function hasMatingMaterial(c: Color) {
    const b = game.pos.board;
    const mine = b[c];
    if (zh || cfg!.variant === 'antichess' || cfg!.variant === 'horde') return true;
    const heavy = mine.intersect(b.pawn.union(b.rook).union(b.queen));
    if (heavy.nonEmpty()) return true;
    return mine.intersect(b.knight.union(b.bishop)).size() >= 1 && mine.size() > 1;
  }

  function renderMoves() {
    const rows: HTMLElement[] = [];
    const cur = viewPly ?? game.ply;
    let row: HTMLElement | null = null;
    game.sans.forEach((san, i) => {
      const { num, white } = game.moveNumber(i);
      if (white || !row) {
        row = h('div.mrow', null, h('span.mnum', null, num + '.'));
        if (!white) row.append(h('span.mv.empty', null, '…'));
        rows.push(row);
      }
      row.append(h('button.mv', { type: 'button', class: i + 1 === cur ? 'cur' : '', onclick: () => view(i + 1) }, san));
    });
    moveList.replaceChildren(...rows);
    if (!rows.length) moveList.append(h('div.muted.small.empty-moves', null, t('Moves will appear here.')));
    const curEl = moveList.querySelector('.cur') as HTMLElement | null;
    if (curEl && viewPly === null) moveList.scrollTop = moveList.scrollHeight;
    else curEl?.scrollIntoView({ block: 'nearest' });
  }

  function interactive() {
    if (game.result || viewPly !== null) return false;
    if (cfg!.mode === 'local') return true;
    return game.pos.turn === cfg!.myColor && !botBusy;
  }

  function sync() {
    const idx = viewPly ?? game.ply;
    const pos = game.positions[idx];
    const last = idx > 0 ? moveSquares(game.positions[idx - 1], game.moves[idx - 1]) : null;
    board.premoveColor = cfg!.mode !== 'local' && settings.premove && !game.result && viewPly === null && !zh ? cfg!.myColor : null;
    if (!interactive() && board.pendingDrop) board.setPendingDrop(null);
    board.setPosition(pos, last, interactive());
    renderStrips(); renderMoves(); renderStatus(); renderActions();
  }

  function view(i: number) {
    i = Math.max(0, Math.min(game.ply, i));
    viewPly = i === game.ply ? null : i;
    sync();
  }

  function renderStatus() {
    if (game.result) { status.textContent = outcomeText(game.result); status.className = 'status over'; return; }
    status.className = 'status';
    const turn = game.pos.turn;
    if (cfg!.mode === 'local') status.textContent = turn === 'white' ? t('White to move') : t('Black to move');
    else if (turn === cfg!.myColor) status.textContent = t('Your move');
    else status.textContent = cfg!.mode === 'bot' ? (sf ? t('Stockfish is thinking…') : t('The computer is thinking…')) : t('Waiting for {0}…', cfg!.oppName);
    if (cfg!.variant === '3check' && game.pos.remainingChecks) {
      const rc = game.pos.remainingChecks;
      status.textContent += ' · ' + t('checks left: White {0} / Black {1}', rc.white, rc.black);
    }
  }

  function renderActions() {
    const a: HTMLElement[] = [];
    if (!game.result) {
      if (cfg!.mode === 'bot' || cfg!.mode === 'local') a.push(btn(h('span', null, icon('undo'), t('Takeback')), takeback, game.ply ? '' : 'disabled', t('Take back a move')));
      if (net) a.push(btn(h('span', null, icon('undo'), takebackPending ? t('Takeback sent…') : t('Takeback')), proposeTakeback, takebackPending || lastOwnTarget() < 0 ? 'disabled' : '', t('Ask your opponent to take back your last move')));
      if (cfg!.mode === 'bot' && game.pos.turn === cfg!.myColor && !botBusy) a.push(btn(h('span', null, icon('bulb'), t('Hint')), hint, '', t('Show a hint')));
      a.push(btn(h('span', null, icon('half'), drawOffered ? t('Draw offered') : t('Offer draw')), offerDraw, drawOffered ? 'disabled' : ''));
      a.push(btn(h('span', null, icon('flag'), t('Resign')), resign, 'danger'));
    }
    actions.replaceChildren(...a);
  }

  function ratingLine(): HTMLElement | null {
    if (!ratingInfo || ratingInfo.status !== 'finished' || ratingInfo.white_diff == null) {
      if (ratedNow && ratingInfo?.status === 'disputed') return h('p.muted.small', null, t('The two players reported different results, so ratings did not change.'));
      if (ratedNow && game.result && !ratingInfo) return h('p.muted.small.rating-wait', null, t('Updating ratings…'));
      return null;
    }
    const mine = cfg!.myColor === 'white';
    const before = mine ? ratingInfo.white_rating! : ratingInfo.black_rating!;
    const d = mine ? ratingInfo.white_diff! : ratingInfo.black_diff!;
    return h('div.rating-change', null, t('Your rating') + ': ', h('b', null, String(before + d)), ' ', h('span.delta', { class: d >= 0 ? 'up' : 'down' }, (d >= 0 ? '+' : '') + d));
  }

  function renderEnd() {
    endBox.replaceChildren();
    if (!game.result) return;
    const o = game.result;
    const youWon = cfg!.mode !== 'local' && o.winner === cfg!.myColor;
    const youLost = cfg!.mode !== 'local' && o.winner && o.winner !== cfg!.myColor;
    endBox.append(h('div.result', { class: youWon ? 'win' : youLost ? 'loss' : 'draw' },
      h('div.big', null, o.winner === 'white' ? '1–0' : o.winner === 'black' ? '0–1' : '½–½'),
      h('div', null, cfg!.mode === 'local' ? outcomeText(o) : (youWon ? t('You won') : youLost ? t('You lost') : t('Draw')) + ' · ' + t(o.reason)),
      ratingLine()),
      h('div.row.wrap', null,
        game.ply ? btn(h('span', null, icon('chart'), sf ? t('Game review') : t('Analysis board')), review, 'primary') : null,
        btn(h('span', null, icon('retry'), net ? (rematchAsked ? t('Rematch sent…') : t('Rematch')) : t('Play again')), rematch),
        btn(h('span', null, icon('copy'), t('Copy PGN')), () => copyText(game.pgn(pgnHeaders()))),
        h('a.btn', { href: '#/play' }, t('New game'))));
  }

  function pgnHeaders() {
    return { White: nameOf('white'), Black: nameOf('black'), TimeControl: cfg!.time ? `${cfg!.time * 60}+${cfg!.inc}` : '-' };
  }

  function review() {
    setAnalysisInput({ variant: cfg!.variant, startFen: game.startFen, ucis: game.ucis.slice(), orientation: cfg!.mode === 'local' ? 'white' : cfg!.myColor, white: nameOf('white'), black: nameOf('black'), autoReview: sf, gameId: rec?.id || undefined });
    go('analysis');
  }

  function finish(o: Outcome) {
    if (shown) return;
    shown = true;
    game.end(o);
    clock.stop();
    engine.stop(); variantStop();
    botBusy = false;
    setLeaveGuard(null);
    sound.end();
    board.cancelPremove();
    sync();
    renderEnd();
    saveHistory();
    clearOffers();
    showEndModal();
    if (rec) {
      const r = game.result!;
      const thisRec = rec;
      const endUcis = game.ucis.slice(), endFen = game.startFen;
      thisRec.finish(r.winner, r.reason, game.ucis).then(info => {
        if (thisRec.id && sf && endUcis.length >= 2) { queueReview(thisRec.id, cfg!.variant, endFen, endUcis); setTimeout(() => runReviews(), 2500); }
        if (!alive || rec !== thisRec) return;
        ratingInfo = info || { status: 'error' };
        if (ratedNow) refreshMe();
        renderEnd();
        const slot = document.querySelector('.end-modal .end-rating');
        if (slot) slot.replaceChildren(ratingLine() || '');
      });
    }
  }

  function showEndModal() {
    closeEndModal?.();
    const o = game.result!;
    const youWon = cfg!.mode !== 'local' && o.winner === cfg!.myColor;
    const youLost = cfg!.mode !== 'local' && !!o.winner && o.winner !== cfg!.myColor;
    const title = cfg!.mode === 'local' ? (o.winner ? (o.winner === 'white' ? t('White wins') : t('Black wins')) : t('Draw')) : youWon ? t('You won!') : youLost ? t('You lost') : t('Draw');
    const close = modal(h('div.end-modal', { class: youWon ? 'win' : youLost ? 'loss' : 'draw' },
      h('div.end-score', null, o.winner === 'white' ? '1–0' : o.winner === 'black' ? '0–1' : '½–½'),
      h('h2', null, title), h('p.muted', null, reasonText(o.reason)),
      h('div.end-rating', null, ratingLine()),
      h('div.end-actions', null,
        game.ply ? btn(h('span', null, icon('chart'), sf ? t('Game review') : t('Analysis board')), () => { closeEndModal?.(); review(); }, 'primary') : null,
        btn(h('span', null, icon('retry'), net ? t('Rematch') : t('Play again')), () => { closeEndModal?.(); rematch(); }),
        h('a.btn', { href: '#/play', onclick: () => closeEndModal?.() }, t('New game')),
        btn(t('View board'), () => closeEndModal?.(), 'ghost'))), { onClose: () => { closeEndModal = null; } });
    closeEndModal = () => { closeEndModal = null; close(); };
  }

  function lastOwnTarget(): number {
    for (let i = game.ply - 1; i >= 0; i--) if (game.positions[i].turn === cfg!.myColor) return i;
    return -1;
  }
  function proposeTakeback() {
    const target = lastOwnTarget();
    if (game.result || takebackPending || target < 0) return;
    takebackPending = true;
    cfg!.link!.send({ t: 'takeback-offer', ply: target });
    toast(t('Takeback request sent'));
    renderActions();
  }
  function applyTakeback(target: number) {
    takebackPending = false;
    if (game.result || target < 0 || target >= game.ply) { renderActions(); return; }
    game.undo(game.ply - target);
    viewPly = null; drawOffered = false;
    board.cancelPremove();
    clock.stop();
    if (game.ply >= 1) clock.start(game.pos.turn);
    clearOffers('takeback');
    sync();
    recPush();
    toast(t('Move taken back'));
  }

  function saveHistory() {
    if (game.ply < 2) return;
    const hist = loadRaw('history', [] as any[]);
    hist.unshift({ d: Date.now(), mode: cfg!.mode, variant: cfg!.variant, fen: game.startFen, ucis: game.ucis, w: nameOf('white'), b: nameOf('black'), r: game.result ? (game.result.winner || 'draw') : '*', reason: game.result?.reason, my: cfg!.mode === 'local' ? 'white' : cfg!.myColor });
    save('history', hist.slice(0, 30));
  }

  function recPush() { rec?.push(game.ucis, clock.enabled ? { w: Math.round(clock.now('white')), b: Math.round(clock.now('black')) } : null); }

  function afterMove(byColor: Color, remoteClock?: number) {
    const ply = game.ply;
    clock.press(byColor, ply >= 2);
    if (remoteClock !== undefined && clock.enabled) clock.t[byColor] = remoteClock;
    recPush();
    if (game.result) { finish(game.result); return; }
    if (ply >= 1) clock.start(game.pos.turn);
    drawOffered = false;
    if (cfg!.mode === 'local' && cfg!.autoFlip) board.setOrientation(game.pos.turn);
    setLeaveGuard(game.ply >= 1 && !game.result ? () => confirm(t('Leave this game? It will be lost.')) : null);
  }

  function onUserMove(m: any) {
    if (!interactive()) { sync(); return; }
    const prev = game.pos;
    const mover = prev.turn;
    const san = game.play(m);
    if (!san) { sync(); return; }
    board.showMove(prev, m, game.pos, false);
    afterMove(mover);
    if (net) cfg!.link!.send({ t: 'move', uci: game.ucis[game.ply - 1], clock: clock.enabled ? Math.round(clock.t[mover]) : undefined, ply: game.ply });
    sync();
    if (cfg!.mode === 'bot' && !game.result) botTurn();
  }

  async function botTurn() {
    if (!alive || game.result || game.pos.turn === cfg!.myColor) return;
    botBusy = true; renderStatus(); renderActions();
    const token = ++gameToken;
    const pos = game.pos;
    const t0 = performance.now();
    const budget = clock.enabled ? clock.now(pos.turn) / 25 + clock.inc * 0.6 : 0;
    let uci: string | null = null;
    try {
      if (sf) {
        let count = 0;
        for (const [, d] of pos.allDests()) count += d.size();
        uci = await botMove(fenOf(pos), cfg!.elo!, game.chess960, count, budget);
      } else {
        const ms = Math.min(budget || 99999, 250 + (cfg!.elo || 1200) / 2.5);
        const r = await variantMove(fenOf(pos), variantInfo(cfg!.variant).rules, cfg!.elo || 1200, ms);
        uci = r?.uci ?? null;
      }
    } catch { toast(t('The engine failed to load.')); botBusy = false; return; }
    if (!alive || token !== gameToken || game.result || game.pos !== pos) return;
    const minT = cfg!.time && cfg!.time <= 2 ? 150 : 450;
    const spent = performance.now() - t0;
    if (spent < minT) await new Promise(r => setTimeout(r, minT - spent));
    if (!alive || token !== gameToken || game.result || game.pos !== pos) return;
    const m = uci ? uciToMove(pos, uci) : undefined;
    botBusy = false;
    if (!m) { sync(); return; }
    const mover = pos.turn;
    game.play(m);
    board.showMove(pos, m, game.pos, interactive());
    afterMove(mover);
    sync();
    tryPremove();
  }

  function tryPremove() {
    if (!board.premoveColor || !interactive()) return;
    setTimeout(() => { if (alive && interactive()) board.playPremove(); }, 30);
  }

  function takeback() {
    if (game.result || !game.ply) return;
    gameToken++; engine.stop(); variantStop(); botBusy = false;
    board.cancelPremove();
    if (cfg!.mode === 'bot') {
      const n = game.pos.turn === cfg!.myColor ? 2 : 1;
      if (game.ply < n) { game.undo(game.ply); } else game.undo(n);
    } else game.undo(1);
    viewPly = null;
    if (cfg!.mode === 'local' && cfg!.autoFlip) board.setOrientation(game.pos.turn);
    clock.stop();
    if (game.ply >= 1) clock.start(game.pos.turn);
    sync();
    recPush();
    if (cfg!.mode === 'bot' && game.pos.turn !== cfg!.myColor) botTurn();
  }

  /** Best move and evaluation (for the side to move) from whichever engine plays this variant. */
  async function bestMoveNow(): Promise<{ uci: string | null; cpForMover: number } | null> {
    const pos = game.pos;
    if (sf) {
      const r = await engine.analyse({ fen: fenOf(pos), depth: 13, chess960: game.chess960, multipv: 1 });
      if (!r) return null;
      const cp = whiteCp(r.lines[0], pos.turn);
      return { uci: r.bestmove, cpForMover: pos.turn === 'white' ? cp : -cp };
    }
    const r = await variantMove(fenOf(pos), variantInfo(cfg!.variant).rules, 3200, 900);
    return r ? { uci: r.uci, cpForMover: r.score } : null;
  }

  async function hint() {
    const r = await bestMoveNow();
    if (!r?.uci || !alive) return;
    const m = uciToMove(game.pos, r.uci);
    const s = m && moveSquares(game.pos, m);
    if (s) { board.arrows([{ orig: s[0] as any, brush: 'blue' }, { orig: s[0] as any, dest: s[1] as any, brush: 'blue' }]); setTimeout(() => board.arrows([]), 3500); }
  }

  async function offerDraw() {
    if (game.result || drawOffered) return;
    if (cfg!.mode === 'local') { if (confirm(t('Agree to a draw?'))) finish({ reason: 'agreement' }); return; }
    if (cfg!.mode === 'bot') {
      if (game.ply < 20) { toast(t('The computer declines: too early for a draw.')); return; }
      drawOffered = true; renderActions();
      const r = await bestMoveNow();
      drawOffered = false;
      if (!r || !alive || game.result) { renderActions(); return; }
      const botView = game.pos.turn === cfg!.myColor ? -r.cpForMover : r.cpForMover;
      if (botView < 40) { finish({ reason: 'agreement' }); toast(t('The computer accepts the draw.')); }
      else { toast(t('The computer declines the draw.')); renderActions(); if (game.pos.turn !== cfg!.myColor) botTurn(); }
      return;
    }
    drawOffered = true; cfg!.link!.send({ t: 'draw-offer' }); toast(t('Draw offer sent')); renderActions();
  }

  function resign() {
    if (game.result) return;
    if (!confirm(t('Resign this game?'))) return;
    const loser: Color = cfg!.mode === 'local' ? game.pos.turn : cfg!.myColor;
    if (net) cfg!.link!.send({ t: 'resign' });
    finish({ winner: loser === 'white' ? 'black' : 'white', reason: loser === 'white' ? 'White resigned' : 'Black resigned' });
  }

  /** Create the account record for this game (host / solo) or wait for the host's game id (guest). */
  function setupRecorder() {
    rec = null; ratingInfo = null; ratedNow = false;
    if (!me) { renderHead(); return; }
    if (!net) {
      rec = Recorder.create({ kind: cfg!.mode as any, variant: cfg!.variant, time: cfg!.time, inc: cfg!.inc, myColor: cfg!.myColor, meName: cfg!.mode === 'local' ? t('White') : myName(), oppName: cfg!.mode === 'local' ? t('Black') : cfg!.oppName, startFen: game.startFen });
    } else if (cfg!.isHost || !cfg!.oppId) {
      // the host creates the shared record; a signed-in guest whose host has no account keeps a private one
      const shared = !!cfg!.isHost && !!cfg!.oppId;
      rec = Recorder.create({ kind: cfg!.mode as any, variant: cfg!.variant, time: cfg!.time, inc: cfg!.inc, myColor: cfg!.myColor, meName: myName(), oppName: cfg!.oppName, opp: shared ? cfg!.oppId : null, rated: shared && !!cfg!.rated, startFen: game.startFen });
      if (shared && rec) { const r = rec; r.whenReady().then(() => { if (r.id && rec === r) cfg!.link!.send({ t: 'gid', id: r.id }); }); }
    }
    renderHead();
  }

  function resetGame(newCfg: Partial<GameConfig>) {
    Object.assign(cfg!, newCfg);
    gameToken++; engine.stop(); engine.newGame(); variantStop();
    game = new Game(cfg!.variant, cfg!.startFen);
    clock = new Clock(cfg!.time * 60000, cfg!.inc * 1000);
    lowWarned = { white: false, black: false };
    viewPly = null; drawOffered = false; rematchAsked = false; botBusy = false; takebackPending = false; shown = false;
    closeEndModal?.(); clearOffers(); board.cancelPremove(); board.setPendingDrop(null);
    board.movableColor = cfg!.mode === 'local' ? 'both' : cfg!.myColor;
    board.setOrientation(cfg!.mode === 'local' ? 'white' : cfg!.myColor);
    board.arrows([]);
    endBox.replaceChildren();
    setupRecorder();
    sync();
    if (cfg!.mode === 'bot' && game.pos.turn !== cfg!.myColor) botTurn();
  }

  function rematch() {
    if (net) {
      if (rematchAsked) return;
      rematchAsked = true; cfg!.link!.send({ t: 'rematch' }); renderEnd(); return;
    }
    const sameStart = cfg!.variant === 'chess960' ? startFenFor('chess960') : cfg!.startFen;
    resetGame({ startFen: sameStart, myColor: cfg!.mode === 'bot' ? (cfg!.myColor === 'white' ? 'black' : 'white') : cfg!.myColor });
  }

  // ---- Network handling ----
  let lastSeen = Date.now();
  let heartbeat: any = 0;
  if (net) {
    const link = cfg.link!;
    link.onMsg = (m: Msg) => {
      if (!alive) return;
      switch (m.t) {
        case 'hello': if (typeof m.rating === 'number') { cfg.oppRating = m.rating; renderStrips(); } break;
        case 'move': {
          if (game.result) return;
          if (m.ply !== game.ply + 1) return;
          if (game.pos.turn === cfg.myColor) return;
          const prev = game.pos, mover = prev.turn;
          const mv = uciToMove(prev, m.uci);
          if (!mv || !game.play(mv)) return;
          if (viewPly === null) board.showMove(prev, mv, game.pos);
          else sound.move();
          afterMove(mover, m.clock);
          sync();
          tryPremove();
          break;
        }
        case 'gid': {
          if (cfg.isHost || !me) return;
          const r = Recorder.join(m.id);
          rec = r;
          r?.whenReady().then(() => {
            if (rec !== r) return;
            ratedNow = r!.rated;
            link.send({ t: 'gid-ok', rated: ratedNow });
            if (cfg.rated && !ratedNow) toast(t('This game is not rated: rated games are only possible between friends.'));
            recPush(); renderHead(); renderStrips();
          });
          break;
        }
        case 'gid-ok':
          ratedNow = !!m.rated && !!rec?.id;
          if (cfg.rated && !ratedNow) toast(t('This game is not rated: rated games are only possible between friends.'));
          renderHead(); renderStrips();
          break;
        case 'resume': {
          const theirs = Array.isArray(m.ucis) ? m.ucis : [];
          if (theirs.length > game.ply && theirs.slice(0, game.ply).join(' ') === game.ucis.join(' ')) {
            for (const u of theirs.slice(game.ply)) { const mover = game.pos.turn; if (!game.playUci(u)) break; afterMove(mover); }
            sync();
          }
          if (!m.reply) link.send({ t: 'resume', ucis: game.ucis.slice(), reply: true });
          toast(t('Reconnected'));
          break;
        }
        case 'takeback-offer':
          if (game.result || m.ply < 0 || m.ply >= game.ply) return;
          offerBar('takeback', t('{0} asks to take back a move.', cfg.oppName), [
            btn(t('Accept'), () => { link.send({ t: 'takeback-accept', ply: m.ply }); applyTakeback(m.ply); }, 'primary small'),
            btn(t('Decline'), () => { link.send({ t: 'takeback-decline' }); clearOffers('takeback'); }, 'small')]);
          break;
        case 'takeback-accept': if (takebackPending) applyTakeback(m.ply); break;
        case 'takeback-decline': takebackPending = false; toast(t('Takeback declined')); renderActions(); break;
        case 'resign': finish({ winner: cfg.myColor, reason: cfg.myColor === 'white' ? 'Black resigned' : 'White resigned' }); break;
        case 'flag': if (!game.result) { clock.t[m.color] = 0; finish({ winner: m.color === 'white' ? 'black' : 'white', reason: 'time out' }); } break;
        case 'draw-offer':
          if (game.result) return;
          offerBar('draw', t('{0} offers a draw.', cfg.oppName), [
            btn(t('Accept'), () => { link.send({ t: 'draw-accept' }); clearOffers('draw'); finish({ reason: 'agreement' }); }, 'primary small'),
            btn(t('Decline'), () => { link.send({ t: 'draw-decline' }); clearOffers('draw'); }, 'small')]);
          break;
        case 'draw-accept': if (drawOffered) finish({ reason: 'agreement' }); break;
        case 'draw-decline': drawOffered = false; toast(t('Draw declined')); renderActions(); break;
        case 'chat': addChat(cfg.oppName, String(m.text).slice(0, 140)); break;
        case 'rematch':
          if (!game.result) return;
          if (rematchAsked) { doRematch(); link.send({ t: 'rematch-accept' }); }
          else {
            offerBar('rematch', t('{0} wants a rematch.', cfg.oppName), [
              btn(t('Accept'), () => { link.send({ t: 'rematch-accept' }); clearOffers('rematch'); doRematch(); }, 'primary small'),
              btn(t('No thanks'), () => clearOffers('rematch'), 'small')]);
          }
          break;
        case 'rematch-accept': if (game.result) doRematch(); break;
        case 'leave': if (!game.result) { toast(t('{0} left the game.', cfg.oppName)); finish({ winner: cfg.myColor, reason: 'opponent left' }); } else toast(t('{0} left.', cfg.oppName)); break;
      }
    };
    link.onClose = () => {
      if (!alive || game.result) return;
      if (cfg.mode === 'friend') {
        toast(t('Connection lost — reconnecting…'));
        if (!cfg.isHost) link.rejoin().then(() => link.send({ t: 'resume', ucis: game.ucis.slice() })).catch(() => {});
        return;
      }
      toast(t('Connection lost.'));
      finish({ winner: cfg.myColor, reason: 'opponent disconnected' });
    };
    const inner = link.onMsg;
    link.onMsg = (m: Msg) => { lastSeen = Date.now(); if (m.t !== 'ping') inner(m); };
    heartbeat = setInterval(() => {
      link.send({ t: 'ping' });
      if (alive && !game.result && Date.now() - lastSeen > 45000) { toast(t('Opponent connection lost.')); finish({ winner: cfg.myColor, reason: 'opponent disconnected' }); }
    }, 4000);
    window.addEventListener('pagehide', onHide);
  }
  function onHide() { cfg!.link?.send({ t: 'leave' }); }
  let rematchCount = 0;
  function doRematch() {
    if (!game.result) return;
    rematchCount++;
    const newColor: Color = cfg!.myColor === 'white' ? 'black' : 'white';
    const fen = cfg!.variant === 'chess960' ? fixed960(rematchCount) : cfg!.startFen;
    resetGame({ myColor: newColor, startFen: fen });
    clearOffers();
  }
  function fixed960(n: number) {
    const seed = [...cfg!.startFen + n].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const orig = Math.random; let s = seed;
    Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    try { return startFenFor('chess960'); } finally { Math.random = orig; }
  }

  const keys = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') view((viewPly ?? game.ply) - 1);
    else if (e.key === 'ArrowRight') view((viewPly ?? game.ply) + 1);
    else if (e.key === 'f') { board.flip(); renderStrips(); }
    else if (e.key === 'Escape') board.setPendingDrop(null);
  };
  document.addEventListener('keydown', keys);

  setupRecorder();
  sync();
  engine.newGame();
  if (cfg.mode === 'bot') { if (sf) engine.ready().catch(() => toast(t('Engine could not start in this browser.'))); if (game.pos.turn !== cfg.myColor) botTurn(); }
  if (net) toast(cfg.myColor === 'white' ? t('Game on! You play white.') : t('Game on! You play black.'));

  return () => {
    alive = false;
    clearInterval(timer);
    engine.stop(); variantStop();
    document.removeEventListener('keydown', keys);
    setLeaveGuard(null);
    clearOffers(); closeEndModal?.();
    // leaving an unfinished game counts as a loss on the account
    if (rec && !game.result && game.ply >= 1) rec.finish(cfg.mode === 'local' ? undefined : cfg.myColor === 'white' ? 'black' : 'white', 'abandoned', game.ucis);
    if (net) { clearInterval(heartbeat); window.removeEventListener('pagehide', onHide); cfg.link!.destroy(); }
    board.destroy();
  };
}

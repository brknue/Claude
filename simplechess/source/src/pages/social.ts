/** Account, profile, friends, live watching and legal pages. */
import { badges } from '../badges';
import { h, icon, btn, toast, modal, copyText, appBridge, askConfirm, askText } from '../ui';
import { t, fmtDate } from '../i18n';
import {
  me, accountsEnabled, signIn, signUp, signOut, resetPassword, newRecoveryCode, changePassword, deleteAccount,
  rpc, niceError, validUsername, refreshMe, MODES, BASE_RATING, Stat, watchGame, onAccount, sb,
} from '../account';
import { VARIANTS, VariantKey, variantName, Color, startFenFor } from '../chess';
import { Game } from '../game';
import { Board } from '../board';
import { go } from '../main';
import { setAnalysisInput } from './analysis';
import { hostFriend, tcLabel, TIME_PRESETS, modeLabel, premoveBox } from './play';
import { OPERATOR_NAME, OPERATOR_CONTACT, POLICY_DATE, POLICY_VERSION } from '../config';
import { newDailyDialog, timeLeft } from './daily';
import { puzzleDaysCard } from './dailypuzzle';
import { reviewBacklog, onReviewsSaved, reviewsRunning, brilliantsAvailable, noteMissing } from '../review';

const notReady = (root: HTMLElement) => root.append(h('section.card.setup', null, h('h1', null, t('Accounts')),
  h('p', null, t('Accounts are not set up on this site yet.')), h('a.btn', { href: '#/' }, t('Back'))));

const field = (label: string, input: HTMLElement, hint?: string) => h('label.field', null, h('span.lbl', null, label), input, hint ? h('span.muted.small', null, hint) : null);
const pwInput = (auto: string) => h('input', { type: 'password', autocomplete: auto, minLength: 8, maxLength: 72, required: true }) as HTMLInputElement;

// ---------------------------------------------------------------- sign in / up / reset
export function accountPage(root: HTMLElement, arg?: string) {
  if (!accountsEnabled()) { notReady(root); return; }
  if (me) { go('profile/' + me.username); return; }
  let tab: 'in' | 'up' | 'reset' = arg === 'new' ? 'up' : arg === 'reset' ? 'reset' : 'in';
  const box = h('div');
  const err = h('p.err', { role: 'alert' });
  const card = h('section.card.setup.auth', null, h('h1', null, t('Your Simple Chess account')),
    h('p.muted', null, t('Keep your ratings, add friends, challenge them, watch their games and review your own games on any device.')), box);
  root.append(card);

  function busy(b: HTMLButtonElement, on: boolean) { b.disabled = on; b.classList.toggle('loading', on); }

  function render() {
    err.textContent = '';
    const tabs = h('div.seg', { role: 'tablist' }, ([['in', 'Sign in'], ['up', 'Create account'], ['reset', 'Forgot password']] as const).map(([k, l]) =>
      h('button', { type: 'button', role: 'tab', class: tab === k ? 'on' : '', 'aria-selected': String(tab === k), onclick: () => { tab = k; render(); } }, t(l))));
    const user = h('input', { autocomplete: 'username', autocapitalize: 'off', spellcheck: false, maxLength: 20, required: true }) as HTMLInputElement;
    if (tab === 'in') {
      const pw = pwInput('current-password');
      const go1 = btn(t('Sign in'), async () => {
        if (!user.value.trim() || !pw.value) { err.textContent = t('Enter your username and password.'); return; }
        busy(go1, true);
        try { await signIn(user.value, pw.value); toast(t('Welcome back, {0}!', me!.username)); go('profile/' + me!.username); }
        catch (e) { err.textContent = niceError(e); }
        busy(go1, false);
      }, 'primary big block');
      box.replaceChildren(tabs, h('form', { onsubmit: (e: Event) => { e.preventDefault(); go1.click(); } }, field(t('Username'), user), field(t('Password'), pw), err, go1));
    } else if (tab === 'up') {
      const pw = pwInput('new-password'), pw2 = pwInput('new-password');
      const age = h('input', { type: 'checkbox' }) as HTMLInputElement;
      const terms = h('input', { type: 'checkbox' }) as HTMLInputElement;
      const go1 = btn(t('Create account'), async () => {
        const u = user.value.trim();
        if (!validUsername(u)) { err.textContent = t('Usernames are 3 to 20 letters, digits or _.'); return; }
        if (pw.value.length < 8) { err.textContent = t('Passwords need at least 8 characters.'); return; }
        if (pw.value !== pw2.value) { err.textContent = t('The passwords do not match.'); return; }
        if (!age.checked || !terms.checked) { err.textContent = t('Please confirm both boxes.'); return; }
        busy(go1, true);
        try { const code = await signUp(u, pw.value); showRecovery(code, true); }
        catch (e) { err.textContent = niceError(e); }
        busy(go1, false);
      }, 'primary big block');
      box.replaceChildren(tabs, h('form', { onsubmit: (e: Event) => { e.preventDefault(); go1.click(); } },
        field(t('Username'), user, t('3–20 letters, digits or _. Other players see it, so do not use your real name.')),
        field(t('Password'), pw, t('At least 8 characters.')), field(t('Repeat password'), pw2),
        h('label.check', null, age, t('I am 16 or older, or a parent or guardian has agreed.')),
        h('label.check', null, terms, h('span', null, t('I accept the terms of use and have read the privacy policy.'), ' (', h('a', { href: '#/terms', target: '_blank' }, t('Terms')), ' · ', h('a', { href: '#/privacy', target: '_blank' }, t('Privacy policy')), ')')),
        h('p.muted.small', null, t('No e-mail address needed. You get a recovery code instead, in case you forget your password.')),
        err, go1));
    } else {
      const code = h('input', { autocomplete: 'off', autocapitalize: 'characters', spellcheck: false, placeholder: 'ABCD-EFGH-…' }) as HTMLInputElement;
      const pw = pwInput('new-password');
      const go1 = btn(t('Set new password'), async () => {
        if (!user.value.trim() || !code.value.trim() || pw.value.length < 8) { err.textContent = t('Fill in all fields (password: at least 8 characters).'); return; }
        busy(go1, true);
        try {
          const ok = await resetPassword(user.value, code.value, pw.value);
          if (!ok) err.textContent = t('Username or recovery code is wrong.');
          else { toast(t('Password changed. You can sign in now.')); tab = 'in'; render(); }
        } catch (e) { err.textContent = niceError(e); }
        busy(go1, false);
      }, 'primary big block');
      box.replaceChildren(tabs, h('form', { onsubmit: (e: Event) => { e.preventDefault(); go1.click(); } },
        h('p.muted.small', null, t('Use the recovery code you saved when you created your account.')),
        field(t('Username'), user), field(t('Recovery code'), code), field(t('New password'), pw), err, go1));
    }
  }
  render();
}

function showRecovery(code: string, fresh: boolean) {
  const close = modal(h('div', null, h('h2', null, t('Save your recovery code')),
    h('p', null, t('If you forget your password, this code is the only way back into your account. Write it down or save it in your password manager. It is shown only now.')),
    h('div.code-box', null, h('b.code.recovery', null, code)),
    h('div.row.wrap', null, btn(h('span', null, icon('copy'), t('Copy')), () => copyText(code)),
      btn(t('I saved it'), () => { close(); if (fresh && me) go('profile/' + me.username); }, 'primary'))), { dismissable: false });
}

// ---------------------------------------------------------------- profile
export const online = (iso?: string | null) => !!iso && Date.now() - new Date(iso).getTime() < 90000;
export const lastSeenText = (iso?: string | null) => {
  if (!iso) return '';
  if (online(iso)) return t('Online now');
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return t('Last seen {0} min ago', mins);
  if (mins < 1440) return t('Last seen {0} h ago', Math.round(mins / 60));
  return t('Last seen {0}', fmtDate(iso));
};

function ratingGrid(ratings: Record<string, Stat> | null) {
  return h('div.rating-grid', null, MODES.map(([k, label]) => {
    const s = ratings?.[k];
    return h('div.rcell', { class: s ? '' : 'unplayed' }, h('span.muted.small', null, t(label)), h('b', null, String(s?.r ?? BASE_RATING)),
      h('span.muted.small', null, s ? t('{0} games', s.g) : t('not played yet')));
  }));
}

export function profilePage(root: HTMLElement, username?: string) {
  if (!accountsEnabled()) { notReady(root); return; }
  if (!me) { go('account'); return; }
  const name = username || me.username;
  let alive = true;
  const wrap = h('div.profile');
  root.append(wrap);
  wrap.append(h('div.spinner-row', null, h('span.spinner'), t('Loading…')));

  async function load() {
    let p: any;
    try { p = await rpc('get_profile', { p_username: name }); } catch (e) { wrap.replaceChildren(h('p.err', null, niceError(e))); return; }
    if (!alive) return;
    if (!p) { wrap.replaceChildren(h('section.card', null, h('h1', null, t('Player not found')), h('a.btn', { href: '#/friends' }, t('Back')))); return; }
    const self = p.relation === 'self', friend = p.relation === 'friend';
    const actions: HTMLElement[] = [];
    if (self || friend) actions.push(liveGamesButton(p.id, p.username, self));
    if (friend) {
      if (p.live) actions.push(h('a.btn.primary', { href: '#/watch/' + p.live }, icon('eye'), t('Watch live game')));
      actions.push(btn(h('span', null, icon('play'), t('Challenge')), () => challengeDialog(p.id, p.username), 'primary'));
      actions.push(h('a.btn', { href: '#/chat/' + encodeURIComponent(p.username) }, icon('chat'), t('Message')));
      actions.push(btn(h('span', null, icon('calendar'), t('Daily game')), () => newDailyDialog(p.id, p.username)));
      actions.push(btn(t('Remove friend'), async () => { if (!(await askConfirm(t('Remove {0} from your friends?', p.username), { ok: t('Remove'), danger: true }))) return; await rpc('friend_remove', { p_other: p.id }).catch(e => toast(niceError(e))); load(); }, 'ghost'));
    } else if (!self) {
      if (p.relation === 'incoming') actions.push(btn(t('Accept friend request'), async () => { await rpc('friend_respond', { p_other: p.id, p_accept: true }).catch(e => toast(niceError(e))); load(); }, 'primary'));
      else if (p.relation === 'outgoing') actions.push(h('span.muted', null, t('Friend request sent')));
      else actions.push(btn(h('span', null, icon('users'), t('Add friend')), async () => { try { const r = await rpc('friend_request', { p_username: p.username }); toast(r === 'accepted' ? t('You are now friends!') : t('Friend request sent')); } catch (e) { toast(niceError(e)); } load(); }, 'primary'));
    }
    wrap.replaceChildren(
      h('section.card.profile-head', null,
        h('div.avatar', { 'aria-hidden': 'true' }, p.username.slice(0, 1).toUpperCase()),
        h('div', null, h('h1', null, p.username, badges(p.username), self ? h('span.tag', null, t('You')) : friend ? h('span.tag', null, t('Friend')) : null),
          h('div.muted.small', null, t('Member since {0}', fmtDate(p.created_at)), p.last_seen ? ' · ' : '', p.last_seen ? h('span', { class: online(p.last_seen) ? 'online' : '' }, lastSeenText(p.last_seen)) : null)),
        h('div.row.wrap.profile-actions', null, actions)),
      brilliantCard(p.username, self),
      puzzleDaysCard(p.username),
      p.ratings ? h('section.card', null, h('h2', null, t('Ratings')), ratingGrid(p.ratings), self ? ratingPrivacy(p.rating_visibility) : null)
        : h('section.card', null, h('p.muted', null, t('This player keeps their ratings private.'))),
      !self && !friend ? h('section.card', null, h('p.muted', null, t('Games are visible to friends only.'))) : '',
      self || friend ? gamesCard(p.username, p.id) : '',
      self ? settingsCard() : '');
  }
  load();
  if (name.toLowerCase() === me.username.toLowerCase()) reviewBacklog();
  const off = onAccount(() => { if (!me) go('account'); });
  return () => { alive = false; off(); };
}

/** Daily games that are still running, and a real-time game being played right now. */
async function liveGamesOf(uid: string): Promise<any[]> {
  const c = await sb();
  const { data, error } = await c.from('games')
    .select('id, kind, status, variant, start_fen, moves, white_id, black_id, white_name, black_name, deadline, last_move_at, updated_at, time_base, time_inc, rated')
    .eq('status', 'live').or(`white_id.eq.${uid},black_id.eq.${uid}`).order('updated_at', { ascending: false }).limit(50);
  if (error) throw error;
  // a real-time game nobody touched for an hour was left open, not played
  return (data || []).filter((g: any) => g.kind === 'daily' || Date.now() - new Date(g.updated_at).getTime() < 3600e3);
}

/** When a daily game ends without another move: the player to move loses on time, or after a week without moves nobody wins. */
function dailyEnd(g: any): { at: number; what: 'time' | 'abort' } | null {
  const dl = g.deadline ? new Date(g.deadline).getTime() : Infinity;
  const ab = g.last_move_at ? new Date(g.last_move_at).getTime() + 7 * 864e5 : Infinity;
  if (dl === Infinity && ab === Infinity) return null;
  return dl <= ab ? { at: dl, what: 'time' } : { at: ab, what: 'abort' };
}

function liveGamesButton(uid: string, username: string, self: boolean): HTMLElement {
  const count = h('span.count-badge', { style: { display: 'none' } });
  const b = btn(h('span', null, icon('clock'), t('Live games'), ' ', count), () => openList(), '');
  liveGamesOf(uid).then(gs => { if (gs.length) { count.textContent = String(gs.length); count.style.display = ''; } }).catch(() => {});
  async function openList() {
    const list = h('div.games-list.live-list', null, h('div.spinner-row', null, h('span.spinner'), t('Loading…')));
    const close = modal(h('div.live-games', null, h('h2', null, self ? t('Your live games') : t('Live games of {0}', username)), list,
      h('p.muted.small', null, t('Daily games end when the player to move runs out of time, or with no winner after a week without a move.')),
      h('div.row.end', null, btn(t('Close'), () => close()))));
    let gs: any[] = [];
    try { gs = await liveGamesOf(uid); } catch (e) { list.replaceChildren(h('p.err', null, niceError(e))); return; }
    let iv: any = 0;
    const draw = () => {
      if (!list.isConnected) { clearInterval(iv); return; }
      list.replaceChildren(...(gs.length ? gs.map(g => liveRow(g, uid, () => close())) : [h('p.muted', null, t('No live games right now.'))]));
    };
    draw();
    iv = setInterval(draw, 30000);
  }
  return b;
}

function liveRow(g: any, uid: string, close: () => void): HTMLElement {
  const white = g.white_id === uid;
  const opp = white ? g.black_name : g.white_name;
  const n = g.moves ? g.moves.split(' ').length : 0;
  const startBlack = / b /.test(String(g.start_fen || ''));
  const whiteToMove = (n % 2 === 0) !== startBlack;
  const toMoveName = whiteToMove ? g.white_name : g.black_name;
  const daily = g.kind === 'daily';
  const end = daily ? dailyEnd(g) : null;
  const left = end ? timeLeft(new Date(end.at).toISOString()) : '';
  const urgent = end ? end.at - Date.now() < 864e5 : false;
  return h('button.game-row.live', {
    type: 'button',
    onclick: () => { close(); go((daily ? 'daily/' : 'watch/') + g.id); },
  },
  h('span.gr-res', null, daily ? t('Daily') : t('Live')),
  h('span.gr-main', null, h('b', null, (white ? '○ ' : '● ') + t('vs {0}', opp)),
    h('span.muted.small', null, `${variantName(g.variant)} · ${daily ? t('Daily') : g.time_base ? tcLabel(g.time_base, g.time_inc) : '∞'}${g.rated ? ' · ' + t('Rated') : ''} · ${t('{0} moves', Math.ceil(n / 2))}`),
    h('span.small', null, !daily ? t('Playing now') : me && toMoveName === me.username ? t('Your move') : t('{0} to move', toMoveName))),
  h('span.gr-side', null,
    end ? h('span.deadline', { class: urgent ? 'urgent' : '', title: end.what === 'time' ? t('Then {0} loses on time', toMoveName) : t('Then the game is aborted: no winner') },
      h('b', null, left), h('span.muted.small.block', null, end.what === 'time' ? t('until loss on time') : t('until aborted'))) : null));
}

/** Brilliant moves of a player: visible to everyone signed in. Hidden if the database add-on is missing. */
function brilliantCard(username: string, self: boolean): HTMLElement {
  const card = h('section.card.brill-card', { style: { display: 'none' } });
  const draw = async () => {
    let s: any = null;
    if (!brilliantsAvailable()) { card.style.display = 'none'; return; }
    try { s = await rpc('brilliant_stats', { p_username: username }); } catch (e) { noteMissing(e); card.style.display = 'none'; return; }
    if (!s) { card.style.display = 'none'; return; }
    card.style.display = '';
    card.replaceChildren(
      h('span.badge.big.brill', { 'aria-hidden': 'true' }, '!!'),
      h('div', null, h('div.brill-num', null, String(s.total)), h('div.muted.small', null, t('Brilliant moves'))),
      h('div.brill-side.muted.small', null, s.total ? t('in {0} games', s.games) : t('No brilliant moves yet'),
        self && reviewsRunning() ? h('span.block', null, t('Reviewing your recent games…')) : null));
  };
  draw();
  const off = onReviewsSaved(() => { if (card.isConnected) draw(); else off(); });
  return card;
}

function resultFor(g: any, uid: string): 'win' | 'loss' | 'draw' | '' {
  if (!g.result) return '';
  if (g.result === '1/2-1/2') return 'draw';
  const white = g.white_id === uid;
  return (g.result === '1-0') === white ? 'win' : 'loss';
}

const myBrilliants = (g: any, uid: string) => (g.white_id === uid ? g.white_brilliant : g.black_brilliant) || 0;

function gamesCard(username: string, uid: string) {
  const list = h('div.games-list');
  const more = btn(t('Load more'), () => load(), 'ghost');
  const rows: any[] = [];
  let before: string | null = null;
  let onlyBrilliant = false;
  const filter = h('label.check.small.brill-filter', null,
    h('input', { type: 'checkbox', onchange: (e: any) => { onlyBrilliant = e.target.checked; draw(); } }),
    h('span.badge.brill', null, '!!'), ' ', t('Only games with brilliant moves'));
  function draw() {
    const shown = onlyBrilliant ? rows.filter(g => myBrilliants(g, uid) > 0) : rows;
    list.replaceChildren(...(shown.length ? shown.map(g => gameRow(g, uid)) : [h('p.muted', null, onlyBrilliant ? t('No brilliant moves yet') : t('No games yet.'))]));
    filter.style.display = rows.some(g => g.reviewed_at !== undefined) ? '' : 'none';
  }
  async function load() {
    more.disabled = true;
    try {
      const got = await rpc<any[]>('game_list', { p_username: username, p_before: before, p_limit: 20 });
      rows.push(...got);
      before = got.length ? got[got.length - 1].created_at : before;
      more.style.display = got.length < 20 ? 'none' : '';
      draw();
    } catch (e) { list.append(h('p.err', null, niceError(e))); }
    more.disabled = false;
  }
  load();
  const off = onReviewsSaved(() => { if (!list.isConnected) { off(); return; } rows.length = 0; before = null; load(); });
  return h('section.card', null, h('div.games-head', null, h('h2', null, t('Games')), filter), list, more);
}

function gameRow(g: any, uid: string) {
  const white = g.white_id === uid;
  const res = resultFor(g, uid);
  const opp = white ? g.black_name : g.white_name;
  const diff = white ? g.white_diff : g.black_diff;
  const n = g.moves ? g.moves.split(' ').length : 0;
  const live = g.status === 'live';
  const brill = myBrilliants(g, uid);
  // jump straight to this player's first brilliant move
  const startWhite = !/ b /.test(String(g.start_fen));
  const brillPly = String(g.brilliant_plies || '').split(',').map(Number).filter(k => k > 0 && ((k % 2 === 1) === startWhite) === white)[0];
  const label = live ? t('Live') : g.status === 'aborted' ? t('Aborted') : g.status === 'disputed' ? t('Disputed') : res === 'win' ? t('Won') : res === 'loss' ? t('Lost') : t('Draw');
  return h('button.game-row', {
    type: 'button', class: live ? 'live' : res,
    onclick: () => {
      if (live) { go((g.kind === 'daily' ? 'daily/' : 'watch/') + g.id); return; }
      setAnalysisInput({ variant: g.variant, startFen: g.start_fen, ucis: n ? g.moves.split(' ') : [], white: g.white_name, black: g.black_name, orientation: white ? 'white' : 'black', gameId: g.id, autoReview: brill > 0, ply: brill > 0 ? brillPly : undefined });
      go('analysis');
    },
  },
  h('span.gr-res', null, label),
  h('span.gr-main', null, h('b', null, (white ? '○ ' : '● ') + t('vs {0}', opp)), h('span.muted.small', null, `${variantName(g.variant)} · ${g.kind === 'daily' ? t('Daily') : g.time_base ? tcLabel(g.time_base, g.time_inc) : '∞'}${g.rated ? ' · ' + t('Rated') : ''} · ${t('{0} moves', Math.ceil(n / 2))}`)),
  h('span.gr-side', null, g.clocks?.hints ? h('span.hint-badge', { title: t('Hints used: {0}', g.clocks.hints) }, t('Hints used: {0}', g.clocks.hints)) : null, brill ? h('span.brill-badge', { title: t('Brilliant moves') }, '!! ×' + brill) : null, g.rated && diff != null ? h('span.delta', { class: diff >= 0 ? 'up' : 'down' }, (diff >= 0 ? '+' : '') + diff) : null, h('span.muted.small', null, fmtDate(g.created_at))));
}

/** Who may see my ratings (needs supabase/add-rating-privacy.sql; hidden until it is installed). */
function ratingPrivacy(vis?: string): HTMLElement | null {
  if (!vis) return null;
  const sel = h('select', { 'aria-label': t('Who can see your ratings'), onchange: async (e: any) => {
    try { await rpc('set_rating_visibility', { p_vis: e.target.value }); toast(t('Saved')); } catch (err) { toast(niceError(err)); }
  } }, [['everyone', t('Everyone')], ['friends', t('Friends only')], ['nobody', t('Only me')]].map(([v, l]) => h('option', { value: v, selected: v === vis }, l)));
  return h('label.field.rating-privacy', null, h('span.lbl', null, t('Who can see your ratings')), sel);
}

function settingsCard() {
  const nameIn = h('input', { value: me!.username, maxLength: 20, autocapitalize: 'off', spellcheck: false }) as HTMLInputElement;
  const pw = pwInput('new-password');
  return h('section.card.account-settings', null, h('h2', null, t('Account settings')),
    h('div.field', null, h('span.lbl', null, t('Username')), h('div.row', null, nameIn, btn(t('Save'), async () => {
      const u = nameIn.value.trim();
      if (!validUsername(u)) { toast(t('Usernames are 3 to 20 letters, digits or _.')); return; }
      try { await rpc('rename', { p_username: u }); await refreshMe(); toast(t('Username changed')); go('profile/' + u); } catch (e) { toast(niceError(e)); }
    }))),
    h('div.field', null, h('span.lbl', null, t('New password')), h('div.row', null, pw, btn(t('Save'), async () => {
      if (pw.value.length < 8) { toast(t('Passwords need at least 8 characters.')); return; }
      try { await changePassword(pw.value); pw.value = ''; toast(t('Password changed')); } catch (e) { toast(niceError(e)); }
    }))),
    h('div.row.wrap', null,
      btn(t('New recovery code'), async () => { if (!(await askConfirm(t('Your old recovery code will stop working. Continue?')))) return; try { showRecovery(await newRecoveryCode(), false); } catch (e) { toast(niceError(e)); } }),
      btn(h('span', null, icon('copy'), t('Download my data')), async () => {
        try {
          const data: any = await rpc('export_my_data');
          try { data.puzzle_days = await rpc('export_puzzle_days'); } catch { /* add-on not installed */ }
          const name = `simplechess-${me!.username}.json`, json = JSON.stringify(data, null, 2);
          if (appBridge?.saveFile(name, 'application/json', json)) { toast(t('Saved to Downloads')); return; }
          const a = h('a', { href: URL.createObjectURL(new Blob([json], { type: 'application/json' })), download: name }) as HTMLAnchorElement;
          document.body.append(a); a.click(); a.remove();
        } catch (e) { toast(niceError(e)); }
      }),
      btn(t('Sign out'), async () => { await signOut(); toast(t('Signed out')); go(''); })),
    ((me as any)?.roles || []).includes('owner') ? null : h('details.danger-zone', null, h('summary', null, t('Delete account')),
      h('p.muted.small', null, t('Deletes your account, ratings, friends and your games against the computer for good. In games against other players your name is replaced by "Deleted player". This cannot be undone.')),
      btn(t('Delete my account'), async () => {
        const typed = await askText(t('Type your username to confirm: {0}', me!.username), { ok: t('Delete') });
        if (typed !== me!.username) { if (typed !== null) toast(t('The username did not match.')); return; }
        try { await deleteAccount(); toast(t('Your account was deleted.')); go(''); } catch (e) { toast(niceError(e)); }
      }, 'danger')),
    h('p.muted.small', null, h('a', { href: '#/privacy' }, t('Privacy policy')), ' · ', h('a', { href: '#/terms' }, t('Terms'))));
}

// ---------------------------------------------------------------- friends
export function friendsPage(root: HTMLElement) {
  if (!accountsEnabled()) { notReady(root); return; }
  if (!me) {
    root.append(h('section.card.setup.center', null, h('h1', null, t('Friends')), h('p.muted', null, t('Sign in to add friends, challenge them and watch their games.')),
      h('div.row.center', null, h('a.btn.primary', { href: '#/account' }, t('Sign in')), h('a.btn', { href: '#/account/new' }, t('Create account')))));
    return;
  }
  let alive = true;
  const search = h('input.search', { type: 'search', placeholder: t('Find players by username'), autocapitalize: 'off', spellcheck: false, 'aria-label': t('Find players by username') }) as HTMLInputElement;
  const results = h('div.search-results');
  const list = h('div.friend-list');
  root.append(h('div.friends-page', null,
    h('section.card', null, h('h1', null, t('Friends')), h('div.search-wrap', null, icon('search'), search), results),
    h('section.card', null, list)));
  let q = 0;
  search.addEventListener('input', async () => {
    const v = search.value.trim();
    const my = ++q;
    if (v.length < 2) { results.replaceChildren(); return; }
    try {
      const rows = await rpc<{ username: string }[]>('search_users', { p_query: v });
      if (my !== q || !alive) return;
      results.replaceChildren(...(rows.length ? rows.map(r => h('a.user-row', { href: '#/profile/' + encodeURIComponent(r.username) }, h('span.avatar.sm', null, r.username[0].toUpperCase()), h('b', null, r.username, badges(r.username)), h('span.muted.small', null, t('View profile')))) : [h('p.muted.small', null, t('No players found.'))]));
    } catch (e) { results.replaceChildren(h('p.err', null, niceError(e))); }
  });

  async function load() {
    let rows: any[] = [];
    try { rows = await rpc<any[]>('list_friends'); } catch (e) { list.replaceChildren(h('p.err', null, niceError(e))); return; }
    if (!alive) return;
    const inc = rows.filter(r => r.relation === 'incoming'), fr = rows.filter(r => r.relation === 'friend'), out = rows.filter(r => r.relation === 'outgoing');
    fr.sort((a, b) => Number(online(b.last_seen)) - Number(online(a.last_seen)) || String(a.username).localeCompare(b.username));
    const out2: HTMLElement[] = [];
    if (inc.length) out2.push(h('h2', null, t('Friend requests')), ...inc.map(r => h('div.friend', null,
      h('a.fname', { href: '#/profile/' + r.username }, h('span.avatar.sm', null, r.username[0].toUpperCase()), h('b', null, r.username)),
      h('div.row', null, btn(t('Accept'), async () => { await rpc('friend_respond', { p_other: r.id, p_accept: true }).catch(e => toast(niceError(e))); load(); }, 'primary small'),
        btn(t('Decline'), async () => { await rpc('friend_respond', { p_other: r.id, p_accept: false }).catch(e => toast(niceError(e))); load(); }, 'small')))));
    out2.push(h('h2', null, t('Your friends'), h('span.muted.small', null, ` (${fr.length})`)));
    if (!fr.length) out2.push(h('p.muted', null, t('No friends yet. Search for a username above and send a friend request.')));
    out2.push(...fr.map(r => {
      const best = Object.entries((r.ratings || {}) as Record<string, Stat>).sort((a, b) => b[1].g - a[1].g)[0];
      return h('div.friend', null,
        h('a.fname', { href: '#/profile/' + r.username }, h('span.avatar.sm', { class: online(r.last_seen) ? 'on' : '' }, r.username[0].toUpperCase()),
          h('span', null, h('b', null, r.username, badges(r.username)), h('span.muted.small.block', null, r.live ? t('Playing now') : lastSeenText(r.last_seen), best ? ` · ${t(modeLabel(best[0]))} ${best[1].r}` : ` · ${BASE_RATING}`))),
        h('div.row', null,
          r.live ? h('a.btn.small', { href: '#/watch/' + r.live }, icon('eye'), t('Watch')) : null,
          h('a.btn.small.icon', { href: '#/chat/' + encodeURIComponent(r.username), title: t('Message'), 'aria-label': t('Message') }, icon('chat')),
          btn(h('span', null, icon('play'), t('Challenge')), () => challengeDialog(r.id, r.username), 'primary small')));
    }));
    if (out.length) out2.push(h('h2', null, t('Sent requests')), ...out.map(r => h('div.friend', null, h('a.fname', { href: '#/profile/' + r.username }, h('span.avatar.sm', null, r.username[0].toUpperCase()), h('b', null, r.username)),
      btn(t('Cancel'), async () => { await rpc('friend_remove', { p_other: r.id }).catch(e => toast(niceError(e))); load(); }, 'small'))));
    list.replaceChildren(...out2);
  }
  load();
  const iv = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 15000);
  const onVis = () => { if (document.visibilityState === 'visible') load(); };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('focus', onVis);
  return () => { alive = false; clearInterval(iv); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onVis); };
}

/** Pick game settings and send a challenge to a friend. */
export function challengeDialog(to: string, toName: string) {
  let variant: VariantKey = 'standard', time = 5, inc = 3, color: 'white' | 'black' | 'random' = 'random', rated = true, infPremoves = true;
  const body = h('div');
  const close = modal(h('div.challenge', null, h('h2', null, t('Challenge {0}', toName)), body));
  function render() {
    body.replaceChildren(
      field(t('Variant'), h('select', { onchange: (e: any) => { variant = e.target.value; render(); } }, VARIANTS.map(v => h('option', { value: v.key, selected: v.key === variant }, t(v.name))))),
      h('div.field', null, h('span.lbl', null, t('Time control')), h('div.tc-grid.small', null, TIME_PRESETS.map(([tm, i]) => h('button.tc', { type: 'button', class: tm === time && i === inc ? 'on' : '', onclick: () => { time = tm; inc = i; render(); } }, h('b', null, tcLabel(tm, i)))))),
      h('div.field', null, h('span.lbl', null, t('Play as')), h('div.seg', null, (['white', 'random', 'black'] as const).map(c => h('button', { type: 'button', class: c === color ? 'on' : '', onclick: () => { color = c; render(); } }, h('span.cdot.' + c), c === 'white' ? t('White') : c === 'black' ? t('Black') : t('Random'))))),
      time ? h('label.check', null, h('input', { type: 'checkbox', checked: rated, onchange: (e: any) => { rated = e.target.checked; } }), t('Rated game')) : h('p.muted.small', null, t('Games without a clock cannot be rated.')),
      premoveBox(infPremoves, (v) => { infPremoves = v; }),
      h('div.row.end', null, btn(t('Cancel'), () => close()), btn(h('span', null, icon('play'), t('Send challenge')), () => {
        close();
        const myColor: Color = color === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : color;
        hostFriend({ variant, startFen: startFenFor(variant), time, inc, myColor, rated: rated && time > 0, pm1: !infPremoves }, { to, toName });
      }, 'primary')));
  }
  render();
}

// ---------------------------------------------------------------- watch a live game
export function watchPage(root: HTMLElement, id?: string) {
  if (!accountsEnabled()) { notReady(root); return; }
  if (!me) { go('account'); return; }
  if (!id) { go('friends'); return; }
  let alive = true;
  let row: any = null;
  let game: Game | null = null;
  let stop: (() => void) | null = null;
  const board = new Board({ viewOnly: true });
  board.movableColor = null;
  const top = h('div.pstrip.top'), bottom = h('div.pstrip.bottom');
  const info = h('div.watch-info');
  const moves = h('div.movelist');
  root.append(h('div.game-layout', null, h('div.board-col', null, top, board.el, bottom),
    h('aside.side.card', null, h('div.side-head', null, h('b', null, icon('eye'), ' ', t('Watching live'))), info, moves,
      h('div.row.wrap', null, btn(t('Flip board'), () => { board.flip(); render(); }), h('a.btn', { href: '#/friends' }, t('Back'))))));

  const strip = (c: Color) => {
    const name = c === 'white' ? row.white_name : row.black_name;
    let clock = '';
    if (row.clocks && row.time_base > 0 && row.status === 'live' && game) {
      let ms = c === 'white' ? row.clocks.w : row.clocks.b;
      if (game.pos.turn === c && game.ply >= 2) ms -= Date.now() - row.clocks.at;
      const s = Math.max(0, Math.round(ms / 1000));
      clock = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }
    const acct = c === 'white' ? row.white_id : row.black_id;
    return h('div.pinfo', { class: game && game.pos.turn === c && row.status === 'live' ? 'turn' : '' }, h('span.cdot.' + c), h('div.pname', null, h('b', null, acct ? h('a.plink', { href: '#/profile/' + encodeURIComponent(name) }, name) : name, acct ? badges(name) : '')), clock ? h('div.clock', null, clock) : null);
  };
  function render() {
    if (!row || !game) return;
    const tc: Color = board.orientation === 'white' ? 'black' : 'white';
    top.replaceChildren(strip(tc)); bottom.replaceChildren(strip(tc === 'white' ? 'black' : 'white'));
    info.replaceChildren(h('p.muted.small', null, `${variantName(row.variant)} · ${row.time_base ? tcLabel(row.time_base, row.time_inc) : '∞'}${row.rated ? ' · ' + t('Rated') : ''}`),
      row.status === 'live' ? h('p', null, h('span.live-dot'), ' ', t('Live')) : h('p.status.over', null, row.result ? `${row.result} · ${t(row.reason || '')}` : t('Game over')),
      row.status !== 'live' ? btn(h('span', null, icon('chart'), t('Analysis board')), () => {
        setAnalysisInput({ variant: row.variant, startFen: row.start_fen, ucis: game!.ucis.slice(), white: row.white_name, black: row.black_name });
        go('analysis');
      }, 'primary') : '');
    const items: HTMLElement[] = [];
    game.sans.forEach((s, i) => { const { num, white } = game!.moveNumber(i); if (white || i === 0) items.push(h('span.mnum', null, num + (white ? '.' : '…'))); items.push(h('span.mv', null, s)); });
    moves.replaceChildren(...items);
    moves.scrollTop = moves.scrollHeight;
  }
  function apply(r: any) {
    const prevPly = game ? game.ply : 0;
    row = r;
    const ucis = r.moves ? r.moves.split(' ') : [];
    const g = new Game(r.variant, r.start_fen);
    for (const u of ucis) if (!g.playUci(u)) break;
    const sameLine = game && ucis.length === prevPly + 1;
    const prevPos = game?.pos;
    game = g;
    if (sameLine && prevPos && g.ply > 0) board.showMove(prevPos, g.moves[g.ply - 1], g.pos, false);
    else board.setPosition(g.pos, g.ply ? (moveSquaresSafe(g)) : null, false);
    render();
  }
  function moveSquaresSafe(g: Game): [string, string] | null {
    const m = g.moves[g.ply - 1] as any;
    if (!m) return null;
    const f = (s: number) => 'abcdefgh'[s & 7] + ((s >> 3) + 1);
    return 'from' in m ? [f(m.from), f(m.to)] : [f(m.to), f(m.to)];
  }
  async function load() {
    try {
      const r = await rpc('get_game', { p_id: id });
      if (!alive) return;
      if (!r) { info.replaceChildren(h('p.err', null, t('This game is not available. Only friends of the players can watch.'))); return; }
      if (!row || r.updated_at !== row.updated_at) apply(r);
    } catch (e) { info.replaceChildren(h('p.err', null, niceError(e))); }
  }
  load().then(async () => {
    if (!alive || !row) return;
    if (row.white_id !== me!.id && row.black_id !== me!.id) board.setOrientation('white');
    try { stop = await watchGame(id, (r) => { if (alive) apply({ ...row, ...r }); }); } catch { /* polling below */ }
  });
  const poll = setInterval(load, 5000);
  const tick = setInterval(render, 1000);
  return () => { alive = false; clearInterval(poll); clearInterval(tick); stop?.(); board.destroy(); };
}

// ---------------------------------------------------------------- legal
export function legalPage(root: HTMLElement, which: 'privacy' | 'terms') {
  const op = OPERATOR_NAME ? `${OPERATOR_NAME}${OPERATOR_CONTACT ? ' · ' + OPERATOR_CONTACT : ''}` : t('(operator details pending)');
  const P = (s: string) => h('p', null, t(s));
  const H = (s: string) => h('h2', null, t(s));
  const body = which === 'privacy' ? [
    h('h1', null, t('Privacy policy')), h('p.muted.small', null, t('Version {0} · {1}', POLICY_VERSION, fmtDate(POLICY_DATE))),
    H('Who is responsible'), h('p', null, t('Simple Chess is run by:'), ' ', h('b', null, op)),
    H('The short version'),
    P('Simple Chess has no ads, no trackers, no analytics and no cookies. You can play everything without an account. If you create an account we store only what the account features need, and you can download or delete it at any time.'),
    H('Without an account'),
    P('Settings, puzzle progress and your recent games are stored only in your browser (local storage). They never leave your device unless you play online.'),
    P('The website is hosted on GitHub Pages (GitHub Inc., USA). GitHub processes your IP address to deliver the pages and keeps it in server logs for security (legitimate interest, GDPR Art. 6(1)(f)).'),
    P('Friend and online games connect your device directly to your opponent\'s device (WebRTC). To set up the connection, your browser contacts the PeerJS server (0.peerjs.com) and STUN/TURN servers (Google, Cloudflare, PeerJS), which see your IP address. Your opponent\'s device also sees your IP address. This happens only when you start a friend or online game (GDPR Art. 6(1)(b)).'),
    H('With an account'),
    P('We store: your username, a password hash (never the password itself), a hashed recovery code, the date you agreed to these terms, when you were last online, your ratings, your friend list, challenges, and the games you play while signed in (moves, result, players, date).'),
    P('We do not collect your e-mail address, real name, location or any other personal details.'),
    P('If you play the daily or weekly puzzle while signed in, your result for it (solved or not, and how long it took) is stored and shown on your profile.'),
    P('If you use chat, your messages are stored on the account server so you and your friend can read them. They are deleted when either of you deletes the account. With notifications turned on, the Android app checks for news about every 15 minutes using a random device key; signing out deletes the key.'),
    P('Purpose and legal basis: providing the account features you asked for (GDPR Art. 6(1)(b)), and protecting the service against abuse (Art. 6(1)(f)).'),
    P('Who can see what: everyone signed in can find your username and, unless you change it on your profile, your ratings. Your online status and games are visible only to you and your friends. Your opponents see your username in games against them.'),
    P('Account data is stored with Supabase (Supabase Inc.) on servers in the EU (Frankfurt), under a data processing agreement. Supabase may use sub-processors outside the EU under EU Standard Contractual Clauses.'),
    P('Your session is kept in your browser\'s local storage so you stay signed in. This is strictly necessary for the service and needs no consent.'),
    H('How long we keep data'),
    P('Account data is kept until you delete your account. Deleting it removes your profile, ratings, friends, challenges and games against the computer immediately; in games against other players your name is replaced by "Deleted player".'),
    H('Your rights'),
    P('You have the right to access, correct, delete and export your data, to restrict or object to processing, and to complain to a data protection authority. Use "Download my data" and "Delete account" on your profile, or contact us.'),
    H('Children'),
    P('Accounts are for people aged 16 or older, or younger with the consent of a parent or guardian.'),
    H('Changes'),
    P('If this policy changes materially, we will show it on the website.'),
  ] : [
    h('h1', null, t('Terms of use')), h('p.muted.small', null, t('Version {0} · {1}', POLICY_VERSION, fmtDate(POLICY_DATE))),
    P('Simple Chess is a free, non-commercial chess website. By creating an account you agree to these terms.'),
    H('Fair play'),
    P('Do not use engines or other help in games against people, do not manipulate ratings (for example with several accounts), and do not harass other players. Usernames must not be offensive or impersonate others.'),
    H('Your account'),
    P('Keep your password and recovery code safe. You are responsible for what happens with your account. We may remove accounts that break these rules.'),
    H('No guarantee'),
    P('Simple Chess is provided as it is, without any guarantee that it is always available or free of errors. Ratings and game records may be reset if necessary. Liability is limited to intent and gross negligence, as far as the law allows.'),
    H('Open source'),
    P('Simple Chess uses Stockfish, chessground and chessops (GPLv3) and Lichess open databases (CC0). The source code is published on GitHub.'),
    h('p', null, t('Contact:'), ' ', h('b', null, op)),
  ];
  root.append(h('article.card.legal', null, ...body, h('p', null, h('a.btn', { href: '#/' }, t('Back')))));
}

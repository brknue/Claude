/** Chat with friends and send them games. */
import { h, icon, btn, toast, modal } from '../ui';
import { t, fmtDate, lang } from '../i18n';
import { me, accountsEnabled, rpc, niceError, onAccount } from '../account';
import { variantName, VariantKey } from '../chess';
import { go } from '../main';
import { setAnalysisInput } from './analysis';
import { challengeDialog, online, lastSeenText } from './social';
import { newDailyDialog } from './daily';
import { onMessage, pollAlerts, setFocus, notifyBanner, missingSocial, socialAvailable } from '../notify';

const time = (iso: string) => new Date(iso).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();
const shortWhen = (iso: string) => sameDay(iso, new Date().toISOString()) ? time(iso) : fmtDate(iso);

export function needAccount(root: HTMLElement, title: string, text: string): boolean {
  if (accountsEnabled() && me) return false;
  root.append(h('section.card.setup.center', null, h('h1', null, title), h('p.muted', null, text),
    accountsEnabled() ? h('div.row.center', null, h('a.btn.primary', { href: '#/account' }, t('Sign in')), h('a.btn', { href: '#/account/new' }, t('Create account'))) : null));
  return true;
}
export function socialMissing(root: HTMLElement) {
  root.replaceChildren(h('section.card.setup.center', null, h('h1', null, t('Coming soon')), h('p.muted', null, t('This feature is not switched on for this site yet.')), h('a.btn', { href: '#/' }, t('Back'))));
}

// ---------------------------------------------------------------- conversation list
export function chatListPage(root: HTMLElement, username?: string) {
  if (username) return chatPage(root, username);
  if (needAccount(root, t('Messages'), t('Sign in to chat with your friends.'))) return;
  let alive = true;
  const list = h('div.chat-list', null, h('div.spinner-row', null, h('span.spinner'), t('Loading…')));
  root.append(h('div.chat-page', null, notifyBanner(), h('section.card', null, h('h1', null, t('Messages')), list)));
  async function load() {
    let rows: any[];
    try { rows = await rpc<any[]>('chat_list'); } catch (e) { missingSocial(e); if (!socialAvailable()) socialMissing(root); else list.replaceChildren(h('p.err', null, niceError(e))); return; }
    if (!alive) return;
    if (!rows.length) { list.replaceChildren(h('p.muted', null, t('No friends yet. Add friends to chat with them.')), h('a.btn', { href: '#/friends' }, icon('users'), t('Friends'))); return; }
    list.replaceChildren(...rows.map(r => h('a.chat-row', { href: '#/chat/' + encodeURIComponent(r.username), class: r.unread ? 'unread' : '' },
      h('span.avatar.sm', { class: online(r.last_seen) ? 'on' : '' }, r.username[0].toUpperCase()),
      h('span.cr-main', null, h('b', null, r.username),
        h('span.muted.small.cr-last', null, r.last_at ? (r.last_mine ? t('You:') + ' ' : '') + (r.last_game && !r.last_body ? '♟ ' + t('Game') : r.last_body) : t('Say hello!'))),
      h('span.cr-side', null, r.last_at ? h('span.muted.small', null, shortWhen(r.last_at)) : null, r.unread ? h('span.count-badge', null, String(r.unread)) : null))));
  }
  load();
  const offMsg = onMessage(() => load());
  const iv = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 20000);
  return () => { alive = false; offMsg(); clearInterval(iv); };
}

// ---------------------------------------------------------------- one conversation
export function chatPage(root: HTMLElement, username: string) {
  if (needAccount(root, t('Messages'), t('Sign in to chat with your friends.'))) return;
  let alive = true;
  let friend: any = null;
  const msgs = new Map<number, any>();
  let oldest: number | null = null, hasMore = false;
  const head = h('div.chat-head');
  const scroller = h('div.chat-msgs');
  const input = h('textarea.chat-input', { rows: 1, maxLength: 1000, placeholder: t('Write a message…'), 'aria-label': t('Write a message…') }) as HTMLTextAreaElement;
  const sendBtn = btn(icon('send'), () => send(), 'icon primary', t('Send'));
  const gameBtn = btn(h('span', null, '♟'), () => pickGame(), 'icon', t('Send a game'));
  const composer = h('form.chat-compose', { onsubmit: (e: Event) => { e.preventDefault(); send(); } }, gameBtn, input, sendBtn);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !(e as any).isComposing) { e.preventDefault(); send(); } });
  input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; });
  const card = h('section.card.chat-card', null, head, scroller, composer);
  root.append(h('div.chat-page.conv', null, card));
  setFocus('chat:' + username.toLowerCase());
  // the conversation fills the screen between the header and the bottom tab bar, so the message box is always visible
  const fit = () => {
    const tb = document.querySelector('.tabbar') as HTMLElement | null;
    const tbh = tb && getComputedStyle(tb).display !== 'none' ? tb.getBoundingClientRect().height : 0;
    const top = card.getBoundingClientRect().top + window.scrollY;
    card.style.height = Math.max(340, Math.round(window.innerHeight - top - tbh - 12)) + 'px';
  };
  requestAnimationFrame(fit);
  window.addEventListener('resize', fit);
  window.visualViewport?.addEventListener('resize', fit);

  function renderHead() {
    head.replaceChildren(
      h('a.btn.icon.ghost', { href: '#/chat', title: t('Back'), 'aria-label': t('Back') }, icon('back')),
      h('a.chat-who', { href: '#/profile/' + encodeURIComponent(friend.username) }, h('span.avatar.sm', { class: online(friend.last_seen) ? 'on' : '' }, friend.username[0].toUpperCase()),
        h('span', null, h('b', null, friend.username), h('span.muted.small.block', null, lastSeenText(friend.last_seen)))),
      h('div.row.chat-acts', null,
        btn(h('span', null, icon('play'), h('span.hide-xs', null, t('Challenge'))), () => challengeDialog(friend.id, friend.username), 'small'),
        btn(h('span', null, icon('calendar'), h('span.hide-xs', null, t('Daily game'))), () => newDailyDialog(friend.id, friend.username), 'small')));
  }

  function bubble(m: any, prev: any | undefined): HTMLElement[] {
    const out: HTMLElement[] = [];
    if (!prev || !sameDay(prev.created_at, m.created_at)) out.push(h('div.chat-day', null, fmtDate(m.created_at)));
    const body: (HTMLElement | string)[] = [];
    if (m.game) body.push(gameCard(m.game));
    if (m.body) body.push(h('div.chat-text', null, m.body));
    out.push(h('div.chat-msg', { class: m.mine ? 'mine' : 'theirs' }, h('div.chat-bubble', null, ...body, h('span.chat-time', null, time(m.created_at)))));
    return out;
  }
  function render(stick = true) {
    const atBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 80;
    const prevH = scroller.scrollHeight, prevTop = scroller.scrollTop;
    const list = [...msgs.values()].sort((a, b) => a.id - b.id);
    const items: HTMLElement[] = [];
    if (hasMore) items.push(h('div.center', null, btn(t('Load older messages'), () => loadOlder(), 'small ghost')));
    if (!list.length) items.push(h('p.muted.center.chat-empty', null, t('No messages yet. Say hello or send a game you played together!')));
    list.forEach((m, i) => items.push(...bubble(m, list[i - 1])));
    const lastMine = [...list].reverse().find(m => m.mine);
    if (lastMine?.read_at && list[list.length - 1] === lastMine) items.push(h('div.chat-seen.muted.small', null, t('Seen')));
    scroller.replaceChildren(...items);
    if (stick && (atBottom || !prevH)) scroller.scrollTop = scroller.scrollHeight;
    else if (!stick) scroller.scrollTop = prevTop + (scroller.scrollHeight - prevH);
  }

  async function loadLatest() {
    try {
      const rows = await rpc<any[]>('chat_history', { p_other: friend.id, p_before: null, p_limit: 50 });
      if (!alive) return;
      if (oldest === null) { hasMore = rows.length === 50; oldest = rows.length ? rows[rows.length - 1].id : null; }
      let changed = false;
      for (const r of rows) { const o = msgs.get(r.id); if (!o || o.read_at !== r.read_at) { msgs.set(r.id, r); changed = true; } }
      if (changed || !scroller.childElementCount) render();
      if (rows.some(r => !r.mine && !r.read_at) && document.visibilityState === 'visible') { await rpc('chat_read', { p_other: friend.id }).catch(() => {}); pollAlerts(); }
    } catch (e) { if (alive) scroller.replaceChildren(h('p.err', null, niceError(e))); }
  }
  async function loadOlder() {
    if (oldest === null) return;
    const rows = await rpc<any[]>('chat_history', { p_other: friend.id, p_before: oldest, p_limit: 50 }).catch(() => [] as any[]);
    hasMore = rows.length === 50;
    if (rows.length) oldest = rows[rows.length - 1].id;
    rows.forEach(r => msgs.set(r.id, r));
    render(false);
  }
  async function send(game?: any) {
    const text = input.value.trim();
    if (!text && !game) return;
    sendBtn.disabled = true;
    try {
      const id = await rpc<number>('send_message', { p_to: friend.id, p_body: game ? '' : text, p_game: game || null });
      msgs.set(id, { id, mine: true, body: game ? '' : text, game: game || null, created_at: new Date().toISOString(), read_at: null });
      if (!game) { input.value = ''; input.style.height = 'auto'; }
      render(); scroller.scrollTop = scroller.scrollHeight;
    } catch (e) { toast(niceError(e)); }
    sendBtn.disabled = false;
    if (!game) input.focus();
  }
  function pickGame() {
    sendGameDialog(friend, (g) => send(g));
  }

  (async () => {
    try {
      const rows = await rpc<any[]>('chat_list');
      friend = rows.find(r => r.username.toLowerCase() === username.toLowerCase());
    } catch (e) { missingSocial(e); if (!socialAvailable()) { socialMissing(root); return; } }
    if (!alive) return;
    if (!friend) { card.replaceChildren(h('h1', null, username), h('p.muted', null, t('You can only chat with friends.')), h('a.btn', { href: '#/profile/' + encodeURIComponent(username) }, t('View profile'))); return; }
    renderHead();
    await loadLatest();
    if (window.matchMedia('(pointer: fine)').matches) input.focus();
  })();
  const offMsg = onMessage((row) => { if (friend && row.from_id === friend.id) loadLatest(); });
  const iv = setInterval(() => { if (friend && document.visibilityState === 'visible') loadLatest(); }, 12000);
  const onVis = () => { if (friend && document.visibilityState === 'visible') loadLatest(); };
  document.addEventListener('visibilitychange', onVis);
  const offAcc = onAccount(() => { if (!me) go('account'); });
  return () => { alive = false; offMsg(); offAcc(); clearInterval(iv); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('resize', fit); window.visualViewport?.removeEventListener('resize', fit); setFocus(''); };
}

// ---------------------------------------------------------------- games in chat
const resultLabel = (r?: string) => r === '1-0' ? '1–0' : r === '0-1' ? '0–1' : r === '1/2-1/2' ? '½–½' : '*';

export function gameCard(g: any): HTMLElement {
  const n = g.moves ? String(g.moves).split(' ').length : 0;
  return h('div.chat-game', null,
    h('div.cg-top', null, h('span.cg-ic', { 'aria-hidden': 'true' }, '♟'),
      h('div', null, h('b', null, `${g.white || '?'} – ${g.black || '?'}`),
        h('span.muted.small.block', null, `${variantName((g.variant || 'standard') as VariantKey)} · ${resultLabel(g.result)} · ${t('{0} moves', Math.ceil(n / 2))}${g.date && !isNaN(Date.parse(g.date)) ? ' · ' + fmtDate(g.date) : ''}`))),
    btn(h('span', null, icon('chart'), t('Open in analysis')), () => {
      setAnalysisInput({ variant: (g.variant || 'standard') as VariantKey, startFen: g.start_fen, ucis: n ? String(g.moves).split(' ') : [], white: g.white, black: g.black });
      go('analysis');
    }, 'small'));
}

/** Snapshot of a game row for sending. */
export const gameSnapshot = (g: any) => ({ id: g.id, variant: g.variant, start_fen: g.start_fen, moves: g.moves || '', white: g.white_name, black: g.black_name, result: g.result || '', date: new Date(g.created_at).toISOString() });

/** Pick one of your games (games together with this friend first). */
export function sendGameDialog(friend: { id: string; username: string }, onPick: (g: any) => void) {
  const list = h('div.pick-games', null, h('div.spinner-row', null, h('span.spinner'), t('Loading…')));
  const close = modal(h('div', null, h('h2', null, t('Send a game')), h('p.muted.small', null, t('Your friend can replay it and open it in the analysis board.')), list,
    h('div.row.end', null, btn(t('Cancel'), () => close()))));
  rpc<any[]>('game_list', { p_username: me!.username, p_before: null, p_limit: 50 }).then(rows => {
    rows = rows.filter(g => g.moves && g.status !== 'live');
    const together = rows.filter(g => g.white_id === friend.id || g.black_id === friend.id);
    const other = rows.filter(g => !together.includes(g));
    const row = (g: any) => {
      const white = g.white_id === me!.id;
      return h('button.pick-row', { type: 'button', onclick: () => { close(); onPick(gameSnapshot(g)); } },
        h('b', null, `${g.white_name} – ${g.black_name}`),
        h('span.muted.small', null, `${variantName(g.variant)} · ${resultLabel(g.result)} · ${t('{0} moves', Math.ceil(g.moves.split(' ').length / 2))} · ${fmtDate(g.created_at)}`),
        h('span.cdot.' + (white ? 'white' : 'black')));
    };
    const out: HTMLElement[] = [];
    if (together.length) out.push(h('h3.set-h', null, t('Games with {0}', friend.username)), ...together.map(row));
    if (other.length) out.push(h('h3.set-h', null, together.length ? t('Your other games') : t('Your games')), ...other.map(row));
    if (!out.length) out.push(h('p.muted', null, t('No games yet.')));
    list.replaceChildren(...out);
  }).catch(e => list.replaceChildren(h('p.err', null, niceError(e))));
}

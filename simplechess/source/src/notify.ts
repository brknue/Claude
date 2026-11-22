/**
 * Notifications for messages, challenges and daily games.
 *  - Badges (unread messages, daily games where it is your turn) in the header and tab bar.
 *  - Live updates through Supabase Realtime plus a poll every 30 s.
 *  - While the page is visible: an in-page toast. While it is hidden: a system notification
 *    (website: the browser's notifications; Android app: native notifications).
 *  - Android app: a per-device key lets the app check every ~15 minutes while it is closed.
 * Everything is skipped silently when the social database add-on (supabase/add-social.sql) is missing.
 */
import type { RealtimeChannel } from '@supabase/supabase-js';
import { me, onAccount, rpc, sb } from './account';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import { appBridge, settings, saveSettings, h, loadRaw, save } from './ui';
import { t } from './i18n';
import { variantName } from './chess';

export interface AlertItem { key: string; type: 'message' | 'challenge' | 'daily_invite' | 'daily_move' | 'daily_draw' | 'daily_end'; from: string; text?: string; game?: any; at: string; result?: string; won?: boolean | null; n?: number; variant?: string; base?: number; inc?: number }
export interface Counts { unread: number; my_turn: number; invites: number }

export let counts: Counts = { unread: 0, my_turn: 0, invites: 0 };
let available = true;
export const socialAvailable = () => available;
const countListeners = new Set<(c: Counts) => void>();
export function onCounts(f: (c: Counts) => void) { countListeners.add(f); f(counts); return () => countListeners.delete(f); }
const dailyListeners = new Set<(row: any) => void>();
/** Live updates of my daily game rows (from Realtime). */
export function onDailyRow(f: (row: any) => void) { dailyListeners.add(f); return () => dailyListeners.delete(f); }
const msgListeners = new Set<(row: any) => void>();
/** New chat messages addressed to me (from Realtime). */
export function onMessage(f: (row: any) => void) { msgListeners.add(f); return () => msgListeners.delete(f); }

/** Pages tell us what is on screen so we do not notify about it (e.g. 'chat:alice', 'daily:<id>'). */
let focusKey = '';
export function setFocus(k: string) { focusKey = k; }

const SINCE = 'alertSince', SEEN = 'alertSeen', KEY = 'notifyKey';
let seen: string[] = loadRaw(SEEN, [] as string[]);
const markSeen = (k: string) => { if (seen.includes(k)) return; seen.push(k); if (seen.length > 300) seen = seen.slice(-300); save(SEEN, seen); appBridge?.seen?.(k); };

export function missingSocial(e: any) {
  if (/could not find|does not exist|schema cache|404|PGRST202/i.test(String(e?.message || e?.code || ''))) available = false;
}

// ---------------------------------------------------------------- texts (shared with the Android app's background check)
export function alertText(a: AlertItem): { title: string; body: string; url: string } {
  switch (a.type) {
    case 'message': return { title: a.from, body: a.text || t('sent you a game'), url: '#/chat/' + encodeURIComponent(a.from) };
    case 'challenge': return { title: t('{0} challenged you', a.from), body: `${variantName((a.variant || 'standard') as any)} · ${a.base ? `${a.base} + ${a.inc}` : '∞'}`, url: '#/friends' };
    case 'daily_invite': return { title: t('{0} invited you to a daily game', a.from), body: t('Tap to accept or decline.'), url: '#/daily' };
    case 'daily_draw': return { title: t('{0} offers a draw', a.from), body: t('Daily game'), url: '#/daily/' + a.game };
    case 'daily_end': return { title: t('Your daily game against {0} ended', a.from), body: a.won === true ? t('You won') : a.won === false ? t('You lost') : a.result === '1/2-1/2' ? t('Draw') : t('Game over'), url: '#/daily/' + a.game };
    default: return { title: a.n ? t('{0} moved in your daily game', a.from) : t('{0} accepted your daily game', a.from), body: t('Your move'), url: '#/daily/' + a.game };
  }
}
function nativeStrings() {
  return JSON.stringify({
    sentGame: t('sent you a game'), challenged: t('{0} challenged you'), invited: t('{0} invited you to a daily game'), tapAccept: t('Tap to accept or decline.'),
    draw: t('{0} offers a draw'), daily: t('Daily game'), ended: t('Your daily game against {0} ended'), won: t('You won'), lost: t('You lost'), drawn: t('Draw'),
    over: t('Game over'), moved: t('{0} moved in your daily game'), accepted: t('{0} accepted your daily game'), yourMove: t('Your move'), channel: t('Messages and games'),
  });
}

// ---------------------------------------------------------------- showing
type Popup = (a: AlertItem, text: { title: string; body: string; url: string }) => void;
let popup: Popup = () => {};
/** main.ts supplies the in-page toast. */
export function setPopup(f: Popup) { popup = f; }

export const webNotifySupported = () => 'Notification' in window && 'serviceWorker' in navigator;
export const notifyOn = () => !!settings.notify && (appBridge ? true : webNotifySupported() && Notification.permission === 'granted');

async function systemNotify(key: string, title: string, body: string, url: string) {
  if (appBridge?.notify) { appBridge.notify(key, title, body, url); return; }
  if (!notifyOn()) return;
  const full = location.href.split('#')[0] + url;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) { await reg.showNotification(title, { body, tag: key, data: { url: full }, icon: 'icon.svg', badge: 'icon.svg' } as NotificationOptions); return; }
  } catch { /* fall back */ }
  try { const n = new Notification(title, { body, tag: key, icon: 'icon.svg' }); n.onclick = () => { window.focus(); location.hash = url.slice(1); n.close(); }; } catch { /* unsupported */ }
}

function handle(a: AlertItem) {
  if (seen.includes(a.key)) return;
  markSeen(a.key);
  const tx = alertText(a);
  const about = a.type === 'message' ? 'chat:' + a.from.toLowerCase() : a.game ? 'daily:' + a.game : '';
  const visible = document.visibilityState === 'visible';
  if (visible && about && about === focusKey) return; // already looking at it
  if (visible && a.type === 'challenge') return; // the challenge bar is already on screen
  if (visible) popup(a, tx);
  else systemNotify(a.key, tx.title, tx.body, tx.url);
}

// ---------------------------------------------------------------- polling + realtime
let timer: any = 0, channel: RealtimeChannel | null = null, polling = false, startedFor = '';
export async function pollAlerts() {
  if (!me || !available || polling) return;
  polling = true;
  try {
    const since = loadRaw(SINCE, '') || new Date(Date.now() - 60000).toISOString();
    const r = await rpc<any>('my_alerts', { p_since: since });
    if (r) {
      counts = { unread: r.unread || 0, my_turn: r.my_turn || 0, invites: r.invites || 0 };
      countListeners.forEach(f => f(counts));
      const items: AlertItem[] = r.items || [];
      items.forEach(handle);
      const last = items.reduce((m, a) => (a.at > m ? a.at : m), since);
      save(SINCE, last);
    }
  } catch (e) { missingSocial(e); }
  polling = false;
}

async function start() {
  if (!me || startedFor === me.id) return;
  stop();
  startedFor = me.id;
  if (!loadRaw(SINCE, '')) save(SINCE, new Date().toISOString());
  pollAlerts();
  timer = setInterval(pollAlerts, 30000);
  document.addEventListener('visibilitychange', onVis);
  try {
    const c = await sb();
    const uid = me.id;
    const daily = (p: any) => { const row = p.new; if (row?.kind === 'daily') { dailyListeners.forEach(f => f(row)); pollAlerts(); } };
    channel = c.channel('rs-social-' + uid)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `to_id=eq.${uid}` }, (p: any) => { msgListeners.forEach(f => f(p.new)); pollAlerts(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `white_id=eq.${uid}` }, daily)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `black_id=eq.${uid}` }, daily)
      .subscribe();
  } catch { /* polling still works */ }
  syncAppBackground();
}
function onVis() { if (document.visibilityState === 'visible') pollAlerts(); }
function stop() {
  clearInterval(timer); timer = 0; startedFor = '';
  document.removeEventListener('visibilitychange', onVis);
  if (channel) { const ch = channel; sb().then(c => c.removeChannel(ch)).catch(() => {}); channel = null; }
  counts = { unread: 0, my_turn: 0, invites: 0 }; countListeners.forEach(f => f(counts));
}

// ---------------------------------------------------------------- Android app background checks
async function syncAppBackground() {
  if (!appBridge?.setBackground) return;
  const key = loadRaw(KEY, '');
  if (!me || !settings.notify || !available) {
    appBridge.setBackground('', '', '', '');
    if (key) { rpc('notify_key_drop', { p_key: key }).catch(() => {}); save(KEY, ''); }
    return;
  }
  try {
    const k = key || await rpc<string>('notify_key_new');
    save(KEY, k);
    appBridge.setBackground(SUPABASE_URL, SUPABASE_ANON_KEY, k, nativeStrings());
  } catch (e) { missingSocial(e); }
}

/** Settings switch. Asks for permission when turned on. Returns the new state. */
export async function setNotify(on: boolean): Promise<boolean> {
  if (on) {
    if (appBridge) appBridge.requestPermission?.();
    else if (webNotifySupported() && Notification.permission !== 'granted') {
      const p = await Notification.requestPermission().catch(() => 'denied' as NotificationPermission);
      if (p !== 'granted') on = false;
    } else if (!webNotifySupported()) on = false;
  }
  settings.notify = on; saveSettings();
  syncAppBackground();
  return on;
}

/** A small "turn on notifications" banner for the chat and daily pages (browser only, until decided). */
export function notifyBanner(): HTMLElement | null {
  if (appBridge || !webNotifySupported() || notifyOn() || loadRaw('notifyAsked', false)) return null;
  const el = h('div.notify-banner', null, h('span', null, t('Get a notification when a friend messages you, challenges you or moves in a daily game.')),
    h('div.row', null,
      h('button.btn.small.primary', { type: 'button', onclick: async () => { save('notifyAsked', true); await setNotify(true); el.remove(); } }, t('Turn on')),
      h('button.btn.small.ghost', { type: 'button', onclick: () => { save('notifyAsked', true); el.remove(); } }, t('Not now'))));
  return el;
}

export function initNotify() {
  // the app asks once for notification permission and turns them on by default
  if (appBridge && settings.notify === undefined) { settings.notify = true; saveSettings(); }
  // a click on a browser notification (handled in the service worker) asks the page to open a route
  navigator.serviceWorker?.addEventListener('message', (e: MessageEvent) => { if (e.data?.type === 'rs-go' && typeof e.data.url === 'string') { const i = e.data.url.indexOf('#'); if (i >= 0) location.hash = e.data.url.slice(i + 1); } });
  const sync = () => { if (me) start(); else { stop(); syncAppBackground(); } };
  onAccount(sync);
  sync();
}

/**
 * Accounts (Supabase). Username + password, no e-mail: each account gets a random sign-in address
 * that never receives mail. The Supabase library is loaded only when accounts are used.
 */
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, POLICY_VERSION } from './config';
import { loadRaw, save } from './ui';
import { t } from './i18n';
import type { VariantKey } from './chess';

export interface Stat { r: number; g: number; w: number; l: number; d: number; p: number }
export interface Me { id: string; username: string; created_at: string; ratings: Record<string, Stat> }

export const accountsEnabled = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);
const STORAGE_KEY = 'rs.auth';
export const BASE_RATING = 1500;

let clientP: Promise<SupabaseClient> | null = null;
export function sb(): Promise<SupabaseClient> {
  if (!accountsEnabled()) return Promise.reject(new Error(t('Accounts are not set up on this site yet.')));
  if (!clientP) {
    clientP = import('@supabase/supabase-js').then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: STORAGE_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    }));
    clientP.catch(() => { clientP = null; });
  }
  return clientP;
}

/** Signed-in player (cached so the header can show it offline too). */
export let me: Me | null = loadRaw('me', null as Me | null);
const listeners = new Set<() => void>();
export function onAccount(f: () => void) { listeners.add(f); return () => listeners.delete(f); }
function setMe(m: Me | null) { me = m; save('me', m); listeners.forEach(f => f()); }

const ERRORS: [RegExp, string][] = [
  [/invalid login credentials/i, 'Wrong username or password.'],
  [/duplicate key|already registered|already exists|unique/i, 'That username is taken.'],
  [/bad username/i, 'Usernames are 3 to 20 letters, digits or _.'],
  [/password.*(short|at least|8)/i, 'Passwords need at least 8 characters.'],
  [/too many attempts/i, 'Too many wrong codes. Try again in 15 minutes.'],
  [/rate limit|too many requests|slow down/i, 'Too many attempts. Wait a minute and try again.'],
  [/player not found/i, 'No player with that username.'],
  [/that is you/i, 'That is you!'],
  [/only challenge friends/i, 'You can only challenge friends.'],
  [/too many open/i, 'You have too many open requests.'],
  [/not signed in|jwt|session/i, 'Please sign in again.'],
  [/failed to fetch|network|load failed/i, 'No connection to the account server. Check your internet connection.'],
];
export function niceError(e: any): string {
  const m = String(e?.message || e || '');
  for (const [re, text] of ERRORS) if (re.test(m)) return t(text);
  return t('Something went wrong. Please try again.');
}

export async function rpc<T = any>(fn: string, args: Record<string, any> = {}): Promise<T> {
  const c = await sb();
  const { data, error } = await c.rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export const validUsername = (u: string) => /^[A-Za-z0-9_]{3,20}$/.test(u);

function randomCode(groups = 5): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  const bytes = crypto.getRandomValues(new Uint8Array(groups * 4));
  const chars = [...bytes].map(b => alphabet[b % alphabet.length]);
  const out: string[] = [];
  for (let i = 0; i < groups; i++) out.push(chars.slice(i * 4, i * 4 + 4).join(''));
  return out.join('-');
}
const normCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{4})(?=.)/g, '$1-');

/** Create an account. Returns the recovery code (shown once). */
export async function signUp(username: string, password: string): Promise<string> {
  const c = await sb();
  if (!(await rpc<boolean>('username_available', { p_username: username }))) throw new Error('already exists');
  const local = [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join('');
  const { data, error } = await c.auth.signUp({ email: `u${local}@rookstorm.invalid`, password });
  if (error) throw error;
  if (!data.session) throw new Error('Sign-up needs "Confirm email" turned off in Supabase.');
  const recovery = randomCode();
  try { await rpc('create_profile', { p_username: username, p_recovery: recovery, p_policy: POLICY_VERSION }); }
  catch (e) { await rpc('delete_account').catch(() => {}); await c.auth.signOut().catch(() => {}); throw e; }
  await refreshMe();
  return recovery;
}

export async function signIn(username: string, password: string) {
  const c = await sb();
  const email = await rpc<string | null>('login_email', { p_username: username.trim() });
  if (!email) throw new Error('Invalid login credentials');
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  await refreshMe();
}

export async function signOut() {
  const c = await sb();
  await c.auth.signOut().catch(() => {});
  setMe(null);
  stopLive();
}

export async function resetPassword(username: string, code: string, password: string): Promise<boolean> {
  return rpc<boolean>('reset_password', { p_username: username.trim(), p_recovery: normCode(code), p_new: password });
}

export async function newRecoveryCode(): Promise<string> {
  const code = randomCode();
  await rpc('set_recovery', { p_recovery: code });
  return code;
}

export async function changePassword(password: string) {
  const c = await sb();
  const { error } = await c.auth.updateUser({ password });
  if (error) throw error;
}

export async function deleteAccount() {
  await rpc('delete_account');
  const c = await sb();
  await c.auth.signOut().catch(() => {});
  setMe(null);
  stopLive();
}

export async function refreshMe(): Promise<Me | null> {
  try {
    const p = await rpc<Me | null>('my_profile');
    setMe(p);
    if (p) startLive();
    return p;
  } catch (e: any) {
    if (/jwt|not signed in|session/i.test(String(e?.message))) setMe(null);
    return me;
  }
}

/** Rating category for a game (same rules as the server's rating_mode). */
export function ratingMode(variant: VariantKey, minutes: number, inc: number): string | null {
  if (variant !== 'standard') return variant;
  if (minutes <= 0) return null;
  const est = minutes * 60 + 40 * inc;
  return est < 180 ? 'bullet' : est < 480 ? 'blitz' : est < 1500 ? 'rapid' : 'classical';
}
export const MODES: [string, string][] = [
  ['bullet', 'Bullet'], ['blitz', 'Blitz'], ['rapid', 'Rapid'], ['classical', 'Classical'], ['puzzle', 'Puzzles'],
  ['chess960', 'Chess960'], ['crazyhouse', 'Crazyhouse'], ['kingofthehill', 'King of the Hill'], ['3check', 'Three-check'],
  ['atomic', 'Atomic'], ['antichess', 'Antichess'], ['horde', 'Horde'], ['racingkings', 'Racing Kings'],
];
export const ratingIn = (ratings: Record<string, Stat> | null | undefined, mode: string) => ratings?.[mode]?.r ?? BASE_RATING;

// ---------------------------------------------------------------- presence + challenges
export interface Challenge { id: string; from_name: string; to_name: string; incoming: boolean; variant: VariantKey; time_base: number; time_inc: number; color: string; rated: boolean; status: string; created_at: string }
const challengeListeners = new Set<(c: Challenge[]) => void>();
export function onChallenges(f: (c: Challenge[]) => void) { challengeListeners.add(f); return () => challengeListeners.delete(f); }
export let challenges: Challenge[] = [];

let liveTimer: any = 0;
let channel: RealtimeChannel | null = null;
async function pollChallenges() {
  if (!me) return;
  try { challenges = await rpc<Challenge[]>('my_challenges'); challengeListeners.forEach(f => f(challenges)); } catch { /* offline */ }
}
function heartbeat() {
  if (!me || document.visibilityState !== 'visible') return;
  rpc('touch').catch(() => {});
  pollChallenges();
}
async function startLive() {
  if (liveTimer || !me) return;
  heartbeat();
  liveTimer = setInterval(heartbeat, 30000);
  document.addEventListener('visibilitychange', heartbeat);
  try {
    const c = await sb();
    channel = c.channel('rs-challenges-' + me.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges', filter: `to_id=eq.${me.id}` }, () => pollChallenges())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'challenges', filter: `from_id=eq.${me.id}` }, () => pollChallenges())
      .subscribe();
  } catch { /* polling still works */ }
}
function stopLive() {
  clearInterval(liveTimer); liveTimer = 0;
  document.removeEventListener('visibilitychange', heartbeat);
  if (channel) { sb().then(c => c.removeChannel(channel!)).catch(() => {}); channel = null; }
  challenges = []; challengeListeners.forEach(f => f([]));
}

/** On page load: restore the session if there is one (without loading Supabase for visitors who never signed in). */
export async function initAccount() {
  if (!accountsEnabled()) { if (me) setMe(null); return; }
  let hasSession = false;
  try { hasSession = !!localStorage.getItem(STORAGE_KEY); } catch { /* */ }
  if (!hasSession) { if (me) setMe(null); return; }
  const c = await sb();
  c.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') { setMe(null); stopLive(); } });
  const { data } = await c.auth.getSession();
  if (!data.session) { setMe(null); return; }
  await refreshMe();
}

/** Subscribe to live updates of one game row (spectating). */
export async function watchGame(id: string, onRow: (row: any) => void): Promise<() => void> {
  const c = await sb();
  const ch = c.channel('rs-game-' + id + '-' + Math.random().toString(36).slice(2, 7))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${id}` }, (p: any) => onRow(p.new))
    .subscribe();
  return () => { c.removeChannel(ch); };
}

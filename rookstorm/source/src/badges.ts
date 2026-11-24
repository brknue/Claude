/** Role badges next to player names (developer, admin, moderator, tester …). Looked up in batches and cached. */
import { h } from './ui';
import { t } from './i18n';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export const ROLES: { key: string; icon: string; label: string; cls: string; perm?: boolean }[] = [
  { key: 'developer', icon: '</>', label: 'Developer', cls: 'dev' },
  { key: 'owner', icon: '👑', label: 'Owner', cls: 'owner', perm: true },
  { key: 'admin', icon: '🛡', label: 'Admin', cls: 'admin', perm: true },
  { key: 'moderator', icon: '⚔', label: 'Moderator', cls: 'mod' },
  { key: 'tester', icon: '🧪', label: 'Tester', cls: 'tester' },
  { key: 'helper', icon: '🤝', label: 'Helper', cls: 'helper' },
  { key: 'coach', icon: '🎓', label: 'Coach', cls: 'coach' },
  { key: 'translator', icon: '🌐', label: 'Translator', cls: 'translator' },
  { key: 'contributor', icon: '⭐', label: 'Contributor', cls: 'contrib' },
  { key: 'champion', icon: '🏆', label: 'Champion', cls: 'champ' },
  { key: 'streamer', icon: '🎥', label: 'Streamer', cls: 'streamer' },
  { key: 'vip', icon: '💎', label: 'VIP', cls: 'vip' },
  { key: 'supporter', icon: '❤', label: 'Supporter', cls: 'supporter' },
  { key: 'verified', icon: '✔', label: 'Verified', cls: 'verified' },
];
// labels for the translation extractor
void [t('Developer'), t('Owner'), t('Admin'), t('Moderator'), t('Tester'), t('Helper'), t('Coach'), t('Translator'), t('Contributor'), t('Champion'), t('Streamer'), t('VIP'), t('Supporter'), t('Verified')];

export const TITLES: [string, string][] = [['GM', 'Grandmaster'], ['IM', 'International Master'], ['FM', 'FIDE Master'], ['CM', 'Candidate Master'], ['NM', 'National Master'],
  ['WGM', 'Woman Grandmaster'], ['WIM', 'Woman International Master'], ['WFM', 'Woman FIDE Master'], ['WCM', 'Woman Candidate Master'], ['WNM', 'Woman National Master'],
  ['LM', 'Lichess Master'], ['IA', 'International Arbiter'], ['FA', 'FIDE Arbiter'], ['FT', 'FIDE Trainer'], ['FST', 'FIDE Senior Trainer'], ['BOT', 'Computer account']];
void [t('Grandmaster'), t('International Master'), t('FIDE Master'), t('Candidate Master'), t('National Master'), t('Woman Grandmaster'), t('Woman International Master'), t('Woman FIDE Master'),
  t('Woman Candidate Master'), t('Woman National Master'), t('Lichess Master'), t('International Arbiter'), t('FIDE Arbiter'), t('FIDE Trainer'), t('FIDE Senior Trainer'), t('Computer account')];
/** chess.com-style title tag (GM, IM …) */
export function titleEl(title?: string | null): HTMLElement | null {
  if (!title) return null;
  const name = TITLES.find(x => x[0] === title)?.[1] || title;
  return h('span.title-badge', { class: title === 'BOT' ? 'bot' : '', title: t(name), 'aria-label': t(name) }, title);
}
interface Info { r: string[]; t?: string | null }
const cache = new Map<string, Info>();
const waiting = new Map<string, Set<HTMLElement>>();
const spelled = new Map<string, string>(); // lower case -> name as written (the server lookup is case-sensitive)
let timer: any = 0;

/** Badge elements for a list of roles (the owner badge is hidden: it is a permission, the developer badge shows). */
export function badgeEls(roles: string[]): HTMLElement[] {
  return ROLES.filter(r => roles.includes(r.key) && r.key !== 'owner').map(r =>
    h('span.role-badge', { class: r.cls, title: t(r.label), 'aria-label': t(r.label) }, r.icon));
}

function fill(el: HTMLElement, info: Info) { el.replaceChildren(...[titleEl(info.t), ...badgeEls(info.r || [])].filter(Boolean) as HTMLElement[]); }
let useNames = true;

async function flush() {
  timer = 0;
  const names = [...waiting.keys()].filter(n => !cache.has(n));
  if (names.length && SUPABASE_URL) {
    try {
      const body = JSON.stringify({ p_names: names.map(n => spelled.get(n) || n) });
      const post = (fn: string) => fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body });
      let r = useNames ? await post('names_info') : null;
      if (r && r.status === 404) { useNames = false; r = null; }
      let map: Record<string, any> = {};
      if (r) map = r.ok ? await r.json() : {};
      else { const r2 = await post('roles_of'); const m = r2.ok ? await r2.json() : {}; for (const k in m) map[k] = { r: m[k] }; }
      for (const n of names) cache.set(n, (map && map[n]) || { r: [] });
    } catch { for (const n of names) cache.set(n, { r: [] }); }
  }
  for (const [n, els] of waiting) { const info = cache.get(n) || { r: [] }; els.forEach(el => fill(el, info)); }
  waiting.clear();
}

/** A span that fills itself with the player's badges. */
export function badges(name: string | null | undefined): HTMLElement {
  const el = h('span.role-badges');
  if (!name || /\s|·/.test(name)) return el; // bots, "Deleted player" …
  const key = name.toLowerCase();
  const known = cache.get(key);
  if (known) { fill(el, known); return el; }
  spelled.set(key, name);
  if (!waiting.has(key)) waiting.set(key, new Set());
  waiting.get(key)!.add(el);
  if (!timer) timer = setTimeout(flush, 40);
  return el;
}
/** Name followed by its badges. */
export const nameWithBadges = (name: string) => h('span.uname', null, name, badges(name));
export function forgetBadges(name?: string) { if (name) cache.delete(name.toLowerCase()); else cache.clear(); }

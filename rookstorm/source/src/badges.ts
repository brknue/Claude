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

const cache = new Map<string, string[]>();
const waiting = new Map<string, Set<HTMLElement>>();
const spelled = new Map<string, string>(); // lower case -> name as written (the server lookup is case-sensitive)
let timer: any = 0;

/** Badge elements for a list of roles (the owner badge is hidden: it is a permission, the developer badge shows). */
export function badgeEls(roles: string[]): HTMLElement[] {
  return ROLES.filter(r => roles.includes(r.key) && r.key !== 'owner').map(r =>
    h('span.role-badge', { class: r.cls, title: t(r.label), 'aria-label': t(r.label) }, r.icon));
}

function fill(el: HTMLElement, roles: string[]) { el.replaceChildren(...badgeEls(roles)); }

async function flush() {
  timer = 0;
  const names = [...waiting.keys()].filter(n => !cache.has(n));
  if (names.length && SUPABASE_URL) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/roles_of`, { method: 'POST', headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_names: names.map(n => spelled.get(n) || n) }) });
      const map = r.ok ? await r.json() : {};
      for (const n of names) cache.set(n, (map && map[n]) || []);
    } catch { for (const n of names) cache.set(n, []); }
  }
  for (const [n, els] of waiting) { const roles = cache.get(n) || []; els.forEach(el => fill(el, roles)); }
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

/**
 * Admin panel (staff only, English). Needs an account with the admin/owner role AND the admin password;
 * every action is checked by the server (supabase/add-admin.sql) and written to the audit log.
 */
import { h, btn, toast, modal } from '../ui';
import { me, rpc, accountsEnabled, refreshMe, MODES } from '../account';
import { ROLES, badgeEls, forgetBadges, TITLES, titleEl } from '../badges';
import { go } from '../main';
import { fmtDate } from '../i18n';

const isStaff = () => !!me && Array.isArray((me as any).roles) && ((me as any).roles.includes('admin') || (me as any).roles.includes('owner'));
export const staff = isStaff;
const err = (e: any) => String(e?.message || e).replace(/^.*?: /, '');
const ago = (iso?: string | null) => { if (!iso) return '–'; const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 1 ? 'now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };

export function adminPage(root: HTMLElement, tab?: string) {
  if (!accountsEnabled() || !me) { go('account'); return; }
  if (!isStaff()) { root.append(h('section.card.setup.center', null, h('h1', null, 'Admin'), h('p.muted', null, 'This page is for staff only.'), h('a.btn', { href: '#/' }, 'Back'))); return; }
  let owner = false, isRoot = false;
  const wrap = h('div.admin');
  root.append(wrap);

  async function start() {
    let st: any;
    try { st = await rpc('admin_status'); } catch (e) { wrap.replaceChildren(h('p.err', null, 'The admin add-on is not installed (supabase/add-admin.sql). ' + err(e))); return; }
    owner = !!st.owner; isRoot = !!st.root;
    if (st.unlocked) panel(tab || 'dashboard'); else unlockForm();
  }

  function unlockForm() {
    const pw = h('input', { type: 'password', autocomplete: 'off', placeholder: 'Admin password', 'aria-label': 'Admin password' }) as HTMLInputElement;
    const msg = h('p.err');
    const go1 = btn('Unlock', async () => {
      msg.textContent = '';
      try {
        const r = await rpc<any>('admin_unlock', { p_password: pw.value });
        pw.value = '';
        if (!r?.ok) { msg.textContent = 'Wrong password.'; return; }
        owner = !!r.owner; panel(tab || 'dashboard');
      } catch (e) { msg.textContent = err(e); }
    }, 'primary');
    wrap.replaceChildren(h('section.card.admin-lock', null, h('h1', null, '🛡 Admin panel'), h('p.muted', null, 'Enter the admin password. The session stays unlocked for 30 minutes of activity.'),
      h('form', { onsubmit: (e: Event) => { e.preventDefault(); go1.click(); } }, pw, go1), msg));
    pw.focus();
  }

  const TABS: [string, string][] = [['dashboard', 'Dashboard'], ['users', 'Users'], ['staff', 'Staff & roles'], ['games', 'Games'], ['announce', 'Announcement'], ['log', 'Audit log'], ['settings', 'Settings']];
  function panel(which: string) {
    if (!TABS.some(([k]) => k === which)) which = 'dashboard';
    const body = h('div.admin-body');
    wrap.replaceChildren(
      h('div.admin-head', null, h('h1', null, '🛡 Admin'), h('span.muted.small', null, owner ? 'Owner' : 'Admin', ' · ', me!.username),
        btn('Lock', async () => { await rpc('admin_lock').catch(() => {}); unlockForm(); }, 'small ghost')),
      h('div.seg.admin-tabs', null, TABS.map(([k, l]) => h('button', { type: 'button', class: k === which ? 'on' : '', onclick: () => { history.replaceState(null, '', '#/admin/' + k); panel(k); } }, l))),
      body);
    const guard = (p: Promise<any>) => p.catch(e => { if (/admin locked/.test(String(e?.message))) unlockForm(); else body.replaceChildren(h('p.err', null, err(e))); });
    guard(({ dashboard, users: usersTab, staff: staffTab, games, announce, log, settings } as Record<string, (b: HTMLElement) => Promise<void>>)[which](body));
  }

  // ------------------------------------------------------------ dashboard
  async function dashboard(b: HTMLElement) {
    const s = await rpc<any>('admin_stats');
    const tile = (n: any, l: string) => h('div.admin-tile', null, h('b', null, String(n)), h('span.muted.small', null, l));
    const max = Math.max(1, ...s.signups_by_day.map((x: any) => x.n));
    b.replaceChildren(
      h('div.admin-tiles', null, tile(s.users, 'players'), tile(s.online, 'online now'), tile(s.active_24h, 'active 24 h'), tile(s.new_24h, 'new 24 h'), tile(s.new_7d, 'new 7 days'),
        tile(s.live_games, 'live games'), tile(s.daily_games, 'daily games running'), tile(s.games_24h, 'games 24 h'), tile(s.games_total, 'games total'),
        tile(s.messages_24h, 'messages 24 h'), tile(s.puzzle_today, 'daily puzzle today'), tile(s.friendships, 'friendships'), tile(s.banned, 'banned')),
      h('section.card', null, h('h2', null, 'Sign-ups, last 14 days'), h('div.admin-bars', null, s.signups_by_day.map((x: any) => h('div.admin-bar', { title: `${x.d}: ${x.n}` }, h('i', { style: { height: (x.n / max * 100) + '%' } }), h('span', null, String(x.d).slice(8)))))));
  }

  // ------------------------------------------------------------ users
  async function usersTab(b: HTMLElement, filter = 'all') {
    const q = h('input', { type: 'search', placeholder: 'Search username', 'aria-label': 'Search username' }) as HTMLInputElement;
    const f = h('select', { 'aria-label': 'Filter' }, [['all', 'All'], ['online', 'Online'], ['new', 'New (7 days)'], ['staff', 'With roles'], ['banned', 'Banned']].map(([v, l]) => h('option', { value: v, selected: v === filter }, l))) as HTMLSelectElement;
    const list = h('div.admin-list');
    const detail = h('div.admin-detail');
    b.replaceChildren(h('div.row.wrap.admin-search', null, q, f), h('div.admin-split', null, list, detail));
    let n = 0;
    const load = async () => {
      const my = ++n;
      const rows = await rpc<any[]>('admin_users', { p_query: q.value.trim(), p_filter: f.value, p_limit: 100 });
      if (my !== n) return;
      list.replaceChildren(...(rows.length ? rows.map(u => h('button.admin-row', { type: 'button', onclick: () => userDetail(detail, u.id, load) },
        h('b', null, u.username, ...badgeEls(u.roles || [])),
        h('span.muted.small', null, `${u.games} games · best ${u.best ?? '–'} · seen ${ago(u.last_seen)}`),
        u.banned_until && Date.parse(u.banned_until) > Date.now() ? h('span.admin-ban', null, 'banned') : null)) : [h('p.muted', null, 'No players.')]));
    };
    q.addEventListener('input', () => { clearTimeout((q as any)._t); (q as any)._t = setTimeout(load, 250); });
    f.addEventListener('change', load);
    await load();
  }

  async function userDetail(el: HTMLElement, id: string, reload: () => void) {
    el.replaceChildren(h('div.spinner-row', null, h('span.spinner'), 'Loading…'));
    const u = await rpc<any>('admin_user', { p_id: id });
    if (!u) { el.replaceChildren(h('p.muted', null, 'Player not found.')); return; }
    const act = (label: string, fn: () => Promise<any>, cls = '') => btn(label, async () => { try { await fn(); toast('Done'); forgetBadges(u.username); await userDetail(el, id, reload); reload(); } catch (e) { toast(err(e)); } }, 'small ' + cls);
    // ratings
    const modeSel = h('select', { 'aria-label': 'Mode' }, MODES.map(([k, l]) => h('option', { value: k }, l))) as HTMLSelectElement;
    const ratingIn = h('input', { type: 'number', min: 100, max: 4000, step: 1, value: 1500, 'aria-label': 'Rating' }) as HTMLInputElement;
    const ratings = Object.entries(u.ratings || {}) as [string, any][];
    // roles
    const roleBoxes = ROLES.map(r => {
      const locked = (r.key === 'owner' && !isRoot) || (r.key === 'admin' && !owner) || ((u.roles || []).includes('owner') && u.id !== me!.id && !isRoot);
      return h('label.check.small', { class: locked ? 'disabled' : '' }, h('input', { type: 'checkbox', value: r.key, checked: (u.roles || []).includes(r.key), disabled: locked }), h('span', null, r.icon + ' ' + r.label));
    });
    const banned = u.banned_until && Date.parse(u.banned_until) > Date.now();
    const extra = await rpc<any>('admin_user_extra', { p_id: id }).catch(() => null);
    const titleSel = h('select', { 'aria-label': 'Title' }, [h('option', { value: '' }, '— no title —'), ...TITLES.map(([k, n]) => h('option', { value: k, selected: extra?.title === k }, `${k} · ${n}`))]) as HTMLSelectElement;
    const brillIn = h('input', { type: 'number', step: 1, value: 1, 'aria-label': 'Brilliant moves to add' }) as HTMLInputElement;
    el.replaceChildren(h('section.card', null,
      h('div.admin-user-head', null, h('div', null, h('h2', null, u.username, ...badgeEls(u.roles || [])),
        h('span.muted.small', null, `joined ${fmtDate(u.created_at)} · seen ${ago(u.last_seen)} · ${u.friends} friends · ${u.games} games · ${u.messages_sent} messages · ${u.daily_solved} daily puzzles · ratings ${u.rating_visibility || 'everyone'}`)),
        h('a.btn.small', { href: '#/profile/' + encodeURIComponent(u.username) }, 'Profile')),
      banned ? h('p.admin-ban', null, `Banned until ${new Date(u.banned_until).toLocaleString()} — ${u.ban_reason || ''}`) : null,
      h('h3.set-h', null, 'Ratings'),
      h('div.admin-ratings', null, ratings.length ? ratings.map(([m, s]) => h('span.tag', null, `${m}: ${s.r} (${s.g} games)`)) : h('span.muted.small', null, 'No ratings yet (1500 everywhere).')),
      h('div.row.wrap', null, modeSel, ratingIn, act('Set rating', () => rpc('admin_set_rating', { p_id: id, p_mode: modeSel.value, p_rating: +ratingIn.value })),
        act('Reset all ratings', async () => { if (!confirm(`Reset all ratings of ${u.username} to 1500?`)) throw new Error('cancelled'); await rpc('admin_reset_ratings', { p_id: id }); }, 'ghost')),
      extra ? [h('h3.set-h', null, 'Title'), h('div.row.wrap', null, titleEl(extra.title) || h('span.muted.small', null, 'none'), titleSel, act('Save title', () => rpc('admin_set_title', { p_id: id, p_title: titleSel.value })))] : h('p.muted.small', null, 'Titles and extra brilliant moves need supabase/add-titles.sql.'),
      extra ? [h('h3.set-h', null, 'Brilliant moves'), h('div.row.wrap', null, h('span.muted.small', null, `added by admins so far: ${extra.brilliant_bonus}`), brillIn, act('Add brilliant moves', () => rpc('admin_add_brilliants', { p_id: id, p_count: parseInt(brillIn.value) || 0 })), h('span.muted.small', null, 'Use a negative number to take some away.'))] : null,
      h('h3.set-h', null, 'Roles & badges'), h('div.admin-roles', null, roleBoxes),
      act('Save roles', () => rpc('admin_set_roles', { p_id: id, p_roles: roleBoxes.map(l => l.querySelector('input') as HTMLInputElement).filter(i => i.checked).map(i => i.value) }), 'primary'),
      h('p.muted.small', null, 'Admin gives access to this panel (the admin password is still needed). Owners give or take admin; only Crb gives or takes owner. Crb’s own top roles can never be removed.'),
      h('h3.set-h', null, 'Account'),
      h('div.row.wrap', null,
        act('Reset password', async () => { const p = prompt(`New password for ${u.username} (8+ characters):`); if (!p) throw new Error('cancelled'); await rpc('admin_set_password', { p_id: id, p_new: p }); }),
        act('Rename', async () => { const n = prompt('New username:', u.username); if (!n || n === u.username) throw new Error('cancelled'); await rpc('admin_rename', { p_id: id, p_username: n }); }),
        banned ? act('Unban', () => rpc('admin_ban', { p_id: id, p_hours: 0, p_reason: '' })) : act('Ban…', async () => {
          const hrs = prompt('Ban for how many hours? (24 = 1 day, 168 = 1 week, 87600 = 10 years)', '24'); if (!hrs) throw new Error('cancelled');
          const reason = prompt('Reason (shown to the player):', '') ?? '';
          await rpc('admin_ban', { p_id: id, p_hours: Math.max(1, parseInt(hrs) || 24), p_reason: reason });
        }, 'danger'),
        act('Delete messages', async () => { if (!confirm(`Delete every chat message sent by ${u.username}?`)) throw new Error('cancelled'); await rpc('admin_clear_messages', { p_id: id }); }, 'ghost'),
        act('Delete account', async () => { const typed = prompt(`Type ${u.username} to delete this account for good:`); if (typed !== u.username) throw new Error('cancelled'); await rpc('admin_delete_user', { p_id: id }); el.replaceChildren(); }, 'danger')),
      h('h3.set-h', null, 'Recent games'),
      h('div.admin-list.small', null, (u.recent_games || []).map((g: any) => gameRow(g, () => userDetail(el, id, reload))))));
  }

  // ------------------------------------------------------------ staff
  async function staffTab(b: HTMLElement) {
    const rows = await rpc<any[]>('admin_users', { p_query: '', p_filter: 'staff', p_limit: 200 });
    const detail = h('div.admin-detail');
    b.replaceChildren(h('p.muted', null, 'Players with a role. Open one to change roles; find anyone else under Users.'),
      h('div.admin-split', null, h('div.admin-list', null, rows.map(u => h('button.admin-row', { type: 'button', onclick: () => userDetail(detail, u.id, () => staffTab(b)) }, h('b', null, u.username, ...badgeEls(u.roles || [])), h('span.muted.small', null, (u.roles || []).join(', '))))), detail),
      h('section.card', null, h('h2', null, 'Badges'), h('div.admin-roles', null, ROLES.map(r => h('span.tag', null, ...badgeEls([r.key === 'owner' ? 'developer' : r.key]).slice(0, 1), ' ', r.label, r.perm ? ' (permission)' : '')))));
  }

  // ------------------------------------------------------------ games
  function gameRow(g: any, after: () => void) {
    const live = g.status === 'live' || g.status === 'pending' || g.status === 'disputed';
    const end = (res: string | null) => btn(res ?? 'Abort', async () => { if (!confirm(res ? `End the game as ${res}?` : 'Abort this game?')) return; try { await rpc('admin_end_game', { p_id: g.id, p_result: res }); toast('Done'); after(); } catch (e) { toast(err(e)); } }, 'small ghost');
    return h('div.admin-game', null,
      h('a', { href: g.kind === 'daily' ? '#/daily/' + g.id : '#/watch/' + g.id }, h('b', null, `${g.white} – ${g.black}`)),
      h('span.muted.small', null, `${g.kind} · ${g.variant} · ${g.status}${g.result ? ' ' + g.result : ''}${g.rated ? ' · rated' : ''}${g.moves !== undefined ? ' · ' + g.moves + ' plies' : ''} · ${ago(g.updated_at || g.created_at)}`),
      live ? h('span.row', null, end('1-0'), end('0-1'), end('1/2-1/2'), end(null)) : null);
  }
  async function games(b: HTMLElement, filter = 'live') {
    const rows = await rpc<any[]>('admin_games', { p_filter: filter, p_limit: 100 });
    b.replaceChildren(h('div.seg.small', null, [['live', 'Live'], ['daily', 'Daily'], ['disputed', 'Disputed'], ['rated', 'Rated'], ['recent', 'Recent']].map(([k, l]) => h('button', { type: 'button', class: k === filter ? 'on' : '', onclick: () => games(b, k) }, l))),
      h('div.admin-list', null, rows.length ? rows.map(g => gameRow(g, () => games(b, filter))) : h('p.muted', null, 'No games.')));
  }

  // ------------------------------------------------------------ announcement
  async function announce(b: HTMLElement) {
    const cur = await rpc<any>('get_announcement').catch(() => null);
    const text = h('textarea', { rows: 3, maxLength: 500, placeholder: 'Message shown at the top of every page (empty = none)' }, cur?.text || '') as HTMLTextAreaElement;
    const lvl = h('select', null, [['info', 'Info'], ['warning', 'Warning'], ['success', 'Good news']].map(([v, l]) => h('option', { value: v, selected: v === (cur?.level || 'info') }, l))) as HTMLSelectElement;
    b.replaceChildren(h('section.card', null, h('h2', null, 'Site-wide announcement'), h('p.muted.small', null, 'Everyone sees it on every page (also when not signed in) until they close it.'), text,
      h('div.row.wrap', null, lvl, btn('Publish', async () => { try { await rpc('admin_announce', { p_text: text.value, p_level: lvl.value }); try { sessionStorage.removeItem('rs.announce'); } catch { /* */ } toast('Published'); } catch (e) { toast(err(e)); } }, 'primary'),
        btn('Remove', async () => { try { await rpc('admin_announce', { p_text: '', p_level: 'info' }); text.value = ''; toast('Removed'); } catch (e) { toast(err(e)); } }, 'ghost'))));
  }

  // ------------------------------------------------------------ log
  async function log(b: HTMLElement) {
    const rows = await rpc<any[]>('admin_log_list', { p_limit: 300 });
    b.replaceChildren(h('div.admin-list', null, rows.length ? rows.map(r => h('div.admin-log', null,
      h('span.muted.small', null, new Date(r.at).toLocaleString()), h('b', null, r.admin_name || '?'), h('span', null, r.action), r.target ? h('span.tag', null, r.target) : null,
      r.detail ? h('code.small', null, JSON.stringify(r.detail).slice(0, 140)) : null)) : h('p.muted', null, 'Nothing yet.')));
  }

  // ------------------------------------------------------------ settings
  async function settings(b: HTMLElement) {
    const items: (HTMLElement | null)[] = [
      h('section.card', null, h('h2', null, 'Your session'), h('p.muted.small', null, 'Unlocked for 30 minutes; every action extends it. Lock when you leave the device.'),
        btn('Refresh my roles', async () => { await refreshMe(); toast('Done'); })),
    ];
    if (isRoot) {
      const a = h('input', { type: 'password', placeholder: 'New admin password (8+)', autocomplete: 'new-password' }) as HTMLInputElement;
      const c = h('input', { type: 'password', placeholder: 'Repeat', autocomplete: 'new-password' }) as HTMLInputElement;
      items.push(h('section.card', null, h('h2', null, 'Change the admin password'), h('p.muted.small', null, 'Only Crb can do this. All other admins are locked out until they enter the new password.'),
        h('div.row.wrap', null, a, c, btn('Change', async () => {
          if (a.value !== c.value) { toast('The passwords do not match.'); return; }
          try { await rpc('admin_change_password', { p_new: a.value }); a.value = c.value = ''; toast('Admin password changed'); } catch (e) { toast(err(e)); }
        }, 'primary'))));
    }
    b.replaceChildren(...items.filter(Boolean) as HTMLElement[]);
  }

  start();
  void modal;
}

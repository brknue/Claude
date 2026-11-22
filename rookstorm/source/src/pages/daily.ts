/** Daily games: correspondence chess with friends, a few days per move, rated in their own 'daily' rating. */
import { badges } from '../badges';
import { h, icon, btn, toast, modal } from '../ui';
import { t } from "../i18n";
import { me, rpc, niceError, onAccount } from '../account';
import { VARIANTS, VariantKey, variantName, Color, startFenFor, outcomeText, reasonText } from '../chess';
import { Game } from '../game';
import { Board } from '../board';
import { go } from '../main';
import { setAnalysisInput } from './analysis';
import { needAccount, socialMissing } from './chat';
import { onDailyRow, pollAlerts, setFocus, notifyBanner, missingSocial, socialAvailable } from '../notify';

export const DAYS = [1, 2, 3, 5, 7, 14];
const abortText = (r: string) => r === 'declined' ? t('Invitation declined') : r === 'cancelled' ? t('Invitation cancelled') : r === 'not accepted' ? t('Invitation not accepted in time') : reasonText(r);
const daysLabel = (d: number) => d === 1 ? t('1 day per move') : t('{0} days per move', d);

export function timeLeft(deadline?: string | null): string {
  if (!deadline) return '';
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return t('Time is up');
  const min = Math.floor(ms / 60000), hr = Math.floor(min / 60), d = Math.floor(hr / 24);
  if (d >= 1) return t('{0} d {1} h', d, hr % 24);
  if (hr >= 1) return t('{0} h {1} min', hr, min % 60);
  return t('{0} min', Math.max(1, min));
}

/** Invite a friend to a daily game (pick the friend when none is given). */
export function newDailyDialog(friendId?: string, friendName?: string) {
  let to = friendId || '', variant: VariantKey = 'standard', days = 3, color: 'white' | 'black' | 'random' = 'random', rated = true;
  let friends: { id: string; username: string }[] = friendId ? [{ id: friendId, username: friendName || '' }] : [];
  const body = h('div');
  const close = modal(h('div.challenge', null, h('h2', null, friendName ? t('Daily game with {0}', friendName) : t('New daily game')),
    h('p.muted.small', null, t('Each player has a few days for every move. You get a notification when it is your turn.')), body));
  const field = (label: string, el: HTMLElement) => h('label.field', null, h('span.lbl', null, label), el);
  function render() {
    body.replaceChildren(
      friendId ? '' : friends.length
        ? field(t('Friend'), h('select', { onchange: (e: any) => { to = e.target.value; } }, friends.map(f => h('option', { value: f.id, selected: f.id === to }, f.username))))
        : h('p.muted', null, t('No friends yet. Search for a username above and send a friend request.')),
      h('div.field', null, h('span.lbl', null, t('Time per move')), h('div.tc-grid.small', null, DAYS.map(d =>
        h('button.tc', { type: 'button', class: d === days ? 'on' : '', onclick: () => { days = d; render(); } }, h('b', null, d === 1 ? t('1 day') : t('{0} days', d)))))),
      field(t('Variant'), h('select', { onchange: (e: any) => { variant = e.target.value; render(); } }, VARIANTS.map(v => h('option', { value: v.key, selected: v.key === variant }, t(v.name))))),
      h('div.field', null, h('span.lbl', null, t('Play as')), h('div.seg', null, (['white', 'random', 'black'] as const).map(c =>
        h('button', { type: 'button', class: c === color ? 'on' : '', onclick: () => { color = c; render(); } }, h('span.cdot.' + c), c === 'white' ? t('White') : c === 'black' ? t('Black') : t('Random'))))),
      variant === 'standard' ? h('label.check', null, h('input', { type: 'checkbox', checked: rated, onchange: (e: any) => { rated = e.target.checked; } }), t('Rated game'), h('span.muted.small', null, ' (' + t('Daily rating') + ')'))
        : h('p.muted.small', null, t('Only standard chess daily games are rated.')),
      h('div.row.end', null, btn(t('Cancel'), () => close()), btn(h('span', null, icon('calendar'), t('Send invitation')), async () => {
        if (!to) { toast(t('Pick a friend first.')); return; }
        try {
          const id = await rpc<string>('daily_create', { p_to: to, p_variant: variant, p_days: days, p_color: color, p_rated: rated && variant === 'standard', p_start_fen: startFenFor(variant) });
          close(); toast(t('Invitation sent')); go('daily/' + id);
        } catch (e) { missingSocial(e); toast(socialAvailable() ? niceError(e) : t('This feature is not switched on for this site yet.')); }
      }, 'primary')));
  }
  render();
  if (!friendId) rpc<any[]>('list_friends').then(rows => { friends = rows.filter(r => r.relation === 'friend'); to = friends[0]?.id || ''; render(); }).catch(() => {});
}

// ---------------------------------------------------------------- list
export function dailyPage(root: HTMLElement, id?: string) {
  if (id) return dailyGamePage(root, id);
  if (needAccount(root, t('Daily games'), t('Sign in to play daily games with your friends.'))) return;
  let alive = true;
  const list = h('div.daily-list', null, h('div.spinner-row', null, h('span.spinner'), t('Loading…')));
  root.append(h('div.daily-page', null, notifyBanner(),
    h('section.card', null,
      h('div.games-head', null, h('h1', null, icon('calendar'), ' ', t('Daily games')), btn(h('span', null, icon('play'), t('New daily game')), () => newDailyDialog(), 'primary')),
      h('p.muted', null, t('Play friends at your own pace: each player has a few days for every move. You get a notification when it is your turn.')),
      list)));
  async function load() {
    let rows: any[];
    try { rows = await rpc<any[]>('daily_list'); } catch (e) { missingSocial(e); if (!socialAvailable()) socialMissing(root); else list.replaceChildren(h('p.err', null, niceError(e))); return; }
    if (!alive) return;
    const inv = rows.filter(r => r.incoming), mine = rows.filter(r => r.status === 'live' && r.my_turn),
      wait = rows.filter(r => (r.status === 'live' && !r.my_turn) || (r.status === 'pending' && !r.incoming)), done = rows.filter(r => r.status !== 'live' && r.status !== 'pending');
    const out: HTMLElement[] = [];
    const sec = (title: string, rs: any[]) => { if (rs.length) out.push(h('h2.daily-h', null, title, h('span.muted.small', null, ` (${rs.length})`)), ...rs.map(dailyRow)); };
    sec(t('Invitations'), inv); sec(t('Your move'), mine); sec(t('Waiting for your opponent'), wait); sec(t('Recently finished'), done);
    if (!out.length) out.push(h('p.muted.center', null, t('No daily games yet. Invite a friend!')));
    list.replaceChildren(...out);
  }
  function dailyRow(r: any): HTMLElement {
    const white = r.white_id === me!.id;
    const opp = white ? r.black_name : r.white_name;
    const n = r.moves ? r.moves.split(' ').length : 0;
    let side: (HTMLElement | null)[] = [];
    let status = '';
    if (r.incoming) {
      status = t('Invited you');
      side = [btn(t('Accept'), async (ev?: any) => { ev?.stopPropagation?.(); await respond(r.id, true); }, 'primary small'), btn(t('Decline'), async () => { await respond(r.id, false); }, 'small')];
    } else if (r.status === 'pending') {
      status = t('Waiting for {0} to accept', opp);
      side = [btn(t('Cancel'), async () => { await respond(r.id, false); }, 'small ghost')];
    } else if (r.status === 'live') {
      status = (r.my_turn ? t('Your move') : t('Their move')) + ' · ' + timeLeft(r.deadline);
    } else {
      const res = r.result;
      const won = res && res !== '1/2-1/2' && (res === '1-0') === white;
      status = r.status === 'aborted' ? t('Aborted') : res === '1/2-1/2' ? t('Draw') : won ? t('Won') : t('Lost');
    }
    const el = h('div.daily-row', { class: r.my_turn ? 'turn' : r.incoming ? 'invite' : '' },
      h('a.dr-main', { href: '#/daily/' + r.id },
        h('span.cdot.' + (white ? 'white' : 'black')),
        h('span', null, h('b', null, t('vs {0}', opp), badges(opp)), h('span.muted.small.block', null, `${variantName(r.variant)} · ${daysLabel(r.days)}${r.rated ? ' · ' + t('Rated') : ''} · ${t('{0} moves', Math.ceil(n / 2))}`)),
        h('span.dr-status', { class: r.my_turn ? 'hot' : '' }, status)),
      side.length ? h('div.row.dr-acts', null, side) : null);
    return el;
  }
  async function respond(gid: string, accept: boolean) {
    try { await rpc('daily_respond', { p_id: gid, p_accept: accept }); if (accept) go('daily/' + gid); else load(); pollAlerts(); } catch (e) { toast(niceError(e)); }
  }
  load();
  const off = onDailyRow(() => load());
  const iv = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 30000);
  return () => { alive = false; off(); clearInterval(iv); };
}

// ---------------------------------------------------------------- one daily game
export function dailyGamePage(root: HTMLElement, id: string) {
  if (needAccount(root, t('Daily games'), t('Sign in to play daily games with your friends.'))) return;
  let alive = true;
  let row: any = null;
  let game: Game | null = null;
  let viewPly = 0;
  let sending = false;
  let myColor: Color | null = null;
  const board = new Board({ onMove: (m) => userMove(m) });
  board.movableColor = null;
  const top = h('div.pstrip.top'), bottom = h('div.pstrip.bottom');
  const info = h('div.watch-info');
  const moves = h('div.movelist');
  const nav = h('div.row.nav-row');
  const acts = h('div.row.wrap.daily-acts');
  root.append(h('div.game-layout.daily-game', null, h('div.board-col', null, top, board.el, bottom, nav),
    h('aside.side.card', null, h('div.side-head', null, h('b', null, icon('calendar'), ' ', t('Daily game'))), info, moves, acts, notifyBanner())));
  setFocus('daily:' + id);

  const latest = () => !!game && viewPly === game.ply;
  const isMyTurn = () => !!row && row.status === 'live' && !!game && !!myColor && game.pos.turn === myColor;

  const strip = (c: Color) => {
    const name = c === 'white' ? row.white_name : row.black_name;
    const toMove = row.status === 'live' && game && game.pos.turn === c;
    const diff = row.status === 'finished' && row.rated ? (c === 'white' ? row.white_diff : row.black_diff) : null;
    return h('div.pinfo', { class: toMove ? 'turn' : '' }, h('span.cdot.' + c), h('div.pname', null, h('b', null, h('a.plink', { href: '#/profile/' + encodeURIComponent(name) }, name), badges(name)), diff != null ? h('span.delta', { class: diff >= 0 ? 'up' : 'down' }, ' ' + (diff >= 0 ? '+' : '') + diff) : null),
      toMove ? h('div.clock.daily-clock', null, timeLeft(row.deadline)) : null);
  };
  function render() {
    if (!row || !game) return;
    const bottomColor: Color = board.orientation;
    top.replaceChildren(strip(bottomColor === 'white' ? 'black' : 'white')); bottom.replaceChildren(strip(bottomColor));
    const opp = myColor === 'white' ? row.black_name : row.white_name;
    let status: HTMLElement;
    if (row.status === 'pending') status = h('p.status', null, row.created_by === me!.id ? t('Waiting for {0} to accept', opp) : t('{0} invited you to a daily game', opp));
    else if (row.status === 'live') status = h('p.status', { class: isMyTurn() ? 'hot' : '' }, isMyTurn() ? t('Your move') : myColor ? t('Waiting for {0}', opp) : t('Live'), ' · ', timeLeft(row.deadline));
    else if (row.status === 'aborted') status = h('p.status.over', null, t('Aborted'), row.reason ? ` · ${abortText(row.reason)}` : '');
    else {
      const winner: Color | undefined = row.result === '1-0' ? 'white' : row.result === '0-1' ? 'black' : undefined;
      status = h('p.status.over', null, outcomeText({ winner, reason: row.reason || '' }));
    }
    info.replaceChildren(h('p.muted.small', null, `${variantName(row.variant)} · ${daysLabel(row.days)}${row.rated ? ' · ' + t('Rated') : ''}`), status,
      row.status === 'live' && row.draw_offer && row.draw_offer !== me!.id ? h('p.draw-offer', null, t('{0} offers a draw', opp)) : '',
      row.status === 'live' && row.draw_offer === me!.id ? h('p.muted.small', null, t('Draw offered')) : '');
    // move list
    const items: HTMLElement[] = [];
    game.sans.forEach((s, i) => {
      const { num, white } = game!.moveNumber(i);
      if (white || i === 0) items.push(h('span.mnum', null, num + (white ? '.' : '…')));
      items.push(h('button.mv', { type: 'button', class: i + 1 === viewPly ? 'cur' : '', onclick: () => show(i + 1) }, s));
    });
    moves.replaceChildren(...(items.length ? items : [h('span.muted.small', null, t('No moves yet.'))]));
    if (latest()) moves.scrollTop = moves.scrollHeight;
    nav.replaceChildren(
      btn(icon('first'), () => show(0), 'icon', t('First move')), btn(icon('prev'), () => show(viewPly - 1), 'icon', t('Previous move')),
      btn(icon('next'), () => show(viewPly + 1), 'icon', t('Next move')), btn(icon('last'), () => show(game!.ply), 'icon', t('Last move')),
      btn(icon('flip'), () => { board.flip(); render(); }, 'icon', t('Flip board')));
    // actions
    const a: (HTMLElement | null)[] = [];
    if (row.status === 'pending') {
      if (row.created_by !== me!.id) a.push(btn(t('Accept'), () => respond(true), 'primary'), btn(t('Decline'), () => respond(false)));
      else a.push(btn(t('Cancel invitation'), () => respond(false), 'ghost'));
    } else if (row.status === 'live' && myColor) {
      if (row.draw_offer && row.draw_offer !== me!.id) a.push(btn(t('Accept draw'), () => action('accept'), 'primary'), btn(t('Decline draw'), () => action('decline')));
      else if (!row.draw_offer && game.ply >= 2) a.push(btn(h('span', null, icon('half'), t('Offer draw')), () => action('offer')));
      a.push(btn(h('span', null, icon('flag'), t('Resign')), () => { if (confirm(t('Resign this game?'))) action('resign'); }, 'ghost'));
    } else if (row.status !== 'live') {
      a.push(btn(h('span', null, icon('chart'), t('Analysis board')), () => {
        setAnalysisInput({ variant: row.variant, startFen: row.start_fen, ucis: game!.ucis.slice(), white: row.white_name, black: row.black_name, orientation: myColor || 'white', gameId: row.status === 'finished' ? row.id : undefined });
        go('analysis');
      }, 'primary'));
      if (myColor) a.push(btn(h('span', null, icon('retry'), t('Rematch')), () => newDailyDialog(myColor === 'white' ? row.black_id : row.white_id, opp)));
    }
    if (myColor) a.push(h('a.btn', { href: '#/chat/' + encodeURIComponent(opp) }, icon('chat'), t('Message')));
    a.push(h('a.btn.ghost', { href: '#/daily' }, t('All daily games')));
    acts.replaceChildren(...a.filter(Boolean) as HTMLElement[]);
  }
  function show(ply: number) {
    if (!game) return;
    viewPly = Math.max(0, Math.min(game.ply, ply));
    const pos = game.positions[viewPly];
    const m = viewPly ? game.moves[viewPly - 1] as any : null;
    const f = (s: number) => 'abcdefgh'[s & 7] + ((s >> 3) + 1);
    const last: [string, string] | null = m ? ('from' in m ? [f(m.from), f(m.to)] : [f(m.to), f(m.to)]) : null;
    board.movableColor = latest() && isMyTurn() ? myColor : null;
    board.setPosition(pos, last, latest() && isMyTurn());
    render();
  }
  function apply(r: any) {
    const prev = game;
    const prevPly = prev ? prev.ply : -1;
    row = r;
    myColor = r.white_id === me!.id ? 'white' : r.black_id === me!.id ? 'black' : null;
    const g = new Game(r.variant, r.start_fen);
    for (const u of (r.moves ? r.moves.split(' ') : [])) if (!g.playUci(u)) break;
    if (!prev) board.setOrientation(myColor || 'white');
    const follow = !prev || viewPly === prevPly;
    game = g;
    if (prev && follow && g.ply === prevPly + 1) {
      viewPly = g.ply;
      board.movableColor = isMyTurn() ? myColor : null;
      board.showMove(prev.pos, g.moves[g.ply - 1], g.pos, isMyTurn());
      render();
    } else show(follow ? g.ply : Math.min(viewPly, g.ply));
  }
  async function userMove(m: any) {
    if (!game || !row || sending || !isMyTurn() || !latest()) return;
    const prevPos = game.pos;
    const n = game.ply;
    if (!game.play(m)) { show(game.ply); return; }
    viewPly = game.ply;
    board.movableColor = null;
    board.showMove(prevPos, m, game.pos, false);
    const o = game.result;
    const result = o ? (o.winner === 'white' ? '1-0' : o.winner === 'black' ? '0-1' : '1/2-1/2') : null;
    render();
    sending = true;
    try {
      const r = await rpc('daily_move', { p_id: id, p_ply: n, p_uci: game.ucis[n], p_result: result, p_reason: o?.reason || null });
      if (alive && r) { apply({ ...r, my_turn: false }); pollAlerts(); }
    } catch (e) { toast(niceError(e)); await load(true); }
    sending = false;
  }
  async function respond(accept: boolean) {
    try { await rpc('daily_respond', { p_id: id, p_accept: accept }); await load(true); pollAlerts(); } catch (e) { toast(niceError(e)); }
  }
  async function action(a: string) {
    try { await rpc('daily_action', { p_id: id, p_action: a }); await load(true); pollAlerts(); } catch (e) { toast(niceError(e)); }
  }
  async function load(force = false) {
    try {
      const r = await rpc('daily_get', { p_id: id });
      if (!alive) return;
      if (!r) { info.replaceChildren(h('p.err', null, t('This game is not available.'))); return; }
      if (force || !row || r.updated_at !== row.updated_at || r.status !== row.status) apply(r);
    } catch (e) { missingSocial(e); if (!socialAvailable()) socialMissing(root); else info.replaceChildren(h('p.err', null, niceError(e))); }
  }
  load();
  const off = onDailyRow((r) => { if (alive && r.id === id && !sending) load(); });
  const poll = setInterval(() => { if (document.visibilityState === 'visible' && !sending) load(); }, 20000);
  const tick = setInterval(() => { if (row?.status === 'live') render(); }, 30000);
  const offAcc = onAccount(() => { if (!me) go('account'); });
  return () => { alive = false; off(); offAcc(); clearInterval(poll); clearInterval(tick); setFocus(''); board.destroy(); };
}


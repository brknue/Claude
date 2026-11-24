/** Party variants: setup inside Play, the table lobby (pick a seat) and the game itself. */
import { h, icon, btn, toast, copyText, settings, loadRaw, save, sound, askConfirm } from '../ui';
import { t } from '../i18n';
import { PARTY_VARIANTS, partyVariant, SPEEDS, Variant, State, inCheck, VALUE, PT } from '../arcade/rules';
import { PartyBoard, seatColor, pieceEl } from '../arcade/view';
import { TableHost, TableGuest, TableClient } from '../arcade/table';
import { me } from '../account';
import { go, setLeaveGuard } from '../main';

let currentHost: TableHost | null = null;
const myName = () => me?.username || settings.name || '';
const GROUPS: [string, string][] = [['four', '4 players'], ['live', 'Real-time'], ['twist', 'Twists on chess'], ['small', 'Small boards']];
const COLOR_NAME: Record<string, string> = { white: 'White', black: 'Black', red: 'Red', blue: 'Blue', yellow: 'Yellow', green: 'Green' };

export function partySetup(body: HTMLElement) {
  const saved = loadRaw('party', { variant: 'fourffa', speed: 'fast' }) as { variant: string; speed: string };
  let variant = PARTY_VARIANTS.some(v => v.key === saved.variant) ? saved.variant : 'fourffa';
  let speed = saved.speed || 'fast';
  const wrap = h('div.party-setup');
  body.append(wrap);
  const persist = () => save('party', { variant, speed });
  function render() {
    const v = partyVariant(variant);
    wrap.replaceChildren(
      h('p.muted', null, t('Share one link: up to 4 friends open it, pick a seat at the table, and the host starts the game. Empty seats can be played by the computer.')),
      ...GROUPS.map(([g, label]) => h('div.field', null, h('span.lbl', null, t(label)), h('div.pv-grid', null,
        PARTY_VARIANTS.filter(x => x.group === g).map(x => h('button.pv-card', {
          type: 'button', class: x.key === variant ? 'on' : '', onclick: () => { variant = x.key; persist(); render(); },
        }, h('b', null, t(x.name)), h('span.pv-tags', null, h('span.tag', null, x.players === 4 ? t('4 players') : t('2 players')), x.realtime ? h('span.tag.live', null, t('Real-time')) : null)))))),
      h('div.pv-desc.card', null, h('b', null, t(v.name)), h('p', null, t(v.desc))),
      v.realtime ? h('div.field', null, h('span.lbl', null, t('Speed')), h('div.seg', null, SPEEDS.map(([k, label, ms]) =>
        h('button', { type: 'button', class: k === speed ? 'on' : '', onclick: () => { speed = k; persist(); render(); } }, t(label), h('small.muted', null, ` ${ms / 1000}s`))))) : '',
      btn(h('span', null, icon('link'), t('Create table and invite friends')), () => createTable(variant, speed, true), 'primary big block'),
      btn(h('span', null, icon('cpu'), t('Play vs computer')), () => createTable(variant, speed, false), 'big block'));
  }
  render();
}

function createTable(variant: string, speed: string, online: boolean) {
  currentHost?.leave();
  const host = new TableHost(variant, speed, myName(), online);
  currentHost = host;
  host.open().then(code => {
    if (!online) host.start!();
    go('table/' + code);
  }).catch(() => { toast(t('Could not reach the connection server. Check your internet connection and try again.')); currentHost = null; });
}

export function tablePage(root: HTMLElement, code?: string) {
  if (!code) { go('play/party'); return; }
  let client: TableClient;
  if (currentHost && currentHost.code === code) client = currentHost;
  else if (code === 'local') { go('play/party'); return; }
  else {
    const g = new TableGuest(code, myName());
    client = g;
    g.connect(() => render());
  }
  let board: PartyBoard | null = null;
  let boardKey = '';
  let lastPly = -1;
  let endPlayed = false;
  const view = h('div.table-page');
  root.append(view);

  function render() {
    const L = client.lobby;
    if (!L) {
      board?.destroy(); board = null; boardKey = '';
      view.replaceChildren(h('section.card.setup.center', null, h('h1', null, t('Party table')),
        h('div.spinner-row', null, client.status.includes('closed') ? null : h('span.spinner'), client.status || t('Connecting to the table…')),
        h('p.muted.small', null, t('Game code:') + ' ', h('b', null, code!)), h('a.btn', { href: '#/play/party' }, t('Back'))));
      setLeaveGuard(null);
      return;
    }
    if (L.phase === 'lobby' || !client.st) { board?.destroy(); board = null; boardKey = ''; lobbyView(L); setLeaveGuard(null); return; }
    gameView(L, client.st);
  }

  function seatLabel(L: NonNullable<TableClient['lobby']>, i: number) {
    const s = L.seats[i];
    if (s.kind === 'bot') return t('Computer');
    if (s.kind === 'human') return s.name || t(COLOR_NAME[seatColor(partyVariant(L.variant), i)]);
    return '';
  }

  function lobbyView(L: NonNullable<TableClient['lobby']>) {
    const v = partyVariant(L.variant);
    const mine = client.mySeat();
    const host = client.isHost;
    const pos = v.players === 4 ? ['s-bottom', 's-left', 's-top', 's-right'] : ['s-bottom', 's-top'];
    const seats = L.seats.map((s, i) => {
      const color = seatColor(v, i);
      const isMe = s.kind === 'human' && i === mine;
      const actions: (HTMLElement | null)[] = [];
      if (s.kind === 'empty') {
        actions.push(btn(t('Sit here'), () => client.sit(i), 'primary small'));
        if (host) actions.push(btn(h('span', null, icon('cpu'), t('Computer')), () => client.setSeat!(i, 'bot'), 'small'));
      } else if (isMe) actions.push(btn(t('Stand up'), () => client.stand(), 'small ghost'));
      else if (host) actions.push(btn(t('Remove'), () => client.setSeat!(i, 'empty'), 'small ghost'));
      return h('div.seat', { class: `${pos[i]} c-${color}${isMe ? ' me' : ''}${s.kind === 'empty' ? ' free' : ''}` },
        h('div.seat-top', null, h('span.sdot'), h('span.muted.small', null, t(COLOR_NAME[color]))),
        h('b.seat-name', null, s.kind === 'empty' ? t('Free seat') : seatLabel(L, i) + (isMe ? ` (${t('You')})` : '') + (s.away ? ` · ${t('away')}` : '')),
        h('div.seat-actions', null, actions));
    });
    const url = location.href.split('#')[0] + '#/table/' + L.code;
    const share = (navigator as any).share ? btn(h('span', null, icon('share'), t('Share / AirDrop')), () => (navigator as any).share({ title: t('Join my chess table on Simple Chess'), url }).catch(() => {}), 'primary') : null;
    const empty = L.seats.filter(s => s.kind === 'empty').length;
    const setupCtl = host ? h('div.row.wrap.table-opts', null,
      h('select', { 'aria-label': t('Variant'), onchange: (e: any) => client.configure!(e.target.value, L.speed) },
        PARTY_VARIANTS.map(x => h('option', { value: x.key, selected: x.key === L.variant }, t(x.name) + (x.players === 4 ? ' · 4' : '')))),
      v.realtime ? h('select', { 'aria-label': t('Speed'), onchange: (e: any) => client.configure!(L.variant, e.target.value) },
        SPEEDS.map(([k, label]) => h('option', { value: k, selected: k === L.speed }, t(label)))) : null) : null;
    view.replaceChildren(h('section.card.table-lobby', null,
      h('h1', null, t(v.name)), h('p.muted', null, t(v.desc)), setupCtl,
      h('div.table-area', { class: v.players === 4 ? 'four' : 'two' }, h('div.felt', null, icon('party'), h('span', null, t('Pick a seat'))), seats),
      L.code !== 'local' ? h('div.linkbox', null,
        h('p.muted.small', null, t('Send this link to your friends. They open it and pick a free seat.')),
        h('input.link-input', { value: url, readOnly: true, onclick: (e: any) => e.target.select(), 'aria-label': t('Invite link') }),
        h('div.row.wrap', null, share, btn(h('span', null, icon('copy'), t('Copy link')), () => copyText(url), share ? '' : 'primary')),
        h('div.code-box', null, h('span.muted.small', null, t('Game code:')), h('b.code', null, L.code))) : null,
      host
        ? h('div.row.wrap.lobby-start', null,
          empty ? btn(h('span', null, icon('cpu'), t('Fill empty seats with the computer')), () => L.seats.forEach((s, i) => { if (s.kind === 'empty') client.setSeat!(i, 'bot'); }), '') : null,
          btn(h('span', null, icon('play'), t('Start game')), () => client.start!(), 'primary big' + (empty ? ' disabled' : '')),
          empty ? h('p.muted.small', null, t('Every seat needs a player or the computer before you can start.')) : null)
        : h('div.spinner-row', null, h('span.spinner'), mine === null ? t('Pick a free seat, or just watch.') : t('Waiting for the host to start the game…')),
      h('div.row', null, btn(t('Leave table'), leave, 'ghost'))));
  }

  function statusText(v: Variant, L: NonNullable<TableClient['lobby']>, st: State, mine: number | null) {
    if (st.over) {
      const names = st.winners.map(i => seatLabel(L, i) || t(COLOR_NAME[seatColor(v, i)]));
      const head = !names.length ? t('Draw') : names.length === 1 ? t('{0} wins!', names[0]) : t('{0} and {1} win!', names[0], names[1]);
      return head + (st.reason ? ' · ' + t(st.reason) : '');
    }
    if (v.realtime) return mine === null ? t('Watching') : st.alive[mine] ? t('No turns: move any piece that is ready.') : t('You are out. Keep watching!');
    const turnName = st.turn === mine ? t('Your move') : t('Waiting for {0}…', seatLabel(L, st.turn) || t(COLOR_NAME[seatColor(v, st.turn)]));
    let extra = '';
    if (v.duck && st.duckPending) extra = st.turn === mine ? t('Now move the duck to an empty square.') : t('Placing the duck…');
    else if (st.movesLeft > 1) extra = t('{0} moves left this turn', st.movesLeft);
    if (v.dice && st.dice && !st.duckPending) extra = t('Dice: move a {0}', t(({ p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king', m: 'king', x: 'knight' } as any)[st.dice]));
    const check = v.mate && !st.duckPending && inCheck(v, st, st.turn) ? t('Check!') + ' · ' : '';
    return check + turnName + (extra ? ' · ' + extra : '');
  }

  /** pieces a player has taken, in the colour of the army they came from; grouped with a count so the row never grows long */
  function capsRow(v: Variant, st: State, seat: number): HTMLElement | null {
    const caps = st.caps?.[seat];
    if (!caps?.length) return null;
    const groups = new Map<string, { t: PT; o: number; n: number }>();
    for (const c of caps) { const k = c.o + c.t; const g = groups.get(k); if (g) g.n++; else groups.set(k, { t: c.t, o: c.o, n: 1 }); }
    const list = [...groups.values()].sort((a, b) => a.o - b.o || VALUE[b.t] - VALUE[a.t]);
    const pts = caps.reduce((a, c) => a + (VALUE[c.t] >= 100 ? 0 : VALUE[c.t]), 0);
    return h('div.pcaps', { title: t('Captured pieces') }, list.map(g => h('span.pcap.cg-wrap', null, pieceEl(v, { t: g.t, o: g.o }), g.n > 1 ? h('small', null, '×' + g.n) : null)),
      pts ? h('span.pcap-pts.muted.small', null, '+' + pts) : null);
  }

  function gameView(L: NonNullable<TableClient['lobby']>, st: State) {
    const v = partyVariant(L.variant);
    const mine = client.mySeat();
    const key = `${L.round}|${L.variant}|${mine}`;
    if (!board || key !== boardKey) {
      board?.destroy();
      board = new PartyBoard(v, mine);
      board.onMove = (m) => client.move(m);
      board.onDuck = (sq) => client.duck(sq);
      boardKey = key; lastPly = -1;
    }
    board.setClock(client.isHost ? Date.now() : client.hostNow);
    const canAct = mine !== null && !st.over && st.alive[mine];
    board.update(st, canAct);
    if (st.ply !== lastPly) { if (lastPly >= 0) sound.move(); lastPly = st.ply; }
    if (st.over && !endPlayed) { endPlayed = true; sound.end(); } else if (!st.over) endPlayed = false;
    setLeaveGuard(canAct ? () => true : null);
    const players = L.seats.map((s, i) => h('div.pplayer', { class: `c-${seatColor(v, i)}${!st.alive[i] ? ' out' : ''}${!v.realtime && !st.over && st.turn === i ? ' turn' : ''}${i === mine ? ' me' : ''}` },
      h('span.sdot'), h('b', null, seatLabel(L, i) || t(COLOR_NAME[seatColor(v, i)])),
      h('span.muted.small', null, [i === mine ? t('You') : '', s.away ? t('away') : '', !st.alive[i] ? t('out') : '', v.teams ? t('Team {0}', (i % 2) + 1) : ''].filter(Boolean).join(' · ')),
      client.isHost && s.kind === 'human' && s.away && !st.over ? btn(t('Let the computer play'), () => client.setSeat!(i, 'bot'), 'small') : null,
      capsRow(v, st, i)));
    const acts: (HTMLElement | null)[] = [];
    const tb = L.tb;
    if (tb && !st.over) {
      const who = seatLabel(L, tb.by) || t(COLOR_NAME[seatColor(v, tb.by)]);
      if (tb.by === mine) acts.push(h('p.muted.small.tb-wait', null, t('Takeback requested. Waiting for the other players…')));
      else if (mine !== null && tb.need.includes(mine) && !tb.ok.includes(mine)) acts.push(h('div.tb-ask', null, h('b', null, t('{0} asks to take back a move.', who)),
        h('div.row', null, btn(t('Accept'), () => client.answerTakeback(true), 'primary small'), btn(t('Decline'), () => client.answerTakeback(false), 'small'))));
      else acts.push(h('p.muted.small.tb-wait', null, t('{0} asks to take back a move.', who)));
    } else if (canAct && !v.realtime && st.ply > 0) acts.push(btn(h('span', null, icon('back'), t('Takeback')), () => client.takeback(), ''));
    if (canAct) acts.push(btn(h('span', null, icon('flag'), t('Resign')), async () => { if (await askConfirm(t('Resign this game?'), { ok: t('Resign'), danger: true })) client.resign(); }, 'danger'));
    if (st.over && client.isHost) acts.push(btn(h('span', null, icon('retry'), t('Play again')), () => client.start!(), 'primary'), btn(t('Back to table'), () => client.toLobby!()));
    if (st.over && !client.isHost) acts.push(h('p.muted.small', null, t('Waiting for the host…')));
    acts.push(btn(t('Leave table'), leave, 'ghost'));
    const status = h('div.status', { class: st.over ? 'over' : '' }, statusText(v, L, st, mine));
    const side = h('aside.side.card', null,
      h('div.side-head', null, h('div', null, h('b', null, t(v.name)), v.realtime ? h('span.muted', null, ' · ' + t((SPEEDS.find(s => s[0] === L.speed) || SPEEDS[1])[1])) : null), status),
      h('div.pplayers', null, players), h('div.actions', null, acts),
      h('p.muted.small', null, t(v.desc)));
    const col = h('div.board-col.pcol', null, board.el, st.over ? h('div.pend', null, statusText(v, L, st, mine)) : null);
    view.replaceChildren(h('div.game-layout.party', { class: v.players === 4 ? 'four' : '' }, col, side));
  }

  async function leave() {
    if (client.st && !client.st.over && client.mySeat() !== null && !(await askConfirm(t('Leave this game? It will be lost.'), { ok: t('Leave'), danger: true }))) return;
    setLeaveGuard(null);
    go('play/party');
  }

  client.onChange = () => render();
  render();
  return () => {
    board?.destroy();
    setLeaveGuard(null);
    if (client.isHost) { client.leave(); if (currentHost === client) currentHost = null; } else client.leave();
  };
}

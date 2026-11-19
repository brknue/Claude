import { h, icon, btn, iconBtn, settings, saveSettings, toast, modal, sound, fmtClock, copyText, loadRaw, save } from '../ui';
import { VARIANTS, VariantKey, variantInfo, startFenFor, posFromFen, materialDiff, outcomeText, Color, Outcome, uciToMove, engineUci, fenOf, moveSquares } from '../chess';
import { Game } from '../game';
import { Board } from '../board';
import { engine, botMove, MIN_ELO, MAX_ELO, whiteCp } from '../engine';
import { Link, Msg } from '../net';
import { go, setLeaveGuard } from '../main';
import { setAnalysisInput } from './analysis';

type Mode = 'bot' | 'local' | 'friend' | 'online';

export interface GameConfig {
  mode: Mode; variant: VariantKey; startFen: string; time: number; inc: number;
  myColor: Color; elo?: number; link?: Link; oppName: string; autoFlip?: boolean; isHost?: boolean;
}

let pendingConfig: GameConfig | null = null;
export function startGame(c: GameConfig) { pendingConfig = c; go('game'); }

export const TIME_PRESETS: [number, number, string][] = [
  [1, 0, 'Bullet'], [2, 1, 'Bullet'], [3, 0, 'Blitz'], [3, 2, 'Blitz'], [5, 0, 'Blitz'], [5, 3, 'Blitz'],
  [10, 0, 'Rapid'], [10, 5, 'Rapid'], [15, 10, 'Rapid'], [30, 0, 'Classical'], [30, 20, 'Classical'], [0, 0, 'Unlimited'],
];

export function eloLabel(e: number): string {
  if (e >= 3190) return 'Stockfish at full strength';
  if (e >= 2800) return 'Super grandmaster';
  if (e >= 2500) return 'Grandmaster';
  if (e >= 2200) return 'Master';
  if (e >= 1800) return 'Expert';
  if (e >= 1400) return 'Club player';
  if (e >= 1000) return 'Intermediate';
  if (e >= 600) return 'Novice';
  return 'Beginner';
}

const tcLabel = (t: number, i: number) => (t === 0 ? '∞' : `${t < 1 ? t * 60 + 's' : t} + ${i}`);

// ---------------- Setup page ----------------
export function playSetupPage(root: HTMLElement, arg?: string) {
  const saved = loadRaw('setup', { mode: 'bot', variant: 'standard', time: 10, inc: 0, color: 'random', autoFlip: true }) as any;
  let mode: Mode = (['bot', 'local', 'friend', 'online'].includes(arg || '') ? arg : saved.mode) as Mode;
  let variant: VariantKey = saved.variant;
  let time = saved.time, inc = saved.inc;
  let color: 'white' | 'black' | 'random' = saved.color;
  let elo = settings.lastElo || 1200;
  let autoFlip = saved.autoFlip !== false;

  const body = h('div.setup-body');
  const tabs = h('div.seg.mode-tabs', { role: 'tablist' });
  const modes: [Mode, string, string][] = [['bot', 'Computer', 'cpu'], ['local', 'Same device', 'users'], ['friend', 'Friend link', 'link'], ['online', 'Online', 'globe']];

  const persist = () => save('setup', { mode, variant, time, inc, color, autoFlip });

  function render() {
    tabs.replaceChildren(...modes.map(([m, label, ic]) => h('button', {
      type: 'button', role: 'tab', 'aria-selected': String(m === mode), class: m === mode ? 'on' : '',
      onclick: () => { mode = m; if (m === 'bot' && !variantInfo(variant).bot) variant = 'standard'; persist(); render(); },
    }, icon(ic), h('span', null, label))));
    body.replaceChildren();

    if (mode === 'bot') {
      const num = h('input.elo-num', { type: 'number', min: MIN_ELO, max: MAX_ELO, step: 1, value: elo, inputmode: 'numeric', 'aria-label': 'Bot Elo rating' }) as HTMLInputElement;
      const range = h('input.elo-range', { type: 'range', min: MIN_ELO, max: MAX_ELO, step: 50, value: elo, 'aria-label': 'Bot Elo slider' }) as HTMLInputElement;
      const lab = h('div.elo-label', null, eloLabel(elo));
      const setElo = (v: number, from: 'num' | 'range' | 'other') => {
        if (!isFinite(v)) return;
        elo = Math.round(v);
        const c = Math.max(MIN_ELO, Math.min(MAX_ELO, elo));
        if (from !== 'num') num.value = String(c);
        if (from !== 'range') range.value = String(c);
        lab.textContent = elo < MIN_ELO || elo > MAX_ELO ? `Allowed range: ${MIN_ELO}–${MAX_ELO}` : eloLabel(c);
        lab.classList.toggle('warn', elo < MIN_ELO || elo > MAX_ELO);
      };
      num.addEventListener('input', () => setElo(parseInt(num.value), 'num'));
      num.addEventListener('blur', () => { elo = Math.max(MIN_ELO, Math.min(MAX_ELO, elo || 1200)); num.value = String(elo); setElo(elo, 'num'); });
      range.addEventListener('input', () => setElo(parseInt(range.value), 'range'));
      body.append(h('div.field', null, h('span.lbl', null, 'Bot strength (Elo)'),
        h('div.elo-row', null, num, h('div.elo-side', null, lab, range)),
        h('div.chips', null, [400, 800, 1200, 1600, 2000, 2400, 2800, 3200].map(v => h('button.chip', { type: 'button', onclick: () => setElo(v, 'other') }, String(v)))),
        h('p.muted.small', null, `Type any rating from ${MIN_ELO} to ${MAX_ELO}. 1320+ uses Stockfish's calibrated strength limiter; lower ratings use a human-like error model. ${MAX_ELO} is full strength.`)));
    }

    // Variant
    const vSel = h('select', { 'aria-label': 'Variant', onchange: (e: any) => { variant = e.target.value; persist(); render(); } },
      VARIANTS.map(v => h('option', { value: v.key, selected: v.key === variant, disabled: mode === 'bot' && !v.bot }, v.name + (mode === 'bot' && !v.bot ? ' (not vs bot)' : ''))));
    body.append(h('label.field', null, h('span.lbl', null, 'Variant'), vSel, h('span.muted.small', null, variantInfo(variant).desc)));

    // Time control
    const custom = !TIME_PRESETS.some(([t, i]) => t === time && i === inc);
    const grid = h('div.tc-grid', null, TIME_PRESETS.map(([t, i, cat]) => h('button.tc', {
      type: 'button', class: t === time && i === inc ? 'on' : '', onclick: () => { time = t; inc = i; persist(); render(); },
    }, h('b', null, tcLabel(t, i)), h('small', null, cat))),
    h('button.tc', { type: 'button', class: custom ? 'on' : '', onclick: () => { if (!custom) { time = 7; inc = 2; } persist(); render(); } }, h('b', null, 'Custom'), h('small', null, custom ? tcLabel(time, inc) : 'Any time')));
    body.append(h('div.field', null, h('span.lbl', null, 'Time control'), grid));
    if (custom) {
      body.append(h('div.row.custom-tc', null,
        h('label.field', null, h('span.lbl', null, 'Minutes per side'), h('input', { type: 'number', min: 0.25, max: 180, step: 0.25, value: time, onchange: (e: any) => { time = Math.max(0.25, Math.min(180, parseFloat(e.target.value) || 5)); e.target.value = time; persist(); } })),
        h('label.field', null, h('span.lbl', null, 'Increment (seconds)'), h('input', { type: 'number', min: 0, max: 180, step: 1, value: inc, onchange: (e: any) => { inc = Math.max(0, Math.min(180, parseInt(e.target.value) || 0)); e.target.value = inc; persist(); } }))));
    }

    if (mode !== 'local' && mode !== 'online') {
      body.append(h('div.field', null, h('span.lbl', null, 'Play as'), h('div.seg', null,
        (['white', 'random', 'black'] as const).map(c => h('button', { type: 'button', class: c === color ? 'on' : '', onclick: () => { color = c; persist(); render(); } },
          h('span.cdot.' + c), c[0].toUpperCase() + c.slice(1))))));
    }
    if (mode === 'local') {
      body.append(h('label.check', null, h('input', { type: 'checkbox', checked: autoFlip, onchange: (e: any) => { autoFlip = e.target.checked; persist(); } }), 'Flip the board after every move'));
    }
    if (mode === 'friend') body.append(h('p.muted', null, 'You get a link to send to your friend. The game starts as soon as they open it. Moves travel directly between your devices (peer-to-peer).'));
    if (mode === 'online') {
      body.append(h('label.field', null, h('span.lbl', null, 'Your name'), h('input', { value: settings.name, maxLength: 20, placeholder: 'Anonymous', oninput: (e: any) => { settings.name = e.target.value.slice(0, 20); saveSettings(); } })));
      body.append(h('p.muted', null, 'You are paired with the next player searching for the same variant and time control. Needs an internet connection.'));
    }
    const label = mode === 'bot' ? 'Play vs Stockfish' : mode === 'local' ? 'Start game' : mode === 'friend' ? 'Create invite link' : 'Find opponent';
    body.append(btn(h('span', null, icon('play'), label), start, 'primary big block'));
  }

  function start() {
    persist();
    const myColor: Color = color === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : color;
    const startFen = startFenFor(variant);
    if (mode === 'bot') {
      elo = Math.max(MIN_ELO, Math.min(MAX_ELO, elo || 1200));
      settings.lastElo = elo; saveSettings();
      startGame({ mode, variant, startFen, time, inc, myColor, elo, oppName: elo >= 3190 ? 'Stockfish 17' : `Stockfish · ${elo}` });
    } else if (mode === 'local') {
      startGame({ mode, variant, startFen, time, inc, myColor: 'white', oppName: 'Black', autoFlip });
    } else if (mode === 'friend') hostFriend(variant, startFen, time, inc, myColor);
    else findOnline(variant, time, inc);
  }

  render();
  root.append(h('section.setup.card', null, h('h1', null, 'New game'), tabs, body));
}

function hostFriend(variant: VariantKey, startFen: string, time: number, inc: number, myColor: Color) {
  const link = new Link();
  const status = h('p.muted', null, 'Creating your game…');
  const linkBox = h('div.linkbox');
  const close = modal(h('div', null, h('h2', null, 'Invite a friend'), status, linkBox,
    h('div.row.end', null, btn('Cancel', () => { link.destroy(); close(); }))), { dismissable: false });
  link.host().then(code => {
    const url = location.href.split('#')[0] + '#/join/' + code;
    status.textContent = 'Send this link to your friend. Waiting for them to join…';
    linkBox.append(h('input.link-input', { value: url, readOnly: true, onclick: (e: any) => e.target.select() }),
      h('div.row', null, btn(h('span', null, icon('copy'), 'Copy link'), () => copyText(url), 'primary'),
        (navigator as any).share ? btn(h('span', null, icon('share'), 'Share'), () => (navigator as any).share({ title: 'Play chess with me on Rookstorm', url }).catch(() => {})) : null),
      h('div.spinner-row', null, h('span.spinner'), 'Waiting…'));
  }).catch(() => { status.textContent = 'Could not reach the connection server. Check your internet connection and try again.'; });
  link.onMsg = (m) => {
    if (m.t === 'hello') {
      link.send({ t: 'start', variant, fen: startFen, time, inc, hostColor: myColor, name: settings.name || 'Friend' });
      close();
      startGame({ mode: 'friend', variant, startFen, time, inc, myColor, link, oppName: m.name || 'Friend', isHost: true });
    }
  };
}

function findOnline(variant: VariantKey, time: number, inc: number) {
  const link = new Link();
  const status = h('p', null, 'Connecting…');
  const close = modal(h('div.center', null, h('h2', null, 'Finding an opponent'),
    h('p.muted', null, `${variantInfo(variant).name} · ${tcLabel(time, inc)}`), h('div.spinner-row', null, h('span.spinner'), status),
    h('p.muted.small', null, 'Tip: ask a friend to search for the same variant and time control to play each other.'),
    h('div.row.center', null, btn('Cancel', () => { link.destroy(); close(); }))), { dismissable: false });
  const pool = `${variant}-${time}-${inc}`.replace('.', '_');
  link.matchmake(pool, s => { status.textContent = s; }).then(role => {
    if (role === 'host') {
      link.onMsg = (m) => {
        if (m.t === 'hello') {
          const myColor: Color = Math.random() < 0.5 ? 'white' : 'black';
          const fen = startFenFor(variant);
          link.send({ t: 'start', variant, fen, time, inc, hostColor: myColor, name: settings.name || 'Anonymous' });
          close();
          startGame({ mode: 'online', variant, startFen: fen, time, inc, myColor, link, oppName: m.name || 'Anonymous', isHost: true });
        }
      };
    } else {
      link.onMsg = (m) => {
        if (m.t === 'start') {
          close();
          startGame({ mode: 'online', variant: m.variant as VariantKey, startFen: m.fen, time: m.time, inc: m.inc, myColor: m.hostColor === 'white' ? 'black' : 'white', link, oppName: m.name || 'Anonymous' });
        }
      };
      link.send({ t: 'hello', name: settings.name || 'Anonymous', v: 1 });
    }
  }).catch((e) => { status.textContent = String(e?.message || 'Connection failed.'); });
}

export function joinPage(root: HTMLElement, code?: string) {
  if (!code) { go('play/friend'); return; }
  const status = h('p', null, 'Connecting to your friend…');
  root.append(h('section.card.setup.center', null, h('h1', null, 'Joining game'), h('div.spinner-row', null, h('span.spinner'), status),
    h('a.btn', { href: '#/play' }, 'Back')));
  const link = new Link();
  let started = false;
  link.onMsg = (m: Msg) => {
    if (m.t === 'start') {
      started = true;
      startGame({ mode: 'friend', variant: m.variant as VariantKey, startFen: m.fen, time: m.time, inc: m.inc, myColor: m.hostColor === 'white' ? 'black' : 'white', link, oppName: m.name || 'Friend' });
    } else if (m.t === 'busy') status.textContent = 'This game already has two players.';
  };
  link.join(code).then(() => link.send({ t: 'hello', name: settings.name || 'Friend', v: 1 }))
    .catch(() => { status.textContent = 'Could not connect. The link may have expired or your friend closed the page.'; });
  return () => { if (!started) link.destroy(); };
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
  /** Side c finished a move. */
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
  let alive = true;
  let botBusy = false;
  let viewPly: number | null = null; // when browsing history
  let drawOffered = false;
  let rematchAsked = false;
  const sessionId = Math.random();
  let gameToken = 0;

  const board = new Board({ orientation: cfg.myColor, onMove: (m) => onUserMove(m) });
  board.chess960 = cfg.variant === 'chess960';
  board.antichess = cfg.variant === 'antichess';
  board.movableColor = cfg.mode === 'local' ? 'both' : cfg.myColor;
  if (cfg.mode === 'local' && cfg.autoFlip) board.setOrientation('white');

  const topStrip = h('div.pstrip.top'), botStrip = h('div.pstrip.bottom');
  const moveList = h('div.movelist', { role: 'list' });
  const status = h('div.status');
  const actions = h('div.actions');
  const endBox = h('div.endbox');
  const chatLog = h('div.chat-log');
  const nav = h('div.navrow', null,
    iconBtn('first', 'First move', () => view(0)), iconBtn('prev', 'Previous move', () => view((viewPly ?? game.ply) - 1)),
    iconBtn('next', 'Next move', () => view((viewPly ?? game.ply) + 1)), iconBtn('last', 'Latest move', () => view(game.ply)),
    iconBtn('flip', 'Flip board', () => { board.flip(); renderStrips(); }));

  const side = h('aside.side.card', null,
    h('div.side-head', null, h('div', null, h('b', null, variantInfo(cfg.variant).name), h('span.muted', null, ' · ' + (cfg.time ? tcLabel(cfg.time, cfg.inc) : 'Unlimited') + ' · ' + modeName())), status),
    moveList, nav, endBox, actions,
    net ? h('div.chat', null, chatLog, h('form.chat-form', { onsubmit: (e: Event) => { e.preventDefault(); const inp = (e.target as HTMLFormElement).querySelector('input')!; const text = inp.value.trim().slice(0, 140); if (!text) return; cfg.link!.send({ t: 'chat', text }); addChat('You', text); inp.value = ''; } },
      h('input', { placeholder: 'Say something nice…', maxLength: 140, 'aria-label': 'Chat message' }), btn('Send', () => {}, 'small'))) : null);

  root.append(h('div.game-layout', null, h('div.board-col', null, topStrip, board.el, botStrip), side));

  function modeName() { return cfg!.mode === 'bot' ? 'vs computer' : cfg!.mode === 'local' ? 'same device' : cfg!.mode === 'friend' ? 'vs friend' : 'online'; }
  function addChat(who: string, text: string) { chatLog.append(h('div', null, h('b', null, who + ': '), text)); chatLog.scrollTop = chatLog.scrollHeight; }

  function nameOf(c: Color) {
    if (cfg!.mode === 'local') return c === 'white' ? 'White' : 'Black';
    return c === cfg!.myColor ? (settings.name || 'You') : cfg!.oppName;
  }

  const stripEls: Record<Color, { clock: HTMLElement; mat: HTMLElement; el: HTMLElement }> = {} as any;
  function buildStrip(c: Color) {
    const clockEl = h('div.clock', { 'aria-label': c + ' clock' });
    const mat = h('div.mat.cg-wrap.pc');
    const el = h('div.pinfo', null, h('span.cdot.' + c), h('div.pname', null, h('b', null, nameOf(c)), mat), clockEl);
    stripEls[c] = { clock: clockEl, mat, el };
    return el;
  }
  const wStrip = buildStrip('white'), bStrip = buildStrip('black');
  function renderStrips() {
    const top: Color = board.orientation === 'white' ? 'black' : 'white';
    topStrip.replaceChildren(top === 'white' ? wStrip : bStrip);
    botStrip.replaceChildren(top === 'white' ? bStrip : wStrip);
    const md = materialDiff(game.positions[viewPly ?? game.ply]);
    for (const c of ['white', 'black'] as Color[]) {
      const roles = c === 'white' ? md.white : md.black;
      const adv = c === 'white' ? md.score : -md.score;
      stripEls[c].mat.replaceChildren(...roles.map(r => h('piece', { class: `${r} ${c === 'white' ? 'black' : 'white'}` })), adv > 0 ? h('span.adv', null, '+' + adv) : '');
    }
    renderClocks();
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
    wStrip.classList.toggle('turn', !game.result && turn === 'white');
    bStrip.classList.toggle('turn', !game.result && turn === 'black');
  }

  let lowWarned: Record<Color, boolean> = { white: false, black: false };
  const timer = setInterval(() => {
    if (!alive || !clock.running || game.result) return;
    const c = clock.running;
    const ms = clock.now(c);
    if (ms <= 0) {
      clock.t[c] = 0; clock.stop();
      // In network games only the flagged player's side declares, but either side may detect it.
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
    if (!rows.length) moveList.append(h('div.muted.small.empty-moves', null, 'Moves will appear here.'));
    const curEl = moveList.querySelector('.cur') as HTMLElement | null;
    if (curEl && viewPly === null) moveList.scrollTop = moveList.scrollHeight;
    else curEl?.scrollIntoView({ block: 'nearest' });
  }

  function interactive() {
    if (game.result || viewPly !== null) return false;
    if (cfg!.mode === 'local') return true;
    return game.pos.turn === cfg!.myColor && !botBusy;
  }

  function sync(animMove = true) {
    const idx = viewPly ?? game.ply;
    const pos = game.positions[idx];
    const last = idx > 0 ? moveSquares(game.positions[idx - 1], game.moves[idx - 1]) : null;
    board.setPosition(pos, last, interactive());
    void animMove;
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
    if (cfg!.mode === 'local') status.textContent = (turn === 'white' ? 'White' : 'Black') + ' to move';
    else if (turn === cfg!.myColor) status.textContent = 'Your move';
    else status.textContent = cfg!.mode === 'bot' ? 'Stockfish is thinking…' : `Waiting for ${cfg!.oppName}…`;
    if (cfg!.variant === '3check' && game.pos.remainingChecks) {
      const rc = game.pos.remainingChecks;
      status.textContent += ` · checks left W ${rc.white} / B ${rc.black}`;
    }
  }

  function renderActions() {
    const a: HTMLElement[] = [];
    if (!game.result) {
      if (cfg!.mode === 'bot' || cfg!.mode === 'local') a.push(btn(h('span', null, icon('undo'), 'Takeback'), takeback, '', 'Take back a move'));
      if (cfg!.mode === 'bot' && game.pos.turn === cfg!.myColor && !botBusy) a.push(btn(h('span', null, icon('bulb'), 'Hint'), hint, '', 'Show a hint'));
      a.push(btn(h('span', null, icon('half'), drawOffered ? 'Draw offered' : 'Offer draw'), offerDraw, drawOffered ? 'disabled' : ''));
      a.push(btn(h('span', null, icon('flag'), 'Resign'), resign, 'danger'));
    }
    actions.replaceChildren(...a);
  }

  function renderEnd() {
    endBox.replaceChildren();
    if (!game.result) return;
    const o = game.result;
    const youWon = cfg!.mode !== 'local' && o.winner === cfg!.myColor;
    const youLost = cfg!.mode !== 'local' && o.winner && o.winner !== cfg!.myColor;
    endBox.append(h('div.result', { class: youWon ? 'win' : youLost ? 'loss' : 'draw' },
      h('div.big', null, o.winner === 'white' ? '1–0' : o.winner === 'black' ? '0–1' : '½–½'),
      h('div', null, cfg!.mode === 'local' ? outcomeText(o) : (youWon ? 'You won' : youLost ? 'You lost' : 'Draw') + ' · ' + o.reason)),
      h('div.row.wrap', null,
        variantInfo(cfg!.variant).bot ? btn(h('span', null, icon('chart'), 'Game review'), review, 'primary') : null,
        btn(h('span', null, icon('retry'), net ? (rematchAsked ? 'Rematch sent…' : 'Rematch') : 'Play again'), rematch),
        btn(h('span', null, icon('copy'), 'Copy PGN'), () => copyText(game.pgn(pgnHeaders()))),
        h('a.btn', { href: '#/play' }, 'New game')));
  }

  function pgnHeaders() {
    const w = nameOf('white'), b = nameOf('black');
    return { White: w, Black: b, TimeControl: cfg!.time ? `${cfg!.time * 60}+${cfg!.inc}` : '-' };
  }

  function review() {
    setAnalysisInput({ variant: cfg!.variant, startFen: game.startFen, ucis: game.ucis.slice(), orientation: cfg!.mode === 'local' ? 'white' : cfg!.myColor, white: nameOf('white'), black: nameOf('black'), autoReview: true });
    go('analysis');
  }

  function finish(o: Outcome) {
    if (game.result && game.result !== o && game.result.reason !== o.reason) { /* already finished */ }
    game.end(o);
    clock.stop();
    engine.stop();
    botBusy = false;
    setLeaveGuard(null);
    sound.end();
    sync();
    renderEnd();
    saveHistory();
  }

  function saveHistory() {
    if (game.ply < 2) return;
    const hist = loadRaw('history', [] as any[]);
    hist.unshift({ d: Date.now(), mode: cfg!.mode, variant: cfg!.variant, fen: game.startFen, ucis: game.ucis, w: nameOf('white'), b: nameOf('black'), r: game.result ? (game.result.winner || 'draw') : '*', reason: game.result?.reason });
    save('history', hist.slice(0, 30));
  }

  function afterMove(byColor: Color, remoteClock?: number) {
    const ply = game.ply;
    clock.press(byColor, ply >= 2);
    if (remoteClock !== undefined && clock.enabled) clock.t[byColor] = remoteClock;
    if (game.result) { finish(game.result); return; }
    // Clock starts after White's first move.
    if (ply >= 1) clock.start(game.pos.turn);
    drawOffered = false;
    if (cfg!.mode === 'local' && cfg!.autoFlip) board.setOrientation(game.pos.turn);
    setLeaveGuard(game.ply >= 1 && !game.result ? () => confirm('Leave this game? It will be lost.') : null);
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
    let count = 0;
    for (const [, d] of pos.allDests()) count += d.size();
    let uci: string | null = null;
    try { uci = await botMove(fenOf(pos), cfg!.elo!, game.chess960, count, clock.enabled ? clock.now(pos.turn) / 25 + clock.inc * 0.6 : 0); }
    catch { toast('The engine failed to load.'); botBusy = false; return; }
    if (!alive || token !== gameToken || game.result || game.pos !== pos) return;
    // Natural minimum thinking time
    const minT = cfg!.time && cfg!.time <= 2 ? 150 : 450;
    const spent = performance.now() - t0;
    if (spent < minT) await new Promise(r => setTimeout(r, minT - spent));
    if (!alive || token !== gameToken || game.result || game.pos !== pos) return;
    const m = uci ? uciToMove(pos, uci) : undefined;
    botBusy = false;
    if (!m) { // engine returned nothing (no legal moves) — outcome should be set already
      sync(); return;
    }
    const mover = pos.turn;
    game.play(m);
    board.showMove(pos, m, game.pos, false);
    afterMove(mover);
    sync();
  }

  function takeback() {
    if (game.result || !game.ply) return;
    gameToken++; engine.stop(); botBusy = false;
    if (cfg!.mode === 'bot') {
      const n = game.pos.turn === cfg!.myColor ? 2 : 1;
      if (game.ply < n) { game.undo(game.ply); } else game.undo(n);
    } else game.undo(1);
    viewPly = null;
    if (cfg!.mode === 'local' && cfg!.autoFlip) board.setOrientation(game.pos.turn);
    clock.stop();
    if (game.ply >= 1) clock.start(game.pos.turn);
    sync();
    if (cfg!.mode === 'bot' && game.pos.turn !== cfg!.myColor) botTurn();
  }

  async function hint() {
    const r = await engine.analyse({ fen: fenOf(game.pos), depth: 14, chess960: game.chess960, multipv: 1 });
    if (!r || !alive) return;
    const m = uciToMove(game.pos, r.bestmove);
    const s = m && moveSquares(game.pos, m);
    if (s) { board.arrows([{ orig: s[0] as any, brush: 'blue' }, { orig: s[0] as any, dest: s[1] as any, brush: 'blue' }]); setTimeout(() => board.arrows([]), 3500); }
  }

  async function offerDraw() {
    if (game.result || drawOffered) return;
    if (cfg!.mode === 'local') { if (confirm('Agree to a draw?')) finish({ reason: 'agreement' }); return; }
    if (cfg!.mode === 'bot') {
      if (game.ply < 20) { toast('Stockfish declines: too early for a draw.'); return; }
      drawOffered = true; renderActions();
      const r = await engine.analyse({ fen: fenOf(game.pos), depth: 12, chess960: game.chess960 });
      drawOffered = false;
      if (!r || !alive || game.result) { renderActions(); return; }
      const cp = whiteCp(r.lines[0], game.pos.turn);
      const botView = cfg!.myColor === 'white' ? -cp : cp;
      if (botView < 40) { finish({ reason: 'agreement' }); toast('Stockfish accepts the draw.'); }
      else { toast('Stockfish declines the draw.'); renderActions(); if (game.pos.turn !== cfg!.myColor) botTurn(); }
      return;
    }
    drawOffered = true; cfg!.link!.send({ t: 'draw-offer' }); toast('Draw offer sent'); renderActions();
  }

  function resign() {
    if (game.result) return;
    if (!confirm('Resign this game?')) return;
    const loser: Color = cfg!.mode === 'local' ? game.pos.turn : cfg!.myColor;
    if (net) cfg!.link!.send({ t: 'resign' });
    finish({ winner: loser === 'white' ? 'black' : 'white', reason: (loser === 'white' ? 'White' : 'Black') + ' resigned' });
  }

  function resetGame(newCfg: Partial<GameConfig>) {
    Object.assign(cfg!, newCfg);
    gameToken++; engine.stop(); engine.newGame();
    game = new Game(cfg!.variant, cfg!.startFen);
    clock = new Clock(cfg!.time * 60000, cfg!.inc * 1000);
    lowWarned = { white: false, black: false };
    viewPly = null; drawOffered = false; rematchAsked = false; botBusy = false;
    board.movableColor = cfg!.mode === 'local' ? 'both' : cfg!.myColor;
    board.setOrientation(cfg!.mode === 'local' ? 'white' : cfg!.myColor);
    board.arrows([]);
    endBox.replaceChildren();
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
        case 'move': {
          if (game.result) return;
          if (m.ply !== game.ply + 1) return; // duplicate/out-of-order
          if (game.pos.turn === cfg.myColor) return;
          const prev = game.pos, mover = prev.turn;
          const mv = uciToMove(prev, m.uci);
          if (!mv || !game.play(mv)) return;
          if (viewPly === null) board.showMove(prev, mv, game.pos);
          else playSoundOnly();
          afterMove(mover, m.clock);
          sync();
          break;
        }
        case 'resign': finish({ winner: cfg.myColor, reason: nameOf(cfg.myColor === 'white' ? 'black' : 'white') + ' resigned' }); break;
        case 'flag': if (!game.result) { clock.t[m.color] = 0; finish({ winner: m.color === 'white' ? 'black' : 'white', reason: 'time out' }); } break;
        case 'draw-offer':
          if (game.result) return;
          { const box = h('div.offer', null, `${cfg.oppName} offers a draw.`,
            btn('Accept', () => { link.send({ t: 'draw-accept' }); finish({ reason: 'agreement' }); box.remove(); }, 'primary small'),
            btn('Decline', () => { link.send({ t: 'draw-decline' }); box.remove(); }, 'small'));
          endBox.before(box); }
          break;
        case 'draw-accept': if (drawOffered) finish({ reason: 'agreement' }); break;
        case 'draw-decline': drawOffered = false; toast('Draw declined'); renderActions(); break;
        case 'chat': addChat(cfg.oppName, String(m.text).slice(0, 140)); break;
        case 'rematch':
          if (!game.result) return;
          if (rematchAsked) { /* both asked */ doRematch(); link.send({ t: 'rematch-accept' }); }
          else {
            const box = h('div.offer', null, `${cfg.oppName} wants a rematch.`,
              btn('Accept', () => { link.send({ t: 'rematch-accept' }); box.remove(); doRematch(); }, 'primary small'));
            endBox.before(box);
          }
          break;
        case 'rematch-accept': if (game.result) doRematch(); break;
        case 'leave': if (!game.result) { toast(`${cfg.oppName} left the game.`); finish({ winner: cfg.myColor, reason: 'opponent left' }); } else toast(`${cfg.oppName} left.`); break;
      }
    };
    link.onClose = () => { if (alive && !game.result) { toast('Connection lost.'); finish({ winner: cfg.myColor, reason: 'opponent disconnected' }); } };
    // Heartbeat: detect a silently closed tab or dropped network.
    const inner = link.onMsg;
    link.onMsg = (m: Msg) => { lastSeen = Date.now(); if (m.t !== 'ping') inner(m); };
    heartbeat = setInterval(() => {
      link.send({ t: 'ping' });
      if (alive && !game.result && Date.now() - lastSeen > 45000) { toast('Opponent connection lost.'); finish({ winner: cfg.myColor, reason: 'opponent disconnected' }); }
    }, 4000);
    window.addEventListener('pagehide', onHide);
  }
  function onHide() { cfg!.link?.send({ t: 'leave' }); }
  function playSoundOnly() { sound.move(); }
  let rematchCount = 0;
  function doRematch() {
    if (!game.result) return;
    rematchCount++;
    // Colors swap; the original host decides the start position deterministically.
    const newColor: Color = cfg!.myColor === 'white' ? 'black' : 'white';
    const fen = cfg!.variant === 'chess960' ? fixed960(rematchCount) : cfg!.startFen;
    resetGame({ myColor: newColor, startFen: fen });
    document.querySelectorAll('.offer').forEach(e => e.remove());
  }
  function fixed960(n: number) {
    // Both peers must agree on the same 960 position without extra messages: derive from the original fen + count.
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
  };
  document.addEventListener('keydown', keys);

  sync();
  engine.newGame();
  if (cfg.mode === 'bot') { engine.ready().catch(() => toast('Engine could not start in this browser.')); if (game.pos.turn !== cfg.myColor) botTurn(); }
  if (net) toast(`Game on! You play ${cfg.myColor}.`);
  void sessionId; void posFromFen; void engineUci;

  return () => {
    alive = false;
    clearInterval(timer);
    engine.stop();
    document.removeEventListener('keydown', keys);
    setLeaveGuard(null);
    if (net) { clearInterval(heartbeat); window.removeEventListener('pagehide', onHide); cfg.link!.destroy(); }
    board.destroy();
  };
}

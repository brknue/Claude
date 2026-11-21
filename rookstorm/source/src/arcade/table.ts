/**
 * Party table: the host's browser runs the game; up to 3 friends (plus spectators) connect to it
 * over WebRTC. Players pick a seat in the lobby; empty seats can be given to the computer.
 */
import Peer, { DataConnection } from 'peerjs';
import { PREFIX, PEER_OPTS, CONN_OPTS } from '../net';
import { Variant, State, Move, partyVariant, newState, applyMove, placeDuck, resign, fogView, cooldownMs } from './rules';
import { botMove, botDuck } from './bot';
import { t } from '../i18n';

export interface Seat { kind: 'empty' | 'human' | 'bot'; name: string; cid?: string; away?: boolean }
export interface Lobby { code: string; variant: string; speed: string; seats: Seat[]; phase: 'lobby' | 'game'; host: string; round: number }

type ToHost = { t: 'hello'; cid: string; name: string } | { t: 'sit'; seat: number } | { t: 'stand' } | { t: 'move'; m: Move } | { t: 'duck'; sq: number } | { t: 'resign' } | { t: 'ping' };
type ToGuest = { t: 'lobby'; lobby: Lobby } | { t: 'state'; st: State; now: number } | { t: 'closed' } | { t: 'ping' };

export function clientId(): string {
  try {
    let id = sessionStorage.getItem('rs.cid');
    if (!id) { id = Math.random().toString(36).slice(2, 12); sessionStorage.setItem('rs.cid', id); }
    return id;
  } catch { return Math.random().toString(36).slice(2, 12); }
}
const rid = () => Math.random().toString(36).slice(2, 10);

/** What the table page talks to, for host and guests alike. */
export interface TableClient {
  isHost: boolean; myCid: string; code: string;
  lobby: Lobby | null; st: State | null; hostNow: number; status: string;
  onChange: () => void;
  mySeat(): number | null;
  sit(seat: number): void; stand(): void; move(m: Move): void; duck(sq: number): void; resign(): void; leave(): void;
  // host only
  setSeat?(seat: number, kind: 'bot' | 'empty'): void; start?(): void; toLobby?(): void; configure?(variant: string, speed: string): void;
}

export class TableHost implements TableClient {
  isHost = true; myCid = clientId(); code = '';
  lobby: Lobby; st: State | null = null; hostNow = Date.now(); status = '';
  onChange: () => void = () => {};
  private v: Variant;
  private peer: Peer | null = null;
  private conns = new Map<string, DataConnection>(); // cid -> connection
  private botTimer: any = 0;
  private botNext: number[] = [];
  private closed = false;
  private keep: any = 0;

  constructor(variant: string, speed: string, private myName: string, public online: boolean) {
    this.v = partyVariant(variant);
    this.lobby = { code: '', variant, speed, seats: this.emptySeats(), phase: 'lobby', host: this.myCid, round: 0 };
    this.lobby.seats[0] = { kind: 'human', name: myName, cid: this.myCid };
    if (!online) for (let i = 1; i < this.lobby.seats.length; i++) this.lobby.seats[i] = { kind: 'bot', name: '' };
  }
  private emptySeats(): Seat[] { return Array.from({ length: this.v.players }, () => ({ kind: 'empty' as const, name: '' })); }

  open(): Promise<string> {
    if (!this.online) { this.code = this.lobby.code = 'local'; return Promise.resolve('local'); }
    return new Promise((resolve, reject) => {
      const code = rid();
      const peer = new Peer(PREFIX + 't-' + code, PEER_OPTS);
      this.peer = peer;
      let opened = false;
      peer.on('open', () => { if (!opened) { opened = true; this.code = this.lobby.code = code; resolve(code); } });
      peer.on('error', (e: any) => { if (!opened) reject(e); });
      peer.on('connection', (c) => this.accept(c));
      peer.on('disconnected', () => setTimeout(() => { if (!this.closed && !peer.destroyed && peer.disconnected) try { peer.reconnect(); } catch { /* */ } }, 800));
      this.keep = setInterval(() => { if (!this.closed && peer.disconnected && !peer.destroyed) try { peer.reconnect(); } catch { /* */ } this.send({ t: 'ping' }); }, 5000);
    });
  }

  private accept(c: DataConnection) {
    let cid = '';
    c.on('data', (d: any) => {
      if (!d || typeof d.t !== 'string') return;
      if (d.t === 'hello') {
        cid = String(d.cid || rid()).slice(0, 20);
        if (this.conns.size >= 16 && !this.conns.has(cid)) { c.close(); return; }
        this.conns.get(cid)?.close();
        this.conns.set(cid, c);
        this.names.set(cid, String(d.name || '').slice(0, 20));
        const seat = this.lobby.seats.find(s => s.cid === cid);
        if (seat) { seat.away = false; seat.name = String(d.name || seat.name).slice(0, 20); }
        this.pushAll();
        return;
      }
      if (cid) this.handle(cid, d as ToHost);
    });
    c.on('close', () => {
      if (!cid || this.conns.get(cid) !== c) return;
      this.conns.delete(cid);
      const seat = this.lobby.seats.find(s => s.cid === cid);
      if (seat) {
        if (this.lobby.phase === 'lobby') { seat.kind = 'empty'; seat.name = ''; seat.cid = undefined; }
        else seat.away = true;
      }
      this.pushAll();
    });
  }

  private seatOf(cid: string) { const i = this.lobby.seats.findIndex(s => s.kind === 'human' && s.cid === cid); return i >= 0 ? i : null; }
  mySeat() { return this.seatOf(this.myCid); }

  private handle(cid: string, m: ToHost, name?: string) {
    const L = this.lobby;
    switch (m.t) {
      case 'sit': {
        if (L.phase !== 'lobby' || m.seat < 0 || m.seat >= L.seats.length || L.seats[m.seat].kind === 'human') return;
        const old = this.seatOf(cid);
        if (old !== null) L.seats[old] = { kind: 'empty', name: '' };
        const nm = name || this.nameOf(cid);
        L.seats[m.seat] = { kind: 'human', name: nm, cid };
        break;
      }
      case 'stand': {
        if (L.phase !== 'lobby') return;
        const s = this.seatOf(cid); if (s !== null) L.seats[s] = { kind: 'empty', name: '' };
        break;
      }
      case 'move': case 'duck': case 'resign': {
        const s = this.seatOf(cid);
        if (s === null || !this.st || L.phase !== 'game') return;
        this.act(s, m);
        return;
      }
      default: return;
    }
    this.pushAll();
  }
  private names = new Map<string, string>();
  private nameOf(cid: string) { return this.names.get(cid) || this.lobby.seats.find(s => s.cid === cid)?.name || ''; }

  private act(seat: number, m: ToHost): boolean {
    const st = this.st!; const now = Date.now();
    let ok = false;
    if (m.t === 'move') ok = applyMove(this.v, st, seat, m.m, now, cooldownMs(this.lobby.speed));
    else if (m.t === 'duck') ok = placeDuck(this.v, st, seat, m.sq);
    else if (m.t === 'resign') { resign(this.v, st, seat); ok = true; }
    if (ok) { this.pushState(); this.scheduleBots(); }
    return ok;
  }

  // ---- local (host's own) actions ----
  sit(seat: number) { this.names.set(this.myCid, this.myName); this.handle(this.myCid, { t: 'sit', seat }, this.myName); }
  stand() { this.handle(this.myCid, { t: 'stand' }); }
  move(m: Move) { const s = this.mySeat(); if (s !== null && this.st) this.act(s, { t: 'move', m }); }
  duck(sq: number) { const s = this.mySeat(); if (s !== null && this.st) this.act(s, { t: 'duck', sq }); }
  resign() { const s = this.mySeat(); if (s !== null && this.st) this.act(s, { t: 'resign' }); }

  setSeat(seat: number, kind: 'bot' | 'empty') {
    const s = this.lobby.seats[seat];
    if (!s || (s.kind === 'human' && s.cid === this.myCid)) return;
    if (this.lobby.phase === 'game') { if (kind === 'bot' && s.kind === 'human') { this.lobby.seats[seat] = { kind: 'bot', name: '' }; this.pushAll(); this.scheduleBots(); } return; }
    this.lobby.seats[seat] = { kind, name: '' };
    this.pushAll();
  }
  configure(variant: string, speed: string) {
    if (this.lobby.phase !== 'lobby') return;
    const v = partyVariant(variant);
    if (v.players !== this.v.players) {
      const old = this.lobby.seats;
      const seats = Array.from({ length: v.players }, (_, i) => old[i] || { kind: 'empty' as const, name: '' });
      // keep seated humans that would fall off the table
      old.slice(v.players).forEach(s => { if (s.kind === 'human') { const free = seats.findIndex(x => x.kind !== 'human'); if (free >= 0) seats[free] = s; } });
      this.lobby.seats = seats;
    }
    this.v = v; this.lobby.variant = variant; this.lobby.speed = speed;
    this.pushAll();
  }
  start() {
    if (this.lobby.seats.some(s => s.kind === 'empty')) return;
    this.st = newState(this.v, this.lobby.speed);
    this.lobby.phase = 'game'; this.lobby.round++;
    this.botNext = this.lobby.seats.map(() => Date.now() + 1500 + Math.random() * 1500);
    this.pushAll();
    this.scheduleBots();
  }
  toLobby() {
    this.lobby.phase = 'lobby'; this.st = null;
    clearInterval(this.botTimer); clearTimeout(this.botTimer); this.botTimer = 0;
    this.lobby.seats.forEach((s, i) => { if (s.kind === 'human' && s.away) this.lobby.seats[i] = { kind: 'empty', name: '' }; });
    this.pushAll();
  }
  leave() {
    this.closed = true;
    clearInterval(this.botTimer); clearTimeout(this.botTimer); clearInterval(this.keep);
    this.send({ t: 'closed' });
    setTimeout(() => { try { this.conns.forEach(c => c.close()); this.peer?.destroy(); } catch { /* */ } }, 100);
  }

  // ---- computer players ----
  private scheduleBots() {
    const st = this.st;
    if (!st || st.over || this.closed) { clearInterval(this.botTimer); clearTimeout(this.botTimer); this.botTimer = 0; return; }
    if (this.v.realtime) {
      if (this.botTimer) return;
      this.botTimer = setInterval(() => this.realtimeBots(), 200);
      return;
    }
    clearTimeout(this.botTimer);
    const seat = this.lobby.seats[st.turn];
    if (!seat || seat.kind !== 'bot') return;
    const turn = st.turn, ply = st.ply;
    this.botTimer = setTimeout(() => {
      if (!this.st || this.st.over || this.st.turn !== turn || this.st.ply !== ply && !this.st.duckPending) return;
      if (this.v.duck && this.st.duckPending) { this.act(turn, { t: 'duck', sq: botDuck(this.v, this.st, turn) }); return; }
      const m = botMove(this.v, this.st, turn);
      if (m) this.act(turn, { t: 'move', m });
    }, 450 + Math.random() * 500);
  }
  private realtimeBots() {
    const st = this.st;
    if (!st || st.over) { clearInterval(this.botTimer); this.botTimer = 0; return; }
    const now = Date.now(), cd = cooldownMs(this.lobby.speed);
    this.lobby.seats.forEach((s, i) => {
      if (s.kind !== 'bot' || !st.alive[i] || now < this.botNext[i]) return;
      const m = botMove(this.v, st, i, now);
      this.botNext[i] = now + Math.min(2600, 500 + cd * 0.35 + Math.random() * 900);
      if (m) this.act(i, { t: 'move', m });
    });
  }

  // ---- sending ----
  private send(msg: ToGuest, only?: string) {
    this.conns.forEach((c, cid) => { if ((!only || only === cid) && c.open) try { c.send(msg); } catch { /* */ } });
  }
  private pushState() {
    if (!this.st) return;
    this.hostNow = Date.now();
    this.conns.forEach((c, cid) => {
      if (!c.open) return;
      const seat = this.seatOf(cid);
      try { c.send({ t: 'state', st: fogView(this.v, this.st!, seat), now: this.hostNow }); } catch { /* */ }
    });
    this.onChange();
  }
  private pushAll() {
    this.send({ t: 'lobby', lobby: this.lobby });
    if (this.st) this.pushState(); else this.onChange();
  }
}

export class TableGuest implements TableClient {
  isHost = false; myCid = clientId();
  lobby: Lobby | null = null; st: State | null = null; hostNow = Date.now(); status = t('Connecting to the table…');
  onChange: () => void = () => {};
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private closed = false;
  private lastSeen = 0;
  private iv: any = 0;

  constructor(public code: string, private myName: string) {}

  connect(onStatus: (s: string) => void) {
    const peer = new Peer(PEER_OPTS);
    this.peer = peer;
    const target = PREFIX + 't-' + this.code;
    const attempt = () => {
      if (this.closed) return;
      if (peer.disconnected) { try { peer.reconnect(); } catch { /* */ } setTimeout(attempt, 1500); return; }
      const c = peer.connect(target, CONN_OPTS);
      let ok = false;
      const to = setTimeout(() => { if (!ok) { try { c.close(); } catch { /* */ } setTimeout(attempt, 1000); } }, 9000);
      c.on('open', () => {
        ok = true; clearTimeout(to);
        this.conn = c; this.lastSeen = Date.now();
        c.send({ t: 'hello', cid: this.myCid, name: this.myName });
      });
      c.on('data', (d: any) => this.recv(d));
      c.on('close', () => { if (this.conn === c && !this.closed) { this.conn = null; this.status = t('Connection lost — reconnecting…'); onStatus(this.status); this.onChange(); setTimeout(attempt, 1200); } });
    };
    peer.on('open', attempt);
    peer.on('error', (e: any) => {
      if (this.closed) return;
      if (e?.type === 'peer-unavailable') { this.status = t('Waiting for the host’s device… (keep their Rookstorm tab open)'); onStatus(this.status); setTimeout(attempt, 2500); }
      else if (e?.type === 'browser-incompatible') { this.status = t('This browser does not support peer-to-peer connections.'); onStatus(this.status); }
      else setTimeout(attempt, 3000);
    });
    this.iv = setInterval(() => {
      if (this.conn?.open) try { this.conn.send({ t: 'ping' }); } catch { /* */ }
      if (this.conn && Date.now() - this.lastSeen > 30000) { try { this.conn.close(); } catch { /* */ } }
    }, 5000);
  }

  private recv(d: any) {
    if (!d || typeof d.t !== 'string') return;
    this.lastSeen = Date.now();
    const m = d as ToGuest;
    if (m.t === 'lobby') { this.lobby = m.lobby; if (m.lobby.phase === 'lobby') this.st = null; this.status = ''; }
    else if (m.t === 'state') { this.st = m.st; this.hostNow = m.now; }
    else if (m.t === 'closed') { this.status = t('The host closed the table.'); this.lobby = null; this.st = null; }
    else return;
    this.onChange();
  }

  mySeat() { if (!this.lobby) return null; const i = this.lobby.seats.findIndex(s => s.kind === 'human' && s.cid === this.myCid); return i >= 0 ? i : null; }
  private send(m: ToHost) { if (this.conn?.open) try { this.conn.send(m); } catch { /* */ } }
  sit(seat: number) { this.send({ t: 'sit', seat }); }
  stand() { this.send({ t: 'stand' }); }
  move(m: Move) { this.send({ t: 'move', m }); }
  duck(sq: number) { this.send({ t: 'duck', sq }); }
  resign() { this.send({ t: 'resign' }); }
  leave() { this.closed = true; clearInterval(this.iv); try { this.conn?.close(); this.peer?.destroy(); } catch { /* */ } }
}

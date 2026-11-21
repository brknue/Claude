/**
 * Serverless multiplayer over WebRTC (PeerJS public signalling server).
 * - Friend link: host registers a random peer id and shares #/join/<id>.
 * - Online matchmaking: players race to claim a well-known lobby id per pool;
 *   the one who gets it waits, the next one connects to it, then the lobby id is released.
 */
import Peer, { DataConnection } from 'peerjs';
import { t } from './i18n';

export type Msg =
  | { t: 'hello'; name: string; v: number; uid?: string; rating?: number }
  | { t: 'start'; variant: string; fen: string; time: number; inc: number; hostColor: 'white' | 'black'; name: string; uid?: string; rating?: number; rated?: boolean }
  | { t: 'gid'; id: string } | { t: 'gid-ok'; rated: boolean }
  | { t: 'move'; uci: string; clock?: number; ply: number }
  | { t: 'resign' } | { t: 'draw-offer' } | { t: 'draw-accept' } | { t: 'draw-decline' }
  | { t: 'flag'; color: 'white' | 'black' } | { t: 'rematch' } | { t: 'rematch-accept' }
  | { t: 'takeback-offer'; ply: number } | { t: 'takeback-accept'; ply: number } | { t: 'takeback-decline' }
  | { t: 'resume'; ucis: string[]; reply?: boolean }
  | { t: 'chat'; text: string } | { t: 'busy' } | { t: 'ping' } | { t: 'leave' };

const PREFIX = 'rookstorm-v1-';
/** Several STUN servers plus PeerJS's TURN relay, so phones on mobile data / strict Wi-Fi can still connect. */
const PEER_OPTS = {
  debug: 0,
  config: {
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
    ],
  },
};
const CONN_OPTS = { reliable: true, serialization: 'json' as const };
export const cleanCode = (c: string) => c.trim().toLowerCase().replace(/^.*#\/join\//, '').replace(/[^a-z0-9]/g, '').slice(0, 16);
const rid = () => Math.random().toString(36).slice(2, 10);

export class Link {
  peer: Peer | null = null;
  conn: DataConnection | null = null;
  onMsg: (m: Msg) => void = () => {};
  onOpen: () => void = () => {};
  onClose: () => void = () => {};
  closed = false;

  private bind(conn: DataConnection) {
    this.conn = conn;
    conn.on('data', (d: any) => { if (d && typeof d === 'object' && typeof d.t === 'string') this.onMsg(d as Msg); });
    conn.on('close', () => { if (!this.closed && this.conn === conn) this.onClose(); });
    conn.on('error', () => { if (!this.closed && this.conn === conn) this.onClose(); });
    if (conn.open) this.onOpen(); else conn.on('open', () => this.onOpen());
  }

  send(m: Msg) { try { if (this.conn?.open) this.conn.send(m); } catch { /* ignore */ } }

  destroy() {
    this.closed = true;
    this.cleanupFns.forEach(f => f()); this.cleanupFns = [];
    try { this.send({ t: 'leave' }); } catch { /* */ }
    setTimeout(() => { try { this.conn?.close(); this.peer?.destroy(); } catch { /* */ } }, 50);
  }

  /** Keep the signalling connection alive: iOS/Android drop it when the browser goes to the background. */
  private keepAlive(peer: Peer) {
    const revive = () => { if (!this.closed && !peer.destroyed && peer.disconnected) { try { peer.reconnect(); } catch { /* retry later */ } } };
    peer.on('disconnected', () => setTimeout(revive, 800));
    const onVis = () => { if (document.visibilityState === 'visible') revive(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', revive);
    window.addEventListener('focus', revive);
    const iv = setInterval(revive, 5000);
    const prevDestroy = this.cleanupFns;
    prevDestroy.push(() => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('online', revive); window.removeEventListener('focus', revive); clearInterval(iv); });
  }
  private cleanupFns: (() => void)[] = [];
  private target = '';

  /** Host a private game. Resolves with the shareable code once registered. Pass a code to re-host after a reload. */
  host(existing?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const code = existing || rid();
      let opened = false;
      const peer = new Peer(PREFIX + 'g-' + code, PEER_OPTS);
      this.peer = peer;
      this.keepAlive(peer);
      peer.on('open', () => { if (!opened) { opened = true; resolve(code); } });
      peer.on('error', (e: any) => {
        if (opened) return; // later errors (network blips) are handled by keepAlive
        if (e?.type === 'unavailable-id' && existing) { setTimeout(() => { try { peer.reconnect(); } catch { /* */ } }, 2500); return; }
        reject(e);
      });
      peer.on('connection', (c) => {
        // Accept a reconnecting friend if the previous channel is gone.
        if (this.conn && this.conn.open) { c.on('open', () => { c.send({ t: 'busy' }); setTimeout(() => c.close(), 300); }); return; }
        this.bind(c);
      });
    });
  }

  /** Join a friend's game by code. Keeps retrying (the host's device may be busy sharing the link). */
  join(code: string, onStatus: (s: string) => void = () => {}, maxMs = 120000): Promise<void> {
    this.target = PREFIX + 'g-' + code;
    return new Promise((resolve, reject) => {
      const peer = new Peer(PEER_OPTS);
      this.peer = peer;
      this.keepAlive(peer);
      const t0 = Date.now();
      let done = false;
      const fail = (msg: string) => { if (!done) { done = true; reject(new Error(msg)); } };
      const attempt = () => {
        if (done || this.closed) return;
        if (Date.now() - t0 > maxMs) { fail('timeout'); return; }
        if (peer.disconnected) { setTimeout(attempt, 1500); return; }
        const c = peer.connect(this.target, CONN_OPTS);
        let ok = false;
        const to = setTimeout(() => { if (!ok) { try { c.close(); } catch { /* */ } onStatus(t('Waiting for your friend’s device…')); setTimeout(attempt, 1000); } }, 9000);
        c.on('open', () => {
          ok = true; clearTimeout(to);
          if (done) return;
          done = true;
          this.bind(c);
          resolve();
        });
      };
      peer.on('open', () => attempt());
      peer.on('error', (e: any) => {
        if (done) return;
        if (e?.type === 'peer-unavailable') { onStatus(t('Waiting for your friend’s device… (keep their Rookstorm tab open)')); setTimeout(attempt, 2500); }
        else if (['network', 'server-error', 'socket-error', 'socket-closed', 'disconnected'].includes(e?.type)) { onStatus(t('Connection problem, retrying…')); setTimeout(attempt, 3000); }
        else if (e?.type === 'browser-incompatible') fail(t('This browser does not support peer-to-peer connections.'));
        else { setTimeout(attempt, 3000); }
      });
    });
  }

  /** Guest: reconnect to the same host after the channel dropped. */
  rejoin(maxMs = 40000): Promise<void> {
    const peer = this.peer;
    if (!peer || !this.target) return Promise.reject(new Error('no target'));
    return new Promise((resolve, reject) => {
      const t0 = Date.now();
      const attempt = () => {
        if (this.closed) return;
        if (Date.now() - t0 > maxMs) { reject(new Error('timeout')); return; }
        if (peer.disconnected) { try { peer.reconnect(); } catch { /* */ } setTimeout(attempt, 1500); return; }
        const c = peer.connect(this.target, CONN_OPTS);
        let ok = false;
        const to = setTimeout(() => { if (!ok) { try { c.close(); } catch { /* */ } attempt(); } }, 6000);
        c.on('open', () => { ok = true; clearTimeout(to); this.bind(c); resolve(); });
      };
      attempt();
    });
  }

  /** Online matchmaking in a pool. Resolves with 'host' | 'guest' once paired. */
  matchmake(pool: string, onStatus: (s: string) => void): Promise<'host' | 'guest'> {
    const lobby = PREFIX + 'lobby-' + pool.replace(/[^a-z0-9-]/gi, '');
    return new Promise((resolve, reject) => {
      let finished = false;
      const attempt = (n: number) => {
        if (this.closed || finished) return;
        if (n > 12) { reject(new Error(t('Could not reach the matchmaking server.'))); return; }
        onStatus(t('Looking for an opponent…'));
        const p = new Peer(lobby, PEER_OPTS);
        this.peer = p;
        p.on('open', () => {
          onStatus(t('Waiting for an opponent to join…'));
          p.on('connection', (c) => {
            if (this.conn || finished) { c.on('open', () => { c.send({ t: 'busy' }); setTimeout(() => c.close(), 200); }); return; }
            finished = true;
            this.bind(c);
            const release = () => { try { p.disconnect(); } catch { /* */ } };
            if (c.open) release(); else c.on('open', release);
            resolve('host');
          });
        });
        p.on('error', (e: any) => {
          if (finished) return;
          if (e?.type === 'unavailable-id') {
            p.destroy();
            const g = new Peer(PEER_OPTS);
            this.peer = g;
            g.on('open', () => {
              const c = g.connect(lobby, CONN_OPTS);
              let opened = false;
              const to = setTimeout(() => { if (!opened && !finished) { this.conn = null; try { g.destroy(); } catch { /* */ } attempt(n + 1); } }, 8000);
              c.on('open', () => { opened = true; clearTimeout(to); });
              c.on('data', (d: any) => {
                if (d?.t === 'busy' && !finished) { clearTimeout(to); this.conn = null; try { g.destroy(); } catch { /* */ } setTimeout(() => attempt(n + 1), 300 + Math.random() * 900); }
              });
              const prevOpen = this.onOpen;
              this.onOpen = () => { this.onOpen = prevOpen; };
              this.bind(c);
              c.on('open', () => {
                // Give the host a moment to send 'busy' if it was taken.
                setTimeout(() => { if (!finished && c.open) { finished = true; resolve('guest'); } }, 400);
              });
            });
            g.on('error', (e2: any) => {
              if (finished) return;
              try { g.destroy(); } catch { /* */ }
              this.conn = null;
              setTimeout(() => attempt(n + 1), e2?.type === 'peer-unavailable' ? 200 + Math.random() * 600 : 1500);
            });
          } else {
            try { p.destroy(); } catch { /* */ }
            setTimeout(() => attempt(n + 1), 1500 + Math.random() * 1000);
          }
        });
      };
      attempt(0);
    });
  }
}

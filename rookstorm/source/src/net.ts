/**
 * Serverless multiplayer over WebRTC (PeerJS public signalling server).
 * - Friend link: host registers a random peer id and shares #/join/<id>.
 * - Online matchmaking: players race to claim a well-known lobby id per pool;
 *   the one who gets it waits, the next one connects to it, then the lobby id is released.
 */
import Peer, { DataConnection } from 'peerjs';

export type Msg =
  | { t: 'hello'; name: string; v: number }
  | { t: 'start'; variant: string; fen: string; time: number; inc: number; hostColor: 'white' | 'black'; name: string }
  | { t: 'move'; uci: string; clock?: number; ply: number }
  | { t: 'resign' } | { t: 'draw-offer' } | { t: 'draw-accept' } | { t: 'draw-decline' }
  | { t: 'flag'; color: 'white' | 'black' } | { t: 'rematch' } | { t: 'rematch-accept' }
  | { t: 'chat'; text: string } | { t: 'busy' } | { t: 'ping' } | { t: 'leave' };

const PREFIX = 'rookstorm-v1-';
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
    conn.on('close', () => { if (!this.closed) this.onClose(); });
    conn.on('error', () => { if (!this.closed) this.onClose(); });
    if (conn.open) this.onOpen(); else conn.on('open', () => this.onOpen());
  }

  send(m: Msg) { try { if (this.conn?.open) this.conn.send(m); } catch { /* ignore */ } }

  destroy() {
    this.closed = true;
    try { this.send({ t: 'leave' }); } catch { /* */ }
    setTimeout(() => { try { this.conn?.close(); this.peer?.destroy(); } catch { /* */ } }, 50);
  }

  /** Host a private game. Resolves with the shareable code once registered. */
  host(): Promise<string> {
    return new Promise((resolve, reject) => {
      const code = rid();
      const peer = new Peer(PREFIX + 'g-' + code);
      this.peer = peer;
      peer.on('open', () => resolve(code));
      peer.on('error', (e: any) => { if (!this.conn) reject(e); });
      peer.on('connection', (c) => {
        if (this.conn) { c.on('open', () => { c.send({ t: 'busy' }); setTimeout(() => c.close(), 200); }); return; }
        this.bind(c);
      });
    });
  }

  /** Join a friend's game by code. */
  join(code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const peer = new Peer();
      this.peer = peer;
      let done = false;
      const t = setTimeout(() => { if (!done) { done = true; reject(new Error('timeout')); } }, 20000);
      peer.on('open', () => {
        const c = peer.connect(PREFIX + 'g-' + code, { reliable: true });
        const prevOpen = this.onOpen;
        this.onOpen = () => { if (!done) { done = true; clearTimeout(t); resolve(); } prevOpen(); this.onOpen = prevOpen; };
        this.bind(c);
      });
      peer.on('error', (e: any) => { if (!done) { done = true; clearTimeout(t); reject(e); } });
    });
  }

  /** Online matchmaking in a pool. Resolves with 'host' | 'guest' once paired. */
  matchmake(pool: string, onStatus: (s: string) => void): Promise<'host' | 'guest'> {
    const lobby = PREFIX + 'lobby-' + pool.replace(/[^a-z0-9-]/gi, '');
    return new Promise((resolve, reject) => {
      let finished = false;
      const attempt = (n: number) => {
        if (this.closed || finished) return;
        if (n > 12) { reject(new Error('Could not reach the matchmaking server.')); return; }
        onStatus('Looking for an opponent…');
        const p = new Peer(lobby);
        this.peer = p;
        p.on('open', () => {
          onStatus('Waiting for an opponent to join…');
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
            const g = new Peer();
            this.peer = g;
            g.on('open', () => {
              const c = g.connect(lobby, { reliable: true });
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

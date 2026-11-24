/**
 * Phones on mobile data, many iPads and strict Wi-Fi networks cannot open a direct WebRTC connection
 * (and the free public TURN relays are gone). So every PeerJS connection gets a second path:
 * a Supabase Realtime broadcast channel named after the connection id, which both sides know.
 * Whichever path opens first is used; if the direct path never opens, the game simply runs over the relay.
 */
import type { DataConnection } from 'peerjs';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { sb, accountsEnabled } from './account';

type Fn = (...a: any[]) => void;
/** how long to give the direct connection before switching to the relay */
const DIRECT_GRACE_MS = 2500;
/** small in-page log for troubleshooting connections (window.__rl) */
const log = (...a: any[]) => { const w = window as any; (w.__rl ||= []).push(Math.round(performance.now()) + ' ' + a.join(' ')); if (w.__rl.length > 80) w.__rl.shift(); };

export class HybridConn {
  private h: Record<string, Fn[]> = {};
  private mode: '' | 'dc' | 'relay' = '';
  private relayUp = false;
  private ch: RealtimeChannel | null = null;
  private ended = false;
  private graceT: any = 0;
  /** messages that arrived before the page listened (or before 'open'): delivered right after */
  private pending: any[] = [];
  /** messages sent while both paths were down (phone in the background): delivered when one comes back */
  private outbox: any[] = [];
  private wasDown = false;
  readonly connectionId: string;
  readonly peer: string;

  constructor(private dc: DataConnection) {
    this.connectionId = dc.connectionId;
    this.peer = dc.peer;
    log('new', this.connectionId.slice(-6), dc.open ? 'dc-open' : '');
    dc.on('open', () => this.up('dc'));
    dc.on('data', (d: any) => this.deliver(d));
    dc.on('close', () => this.down('dc'));
    dc.on('error', () => { if (!dc.open) this.down('dc'); });
    if (dc.open) setTimeout(() => this.up('dc'));
    this.startRelay();
  }

  get open() { return !this.ended && ((this.mode === 'dc' && this.dc.open) || (this.mode === 'relay' && this.relayUp)); }
  get viaRelay() { return this.mode === 'relay'; }

  on(ev: 'open' | 'data' | 'close' | 'error' | 'reopen', fn: Fn) {
    (this.h[ev] ||= []).push(fn);
    if (ev === 'data' && this.pending.length) queueMicrotask(() => this.flush());
    return this;
  }
  private deliver(d: any) {
    if (!this.mode || !this.h.data?.length) { this.pending.push(d); return; }
    this.emit('data', d);
  }
  private flush() {
    if (!this.mode || !this.h.data?.length) return;
    const q = this.pending; this.pending = [];
    for (const d of q) this.emit('data', d);
  }
  private setMode(m: 'dc' | 'relay') {
    if (this.mode || this.ended) return;
    clearTimeout(this.graceT);
    this.mode = m;
    log('mode', m, this.connectionId.slice(-6));
    this.emit('open');
    this.flush();
  }
  private emit(ev: string, ...a: any[]) { for (const f of this.h[ev] || []) { try { f(...a); } catch (e) { console.warn(e); } } }

  /** false only after close(): a connection that is down for a while (phone asleep) comes back by itself */
  get alive() { return !this.ended; }

  send(m: any) {
    if (this.ended) return;
    if (this.mode === 'dc' && this.dc.open) { try { this.dc.send(m); return; } catch { /* fall through to the relay */ } }
    if (this.relayUp && this.ch) { this.ch.send({ type: 'broadcast', event: 'm', payload: { k: 'd', m } }); return; }
    if (this.mode && this.outbox.length < 300) this.outbox.push(m);
  }
  private flushOut() {
    if (!this.outbox.length || !this.open) return;
    const q = this.outbox; this.outbox = [];
    for (const m of q) this.send(m);
  }

  close() {
    log('close', this.connectionId.slice(-6));
    if (this.ended) return;
    this.ended = true;
    clearTimeout(this.graceT);
    try { this.ch?.send({ type: 'broadcast', event: 'm', payload: { k: 'x' } }); } catch { /* */ }
    try { this.dc.close(); } catch { /* */ }
    const ch = this.ch; this.ch = null;
    setTimeout(() => { try { ch?.unsubscribe(); } catch { /* */ } }, 300);
    this.emit('close');
  }

  private up(which: 'dc' | 'relay') {
    log('up', which, this.connectionId.slice(-6), 'mode=' + this.mode, this.ended ? 'ENDED' : '');
    if (this.ended) return;
    if (which === 'relay') {
      if (this.relayUp) return;
      this.relayUp = true;
      // prefer the direct path if it is about to open
      if (!this.mode) { this.graceT = setTimeout(() => this.setMode('relay'), this.dc.open ? 0 : DIRECT_GRACE_MS); return; }
      if (!this.dc.open) this.mode = 'relay';
      this.back();
      return;
    }
    if (!this.mode) this.setMode('dc'); else { this.mode = 'dc'; this.back(); }
  }
  /** a path is up again after both were down: tell the page (it re-syncs the game) */
  private back() {
    this.flushOut();
    if (this.wasDown) { this.wasDown = false; log('reopen', this.connectionId.slice(-6)); this.emit('reopen'); }
  }

  private down(which: 'dc' | 'relay') {
    log('down', which, this.connectionId.slice(-6), 'mode=' + this.mode);
    if (this.ended) return;
    if (which === 'relay') this.relayUp = false;
    if (!this.mode) return;
    // switch paths if the other one is still there; if both are down, wait: the relay reconnects by itself
    if (which === 'dc' && this.mode === 'dc') this.mode = 'relay';
    if (which === 'relay' && this.mode === 'relay' && this.dc.open) this.mode = 'dc';
    if (!this.open) this.wasDown = true;
  }

  private async startRelay() {
    if (!accountsEnabled() || !this.connectionId) return;
    let c;
    try { c = await sb(); } catch { return; }
    if (this.ended) return;
    const ch = c.channel('rl-' + this.connectionId, { config: { broadcast: { self: false, ack: false } } });
    this.ch = ch;
    let hiT: any = 0;
    ch.on('broadcast', { event: 'm' }, ({ payload }: any) => {
      if (!payload || this.ended) return;
      if (payload.k === 'hi') { ch.send({ type: 'broadcast', event: 'm', payload: { k: 'ack' } }); this.up('relay'); }
      else if (payload.k === 'ack') this.up('relay');
      else if (payload.k === 'd') {
        // the other side already uses the relay: no need to wait for the direct path any longer
        if (!this.mode) { this.relayUp = true; this.setMode('relay'); }
        this.deliver(payload.m);
      }
      else if (payload.k === 'x') { this.ended = true; clearTimeout(hiT); this.emit('close'); }
    });
    ch.subscribe((status: string) => {
      log('sub', this.connectionId.slice(-6), status);
      if (status === 'SUBSCRIBED') {
        // say hi until the other side answers (it may subscribe a moment later)
        let n = 0;
        const hi = () => { if (this.ended || this.relayUp || n++ > 40) return; ch.send({ type: 'broadcast', event: 'm', payload: { k: 'hi' } }); hiT = setTimeout(hi, 1000); };
        hi();
      } else if ((status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !this.ended) {
        this.down('relay');
      }
    });
  }
}

// coming back to the app: reconnect the realtime socket right away instead of waiting for its heartbeat
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !accountsEnabled()) return;
  sb().then(c => { const rt: any = c.realtime; if (rt && !rt.isConnected()) rt.connect(); }).catch(() => {});
});

/** Wrap a PeerJS connection so it also works where direct connections are blocked. */
export const hybrid = (dc: DataConnection) => new HybridConn(dc);

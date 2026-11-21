/** Tiny DOM helpers, settings, toasts, modals and synthesized sounds. */
import { t } from './i18n';

type Child = Node | string | number | null | undefined | false | Child[];
type Attrs = Record<string, any> | null;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K | string, attrs?: Attrs, ...children: Child[]): HTMLElement {
  const [t, ...cls] = tag.split('.');
  const el = document.createElement(t || 'div');
  if (cls.length) el.className = cls.join(' ');
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className += (el.className ? ' ' : '') + v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && k !== 'list' && k !== 'type') (el as any)[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, children);
  return el;
}

function append(el: Node, c: Child) {
  if (c === null || c === undefined || c === false) return;
  if (Array.isArray(c)) c.forEach(x => append(el, x));
  else el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
}

export const $ = (sel: string, root: ParentNode = document) => root.querySelector(sel) as HTMLElement | null;

// ---------- Settings ----------
export interface Settings {
  theme: 'system' | 'light' | 'dark'; board: 'wood' | 'blue' | 'green' | 'slate'; sound: boolean; coords: boolean;
  name: string; lastElo: number; animation: boolean; premove: boolean; points: boolean; lang: string;
}
const DEFAULTS: Settings = { theme: 'system', board: 'wood', sound: true, coords: true, name: '', lastElo: 1200, animation: true, premove: true, points: true, lang: '' };

export function load<T>(key: string, def: T): T {
  try { const v = localStorage.getItem('rs.' + key); return v ? { ...def as any, ...JSON.parse(v) } : def; } catch { return def; }
}
export function loadRaw<T>(key: string, def: T): T {
  try { const v = localStorage.getItem('rs.' + key); return v ? JSON.parse(v) : def; } catch { return def; }
}
export function save(key: string, v: any) { try { localStorage.setItem('rs.' + key, JSON.stringify(v)); } catch { /* storage unavailable */ } }

export const settings: Settings = load('settings', DEFAULTS);
export function saveSettings() { save('settings', settings); applyTheme(); }

export function applyTheme() {
  const root = document.documentElement;
  if (settings.theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', settings.theme);
  root.setAttribute('data-board', settings.board);
  root.classList.toggle('no-coords', !settings.coords);
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#14161b' : '#f4f1ea');
}

// ---------- Toast / modal ----------
export function toast(msg: string, ms = 2600) {
  let wrap = $('#toasts');
  if (!wrap) { wrap = h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.appendChild(wrap); }
  const t = h('div.toast', null, msg);
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
}

export function modal(content: HTMLElement, opts: { onClose?: () => void; dismissable?: boolean } = {}): () => void {
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); opts.onClose?.(); };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && opts.dismissable !== false) close(); };
  const back = h('div.modal-back', { onclick: (e: Event) => { if (e.target === back && opts.dismissable !== false) close(); } },
    h('div.modal', { role: 'dialog', 'aria-modal': 'true' }, content));
  document.body.appendChild(back);
  document.addEventListener('keydown', onKey);
  setTimeout(() => (back.querySelector('button, input, select') as HTMLElement | null)?.focus(), 30);
  return close;
}

export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); toast(t('Copied to clipboard')); }
  catch {
    const ta = h('textarea', { value: text, style: { position: 'fixed', opacity: '0' } }) as HTMLTextAreaElement;
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast(t('Copied to clipboard')); } catch { toast(t('Copy failed')); }
    ta.remove();
  }
}

/** Floating offer banners (draw / takeback / rematch / challenges), visible on every screen size. */
export function offerBar(kind: string, text: string, buttons: HTMLElement[]) {
  let wrap = document.getElementById('offers');
  if (!wrap) { wrap = h('div', { id: 'offers' }); document.body.appendChild(wrap); }
  wrap.querySelectorAll(`[data-kind="${kind}"]`).forEach(e => e.remove());
  const el = h('div.offer', { 'data-kind': kind, role: 'alert' }, h('span', null, text), h('div.offer-btns', null, buttons));
  wrap.appendChild(el);
  sound.low();
  return el;
}
export function clearOffers(kind?: string) { document.querySelectorAll(kind ? `#offers [data-kind="${kind}"]` : '#offers .offer').forEach(e => e.remove()); }

// ---------- Sounds (WebAudio, no assets so it works offline) ----------
let ctx: AudioContext | null = null;
function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, delay = 0) {
  if (!settings.sound) return;
  try {
    ctx = ctx || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  } catch { /* audio unavailable */ }
}
function noise(dur: number, vol = 0.25, freq = 1800) {
  if (!settings.sound) return;
  try {
    ctx = ctx || new (window.AudioContext || (window as any).webkitAudioContext)();
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(ctx.destination); src.start();
  } catch { /* audio unavailable */ }
}
export const sound = {
  move: () => noise(0.07, 0.5, 1400),
  capture: () => { noise(0.1, 0.7, 900); noise(0.05, 0.4, 2600); },
  check: () => { noise(0.07, 0.5, 1400); tone(880, 0.18, 'triangle', 0.08, 0.02); },
  end: () => { tone(523, 0.25, 'triangle', 0.1); tone(659, 0.25, 'triangle', 0.1, 0.12); tone(784, 0.4, 'triangle', 0.1, 0.24); },
  good: () => { tone(660, 0.12, 'sine', 0.1); tone(990, 0.2, 'sine', 0.1, 0.08); },
  bad: () => { tone(220, 0.25, 'sawtooth', 0.05); },
  low: () => tone(1200, 0.06, 'square', 0.04),
};

export const debounce = (fn: () => void, ms: number) => { let t: any; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; };

export function fmtClock(ms: number): string {
  ms = Math.max(0, ms);
  const totalS = ms / 1000;
  if (totalS < 10) return `0:0${Math.floor(totalS)}.${Math.floor((ms % 1000) / 100)}`;
  const s = Math.ceil(totalS - 0.0001);
  const hr = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (hr ? hr + ':' + String(m).padStart(2, '0') : m) + ':' + String(sec).padStart(2, '0');
}

export const icon = (name: string) => {
  const paths: Record<string, string> = {
    flip: 'M7 4v13l-3-3M17 20V7l3 3',
    first: 'M18 6l-6 6 6 6M7 6v12', prev: 'M15 6l-6 6 6 6', next: 'M9 6l6 6-6 6', last: 'M6 6l6 6-6 6M17 6v12',
    flag: 'M5 21V4h11l-2 4 2 4H5', half: 'M12 3a9 9 0 100 18V3z', undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3',
    copy: 'M8 8h11v11H8zM5 16V5h11', link: 'M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1',
    bulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 00-4-10z', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
    retry: 'M4 4v6h6M20 20v-6h-6M5 15a8 8 0 0014 3M19 9A8 8 0 005 6', search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5',
    sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5 5L4 4M20 20l-1-1M5 19l-1 1M20 4l-1 1M12 7a5 5 0 100 10 5 5 0 000-10z',
    moon: 'M20 14A8 8 0 0110 4a8 8 0 1010 10z', gear: 'M12 9a3 3 0 100 6 3 3 0 000-6zM19 12l2-1-2-4-2 1-2-2V4h-4l-1 2-2 1-2-1-2 4 2 1v2l-2 1 2 4 2-1 2 2 1 2h4v-2l2-2 2 1 2-4-2-1z',
    menu: 'M4 7h16M4 12h16M4 17h16', close: 'M6 6l12 12M18 6L6 18', play: 'M7 4l13 8-13 8z', trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
    cpu: 'M8 8h8v8H8zM4 10h2M4 14h2M18 10h2M18 14h2M10 4v2M14 4v2M10 18v2M14 18v2M6 6h12v12H6z', users: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a6 6 0 0112 0v1M16 3a4 4 0 010 8M22 21v-1a6 6 0 00-4-5.6',
    globe: 'M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c3 3 4 6 4 10s-1 7-4 10c-3-3-4-6-4-10s1-7 4-10z',
    puzzle: 'M10 3h4v3a2 2 0 104 0V3h3v7h-3a2 2 0 100 4h3v7h-7v-3a2 2 0 10-4 0v3H3v-7h3a2 2 0 100-4H3V3h7z',
    book: 'M4 4h6a3 3 0 013 3v13a2 2 0 00-2-2H4zM20 4h-6a3 3 0 00-3 3v13a2 2 0 012-2h7z', chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4', home: 'M3 11l9-8 9 8M5 9v11h14V9', share: 'M12 3v12M7 8l5-5 5 5M5 14v6h14v-6',
    user: 'M12 3a4 4 0 100 8 4 4 0 000-8zM4 21v-1a7 7 0 0114 0v1',
    party: 'M12 2.5a2 2 0 100 4 2 2 0 000-4zM12 17.5a2 2 0 100 4 2 2 0 000-4zM2.5 12a2 2 0 104 0 2 2 0 00-4 0zM17.5 12a2 2 0 104 0 2 2 0 00-4 0zM8 8h8v8H8z',
    fire: 'M12 22a7 7 0 007-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8a7 7 0 007 7z', check: 'M5 12l5 5L20 7',
  };
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic'); s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', paths[name] || ''); s.appendChild(p);
  return s;
};

export function btn(label: string | Node, onclick: () => void, cls = '', title?: string): HTMLButtonElement {
  return h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), { onclick, title, 'aria-label': title, type: 'button' }, label) as HTMLButtonElement;
}
export function iconBtn(name: string, title: string, onclick: () => void, cls = ''): HTMLButtonElement {
  return btn(icon(name), onclick, 'icon ' + cls, title);
}

/** Stockfish 17.1 (WASM, single thread) wrapper with a cancellable job queue. */

export interface Line { multipv: number; depth: number; cp?: number; mate?: number; pv: string[] }
export interface Result { bestmove: string; lines: Line[]; depth: number }
export interface Job {
  fen: string; depth?: number; movetime?: number; nodes?: number; multipv?: number; chess960?: boolean;
  elo?: number | null; onInfo?: (lines: Line[]) => void;
}

interface Pending { job: Job; resolve: (r: Result | null) => void; lines: Line[]; cancelled: boolean; maxDepth: number }

export const MIN_ELO = 100;
export const MAX_ELO = 3200;
export const SF_MIN_LIMIT = 1320;
export const SF_MAX_LIMIT = 3190;

class Engine {
  private worker: Worker | null = null;
  private readyP: Promise<void> | null = null;
  private current: Pending | null = null;
  private queue: Pending[] = [];
  private lastOpts = '';
  failed = false;

  private boot(): Promise<void> {
    if (this.readyP) return this.readyP;
    this.readyP = new Promise((resolve, reject) => {
      try {
        const url = new URL('engine/sf.js', document.baseURI).href;
        this.worker = new Worker(url);
      } catch (e) { this.failed = true; reject(e); return; }
      const w = this.worker;
      let stage = 0;
      const t = setTimeout(() => { if (stage < 2) { this.failed = true; reject(new Error('Engine timeout')); } }, 30000);
      w.onerror = (e) => { this.failed = true; clearTimeout(t); reject(e); };
      w.onmessage = (e: MessageEvent) => {
        const line = String(e.data);
        if (stage === 0 && line === 'uciok') { stage = 1; this.send('setoption name Hash value 32'); this.send('isready'); }
        else if (stage === 1 && line === 'readyok') { stage = 2; clearTimeout(t); w.onmessage = (ev) => this.onLine(String(ev.data)); resolve(); }
      };
      this.send('uci');
    });
    return this.readyP;
  }

  ready() { return this.boot(); }

  private send(cmd: string) { this.worker?.postMessage(cmd); }

  private onLine(line: string) {
    const cur = this.current;
    if (!cur) return;
    if (line.startsWith('info ') && line.includes(' pv ')) {
      const parts = line.split(' ');
      const get = (k: string) => { const i = parts.indexOf(k); return i >= 0 ? parts[i + 1] : undefined; };
      const depth = parseInt(get('depth') || '0');
      const mpv = parseInt(get('multipv') || '1');
      const sIdx = parts.indexOf('score');
      if (sIdx < 0) return;
      const kind = parts[sIdx + 1], val = parseInt(parts[sIdx + 2]);
      if (parts[sIdx + 3] === 'lowerbound' || parts[sIdx + 3] === 'upperbound') return;
      const pv = parts.slice(parts.indexOf('pv') + 1);
      const l: Line = { multipv: mpv, depth, pv };
      if (kind === 'cp') l.cp = val; else l.mate = val;
      cur.lines[mpv - 1] = l;
      cur.maxDepth = Math.max(cur.maxDepth, depth);
      if (mpv === (cur.job.multipv || 1) || cur.job.onInfo) {
        if (!cur.cancelled) cur.job.onInfo?.(cur.lines.filter(Boolean).slice());
      }
    } else if (line.startsWith('bestmove')) {
      const best = line.split(' ')[1];
      this.current = null;
      if (cur.cancelled) cur.resolve(null);
      else cur.resolve({ bestmove: best, lines: cur.lines.filter(Boolean), depth: cur.maxDepth });
      this.next();
    }
  }

  private next() {
    if (this.current || !this.queue.length) return;
    const p = this.queue.shift()!;
    this.current = p;
    const j = p.job;
    const elo = j.elo;
    const limit = elo != null && elo < SF_MAX_LIMIT;
    const opts = [
      `setoption name UCI_Chess960 value ${!!j.chess960}`,
      `setoption name MultiPV value ${j.multipv || 1}`,
      `setoption name UCI_LimitStrength value ${limit && elo! >= SF_MIN_LIMIT}`,
      limit && elo! >= SF_MIN_LIMIT ? `setoption name UCI_Elo value ${Math.round(elo!)}` : '',
    ].filter(Boolean).join('\n');
    if (opts !== this.lastOpts) { opts.split('\n').forEach(o => this.send(o)); this.lastOpts = opts; }
    this.send(`position fen ${j.fen}`);
    const go = ['go'];
    if (j.depth) go.push('depth', String(j.depth));
    if (j.movetime) go.push('movetime', String(j.movetime));
    if (j.nodes) go.push('nodes', String(j.nodes));
    if (go.length === 1) go.push('depth', '18');
    this.send(go.join(' '));
  }

  /** Run a search. Resolves null if superseded by stop()/a newer exclusive job. */
  async analyse(job: Job, exclusive = true): Promise<Result | null> {
    await this.boot();
    if (exclusive) this.stop();
    return new Promise(resolve => {
      this.queue.push({ job, resolve, lines: [], cancelled: false, maxDepth: 0 });
      this.next();
    });
  }

  /** Cancel queued and running jobs. */
  stop() {
    for (const q of this.queue) q.resolve(null);
    this.queue = [];
    if (this.current && !this.current.cancelled) { this.current.cancelled = true; this.send('stop'); }
  }

  newGame() { if (this.worker) { this.stop(); this.send('ucinewgame'); } }
}

export const engine = new Engine();

/** White-POV numeric score (centipawns), mates mapped to ±(10000 - n). turn = side to move of analysed position */
export function whiteCp(l: Line | undefined, turn: 'white' | 'black'): number {
  if (!l) return 0;
  let v = l.mate !== undefined ? (l.mate > 0 ? 10000 - l.mate : l.mate < 0 ? -10000 - l.mate : -10000) : (l.cp || 0);
  return turn === 'white' ? v : -v;
}

export function fmtScore(l: Line | undefined, turn: 'white' | 'black'): string {
  if (!l) return '…';
  if (l.mate !== undefined) {
    const m = turn === 'white' ? l.mate : -l.mate;
    if (m === 0) return '#';
    return (m > 0 ? '#' : '#-') + Math.abs(m);
  }
  const v = (turn === 'white' ? l.cp! : -l.cp!) / 100;
  return (v > 0 ? '+' : '') + v.toFixed(2);
}

/** Lichess win-probability (0..100) for White from white-POV cp. */
export function winPct(cp: number): number {
  const c = Math.max(-1000, Math.min(1000, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1);
}

/**
 * Choose a bot move for a target Elo.
 * >= 1320: Stockfish's own UCI_Elo limiter. < 1320: Stockfish multi-PV with a human-like error model.
 */
export async function botMove(fen: string, elo: number, chess960: boolean, legalCount: number, maxMs = 0): Promise<string | null> {
  elo = Math.max(MIN_ELO, Math.min(MAX_ELO, elo));
  if (elo >= SF_MIN_LIMIT) {
    let movetime = elo >= SF_MAX_LIMIT ? 1500 : Math.round(250 + (elo - SF_MIN_LIMIT) / (SF_MAX_LIMIT - SF_MIN_LIMIT) * 900);
    if (maxMs > 0) movetime = Math.max(60, Math.min(movetime, Math.round(maxMs)));
    const r = await engine.analyse({ fen, movetime, chess960, elo: elo >= SF_MAX_LIMIT ? null : elo, multipv: 1 });
    return r ? r.bestmove : null;
  }
  // Weak play model
  const t = (SF_MIN_LIMIT - elo) / (SF_MIN_LIMIT - MIN_ELO); // 0 (1320) .. 1 (100)
  const multipv = Math.min(legalCount, Math.round(4 + t * 8));
  const depth = Math.max(1, Math.round(9 - t * 7));
  const r = await engine.analyse({ fen, depth, chess960, elo: null, multipv });
  if (!r) return null;
  const lines = r.lines.filter(l => l.pv.length);
  if (!lines.length) return r.bestmove;
  // Pure blunder chance (random-ish candidate among all lines)
  if (Math.random() < 0.05 + t * 0.25) return lines[Math.floor(Math.random() * lines.length)].pv[0];
  const score = (l: Line) => l.mate !== undefined ? (l.mate > 0 ? 5000 - l.mate * 10 : -5000 - l.mate * 10) : l.cp!;
  const best = score(lines[0]);
  const temp = 25 + t * 260;
  const weights = lines.map(l => Math.exp(-(best - score(l)) / temp));
  const sum = weights.reduce((a, b) => a + b, 0);
  let x = Math.random() * sum;
  for (let i = 0; i < lines.length; i++) { x -= weights[i]; if (x <= 0) return lines[i].pv[0]; }
  return lines[0].pv[0];
}

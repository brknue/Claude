/** Saves the games of signed-in players to their account, so friends can watch live and review later. */
import { me, rpc } from './account';
import type { Color, VariantKey } from './chess';

export interface FinishInfo { status: string; result?: string; white_diff?: number; black_diff?: number; white_rating?: number; black_rating?: number }

export class Recorder {
  id: string | null = null;
  rated = false;
  private ucis = '';
  private clocks: any = null;
  private timer: any = 0;
  private finished = false;
  private ready: Promise<void> = Promise.resolve();

  /** Create a game row. opp = opponent's account id (network games) or null. */
  static create(o: { kind: 'bot' | 'local' | 'friend' | 'online'; variant: VariantKey; time: number; inc: number; myColor: Color; meName: string; oppName: string; opp?: string | null; rated?: boolean; startFen: string }): Recorder | null {
    if (!me) return null;
    const r = new Recorder();
    r.ready = rpc<string>('start_game', {
      p_kind: o.kind, p_variant: o.variant, p_base: o.time, p_inc: o.inc, p_my_color: o.myColor, p_me_name: o.meName.slice(0, 40), p_opp_name: o.oppName.slice(0, 40),
      p_opp: o.opp || null, p_rated: !!o.rated, p_start_fen: o.startFen,
    }).then(id => { r.id = id; if (r.ucis) r.flush(); }).catch(() => { /* offline: the game is simply not saved */ });
    return r;
  }

  /** The invited player joins a game row created by the host. */
  static join(id: string): Recorder | null {
    if (!me) return null;
    const r = new Recorder();
    r.id = id;
    r.ready = rpc<{ rated: boolean } | null>('confirm_game', { p_id: id }).then(x => { r.rated = !!x?.rated; }).catch(() => {});
    return r;
  }

  whenReady() { return this.ready; }

  /** Called after every move; uploads at most every 1.5 s. */
  push(ucis: string[], clocks?: { w: number; b: number } | null) {
    if (this.finished) return;
    this.ucis = ucis.join(' ');
    this.clocks = clocks ? { ...clocks, at: Date.now() } : null;
    if (!this.timer) this.timer = setTimeout(() => this.flush(), 1500);
  }
  private flush() {
    clearTimeout(this.timer); this.timer = 0;
    if (!this.id || this.finished) return;
    rpc('push_moves', { p_id: this.id, p_moves: this.ucis, p_clocks: this.clocks }).catch(() => {});
  }

  async finish(winner: Color | undefined, reason: string, ucis: string[]): Promise<FinishInfo | null> {
    if (this.finished) return null;
    this.finished = true;
    clearTimeout(this.timer);
    await this.ready;
    if (!this.id) return null;
    const result = winner === 'white' ? '1-0' : winner === 'black' ? '0-1' : '1/2-1/2';
    try {
      let info = await rpc<FinishInfo>('finish_game', { p_id: this.id, p_result: result, p_reason: reason.slice(0, 80), p_moves: ucis.join(' ') });
      // Rated games settle when both players have reported: check back briefly for the rating change.
      for (let i = 0; i < 10 && info?.status === 'live'; i++) {
        await new Promise(r => setTimeout(r, 1500));
        const g = await rpc<any>('get_game', { p_id: this.id });
        if (g) info = { status: g.status, result: g.result, white_diff: g.white_diff, black_diff: g.black_diff, white_rating: g.white_rating, black_rating: g.black_rating };
      }
      return info;
    } catch { return null; }
  }
}

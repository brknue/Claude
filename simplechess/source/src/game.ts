import { makeSan } from 'chessops/san';
import { makeUci } from 'chessops/util';
import { Position, Move, VariantKey, posFromFen, repKey, Outcome, fenOf, variantInfo, uciToMove } from './chess';

const startFenStd = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** Linear game record built on chessops positions. */
export class Game {
  positions: Position[];
  moves: Move[] = [];
  sans: string[] = [];
  ucis: string[] = [];
  result: Outcome | null = null;

  constructor(public variant: VariantKey, public startFen: string) {
    const p = posFromFen(startFen, variant);
    if (!p) throw new Error('Bad start position');
    this.positions = [p];
  }

  get pos(): Position { return this.positions[this.positions.length - 1]; }
  get ply(): number { return this.moves.length; }
  get chess960() { return this.variant === 'chess960'; }
  fenAt(i: number) { return fenOf(this.positions[i]); }

  play(m: Move): string | null {
    if (this.result) return null;
    const pos = this.pos;
    if (!pos.isLegal(m)) return null;
    const san = makeSan(pos, m);
    const next = pos.clone();
    next.play(m);
    this.positions.push(next);
    this.moves.push(m);
    this.sans.push(san);
    this.ucis.push(makeUci(m));
    this.result = this.computeOutcome();
    return san;
  }

  playUci(uci: string): string | null {
    const m = uciToMove(this.pos, uci);
    return m ? this.play(m) : null;
  }

  undo(n = 1) {
    for (let i = 0; i < n && this.moves.length; i++) {
      this.positions.pop(); this.moves.pop(); this.sans.pop(); this.ucis.pop();
    }
    this.result = null;
  }

  computeOutcome(): Outcome | null {
    const pos = this.pos;
    if (pos.isVariantEnd()) {
      const o = pos.variantOutcome();
      const reasons: Record<string, string> = {
        kingofthehill: 'king reached the hill', '3check': 'three checks', atomic: 'king exploded',
        antichess: 'no pieces left', horde: 'horde destroyed', racingkings: 'king reached the 8th rank',
      };
      return { winner: o?.winner, reason: reasons[variantInfo(this.variant).rules] || 'variant end' };
    }
    const ctx = pos.ctx();
    if (pos.isCheckmate(ctx)) return { winner: pos.turn === 'white' ? 'black' : 'white', reason: 'checkmate' };
    if (pos.isStalemate(ctx)) {
      if (this.variant === 'antichess') return { winner: pos.turn, reason: 'no moves left' };
      return { reason: 'stalemate' };
    }
    if (pos.isInsufficientMaterial()) return { reason: 'insufficient material' };
    if (pos.halfmoves >= 100) return { reason: '50-move rule' };
    const key = repKey(pos);
    let count = 0;
    for (const p of this.positions) if (repKey(p) === key) count++;
    if (count >= 3) return { reason: 'threefold repetition' };
    return null;
  }

  end(o: Outcome) { if (!this.result) this.result = o; }

  pgn(headers: Record<string, string> = {}): string {
    const res = this.result ? (this.result.winner === 'white' ? '1-0' : this.result.winner === 'black' ? '0-1' : '1/2-1/2') : '*';
    const h: Record<string, string> = { Event: 'Simple Chess game', Site: 'Simple Chess', Date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'), ...headers, Result: res };
    const vname = variantInfo(this.variant).name;
    if (this.variant !== 'standard') h.Variant = vname;
    if (fenOf(this.positions[0]) !== startFenStd && (this.variant === 'standard' || this.variant === 'chess960')) {
      h.FEN = this.startFen; h.SetUp = '1';
    }
    let out = Object.entries(h).map(([k, v]) => `[${k} "${v.replace(/"/g, "'")}"]`).join('\n') + '\n\n';
    const p0 = this.positions[0];
    let ply = p0.fullmoves * 2 - (p0.turn === 'white' ? 2 : 1);
    const parts: string[] = [];
    this.sans.forEach((s, i) => {
      if (ply % 2 === 0) parts.push(`${ply / 2 + 1}.`);
      else if (i === 0) parts.push(`${(ply + 1) / 2}...`);
      parts.push(s);
      ply++;
    });
    parts.push(res);
    return out + parts.join(' ') + '\n';
  }

  /** Move number label for ply index i (0-based move index) */
  moveNumber(i: number): { num: number; white: boolean } {
    const p0 = this.positions[0];
    const ply = p0.fullmoves * 2 - (p0.turn === 'white' ? 2 : 1) + i;
    return { num: Math.floor(ply / 2) + 1, white: ply % 2 === 0 };
  }
}

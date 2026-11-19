import fs from 'node:fs';
import { Chess } from 'chessops/chess';
import { parseSan, makeSanAndPlay } from 'chessops/san';
import { makeUci } from 'chessops/util';
const out = [];
for (const f of ['a','b','c','d','e']) {
  const lines = fs.readFileSync(`tsv/${f}.tsv`, 'utf8').trim().split('\n').slice(1);
  for (const l of lines) {
    const [eco, name, pgn] = l.split('\t');
    const pos = Chess.default();
    const sans = [], ucis = [];
    for (const tok of pgn.trim().split(/\s+/)) {
      if (/^\d+\.+$/.test(tok)) continue;
      const m = parseSan(pos, tok);
      if (!m) throw new Error('bad ' + l);
      ucis.push(makeUci(m));
      sans.push(makeSanAndPlay(pos, m));
    }
    out.push([eco, name.trim(), sans.join(' '), ucis.join(' ')]);
  }
}
fs.writeFileSync('public/data/openings.json', JSON.stringify(out));
console.log(out.length, 'openings');

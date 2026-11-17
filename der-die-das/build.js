// Builds index.html from template.html + data/w*.txt
const fs = require('fs'), path = require('path');
const dir = __dirname, dataDir = path.join(dir, 'data');
// words that take more than one article in common use: left out so every quiz item has one right answer
const BLOCK = new Set(('See Leiter Band Kiefer Steuer Tor Gehalt Verdienst Teil Joghurt Virus Meter Liter Kaugummi Laptop Blog Schild Heide Mark Bund Erbe Golf Moment Tau Gummi Bonbon Ketchup Curry Filter Keks Spray Dotter Knäuel Marzipan Radar Gelee Lasso Silo Biotop Paprika Prospekt Puder Sakko Zepter Pyjama Poster Event Service Cola Verlobte Erwachsene Jugendliche Fremde Bekannte Angestellte Deutsche Verwandte Kranke Tote Arbeitslose Reisende Vorsitzende Abgeordnete Beamte Angeklagte Vorgesetzte Kristall Harz Maß Militär Wehr Koller Laster Mast Pony Raster Balg Gischt Schrot Hektar Sellerie Nougat Gulasch Zölibat Kehricht Weise Tablet Kiwi Lama Korpus Barometer Thermostat Memory Kriminelle Spachtel Sorbet Kajak Yoga').split(' '));
const seen = new Map(), tiers = [], dups = [], blocked = [], bad = [];
for (const f of fs.readdirSync(dataDir).filter(f => /^w\d+\.txt$/.test(f)).sort()) {
  const lists = { m: [], f: [], n: [] }; let g = null;
  for (const line of fs.readFileSync(path.join(dataDir, f), 'utf8').split(/\r?\n/)) {
    const h = line.match(/^#\s*([mfn])/); if (h) { g = h[1]; continue; }
    for (let e of line.split(',')) {
      e = e.replace(/­/g, '').trim(); if (!e) continue;
      const i = e.indexOf('='); if (i < 1 || !g) { bad.push(f + ':' + e); continue; }
      const w = e.slice(0, i).trim(), t = e.slice(i + 1).trim();
      if (/\s/.test(w) || !/^[A-ZÄÖÜ]/.test(w) || !t || /[|;]/.test(t)) { bad.push(f + ':' + e); continue; }
      if (BLOCK.has(w)) { blocked.push(w); continue; }
      if (seen.has(w)) { if (seen.get(w) !== g) dups.push(w + '(' + seen.get(w) + '/' + g + ')'); continue; }
      seen.set(w, g); lists[g].push([w, t]);
    }
  }
  // interleave the three genders evenly so each lesson mixes der/die/das
  const out = [], tot = lists.m.length + lists.f.length + lists.n.length, pos = { m: 0, f: 0, n: 0 };
  while (out.length < tot) {
    let best = null, bv = 2;
    for (const k of 'mfn') { const L = lists[k]; if (pos[k] >= L.length) continue; const v = (pos[k] + 0.5) / L.length; if (v < bv) { bv = v; best = k; } }
    out.push([best, ...lists[best][pos[best]++]]);
  }
  tiers.push(out); console.log(f, 'm', lists.m.length, 'f', lists.f.length, 'n', lists.n.length, '=', tot);
}
let all = tiers.flat();
console.log('total', all.length, '| conflicting genders:', dups.join(' ') || '-', '| bad:', bad.join(' ') || '-');
const LIMIT = 5000; if (all.length > LIMIT) all = all.slice(0, LIMIT);
const cnt = { m: 0, f: 0, n: 0 }; all.forEach(x => cnt[x[0]]++); console.log('used', all.length, cnt);
const data = all.map(x => x[0] + x[1] + '=' + x[2]).join('|');
const tplPath = path.join(dir, 'template.html');
if (fs.existsSync(tplPath)) {
  const html = fs.readFileSync(tplPath, 'utf8').replace('/*__WORDS__*/', () => JSON.stringify(data));
  fs.writeFileSync(path.join(dir, 'index.html'), html); console.log('index.html', (html.length / 1024 | 0) + ' KB');
}

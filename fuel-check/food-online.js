/* Fuel Check — online food lookup on Open Food Facts (free, no key, non-profit, millions of products).
 * Tested live from https://brknue.github.io: /cgi/search.pl and /api/v2/product send CORS headers;
 * search.openfoodfacts.org does not, so it is not used. Searches are limited by Open Food Facts to about
 * 10 per minute per visitor (over the limit the answer has no CORS header and fails), so this file keeps
 * its own rolling budget and caches every answer for 30 days.
 * Data © Open Food Facts contributors, Open Database License (ODbL): https://world.openfoodfacts.org
 */
(function () {
  'use strict';
  const BASE = 'https://world.openfoodfacts.org';
  const FIELDS = 'code,product_name,product_name_en,generic_name,brands,nutriments,serving_quantity,product_quantity,countries_tags';
  const PER_RUN = 5, PER_MIN = 8, TTL = 30 * 864e5;
  let runCount = 0, lastSearch = 0;
  const ls = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const cacheGet = k => { const o = ls.get('fc_off2:' + k); return o && Date.now() - o.t < TTL ? o.v : undefined; };
  const cacheSet = (k, v) => ls.set('fc_off2:' + k, { t: Date.now(), v });
  const norm = s => String(s || '').toLowerCase().replace(/ı/g, 'i').replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const num = x => { x = parseFloat(x); return isFinite(x) && x >= 0 ? x : null; };

  function canSearch(retry) {
    if (!retry && runCount >= PER_RUN) return false;
    const now = Date.now(), ts = (ls.get('fc_off_ts') || []).filter(t => now - t < 60000);
    return ts.length < PER_MIN;
  }
  function noteSearch(retry) { const now = Date.now(), ts = (ls.get('fc_off_ts') || []).filter(t => now - t < 60000); ts.push(now); ls.set('fc_off_ts', ts); if (!retry) runCount++; }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // Open Food Facts sometimes answers busy/overloaded without CORS headers, which the browser reports as
  // "Failed to fetch". Seen in live tests: the same request works a few seconds later. So retry twice.
  async function getJSON(url, isSearch) {
    for (let attempt = 0; ; attempt++) {
      try { return await getOnce(url); }
      catch (e) {
        if (attempt >= 1) throw e;                       // one retry only: retries also count against OFF's limit
        if (isSearch) { if (!canSearch(true)) throw new Error('budget'); noteSearch(true); }
        await wait(4000);
      }
    }
  }
  async function getOnce(url) {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl && setTimeout(() => ctl.abort(), 15000);
    try { const r = await fetch(url, { referrerPolicy: 'no-referrer', signal: ctl && ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
    finally { if (timer) clearTimeout(timer); }
  }
  function per100(p) {
    const n = p.nutriments || {};
    const v = { p: num(n.proteins_100g), c: num(n.carbohydrates_100g), f: num(n.fat_100g), fib: num(n.fiber_100g) || 0, sat: num(n['saturated-fat_100g']) || 0,
      sug: num(n['added-sugars_100g']) != null ? num(n['added-sugars_100g']) : (num(n.sugars_100g) || 0), alc: (num(n.alcohol_100g) || 0) * 0.789 };
    if (v.p == null || v.c == null || v.f == null) return null;
    if (v.p + v.c + v.f + v.fib > 101 || v.sat > v.f + 0.5) return null;
    const kcal = num(n['energy-kcal_100g']);
    const est = v.p * 4 + v.c * 4 + v.f * 9 + v.fib * 2 + v.alc * 7;
    if (kcal != null && kcal > 25 && Math.abs(est - kcal) / kcal > 0.3) return null;   // inconsistent entry
    if (kcal == null && est === 0) return null;
    return v;
  }
  const median = a => { a = a.slice().sort((x, y) => x - y); const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
  const nameOf = h => h.product_name || h.product_name_en || h.generic_name || '';
  // a word matches if equal, or the same word with a short ending (schokolade/schokoladen, egg/eggs) — not "choco" vs "chocolate"
  function same(x, w) { if (x === w) return true; const a = x.length < w.length ? x : w, b = a === x ? w : x; return a.length >= 5 && b.length - a.length <= 3 && b.startsWith(a) && (b.length - a.length <= 2 || a.length >= 6); }
  function wordsHit(qt, hay) { const hw = hay.split(' '); return qt.filter(x => hw.some(w => same(x, w))).length; }

  /* search(words, mustWords) -> {name, brand, url, per100, serving, pack, branded, n} | null
   * mustWords: words that must all appear in the product's name or brand (brand/product lookups) */
  async function search(words, mustWords, kindWords) {
    const q = norm(words).split(' ').filter(Boolean).slice(0, 6).join(' ');
    if (q.length < 3) return null;
    const kinds = (kindWords || []).map(norm).filter(Boolean);
    const key = q + '|' + (mustWords || '') + '|' + kinds.length;
    const c = cacheGet(key); if (c !== undefined) return c;
    if (!canSearch()) throw new Error('budget');
    const gap = Date.now() - lastSearch; if (gap < 1500) await wait(1500 - gap);
    noteSearch(); lastSearch = Date.now();
    const j = await getJSON(BASE + '/cgi/search.pl?' + new URLSearchParams({ search_terms: q, json: '1', page_size: '20', fields: FIELDS }), true);
    const qt = q.split(' ').filter(x => x.length > 1), must = norm(mustWords || '').split(' ').filter(x => x.length > 1);
    const kindsUse = kinds.filter(k => !must.some(m => same(k, m) || m.startsWith(k)));
    const cands = [];
    for (const h of (j.products || [])) {
      const v = per100(h); if (!v) continue;
      const hay = norm(nameOf(h) + ' ' + (h.brands || ''));
      if (must.length && wordsHit(must, hay) < must.length) continue;
      const kindHit = kindsUse.length && wordsHit(kindsUse, hay) > 0;
      if (kindsUse.length && !kindHit) continue;                     // a "Milka chocolate" must be a chocolate, not a Milka cake
      const score = Math.min(1, (qt.length ? wordsHit(qt, hay) / qt.length : 0) + (kindHit ? 0.5 : 0));
      const de = Array.isArray(h.countries_tags) && h.countries_tags.includes('en:germany') ? 0.1 : 0;   // prefer products sold in Germany
      if (score >= 0.5) cands.push({ h, v, score: score + de, name: nameOf(h) });
    }
    let res = null;
    if (cands.length) {
      cands.sort((a, b) => b.score - a.score);
      const best = cands[0];
      const top = cands.filter(x => x.score >= best.score - 0.15).slice(0, 7);
      const pick = k => median(top.map(x => x.v[k]));
      const serv = top.map(x => num(x.h.serving_quantity)).filter(x => x && x < 1500);
      const pack = top.map(x => num(x.h.product_quantity)).filter(x => x && x < 5000);
      const branded = must.length > 0;
      const shown = top.map(x => x.name).filter(n => n && n.length <= 40 && n !== n.toUpperCase() && (!must.length || wordsHit(must, norm(n + ' ' + (top.find(t => t.name === n).h.brands || ''))) === must.length)).sort((a, b) => a.length - b.length)[0] || best.name;
      res = { name: shown, brand: branded ? String(best.h.brands || '').split(',')[0] : '', n: top.length, branded,
        url: branded && best.h.code ? BASE + '/product/' + best.h.code : BASE + '/cgi/search.pl?search_simple=1&action=process&search_terms=' + encodeURIComponent(q),
        per100: { p: pick('p'), c: pick('c'), f: pick('f'), fib: pick('fib'), sat: pick('sat'), sug: pick('sug'), alc: pick('alc') },
        serving: serv.length ? median(serv) : null, pack: pack.length ? median(pack) : null };
    }
    cacheSet(key, res);
    return res;
  }
  /* ---------- German store products (built monthly from Open Food Facts by .github/workflows/fuel-stores.yml) ---------- */
  let STORE = null;                       // null = not loaded yet, false = unavailable
  async function storeDB() {
    if (STORE !== null) return STORE;
    try {
      const r = await fetch('data/de-stores.json?v=' + (window.FC_DATA_V || '1'));
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json(), idx = new Map(), items = [], codes = new Map();
      j.rows.forEach((x, i) => {
        const it = { name: x[0], brand: x[1], stores: x[2], v: { p: x[3], c: x[4], f: x[5], fib: x[6], sat: x[7], sug: x[8], alc: x[9] }, serving: x[10] || null, pack: x[11] || null, code: x[12], rank: i };
        it.hay = norm(it.name + ' ' + it.brand + ' ' + it.stores);
        items.push(it); if (it.code) codes.set(String(it.code), it);
        new Set(it.hay.split(' ')).forEach(w => { if (w.length < 3) return; for (const k of [w, w.slice(0, 5)]) { let a = idx.get(k); if (!a) idx.set(k, a = []); a.push(i); } });
      });
      STORE = { items, idx, codes, built: j.built };
    } catch (e) { STORE = false; }
    return STORE;
  }
  // German compounds: "proteinpudding" ~ "protein pudding", "vollkorntoast" ~ "toast"
  function hitC(x, hw) { return hw.some(w => same(x, w) || (x.length >= 8 && w.length >= 4 && (x.startsWith(w) || x.endsWith(w))) || (w.length >= 8 && x.length >= 5 && (w.startsWith(x) || w.endsWith(x)))); }
  async function storeMatch(words, mustWords, kindWords) {
    const db = await storeDB(); if (!db) return null;
    const qt = norm(words).split(' ').filter(x => x.length > 1).slice(0, 8);
    if (!qt.length) return null;
    const must = norm(mustWords || '').split(' ').filter(x => x.length > 1);
    const kinds = (kindWords || []).map(norm).filter(k => k && !must.some(m => same(k, m) || m.startsWith(k)));
    const cand = new Set();
    qt.forEach(x => { for (const k of [x, x.slice(0, 5)]) (db.idx.get(k) || []).forEach(i => cand.add(i)); });
    const scored = [];
    for (const i of cand) {
      const it = db.items[i], hw = it.hay.split(' ');
      if (must.length && !must.every(m => hitC(m, hw))) continue;
      if (kinds.length && !kinds.some(k => hitC(k, hw))) continue;
      const nameW = norm(it.name + ' ' + it.brand).split(' ');
      const hit = qt.filter(x => hitC(x, hw)).length, nameHit = qt.filter(x => hitC(x, nameW)).length;
      if (!nameHit) continue;                              // the store name alone is not enough
      const score = hit / qt.length;
      if (score >= 0.75) scored.push({ it, score });
    }
    if (!scored.length) return null;
    scored.sort((a, b) => b.score - a.score || a.it.rank - b.it.rank);
    const top = scored.filter(x => x.score === scored[0].score).slice(0, 3), best = top[0].it;
    const pick = k => median(top.map(x => x.it.v[k]));
    return { name: best.name, brand: best.brand, url: best.code ? BASE + '/product/' + best.code : BASE, branded: true, n: top.length, store: best.stores,
      per100: best.v,      // one real product (the most scanned of the best matches), not an average of e.g. Coke and Coke Zero
      serving: best.serving, pack: best.pack };
  }

  async function barcode(code) {
    const db = await storeDB();
    if (db && db.codes.has(String(code))) { const it = db.codes.get(String(code)); return { name: it.name, brand: it.brand, url: BASE + '/product/' + code, per100: it.v, serving: it.serving, pack: it.pack, branded: true, n: 1 }; }
    const c = cacheGet('bc:' + code); if (c !== undefined) return c;
    const j = await getJSON(BASE + '/api/v2/product/' + encodeURIComponent(code) + '.json?fields=' + FIELDS);
    const h = j && j.product; let res = null;
    if (h) { const v = per100(h); if (v) res = { name: nameOf(h), brand: String(h.brands || '').split(',')[0], url: BASE + '/product/' + code, per100: v, serving: num(h.serving_quantity), pack: num(h.product_quantity), branded: true, n: 1 }; }
    cacheSet('bc:' + code, res);
    return res;
  }

  const PACK = /\b(pack|packs|packet|packung|packchen|paket|tafel|tafeln|tablet|bag|tute|poset|can|dose|kutu|bottle|flasche|sise|tub|becher|jar|glas)\b/;
  function gramsFor(rec, hit, fallback) {
    const raw = rec.barcode ? rec.raw.replace(rec.barcode, ' ') : rec.raw;
    const a = FuelLocal.amount(raw), seg = norm(raw);
    if (a.grams) return { g: a.grams, conf: 'high' };
    if (PACK.test(seg) && hit.pack) return { g: a.qty * hit.pack, conf: 'medium' };
    if (/\b(tafel|tafeln|tablet)\b/.test(seg)) return { g: a.qty * 100, conf: 'medium' };   // a chocolate bar (Tafel) is 100 g
    if (/\b(bar|bars|riegel|riegels)\b/.test(seg) && hit.pack && hit.pack <= 150) return { g: a.qty * hit.pack, conf: 'medium' };
    if (hit.serving) return { g: a.qty * hit.serving, conf: a.given ? 'medium' : 'low' };
    if (fallback) return { g: fallback, conf: 'low' };
    return { g: a.qty * 100, conf: 'low' };
  }
  function makeItem(rec, hit, fallbackGrams) {
    const { g, conf } = gramsFor(rec, hit, fallbackGrams);
    const it = FuelLocal.custom(rec.raw, g, hit.per100);
    it.confidence = conf;
    it.amount = (hit.store ? '🛒 ' + hit.store.split('/')[0] + ' · ' : '🌐 ') + ((hit.brand && hit.brand.length <= 15 && !norm(hit.name).includes(norm(hit.brand)) ? hit.brand + ' ' : '') + (hit.name || '')).trim().slice(0, 48);
    return it;
  }

  /* improve(result, tr, onStatus): barcodes, unknown foods and specific products -> Open Food Facts. Mutates result. */
  async function improve(r, tr, onStatus) {
    runCount = 0;
    const segs = r._segs || [];
    const jobs = [];
    segs.forEach(s => { if (s.fixed) return; if (s.barcode) jobs.push([0, s]); else if (s.unknown) jobs.push([1, s]); else if (s.extra) jobs.push([2, s]); });
    jobs.sort((a, b) => a[0] - b[0]);
    if (!jobs.length) return r;
    onStatus && onStatus(tr('ol_searching'));
    const used = [], usedStore = []; let busy = false, failed = false, fails = 0;
    for (const [kind, s] of jobs) {
      if (fails >= 2) break;
      try {
        if (kind === 0) {
          const hit = await barcode(s.barcode);
          if (hit) { s.items = [makeItem(s, hit, s.items[0] && s.items[0].grams)]; s.unknown = false; used.push(s.raw); }
        } else if (kind === 1) {
          const q = FuelLocal.cleanQuery(s.raw) || FuelLocal.foodWords(s.raw);
          const hit = (await storeMatch(q)) || await search(q);
          if (hit) { s.items = [makeItem(s, hit)]; s.unknown = false; (hit.store ? usedStore : used).push(s.raw); }
        } else {
          let kinds = (s.keys || []).flatMap(k => FuelLocal.aliasesOf(k));
          // "Snickers", "Monster", "Red Bull" are themselves the food: don't also require a word like "chocolate"
          if (s.extra.split(' ').every(w => kinds.includes(w) || w === 'red' || w === 'bull')) kinds = [];
          const local = FuelLocal.cleanQuery(s.raw) || FuelLocal.foodWords(s.raw);
          const hit = (await storeMatch(local, s.extra, kinds)) || await search(s.extra + ' ' + (s.keys && s.keys[0] || ''), s.extra, kinds);
          if (hit) { const old = s.items.reduce((t, x) => t + (x.grams || 0), 0); s.items = [makeItem(s, hit, old || null)]; (hit.store ? usedStore : used).push(s.raw); }
        }
      } catch (e) {
        if (e && e.message === 'budget') { busy = true; continue; }
        if (kind === 0) continue;
        busy = true; fails++;                            // OFF refuses searches when busy or over its per-minute limit
      }
    }
    r.foods = segs.flatMap(s => s.items);
    const found2 = new Set(used.concat(usedStore));
    r.assumptions = r.assumptions.filter(a => !segs.some(s => found2.has(s.raw) && a === tr('lf_a_unknown', { x: s.raw })));
    if (usedStore.length) r.assumptions.push(tr('ol_store', { x: usedStore.join(', ') }));
    if (used.length) r.assumptions.push(tr('ol_used', { x: used.join(', ') }));
    if (busy && typeof navigator !== 'undefined' && navigator.onLine === false) { failed = true; busy = false; }
    if (failed) r.assumptions.push(tr('ol_fail'));
    else if (busy) r.assumptions.push(tr('ol_busy'));
    return r;
  }
  window.FuelOnline = { search, barcode, improve, storeMatch, storeDB };
})();

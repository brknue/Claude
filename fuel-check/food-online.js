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
  const FIELDS = 'code,product_name,product_name_en,generic_name,brands,nutriments,serving_quantity,product_quantity';
  const PER_RUN = 6, PER_MIN = 8, TTL = 30 * 864e5;
  let runCount = 0;
  const ls = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const cacheGet = k => { const o = ls.get('fc_off2:' + k); return o && Date.now() - o.t < TTL ? o.v : undefined; };
  const cacheSet = (k, v) => ls.set('fc_off2:' + k, { t: Date.now(), v });
  const norm = s => String(s || '').toLowerCase().replace(/ı/g, 'i').replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const num = x => { x = parseFloat(x); return isFinite(x) && x >= 0 ? x : null; };

  function canSearch() {
    if (runCount >= PER_RUN) return false;
    const now = Date.now(), ts = (ls.get('fc_off_ts') || []).filter(t => now - t < 60000);
    return ts.length < PER_MIN;
  }
  function noteSearch() { const now = Date.now(), ts = (ls.get('fc_off_ts') || []).filter(t => now - t < 60000); ts.push(now); ls.set('fc_off_ts', ts); runCount++; }
  async function getJSON(url) {
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
  function wordsHit(qt, hay) { const hw = hay.split(' '); return qt.filter(x => hw.some(w => w === x || (x.length >= 5 && w.length >= 5 && (w.startsWith(x.slice(0, x.length - 1)) || x.startsWith(w.slice(0, w.length - 1)))))).length; }

  /* search(words, mustWords) -> {name, brand, url, per100, serving, pack, branded, n} | null
   * mustWords: words that must all appear in the product's name or brand (brand/product lookups) */
  async function search(words, mustWords) {
    const q = norm(words).split(' ').filter(Boolean).slice(0, 6).join(' ');
    if (q.length < 3) return null;
    const key = q + '|' + (mustWords || '');
    const c = cacheGet(key); if (c !== undefined) return c;
    if (!canSearch()) throw new Error('budget');
    noteSearch();
    const j = await getJSON(BASE + '/cgi/search.pl?' + new URLSearchParams({ search_terms: q, json: '1', page_size: '20', fields: FIELDS }));
    const qt = q.split(' ').filter(x => x.length > 1), must = norm(mustWords || '').split(' ').filter(x => x.length > 1);
    const cands = [];
    for (const h of (j.products || [])) {
      const v = per100(h); if (!v) continue;
      const hay = norm(nameOf(h) + ' ' + (h.brands || ''));
      if (must.length && wordsHit(must, hay) < must.length) continue;
      const score = qt.length ? wordsHit(qt, hay) / qt.length : 0;
      if (score >= (must.length ? 0.6 : 0.5)) cands.push({ h, v, score, name: nameOf(h) });
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
      res = { name: best.name, brand: branded ? String(best.h.brands || '').split(',')[0] : '', n: top.length, branded,
        url: branded && best.h.code ? BASE + '/product/' + best.h.code : BASE + '/cgi/search.pl?search_simple=1&action=process&search_terms=' + encodeURIComponent(q),
        per100: { p: pick('p'), c: pick('c'), f: pick('f'), fib: pick('fib'), sat: pick('sat'), sug: pick('sug'), alc: pick('alc') },
        serving: serv.length ? median(serv) : null, pack: pack.length ? median(pack) : null };
    }
    cacheSet(key, res);
    return res;
  }
  async function barcode(code) {
    const c = cacheGet('bc:' + code); if (c !== undefined) return c;
    const j = await getJSON(BASE + '/api/v2/product/' + encodeURIComponent(code) + '.json?fields=' + FIELDS);
    const h = j && j.product; let res = null;
    if (h) { const v = per100(h); if (v) res = { name: nameOf(h), brand: String(h.brands || '').split(',')[0], url: BASE + '/product/' + code, per100: v, serving: num(h.serving_quantity), pack: num(h.product_quantity), branded: true, n: 1 }; }
    cacheSet('bc:' + code, res);
    return res;
  }

  const PACK = /\b(pack|packs|packet|packung|packchen|paket|tafel|tafeln|tablet|bag|tute|poset|can|dose|kutu|bottle|flasche|sise|tub|becher|jar|glas)\b/;
  function gramsFor(rec, hit, fallback) {
    const a = FuelLocal.amount(rec.raw), seg = norm(rec.raw);
    if (a.grams) return { g: a.grams, conf: 'high' };
    if (PACK.test(seg) && hit.pack) return { g: a.qty * hit.pack, conf: 'medium' };
    if (/\b(bar|bars|riegel|riegels)\b/.test(seg) && hit.pack && hit.pack <= 150) return { g: a.qty * hit.pack, conf: 'medium' };
    if (hit.serving) return { g: a.qty * hit.serving, conf: a.given ? 'medium' : 'low' };
    if (fallback) return { g: fallback, conf: 'low' };
    return { g: a.qty * 100, conf: 'low' };
  }
  function makeItem(rec, hit, fallbackGrams) {
    const { g, conf } = gramsFor(rec, hit, fallbackGrams);
    const it = FuelLocal.custom(rec.raw, g, hit.per100);
    it.confidence = conf;
    it.amount = '🌐 ' + ((hit.brand && !norm(hit.name).includes(norm(hit.brand)) ? hit.brand + ' ' : '') + (hit.name || '')).trim().slice(0, 48);
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
    const used = []; let busy = false, failed = false;
    for (const [kind, s] of jobs) {
      if (failed) break;
      try {
        if (kind === 0) {
          const hit = await barcode(s.barcode);
          if (hit) { s.items = [makeItem(s, hit, s.items[0] && s.items[0].grams)]; s.unknown = false; used.push(s.raw); }
        } else if (kind === 1) {
          const hit = await search(FuelLocal.cleanQuery(s.raw) || FuelLocal.foodWords(s.raw));
          if (hit) { s.items = [makeItem(s, hit)]; s.unknown = false; used.push(s.raw); }
        } else {
          const hit = await search(FuelLocal.cleanQuery(s.raw) || FuelLocal.foodWords(s.raw), s.extra);
          if (hit) { const old = s.items.reduce((t, x) => t + (x.grams || 0), 0); s.items = [makeItem(s, hit, old || null)]; used.push(s.raw); }
        }
      } catch (e) {
        if (e && e.message === 'budget') { busy = true; continue; }
        failed = true;
      }
    }
    r.foods = segs.flatMap(s => s.items);
    const found = new Set(used);
    r.assumptions = r.assumptions.filter(a => !segs.some(s => found.has(s.raw) && a === tr('lf_a_unknown', { x: s.raw })));
    if (used.length) r.assumptions.push(tr('ol_used', { x: used.join(', ') }));
    if (failed) r.assumptions.push(tr('ol_fail'));
    else if (busy) r.assumptions.push(tr('ol_busy'));
    return r;
  }
  window.FuelOnline = { search, barcode, improve };
})();

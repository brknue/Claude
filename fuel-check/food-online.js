/* Fuel Check — online food lookup on Open Food Facts (free, no key, non-profit, millions of products).
 * Used for foods the built-in table doesn't know and for branded/packaged products.
 * Only the food words are sent; results are cached in this browser for 30 days.
 * Data © Open Food Facts contributors, Open Database License (ODbL): https://world.openfoodfacts.org
 */
(function () {
  'use strict';
  const FIELDS = 'code,product_name,product_name_en,generic_name,brands,nutriments,serving_quantity,lang';
  const MAX_REQ = 8;                // Open Food Facts allows about 10 searches per minute
  const TTL = 30 * 864e5;
  let used = 0;
  const cacheGet = k => { try { const o = JSON.parse(localStorage.getItem('fc_off:' + k) || 'null'); return o && Date.now() - o.t < TTL ? o.v : undefined; } catch (e) { return undefined; } };
  const cacheSet = (k, v) => { try { localStorage.setItem('fc_off:' + k, JSON.stringify({ t: Date.now(), v })); } catch (e) {} };
  const norm = s => String(s || '').toLowerCase().replace(/ı/g, 'i').replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const num = x => { x = parseFloat(x); return isFinite(x) && x >= 0 ? x : null; };

  async function fetchJSON(url) {
    if (used >= MAX_REQ) throw new Error('limit');
    used++;
    const r = await fetch(url, { referrerPolicy: 'no-referrer', signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }
  async function searchRaw(q) {
    try {
      const j = await fetchJSON('https://search.openfoodfacts.org/search?' + new URLSearchParams({ q, page_size: '12', fields: FIELDS }));
      if (Array.isArray(j.hits)) return j.hits;
    } catch (e) { if (e.message === 'limit') throw e; }
    const j = await fetchJSON('https://world.openfoodfacts.org/cgi/search.pl?' + new URLSearchParams({ search_terms: q, search_simple: '1', action: 'process', json: '1', page_size: '12', fields: FIELDS }));
    return Array.isArray(j.products) ? j.products : [];
  }
  function per100(p) {
    const n = p.nutriments || {};
    const v = { p: num(n.proteins_100g), c: num(n.carbohydrates_100g), f: num(n.fat_100g), fib: num(n.fiber_100g) || 0, sat: num(n['saturated-fat_100g']) || 0,
      sug: num(n.sugars_100g) || 0, alc: (num(n.alcohol_100g) || 0) * 0.789 };
    if (v.p == null || v.c == null || v.f == null) return null;
    if (v.p + v.c + v.f + v.fib > 101) return null;
    const kcal = num(n['energy-kcal_100g']);
    const est = v.p * 4 + v.c * 4 + v.f * 9 + v.fib * 2 + v.alc * 7;
    if (kcal != null && kcal > 20 && Math.abs(est - kcal) / kcal > 0.35) return null;   // inconsistent entry
    return v;
  }
  function median(arr) { const a = arr.slice().sort((x, y) => x - y), m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }

  /* lookup(query, brand) -> {name, brand, url, per100, serving, n, branded} or null */
  async function lookup(query, brand) {
    const q = norm((brand ? brand + ' ' : '') + query).split(' ').slice(0, 6).join(' ');
    if (q.length < 3) return null;
    const cached = cacheGet(q); if (cached !== undefined) return cached;
    const hits = await searchRaw(q);
    const qt = q.split(' ').filter(x => x.length > 1);
    const cands = [];
    for (const h of hits) {
      const v = per100(h); if (!v) continue;
      const name = h.product_name || h.product_name_en || h.generic_name || '';
      const hay = norm(name + ' ' + (h.brands || ''));
      const hit = qt.filter(x => hay.split(' ').some(w => w === x || (x.length > 4 && w.startsWith(x.slice(0, Math.max(4, x.length - 2)))))).length;
      const branded = !!(brand && norm(h.brands || '').split(' ').includes(norm(brand).split(' ')[0]));
      const score = (qt.length ? hit / qt.length : 0) + (branded ? 1 : 0);
      if (score >= 0.5) cands.push({ h, v, name, score, branded });
    }
    if (!cands.length) { cacheSet(q, null); return null; }
    cands.sort((a, b) => b.score - a.score);
    let res;
    const best = cands[0];
    if (best.branded) {
      res = { name: best.name, brand: best.h.brands || '', url: best.h.code ? 'https://world.openfoodfacts.org/product/' + best.h.code : 'https://world.openfoodfacts.org', per100: best.v, serving: num(best.h.serving_quantity), n: 1, branded: true };
    } else {
      const top = cands.filter(c => c.score >= best.score - 0.2).slice(0, 5);
      const pick = k => median(top.map(c => c.v[k]));
      const servings = top.map(c => num(c.h.serving_quantity)).filter(x => x && x < 1500);
      res = { name: best.name, brand: '', url: 'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&search_terms=' + encodeURIComponent(q), per100: { p: pick('p'), c: pick('c'), f: pick('f'), fib: pick('fib'), sat: pick('sat'), sug: pick('sug'), alc: pick('alc') }, serving: servings.length ? median(servings) : null, n: top.length, branded: false };
    }
    cacheSet(q, res);
    return res;
  }

  /* enrich(result, foodText, tr): adds foods the table didn't know, using Open Food Facts. Mutates result. */
  async function enrichLocal(r, foodText, tr, onStatus) {
    const unknown = (r._unknown || []).slice(0, 6);
    if (!unknown.length) return r;
    onStatus && onStatus(tr('ol_searching'));
    const found = [], failed = [];
    for (const seg of unknown) {
      const words = FuelLocal.foodWords(seg);
      let hit = null;
      try { hit = await lookup(words); } catch (e) { if (e.message === 'limit') break; failed.push(seg); continue; }
      if (!hit) continue;
      const a = FuelLocal.amount(seg);
      const grams = a.grams || a.qty * (hit.serving || 100);
      const it = FuelLocal.custom(seg.trim(), grams, hit.per100);
      it.confidence = a.grams ? 'medium' : 'low'; it.amount = '🌐 ' + (hit.name || words).slice(0, 40);
      r.foods.push(it); found.push(seg.trim());
      r.assumptions = r.assumptions.filter(x => x !== tr('lf_a_unknown', { x: seg }));
    }
    if (found.length) r.assumptions.push(tr('ol_used', { x: found.join(', ') }));
    if (failed.length && !found.length) r.assumptions.push(tr('ol_fail'));
    return r;
  }
  window.FuelOnline = { lookup, enrichLocal, resetBudget: () => { used = 0; } };
})();

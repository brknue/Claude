#!/usr/bin/env node
// Builds fuel-check/data/de-stores.json: popular products sold in German supermarkets and drugstores,
// from Open Food Facts (ODbL). Run by .github/workflows/fuel-stores.yml (monthly), or by hand: node fuel-check/tools/build-stores.mjs
// Respects Open Food Facts' limit of ~10 searches per minute (one request every 7 s) and identifies itself with a User-Agent.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'de-stores.json');
const UA = 'CRB-FuelCheck/1.0 (https://github.com/brknue/claude)';
const STORES = [ // [OFF store tag, short label, pages of 100]
  ['lidl', 'Lidl', 8], ['aldi', 'Aldi', 8], ['rewe', 'Rewe', 6], ['edeka', 'Edeka', 6], ['kaufland', 'Kaufland', 5],
  ['penny', 'Penny', 4], ['netto', 'Netto', 4], ['norma', 'Norma', 2], ['dm', 'dm', 3], ['rossmann', 'Rossmann', 2], ['globus', 'Globus', 2]
];
const FIELDS = 'code,product_name,product_name_de,brands,stores_tags,nutriments,serving_quantity,product_quantity,unique_scans_n';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const num = x => { x = parseFloat(x); return isFinite(x) && x >= 0 ? x : null; };
const r1 = x => Math.round(x * 10) / 10;

function row(p) {
  const n = p.nutriments || {};
  const v = [num(n.proteins_100g), num(n.carbohydrates_100g), num(n.fat_100g), num(n.fiber_100g) || 0, num(n['saturated-fat_100g']) || 0,
    num(n['added-sugars_100g']) != null ? num(n['added-sugars_100g']) : (num(n.sugars_100g) || 0), (num(n.alcohol_100g) || 0) * 0.789];
  if (v[0] == null || v[1] == null || v[2] == null) return null;
  if (v[0] + v[1] + v[2] + v[3] > 101 || v[4] > v[2] + 0.5) return null;
  const kcal = num(n['energy-kcal_100g']), est = v[0] * 4 + v[1] * 4 + v[2] * 9 + v[3] * 2 + v[6] * 7;
  if (kcal != null && kcal > 25 && Math.abs(est - kcal) / kcal > 0.3) return null;
  const name = (p.product_name_de || p.product_name || '').replace(/\s+/g, ' ').trim();
  if (!name || name.length > 90) return null;
  const sq = num(p.serving_quantity), pq = num(p.product_quantity);
  return { code: p.code, name, brand: String(p.brands || '').split(',')[0].trim().slice(0, 40), v: v.map(r1),
    serving: sq && sq < 1500 ? Math.round(sq) : 0, pack: pq && pq < 5000 ? Math.round(pq) : 0, scans: p.unique_scans_n || 0, stores: new Set() };
}

const byCode = new Map(); let req = 0, fails = 0;
for (const [tag, label, pages] of STORES) {
  for (let page = 1; page <= pages; page++) {
    const url = 'https://world.openfoodfacts.org/cgi/search.pl?' + new URLSearchParams({ action: 'process', json: '1', page_size: '100', page: String(page),
      sort_by: 'unique_scans_n', tagtype_0: 'stores', tag_contains_0: 'contains', tag_0: tag,
      tagtype_1: 'countries', tag_contains_1: 'contains', tag_1: 'germany', fields: FIELDS });
    let j = null;
    for (let attempt = 0; attempt < 3 && !j; attempt++) {
      if (req++) await sleep(7000 + attempt * 15000);
      try { const r = await fetch(url, { headers: { 'User-Agent': UA } }); if (r.ok) j = await r.json(); else console.log(label, page, 'HTTP', r.status); }
      catch (e) { console.log(label, page, 'error', e.message); }
    }
    if (!j) { fails++; continue; }
    const prods = j.products || [];
    let added = 0;
    for (const p of prods) {
      const old = byCode.get(p.code), x = old || row(p);
      if (!x) continue;
      x.stores.add(label); if (!old) { byCode.set(p.code, x); added++; }
    }
    console.log(`${label} page ${page}: ${prods.length} products, ${added} new, total ${byCode.size}`);
    if (prods.length < 100) break;
  }
}
const list = [...byCode.values()].sort((a, b) => b.scans - a.scans);
// compact rows: [name, brand, stores, p, c, f, fib, sat, sug, alc, serving, pack, code]
const rows = list.map(x => [x.name, x.brand, [...x.stores].join('/'), ...x.v, x.serving, x.pack, x.code]);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ source: 'Open Food Facts (openfoodfacts.org), ODbL', built: new Date().toISOString().slice(0, 10),
  fields: ['name', 'brand', 'stores', 'protein', 'carbs', 'fat', 'fibre', 'satfat', 'sugar', 'alcohol', 'serving_g', 'pack_g', 'barcode'], rows }));
console.log(`wrote ${rows.length} products (${fails} failed pages) to ${OUT}`);
if (rows.length < 500) process.exit(1);

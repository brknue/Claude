/* Fuel Check — optional AI that runs on the user's own device (WebLLM + WebGPU).
 * No key, no AI company: the model is downloaded once (Hugging Face) and runs in the browser.
 * The AI only reads the free text into items + grams + minutes; nutrients come from the built-in
 * food table (local-engine.js) whenever the food is known, and from the AI only for unknown foods.
 */
(function () {
  'use strict';
  const WEBLLM = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/+esm';
  const MODELS = { 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC': '1 GB', 'Qwen2.5-3B-Instruct-q4f16_1-MLC': '2 GB' };
  let engine = null, engineModel = '', loading = null;

  const supported = () => !!(navigator && navigator.gpu);
  async function load(model, onProgress) {
    if (!MODELS[model]) model = Object.keys(MODELS)[0];
    if (engine && engineModel === model) return engine;
    if (loading) return loading;
    loading = (async () => {
      const webllm = await import(WEBLLM);
      if (engine) { try { await engine.unload(); } catch (e) {} engine = null; }
      engine = await webllm.CreateMLCEngine(model, { initProgressCallback: p => onProgress && onProgress(Math.round((p.progress || 0) * 100)) }, { context_window_size: 4096 });
      engineModel = model; return engine;
    })();
    try { return await loading; } finally { loading = null; }
  }
  function json(txt) { const a = txt.indexOf('{'), b = txt.lastIndexOf('}'); if (a < 0 || b <= a) throw new Error('no JSON'); return JSON.parse(txt.slice(a, b + 1)); }
  async function ask(sys, user, maxTokens) {
    const out = await engine.chat.completions.create({ temperature: 0, max_tokens: maxTokens || 900, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] });
    return json((out.choices && out.choices[0] && out.choices[0].message.content) || '');
  }
  const num = (x, lo, hi) => { x = +x; return isFinite(x) ? Math.min(hi, Math.max(lo, x)) : 0; };

  async function analyze(foodText, actText, ctx, tr, model, onStatus, online) {
    await load(model, p => onStatus && onStatus(tr('od_loading', { p })));
    onStatus && onStatus(tr('od_reading'));
    const read = await ask(
      'You turn a person\'s free-text food and activity diary (any language) into JSON. Split meals into single foods and drinks. ' +
      'For each food give "label" (the person\'s own words), "en" (a short, simple English food name like "boiled egg", "white rice", "beer"), "brand" (the brand or product name if one is mentioned, e.g. "Milka", "Ülker", "Coca-Cola", otherwise "") and "grams" (edible weight as eaten; ml for drinks count as grams; use a typical adult portion if no amount is given). ' +
      'Include cooking oil, butter, sauces and drinks if mentioned. "steps" = step count if given, else null. For other activities give "label", "en" (simple English, e.g. "running", "gym", "cycling") and "minutes" (typical duration if not given). ' +
      'Reply with JSON only: {"foods":[{"label":"","en":"","brand":"","grams":0}],"steps":null,"activities":[{"label":"","en":"","minutes":0}]}',
      'FOOD:\n' + String(foodText).slice(0, 3000) + '\n\nACTIVITY:\n' + (String(actText || '').slice(0, 1500) || '(none)'), 1200);

    const foods = [], unknown = [], fromWeb = [];
    const web = async (q, brand) => { if (!online || !window.FuelOnline) return null; try { return await FuelOnline.lookup(q, brand); } catch (e) { return null; } };
    for (const f of (Array.isArray(read.foods) ? read.foods : []).slice(0, 40)) {
      const label = String(f.label || f.en || '').slice(0, 120), en = String(f.en || f.label || '').slice(0, 80), g = num(f.grams, 0, 3000);
      const brand = String(f.brand || '').slice(0, 60).trim();
      if (!label || !g) continue;
      let it = null;
      if (brand) {                                   // packaged product: its label values are best
        onStatus && onStatus(tr('ol_searching'));
        const h = await web(en, brand);
        if (h && h.branded) { it = FuelLocal.custom(label, g, h.per100); it.confidence = 'medium'; it.amount = '🌐 ' + (h.name + (h.brand ? ' (' + h.brand.split(',')[0] + ')' : '')).slice(0, 48); fromWeb.push(label); }
      }
      if (!it) { it = FuelLocal.lookup(en, g) || FuelLocal.lookup(label, g); if (it) { it.name = label; it.amount = ''; } }
      if (!it) {
        const h = await web(en);
        if (h) { it = FuelLocal.custom(label, g, h.per100); it.confidence = 'low'; it.amount = '🌐 ' + (h.name || en).slice(0, 40); fromWeb.push(label); }
      }
      if (it) foods.push(it); else unknown.push({ label, en, g });
    }
    if (unknown.length) {
      try {
        const nut = await ask('You give typical nutrient values per 100 g of food as eaten, from standard food composition tables (USDA). Reply with JSON only: {"items":[{"en":"","p":0,"c":0,"f":0,"fib":0,"sat":0,"sug":0,"alc":0}]} where p=protein g, c=available carbohydrate g, f=fat g, fib=fibre g, sat=saturated fat g, sug=added/free sugar g, alc=alcohol g.',
          'Foods:\n' + unknown.map(u => '- ' + u.en).join('\n'), 900);
        const list = Array.isArray(nut.items) ? nut.items : [];
        unknown.forEach((u, i) => {
          const n = list.find(x => String(x.en || '').toLowerCase() === u.en.toLowerCase()) || list[i];
          if (!n) return;
          const v = { p: num(n.p, 0, 100), c: num(n.c, 0, 100), f: num(n.f, 0, 100), fib: num(n.fib, 0, 60), sat: num(n.sat, 0, 100), sug: num(n.sug, 0, 100), alc: num(n.alc, 0, 50) };
          if (v.p + v.c + v.f + v.fib + v.alc > 101) return;           // impossible per 100 g: skip rather than guess
          const it = FuelLocal.custom(u.label, u.g, v); it.amount = ''; foods.push(it); u.done = true;
        });
      } catch (e) { /* unknown foods stay uncounted */ }
    }
    let steps = read.steps != null && isFinite(+read.steps) && +read.steps > 0 ? Math.round(+read.steps) : null;
    const activities = []; let strength = false;
    for (const a of (Array.isArray(read.activities) ? read.activities : []).slice(0, 12)) {
      const label = String(a.label || a.en || '').slice(0, 120), en = String(a.en || a.label || ''), min = num(a.minutes, 0, 600);
      const it = FuelLocal.lookupAct(en) || FuelLocal.lookupAct(label);
      if (!it || !min || it.k === 'desk' || (it.k === 'walk' && steps)) continue;
      if (it.strength) strength = true;
      activities.push({ name: label, detail: '', met: it.met, minutes: Math.round(min) });
    }
    if (!foods.length) throw { code: 'local_none' };
    const r = { foods, steps, activities, strength_training: strength, local: true, ondevice: true };
    r.feedback = FuelLocal.feedback(r, ctx, tr);
    r.assumptions = [tr('lf_a_ondevice')];
    if (fromWeb.length) r.assumptions.push(tr('ol_used', { x: fromWeb.join(', ') }));
    unknown.filter(u => !u.done).forEach(u => r.assumptions.push(tr('lf_a_unknown', { x: u.label })));
    foods.forEach(f => delete f._key);
    return r;
  }
  window.FuelAI = { supported, load, analyze, MODELS, isLoaded: m => !!engine && engineModel === m };
})();

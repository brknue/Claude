'use strict';
/* ==========================================================================
   PHYSICA core: shared math/drawing helpers, UI builder, lab shell & loop
   ========================================================================== */
(function () {
  const TAU = Math.PI * 2;

  /* ---------------- Utilities ---------------- */
  const U = (window.U = {
    TAU,
    DEG: Math.PI / 180,
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a, b) => a + Math.random() * (b - a),
    randn() {
      let u = 0, v = 0;
      while (!u) u = Math.random();
      while (!v) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
    },
    fmt(v, d = 2) {
      if (v === undefined || v === null || !isFinite(v)) return '—';
      const a = Math.abs(v);
      if (a !== 0 && (a >= 1e6 || a < 1e-3)) return v.toExponential(Math.max(1, d - 1));
      return v.toFixed(d);
    },
    rrect(ctx, x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },
    /** pre-rendered radial glow sprite (cheap to blit thousands of times) */
    glow(rgb, r, core = 0.18) {
      const s = Math.ceil(r * 2), c = document.createElement('canvas');
      c.width = c.height = s;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      const [R, G, B] = rgb;
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(core, `rgba(${R},${G},${B},1)`);
      gr.addColorStop(Math.min(0.9, core + 0.22), `rgba(${R},${G},${B},0.35)`);
      gr.addColorStop(1, `rgba(${R},${G},${B},0)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, s, s);
      return c;
    },
    /** adds an arrow to the current path */
    arrow(ctx, x1, y1, x2, y2, h = 6) {
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      if (L < 0.5) return;
      const ux = dx / L, uy = dy / L, hh = Math.min(h, L * 0.6);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.moveTo(x2 - ux * hh - uy * hh * 0.55, y2 - uy * hh + ux * hh * 0.55);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2 - ux * hh + uy * hh * 0.55, y2 - uy * hh - ux * hh * 0.55);
    },
    /** wavelength (nm) -> [r,g,b] */
    wl2rgb(w) {
      let r = 0, g = 0, b = 0;
      if (w < 440) { r = -(w - 440) / 60; b = 1; }
      else if (w < 490) { g = (w - 440) / 50; b = 1; }
      else if (w < 510) { g = 1; b = -(w - 510) / 20; }
      else if (w < 580) { r = (w - 510) / 70; g = 1; }
      else if (w < 645) { r = 1; g = -(w - 645) / 65; }
      else { r = 1; }
      let f = 1;
      if (w < 420) f = 0.3 + 0.7 * (w - 380) / 40;
      else if (w > 700) f = 0.3 + 0.7 * (780 - w) / 80;
      const c = (x) => Math.round(255 * Math.pow(U.clamp(x * f, 0, 1), 0.8));
      return [c(r), c(g), c(b)];
    },
    hsl2rgb(h, s, l) {
      h = (((h % 360) + 360) % 360) / 360;
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      const f = (t) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      return [(f(h + 1 / 3) * 255) | 0, (f(h) * 255) | 0, (f(h - 1 / 3) * 255) | 0];
    },
    /** translucent HUD panel drawn on a canvas */
    panel(ctx, x, y, w, h, title) {
      ctx.save();
      U.rrect(ctx, x, y, w, h, 10);
      ctx.fillStyle = 'rgba(7,11,24,0.82)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(140,170,255,0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (title) {
        ctx.fillStyle = '#9fb3e0';
        ctx.font = '600 10.5px "Segoe UI", system-ui, sans-serif';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillText(title.toUpperCase(), x + 10, y + 8);
      }
      ctx.restore();
    },
    /** polyline of a ring buffer (arr length L, n valid samples, oldest at start) */
    series(ctx, arr, n, start, x, y, w, h, min, max) {
      const L = arr.length;
      if (n < 2) return;
      const span = max - min || 1;
      ctx.beginPath();
      for (let k = 0; k < n; k++) {
        const v = arr[(start + k) % L];
        const px = x + (k / (L - 1)) * w;
        const py = y + h - U.clamp((v - min) / span, -0.05, 1.05) * h;
        if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.stroke();
    },
    niceStep(range, target = 8) {
      const raw = Math.max(range, 1e-9) / target;
      const p = Math.pow(10, Math.floor(Math.log10(raw)));
      const f = raw / p;
      return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
    },
    distToSeg(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy;
      let t = L2 ? ((px - x1) * dx + (py - y1) * dy) / L2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    },
  });

  U.Ring = class {
    constructor(n) { this.a = new Float32Array(n); this.n = 0; this.i = 0; }
    push(v) { this.a[this.i] = v; this.i = (this.i + 1) % this.a.length; if (this.n < this.a.length) this.n++; }
    get start() { return this.n < this.a.length ? 0 : this.i; }
    clear() { this.n = 0; this.i = 0; }
    last() { return this.n ? this.a[(this.i - 1 + this.a.length) % this.a.length] : 0; }
    range() {
      let lo = Infinity, hi = -Infinity;
      for (let k = 0; k < this.n; k++) { const v = this.a[k]; if (v < lo) lo = v; if (v > hi) hi = v; }
      return this.n ? [lo, hi] : [0, 1];
    }
    draw(ctx, x, y, w, h, min, max) { U.series(ctx, this.a, this.n, this.start, x, y, w, h, min, max); }
  };

  /* ---------------- DOM helpers ---------------- */
  const $ = (s) => document.querySelector(s);
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ---------------- UI builder (side panel controls) ---------------- */
  function UIBuilder(root) {
    const api = {
      root,
      section(title) { root.appendChild(el('div', 'sec', title)); return api; },
      note(html) { const n = el('div', 'note', html); root.appendChild(n); return n; },
      slider(label, o) {
        const row = el('div', 'ctl slider');
        const head = el('div', 'ctl-head');
        const val = el('span', 'val');
        head.append(el('span', 'lbl', label), val);
        const inp = el('input');
        inp.type = 'range';
        const log = !!o.log;
        const toVal = (pv) => (log ? o.min * Math.pow(o.max / o.min, pv / 1000) : pv);
        const fromVal = (v) => (log ? (1000 * Math.log(v / o.min)) / Math.log(o.max / o.min) : v);
        if (log) { inp.min = 0; inp.max = 1000; inp.step = 1; }
        else { inp.min = o.min; inp.max = o.max; inp.step = o.step != null ? o.step : 0.01; }
        inp.value = fromVal(o.value);
        const fmt = o.fmt || ((v) => String(+v.toFixed(3)));
        const upd = () => {
          const v = toVal(+inp.value);
          val.textContent = fmt(v);
          const p = ((+inp.value - +inp.min) / (+inp.max - +inp.min)) * 100;
          inp.style.setProperty('--p', p + '%');
        };
        inp.addEventListener('input', () => { upd(); if (o.onInput) o.onInput(toVal(+inp.value)); });
        if (o.onChange) inp.addEventListener('change', () => o.onChange(toVal(+inp.value)));
        row.append(head, inp);
        root.appendChild(row);
        upd();
        return {
          el: row,
          get value() { return toVal(+inp.value); },
          set(v, fire) { inp.value = fromVal(v); upd(); if (fire && o.onInput) o.onInput(toVal(+inp.value)); },
        };
      },
      toggle(label, value, onChange) {
        const row = el('div', 'ctl toggle' + (value ? ' on' : ''));
        row.append(el('span', '', label), el('span', 'sw'));
        let v = !!value;
        row.addEventListener('click', () => { v = !v; row.classList.toggle('on', v); onChange && onChange(v); });
        root.appendChild(row);
        return { el: row, get value() { return v; }, set(nv, fire) { v = !!nv; row.classList.toggle('on', v); if (fire && onChange) onChange(v); } };
      },
      select(label, options, value, onChange) {
        const row = el('div', 'ctl sel');
        const s = el('select');
        for (const o of options) {
          const [v, t] = Array.isArray(o) ? o : [o, o];
          const op = el('option', '', t);
          op.value = v;
          s.appendChild(op);
        }
        s.value = value;
        s.addEventListener('change', () => { onChange && onChange(s.value); s.blur(); });
        row.append(el('span', '', label), s);
        root.appendChild(row);
        return { el: row, get value() { return s.value; }, set(v) { s.value = v; } };
      },
      buttons(list) {
        const row = el('div', 'btns');
        const map = {};
        for (const b of list) {
          const btn = el('button', 'btn' + (b.primary ? ' primary' : ''), b.label);
          if (b.title) btn.title = b.title;
          btn.addEventListener('click', () => { btn.blur(); b.onClick && b.onClick(); });
          row.appendChild(btn);
          map[b.id || b.label] = btn;
        }
        root.appendChild(row);
        return map;
      },
      tools(list, value, onChange, cols = 2) {
        const row = el('div', 'tools');
        row.style.gridTemplateColumns = `repeat(${cols},1fr)`;
        const btns = {};
        const setA = (id) => { for (const k in btns) btns[k].classList.toggle('active', k === id); };
        for (const t of list) {
          const b = el('button', 'tool', t.label);
          if (t.title) b.title = t.title;
          b.addEventListener('click', () => { b.blur(); setA(t.id); onChange && onChange(t.id); });
          btns[t.id] = b;
          row.appendChild(b);
        }
        setA(value);
        root.appendChild(row);
        return { el: row, set(id, fire) { setA(id); if (fire && onChange) onChange(id); } };
      },
      group() {
        const g = el('div', 'group');
        root.appendChild(g);
        const sub = UIBuilder(g);
        sub.clear = () => { g.innerHTML = ''; };
        return sub;
      },
    };
    return api;
  }

  /* ---------------- Lab registry ---------------- */
  const Labs = [];
  const app = {
    def: null, lab: null, paused: false, speed: 1,
    W: 1, H: 1, dpr: 1, autoCap: 1.5, fpsEma: 60, slowTime: 0, lastReadout: 0, hintTimer: 0,
  };

  let cv, ctx, stage;
  const env = {
    canvas: null, ctx: null, q: 1, ui: null,
    pointer: { x: 0, y: 0, down: false, button: 0, inside: false },
    get W() { return app.W; },
    get H() { return app.H; },
    get dpr() { return app.dpr; },
    get paused() { return app.paused; },
    get insetBottom() { const b = document.getElementById('alt-btn'); return b && !b.classList.contains('hidden') ? 64 : 0; },
    get narrow() { return app.W < 560; },
    toast,
    hint: showHint,
  };

  function toast(msg, ms = 2400) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), ms);
  }
  function showHint(text) {
    const h = $('#hint');
    if (!text) { h.style.opacity = 0; return; }
    if (IS_TOUCH && app.def && TOUCH_HINTS[app.def.id]) text = TOUCH_HINTS[app.def.id];
    h.textContent = text;
    h.style.opacity = 1;
    clearTimeout(app.hintTimer);
    app.hintTimer = setTimeout(() => (h.style.opacity = 0), 9000);
  }

  function qualityMode() { return $('#quality').value; }
  function computeQ() {
    const m = qualityMode();
    if (m === 'high') return 1;
    if (m === 'medium') return 0.75;
    if (m === 'low') return 0.5;
    const c = navigator.hardwareConcurrency || 4;
    const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    let q = c >= 8 ? 1 : c >= 4 ? 0.75 : 0.5;
    if (mobile) q = Math.min(q, 0.5);
    return q;
  }
  function dprCap() {
    const m = qualityMode(), d = window.devicePixelRatio || 1;
    if (m === 'high') return Math.min(d, 2);
    if (m === 'medium') return Math.min(d, 1.25);
    if (m === 'low') return Math.min(d, 0.75);
    return Math.min(d, app.autoCap);
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    const W = Math.max(50, Math.floor(r.width)), H = Math.max(50, Math.floor(r.height));
    const dpr = dprCap();
    // A width change, or a large height change, means a new layout. Small height-only changes are the
    // mobile address bar sliding in/out: resize the canvas but don't make grid-based labs start over.
    const changed = W !== app.W || Math.abs(H - app.H) > Math.max(140, app.H * 0.22);
    app.W = W; app.H = H; app.dpr = dpr;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    if (app.lab && app.lab.resize) app.lab.resize(changed);
  }

  /* ---------------- Lab lifecycle ---------------- */
  function destroyLab() {
    if (app.lab && app.lab.destroy) app.lab.destroy();
    app.lab = null;
  }
  function buildLab() {
    destroyLab();
    const c = $('#controls');
    c.innerHTML = '';
    $('#readouts').innerHTML = '';
    env.q = computeQ();
    env.ui = UIBuilder(c);
    app.lab = app.def.create(env) || {};
    app.extCap = false;
    resetData();
    renderMissions();
    renderReadouts();
  }
  function enterLab(id) {
    const def = Labs.find((l) => l.id === id);
    if (!def) { showMenu(); return; }
    app.def = def;
    $('#menu').classList.add('hidden');
    $('#lab').classList.remove('hidden');
    document.documentElement.style.setProperty('--acc', def.color);
    const idx = Labs.indexOf(def);
    $('#lab-num').textContent = String(idx + 1).padStart(2, '0');
    $('#lab-title').textContent = def.title;
    $('#lab-sub').textContent = def.subtitle;
    $('#lab-switch').value = def.id;
    setupTouchExtras(def);
    closeMore();
    document.title = def.title + ' — Physica';
    $('#theory').innerHTML = def.theory || '';
    $('#howto').innerHTML = def.howto ? '<h3>How to use</h3><ul>' + def.howto.map((h) => `<li>${h}</li>`).join('') + '</ul>' : '';
    app.paused = false;
    updatePause();
    app.autoCap = Math.min(window.devicePixelRatio || 1, 1.5);
    app.slowTime = 0;
    app.fpsEma = 60;
    destroyLab();
    resize();
    buildLab();
    showHint(def.hint);
  }
  function showMenu() {
    destroyLab();
    app.def = null;
    $('#lab').classList.add('hidden');
    $('#menu').classList.remove('hidden');
    document.documentElement.style.setProperty('--acc', '#38bdf8');
    document.title = 'Physica — Virtual Physics Laboratory';
    resizeMenuBg();
    sizeThumbs();
    updateStars();
  }
  function route() {
    const m = location.hash.match(/^#\/lab\/([\w-]+)/);
    if (m) enterLab(m[1]); else showMenu();
  }
  function go(delta) {
    if (!app.def) return;
    const i = (Labs.indexOf(app.def) + delta + Labs.length) % Labs.length;
    location.hash = '#/lab/' + Labs[i].id;
  }

  function updatePause() {
    const b = $('#btn-pause');
    b.innerHTML = app.paused ? '&#9654;' : '&#10074;&#10074;';
    b.classList.toggle('on', app.paused);
    $('#pausedTag').style.display = app.paused ? 'block' : 'none';
  }
  function resetLab() {
    if (!app.lab) return;
    if (app.lab.reset) app.lab.reset(); else buildLab();
    toast('Lab reset');
  }

  /* ---------------- Live data: readouts, click-to-graph, CSV log ---------------- */
  const data = { t: [], cols: {}, pins: [], t0: 0, last: [] };
  function resetData() { data.t = []; data.cols = {}; data.pins = []; data.last = []; data.t0 = performance.now(); const c = $('#charts'); if (c) c.innerHTML = ''; }
  function renderReadouts() {
    const lab = app.lab;
    if (!lab || !lab.readouts) return;
    const r = lab.readouts();
    if (!r) return;
    data.last = r;
    if (!app.paused) {
      data.t.push((performance.now() - data.t0) / 1000);
      const L = data.t.length;
      for (const [k, v] of r) {
        const n = parseFloat(v);
        let col = data.cols[k];
        if (!col) { col = data.cols[k] = []; while (col.length < L - 1) col.push(NaN); }
        col.push(isFinite(n) ? n : NaN);
      }
      for (const k in data.cols) { const c = data.cols[k]; while (c.length < L) c.push(NaN); }
      if (L > 1600) { data.t.shift(); for (const k in data.cols) data.cols[k].shift(); }
    }
    let h = '';
    r.forEach(([k, v], i) => { h += `<div class="ro${data.pins.includes(k) ? ' pin' : ''}" data-i="${i}" title="Click to graph this value over time"><span>${k}</span><b>${v}</b></div>`; });
    $('#readouts').innerHTML = h;
    drawCharts();
  }
  function togglePin(k) {
    const i = data.pins.indexOf(k);
    if (i >= 0) data.pins.splice(i, 1); else { data.pins.push(k); if (data.pins.length > 3) data.pins.shift(); }
    const box = $('#charts');
    box.innerHTML = '';
    data.pins.forEach(() => { const c = el('canvas', 'chart'); c.width = 600; c.height = 150; box.appendChild(c); });
    drawCharts();
  }
  function drawCharts() {
    const cs = document.querySelectorAll('#charts canvas');
    data.pins.forEach((k, idx) => {
      const c = cs[idx]; if (!c) return;
      const g = c.getContext('2d'), W = c.width, H = c.height, col = data.cols[k] || [];
      g.fillStyle = '#0b1430'; g.fillRect(0, 0, W, H);
      const n = Math.min(col.length, 400), st = col.length - n;
      let lo = Infinity, hi = -Infinity;
      for (let i = st; i < col.length; i++) { const v = col[i]; if (v === v) { if (v < lo) lo = v; if (v > hi) hi = v; } }
      g.font = '22px Consolas, monospace'; g.textBaseline = 'top'; g.textAlign = 'left';
      g.fillStyle = '#9fb3e0'; g.fillText(k, 12, 8);
      if (lo === Infinity) { g.fillStyle = '#6b7aa5'; g.fillText('no numeric data yet', 12, 60); return; }
      const pad = (hi - lo) * 0.1 || Math.abs(hi) * 0.1 || 1;
      lo -= pad; hi += pad;
      g.strokeStyle = (getComputedStyle(document.documentElement).getPropertyValue('--acc') || '#38bdf8').trim(); g.lineWidth = 3; g.beginPath();
      let pen = false;
      for (let i = 0; i < n; i++) {
        const v = col[st + i]; if (v !== v) { pen = false; continue; }
        const x = 10 + (i / Math.max(1, n - 1)) * (W - 20), y = H - 12 - ((v - lo) / (hi - lo)) * (H - 52);
        if (pen) g.lineTo(x, y); else { g.moveTo(x, y); pen = true; }
      }
      g.stroke();
      g.fillStyle = '#6b7aa5'; g.textAlign = 'right';
      g.fillText(U.fmt(hi - pad, 3), W - 10, 8); g.textBaseline = 'bottom'; g.fillText(U.fmt(lo + pad, 3), W - 10, H - 6);
      g.textAlign = 'left';
    });
  }
  function exportCSV() {
    const keys = Object.keys(data.cols);
    if (!data.t.length) { toast('No data logged yet'); return; }
    const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    let out = ['time_s', ...keys].map(q).join(',') + '\n';
    for (let i = 0; i < data.t.length; i++) out += data.t[i].toFixed(2) + ',' + keys.map((k) => { const v = data.cols[k][i]; return v === v ? v : ''; }).join(',') + '\n';
    const a = el('a'); a.href = URL.createObjectURL(new Blob([out], { type: 'text/csv' })); a.download = `physica-${app.def.id}-data.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    toast(`Exported ${data.t.length} samples of ${keys.length} quantities`);
  }

  /* ---------------- Missions (per-lab challenges, auto-checked) ---------------- */
  const mKey = (id) => 'physica-missions-' + id;
  function mLoad(id) { try { return JSON.parse(localStorage.getItem(mKey(id)) || '[]'); } catch (e) { return []; } }
  const missionsOf = (id) => (window.PhysLab.missions && window.PhysLab.missions[id]) || [];
  function renderMissions() {
    const box = $('#tab-missions');
    if (!app.def || !box) return;
    const ms = missionsOf(app.def.id), done = mLoad(app.def.id), nd = ms.filter((m, i) => done[i]).length;
    box.innerHTML = `<h3>Missions <span class="mcount">${nd} / ${ms.length} ★</span></h3><p class="note">Complete these experiments — the lab checks them automatically and saves your stars.</p>` +
      ms.map((m, i) => `<div class="mission${done[i] ? ' done' : ''}"><span class="star">${done[i] ? '★' : '☆'}</span><div><b>${m.t}</b><small>${m.h || ''}</small></div></div>`).join('') +
      (nd ? '<div class="btns"><button class="btn" id="m-reset">Reset this lab\'s stars</button></div>' : '');
    const rb = $('#m-reset');
    if (rb) rb.onclick = () => { localStorage.removeItem(mKey(app.def.id)); renderMissions(); };
    const tab = document.querySelector('.ptab[data-tab="missions"]');
    if (tab) tab.textContent = `Missions ${nd}/${ms.length}`;
  }
  function checkMissions() {
    const lab = app.lab;
    if (!lab || !lab.probe || !app.def) return;
    const ms = missionsOf(app.def.id);
    if (!ms.length) return;
    const done = mLoad(app.def.id);
    if (ms.every((m, i) => done[i])) return;
    let p;
    try { p = lab.probe(); } catch (e) { return; }
    let ch = false;
    ms.forEach((m, i) => {
      if (done[i]) return;
      let ok = false;
      try { ok = !!m.ok(p); } catch (e) { ok = false; }
      if (ok) { done[i] = 1; ch = true; toast('★ Mission complete: ' + m.t, 3800); }
    });
    if (ch) { for (let i = 0; i < ms.length; i++) done[i] = done[i] ? 1 : 0; localStorage.setItem(mKey(app.def.id), JSON.stringify(done)); renderMissions(); }
  }
  function updateStars() {
    document.querySelectorAll('.stars').forEach((e) => {
      const ms = missionsOf(e.dataset.id), done = mLoad(e.dataset.id), nd = ms.filter((m, i) => done[i]).length;
      e.textContent = ms.length ? '★'.repeat(nd) + '☆'.repeat(ms.length - nd) : '';
    });
  }

  /* ---------------- Main loop ---------------- */
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    let rdt = (now - last) / 1000;
    last = now;
    if (rdt > 0.1) rdt = 0.1;
    if (rdt <= 0) rdt = 1 / 60;
    if (!app.lab) {
      if (!$('#menu').classList.contains('hidden')) { drawMenuBg(rdt); drawThumbs(now); }
      return;
    }
    app.fpsEma += (1 / Math.max(rdt, 1e-3) - app.fpsEma) * 0.05;
    if (qualityMode() === 'auto' && !document.hidden) {
      if (app.fpsEma < 40) app.slowTime += rdt; else app.slowTime = 0;
      if (app.slowTime > 1.5 && app.autoCap > 0.6) {
        app.autoCap = Math.max(0.6, app.autoCap - 0.25);
        app.slowTime = 0;
        resize();
        toast('Auto quality: lowering render resolution for smoother frames');
      }
    }
    const lab = app.lab;
    try {
      if (!app.paused && lab.step) lab.step(rdt * app.speed, rdt);
      if (!app.paused && lab.ext && lab.ext.step) lab.ext.step(rdt * app.speed, rdt);
      ctx.setTransform(app.dpr, 0, 0, app.dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      if (lab.draw) lab.draw(ctx, rdt);
      if (lab.ext && lab.ext.draw) { ctx.setTransform(app.dpr, 0, 0, app.dpr, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.setLineDash([]); ctx.textAlign = 'left'; lab.ext.draw(ctx, rdt); }
    } catch (err) {
      console.error(err);
      app.paused = true;
      updatePause();
      toast('Simulation error: ' + err.message);
    }
    if (now - app.lastReadout > 220) {
      app.lastReadout = now;
      renderReadouts();
      checkMissions();
      $('#fps').textContent = `${Math.round(app.fpsEma)} fps · q${env.q} · ${app.dpr.toFixed(2)}x`;
    }
  }

  /* ---------------- Menu background ---------------- */
  const mb = { cv: null, ctx: null, pts: [], W: 0, H: 0 };
  function resizeMenuBg() {
    if (!mb.cv) return;
    mb.W = window.innerWidth; mb.H = window.innerHeight;
    mb.cv.width = mb.W; mb.cv.height = mb.H;
    const n = Math.min(80, Math.round((mb.W * mb.H) / 18000));
    const cols = ['#38bdf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'];
    while (mb.pts.length < n) mb.pts.push({ x: Math.random() * mb.W, y: Math.random() * mb.H, vx: U.rand(-12, 12), vy: U.rand(-12, 12), c: cols[(Math.random() * cols.length) | 0], r: U.rand(1, 2.4) });
    mb.pts.length = n;
  }
  function drawMenuBg(dt) {
    const { ctx: g, W, H, pts } = mb;
    g.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 0) p.x += W; if (p.x > W) p.x -= W;
      if (p.y < 0) p.y += H; if (p.y > H) p.y -= H;
    }
    g.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < 140 * 140) {
          g.strokeStyle = `rgba(130,160,255,${(1 - Math.sqrt(d2) / 140) * 0.16})`;
          g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        }
      }
    }
    for (const p of pts) {
      g.fillStyle = p.c;
      g.globalAlpha = 0.75;
      g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
  }

  /* ---------------- Menu cards with live previews, search & categories ---------------- */
  const cards = [];
  const filter = { cat: 'All', text: '' };
  const catOf = (l) => l.cat || (window.PhysLab.meta && window.PhysLab.meta[l.id]) || 'Other';
  function buildMenu() {
    const grid = $('#lab-grid');
    grid.innerHTML = '';
    cards.length = 0;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { const c = cards.find((k) => k.a === e.target); if (c) c.vis = e.isIntersecting; })) : null;
    Labs.forEach((l, i) => {
      const a = el('a', 'card');
      a.href = '#/lab/' + l.id;
      a.style.setProperty('--c', l.color);
      a.innerHTML = `<canvas class="thumb"></canvas>
        <div class="cbody"><div class="top"><span class="n">LAB ${String(i + 1).padStart(2, '0')} · ${catOf(l)}</span><div class="ic">${l.icon || ''}</div></div>
        <h3>${l.title}</h3><p>${l.subtitle}</p>
        <div class="tags">${(l.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="enter">Enter lab <span>&#8594;</span><b class="stars" data-id="${l.id}"></b></div></div>`;
      grid.appendChild(a);
      const tc = a.querySelector('.thumb');
      const rec = { a, lab: l, cv: tc, g: tc.getContext('2d'), vis: !io, hover: false, drawn: false, w: 0, h: 0 };
      a.addEventListener('pointerenter', () => (rec.hover = true));
      a.addEventListener('pointerleave', () => (rec.hover = false));
      if (io) io.observe(a);
      cards.push(rec);
    });
    // category chips
    const cats = ['All', ...new Set(Labs.map(catOf))];
    const chips = $('#chips');
    chips.innerHTML = '';
    cats.forEach((c) => {
      const b = el('button', 'chip' + (c === filter.cat ? ' active' : ''), c + (c === 'All' ? ` · ${Labs.length}` : ` · ${Labs.filter((l) => catOf(l) === c).length}`));
      b.onclick = () => { filter.cat = c; chips.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === b)); applyFilter(); };
      chips.appendChild(b);
    });
    $('#lab-count').textContent = Labs.length;
    updateStars();
    sizeThumbs();
  }
  function applyFilter() {
    const q = filter.text.trim().toLowerCase();
    let shown = 0;
    for (const c of cards) {
      const l = c.lab;
      const ok = (filter.cat === 'All' || catOf(l) === filter.cat) && (!q || (l.title + ' ' + l.subtitle + ' ' + (l.tags || []).join(' ') + ' ' + catOf(l)).toLowerCase().includes(q));
      c.a.classList.toggle('hidden', !ok);
      if (ok) shown++;
    }
    $('#no-results').classList.toggle('hidden', shown > 0);
  }
  function sizeThumbs() {
    const d = Math.min(window.devicePixelRatio || 1, 1.5);
    for (const c of cards) {
      const w = c.cv.clientWidth || 300, h = c.cv.clientHeight || 118;
      c.w = w; c.h = h; c.cv.width = Math.round(w * d); c.cv.height = Math.round(h * d); c.d = d; c.drawn = false;
    }
  }
  let thumbTick = 0;
  function drawThumbs(now) {
    if (++thumbTick % 2) return;
    const lowPower = computeQ() < 0.75, t = now / 1000, th = window.PhysLab.thumbs || {};
    for (const c of cards) {
      if (!c.vis || !th[c.lab.id] || c.a.classList.contains('hidden')) continue;
      if (lowPower && !c.hover && c.drawn) continue;
      const g = c.g;
      g.setTransform(c.d, 0, 0, c.d, 0, 0);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.lineWidth = 1; g.setLineDash([]);
      g.fillStyle = '#070b18'; g.fillRect(0, 0, c.w, c.h);
      g.save();
      try { th[c.lab.id](g, c.w, c.h, t + Labs.indexOf(c.lab) * 3.3, c.lab.color); } catch (e) { /* preview only */ }
      g.restore();
      c.drawn = true;
    }
  }

  /* ---------------- Wiring ---------------- */

  /* ---------------- Every device: touch, bottom sheet, compact top bar ---------------- */
  const IS_TOUCH = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
  if (IS_TOUCH) document.documentElement.classList.add('touch');
  // What a right-click does in each lab, offered as a toggle button on touch screens
  const ALT_ACTIONS = { electrons: '✥ Move charges', gravity: '✋ Pan view', gas: '❄ Cool instead', matter: '❄ Cool instead', ising: '↓ Paint spin down', cloth: '✂ Cut' };
  // Labs where two fingers mean pan + pinch-zoom
  const PINCH = { gravity: true };
  const TOUCH_HINTS = {
    electrons: 'Touch and hold to spray particles · tap “Move charges” to drag charges around · open the panel below for tools & presets',
    gravity: 'Drag to launch a body (dashed line = predicted path) · two fingers to pan and pinch-zoom · tap a planet to see its orbit',
    ripple: 'Tap to add wave sources · pick Wall or Glass in the panel and drag to draw · try the Double slit preset',
    pendulum: 'Drag a bob to pose the pendulum · tap the chaos map to launch from any pose · try Butterfly mode',
    gas: 'Drag the piston (right wall) to compress · hold anywhere in the box to heat — tap “Cool instead” to cool',
    lorentz: 'Drag to fire a particle (arrow = velocity) · pick the particle and scenario in the panel below',
    optics: 'Drag parts to move them · drag the round handle to rotate · add lenses, prisms and mirrors from the panel',
    fluid: 'Drag through the fluid to stir it and add dye · wind-tunnel presets show vortex streets',
    projectile: 'Drag to aim, let go to fire · pick a projectile and planet in the panel · hit the target!',
    cloth: 'Drag the cloth to pull it — pull hard and it tears · tap “Cut” to slice it · try Flag in wind',
    quantum: 'Tap “Fire packet” in the panel · drag on the plot to draw your own potential · “Measure” collapses the wave',
    blackhole: 'Drag to fire light or matter at the black hole · tools and experiments are in the panel below',
    matter: 'Slide the temperature to melt, boil or freeze · hold to heat a spot — tap “Cool instead” to cool',
    ising: 'Slide the temperature through T_c ≈ 2.27 · drag to paint spins up — tap “Paint spin down” for down',
    string: 'Drag the string and let go to pluck · tap the piano keys to play · turn on Sound in the panel',
  };

  function setupTouchExtras(def) {
    app.alt = false;
    const b = $('#alt-btn');
    const label = IS_TOUCH && ALT_ACTIONS[def.id];
    b.classList.toggle('hidden', !label);
    b.classList.remove('on');
    b.setAttribute('aria-pressed', 'false');
    if (label) b.textContent = label;
  }

  // ---- compact top bar: "more" menu
  function closeMore() { const m = $('#tb-more'); if (m) { m.classList.remove('open'); $('#btn-more').classList.remove('on'); $('#btn-more').setAttribute('aria-expanded', 'false'); } }

  // ---- bottom sheet
  const sheet = { on: false, h: 0, peek: 62 };
  function safeBottom() { const p = $('#safe-probe'); return p ? parseFloat(getComputedStyle(p).paddingBottom) || 0 : 0; }
  function sheetLimits() {
    const ws = $('.workspace').clientHeight || window.innerHeight;
    return { min: sheet.peek, half: Math.round(ws * 0.52), max: Math.round(ws * 0.9) };
  }
  function setSheet(h, animate = true) {
    const P = $('#panel'), L = sheetLimits();
    sheet.h = U.clamp(h, L.min, L.max);
    P.classList.toggle('dragging', !animate);
    P.style.height = sheet.h + 'px';
    P.classList.toggle('peek', sheet.h <= L.min + 4);
  }
  function sheetOpen() { return sheet.on && sheet.h > sheet.peek + 4; }
  function toggleSheet() { const L = sheetLimits(); setSheet(sheetOpen() ? L.min : L.half); }
  function applySheetMode() {
    const mq = window.matchMedia('(max-width: 760px), (max-width: 1100px) and (orientation: portrait)');
    const on = mq.matches;
    sheet.on = on;
    document.body.classList.toggle('sheet', on);
    const P = $('#panel');
    if (on) {
      P.classList.remove('collapsed');
      const hh = $('#sheet-handle').offsetHeight || 22, th = $('.ptabs').offsetHeight || 42;
      sheet.peek = hh + th + safeBottom();
      document.documentElement.style.setProperty('--peek', sheet.peek + 'px');
      setSheet(sheet.h || sheet.peek, false);
    } else {
      P.style.height = '';
      P.classList.remove('peek', 'dragging');
    }
  }
  function initSheet() {
    const probe = el('div'); probe.id = 'safe-probe'; document.body.appendChild(probe);
    const P = $('#panel');
    let drag = null;
    const startDrag = (e) => {
      if (!sheet.on) return;
      drag = { y: e.clientY, h: sheet.h, moved: false, id: e.pointerId, t: performance.now(), target: e.target };
      // the handle captures right away so a fast drag can't escape it (tabs capture only once a drag starts, so taps still switch tabs)
      if (e.currentTarget.id === 'sheet-handle') try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const moveDrag = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dy = drag.y - e.clientY;
      if (!drag.moved && Math.abs(dy) < 7) return;
      if (!drag.moved) { drag.moved = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} }
      setSheet(drag.h + dy, false);
    };
    const endDrag = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      const L = sheetLimits();
      if (d.moved) { P.dataset.justDragged = '1'; setTimeout(() => { delete P.dataset.justDragged; }, 80); }
      if (!d.moved) {
        // a plain tap on the handle toggles; a tap on a tab while closed opens to half
        if (d.target.closest && d.target.closest('#sheet-handle')) toggleSheet();
        else if (!sheetOpen()) setSheet(L.half);
        return;
      }
      const v = (d.y - e.clientY) / Math.max(1, performance.now() - d.t); // px/ms, + = upward fling
      const snaps = [L.min, L.half, L.max];
      let target;
      if (v > 0.6) target = snaps.find((x) => x > sheet.h + 4) || L.max;
      else if (v < -0.6) target = [...snaps].reverse().find((x) => x < sheet.h - 4) || L.min;
      else target = snaps.reduce((a, b) => (Math.abs(b - sheet.h) < Math.abs(a - sheet.h) ? b : a));
      setSheet(target);
    };
    for (const n of [$('#sheet-handle'), $('.ptabs')]) {
      n.addEventListener('pointerdown', startDrag);
      n.addEventListener('pointermove', moveDrag);
      n.addEventListener('pointerup', endDrag);
      n.addEventListener('pointercancel', endDrag);
    }
    // a click that ended a drag must not also switch tabs
    $('.ptabs').addEventListener('click', (e) => { if (P.dataset.justDragged) { e.stopPropagation(); e.preventDefault(); } }, true);
    const mqs = ['(max-width: 760px)', '(max-width: 1100px) and (orientation: portrait)', '(orientation: portrait)'];
    for (const q of mqs) { const m = window.matchMedia(q); (m.addEventListener ? m.addEventListener('change', applySheetMode) : m.addListener(applySheetMode)); }
    window.addEventListener('resize', () => { if (sheet.on) setSheet(sheet.h, false); });
    applySheetMode();
  }

  function start() {
    cv = $('#cv');
    ctx = cv.getContext('2d', { alpha: false });
    stage = $('#stage');
    env.canvas = cv;
    env.ctx = ctx;
    mb.cv = $('#menu-bg');
    mb.ctx = mb.cv.getContext('2d');

    const savedQ = localStorage.getItem('physica-quality');
    if (savedQ) $('#quality').value = savedQ;

    buildMenu();
    resizeMenuBg();

    new ResizeObserver(() => { if (app.def) resize(); }).observe(stage);
    window.addEventListener('resize', () => { resizeMenuBg(); sizeThumbs(); });
    $('#search').addEventListener('input', (e) => { filter.text = e.target.value; applyFilter(); });
    const sw = $('#lab-switch');
    Labs.forEach((l, i) => { const o = el('option', '', String(i + 1).padStart(2, '0') + ' · ' + l.title); o.value = l.id; sw.appendChild(o); });
    sw.onchange = () => { location.hash = '#/lab/' + sw.value; sw.blur(); };
    $('#btn-csv').onclick = (e) => { e.currentTarget.blur(); exportCSV(); };
    $('#readouts').addEventListener('click', (e) => { const t = e.target.closest('.ro'); if (t && data.last[+t.dataset.i]) togglePin(data.last[+t.dataset.i][0]); });
    $('#btn-shot').onclick = (e) => {
      e.currentTarget.blur();
      if (!app.def) return;
      cv.toBlob((b) => {
        if (!b) return;
        const a = el('a'); a.href = URL.createObjectURL(b); a.download = `physica-${app.def.id}-${Date.now()}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast('Screenshot saved');
      });
    };

    const ptr = (e) => {
      const r = cv.getBoundingClientRect();
      const btn = app.alt && e.pointerType !== 'mouse' ? 2 : e.button;
      return { x: e.clientX - r.left, y: e.clientY - r.top, button: btn, shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey, alt: e.altKey, touch: e.pointerType === 'touch' || e.pointerType === 'pen' };
    };
    // labs read e.button / e.shiftKey: hand them a copy where the 2nd-action toggle turns a touch into a right-click
    const evOf = (e, button) => ({ button: button !== undefined ? button : app.alt && e.pointerType !== 'mouse' ? 2 : e.button, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, pointerType: e.pointerType, preventDefault() {} });
    const fingers = new Map();
    let primary = null, pinch = null;
    const labDown = (p, e) => {
      const X = app.lab && app.lab.ext;
      if (X && X.pointerdown && X.pointerdown(p, e) === true) app.extCap = true;
      else if (app.lab && app.lab.pointerdown) app.lab.pointerdown(p, e);
    };
    const labMove = (p, e) => {
      const X = app.lab && app.lab.ext;
      if (X && X.pointermove) X.pointermove(p, e);
      if (!app.extCap && app.lab && app.lab.pointermove) app.lab.pointermove(p, e);
    };
    const labUp = (p, e) => {
      const X = app.lab && app.lab.ext;
      if (app.extCap) { app.extCap = false; if (X && X.pointerup) X.pointerup(p, e); }
      else if (app.lab && app.lab.pointerup) app.lab.pointerup(p, e);
    };
    const pinchMid = () => {
      const [a, b] = [...fingers.values()];
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
    };
    cv.addEventListener('pointerdown', (e) => {
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
      closeMore();
      if (sheet.on && sheetOpen() && IS_TOUCH && e.pointerType !== 'mouse' && sheet.h > sheetLimits().half + 20) setSheet(sheetLimits().half);
      const p = ptr(e);
      fingers.set(e.pointerId, { x: p.x, y: p.y });
      if (primary !== null && e.pointerId !== primary) {
        // second finger: in pinch labs end the one-finger action and switch to pan + zoom
        if (PINCH[app.def && app.def.id] && fingers.size === 2 && !pinch) {
          const last = env.pointer;
          env.pointer.down = false;
          labUp({ x: last.x, y: last.y, button: 0, touch: true, cancel: true }, evOf(e, 0));
          const m = pinchMid();
          pinch = { d: m.d };
          env.pointer.down = true;
          labDown({ x: m.x, y: m.y, button: 2, touch: true }, evOf(e, 2));
        }
        return;
      }
      primary = e.pointerId;
      Object.assign(env.pointer, { x: p.x, y: p.y, down: true, button: p.button, inside: true });
      labDown(p, evOf(e));
    });
    cv.addEventListener('pointermove', (e) => {
      const p = ptr(e);
      if (fingers.has(e.pointerId)) fingers.set(e.pointerId, { x: p.x, y: p.y });
      if (pinch) {
        if (fingers.size < 2) return;
        const m = pinchMid();
        if (app.lab && app.lab.wheel) app.lab.wheel({ x: m.x, y: m.y }, -Math.log(m.d / pinch.d) / 0.0012, evOf(e, 0));
        pinch.d = m.d;
        env.pointer.x = m.x; env.pointer.y = m.y;
        labMove({ x: m.x, y: m.y, button: 2, touch: true }, evOf(e, 2));
        return;
      }
      if (primary !== null && e.pointerId !== primary) return;
      env.pointer.x = p.x; env.pointer.y = p.y; env.pointer.inside = true;
      labMove(p, evOf(e));
    });
    const up = (e) => {
      fingers.delete(e.pointerId);
      if (pinch) {
        if (fingers.size < 2) { const m = { x: env.pointer.x, y: env.pointer.y }; env.pointer.down = false; labUp({ x: m.x, y: m.y, button: 2, touch: true }, evOf(e, 2)); pinch = null; }
        if (fingers.size === 0) primary = null;
        return;
      }
      if (e.pointerId !== primary) return;
      primary = null;
      if (!env.pointer.down) return;
      env.pointer.down = false;
      labUp(ptr(e), evOf(e));
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    // on touch screens there is no hover: keep the last touched spot as "the cursor" for probes and readouts
    cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') env.pointer.inside = false; });
    cv.addEventListener('wheel', (e) => {
      if (app.lab && app.lab.wheel) { e.preventDefault(); app.lab.wheel(ptr(e), e.deltaY, e); }
    }, { passive: false });
    $('#alt-btn').addEventListener('click', (e) => {
      app.alt = !app.alt;
      e.currentTarget.classList.toggle('on', app.alt);
      e.currentTarget.setAttribute('aria-pressed', String(app.alt));
      e.currentTarget.blur();
    });
    $('#hint').addEventListener('click', () => { $('#hint').style.opacity = 0; });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());

    $('#btn-back').onclick = () => { location.hash = '#/'; };
    $('#btn-prev').onclick = () => go(-1);
    $('#btn-next').onclick = () => go(1);
    $('#btn-pause').onclick = (e) => { e.currentTarget.blur(); app.paused = !app.paused; updatePause(); };
    $('#btn-step').onclick = (e) => {
      e.currentTarget.blur();
      if (!app.paused) { app.paused = true; updatePause(); }
      if (app.lab && app.lab.step) app.lab.step((1 / 60) * app.speed, 1 / 60);
      if (app.lab && app.lab.ext && app.lab.ext.step) app.lab.ext.step((1 / 60) * app.speed, 1 / 60);
    };
    $('#btn-reset').onclick = (e) => { e.currentTarget.blur(); resetLab(); };
    $('#speed').onchange = (e) => { app.speed = +e.target.value; e.target.blur(); closeMore(); };
    $('#quality').onchange = (e) => {
      localStorage.setItem('physica-quality', e.target.value);
      e.target.blur();
      app.autoCap = Math.min(window.devicePixelRatio || 1, 1.5);
      if (app.def) { resize(); buildLab(); toast('Quality changed — lab rebuilt'); }
    };
    $('#btn-full').onclick = (e) => {
      e.currentTarget.blur();
      const d = document.documentElement;
      if (!(document.fullscreenElement || document.webkitFullscreenElement)) (d.requestFullscreen || d.webkitRequestFullscreen).call(d);
      else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    };
    $('#btn-panel').onclick = (e) => { e.currentTarget.blur(); if (sheet.on) toggleSheet(); else $('#panel').classList.toggle('collapsed'); };
    $('#btn-more').onclick = (e) => {
      e.stopPropagation(); e.currentTarget.blur();
      const m = $('#tb-more'), open = !m.classList.contains('open');
      m.classList.toggle('open', open); e.currentTarget.classList.toggle('on', open); e.currentTarget.setAttribute('aria-expanded', String(open));
    };
    document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#tb-more') && !e.target.closest('#btn-more')) closeMore(); });
    if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) $('#btn-full').classList.add('hidden');
    initSheet();
    document.querySelectorAll('.ptab').forEach((t) => {
      t.onclick = () => {
        document.querySelectorAll('.ptab').forEach((x) => x.classList.toggle('active', x === t));
        for (const n of ['controls', 'missions', 'theory']) $('#tab-' + n).classList.toggle('hidden', t.dataset.tab !== n);
        if (sheet.on && !sheetOpen()) setSheet(sheetLimits().half);
      };
    });

    window.addEventListener('keydown', (e) => {
      if (!app.def) return;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'SELECT' || (tag === 'INPUT' && e.target.type !== 'range')) return;
      if (e.key === ' ') { e.preventDefault(); app.paused = !app.paused; updatePause(); return; }
      if (e.key === 'Escape') { location.hash = '#/'; return; }
      if (e.key === 'r' || e.key === 'R') { if (!e.ctrlKey && !e.metaKey) { resetLab(); return; } }
      if (e.key === 'h' || e.key === 'H') { if (sheet.on) toggleSheet(); else $('#panel').classList.toggle('collapsed'); return; }
      if (e.key === '[') { go(-1); return; }
      if (e.key === ']') { go(1); return; }
      if (app.lab && app.lab.key) app.lab.key(e);
      if (app.lab && app.lab.ext && app.lab.ext.key) app.lab.ext.key(e);
    });

    window.addEventListener('hashchange', route);
    route();
    requestAnimationFrame((t) => { last = t; frame(t); });
  }

  window.PhysLab = { define(d) { Labs.push(d); }, start, labs: Labs, get current() { return app.lab; } };
})();

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
    const changed = W !== app.W || H !== app.H;
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

  function renderReadouts() {
    const lab = app.lab;
    if (!lab || !lab.readouts) return;
    const r = lab.readouts();
    if (!r) return;
    let h = '';
    for (const [k, v] of r) h += `<div class="ro"><span>${k}</span><b>${v}</b></div>`;
    $('#readouts').innerHTML = h;
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
      ctx.setTransform(app.dpr, 0, 0, app.dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      if (lab.draw) lab.draw(ctx, rdt);
    } catch (err) {
      console.error(err);
      app.paused = true;
      updatePause();
      toast('Simulation error: ' + err.message);
    }
    if (now - app.lastReadout > 220) {
      app.lastReadout = now;
      renderReadouts();
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
        <div class="enter">Enter lab <span>&#8594;</span></div></div>`;
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
      return { x: e.clientX - r.left, y: e.clientY - r.top, button: e.button, shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey, alt: e.altKey };
    };
    cv.addEventListener('pointerdown', (e) => {
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      const p = ptr(e);
      Object.assign(env.pointer, { x: p.x, y: p.y, down: true, button: e.button, inside: true });
      if (app.lab && app.lab.pointerdown) app.lab.pointerdown(p, e);
      e.preventDefault();
    });
    cv.addEventListener('pointermove', (e) => {
      const p = ptr(e);
      env.pointer.x = p.x; env.pointer.y = p.y; env.pointer.inside = true;
      if (app.lab && app.lab.pointermove) app.lab.pointermove(p, e);
    });
    const up = (e) => {
      if (!env.pointer.down) return;
      env.pointer.down = false;
      const p = ptr(e);
      if (app.lab && app.lab.pointerup) app.lab.pointerup(p, e);
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { env.pointer.inside = false; });
    cv.addEventListener('wheel', (e) => {
      if (app.lab && app.lab.wheel) { e.preventDefault(); app.lab.wheel(ptr(e), e.deltaY, e); }
    }, { passive: false });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());

    $('#btn-back').onclick = () => { location.hash = '#/'; };
    $('#btn-prev').onclick = () => go(-1);
    $('#btn-next').onclick = () => go(1);
    $('#btn-pause').onclick = (e) => { e.currentTarget.blur(); app.paused = !app.paused; updatePause(); };
    $('#btn-step').onclick = (e) => {
      e.currentTarget.blur();
      if (!app.paused) { app.paused = true; updatePause(); }
      if (app.lab && app.lab.step) app.lab.step((1 / 60) * app.speed, 1 / 60);
    };
    $('#btn-reset').onclick = (e) => { e.currentTarget.blur(); resetLab(); };
    $('#speed').onchange = (e) => { app.speed = +e.target.value; e.target.blur(); };
    $('#quality').onchange = (e) => {
      localStorage.setItem('physica-quality', e.target.value);
      e.target.blur();
      app.autoCap = Math.min(window.devicePixelRatio || 1, 1.5);
      if (app.def) { resize(); buildLab(); toast('Quality changed — lab rebuilt'); }
    };
    $('#btn-full').onclick = (e) => {
      e.currentTarget.blur();
      if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      else document.exitFullscreen && document.exitFullscreen();
    };
    $('#btn-panel').onclick = (e) => { e.currentTarget.blur(); $('#panel').classList.toggle('collapsed'); };
    document.querySelectorAll('.ptab').forEach((t) => {
      t.onclick = () => {
        document.querySelectorAll('.ptab').forEach((x) => x.classList.toggle('active', x === t));
        $('#tab-controls').classList.toggle('hidden', t.dataset.tab !== 'controls');
        $('#tab-theory').classList.toggle('hidden', t.dataset.tab !== 'theory');
      };
    });

    window.addEventListener('keydown', (e) => {
      if (!app.def) return;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'SELECT' || (tag === 'INPUT' && e.target.type !== 'range')) return;
      if (e.key === ' ') { e.preventDefault(); app.paused = !app.paused; updatePause(); return; }
      if (e.key === 'Escape') { location.hash = '#/'; return; }
      if (e.key === 'r' || e.key === 'R') { if (!e.ctrlKey && !e.metaKey) { resetLab(); return; } }
      if (e.key === 'h' || e.key === 'H') { $('#panel').classList.toggle('collapsed'); return; }
      if (e.key === '[') { go(-1); return; }
      if (e.key === ']') { go(1); return; }
      if (app.lab && app.lab.key) app.lab.key(e);
    });

    window.addEventListener('hashchange', route);
    route();
    requestAnimationFrame((t) => { last = t; frame(t); });
  }

  window.PhysLab = { define(d) { Labs.push(d); }, start, labs: Labs, get current() { return app.lab; } };
})();

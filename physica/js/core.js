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
    /** draws axes, grid and labels for a data plot inside a lab canvas; returns coordinate mappers */
    plot(ctx, x, y, w, h, o) {
      const fs = o.fs || 11, L = x + fs * 4.6, R = x + w - 8, T = y + (o.title ? fs * 1.9 : 8), B = y + h - fs * 2.9;
      const lx = !!o.logx, ly = !!o.logy;
      const fx = (v) => (lx ? Math.log10(Math.max(v, 1e-300)) : v), fy = (v) => (ly ? Math.log10(Math.max(v, 1e-300)) : v);
      const X0 = fx(o.x0), X1 = fx(o.x1), Y0 = fy(o.y0), Y1 = fy(o.y1);
      const sx = (v) => L + ((fx(v) - X0) / (X1 - X0 || 1)) * (R - L), sy = (v) => B - ((fy(v) - Y0) / (Y1 - Y0 || 1)) * (B - T);
      ctx.save();
      ctx.fillStyle = '#17181b'; ctx.fillRect(L, T, R - L, B - T);
      ctx.font = `${fs}px system-ui, sans-serif`; ctx.lineWidth = 1;
      const ticks = (a, b, n, log) => { const out = []; if (log) { for (let k = Math.ceil(a); k <= b; k++) out.push(k); return out; } const st = U.niceStep(b - a, n); for (let v = Math.ceil(a / st) * st; v <= b + st * 1e-6; v += st) out.push(Math.abs(v) < st * 1e-9 ? 0 : v); out.step = st; return out; };
      const lab = (v, log, st) => {
        if (log) return '1e' + Math.round(v);
        if (v === 0) return '0';
        const big = Math.max(Math.abs(v), st || 0);
        if (big >= 1e5 || (st && st < 1e-4)) return v.toExponential(Math.max(0, Math.min(3, Math.round(Math.log10(big / (st || big))))));
        return v.toFixed(st ? Math.max(0, Math.min(6, -Math.floor(Math.log10(st) + 1e-9))) : 2);
      };
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const xt = ticks(X0, X1, Math.max(2, (R - L) / 70), lx), yt = ticks(Y0, Y1, Math.max(2, (B - T) / 46), ly);
      for (const v of xt) { const px = L + ((v - X0) / (X1 - X0 || 1)) * (R - L); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(px, T); ctx.lineTo(px, B); ctx.stroke(); ctx.fillStyle = '#a9adb4'; ctx.fillText(lab(v, lx, xt.step), px, B + 3); }
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (const v of yt) { const py = B - ((v - Y0) / (Y1 - Y0 || 1)) * (B - T); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(L, py); ctx.lineTo(R, py); ctx.stroke(); ctx.fillStyle = '#a9adb4'; ctx.fillText(lab(v, ly, yt.step), L - 4, py); }
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.strokeRect(L + 0.5, T + 0.5, R - L - 1, B - T - 1);
      ctx.fillStyle = '#d4d7dc'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      if (o.xl) ctx.fillText(o.xl, (L + R) / 2, y + h - 1);
      if (o.title) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `600 ${fs}px system-ui, sans-serif`; ctx.fillText(o.title, x + 4, y + 3); }
      if (o.yl) { ctx.save(); ctx.translate(x + fs * 0.9, (T + B) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${fs}px system-ui, sans-serif`; ctx.fillText(o.yl, 0, 0); ctx.restore(); }
      ctx.restore();
      return { sx, sy, L, R, T, B, clip() { ctx.save(); ctx.beginPath(); ctx.rect(L, T, R - L, B - T); ctx.clip(); } };
    },
    /** strokes y = f(x) or arrays inside a plot frame */
    curve(ctx, F, xs, ys, color, width, dash) {
      ctx.strokeStyle = color; ctx.lineWidth = width || 1.6; ctx.setLineDash(dash || []);
      ctx.beginPath(); let pen = false;
      for (let i = 0; i < xs.length; i++) { const px = F.sx(xs[i]), py = F.sy(ys[i]); if (!isFinite(px) || !isFinite(py)) { pen = false; continue; } if (pen) ctx.lineTo(px, py); else { ctx.moveTo(px, py); pen = true; } }
      ctx.stroke(); ctx.setLineDash([]);
    },
    label(ctx, x, y, text, color, align, size) { ctx.fillStyle = color || '#d4d7dc'; ctx.font = `${size || 11}px system-ui, sans-serif`; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y); },
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
  // every control a lab creates is registered here, so experiments can read, sweep and report parameters
  const reg = { params: [], actions: [], section: '' };
  const plainText = (h) => { const d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').trim(); };
  function UIBuilder(root) {
    const api = {
      root,
      section(title) { root.appendChild(el('div', 'sec', title)); reg.section = plainText(title); return api; },
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
        let cur = o.value; // the exact value (typed values are not snapped to the slider grid)
        const upd = () => {
          val.textContent = fmt(cur);
          const p = ((+inp.value - +inp.min) / (+inp.max - +inp.min)) * 100;
          inp.style.setProperty('--p', p + '%');
        };
        inp.addEventListener('input', () => { cur = toVal(+inp.value); upd(); if (o.onInput) o.onInput(cur); });
        if (o.onChange) inp.addEventListener('change', () => o.onChange(cur));
        // click the value to type an exact number
        val.title = 'Click to type an exact value';
        val.classList.add('editable');
        val.addEventListener('click', () => {
          if (val.querySelector('input')) return;
          const box = el('input', 'valedit');
          box.type = 'number'; box.step = 'any'; box.value = +(+cur).toPrecision(8);
          val.textContent = ''; val.appendChild(box); box.focus(); box.select();
          let done = false;
          const commit = (ok) => {
            if (done) return; done = true;
            const v = parseFloat(box.value);
            if (ok && isFinite(v)) {
              const c = Math.min(o.max, Math.max(o.min, v));
              if (c !== v) toast(`Allowed range: ${o.min} … ${o.max}`);
              h.set(c, true);
            } else upd();
          };
          box.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') commit(true); if (e.key === 'Escape') commit(false); });
          box.addEventListener('blur', () => commit(true));
        });
        row.append(head, inp);
        root.appendChild(row);
        upd();
        const h = {
          el: row,
          get value() { return cur; },
          set(v, fire) { cur = +v; inp.value = fromVal(cur); upd(); if (fire && o.onInput) o.onInput(cur); if (fire && o.onChange) o.onChange(cur); },
        };
        reg.params.push({ kind: 'slider', label: plainText(label), section: reg.section, el: row, min: o.min, max: o.max, log: log, step: o.step, get value() { return h.value; }, get text() { return fmt(cur); }, set: (v) => h.set(v, true) });
        return h;
      },
      toggle(label, value, onChange) {
        const row = el('div', 'ctl toggle' + (value ? ' on' : ''));
        row.append(el('span', '', label), el('span', 'sw'));
        let v = !!value;
        row.addEventListener('click', () => { v = !v; row.classList.toggle('on', v); onChange && onChange(v); });
        root.appendChild(row);
        const h = { el: row, get value() { return v; }, set(nv, fire) { if (!!nv === v && fire) return; v = !!nv; row.classList.toggle('on', v); if (fire && onChange) onChange(v); } };
        reg.params.push({ kind: 'toggle', label: plainText(label), section: reg.section, el: row, get value() { return v; }, get text() { return v ? 'on' : 'off'; }, set: (nv) => h.set(nv === true || nv === 'on' || nv === 1 || nv === '1', true) });
        return h;
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
        reg.params.push({ kind: 'select', label: plainText(label), section: reg.section, el: row, get value() { return s.value; }, get text() { return s.options[s.selectedIndex] ? s.options[s.selectedIndex].textContent : s.value; }, set: (v) => { if (s.value === String(v)) return; s.value = v; onChange && onChange(s.value); } });
        return { el: row, get value() { return s.value; }, set(v, fire) { s.value = v; if (fire && onChange) onChange(s.value); } };
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
          if (b.onClick) reg.actions.push({ label: plainText(b.label), el: btn, run: () => b.onClick() });
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
    reg.params.length = 0; reg.actions.length = 0; reg.section = '';
    env.ui = UIBuilder(c);
    app.lab = app.def.create(env) || {};
    app.extCap = false;
    app.simT = 0;
    resetData();
    renderReadouts();
    if (PhysLab.onBuild) PhysLab.onBuild(app.def);
  }
  function enterLab(id) {
    const def = Labs.find((l) => l.id === id);
    if (!def) { showMenu(); return; }
    app.def = def;
    $('#menu').classList.add('hidden');
    $('#lab').classList.remove('hidden');
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
    if (PhysLab.onEnter) PhysLab.onEnter(def);
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
    document.title = 'Physica — Virtual Physics Laboratory';
    if (PhysLab.onMenu) PhysLab.onMenu();
  }
  function route() {
    const m = location.hash.match(/^#\/lab\/([\w-]+)(?:\?(.*))?/);
    if (!m) { showMenu(); return; }
    if (!app.def || app.def.id !== m[1] || !app.lab) enterLab(m[1]);
    if (m[2] && PhysLab.applyQuery) PhysLab.applyQuery(m[2]);
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

  /* ---------------- Live data: readouts, click-to-graph, continuous log (simulation time) ---------------- */
  // A readout value like "12.3 m/s" or "4.1e-3 J" -> { v: 12.3, unit: 'm/s' }
  function parseReading(val) {
    if (typeof val === 'number') return { v: val, unit: '' };
    const s = String(val).trim().replace(/−/g, '-').replace(/×\s*10\^?([-+]?\d+)/, 'e$1');
    const m = s.match(/^([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)\s*(.*)$/);
    if (!m) return { v: NaN, unit: '' };
    let unit = m[2].trim(), v = parseFloat(m[1]);
    // a lone "k" (or "k " before a unit) is the thousands suffix used by some readouts
    if (/^k(\s|$)/.test(unit)) { v *= 1000; unit = unit.slice(1).trim(); }
    if (/[\/]\s*[-+.\d]/.test(unit.replace(/^1\//, '')) || unit.length > 16 || /^([×*+(]|x\s)/.test(unit)) unit = '';
    return { v, unit };
  }
  const data = { t: [], cols: {}, units: {}, pins: [], last: [] };
  const LOG_MAX = 6000;
  function resetData() { data.t = []; data.cols = {}; data.units = {}; data.pins = []; data.last = []; data.lastT = -1; const c = $('#charts'); if (c) c.innerHTML = ''; }
  /** reads the lab's readouts once: [[name, text, value, unit], ...] */
  function sampleReadouts() {
    const lab = app.lab;
    if (!lab || !lab.readouts) return [];
    let r;
    try { r = lab.readouts() || []; } catch (e) { return []; }
    return r.map(([k, v]) => { const p = parseReading(v); return [String(k), String(v), p.v, p.unit]; });
  }
  function logSample(r) {
    if (app.simT === data.lastT) return;
    data.lastT = app.simT;
    data.t.push(app.simT);
    const L = data.t.length;
    for (const [k, , n, unit] of r) {
      let col = data.cols[k];
      if (!col) { col = data.cols[k] = []; while (col.length < L - 1) col.push(NaN); }
      if (unit && !data.units[k]) data.units[k] = unit;
      col.push(isFinite(n) ? n : NaN);
    }
    for (const k in data.cols) { const c = data.cols[k]; while (c.length < L) c.push(NaN); }
    if (L > LOG_MAX) { data.t.shift(); for (const k in data.cols) data.cols[k].shift(); }
  }
  function renderReadouts() {
    const r = sampleReadouts();
    if (!r.length) { $('#readouts').innerHTML = '<div class="note">This lab has no numeric readouts.</div>'; return; }
    data.last = r;
    if (!app.paused) logSample(r);
    let h = '';
    r.forEach(([k, v], i) => { h += `<div class="ro${data.pins.includes(k) ? ' pin' : ''}" data-i="${i}" title="Click to graph this quantity against time"><span>${escHTML(k)}</span><b>${escHTML(v)}</b></div>`; });
    $('#readouts').innerHTML = h;
    drawCharts();
  }
  function togglePin(k) {
    const i = data.pins.indexOf(k);
    if (i >= 0) data.pins.splice(i, 1); else { data.pins.push(k); if (data.pins.length > 3) data.pins.shift(); }
    const box = $('#charts');
    box.innerHTML = '';
    data.pins.forEach(() => { const c = el('canvas', 'chart'); c.width = 640; c.height = 170; box.appendChild(c); });
    drawCharts();
  }
  function drawCharts() {
    const cs = document.querySelectorAll('#charts canvas');
    data.pins.forEach((k, idx) => {
      const c = cs[idx]; if (!c) return;
      const g = c.getContext('2d'), W = c.width, H = c.height, col = data.cols[k] || [];
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
      const n = Math.min(col.length, 500), st = col.length - n;
      let lo = Infinity, hi = -Infinity;
      for (let i = st; i < col.length; i++) { const v = col[i]; if (v === v) { if (v < lo) lo = v; if (v > hi) hi = v; } }
      g.font = '20px system-ui, sans-serif'; g.textBaseline = 'top'; g.textAlign = 'left';
      g.fillStyle = '#333'; g.fillText(k + (data.units[k] ? ` (${data.units[k]})` : ''), 12, 8);
      if (lo === Infinity) { g.fillStyle = '#777'; g.fillText('no numeric data yet', 12, 70); return; }
      const pad = (hi - lo) * 0.1 || Math.abs(hi) * 0.1 || 1;
      lo -= pad; hi += pad;
      g.strokeStyle = '#e3e3e3'; g.lineWidth = 1;
      for (let j = 0; j <= 4; j++) { const y = 40 + (j / 4) * (H - 56); g.beginPath(); g.moveTo(10, y); g.lineTo(W - 10, y); g.stroke(); }
      g.strokeStyle = '#1f5fbf'; g.lineWidth = 2.5; g.beginPath();
      let pen = false;
      for (let i = 0; i < n; i++) {
        const v = col[st + i]; if (v !== v) { pen = false; continue; }
        const x = 10 + (i / Math.max(1, n - 1)) * (W - 20), y = H - 16 - ((v - lo) / (hi - lo)) * (H - 56);
        if (pen) g.lineTo(x, y); else { g.moveTo(x, y); pen = true; }
      }
      g.stroke();
      g.fillStyle = '#555'; g.textAlign = 'right'; g.font = '18px ui-monospace, Consolas, monospace';
      g.fillText('max ' + U.fmt(hi - pad, 4), W - 10, 8); g.textBaseline = 'bottom'; g.fillText('min ' + U.fmt(lo + pad, 4), W - 10, H - 2);
      const t0 = data.t[st], t1 = data.t[data.t.length - 1];
      g.textAlign = 'left'; g.fillText(`t = ${U.fmt(t0, 1)} … ${U.fmt(t1, 1)} s`, 12, H - 2);
    });
  }

  /* ---------------- Main loop ---------------- */
  /** advances the lab by dt simulated seconds (speeds above 4x run several sub-steps per frame) */
  function stepLab(dt, rdt) {
    const lab = app.lab;
    if (!lab) return;
    // while an experiment samples faster than one frame, split the frame so every sample time is honoured
    let k = Math.max(1, Math.ceil(app.speed / 4));
    if (PhysLab.maxStep > 0) k = Math.min(64, Math.max(k, Math.ceil(dt / PhysLab.maxStep - 1e-9)));
    const h = dt / k;
    for (let i = 0; i < k; i++) {
      if (lab.step) lab.step(h, rdt);
      if (lab.ext && lab.ext.step) lab.ext.step(h, rdt);
      app.simT += h;
      if (PhysLab.onStep) PhysLab.onStep(app.simT);
    }
  }
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    let rdt = (now - last) / 1000;
    last = now;
    if (rdt > 0.1) rdt = 0.1;
    if (rdt <= 0) rdt = 1 / 60;
    if (!app.lab) return;
    app.fpsEma += (1 / Math.max(rdt, 1e-3) - app.fpsEma) * 0.05;
    if (qualityMode() === 'auto' && !document.hidden) {
      if (app.fpsEma < 40) app.slowTime += rdt; else app.slowTime = 0;
      if (app.slowTime > 1.5 && app.autoCap > 0.6) {
        app.autoCap = Math.max(0.6, app.autoCap - 0.25);
        app.slowTime = 0;
        resize();
        toast('Auto quality: render resolution lowered for smoother frames');
      }
    }
    const lab = app.lab;
    try {
      if (!app.paused) stepLab(rdt * app.speed, rdt);
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
    if (PhysLab.onFrame) PhysLab.onFrame(now);
    if (now - app.lastReadout > 220) {
      app.lastReadout = now;
      renderReadouts();
      $('#fps').textContent = `${Math.round(app.fpsEma)} fps · t = ${app.simT.toFixed(2)} s`;
    }
  }

  /* ---------------- Menu: plain list of labs, search & categories ---------------- */
  const cards = [];
  const filter = { cat: 'All', text: '' };
  const catOf = (l) => (window.PhysLab.meta && window.PhysLab.meta[l.id]) || l.cat || 'Other';
  const escHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function buildMenu() {
    const grid = $('#lab-grid');
    grid.innerHTML = '';
    cards.length = 0;
    Labs.forEach((l, i) => {
      const a = el('a', 'card');
      a.href = '#/lab/' + l.id;
      a.innerHTML = `<div class="top"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="cat">${catOf(l)}</span></div>
        <h3>${l.title}</h3><p>${l.subtitle}</p>
        <div class="tags">${(l.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}</div>`;
      grid.appendChild(a);
      cards.push({ a, lab: l });
    });
    const cats = ['All', ...new Set(Labs.map(catOf))];
    const chips = $('#chips');
    chips.innerHTML = '';
    cats.forEach((c) => {
      const b = el('button', 'chip' + (c === filter.cat ? ' active' : ''), c + (c === 'All' ? ` (${Labs.length})` : ` (${Labs.filter((l) => catOf(l) === c).length})`));
      b.onclick = () => { filter.cat = c; chips.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === b)); applyFilter(); };
      chips.appendChild(b);
    });
    $('#lab-count').textContent = Labs.length;
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

    const savedQ = localStorage.getItem('physica-quality');
    if (savedQ) $('#quality').value = savedQ;

    const SUB = window.PhysLab.subtitles || {};
    for (const l of Labs) if (SUB[l.id]) l.subtitle = SUB[l.id];
    buildMenu();

    new ResizeObserver(() => { if (app.def) resize(); }).observe(stage);
    $('#search').addEventListener('input', (e) => { filter.text = e.target.value; applyFilter(); });
    const sw = $('#lab-switch');
    Labs.forEach((l, i) => { const o = el('option', '', String(i + 1).padStart(2, '0') + ' · ' + l.title); o.value = l.id; sw.appendChild(o); });
    sw.onchange = () => { location.hash = '#/lab/' + sw.value; sw.blur(); };
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
      stepLab((1 / 60) * app.speed, 1 / 60);
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
        for (const n of ['controls', 'experiment', 'data', 'theory']) $('#tab-' + n).classList.toggle('hidden', t.dataset.tab !== n);
        document.body.classList.toggle('wide-panel', t.dataset.tab === 'data');
        if (!sheet.on) resize();
        if (PhysLab.onTab) PhysLab.onTab(t.dataset.tab);
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

  function showTab(name) { const t = document.querySelector(`.ptab[data-tab="${name}"]`); if (t) t.click(); }
  const PhysLab = (window.PhysLab = window.PhysLab || {});
  Object.assign(PhysLab, {
    define(d) { Labs.push(d); }, start, labs: Labs, get current() { return app.lab; },
    internal: { app, env, data, reg, cv: () => cv, sampleReadouts, parseReading, stepLab, toast, showTab, escHTML, el, updatePause, buildLab, resetLab, sheet: () => sheet },
  });
})();

'use strict';
/* LAB 07 — Light & Optics bench: 2D ray tracer with Snell refraction, dispersion, Fresnel reflection, TIR, mirrors */
PhysLab.define({
  id: 'optics',
  title: 'Light & Optics Bench',
  subtitle: 'A ray-tracing optical table: lenses, prisms, mirrors, fibres and raindrops — with real dispersion.',
  color: '#fb7185',
  tags: ['Optics', 'Ray tracing', 'Dispersion'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><path d="M30 8c6 8 6 40 0 48c-6-8-6-40 0-48z" fill="currentColor" fill-opacity=".15"/><path d="M4 18h26l26 14M4 32h52M4 46h26l26-14"/><circle cx="56" cy="32" r="2.5" fill="currentColor"/></svg>`,
  hint: 'Drag elements to move them · drag the round handle or use the wheel to rotate · add parts from the panel',
  howto: [
    '<b>Click</b> an element to select it, <b>drag</b> to move it.',
    'Rotate the selected element with its <b>round handle</b> or the <b>mouse wheel</b> (Shift = fine).',
    'Add lasers, white-light beams, lenses, prisms, mirrors and screens from the panel; <b>Delete</b> removes the selection.',
    'Turn on <b>Fresnel reflections</b> to see the faint partially reflected rays — they create the rainbow in the raindrop preset.',
  ],
  theory: `
  <h3>Snell's law</h3>
  <div class="eq">n₁ sin θ₁ = n₂ sin θ₂</div>
  <p>Each ray is traced exactly through every surface. Lens and drop surfaces use their analytic curvature, so focusing is precise.</p>
  <h3>Total internal reflection</h3>
  <div class="eq">sin θ_c = n₂ / n₁</div>
  <p>Going from glass into air beyond the critical angle (~41° for n = 1.52), no light escapes: the principle behind optical fibres.</p>
  <h3>Fresnel reflection</h3>
  <div class="eq">R = ½(R_s + R_p),  R_s = ((n₁cosθᵢ − n₂cosθₜ)/(n₁cosθᵢ + n₂cosθₜ))²</div>
  <p>Every interface reflects a little light (~4% for glass at normal incidence), more at grazing angles.</p>
  <h3>Dispersion</h3>
  <div class="eq">n(λ) = n_D + D · ((589 nm / λ)² − 1)   (Cauchy-type)</div>
  <p>Blue light bends more than red. White beams are traced as nine wavelengths from 405 to 685 nm and added together, so prisms and raindrops split them into a spectrum.</p>
  <h3>Lenses &amp; mirrors</h3>
  <div class="eq">1/f = (n − 1)[1/R₁ − 1/R₂ + (n − 1)d / (n R₁R₂)]     f_mirror = R / 2</div>
  <p>The thick-lens maker's equation gives the focal length shown for the selected lens; F markers show the focal points. Real spherical lenses show <b>spherical aberration</b>: edge rays focus closer than central ones.</p>`,

  create(env) {
    const { ui } = env;
    const TAU = U.TAU, DEG = U.DEG;
    const WHITE = [405, 440, 475, 510, 545, 580, 615, 650, 685];
    const S = { disp: 0.025, fresnel: true, gain: 1, maxB: 80 };
    const DEF = {
      laser: { wl: 532, width: 0, count: 1 },
      white: { wl: 0, width: 0, count: 1 },
      point: { wl: 0, count: 36, spread: 360 },
      convex: { R: 220, h: 90, n: 1.52 },
      concave: { R: 200, h: 90, n: 1.52 },
      block: { w: 170, hh: 90, n: 1.52 },
      prism: { s: 170, n: 1.52 },
      drop: { R: 100, n: 1.333 },
      mirror: { h: 90 },
      cmirror: { R: 300, h: 100 },
      screen: { h: 120 },
      grating: { h: 100, d: 1.6 },
      splitter: { h: 80 },
    };
    const NAMES = { laser: 'Laser', white: 'White beam', point: 'Point source', convex: 'Convex lens', concave: 'Concave lens', block: 'Glass block', prism: 'Prism', drop: 'Water drop', mirror: 'Flat mirror', cmirror: 'Concave mirror', screen: 'Screen', grating: 'Diffraction grating', splitter: 'Beam splitter' };
    const isSrc = (e) => e.type === 'laser' || e.type === 'white' || e.type === 'point';
    let els = [], sel = null, dirty = true, dragMode = null, dragOff = [0, 0];
    let layer = document.createElement('canvas'), lctx = layer.getContext('2d');
    let stats = { rays: 0, segs: 0 };

    /* ---------- geometry ---------- */
    function mk(type, x, y, a = 0, o = {}) {
      const e = Object.assign({ type, x, y, a }, DEF[type], o);
      build(e);
      els.push(e);
      return e;
    }
    function build(e) {
      dirty = true;
      const c = Math.cos(e.a), s = Math.sin(e.a);
      const Wd = (lx, ly) => [e.x + lx * c - ly * s, e.y + lx * s + ly * c];
      e.segs = []; e.wpts = null; e.closed = false;
      if (isSrc(e)) { e.br = 22; return; }
      let pts = [], arcs = [], kind = 0, closed = true;
      const arcPts = (cx, R, y0, y1, K, sign) => {
        for (let k = 0; k <= K; k++) {
          const y = y0 + ((y1 - y0) * k) / K;
          pts.push([cx + sign * Math.sqrt(Math.max(0, R * R - y * y)), y]);
          arcs.push(k < K ? [cx, 0] : null);
        }
      };
      switch (e.type) {
        case 'convex': {
          const h = e.h, R = Math.max(e.R, h + 2), sg = R - Math.sqrt(R * R - h * h), t = 2 * sg + 6;
          e.t = t;
          arcPts(t / 2 - R, R, -h, h, 48, 1);
          arcPts(R - t / 2, R, h, -h, 48, -1);
          break;
        }
        case 'concave': {
          const h = e.h, R = Math.max(e.R, h + 2), t0 = 8;
          e.t = t0;
          arcPts(t0 / 2 + R, R, -h, h, 48, -1);
          arcPts(-(t0 / 2 + R), R, h, -h, 48, 1);
          break;
        }
        case 'block': pts = [[-e.w / 2, -e.hh / 2], [e.w / 2, -e.hh / 2], [e.w / 2, e.hh / 2], [-e.w / 2, e.hh / 2]]; arcs = [null, null, null, null]; break;
        case 'prism': { const r = e.s / Math.sqrt(3); for (const d of [-90, 30, 150]) pts.push([r * Math.cos(d * DEG), r * Math.sin(d * DEG)]); arcs = [null, null, null]; break; }
        case 'drop': { const K = 140; for (let k = 0; k < K; k++) { pts.push([e.R * Math.cos((k / K) * TAU), e.R * Math.sin((k / K) * TAU)]); arcs.push([0, 0]); } break; }
        case 'mirror': pts = [[0, -e.h], [0, e.h]]; arcs = [null]; kind = 1; closed = false; break;
        case 'cmirror': { const R = Math.max(e.R, e.h + 2); pts = []; arcs = []; arcPts(R, R, -e.h, e.h, 48, -1); kind = 1; closed = false; break; }
        case 'screen': pts = [[0, -e.h], [0, e.h]]; arcs = [null]; kind = 2; closed = false; break;
        case 'grating': pts = [[0, -e.h], [0, e.h]]; arcs = [null]; kind = 3; closed = false; break;
        case 'splitter': pts = [[0, -e.h], [0, e.h]]; arcs = [null]; kind = 4; closed = false; break;
      }
      const wp = pts.map((p) => Wd(p[0], p[1]));
      e.wpts = wp; e.closed = closed;
      const n = wp.length;
      let A = 0;
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; A += wp[i][0] * wp[j][1] - wp[j][0] * wp[i][1]; }
      const ne = closed ? n : n - 1;
      for (let i = 0; i < ne; i++) {
        const j = (i + 1) % n, [x1, y1] = wp[i], [x2, y2] = wp[j];
        const ex = x2 - x1, ey = y2 - y1, L = Math.hypot(ex, ey) || 1;
        let nx = ey / L, ny = -ex / L;
        if (closed && A < 0) { nx = -nx; ny = -ny; }
        const seg = { x1, y1, x2, y2, nx, ny, kind, el: e, arc: false };
        if (arcs[i]) {
          const [cx, cy] = Wd(arcs[i][0], arcs[i][1]);
          seg.arc = true; seg.cx = cx; seg.cy = cy;
          seg.sg = ((x1 + x2) / 2 - cx) * nx + ((y1 + y2) / 2 - cy) * ny > 0 ? 1 : -1;
        }
        e.segs.push(seg);
      }
      let br = 0;
      for (const p of wp) br = Math.max(br, Math.hypot(p[0] - e.x, p[1] - e.y));
      e.br = br + 2; e.br2 = e.br * e.br;
    }
    const nAt = (e, wl) => e.n + S.disp * ((589 / wl) ** 2 - 1);

    /* ---------- ray tracing ---------- */
    let paths = [], hitPts = [];
    function trace(ox, oy, dx, dy, wl, I, depth, aScale) {
      const pts = [ox, oy], Is = [];
      const optics = els.filter((e) => !isSrc(e));
      for (let bounce = 0; bounce < S.maxB; bounce++) {
        let best = Infinity, seg = null;
        for (const e of optics) {
          const bx = e.x - ox, by = e.y - oy, tc = bx * dx + by * dy, d2 = bx * bx + by * by - tc * tc;
          if (d2 > e.br2) continue;
          if (tc < 0 && bx * bx + by * by > e.br2) continue;
          for (const s of e.segs) {
            const ex = s.x2 - s.x1, ey = s.y2 - s.y1, den = dx * ey - dy * ex;
            if (den > -1e-12 && den < 1e-12) continue;
            const wx = s.x1 - ox, wy = s.y1 - oy;
            const t = (wx * ey - wy * ex) / den;
            if (t <= 1e-4 || t >= best) continue;
            const u = (wx * dy - wy * dx) / den;
            if (u < 0 || u > 1) continue;
            best = t; seg = s;
          }
        }
        if (!seg) { pts.push(ox + dx * 6000, oy + dy * 6000); Is.push(I); break; }
        const hx = ox + dx * best, hy = oy + dy * best;
        pts.push(hx, hy); Is.push(I);
        let nx = seg.nx, ny = seg.ny;
        if (seg.arc) { nx = (hx - seg.cx) * seg.sg; ny = (hy - seg.cy) * seg.sg; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; }
        if (seg.kind === 2) { hitPts.push(hx, hy, wl, I * aScale); break; }
        if (seg.kind === 3) { // diffraction grating: sin(theta_m) = sin(theta_i) + m*lambda/d, orders m = -1, 0, +1
          const sgn = dx * nx + dy * ny < 0 ? -1 : 1, tx = -ny, ty = nx, st = dx * tx + dy * ty;
          if (depth < 3) for (const m of [-1, 1]) { const s2 = st + (m * wl) / (seg.el.d * 1000); if (Math.abs(s2) < 0.999) { const c2 = Math.sqrt(1 - s2 * s2) * sgn; trace(hx, hy, tx * s2 + nx * c2, ty * s2 + ny * c2, wl, I * 0.32, depth + 1, aScale); } }
          I *= 0.36; ox = hx; oy = hy; continue;
        }
        if (seg.kind === 4) { // 50/50 beam splitter
          const dn = dx * nx + dy * ny;
          if (depth < 4) trace(hx, hy, dx - 2 * dn * nx, dy - 2 * dn * ny, wl, I * 0.5, depth + 1, aScale);
          I *= 0.5; ox = hx; oy = hy; continue;
        }
        if (seg.kind === 1) {
          const dn = dx * nx + dy * ny;
          dx -= 2 * dn * nx; dy -= 2 * dn * ny; I *= 0.96;
        } else {
          const ng = nAt(seg.el, wl);
          let dn = dx * nx + dy * ny, n1, n2, Nx, Ny;
          if (dn < 0) { n1 = 1; n2 = ng; Nx = nx; Ny = ny; } else { n1 = ng; n2 = 1; Nx = -nx; Ny = -ny; }
          const cosi = -(dx * Nx + dy * Ny), eta = n1 / n2, k = 1 - eta * eta * (1 - cosi * cosi);
          const rdx = dx + 2 * cosi * Nx, rdy = dy + 2 * cosi * Ny;
          if (k < 0) { dx = rdx; dy = rdy; }
          else {
            const cost = Math.sqrt(k);
            if (S.fresnel) {
              const rs = ((n1 * cosi - n2 * cost) / (n1 * cosi + n2 * cost)) ** 2, rp = ((n1 * cost - n2 * cosi) / (n1 * cost + n2 * cosi)) ** 2;
              const Rf = 0.5 * (rs + rp);
              if (depth < 3 && Rf * I > 0.008) trace(hx, hy, rdx, rdy, wl, I * Rf, depth + 1, aScale);
              I *= 1 - Rf;
            }
            dx = eta * dx + (eta * cosi - cost) * Nx; dy = eta * dy + (eta * cosi - cost) * Ny;
            const l = Math.hypot(dx, dy); dx /= l; dy /= l;
          }
        }
        ox = hx; oy = hy;
        if (I < 0.004) break;
      }
      paths.push({ pts, Is, wl, aScale });
      stats.segs += Is.length;
    }

    function retrace() {
      paths = []; hitPts = []; stats = { rays: 0, segs: 0 };
      for (const s of els) {
        if (!isSrc(s)) continue;
        const wls = s.wl > 0 ? [s.wl] : WHITE;
        const aScale = s.wl > 0 ? 1 : 2.4 / WHITE.length;
        const dx = Math.cos(s.a), dy = Math.sin(s.a);
        if (s.type === 'point') {
          const n = Math.round(s.count), full = s.spread >= 359;
          for (let k = 0; k < n; k++) {
            const ang = s.a + (full ? (k / n) * TAU : ((k + 0.5) / n - 0.5) * s.spread * DEG);
            for (const wl of wls) trace(s.x, s.y, Math.cos(ang), Math.sin(ang), wl, 1, 0, aScale);
            stats.rays++;
          }
        } else {
          const n = s.width > 0 ? Math.max(1, Math.round(s.count)) : 1;
          for (let k = 0; k < n; k++) {
            const off = n > 1 ? (k / (n - 1) - 0.5) * s.width : 0;
            const ox = s.x - dy * off + dx * 16, oy = s.y + dx * off + dy * 16;
            for (const wl of wls) trace(ox, oy, dx, dy, wl, 1, 0, aScale);
            stats.rays++;
          }
        }
      }
      // render rays to cached layer
      const W = env.W, H = env.H, dpr = env.dpr;
      if (layer.width !== Math.round(W * dpr) || layer.height !== Math.round(H * dpr)) { layer.width = Math.round(W * dpr); layer.height = Math.round(H * dpr); }
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.clearRect(0, 0, W, H);
      lctx.globalCompositeOperation = 'lighter';
      lctx.lineCap = 'round';
      for (const pass of [0, 1]) {
        lctx.lineWidth = pass ? 1.3 : 4.5;
        for (const p of paths) {
          const [r, g, b] = U.wl2rgb(p.wl);
          let k = 0;
          while (k < p.Is.length) {
            const I = p.Is[k];
            let k2 = k;
            while (k2 + 1 < p.Is.length && p.Is[k2 + 1] === I) k2++;
            const a = Math.min(1, I * p.aScale * S.gain * (pass ? 0.9 : 0.12));
            if (a > 0.003) {
              lctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
              lctx.beginPath();
              lctx.moveTo(p.pts[k * 2], p.pts[k * 2 + 1]);
              for (let j = k; j <= k2; j++) lctx.lineTo(p.pts[j * 2 + 2], p.pts[j * 2 + 3]);
              lctx.stroke();
            }
            k = k2 + 1;
          }
        }
      }
      for (let i = 0; i < hitPts.length; i += 4) {
        const [r, g, b] = U.wl2rgb(hitPts[i + 2]);
        const gr = lctx.createRadialGradient(hitPts[i], hitPts[i + 1], 0, hitPts[i], hitPts[i + 1], 9);
        gr.addColorStop(0, `rgba(${r},${g},${b},${Math.min(1, hitPts[i + 3] * S.gain * 1.4)})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
        lctx.fillStyle = gr; lctx.fillRect(hitPts[i] - 9, hitPts[i + 1] - 9, 18, 18);
      }
      lctx.globalCompositeOperation = 'source-over';
      dirty = false;
    }

    /* ---------- selection & props ---------- */
    function pick(p) {
      for (let i = els.length - 1; i >= 0; i--) {
        const e = els[i];
        if (isSrc(e)) { if (Math.hypot(p.x - e.x, p.y - e.y) < 20) return e; continue; }
        if ((p.x - e.x) ** 2 + (p.y - e.y) ** 2 > (e.br + 10) ** 2) continue;
        if (e.closed && inPoly(p.x, p.y, e.wpts)) return e;
        for (const s of e.segs) if (U.distToSeg(p.x, p.y, s.x1, s.y1, s.x2, s.y2) < 8) return e;
      }
      return null;
    }
    function inPoly(x, y, pts) {
      let c = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    }
    const handlePos = (e) => [e.x + Math.cos(e.a) * (e.br + 22), e.y + Math.sin(e.a) * (e.br + 22)];
    function focal(e) {
      const n = e.n, R = e.R, d = e.t || 0;
      if (e.type === 'convex') return 1 / ((n - 1) * (2 / R - ((n - 1) * d) / (n * R * R)));
      if (e.type === 'concave') return 1 / ((n - 1) * (-2 / R - ((n - 1) * d) / (n * R * R)));
      if (e.type === 'cmirror') return R / 2;
      return null;
    }

    let propsUI;
    function select(e) {
      sel = e;
      propsUI.clear();
      if (!e) { propsUI.note('Click an element on the bench to edit it.'); return; }
      propsUI.section('Selected: ' + NAMES[e.type]);
      const set = (k) => (v) => { e[k] = v; build(e); };
      if (e.type === 'laser' || e.type === 'white' || e.type === 'point') {
        propsUI.toggle('White light', e.wl === 0, (v) => { e.wl = v ? 0 : 532; build(e); select(e); });
        if (e.wl > 0) propsUI.slider('Wavelength', { min: 400, max: 690, step: 1, value: e.wl, fmt: (v) => v + ' nm', onInput: set('wl') });
        if (e.type === 'point') {
          propsUI.slider('Rays', { min: 4, max: 120, step: 1, value: e.count, fmt: (v) => v + '', onInput: set('count') });
          propsUI.slider('Spread', { min: 5, max: 360, step: 1, value: e.spread, fmt: (v) => v + '°', onInput: set('spread') });
        } else {
          propsUI.slider('Beam width', { min: 0, max: 360, step: 1, value: e.width, fmt: (v) => (v ? v + ' px' : 'single ray'), onInput: set('width') });
          propsUI.slider('Rays in beam', { min: 1, max: 41, step: 1, value: e.count, fmt: (v) => v + '', onInput: set('count') });
        }
      }
      if (e.type === 'convex' || e.type === 'concave') {
        propsUI.slider('Surface radius R', { min: 60, max: 900, step: 1, value: e.R, fmt: (v) => v + ' px', onInput: (v) => { e.R = Math.max(v, e.h + 2); build(e); } });
        propsUI.slider('Aperture (half-height)', { min: 20, max: 200, step: 1, value: e.h, fmt: (v) => v + ' px', onInput: (v) => { e.h = Math.min(v, e.R - 2); build(e); } });
      }
      if (e.type === 'block') {
        propsUI.slider('Width', { min: 20, max: 900, step: 1, value: e.w, fmt: (v) => v + ' px', onInput: set('w') });
        propsUI.slider('Height', { min: 10, max: 400, step: 1, value: e.hh, fmt: (v) => v + ' px', onInput: set('hh') });
      }
      if (e.type === 'prism') propsUI.slider('Side length', { min: 40, max: 400, step: 1, value: e.s, fmt: (v) => v + ' px', onInput: set('s') });
      if (e.type === 'drop') propsUI.slider('Radius', { min: 20, max: 300, step: 1, value: e.R, fmt: (v) => v + ' px', onInput: set('R') });
      if (e.type === 'grating') propsUI.slider('Line spacing d', { min: 0.8, max: 6, step: 0.05, value: e.d, fmt: (v) => v.toFixed(2) + ' µm  (' + Math.round(1000 / v) + ' lines/mm)', onInput: set('d') });
      if (e.type === 'mirror' || e.type === 'screen' || e.type === 'grating' || e.type === 'splitter') propsUI.slider('Half-length', { min: 10, max: 400, step: 1, value: e.h, fmt: (v) => v + ' px', onInput: set('h') });
      if (e.type === 'cmirror') {
        propsUI.slider('Radius of curvature R', { min: 80, max: 1400, step: 1, value: e.R, fmt: (v) => v + ' px', onInput: (v) => { e.R = Math.max(v, e.h + 2); build(e); } });
        propsUI.slider('Half-aperture', { min: 20, max: 300, step: 1, value: e.h, fmt: (v) => v + ' px', onInput: (v) => { e.h = Math.min(v, e.R - 2); build(e); } });
      }
      if (e.n !== undefined) propsUI.slider('Refractive index n (589 nm)', { min: 1, max: 2.6, step: 0.005, value: e.n, fmt: (v) => v.toFixed(3), onInput: set('n') });
      propsUI.slider('Rotation', { min: -180, max: 180, step: 0.5, value: Math.round((Math.atan2(Math.sin(e.a), Math.cos(e.a)) / DEG) * 2) / 2, fmt: (v) => v + '°', onInput: (v) => { e.a = v * DEG; build(e); } });
      propsUI.buttons([
        { label: 'Duplicate', onClick: () => { const c = mk(e.type, e.x + 30, e.y + 30, e.a, JSON.parse(JSON.stringify(strip(e)))); select(c); } },
        { label: 'Delete', onClick: () => { els = els.filter((x) => x !== e); dirty = true; select(null); } },
      ]);
    }
    const strip = (e) => { const o = {}; for (const k in DEF[e.type]) o[k] = e[k]; return o; };

    /* ---------- presets ---------- */
    function preset(name) {
      els = []; sel = null;
      const W = env.W, H = env.H, cy = H / 2;
      S.gain = 1;
      if (name === 'lens') {
        mk('white', W * 0.08, cy, 0, { width: 150, count: 13 });
        const L = mk('convex', W * 0.4, cy, 0, { R: Math.min(320, W * 0.3), h: Math.min(100, H * 0.3) });
        mk('screen', Math.min(W - 30, W * 0.4 + focal(L) * 1.02), cy, 0, { h: 110 });
      } else if (name === 'prism') {
        S.disp = 0.045; dispSl.set(S.disp);
        const P = mk('prism', W * 0.45, cy, 0, { s: Math.min(240, H * 0.55) });
        const r = P.s / Math.sqrt(3), mx = P.x + (r * Math.cos(150 * DEG)) / 2, my = P.y + (r * Math.sin(150 * DEG) - r) / 2;
        const a = -0.32, x0 = W * 0.08;
        mk('white', x0, my - Math.tan(a) * (mx - x0), a, { width: 0, count: 1 });
        mk('screen', W * 0.86, cy + 40, 0, { h: Math.min(220, H * 0.4) });
      } else if (name === 'rainbow') {
        S.disp = 0.03; dispSl.set(S.disp); S.fresnel = true; fresT.set(true); S.gain = 5; gainSl.set(5);
        const R = Math.min(W, H) * 0.24;
        mk('drop', W * 0.62, cy, 0, { R });
        mk('white', W * 0.1, cy - R * 0.62, 0, { width: R * 0.7, count: 22 });
      } else if (name === 'fiber') {
        const w = Math.min(W * 0.72, 900);
        mk('block', W / 2, cy, 0, { w, hh: 46 });
        const a = 0.42;
        mk('laser', W / 2 - w / 2 - 70, cy - 70 * Math.tan(a) + 6, a, { wl: 640, width: 0 });
      } else if (name === 'telescope') {
        const f1 = W * 0.36, f2 = W * 0.12, n = 1.52;
        const R1 = 2 * (n - 1) * f1, R2 = 2 * (n - 1) * f2;
        const x1 = W * 0.22;
        mk('laser', W * 0.04, cy, 0, { wl: 600, width: 130, count: 11 });
        const L1 = mk('convex', x1, cy, 0, { R: R1, h: Math.min(90, R1 - 4) });
        const L2 = mk('convex', x1 + focal(L1), cy, 0, { R: R2, h: Math.min(80, R2 * 0.75) });
        L2.x = x1 + focal(L1) + focal(L2); build(L2);
      } else if (name === 'mirror') {
        const R = W * 0.6;
        mk('cmirror', W * 0.82, cy, 0, { R, h: Math.min(H * 0.38, R * 0.6) });
        mk('white', W * 0.06, cy, 0, { width: Math.min(H * 0.6, R * 0.9), count: 15 });
      } else if (name === 'sandbox') {
        mk('laser', W * 0.1, cy, 0, { wl: 532 });
        mk('concave', W * 0.35, cy, 0, {});
        mk('block', W * 0.6, cy - 60, 0.4, {});
        mk('mirror', W * 0.82, cy, 0.3, {});
      }
      dirty = true;
      select(null);
    }

    /* ---------- UI ---------- */
    ui.section('Setups');
    ui.buttons([
      { label: 'Converging lens', onClick: () => preset('lens') },
      { label: 'Prism spectrum', onClick: () => preset('prism') },
      { label: 'Rainbow drop', onClick: () => preset('rainbow') },
      { label: 'Optical fibre (TIR)', onClick: () => preset('fiber') },
      { label: 'Telescope', onClick: () => preset('telescope') },
      { label: 'Concave mirror', onClick: () => preset('mirror') },
      { label: 'Sandbox', onClick: () => preset('sandbox') },
    ]);
    ui.section('Add to bench');
    ui.buttons(Object.keys(DEF).map((t) => ({ label: '+ ' + NAMES[t], onClick: () => { const e = mk(t, env.W / 2 + U.rand(-40, 40), env.H / 2 + U.rand(-40, 40), 0); select(e); } })));
    ui.section('Physics');
    const dispSl = ui.slider('Dispersion strength D', { min: 0, max: 0.08, step: 0.001, value: S.disp, fmt: (v) => v.toFixed(3), onInput: (v) => { S.disp = v; dirty = true; } });
    const fresT = ui.toggle('Fresnel partial reflections', S.fresnel, (v) => { S.fresnel = v; dirty = true; });
    const gainSl = ui.slider('Ray brightness', { min: 0.3, max: 10, value: S.gain, log: true, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { S.gain = v; dirty = true; } });
    propsUI = ui.group();

    preset('lens');

    /* ===== v3 extras ===== */
    function gratingSetup() {
      els = []; sel = null;
      const W = env.W, H = env.H;
      S.gain = 1.8; gainSl.set(1.8);
      mk('white', W * 0.08, H / 2, 0, { width: 0, count: 1 });
      mk('grating', W * 0.38, H / 2, 0, { h: 110, d: 1.6 });
      mk('screen', W * 0.88, H / 2, 0, { h: Math.min(360, H * 0.47) });
      dirty = true; select(null);
    }
    function interferometer() {
      els = []; sel = null;
      const W = env.W, H = env.H, cy = H / 2, arm = Math.min(220, H * 0.34);
      S.gain = 1.5; gainSl.set(1.5);
      mk('laser', W * 0.1, cy, 0, { wl: 532, width: 0 });
      mk('splitter', W * 0.5, cy, Math.PI / 4, { h: 60 });
      mk('mirror', W * 0.5 + arm * 1.3, cy, 0, { h: 60 });
      mk('mirror', W * 0.5, cy - arm, Math.PI / 2, { h: 60 });
      mk('screen', W * 0.5, cy + arm, Math.PI / 2, { h: 70 });
      dirty = true; select(null);
    }
    function periscope() {
      els = []; sel = null;
      const W = env.W, H = env.H;
      mk('white', W * 0.08, H * 0.28, 0, { width: 60, count: 7 });
      mk('mirror', W * 0.45, H * 0.28, -Math.PI / 4, { h: 70 });
      mk('mirror', W * 0.45, H * 0.72, -Math.PI / 4, { h: 70 });
      mk('convex', W * 0.66, H * 0.72, 0, { R: 240, h: 70 });
      mk('screen', W * 0.9, H * 0.72, 0, { h: 90 });
      dirty = true; select(null);
    }
    ui.section('More setups');
    ui.buttons([
      { label: '🌈 Grating spectrometer', primary: true, onClick: gratingSetup },
      { label: 'Michelson layout', onClick: interferometer },
      { label: 'Periscope', onClick: periscope },
    ]);
    ui.note('New parts in “Add to bench”: a <b>diffraction grating</b> (splits each colour into orders by sin θ = mλ/d) and a 50/50 <b>beam splitter</b>.');
    const ext = {};

    return {
      ext,
      probe() {
        let bx = 0, by = 0, bn = 0, rx = 0, ry = 0, rn = 0;
        for (let i = 0; i < hitPts.length; i += 4) { const wl = hitPts[i + 2]; if (wl < 460) { bx += hitPts[i]; by += hitPts[i + 1]; bn++; } else if (wl > 630) { rx += hitPts[i]; ry += hitPts[i + 1]; rn++; } }
        return { n: els.length, types: [...new Set(els.map((e) => e.type))], spread: bn && rn ? Math.hypot(bx / bn - rx / rn, by / bn - ry / rn) : 0 };
      },
      step() {},
      draw(ctx) {
        const W = env.W, H = env.H;
        if (dirty) retrace();
        ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(120,140,190,0.13)';
        for (let y = 20; y < H; y += 40) for (let x = 20; x < W; x += 40) ctx.fillRect(x - 1, y - 1, 2, 2);
        // optical elements (below rays)
        for (const e of els) {
          if (isSrc(e) || !e.wpts) continue;
          ctx.beginPath();
          e.wpts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
          if (e.closed) {
            ctx.closePath();
            const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.br);
            const a = 0.08 + (e.n - 1) * 0.12;
            g.addColorStop(0, `rgba(170,215,255,${a * 0.6})`); g.addColorStop(1, `rgba(150,200,255,${a * 1.4})`);
            ctx.fillStyle = g; ctx.fill();
            ctx.strokeStyle = 'rgba(180,220,255,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
          } else if (e.type === 'grating' || e.type === 'splitter') {
            ctx.strokeStyle = e.type === 'grating' ? 'rgba(250,204,21,0.95)' : 'rgba(125,211,252,0.95)'; ctx.lineWidth = 3.5;
            ctx.setLineDash(e.type === 'grating' ? [2, 3] : [9, 4]); ctx.stroke(); ctx.setLineDash([]);
          } else if (e.type === 'screen') {
            ctx.strokeStyle = '#2b3447'; ctx.lineWidth = 7; ctx.stroke();
            ctx.strokeStyle = '#4b5873'; ctx.lineWidth = 2; ctx.stroke();
          } else {
            ctx.strokeStyle = '#3a4052'; ctx.lineWidth = 7; ctx.stroke();
            ctx.strokeStyle = '#e6edf8'; ctx.lineWidth = 2.5; ctx.stroke();
          }
        }
        ctx.drawImage(layer, 0, 0, W, H);
        // sources
        for (const e of els) {
          if (!isSrc(e)) continue;
          ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a);
          const col = e.wl > 0 ? U.wl2rgb(e.wl) : [255, 255, 255];
          if (e.type === 'point') {
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
            g.addColorStop(0, '#fff'); g.addColorStop(0.4, `rgba(${col},0.9)`); g.addColorStop(1, `rgba(${col},0)`);
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill();
          } else {
            const g = ctx.createLinearGradient(0, -9, 0, 9);
            g.addColorStop(0, '#5b6478'); g.addColorStop(0.5, '#a6b0c6'); g.addColorStop(1, '#3d4456');
            ctx.fillStyle = g; U.rrect(ctx, -22, -9, 36, 18, 4); ctx.fill();
            ctx.fillStyle = `rgb(${col})`; ctx.fillRect(12, -4, 5, 8);
            if (e.width > 0) { ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(16, -e.width / 2); ctx.lineTo(16, e.width / 2); ctx.stroke(); ctx.setLineDash([]); }
          }
          ctx.restore();
        }
        // selection
        if (sel) {
          ctx.strokeStyle = 'rgba(251,113,133,0.8)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(sel.x, sel.y, sel.br + 6, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          const [hx, hy] = handlePos(sel);
          ctx.beginPath(); ctx.moveTo(sel.x, sel.y); ctx.lineTo(hx, hy); ctx.stroke();
          ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, TAU); ctx.fill();
          const f = focal(sel);
          if (f) {
            ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#fde68a'; ctx.font = '12px Segoe UI, sans-serif'; ctx.textBaseline = 'bottom';
            const ux = Math.cos(sel.a), uy = Math.sin(sel.a);
            const pts = sel.type === 'cmirror' ? [-1] : [1, -1];
            for (const sgn of pts) {
              const fx = sel.x + ux * f * sgn, fy = sel.y + uy * f * sgn;
              ctx.beginPath(); ctx.moveTo(fx - 5, fy - 5); ctx.lineTo(fx + 5, fy + 5); ctx.moveTo(fx + 5, fy - 5); ctx.lineTo(fx - 5, fy + 5); ctx.stroke();
              ctx.fillText('F', fx + 6, fy - 4);
            }
          }
        }
      },
      pointerdown(p) {
        if (sel) { const [hx, hy] = handlePos(sel); if (Math.hypot(p.x - hx, p.y - hy) < 12) { dragMode = 'rot'; return; } }
        const hit = pick(p);
        if (hit !== sel) select(hit);
        if (hit) { dragMode = 'move'; dragOff = [p.x - hit.x, p.y - hit.y]; } else dragMode = null;
      },
      pointermove(p, e) {
        if (!sel || !dragMode || !env.pointer.down) return;
        if (dragMode === 'move') { sel.x = p.x - dragOff[0]; sel.y = p.y - dragOff[1]; }
        else { let a = Math.atan2(p.y - sel.y, p.x - sel.x); if (e.shiftKey) a = Math.round(a / (15 * DEG)) * 15 * DEG; sel.a = a; }
        build(sel);
      },
      pointerup() { if (sel && dragMode === 'rot') select(sel); dragMode = null; },
      wheel(p, dy, e) {
        if (!sel) return;
        sel.a += (dy > 0 ? 1 : -1) * (e.shiftKey ? 0.25 : 2) * DEG;
        build(sel);
      },
      key(e) {
        if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { els = els.filter((x) => x !== sel); dirty = true; select(null); }
      },
      resize() { dirty = true; },
      reset() { preset('lens'); },
      readouts() {
        const out = [['Elements', els.length], ['Rays traced', stats.rays], ['Ray segments', stats.segs]];
        if (sel) {
          out.push(['Selected', NAMES[sel.type]]);
          if (sel.n !== undefined) out.push(['n (blue / red)', `${nAt(sel, 440).toFixed(3)} / ${nAt(sel, 650).toFixed(3)}`]);
          if (sel.n !== undefined && sel.n > 1) out.push(['Critical angle', (Math.asin(1 / sel.n) / DEG).toFixed(1) + '°']);
          const f = focal(sel);
          if (f) out.push(['Focal length f', f.toFixed(1) + ' px']);
          out.push(['Angle', ((Math.atan2(Math.sin(sel.a), Math.cos(sel.a)) / DEG)).toFixed(1) + '°']);
        }
        return out;
      },
    };
  },
});

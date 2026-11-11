'use strict';
/* LAB 10 — Soft Matter: Verlet cloth with constraint relaxation, tearing, wind, pins and a collider sphere */
PhysLab.define({
  id: 'cloth',
  title: 'Cloth & Soft Matter',
  subtitle: 'A tearable cloth of thousands of springs: Verlet integration, constraints, wind, strain maps and collisions.',
  color: '#2dd4bf',
  tags: ['Mechanics', 'Elasticity', 'Verlet'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8h52"/><path d="M8 8c0 16 4 30 -2 46M20 8c0 16 6 30 2 46M32 8c0 16 4 30 2 46M44 8c0 16 6 30 4 46M56 8c0 16 2 30 4 46"/><path d="M8 20c12 2 36 2 49 0M7 34c13 3 38 3 51 0M6 48c14 4 40 4 54 0"/><circle cx="8" cy="8" r="2.5" fill="currentColor"/><circle cx="32" cy="8" r="2.5" fill="currentColor"/><circle cx="56" cy="8" r="2.5" fill="currentColor"/></svg>`,
  hint: 'Left-drag grabs the cloth · right-drag cuts it · pull hard and it tears · try the Flag preset with wind',
  howto: [
    '<b>Left drag</b> uses the selected tool (Grab, Cut, Pin, Poke, Sphere).',
    '<b>Right drag</b> always cuts — slice the cloth apart.',
    'Pull hard enough with <b>Grab</b> and stretched threads snap (tear threshold slider).',
    'Switch the look to <b>Strain map</b> to see where the fabric is under tension.',
  ],
  theory: `
  <h3>Mass–spring model</h3>
  <p>The cloth is a grid of particles joined by distance constraints (structural, plus optional diagonal shear links).</p>
  <h3>Verlet integration</h3>
  <div class="eq">x_{n+1} = x_n + (x_n − x_{n−1})(1 − damping) + a Δt²</div>
  <p>Velocity is implicit in the difference between the last two positions, which makes constraints trivial to enforce — just move the points.</p>
  <h3>Constraint relaxation (Jakobsen / PBD)</h3>
  <div class="eq">Δ = (|p₂ − p₁| − L₀) / |p₂ − p₁| ,  p₁ += ½Δ(p₂ − p₁) ,  p₂ −= ½Δ(p₂ − p₁)</div>
  <p>Each step every link is pulled back toward its rest length several times. More iterations = stiffer cloth (Gauss–Seidel convergence). This is the position-based dynamics approach used in many games and film tools.</p>
  <h3>Tearing &amp; strain</h3>
  <div class="eq">strain ε = (L − L₀) / L₀ ;  break if L &gt; k_tear · L₀</div>
  <p>Stress concentrates around pins and cuts — watch the strain map light up at the corners of a hole, the same way cracks grow from notches in real materials.</p>
  <h3>Shading</h3>
  <p>Each quad's brightness follows its area compared with its rest area: compressed folds darken, giving a convincing 3D look from a 2D simulation.</p>`,

  create(env) {
    const { ui } = env;
    const q = env.q, TAU = U.TAU;
    const COLS = q >= 1 ? 58 : q >= 0.75 ? 46 : 34, ROWS = q >= 1 ? 40 : q >= 0.75 ? 32 : 24;
    const NP = COLS * ROWS, NH = (COLS - 1) * ROWS, NV = COLS * (ROWS - 1), NS = 2 * (COLS - 1) * (ROWS - 1);
    const S = { preset: 'curtain', tool: 'grab', iters: q >= 0.75 ? 10 : 6, gravity: 980, wind: 0, turb: 0.6, tear: 2.4, tearOn: true, damp: 0.012, shear: true, look: 'fabric', sphere: false };
    const X = new Float32Array(NP), Y = new Float32Array(NP), OX = new Float32Array(NP), OY = new Float32Array(NP), PIN = new Uint8Array(NP);
    const NC = NH + NV + NS;
    const CA = new Int32Array(NC), CB = new Int32Array(NC), REST = new Float32Array(NC), ALIVE = new Uint8Array(NC), STRAIN = new Float32Array(NC);
    let sp = 10, restArea = 100, t = 0, acc = 0, grab = -1, grabPos = null, cutPrev = null, torn = 0;
    const sph = { x: 0, y: 0, r: 60 };
    let sphDrag = false;
    const P = (i, j) => j * COLS + i, HC = (i, j) => j * (COLS - 1) + i, VC = (i, j) => NH + j * COLS + i;

    function build(name) {
      S.preset = name;
      const W = env.W, H = env.H;
      sp = Math.min((W * 0.62) / (COLS - 1), (H * 0.66) / (ROWS - 1));
      restArea = sp * sp;
      const x0 = (W - sp * (COLS - 1)) / 2, y0 = H * 0.08;
      for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
        const k = P(i, j);
        X[k] = OX[k] = x0 + i * sp; Y[k] = OY[k] = y0 + j * sp; PIN[k] = 0;
      }
      let c = 0;
      for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS - 1; i++) { CA[c] = P(i, j); CB[c] = P(i + 1, j); REST[c] = sp; ALIVE[c] = 1; c++; }
      for (let j = 0; j < ROWS - 1; j++) for (let i = 0; i < COLS; i++) { CA[c] = P(i, j); CB[c] = P(i, j + 1); REST[c] = sp; ALIVE[c] = 1; c++; }
      for (let j = 0; j < ROWS - 1; j++) for (let i = 0; i < COLS - 1; i++) {
        CA[c] = P(i, j); CB[c] = P(i + 1, j + 1); REST[c] = sp * Math.SQRT2; ALIVE[c] = 1; c++;
        CA[c] = P(i + 1, j); CB[c] = P(i, j + 1); REST[c] = sp * Math.SQRT2; ALIVE[c] = 1; c++;
      }
      torn = 0;
      if (name === 'curtain') { for (let i = 0; i < COLS; i += 3) PIN[P(i, 0)] = 1; PIN[P(COLS - 1, 0)] = 1; S.wind = 0; S.sphere = false; }
      else if (name === 'flag') {
        // re-lay horizontally from a pole on the left
        const fx = W * 0.14, fy = H * 0.12, s2 = Math.min((W * 0.72) / (COLS - 1), (H * 0.55) / (ROWS - 1));
        for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) { const k = P(i, j); X[k] = OX[k] = fx + i * s2; Y[k] = OY[k] = fy + j * s2; }
        for (let cc = 0; cc < NC; cc++) REST[cc] = cc < NH + NV ? s2 : s2 * Math.SQRT2;
        sp = s2; restArea = sp * sp;
        for (let j = 0; j < ROWS; j++) PIN[P(0, j)] = 1;
        S.wind = 1400; S.sphere = false;
      } else if (name === 'hammock') { PIN[P(0, 0)] = 1; PIN[P(COLS - 1, 0)] = 1; S.wind = 0; S.sphere = false; }
      else if (name === 'net') {
        PIN[P(0, 0)] = 1; PIN[P(COLS - 1, 0)] = 1; PIN[P(Math.floor(COLS / 2), 0)] = 1;
        S.wind = 0; S.sphere = true; sph.x = W / 2; sph.y = H * 0.62; sph.r = Math.min(W, H) * 0.12;
      }
      windSl.set(S.wind); sphT.set(S.sphere);
    }

    /* ---------- physics ---------- */
    function sim(h) {
      t += h;
      const h2 = h * h, d = 1 - S.damp, g = S.gravity, W = env.W, H = env.H;
      for (let k = 0; k < NP; k++) {
        if (PIN[k] || k === grab) continue;
        const vx = (X[k] - OX[k]) * d, vy = (Y[k] - OY[k]) * d;
        OX[k] = X[k]; OY[k] = Y[k];
        let ax = 0, ay = g;
        if (S.wind) {
          const w = S.wind * (1 + S.turb * (0.6 * Math.sin(t * 1.7 + Y[k] * 0.013 + X[k] * 0.004) + 0.4 * Math.sin(t * 4.3 + X[k] * 0.03)));
          ax += w; ay += S.wind * S.turb * 0.25 * Math.sin(t * 2.3 + X[k] * 0.02 + Y[k] * 0.01);
        }
        X[k] += vx + ax * h2; Y[k] += vy + ay * h2;
      }
      const nc = S.shear ? NC : NH + NV;
      for (let it = 0; it < S.iters; it++) {
        for (let c = 0; c < nc; c++) {
          if (!ALIVE[c]) continue;
          const a = CA[c], b = CB[c];
          const dx = X[b] - X[a], dy = Y[b] - Y[a], dist = Math.sqrt(dx * dx + dy * dy) || 1e-6;
          const wa = PIN[a] || a === grab ? 0 : 1, wb = PIN[b] || b === grab ? 0 : 1, ws = wa + wb;
          if (!ws) continue;
          const k = (dist - REST[c]) / dist / ws;
          X[a] += dx * k * wa; Y[a] += dy * k * wa;
          X[b] -= dx * k * wb; Y[b] -= dy * k * wb;
        }
        if (grab >= 0 && grabPos) { X[grab] = grabPos.x; Y[grab] = grabPos.y; }
        if (S.sphere) {
          const r2 = (sph.r + 2) ** 2;
          for (let k = 0; k < NP; k++) {
            const dx = X[k] - sph.x, dy = Y[k] - sph.y, d2 = dx * dx + dy * dy;
            if (d2 < r2 && d2 > 0) { const dd = Math.sqrt(d2), s = (sph.r + 2) / dd; X[k] = sph.x + dx * s; Y[k] = sph.y + dy * s; }
          }
        }
        for (let k = 0; k < NP; k++) {
          if (Y[k] > H - 4) { Y[k] = H - 4; OX[k] += (X[k] - OX[k]) * 0.3; }
          if (X[k] < 2) X[k] = 2; else if (X[k] > W - 2) X[k] = W - 2;
        }
      }
      // strain & tearing
      for (let c = 0; c < nc; c++) {
        if (!ALIVE[c]) continue;
        const a = CA[c], b = CB[c];
        const L = Math.hypot(X[b] - X[a], Y[b] - Y[a]);
        STRAIN[c] = L / REST[c] - 1;
        if (S.tearOn && L > REST[c] * S.tear) { ALIVE[c] = 0; torn++; }
      }
    }

    function cutAlong(x1, y1, x2, y2, r) {
      for (let c = 0; c < NC; c++) {
        if (!ALIVE[c]) continue;
        const a = CA[c], b = CB[c], mx = (X[a] + X[b]) / 2, my = (Y[a] + Y[b]) / 2;
        if (U.distToSeg(mx, my, x1, y1, x2, y2) < r) { ALIVE[c] = 0; torn++; }
      }
    }
    function nearest(x, y, maxD) {
      let best = -1, bd = maxD * maxD;
      for (let k = 0; k < NP; k++) { const d = (X[k] - x) ** 2 + (Y[k] - y) ** 2; if (d < bd) { bd = d; best = k; } }
      return best;
    }

    /* ---------- UI ---------- */
    ui.section('Presets');
    ui.buttons([
      { label: 'Curtain', onClick: () => build('curtain') },
      { label: 'Flag in wind', onClick: () => build('flag') },
      { label: 'Hammock', onClick: () => build('hammock') },
      { label: 'Net & sphere', onClick: () => build('net') },
    ]);
    ui.section('Tool (left mouse)');
    ui.tools([{ id: 'grab', label: '✋ Grab' }, { id: 'cut', label: '✂ Cut' }, { id: 'pin', label: '📌 Pin / unpin' }, { id: 'poke', label: '◎ Poke' }, { id: 'sphere', label: '● Move sphere' }, { id: 'burn', label: '🔥 Burn' }, { id: 'ball', label: '⚾ Throw ball (drag)' }], S.tool, (v) => (S.tool = v));
    ui.section('Material');
    ui.slider('Stiffness (iterations)', { min: 1, max: 30, step: 1, value: S.iters, fmt: (v) => v + '', onInput: (v) => (S.iters = v) });
    ui.toggle('Shear springs (diagonals)', S.shear, (v) => (S.shear = v));
    ui.toggle('Tearing', S.tearOn, (v) => (S.tearOn = v));
    ui.slider('Tear threshold', { min: 1.2, max: 6, step: 0.05, value: S.tear, fmt: (v) => '×' + v.toFixed(2) + ' rest length', onInput: (v) => (S.tear = v) });
    ui.slider('Air damping', { min: 0, max: 0.1, step: 0.001, value: S.damp, fmt: (v) => v.toFixed(3), onInput: (v) => (S.damp = v) });
    ui.section('Forces');
    ui.slider('Gravity', { min: -600, max: 3000, step: 10, value: S.gravity, fmt: (v) => v + ' px/s²', onInput: (v) => (S.gravity = v) });
    const windSl = ui.slider('Wind', { min: -3000, max: 3000, step: 20, value: S.wind, fmt: (v) => v + '', onInput: (v) => (S.wind = v) });
    ui.slider('Turbulence', { min: 0, max: 1.5, value: S.turb, fmt: (v) => v.toFixed(2), onInput: (v) => (S.turb = v) });
    const sphT = ui.toggle('Collision sphere', S.sphere, (v) => { S.sphere = v; if (v && !sph.x) { sph.x = env.W / 2; sph.y = env.H * 0.6; sph.r = Math.min(env.W, env.H) * 0.12; } });
    ui.section('Look');
    ui.select('Render', [['fabric', 'Shaded fabric'], ['strain', 'Strain map'], ['wire', 'Wireframe']], S.look, (v) => (S.look = v));
    ui.buttons([{ label: 'Unpin all (drop it!)', onClick: () => PIN.fill(0) }, { label: 'Rebuild', primary: true, onClick: () => build(S.preset) }]);

    build('curtain');

    /* ---------- palette ---------- */
    const LV = 14;
    const PAL = {
      curtain: [[150, 28, 52], [176, 40, 66]],
      flag: [[20, 160, 150], [235, 160, 30], [120, 80, 220]],
      hammock: [[40, 110, 190], [230, 230, 240]],
      net: [[60, 200, 170], [40, 150, 130]],
    };
    function shadeStr(rgb, l) { const f = 0.3 + (0.85 * l) / (LV - 1); return `rgb(${(rgb[0] * f) | 0},${(rgb[1] * f) | 0},${(rgb[2] * f) | 0})`; }
    const shadeCache = {};
    function shades(name) {
      if (shadeCache[name]) return shadeCache[name];
      return (shadeCache[name] = PAL[name].map((c) => Array.from({ length: LV }, (_, l) => shadeStr(c, l))));
    }
    const strainCols = Array.from({ length: LV }, (_, l) => { const [r, g, b] = U.hsl2rgb(220 - (l / (LV - 1)) * 220, 0.9, 0.5); return `rgb(${r},${g},${b})`; });

    /* ===== v3 extras ===== */
    const FIRE = new Float32Array(NP), BURNT = new Uint8Array(NP);
    const X3 = { burned: 0, lastTorn: 0, balls: [], thrown: 0, aim: null, sparks: [] };
    function killLinks(k) {
      const i = k % COLS, j = (k / COLS) | 0;
      const kill = (c) => { if (ALIVE[c]) { ALIVE[c] = 0; torn++; } };
      if (i > 0) kill(HC(i - 1, j)); if (i < COLS - 1) kill(HC(i, j));
      if (j > 0) kill(VC(i, j - 1)); if (j < ROWS - 1) kill(VC(i, j));
      for (let cj = j - 1; cj <= j; cj++) for (let ci = i - 1; ci <= i; ci++) {
        if (ci < 0 || cj < 0 || ci >= COLS - 1 || cj >= ROWS - 1) continue;
        const b = NH + NV + 2 * (cj * (COLS - 1) + ci);
        kill(b); kill(b + 1);
      }
    }
    function ignite(k) { if (k >= 0 && !BURNT[k] && FIRE[k] <= 0) FIRE[k] = 0.7 + Math.random() * 0.6; }
    ui.section('Fire & projectiles');
    ui.note('Pick <b>🔥 Burn</b> in the tool list and touch the cloth — the fire spreads along the threads. Pick <b>⚾ Throw ball</b> and drag to throw a ball into the fabric.');
    ui.buttons([{ label: 'Remove balls', onClick: () => (X3.balls = []) }]);
    const ext = {
      step(dt) {
        if (torn < X3.lastTorn) { FIRE.fill(0); BURNT.fill(0); X3.burned = 0; X3.sparks = []; }
        // fire spread
        for (let k = 0; k < NP; k++) {
          if (FIRE[k] <= 0) continue;
          FIRE[k] -= dt;
          const i = k % COLS, j = (k / COLS) | 0, pr = dt * 1.5;
          if (i > 0 && ALIVE[HC(i - 1, j)] && Math.random() < pr) ignite(k - 1);
          if (i < COLS - 1 && ALIVE[HC(i, j)] && Math.random() < pr) ignite(k + 1);
          if (j > 0 && ALIVE[VC(i, j - 1)] && Math.random() < pr * 1.6) ignite(k - COLS);
          if (j < ROWS - 1 && ALIVE[VC(i, j)] && Math.random() < pr * 0.7) ignite(k + COLS);
          if (Math.random() < dt * 6 && X3.sparks.length < 160) X3.sparks.push({ x: X[k], y: Y[k], vx: U.rand(-20, 20), vy: U.rand(-90, -30), l: 0.8 });
          if (FIRE[k] <= 0) { FIRE[k] = 0; BURNT[k] = 1; PIN[k] = 0; X3.burned++; killLinks(k); }
        }
        X3.lastTorn = torn;
        for (const s of X3.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.l -= dt; }
        X3.sparks = X3.sparks.filter((s) => s.l > 0);
        // balls
        for (const b of X3.balls) {
          b.vy += S.gravity * dt; b.x += b.vx * dt; b.y += b.vy * dt;
          const r2 = b.r * b.r;
          for (let k = 0; k < NP; k++) {
            const dx = X[k] - b.x, dy = Y[k] - b.y, d2 = dx * dx + dy * dy;
            if (d2 >= r2 || d2 === 0 || BURNT[k]) continue;
            const d = Math.sqrt(d2), push = b.r - d, nx = dx / d, ny = dy / d;
            if (!PIN[k]) { X[k] += nx * push; Y[k] += ny * push; }
            b.vx -= nx * push * 0.9; b.vy -= ny * push * 0.9;
          }
          if (b.y > env.H - b.r - 4) { b.y = env.H - b.r - 4; b.vy = -Math.abs(b.vy) * 0.45; b.vx *= 0.9; }
          if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.6; } else if (b.x > env.W - b.r) { b.x = env.W - b.r; b.vx = -Math.abs(b.vx) * 0.6; }
        }
      },
      draw(ctx) {
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < NP; k++) {
          if (FIRE[k] <= 0) continue;
          const r = 3.5 + Math.random() * 3.5;
          ctx.fillStyle = `rgba(255,${(120 + Math.random() * 90) | 0},30,0.42)`;
          ctx.beginPath(); ctx.arc(X[k], Y[k] - Math.random() * 5, r, 0, TAU); ctx.fill();
        }
        for (const s of X3.sparks) { ctx.fillStyle = `rgba(255,190,80,${s.l})`; ctx.fillRect(s.x, s.y, 2, 2); }
        ctx.globalCompositeOperation = 'source-over';
        for (const b of X3.balls) {
          const g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, 2, b.x, b.y, b.r);
          g.addColorStop(0, '#fff7ed'); g.addColorStop(1, '#c2410c');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
        }
        if (X3.aim) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); U.arrow(ctx, X3.aim.x, X3.aim.y, env.pointer.x, env.pointer.y, 9); ctx.stroke(); }
      },
      pointerdown(p, e) {
        if (e.button === 2) return false;
        if (S.tool === 'burn') { ignite(nearest(p.x, p.y, 34)); return true; }
        if (S.tool === 'ball') { X3.aim = { x: p.x, y: p.y }; return true; }
        return false;
      },
      pointermove(p) { if (env.pointer.down && S.tool === 'burn') ignite(nearest(p.x, p.y, 34)); },
      pointerup(p) {
        if (!X3.aim) return;
        X3.balls.push({ x: X3.aim.x, y: X3.aim.y, vx: (p.x - X3.aim.x) * 5, vy: (p.y - X3.aim.y) * 5, r: 20 });
        if (X3.balls.length > 6) X3.balls.shift();
        X3.thrown++; X3.aim = null;
      },
    };

    return {
      ext,
      probe() { return { torn, burned: X3.burned, balls: X3.thrown }; },
      step(dt) {
        acc += Math.min(dt, 0.1);
        const h = 1 / 60;
        let n = 0;
        while (acc >= h && n < 5) { sim(h); acc -= h; n++; }
      },
      draw(ctx) {
        const W = env.W, H = env.H;
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0e1424'); bg.addColorStop(1, '#05070d');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#0b1120'; ctx.fillRect(0, H - 4, W, 4);
        if (S.preset === 'flag') { ctx.fillStyle = '#8b93a7'; ctx.fillRect(X[0] - 6, X[0] ? Y[0] - 20 : 0, 5, H); }
        else { ctx.fillStyle = '#4b5470'; ctx.fillRect(0, Y[0] - 6, W, 3); }

        if (S.sphere) {
          const g = ctx.createRadialGradient(sph.x - sph.r * 0.35, sph.y - sph.r * 0.35, sph.r * 0.1, sph.x, sph.y, sph.r);
          g.addColorStop(0, '#9ff7e8'); g.addColorStop(1, '#0f5e57');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sph.x, sph.y, sph.r, 0, TAU); ctx.fill();
        }
        const used = new Uint8Array(NH + NV);
        if (S.look !== 'wire') {
          const isStrain = S.look === 'strain';
          const sh = isStrain ? [strainCols] : shades(S.preset);
          const paths = sh.map(() => Array.from({ length: LV }, () => new Path2D()));
          for (let j = 0; j < ROWS - 1; j++) for (let i = 0; i < COLS - 1; i++) {
            const top = HC(i, j), bot = HC(i, j + 1), lft = VC(i, j), rgt = VC(i + 1, j);
            if (!ALIVE[top] || !ALIVE[bot] || !ALIVE[lft] || !ALIVE[rgt]) continue;
            used[top] = used[bot] = used[lft] = used[rgt] = 1;
            const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
            let lvl, band = 0;
            if (isStrain) {
              const s = (STRAIN[top] + STRAIN[bot] + STRAIN[lft] + STRAIN[rgt]) / 4;
              lvl = Math.round(U.clamp(s / 0.35, 0, 1) * (LV - 1));
            } else {
              const area = Math.abs((X[c] - X[a]) * (Y[d] - Y[b]) - (Y[c] - Y[a]) * (X[d] - X[b])) / 2;
              const ratio = area / restArea;
              const tilt = ((Y[d] - Y[a]) - (X[b] - X[a]) * 0) / sp;
              lvl = Math.round(U.clamp((ratio - 0.25) / 0.85 + (tilt - 1) * 0.15, 0, 1) * (LV - 1));
              if (S.preset === 'curtain') band = (i >> 2) & 1;
              else if (S.preset === 'flag') band = Math.min(2, Math.floor((j * 3) / (ROWS - 1)));
              else if (S.preset === 'hammock') band = ((i >> 2) + (j >> 2)) & 1;
              else band = (i + j) & 1;
            }
            const p = paths[band][lvl];
            p.moveTo(X[a], Y[a]); p.lineTo(X[b], Y[b]); p.lineTo(X[c], Y[c]); p.lineTo(X[d], Y[d]); p.closePath();
          }
          paths.forEach((arr, b) => arr.forEach((p, l) => { ctx.fillStyle = sh[b][l]; ctx.fill(p); ctx.strokeStyle = sh[b][l]; ctx.lineWidth = 0.6; ctx.stroke(p); }));
        }
        // loose threads (or full wireframe)
        ctx.lineWidth = 1;
        ctx.strokeStyle = S.look === 'wire' ? 'rgba(160,240,225,0.55)' : 'rgba(230,220,210,0.7)';
        ctx.beginPath();
        const ncDraw = S.look === 'wire' && S.shear ? NC : NH + NV;
        for (let c = 0; c < ncDraw; c++) {
          if (!ALIVE[c] || (c < NH + NV && used[c])) continue;
          ctx.moveTo(X[CA[c]], Y[CA[c]]); ctx.lineTo(X[CB[c]], Y[CB[c]]);
        }
        ctx.stroke();
        // pins
        ctx.fillStyle = '#fbbf24';
        for (let k = 0; k < NP; k++) if (PIN[k]) { ctx.beginPath(); ctx.arc(X[k], Y[k], 3.2, 0, TAU); ctx.fill(); }
        if (grab >= 0) { ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(X[grab], Y[grab], 8, 0, TAU); ctx.stroke(); }
        if (env.pointer.inside && (S.tool === 'cut' || S.tool === 'poke')) {
          ctx.strokeStyle = S.tool === 'cut' ? 'rgba(255,120,120,0.7)' : 'rgba(255,255,255,0.4)';
          ctx.beginPath(); ctx.arc(env.pointer.x, env.pointer.y, S.tool === 'cut' ? 9 : 60, 0, TAU); ctx.stroke();
        }
      },
      pointerdown(p, e) {
        if (e.button === 2 || S.tool === 'cut') { cutPrev = { x: p.x, y: p.y }; cutAlong(p.x, p.y, p.x, p.y, 9); return; }
        if (S.tool === 'grab') { grab = nearest(p.x, p.y, 50); grabPos = { x: p.x, y: p.y }; }
        else if (S.tool === 'pin') { const k = nearest(p.x, p.y, 30); if (k >= 0) PIN[k] = PIN[k] ? 0 : 1; }
        else if (S.tool === 'sphere') { sphDrag = true; if (!S.sphere) { S.sphere = true; sphT.set(true); } sph.x = p.x; sph.y = p.y; }
      },
      pointermove(p) {
        if (!env.pointer.down) return;
        if (cutPrev) { cutAlong(cutPrev.x, cutPrev.y, p.x, p.y, 9); cutPrev = { x: p.x, y: p.y }; }
        else if (grab >= 0) { grabPos = { x: p.x, y: p.y }; }
        else if (sphDrag) { sph.x = p.x; sph.y = p.y; }
        else if (S.tool === 'poke') {
          for (let k = 0; k < NP; k++) {
            const dx = X[k] - p.x, dy = Y[k] - p.y, d = Math.hypot(dx, dy);
            if (d < 60 && d > 0 && !PIN[k]) { const f = (60 - d) / d * 0.25; X[k] += dx * f; Y[k] += dy * f; }
          }
        }
      },
      pointerup() {
        if (grab >= 0) { OX[grab] = X[grab]; OY[grab] = Y[grab]; }
        grab = -1; grabPos = null; cutPrev = null; sphDrag = false;
      },
      resize(changed) { if (changed) build(S.preset); },
      reset() { build(S.preset); },
      readouts() {
        let alive = 0, sum = 0, mx = 0, pins = 0;
        for (let c = 0; c < NH + NV; c++) if (ALIVE[c]) { alive++; sum += STRAIN[c]; if (STRAIN[c] > mx) mx = STRAIN[c]; }
        for (let k = 0; k < NP; k++) pins += PIN[k];
        return [
          ['Particles', NP], ['Links alive', alive + (S.shear ? ' + shear' : '')], ['Links torn', torn], ['Pinned', pins],
          ['Mean stretch', ((sum / Math.max(1, alive)) * 100).toFixed(2) + ' %'], ['Max stretch', (mx * 100).toFixed(1) + ' %'],
          ['Solver iterations', S.iters], ['Grid', COLS + ' × ' + ROWS],
        ];
      },
    };
  },
});

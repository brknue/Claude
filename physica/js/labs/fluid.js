'use strict';
/* LAB 08 — Fluid Dynamics: stable-fluids Navier–Stokes solver with obstacles, wind tunnel, vorticity confinement */
PhysLab.define({
  id: 'fluid',
  title: 'Fluid Dynamics',
  subtitle: 'Incompressible Navier–Stokes: ink, smoke plumes and a wind tunnel with vortex streets behind obstacles.',
  color: '#60a5fa',
  tags: ['Fluids', 'Navier–Stokes', 'Turbulence'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20c10-6 16 6 26 0s16-6 30 0"/><path d="M4 44c10 6 16-6 26 0s16 6 30 0"/><circle cx="22" cy="32" r="6" fill="currentColor" fill-opacity=".3"/><path d="M30 32c4-6 10-6 12 0s-4 8-8 4M44 30c4-5 9-4 10 1s-4 6-6 3"/></svg>`,
  hint: 'Drag through the fluid to stir it and inject dye · try the wind tunnel presets for vortex streets',
  howto: [
    '<b>Drag</b> to push the fluid and inject coloured dye (Push tool).',
    'Use <b>Obstacle</b> to paint solid walls, then watch the flow go around them.',
    'In the <b>wind tunnel</b>, increase the inflow speed and vortex confinement to get a von Kármán vortex street.',
    'Switch the view to <b>vorticity</b> to see the spinning regions in red and blue.',
  ],
  theory: `
  <h3>Incompressible Navier–Stokes</h3>
  <div class="eq">∂u/∂t + (u·∇)u = −∇p/ρ + ν∇²u + f</div>
  <div class="eq">∇·u = 0</div>
  <h3>Stable-fluids method (Stam, 1999)</h3>
  <p>Each time step splits the equation into simple pieces:</p>
  <ul>
    <li><b>Forces</b>: mouse, buoyancy and vorticity confinement are added.</li>
    <li><b>Advection</b>: semi-Lagrangian — trace each cell backwards along the flow and sample. Unconditionally stable.</li>
    <li><b>Diffusion</b>: implicit viscosity solve.</li>
    <li><b>Projection</b>: solve the Poisson equation ∇²p = ∇·u with Gauss–Seidel/SOR and subtract ∇p so the flow is divergence-free.</li>
  </ul>
  <h3>Vorticity confinement</h3>
  <div class="eq">ω = ∇ × u ,  f = ε (N × ω),  N = ∇|ω| / |∇|ω||</div>
  <p>Numerical diffusion on coarse grids damps small swirls; confinement puts that rotational energy back so the fluid stays lively.</p>
  <h3>Vortex shedding</h3>
  <p>Flow past a bluff body becomes unstable above a Reynolds number of ~47 and sheds vortices alternately from each side — the <b>von Kármán vortex street</b>. Its frequency follows the Strouhal number St = fD/U ≈ 0.2.</p>`,

  create(env) {
    const { ui } = env;
    const q = env.q;
    const GW = q >= 1 ? 180 : q >= 0.75 ? 140 : 104, ITER = q >= 1 ? 22 : q >= 0.75 ? 18 : 14;
    const S = { preset: 'tunnel', tool: 'push', view: 'dye', visc: 0, vort: 0.08, dyeDiss: 0.996, velDiss: 0.9995, U: 0.9, aoa: 10, buoy: 0.1, tracers: true, radius: 5 };
    let gw, gh, N, u, v, u0, v0, p, div, curl, cr, cg, cb, tr, tg, tb, flag, img, u32;
    let T = 0, TX, TY, NT = Math.round(800 + 2200 * q), accum = 0, hue = 0, last = null, stepsRun = 0;
    const off = document.createElement('canvas'), octx = off.getContext('2d');

    function alloc() {
      gw = GW; gh = Math.max(24, Math.round((GW * env.H) / env.W)); N = gw * gh;
      u = new Float32Array(N); v = new Float32Array(N); u0 = new Float32Array(N); v0 = new Float32Array(N);
      p = new Float32Array(N); div = new Float32Array(N); curl = new Float32Array(N);
      cr = new Float32Array(N); cg = new Float32Array(N); cb = new Float32Array(N);
      tr = new Float32Array(N); tg = new Float32Array(N); tb = new Float32Array(N);
      flag = new Uint8Array(N);
      off.width = gw; off.height = gh;
      img = octx.createImageData(gw, gh); u32 = new Uint32Array(img.data.buffer);
      TX = new Float32Array(NT); TY = new Float32Array(NT);
    }
    const IX = (x, y) => x + y * gw;
    const tunnel = () => S.preset === 'tunnel' || S.preset === 'airfoil' || S.preset === 'plates';

    function setFlags() {
      for (let x = 0; x < gw; x++) { flag[IX(x, 0)] = 1; flag[IX(x, gh - 1)] = 1; }
      for (let y = 0; y < gh; y++) {
        flag[IX(0, y)] = tunnel() ? (y > 0 && y < gh - 1 ? 2 : 1) : 1;
        flag[IX(gw - 1, y)] = tunnel() ? (y > 0 && y < gh - 1 ? 3 : 1) : 1;
      }
    }
    function obstacleCircle(cx, cy, r) {
      for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) flag[IX(x, y)] = 1;
    }
    function airfoil(cx, cy, chord, aoa) {
      const c = Math.cos(aoa * U.DEG), s = Math.sin(aoa * U.DEG), th = 0.15;
      for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
        const dx = x - cx, dy = y - cy;
        const lx = (dx * c + dy * s) / chord + 0.3, ly = (-dx * s + dy * c) / chord;
        if (lx < 0 || lx > 1) continue;
        const yt = 5 * th * (0.2969 * Math.sqrt(lx) - 0.126 * lx - 0.3516 * lx * lx + 0.2843 * lx ** 3 - 0.1036 * lx ** 4);
        if (Math.abs(ly) <= yt) flag[IX(x, y)] = 1;
      }
    }

    function preset(name) {
      S.preset = name;
      u.fill(0); v.fill(0); p.fill(0); cr.fill(0); cg.fill(0); cb.fill(0); flag.fill(0);
      setFlags();
      if (name === 'tunnel') obstacleCircle(gw * 0.2, gh / 2 + 0.6, gh * 0.09);
      else if (name === 'airfoil') airfoil(gw * 0.3, gh / 2, gw * 0.32, S.aoa);
      else if (name === 'plates') { for (let k = 0; k < 3; k++) obstacleCircle(gw * (0.18 + k * 0.05), gh * (0.3 + k * 0.2), gh * 0.05); }
      if (tunnel()) for (let i = 0; i < N; i++) if (flag[i] === 0) { u[i] = S.U; v[i] = (Math.random() - 0.5) * 0.02; }
      if (name === 'ink') {
        for (let k = 0; k < 6; k++) splat(U.rand(gw * 0.2, gw * 0.8), U.rand(gh * 0.2, gh * 0.8), U.rand(-3, 3), U.rand(-3, 3), U.hsl2rgb(k * 60, 0.9, 0.55).map((c) => c / 255), 6);
      }
      for (let k = 0; k < NT; k++) respawn(k, true);
    }
    function respawn(k, anywhere) {
      if (tunnel() && !anywhere) { TX[k] = 1.5 + Math.random() * 2; TY[k] = 1 + Math.random() * (gh - 2); }
      else { TX[k] = 1 + Math.random() * (gw - 2); TY[k] = 1 + Math.random() * (gh - 2); }
    }

    function splat(cx, cy, fx, fy, col, r) {
      const r2 = r * r, R = Math.ceil(r * 2);
      for (let y = Math.max(1, (cy - R) | 0); y < Math.min(gh - 1, cy + R); y++)
        for (let x = Math.max(1, (cx - R) | 0); x < Math.min(gw - 1, cx + R); x++) {
          const i = IX(x, y);
          if (flag[i] === 1) continue;
          const d2 = (x - cx) ** 2 + (y - cy) ** 2;
          if (d2 > 4 * r2) continue;
          const w = Math.exp(-d2 / r2);
          u[i] += fx * w; v[i] += fy * w;
          if (col) { cr[i] += col[0] * w; cg[i] += col[1] * w; cb[i] += col[2] * w; }
        }
    }

    /* ---------- solver ---------- */
    function sample(f, X, Y) {
      if (X < 0.5) X = 0.5; else if (X > gw - 1.5) X = gw - 1.5;
      if (Y < 0.5) Y = 0.5; else if (Y > gh - 1.5) Y = gh - 1.5;
      const x0 = X | 0, y0 = Y | 0, fx = X - x0, fy = Y - y0, i = x0 + y0 * gw;
      return (f[i] * (1 - fx) + f[i + 1] * fx) * (1 - fy) + (f[i + gw] * (1 - fx) + f[i + gw + 1] * fx) * fy;
    }
    function advect(src, dst, diss, dt) {
      for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
        const i = x + y * gw;
        if (flag[i] === 1) { dst[i] = 0; continue; }
        dst[i] = sample(src, x - u[i] * dt, y - v[i] * dt) * diss;
      }
    }
    function bounds() {
      if (tunnel()) {
        for (let y = 1; y < gh - 1; y++) {
          const a = IX(0, y), b = IX(gw - 1, y);
          u[a] = S.U; v[a] = 0;
          u[b] = u[b - 1]; v[b] = v[b - 1];
        }
      }
    }
    function project() {
      const U0 = S.U;
      for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
        const i = x + y * gw;
        if (flag[i] === 1) { div[i] = 0; continue; }
        const fr = flag[i + 1], fl = flag[i - 1], fb = flag[i + gw], ft = flag[i - gw];
        const uR = fr === 1 ? 0 : u[i + 1], uL = fl === 1 ? 0 : fl === 2 ? U0 : u[i - 1];
        const vB = fb === 1 ? 0 : v[i + gw], vT = ft === 1 ? 0 : v[i - gw];
        div[i] = -0.5 * (uR - uL + vB - vT);
      }
      const w = 1.7;
      for (let it = 0; it < ITER; it++) {
        for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
          const i = x + y * gw;
          if (flag[i] === 1) continue;
          const pc = p[i];
          const fr = flag[i + 1], fl = flag[i - 1], fb = flag[i + gw], ft = flag[i - gw];
          const pR = fr === 1 ? pc : fr === 3 ? 0 : p[i + 1];
          const pL = fl === 1 || fl === 2 ? pc : p[i - 1];
          const pB = fb === 1 ? pc : p[i + gw];
          const pT = ft === 1 ? pc : p[i - gw];
          p[i] = pc + w * ((pR + pL + pB + pT + div[i]) * 0.25 - pc);
        }
      }
      for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
        const i = x + y * gw;
        if (flag[i] === 1) { u[i] = 0; v[i] = 0; continue; }
        const pc = p[i], fr = flag[i + 1], fl = flag[i - 1], fb = flag[i + gw], ft = flag[i - gw];
        const pR = fr === 1 ? pc : fr === 3 ? 0 : p[i + 1];
        const pL = fl === 1 || fl === 2 ? pc : p[i - 1];
        const pB = fb === 1 ? pc : p[i + gw];
        const pT = ft === 1 ? pc : p[i - gw];
        u[i] -= 0.5 * (pR - pL); v[i] -= 0.5 * (pB - pT);
      }
    }
    function computeCurl() {
      for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
        const i = x + y * gw;
        curl[i] = 0.5 * (v[i + 1] - v[i - 1] - (u[i + gw] - u[i - gw]));
      }
    }
    function confine(dt) {
      computeCurl();
      const eps = S.vort;
      for (let y = 2; y < gh - 2; y++) for (let x = 2; x < gw - 2; x++) {
        const i = x + y * gw;
        if (flag[i] === 1) continue;
        let nx = 0.5 * (Math.abs(curl[i + 1]) - Math.abs(curl[i - 1])), ny = 0.5 * (Math.abs(curl[i + gw]) - Math.abs(curl[i - gw]));
        const l = Math.hypot(nx, ny) + 1e-5;
        nx /= l; ny /= l;
        const w = curl[i];
        u[i] += dt * eps * ny * w;
        v[i] -= dt * eps * nx * w;
      }
    }
    function diffuse(dt) {
      const a = S.visc * dt * 10;
      if (a <= 0) return;
      u0.set(u); v0.set(v);
      for (let it = 0; it < 6; it++) for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
        const i = x + y * gw;
        if (flag[i] === 1) continue;
        u[i] = (u0[i] + a * (u[i - 1] + u[i + 1] + u[i - gw] + u[i + gw])) / (1 + 4 * a);
        v[i] = (v0[i] + a * (v[i - 1] + v[i + 1] + v[i - gw] + v[i + gw])) / (1 + 4 * a);
      }
    }

    function sim(dt) {
      T += dt; stepsRun++;
      // sources
      if (tunnel()) {
        const sp = Math.max(4, (gh / 16) | 0);
        for (let y = 1; y < gh - 1; y++) {
          if (y % sp > 1) continue;
          const k = ((y / sp) | 0) % 3, i = IX(1, y), i2 = IX(2, y);
          const c = k === 0 ? [1, 0.45, 0.2] : k === 1 ? [0.2, 0.8, 1] : [0.9, 0.9, 1];
          cr[i] = cr[i2] = c[0]; cg[i] = cg[i2] = c[1]; cb[i] = cb[i2] = c[2];
        }
      } else if (S.preset === 'plume') {
        const col = U.hsl2rgb(20 + 20 * Math.sin(T * 0.02), 0.95, 0.55).map((c) => c / 255);
        splat(gw / 2 + Math.sin(T * 0.05) * 2, gh - 6, (Math.random() - 0.5) * 0.4, -0.4, col.map((c) => c * 0.35), 3.2);
        for (let i = 0; i < N; i++) if (flag[i] === 0) v[i] -= S.buoy * 0.1 * (cr[i] + cg[i] + cb[i]) * dt;
      } else if (S.preset === 'jets') {
        const a = U.hsl2rgb(200, 0.9, 0.55).map((c) => c / 255 * 0.5), b = U.hsl2rgb(340, 0.9, 0.55).map((c) => c / 255 * 0.5);
        splat(5, gh / 2 - 3 + Math.sin(T * 0.1) * 2, 1.4, 0, a, 2.6);
        splat(gw - 6, gh / 2 + 3 + Math.cos(T * 0.13) * 2, -1.4, 0, b, 2.6);
      }
      if (S.vort > 0) confine(dt);
      advect(u, u0, S.velDiss, dt); advect(v, v0, S.velDiss, dt);
      let t = u; u = u0; u0 = t; t = v; v = v0; v0 = t;
      bounds();
      diffuse(dt);
      project();
      bounds();
      advect(cr, tr, S.dyeDiss, dt); advect(cg, tg, S.dyeDiss, dt); advect(cb, tb, S.dyeDiss, dt);
      t = cr; cr = tr; tr = t; t = cg; cg = tg; tg = t; t = cb; cb = tb; tb = t;
      if (S.tracers) {
        for (let k = 0; k < NT; k++) {
          const x = TX[k], y = TY[k];
          const nx = x + sample(u, x, y) * dt, ny = y + sample(v, x, y) * dt;
          TX[k] = nx; TY[k] = ny;
          if (nx < 1 || ny < 1 || nx > gw - 2 || ny > gh - 2 || flag[IX(nx | 0, ny | 0)] === 1 || Math.random() < 0.0015) respawn(k, !tunnel());
        }
      }
    }

    /* ---------- rendering ---------- */
    const pack = (r, g, b) => (255 << 24) | (b << 16) | (g << 8) | r;
    const TM = new Uint8Array(1024);
    for (let i = 0; i < 1024; i++) TM[i] = Math.round(255 * (1 - Math.exp((-i / 256) * 1.7)));
    const SOLID = pack(64, 74, 98);
    function render() {
      if (S.view === 'dye') {
        for (let i = 0; i < N; i++) {
          if (flag[i] === 1) { u32[i] = SOLID; continue; }
          const r = TM[Math.min(1023, (cr[i] * 256) | 0)], g = TM[Math.min(1023, (cg[i] * 256) | 0)], b = TM[Math.min(1023, (cb[i] * 256) | 0)];
          u32[i] = pack(r + 4 > 255 ? 255 : r + 4, g + 6 > 255 ? 255 : g + 6, b + 14 > 255 ? 255 : b + 14);
        }
      } else if (S.view === 'speed') {
        const s = 1 / Math.max(0.5, S.U * 1.6);
        for (let i = 0; i < N; i++) {
          if (flag[i] === 1) { u32[i] = SOLID; continue; }
          const m = Math.min(1, Math.hypot(u[i], v[i]) * s);
          u32[i] = pack((m * m * 255) | 0, (Math.sqrt(m) * 200) | 0, (80 + 175 * (1 - m)) | 0);
        }
      } else if (S.view === 'vort') {
        computeCurl();
        for (let i = 0; i < N; i++) {
          if (flag[i] === 1) { u32[i] = SOLID; continue; }
          const w = Math.max(-1, Math.min(1, curl[i] * 3));
          u32[i] = w > 0 ? pack((10 + 245 * w) | 0, (12 + 80 * w) | 0, (24 + 40 * w) | 0) : pack((10 - 30 * w) | 0, (12 - 150 * w) | 0, (24 - 231 * w) | 0);
        }
      } else {
        let mx = 1e-6;
        for (let i = 0; i < N; i++) if (flag[i] !== 1) mx = Math.max(mx, Math.abs(p[i]));
        for (let i = 0; i < N; i++) {
          if (flag[i] === 1) { u32[i] = SOLID; continue; }
          const w = p[i] / mx;
          u32[i] = w > 0 ? pack((20 + 235 * w) | 0, (20 + 150 * w) | 0, 30) : pack(20, (20 - 120 * w) | 0, (30 - 225 * w) | 0);
        }
      }
      octx.putImageData(img, 0, 0);
    }

    /* ---------- UI ---------- */
    ui.section('Scenario');
    ui.select('Setup', [['tunnel', 'Wind tunnel: cylinder'], ['airfoil', 'Wind tunnel: airfoil'], ['plates', 'Wind tunnel: 3 pillars'], ['plume', 'Rising smoke plume'], ['jets', 'Colliding jets'], ['ink', 'Ink tank (free play)']], S.preset, (v) => preset(v));
    ui.section('Tool');
    ui.tools([{ id: 'push', label: '➶ Push + dye' }, { id: 'dye', label: '🎨 Dye only' }, { id: 'wall', label: '▮ Obstacle' }, { id: 'erase', label: '⌫ Erase obstacle' }], S.tool, (v) => (S.tool = v));
    ui.slider('Brush radius', { min: 2, max: 14, step: 0.5, value: S.radius, fmt: (v) => v + ' cells', onInput: (v) => (S.radius = v) });
    ui.section('Physics');
    ui.slider('Inflow speed U (tunnel)', { min: 0.2, max: 2, value: S.U, fmt: (v) => v.toFixed(2) + ' cell/step', onInput: (v) => (S.U = v) });
    ui.slider('Airfoil angle of attack', { min: -20, max: 30, step: 1, value: S.aoa, fmt: (v) => v + '°', onInput: (v) => (S.aoa = v), onChange: () => S.preset === 'airfoil' && preset('airfoil') });
    ui.slider('Vorticity confinement ε', { min: 0, max: 1.5, value: S.vort, fmt: (v) => v.toFixed(2), onInput: (v) => (S.vort = v) });
    ui.slider('Viscosity ν', { min: 0, max: 0.2, step: 0.002, value: S.visc, fmt: (v) => v.toFixed(3), onInput: (v) => (S.visc = v) });
    ui.slider('Smoke buoyancy', { min: 0, max: 0.4, value: S.buoy, fmt: (v) => v.toFixed(2), onInput: (v) => (S.buoy = v) });
    ui.slider('Dye persistence', { min: 0.97, max: 1, step: 0.0005, value: S.dyeDiss, fmt: (v) => v.toFixed(4), onInput: (v) => (S.dyeDiss = v) });
    ui.section('Display');
    ui.select('View', [['dye', 'Dye / smoke'], ['speed', 'Speed |u|'], ['vort', 'Vorticity ω'], ['pressure', 'Pressure p']], S.view, (v) => (S.view = v));
    ui.toggle('Tracer particles', S.tracers, (v) => (S.tracers = v));
    ui.buttons([{ label: 'Clear dye', onClick: () => { cr.fill(0); cg.fill(0); cb.fill(0); } }, { label: 'Restart', primary: true, onClick: () => preset(S.preset) }]);
    ui.note(`Grid ${GW} cells wide, ${ITER} pressure iterations per step at this quality.`);

    alloc();
    preset('tunnel');

    const toCell = (pp) => [(pp.x / env.W) * gw, (pp.y / env.H) * gh];

    /* ===== v3 extras ===== */
    const FM = { lift: new U.Ring(320), drag: 0, St: 0, cross: [], sign: 0, mean: 0, base: -1, pn: '', painted: false, D: 0, on: true };
    ui.section('Force balance');
    ui.toggle('Lift / drag meter on the obstacle', FM.on, (v) => (FM.on = v));
    ui.note('The meter integrates pressure around the obstacle. Vortex shedding makes the lift swing up and down; its frequency gives the <b>Strouhal number</b> St = f·D/U (≈ 0.2 for a cylinder).');
    const ext = {
      step() {
        if (!tunnel()) return;
        let fx = 0, fy = 0, y0 = gh, y1 = 0, cnt = 0;
        for (let y = 2; y < gh - 2; y++) for (let x = 2; x < gw - 2; x++) {
          const i = x + y * gw;
          if (flag[i] !== 1) continue;
          cnt++;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
          if (flag[i - 1] === 0) fx += p[i - 1]; if (flag[i + 1] === 0) fx -= p[i + 1];
          if (flag[i - gw] === 0) fy += p[i - gw]; if (flag[i + gw] === 0) fy -= p[i + gw];
        }
        if (S.preset !== FM.pn) { FM.pn = S.preset; FM.base = cnt; FM.cross = []; FM.St = 0; FM.lift.clear(); FM.mean = fy; }
        else if (cnt !== FM.base) { FM.painted = true; FM.base = cnt; }
        FM.D = Math.max(1, y1 - y0 + 1);
        FM.drag += (fx - FM.drag) * 0.05;
        FM.mean += (fy - FM.mean) * 0.004;
        const v = fy - FM.mean;
        FM.lift.push(v);
        const [lo, hi] = FM.lift.range(), amp = (hi - lo) / 2;
        const sg = v > amp * 0.15 ? 1 : v < -amp * 0.15 ? -1 : FM.sign;
        if (sg === 1 && FM.sign === -1) { FM.cross.push(stepsRun); if (FM.cross.length > 6) FM.cross.shift(); }
        FM.sign = sg;
        if (FM.cross.length >= 3 && amp > 1e-4) { const per = (FM.cross[FM.cross.length - 1] - FM.cross[0]) / (FM.cross.length - 1); FM.St = (FM.D / per) / Math.max(0.05, S.U); }
        if (FM.cross.length && stepsRun - FM.cross[FM.cross.length - 1] > 900) { FM.cross = []; FM.St = 0; }
      },
      draw(ctx) {
        if (!FM.on || !tunnel()) return;
        const pw = 236, ph = 118, x = env.W - pw - 12, y = 12;
        U.panel(ctx, x, y, pw, ph, 'Force on obstacle');
        const [lo, hi] = FM.lift.range(), m = Math.max(Math.abs(lo), Math.abs(hi), 1e-6);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 10, y + 56); ctx.lineTo(x + pw - 10, y + 56); ctx.stroke();
        ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1.6; FM.lift.draw(ctx, x + 10, y + 26, pw - 20, 60, -m * 1.1, m * 1.1);
        ctx.font = '11px Consolas, monospace'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#60a5fa'; ctx.fillText('lift (oscillating)', x + 10, y + 90);
        ctx.fillStyle = '#fb923c'; ctx.fillText('drag ' + U.fmt(FM.drag, 2), x + 132, y + 90);
        ctx.fillStyle = FM.St ? '#fde047' : '#6b7aa5'; ctx.fillText(FM.St ? 'Strouhal number St = ' + FM.St.toFixed(3) : 'waiting for steady vortex shedding…', x + 10, y + 103);
      },
    };

    return {
      ext,
      probe() { return { St: FM.St, view: S.view, tunnel: tunnel(), painted: FM.painted }; },
      step(dt) {
        accum += Math.min(dt, 0.1) * 60;
        let n = 0;
        if (last && env.pointer.down) {
          const [x, y] = toCell(env.pointer);
          const dx = x - last[0], dy = y - last[1];
          if (S.tool === 'push' || S.tool === 'dye') {
            hue = (hue + 2) % 360;
            const col = U.hsl2rgb(hue, 0.95, 0.55).map((c) => (c / 255) * 0.9);
            const f = S.tool === 'push' ? 1 : 0;
            const L = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 2));
            for (let k = 0; k < L; k++) splat(last[0] + (dx * (k + 1)) / L, last[1] + (dy * (k + 1)) / L, U.clamp(dx, -6, 6) * f, U.clamp(dy, -6, 6) * f, col, S.radius * 0.6);
          }
          last = [x, y];
        }
        while (accum >= 1 && n < 3) { sim(1); accum -= 1; n++; }
        if (accum > 3) accum = 0;
      },
      draw(ctx) {
        render();
        const W = env.W, H = env.H;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(off, 0.5, 0.5, gw - 1, gh - 1, 0, 0, W, H);
        if (S.tracers) {
          const sx = W / gw, sy = H / gh;
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.beginPath();
          for (let k = 0; k < NT; k++) ctx.rect((TX[k] - 0.5) * sx, (TY[k] - 0.5) * sy, 1.4, 1.4);
          ctx.fill();
        }
        if (env.pointer.inside) {
          ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(env.pointer.x, env.pointer.y, (S.radius * W) / gw, 0, U.TAU); ctx.stroke();
        }
        if (tunnel()) {
          ctx.fillStyle = 'rgba(219,229,255,0.7)'; ctx.font = '12px Segoe UI, sans-serif'; ctx.textBaseline = 'top';
          ctx.fillText('inflow →', 8, 8);
        }
      },
      pointerdown(pp) {
        last = toCell(pp);
        if (S.tool === 'wall' || S.tool === 'erase') this.pointermove(pp);
      },
      pointermove(pp) {
        if (!env.pointer.down || !last) return;
        if (S.tool === 'wall' || S.tool === 'erase') {
          const [x, y] = toCell(pp), r = S.radius * 0.6;
          for (let yy = Math.max(1, (y - r) | 0); yy <= Math.min(gh - 2, y + r); yy++)
            for (let xx = Math.max(1, (x - r) | 0); xx <= Math.min(gw - 2, x + r); xx++)
              if ((xx - x) ** 2 + (yy - y) ** 2 <= r * r) {
                const i = IX(xx, yy);
                if (S.tool === 'wall') { flag[i] = 1; u[i] = v[i] = cr[i] = cg[i] = cb[i] = 0; }
                else if (flag[i] === 1) flag[i] = 0;
              }
          last = [x, y];
        }
      },
      pointerup() { last = null; },
      resize(changed) { if (changed) { alloc(); preset(S.preset); } },
      reset() { preset(S.preset); },
      readouts() {
        let mx = 0, ke = 0, dye = 0, dv = 0, nf = 0;
        for (let i = 0; i < N; i++) {
          if (flag[i] !== 0) continue;
          const s2 = u[i] * u[i] + v[i] * v[i];
          if (s2 > mx) mx = s2;
          ke += s2; dye += cr[i] + cg[i] + cb[i]; nf++;
          dv += Math.abs(div[i]);
        }
        return [
          ['Grid', gw + ' × ' + gh], ['Pressure iterations', ITER], ['Max speed', Math.sqrt(mx).toFixed(2) + ' c/s'],
          ['Kinetic energy', U.fmt(ke * 0.5, 0)], ['Dye amount', U.fmt(dye, 0)], ['Mean |∇·u| (pre-proj.)', U.fmt(dv / Math.max(1, nf), 4)],
          ['Tracers', S.tracers ? NT : 'off'], ['Solver steps', stepsRun],
        ];
      },
    };
  },
});

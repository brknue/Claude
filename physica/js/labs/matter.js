'use strict';
/* LAB 13 — States of Matter: Lennard-Jones molecular dynamics (velocity Verlet, cell lists, thermostat, g(r)) */
PhysLab.define({
  id: 'matter',
  cat: 'Thermal & Statistical',
  title: 'States of Matter',
  subtitle: 'Atoms with real attraction and repulsion: melt a crystal, boil a droplet, or freeze a gas and watch grains form.',
  color: '#4ade80',
  tags: ['Molecular dynamics', 'Phase transitions', 'Lennard-Jones'],
  icon: `<svg viewBox="0 0 64 64" fill="currentColor"><g opacity=".95"><circle cx="10" cy="44" r="5"/><circle cx="21" cy="44" r="5"/><circle cx="32" cy="44" r="5"/><circle cx="15.5" cy="34.5" r="5"/><circle cx="26.5" cy="34.5" r="5"/><circle cx="21" cy="25" r="5"/></g><circle cx="44" cy="30" r="4" opacity=".7"/><circle cx="52" cy="42" r="4" opacity=".7"/><circle cx="50" cy="14" r="3.5" opacity=".5"/><circle cx="58" cy="26" r="3.5" opacity=".5"/><circle cx="38" cy="10" r="3.5" opacity=".5"/></svg>`,
  hint: 'Move the temperature slider to melt, boil or freeze · hold left mouse to heat a spot, right mouse to cool it',
  howto: [
    'Slide the <b>temperature</b>: below ~0.4 the atoms lock into a hexagonal crystal, above it they flow, above ~0.5–0.6 they boil off.',
    '<b>Left-hold</b> heats atoms near the cursor (a blowtorch); <b>right-hold</b> cools them.',
    'Colour by <b>neighbours</b>: cyan atoms have 6 neighbours (perfect crystal); yellow/orange mark defects, surfaces and liquid.',
    'The <b>g(r)</b> plot is the fingerprint of the phase: sharp repeating peaks = solid, a few soft bumps = liquid, flat = gas.',
  ],
  theory: `
  <h3>Lennard-Jones potential</h3>
  <div class="eq">U(r) = 4ε [ (σ/r)¹² − (σ/r)⁶ ]</div>
  <p>Atoms attract weakly at a distance (van der Waals forces) and repel strongly when their electron clouds overlap. This one formula is enough to produce solids, liquids and gases.</p>
  <h3>Molecular dynamics</h3>
  <div class="eq">v += F·Δt/2m ;  x += v·Δt ;  F = −∇U ;  v += F·Δt/2m</div>
  <p>Velocity-Verlet integration with a cell list so each atom only checks nearby cells (O(N) instead of O(N²)). The potential is cut off at 2.5σ.</p>
  <h3>Temperature</h3>
  <div class="eq">k_BT = ⟨½ m v²⟩   (2D)</div>
  <p>A Berendsen thermostat gently rescales velocities toward the target temperature. Turn it off to see energy conservation and latent heat: melting absorbs kinetic energy and the temperature drops.</p>
  <h3>Phases &amp; g(r)</h3>
  <p>The radial distribution function g(r) counts how many neighbours sit at distance r. In 2D Lennard-Jones matter the triple point is near T* ≈ 0.4 and the critical point near T* ≈ 0.5.</p>
  <h3>Things to try</h3>
  <ul>
    <li><b>Quench</b>: cool a gas suddenly — droplets nucleate, merge and freeze into grains with visible grain boundaries.</li>
    <li>Heat one corner of a crystal with the mouse and watch the melt front spread.</li>
    <li>Turn on gravity for a puddle with vapour above it.</li>
  </ul>`,

  create(env) {
    const { ui } = env;
    const TAU = U.TAU, q = env.q;
    const SIG = q >= 1 ? 15 : q >= 0.75 ? 14 : 13, NMAX = Math.round(260 + 640 * q), RC = 2.5, RC2 = RC * RC, HSTEP = 0.005;
    const S = { n: Math.round(200 + 340 * q), T: 0.18, thermo: true, g: 0, color: 'coord', preset: 'crystal', spf: 8 };
    const X = new Float64Array(NMAX), Y = new Float64Array(NMAX), VX = new Float64Array(NMAX), VY = new Float64Array(NMAX);
    const FX = new Float64Array(NMAX), FY = new Float64Array(NMAX), NB = new Uint8Array(NMAX), next = new Int32Array(NMAX);
    let N = 0, bw = 10, bh = 10, side = 0, gcw = 1, gch = 1, head = new Int32Array(1), pe = 0, Tm = 0, heat = null, frame = 0;
    const GB = 70, gr = new Float32Array(GB), Th = new U.Ring(300), Eh = new U.Ring(300);
    let sampleT = 0;

    function layout() {
      side = env.W >= 900 ? 300 : 0;
      bw = (env.W - side) / SIG; bh = env.H / SIG;
      gcw = Math.max(1, Math.floor(bw / RC)); gch = Math.max(1, Math.floor(bh / RC));
      head = new Int32Array(gcw * gch);
    }
    function init(name) {
      S.preset = name || S.preset;
      layout();
      N = Math.min(NMAX, Math.round(S.n));
      const a = 1.122;
      if (S.preset === 'gas' || S.preset === 'quench') {
        const cols = Math.ceil(Math.sqrt((N * bw) / bh)), rows = Math.ceil(N / cols);
        for (let i = 0; i < N; i++) { X[i] = ((i % cols) + 0.5) * ((bw - 2) / cols) + 1 + U.rand(-0.1, 0.1); Y[i] = (Math.floor(i / cols) + 0.5) * ((bh - 2) / rows) + 1 + U.rand(-0.1, 0.1); }
      } else {
        const cols = Math.min(Math.floor((bw - 4) / a), Math.ceil(Math.sqrt(N * 1.3))), rows = Math.ceil(N / cols);
        const x0 = bw / 2 - (cols * a) / 2, y0 = S.preset === 'puddle' ? bh - 1.2 - rows * a * 0.866 : bh / 2 - (rows * a * 0.866) / 2;
        for (let i = 0; i < N; i++) { const r = Math.floor(i / cols), c = i % cols; X[i] = x0 + (c + (r % 2) * 0.5) * a; Y[i] = y0 + r * a * 0.866; }
      }
      const T0 = { crystal: 0.15, liquid: 0.46, gas: 1.1, quench: 0.1, puddle: 0.42 }[S.preset];
      S.T = T0; tSl.set(T0);
      S.g = S.preset === 'puddle' ? 0.6 : 0; gSl.set(S.g);
      S.thermo = true; thT.set(true);
      const Tinit = S.preset === 'quench' ? 1.0 : T0, sd = Math.sqrt(Tinit);
      for (let i = 0; i < N; i++) { VX[i] = U.randn() * sd; VY[i] = U.randn() * sd; }
      forces();
      Th.clear(); Eh.clear(); gr.fill(0);
    }

    function forces() {
      head.fill(-1);
      for (let i = 0; i < N; i++) {
        FX[i] = 0; FY[i] = S.g; NB[i] = 0;
        const cx = U.clamp((X[i] / bw * gcw) | 0, 0, gcw - 1), cy = U.clamp((Y[i] / bh * gch) | 0, 0, gch - 1), c = cy * gcw + cx;
        next[i] = head[c]; head[c] = i;
      }
      pe = 0;
      for (let i = 0; i < N; i++) {
        const xi = X[i], yi = Y[i];
        const cx = U.clamp((xi / bw * gcw) | 0, 0, gcw - 1), cy = U.clamp((yi / bh * gch) | 0, 0, gch - 1);
        for (let oy = -1; oy <= 1; oy++) {
          const yy = cy + oy; if (yy < 0 || yy >= gch) continue;
          for (let ox = -1; ox <= 1; ox++) {
            const xx = cx + ox; if (xx < 0 || xx >= gcw) continue;
            for (let j = head[yy * gcw + xx]; j !== -1; j = next[j]) {
              if (j <= i) continue;
              const dx = X[j] - xi, dy = Y[j] - yi;
              let r2 = dx * dx + dy * dy;
              if (r2 >= RC2) continue;
              if (r2 < 2.25) { NB[i]++; NB[j]++; }
              if (r2 < 0.6) r2 = 0.6;
              const i2 = 1 / r2, i6 = i2 * i2 * i2, f = 24 * i2 * i6 * (2 * i6 - 1);
              FX[i] -= f * dx; FY[i] -= f * dy; FX[j] += f * dx; FY[j] += f * dy;
              pe += 4 * i6 * (i6 - 1) + 0.0163;
            }
          }
        }
      }
    }
    function mdStep(h) {
      const hh = h / 2;
      for (let i = 0; i < N; i++) {
        VX[i] += FX[i] * hh; VY[i] += FY[i] * hh;
        X[i] += VX[i] * h; Y[i] += VY[i] * h;
        if (X[i] < 0.5) { X[i] = 0.5; VX[i] = Math.abs(VX[i]); } else if (X[i] > bw - 0.5) { X[i] = bw - 0.5; VX[i] = -Math.abs(VX[i]); }
        if (Y[i] < 0.5) { Y[i] = 0.5; VY[i] = Math.abs(VY[i]); } else if (Y[i] > bh - 0.5) { Y[i] = bh - 0.5; VY[i] = -Math.abs(VY[i]); }
      }
      forces();
      let ke = 0;
      for (let i = 0; i < N; i++) { VX[i] += FX[i] * hh; VY[i] += FY[i] * hh; ke += VX[i] * VX[i] + VY[i] * VY[i]; }
      Tm = (0.5 * ke) / Math.max(1, N);
      if (S.thermo && Tm > 1e-9) {
        const lam = U.clamp(Math.sqrt(1 + 0.03 * (S.T / Tm - 1)), 0.9, 1.1);
        for (let i = 0; i < N; i++) { VX[i] *= lam; VY[i] *= lam; }
      }
    }
    function computeG() {
      const cnt = new Float32Array(GB), rmax = 5, dr = rmax / GB;
      const M = Math.min(N, 260);
      for (let a = 0; a < M; a++) {
        const i = (a * 7919) % N;
        for (let j = 0; j < N; j++) {
          if (j === i) continue;
          const d = Math.hypot(X[j] - X[i], Y[j] - Y[i]);
          if (d < rmax) cnt[(d / dr) | 0] += 1 / (TAU * (d + 0.01) * dr);
        }
      }
      let mx = 1e-9;
      for (let b = 0; b < GB; b++) { gr[b] = gr[b] * 0.8 + (cnt[b] / M) * 0.2; }
    }
    function phase() {
      let six = 0, sum = 0;
      for (let i = 0; i < N; i++) { if (NB[i] === 6) six++; sum += NB[i]; }
      const f6 = six / Math.max(1, N), mean = sum / Math.max(1, N);
      if (mean < 1.2) return ['Gas', '#f87171'];
      if (f6 > 0.55) return ['Solid (crystal)', '#22d3ee'];
      if (mean > 3.2 && f6 < 0.35) return ['Liquid', '#facc15'];
      return ['Mixed / coexistence', '#a3e635'];
    }

    /* ---------- UI ---------- */
    ui.section('Start from');
    ui.buttons([
      { label: '❄ Crystal', onClick: () => init('crystal') }, { label: '💧 Liquid droplet', onClick: () => init('liquid') },
      { label: '☁ Gas', onClick: () => init('gas') }, { label: '⚡ Quench (gas → cold)', onClick: () => init('quench') },
      { label: 'Puddle (gravity)', onClick: () => init('puddle') },
    ]);
    ui.section('Thermodynamics');
    const tSl = ui.slider('Temperature T*', { min: 0.01, max: 2, value: S.T, log: true, fmt: (v) => v.toFixed(3) + ' ε/k_B', onInput: (v) => (S.T = v) });
    const thT = ui.toggle('Thermostat (hold T at target)', S.thermo, (v) => (S.thermo = v));
    const gSl = ui.slider('Gravity', { min: 0, max: 3, step: 0.05, value: S.g, fmt: (v) => v.toFixed(2), onInput: (v) => (S.g = v) });
    ui.slider('Number of atoms', { min: 30, max: NMAX, step: 10, value: S.n, fmt: (v) => v + '', onInput: (v) => (S.n = v), onChange: () => init() });
    ui.slider('Simulation speed', { min: 1, max: 20, step: 1, value: S.spf, fmt: (v) => v + ' steps/frame', onInput: (v) => (S.spf = v) });
    ui.section('Display');
    ui.select('Colour atoms by', [['coord', 'Number of neighbours'], ['speed', 'Speed (temperature)']], S.color, (v) => (S.color = v));
    ui.note('Units are "reduced": lengths in σ, energies in ε. For argon σ = 0.34 nm, ε/k_B = 120 K — so T* = 0.4 is about 48 K.');

    init('crystal');

    const CCOL = ['#e5e7eb', '#fca5a5', '#fb923c', '#fbbf24', '#fde047', '#a3e635', '#22d3ee', '#818cf8', '#c084fc'];
    const SCOL = Array.from({ length: 12 }, (_, k) => { const [r, g, b] = U.hsl2rgb(225 - k * 20, 0.9, 0.6); return `rgb(${r},${g},${b})`; });

    return {
      step(dt) {
        const n = U.clamp(Math.round(S.spf * dt * 60), 1, 40);
        for (let k = 0; k < n; k++) mdStep(HSTEP);
        if (heat) {
          const f = heat.hot ? 1.04 : 0.95;
          for (let i = 0; i < N; i++) if ((X[i] - heat.x) ** 2 + (Y[i] - heat.y) ** 2 < 20) { VX[i] *= f; VY[i] *= f; if (heat.hot) { VX[i] += U.randn() * 0.06; VY[i] += U.randn() * 0.06; } }
        }
        if (++frame % 6 === 0) computeG();
        sampleT += dt;
        if (sampleT > 0.08) { sampleT = 0; Th.push(Tm); Eh.push(pe / Math.max(1, N)); }
      },
      draw(ctx) {
        const W = env.W, H = env.H;
        ctx.fillStyle = '#05080f'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#080d1a'; ctx.fillRect(0, 0, bw * SIG, H);
        ctx.strokeStyle = 'rgba(120,220,160,0.25)'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, bw * SIG - 2, H - 2);
        const cols = S.color === 'coord' ? CCOL : SCOL, paths = cols.map(() => new Path2D()), R = SIG * 0.48, vs = Math.sqrt(Math.max(Tm, 0.02));
        for (let i = 0; i < N; i++) {
          const b = S.color === 'coord' ? Math.min(8, NB[i]) : Math.min(11, (Math.hypot(VX[i], VY[i]) / vs / 2.6 * 11) | 0);
          const x = X[i] * SIG, y = Y[i] * SIG;
          paths[b].moveTo(x + R, y); paths[b].arc(x, y, R, 0, TAU);
        }
        paths.forEach((p, k) => { ctx.fillStyle = cols[k]; ctx.fill(p); });
        if (heat) {
          const g = ctx.createRadialGradient(heat.x * SIG, heat.y * SIG, 0, heat.x * SIG, heat.y * SIG, 4.5 * SIG);
          g.addColorStop(0, heat.hot ? 'rgba(255,100,40,0.4)' : 'rgba(80,170,255,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(heat.x * SIG, heat.y * SIG, 4.5 * SIG, 0, TAU); ctx.fill();
        }
        // phase badge
        const [name, col] = phase();
        U.panel(ctx, 12, 12, 210, 44, 'Detected phase');
        ctx.fillStyle = col; ctx.font = '700 15px Segoe UI, sans-serif'; ctx.textBaseline = 'top'; ctx.fillText(name, 22, 28);
        // plots
        const px = side ? W - side + 8 : W - 240, pw = side ? side - 20 : 228;
        U.panel(ctx, px, 12, pw, 170, 'Radial distribution g(r)');
        let mx = 1e-6; for (let b = 0; b < GB; b++) mx = Math.max(mx, gr[b]);
        ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1.8; ctx.beginPath();
        for (let b = 0; b < GB; b++) { const x = px + 10 + (b / (GB - 1)) * (pw - 20), y = 12 + 152 - (gr[b] / mx) * 118; b ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        ctx.fillStyle = '#9fb3e0'; ctx.font = '10px Segoe UI, sans-serif';
        for (let r = 1; r <= 4; r++) ctx.fillText(r + 'σ', px + 6 + (r / 5) * (pw - 20), 168);
        if (side) {
          U.panel(ctx, px, 194, pw, 110, 'Temperature T*');
          const [lo, hi] = Th.range();
          ctx.strokeStyle = '#f87171'; ctx.lineWidth = 1.5; Th.draw(ctx, px + 10, 220, pw - 20, 74, Math.min(lo, S.T) * 0.9, Math.max(hi, S.T) * 1.1 + 0.01);
          U.panel(ctx, px, 316, pw, 110, 'Potential energy / atom');
          const [el, eh] = Eh.range();
          ctx.strokeStyle = '#60a5fa'; Eh.draw(ctx, px + 10, 342, pw - 20, 74, el - 0.05, eh + 0.05);
          // coordination legend
          if (S.color === 'coord' && 438 + 60 < H) {
            U.panel(ctx, px, 438, pw, 54, 'Neighbours');
            for (let k = 0; k <= 7; k++) { ctx.fillStyle = CCOL[k]; ctx.beginPath(); ctx.arc(px + 20 + k * 30, 470, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#9fb3e0'; ctx.fillText(k + '', px + 17 + k * 30, 480); }
          }
        }
      },
      pointerdown(p, e) { heat = { x: p.x / SIG, y: p.y / SIG, hot: e.button !== 2 }; },
      pointermove(p) { if (heat) { heat.x = p.x / SIG; heat.y = p.y / SIG; } },
      pointerup() { heat = null; },
      resize(changed) { if (changed) { layout(); for (let i = 0; i < N; i++) { X[i] = U.clamp(X[i], 0.5, bw - 0.5); Y[i] = U.clamp(Y[i], 0.5, bh - 0.5); } } },
      reset() { init(); },
      readouts() {
        let six = 0, sum = 0;
        for (let i = 0; i < N; i++) { if (NB[i] === 6) six++; sum += NB[i]; }
        return [
          ['Atoms', N], ['Temperature T*', Tm.toFixed(3)], ['Target T*', S.thermo ? S.T.toFixed(3) : 'free'], ['Phase', phase()[0]],
          ['Potential E / atom', (pe / Math.max(1, N)).toFixed(3) + ' ε'], ['Kinetic E / atom', Tm.toFixed(3) + ' ε'],
          ['Mean neighbours', (sum / Math.max(1, N)).toFixed(2)], ['6-fold atoms', ((six / Math.max(1, N)) * 100).toFixed(0) + ' %'], ['Density', (N / (bw * bh)).toFixed(3) + ' /σ²'],
        ];
      },
    };
  },
});

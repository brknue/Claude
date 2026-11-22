'use strict';
/* Brownian motion of colloids: Stokes–Einstein diffusion, MSD analysis, Perrin's Avogadro measurement, optical trap */
PhysLab.define({
  id: 'brownian',
  title: 'Brownian Motion & Optical Trap',
  subtitle: 'Colloids in water under a microscope: mean-square displacement, Stokes–Einstein diffusion, Perrin’s measurement of Avogadro’s number, optical-tweezer stiffness.',
  color: '#1f5fbf',
  cat: 'Thermodynamics & Statistical',
  tags: ['Diffusion', 'Langevin', 'MSD', 'Avogadro', 'Optical tweezers'],
  hint: 'Particles follow overdamped Langevin dynamics with real parameters · the MSD plot is measured from the tracks',
  howto: [
    'Each bead performs a random walk with the exact Stokes–Einstein diffusion coefficient for the chosen temperature, viscosity and radius. Positions are sampled at the camera frame rate.',
    'The <b>MSD</b> is averaged over all particles from their start positions; D_measured = MSD / 4t (2-D). From D you get k_B and Avogadro’s number — as Jean Perrin did in 1908.',
    'Turn on the <b>optical trap</b> (stiffness κ): beads are held near the centre, the MSD saturates at 4k_BT/κ and the position variance gives κ via equipartition.',
  ],
  theory: `
  <h3>Langevin dynamics (overdamped)</h3>
  <div class="eq">γ dx/dt = −κ x + √(2γk_BT) ξ(t),   γ = 6πηr  (Stokes drag)</div>
  <p>Solved exactly over each frame interval Δt (Ornstein–Uhlenbeck update), so results do not depend on the step size:</p>
  <div class="eq">x ← x e^(−Δt/τ) + √(D τ (1 − e^(−2Δt/τ))) · N(0,1),   τ = γ/κ,   free particle: x ← x + √(2DΔt) · N(0,1)</div>
  <h3>Stokes–Einstein relation</h3>
  <div class="eq">D = k_B T / (6 π η r)</div>
  <div class="eq">2-D mean-square displacement (free): ⟨r²(t)⟩ = 4 D t</div>
  <div class="eq">Perrin: k_B = 6πηr D / T,   N_A = R / k_B   (R = 8.314 462 618 J/(mol·K))</div>
  <h3>Optical trap</h3>
  <div class="eq">Equipartition: κ ⟨x²⟩ = k_B T,   corner frequency f_c = κ / (2πγ)</div>
  <div class="eq">Trapped MSD: ⟨r²(t)⟩ = (4k_BT/κ)(1 − e^(−t/τ))</div>
  <p>Water viscosity: 1.79 mPa·s at 0 °C, 1.00 at 20 °C, 0.89 at 25 °C, 0.65 at 40 °C, 0.28 at 100 °C.</p>`,
  experiment: { duration: 30, interval: 0.1, param: 'Temperature T', from: 280, to: 360, points: 9, resetEach: true, settle: 0, measure: 20, stat: 'final' },
  protocols: [
    { t: 'Perrin’s experiment: Avogadro’s number', h: 'Free particles, record 30 s. Fit a proportional line to MSD vs time: slope = 4D. The readouts convert D into k_B and N_A.', setup: { set: { 'Optical trap': false }, mode: 'time', duration: 30, interval: 0.1, reset: true, x: 'Time', y: 'MSD ⟨r²⟩', fit: 'prop' } },
    { t: 'D vs particle radius', h: 'Sweep the radius; restart at each point and record the measured D after 15 s. A power law should give exponent −1.', setup: { set: { 'Optical trap': false }, mode: 'sweep', param: 'Particle radius r', from: 0.1, to: 3, points: 8, logSpace: true, resetEach: true, settle: 0, measure: 15, stat: 'final', y: 'D measured', fit: 'power' } },
    { t: 'D vs temperature', h: 'Sweep T (viscosity fixed) and record D: it grows linearly with T. (In real water η also drops with T.)', setup: { set: { 'Optical trap': false }, mode: 'sweep', param: 'Temperature T', from: 280, to: 360, points: 9, resetEach: true, settle: 0, measure: 20, stat: 'final', y: 'D measured', fit: 'linear' } },
    { t: 'Calibrate an optical trap', h: 'Trap on: sweep κ and record ⟨x²⟩. A power law gives exponent −1; κ from equipartition should equal the set value.', setup: { set: { 'Optical trap': true }, mode: 'sweep', param: 'Trap stiffness κ', from: 0.5, to: 20, points: 8, logSpace: true, resetEach: true, settle: 2, measure: 15, stat: 'mean', y: 'Position variance ⟨x²⟩', fit: 'power' } },
  ],

  create(env) {
    const { ui } = env;
    const kB = 1.380649e-23, R = 8.314462618;
    const S = { T: 298.15, eta: 0.89, r: 0.5, n: 60, trap: false, kappa: 2, fps: 30, field: 40, tracks: true };
    let X, Y, X0, Y0, t = 0, acc = 0;
    let trail = [];
    const D = () => (kB * S.T) / (6 * Math.PI * S.eta * 1e-3 * S.r * 1e-6) * 1e12; // µm²/s
    const gamma = () => 6 * Math.PI * S.eta * 1e-3 * S.r * 1e-6; // kg/s
    const kap = () => S.kappa * 1e-6; // pN/µm -> N/m
    function reset() {
      const n = Math.round(S.n);
      X = new Float64Array(n); Y = new Float64Array(n); X0 = new Float64Array(n); Y0 = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        if (S.trap) { const s = Math.sqrt((kB * S.T) / kap()) * 1e6; X[i] = s * U.randn(); Y[i] = s * U.randn(); }
        else { X[i] = (Math.random() - 0.5) * S.field * 0.9; Y[i] = (Math.random() - 0.5) * S.field * 0.9; }
        X0[i] = X[i]; Y0[i] = Y[i];
      }
      t = 0; acc = 0; trail = Array.from({ length: n }, () => []);
      msdHist.length = 0;
    }
    const msdHist = [];
    function frameStep(dt) {
      const d = D();
      if (S.trap) {
        const tau = gamma() / kap(), e1 = Math.exp(-dt / tau), s = Math.sqrt(d * tau * (1 - e1 * e1));
        for (let i = 0; i < X.length; i++) { X[i] = X[i] * e1 + s * U.randn(); Y[i] = Y[i] * e1 + s * U.randn(); }
      } else {
        const s = Math.sqrt(2 * d * dt);
        for (let i = 0; i < X.length; i++) { X[i] += s * U.randn(); Y[i] += s * U.randn(); }
      }
      t += dt;
      if (S.tracks) for (let i = 0; i < Math.min(X.length, 40); i++) { trail[i].push(X[i], Y[i]); if (trail[i].length > 600) trail[i].splice(0, 2); }
      const m = msd();
      msdHist.push([t, m.msd]); if (msdHist.length > 3000) msdHist.shift();
    }
    function msd() {
      let s = 0, sx2 = 0, mx = 0, my = 0;
      const n = X.length;
      for (let i = 0; i < n; i++) { const dx = X[i] - X0[i], dy = Y[i] - Y0[i]; s += dx * dx + dy * dy; mx += dx; my += dy; sx2 += X[i] * X[i]; }
      return { msd: s / n, drift: Math.hypot(mx / n, my / n), varx: sx2 / n };
    }

    ui.section('Sample');
    ui.slider('Temperature T', { min: 273.15, max: 373.15, step: 0.05, value: S.T, fmt: (v) => v.toFixed(2) + ' K', onInput: (v) => (S.T = v) });
    ui.slider('Viscosity η', { min: 0.2, max: 20, value: S.eta, log: true, fmt: (v) => v.toPrecision(3) + ' mPa·s', onInput: (v) => (S.eta = v) });
    ui.slider('Particle radius r', { min: 0.05, max: 5, value: S.r, log: true, fmt: (v) => v.toPrecision(3) + ' µm', onInput: (v) => (S.r = v) });
    ui.slider('Number of particles', { min: 1, max: 400, step: 1, value: S.n, fmt: (v) => v + '', onInput: (v) => (S.n = v), onChange: reset });
    ui.section('Optical trap');
    ui.toggle('Optical trap', S.trap, (v) => { S.trap = v; reset(); });
    ui.slider('Trap stiffness κ', { min: 0.05, max: 100, value: S.kappa, log: true, fmt: (v) => v.toPrecision(3) + ' pN/µm', onInput: (v) => (S.kappa = v) });
    ui.section('Microscope');
    ui.slider('Camera frame rate', { min: 1, max: 1000, value: S.fps, log: true, fmt: (v) => v.toPrecision(3) + ' fps', onInput: (v) => (S.fps = v) });
    ui.slider('Field of view', { min: 5, max: 200, value: S.field, log: true, fmt: (v) => v.toPrecision(3) + ' µm', onInput: (v) => (S.field = v) });
    ui.toggle('Show tracks (first 40 particles)', S.tracks, (v) => (S.tracks = v));
    ui.buttons([{ label: 'Restart', primary: true, onClick: reset }, { label: 'Water at 20 °C', onClick: () => { const reg = PhysLab.internal.reg.params; reg.find((p) => p.label === 'Temperature T').set(293.15); reg.find((p) => p.label === 'Viscosity η').set(1.002); } }]);
    reset();

    return {
      reset,
      step(dt) {
        acc += dt;
        const fdt = 1 / S.fps;
        let k = 0;
        while (acc >= fdt && k < 2000) { frameStep(fdt); acc -= fdt; k++; }
        if (k >= 2000) acc = 0;
      },
      draw(ctx) {
        const W = env.W, H = env.H;
        ctx.fillStyle = '#111214'; ctx.fillRect(0, 0, W, H);
        const wide = W > 760, vs = wide ? Math.min(H - 16, W * 0.5) : Math.min(W - 16, H * 0.5);
        const vx = 8, vy = 8, sc = vs / S.field;
        // microscope view (periodic display)
        ctx.fillStyle = '#d9dcd6'; ctx.fillRect(vx, vy, vs, vs);
        ctx.save(); ctx.beginPath(); ctx.rect(vx, vy, vs, vs); ctx.clip();
        const wrap = (v) => { const f = S.field; return ((((v + f / 2) % f) + f) % f) - f / 2; };
        if (S.tracks) {
          ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(31,95,191,0.55)';
          for (let i = 0; i < trail.length && i < 40; i++) {
            const tr = trail[i]; if (tr.length < 4) continue;
            ctx.beginPath(); let px = null;
            for (let k = 0; k < tr.length; k += 2) {
              const x = vx + vs / 2 + wrap(tr[k]) * sc, y = vy + vs / 2 + wrap(tr[k + 1]) * sc;
              if (px !== null && Math.hypot(x - px[0], y - px[1]) > vs / 2) ctx.moveTo(x, y); else if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
              px = [x, y];
            }
            ctx.stroke();
          }
        }
        const rp = Math.max(1.5, S.r * sc);
        ctx.fillStyle = '#343a40';
        for (let i = 0; i < X.length; i++) { ctx.beginPath(); ctx.arc(vx + vs / 2 + wrap(X[i]) * sc, vy + vs / 2 + wrap(Y[i]) * sc, rp, 0, U.TAU); ctx.fill(); }
        if (S.trap) { ctx.strokeStyle = 'rgba(201,42,42,0.8)'; ctx.beginPath(); ctx.arc(vx + vs / 2, vy + vs / 2, 6, 0, U.TAU); ctx.stroke(); }
        ctx.restore();
        // scale bar
        const bar = U.niceStep(S.field / 4, 1);
        ctx.fillStyle = '#111'; ctx.fillRect(vx + 10, vy + vs - 16, bar * sc, 4);
        U.label(ctx, vx + 10, vy + vs - 26, bar + ' µm', '#111');
        // MSD plot
        const px = wide ? vs + 20 : 4, py = wide ? 6 : vs + 16, pw = W - px - 4, phh = H - py - 6;
        const tmax = Math.max(1, t);
        const theory = (tt) => (S.trap ? ((4 * kB * S.T) / kap()) * 1e12 * (1 - Math.exp(-tt / (gamma() / kap()))) : 4 * D() * tt);
        let ymax = theory(tmax) * 1.3; for (const [, m] of msdHist) ymax = Math.max(ymax, m * 1.05);
        const F = U.plot(ctx, px, py, pw, phh, { x0: 0, x1: tmax, y0: 0, y1: ymax || 1, xl: 'time t (s)', yl: 'MSD ⟨r²⟩ (µm²)', title: `Mean-square displacement of ${X.length} particles (theory dashed)` });
        F.clip();
        const xs = []; for (let i = 0; i <= 100; i++) xs.push((tmax * i) / 100);
        U.curve(ctx, F, xs, xs.map(theory), '#e9ecef', 1.3, [6, 4]);
        U.curve(ctx, F, msdHist.map((m) => m[0]), msdHist.map((m) => m[1]), '#4dabf7', 2);
        ctx.restore();
      },
      readouts() {
        const m = msd(), d = D(), dm = t > 0 ? m.msd / (4 * t) : NaN;
        const kBest = isFinite(dm) && dm > 0 ? (6 * Math.PI * S.eta * 1e-3 * S.r * 1e-6 * dm * 1e-12) / S.T : NaN;
        const out = [
          ['Time', t.toFixed(3) + ' s'], ['MSD ⟨r²⟩', m.msd.toPrecision(5) + ' µm²'], ['RMS displacement', Math.sqrt(m.msd).toPrecision(5) + ' µm'],
          ['D (Stokes–Einstein)', d.toPrecision(5) + ' µm²/s'],
        ];
        if (!S.trap) out.push(['D measured', isFinite(dm) ? dm.toPrecision(5) + ' µm²/s' : '—'], ['k_B estimate', isFinite(kBest) ? kBest.toPrecision(4) + ' J/K' : '—'], ['Avogadro N_A estimate', isFinite(kBest) ? (R / kBest).toPrecision(4) + ' 1/mol' : '—']);
        else {
          const kEq = (kB * S.T) / (m.varx * 1e-12) * 1e6;
          out.push(['Position variance ⟨x²⟩', m.varx.toPrecision(5) + ' µm²'], ['Theory k_BT/κ', ((kB * S.T) / kap() * 1e12).toPrecision(5) + ' µm²'],
            ['κ from equipartition', kEq.toPrecision(5) + ' pN/µm'], ['Corner frequency f_c', (kap() / (2 * Math.PI * gamma())).toPrecision(5) + ' Hz'], ['Relaxation time τ = γ/κ', ((gamma() / kap()) * 1000).toPrecision(4) + ' ms']);
        }
        out.push(['Mean drift', m.drift.toPrecision(3) + ' µm'], ['Drag coefficient γ', (gamma() * 1e9).toPrecision(4) + ' nN·s/m'], ['Particles', X.length]);
        return out;
      },
    };
  },
});

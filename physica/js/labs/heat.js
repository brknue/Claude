'use strict';
/* 1-D heat conduction in a rod of a real material: Crank–Nicolson, fixed / insulated / convective ends */
PhysLab.define({
  id: 'heat',
  title: 'Heat Conduction',
  subtitle: 'Transient heat flow in a rod of copper, steel, glass, water, wood …: temperature profiles, heat flux, diffusion time and steady state.',
  color: '#1f5fbf',
  cat: 'Thermodynamics & Statistical',
  tags: ['Heat equation', 'Diffusion', 'Fourier', 'Materials', 'Crank–Nicolson'],
  hint: 'Pick a material and boundary conditions · drag on the rod to heat or cool it · probes record temperature over time',
  howto: [
    'The rod is split into 120 cells; the heat equation is solved with the Crank–Nicolson scheme, which is stable for any time step.',
    '<b>Time scale</b> sets the physical time per real second (copper takes minutes, wood takes days).',
    '<b>Drag on the rod</b> to heat a spot (right-click or “Cool instead” on touch screens to cool).',
    'Three probes record T at chosen positions; record them in the Experiment tab and fit the approach to steady state.',
  ],
  theory: `
  <h3>Heat equation</h3>
  <div class="eq">∂T/∂t = α ∂²T/∂x²,   α = k / (ρ c)</div>
  <div class="eq">Fourier’s law: q = −k ∂T/∂x   (W/m²)</div>
  <h3>Boundary conditions</h3>
  <div class="eq">Fixed: T(0) = T_L     Insulated: ∂T/∂x = 0     Convective: −k ∂T/∂x = h (T_∞ − T)</div>
  <h3>Time scales</h3>
  <div class="eq">Diffusion time t_d = L²/α,   Fourier number Fo = α t / L²</div>
  <p>With both ends fixed, the deviation from the linear steady state decays as a sum of modes; after a while only the slowest survives: ΔT ∝ e^(−α π² t / L²). The “Deviation from steady state” readout lets you measure α from an exponential fit. With one end fixed and one insulated the slowest rate is α π²/(4L²).</p>
  <h3>Material data (20 °C)</h3>
  <table><tr><th>Material</th><th>k (W/m·K)</th><th>ρ (kg/m³)</th><th>c (J/kg·K)</th></tr>
  <tr><td>Copper</td><td>401</td><td>8960</td><td>385</td></tr><tr><td>Aluminium</td><td>237</td><td>2700</td><td>897</td></tr>
  <tr><td>Carbon steel</td><td>50</td><td>7850</td><td>490</td></tr><tr><td>Stainless steel</td><td>16</td><td>8000</td><td>500</td></tr>
  <tr><td>Granite</td><td>2.8</td><td>2700</td><td>790</td></tr><tr><td>Concrete</td><td>1.4</td><td>2300</td><td>880</td></tr>
  <tr><td>Glass</td><td>1.0</td><td>2500</td><td>840</td></tr><tr><td>Water</td><td>0.60</td><td>998</td><td>4182</td></tr>
  <tr><td>Pine wood</td><td>0.12</td><td>500</td><td>1700</td></tr><tr><td>Air</td><td>0.026</td><td>1.2</td><td>1005</td></tr></table>`,
  experiment: { duration: 30, interval: 0.1 },
  protocols: [
    { t: 'Measure the thermal diffusivity of copper', h: 'Fixed ends (100 °C / 0 °C), start at 0 °C, record 30 s and fit an exponential to “Deviation from steady state” after the first few seconds. α = |k| L² / π².', setup: { set: { Material: 'copper', 'Left end': 'fixed', 'Right end': 'fixed', 'Initial state': 'uniform' }, mode: 'time', duration: 30, interval: 0.1, reset: true, x: 'Physical time', y: 'Deviation from steady state', fit: 'exp' } },
    { t: 'Diffusion time vs rod length', h: 'Sweep the length and record the diffusion time L²/α — a power law with exponent 2. Compare with the time a probe needs to reach half way.', setup: { mode: 'sweep', param: 'Rod length L', from: 0.05, to: 1, points: 8, logSpace: true, settle: 0, measure: 0.1, stat: 'final', y: 'Diffusion time L²/α', fit: 'power' } },
    { t: 'Cooling with convection (Newton’s law)', h: 'Uniform hot rod, both ends convective into 20 °C air: record the mean temperature. For a good conductor it decays exponentially toward 20 °C — fit “exponential + offset”.', setup: { set: { Material: 'aluminium', 'Left end': 'conv', 'Right end': 'conv', 'Initial state': 'hot' }, mode: 'time', duration: 40, interval: 0.2, reset: true, x: 'Physical time', y: 'Mean temperature', fit: 'expoff' } },
    { t: 'Spreading of a heat pulse', h: 'Pulse in the centre, insulated ends: record the probe at the centre. Its peak decays like t^(−½) — fit a power law to the late part.', setup: { set: { 'Initial state': 'pulse', 'Left end': 'ins', 'Right end': 'ins' }, mode: 'time', duration: 30, interval: 0.1, reset: true, x: 'Physical time', y: 'T probe 2' } },
  ],

  create(env) {
    const { ui } = env;
    const MAT = {
      copper: ['Copper', 401, 8960, 385], aluminium: ['Aluminium', 237, 2700, 897], steel: ['Carbon steel', 50, 7850, 490], stainless: ['Stainless steel', 16, 8000, 500],
      granite: ['Granite', 2.8, 2700, 790], concrete: ['Concrete', 1.4, 2300, 880], glass: ['Glass', 1.0, 2500, 840], water: ['Water (no convection)', 0.6, 998, 4182], pine: ['Pine wood', 0.12, 500, 1700], air: ['Air (still)', 0.026, 1.2, 1005],
    };
    const S = { mat: 'copper', L: 0.3, left: 'fixed', right: 'fixed', TL: 100, TR: 0, T0: 0, init: 'uniform', h: 25, Tinf: 20, scale: 1, autoScale: true, p1: 0.25, p2: 0.5, p3: 0.75 };
    const N = 120;
    let T = new Float64Array(N), Tinit = new Float64Array(N), t = 0, heatSpot = null, Q0 = 0;
    const a = new Float64Array(N), b = new Float64Array(N), c = new Float64Array(N), d = new Float64Array(N), cp = new Float64Array(N), dp = new Float64Array(N);
    const PH = 1500, ph = []; let phT = 0;
    const prop = () => { const m = MAT[S.mat]; return { k: m[1], rho: m[2], cp: m[3], alpha: m[1] / (m[2] * m[3]) }; };
    const dx = () => S.L / (N - 1);
    function reset() {
      for (let i = 0; i < N; i++) {
        const x = i / (N - 1);
        let v = S.T0;
        if (S.init === 'step') v = x < 0.5 ? S.TL : S.TR;
        else if (S.init === 'pulse') v = S.T0 + 100 * Math.exp(-((x - 0.5) ** 2) / (2 * 0.03 ** 2));
        else if (S.init === 'hot') v = 100;
        else if (S.init === 'linear') v = S.TL + (S.TR - S.TL) * x;
        T[i] = v;
      }
      applyFixed();
      Tinit.set(T);
      t = 0; ph.length = 0; phT = 0;
      Q0 = heatContent();
    }
    function applyFixed() { if (S.left === 'fixed') T[0] = S.TL; if (S.right === 'fixed') T[N - 1] = S.TR; }
    function heatContent() { const p = prop(); let s = 0; for (let i = 0; i < N; i++) s += T[i] * (i === 0 || i === N - 1 ? 0.5 : 1); return p.rho * p.cp * s * dx(); }
    // operator A: dT_i/dt = r(T_{i-1} - 2T_i + T_{i+1}) with ghost nodes for Neumann / Robin ends
    function stepCN(h) {
      const p = prop(), r = p.alpha / (dx() * dx()), beta = (2 * dx() * S.h) / p.k;
      // build (I - h/2 A) T^{n+1} = (I + h/2 A) T^n + h * b
      for (let i = 0; i < N; i++) {
        let lo = r, di = -2 * r, up = r, src = 0;
        if (i === 0) {
          if (S.left === 'fixed') { a[0] = 0; b[0] = 1; c[0] = 0; d[0] = S.TL; continue; }
          lo = 0; up = 2 * r; if (S.left === 'conv') { di -= r * beta; src = r * beta * S.Tinf; }
        }
        if (i === N - 1) {
          if (S.right === 'fixed') { a[i] = 0; b[i] = 1; c[i] = 0; d[i] = S.TR; continue; }
          up = 0; lo = 2 * r; if (S.right === 'conv') { di -= r * beta; src = r * beta * S.Tinf; }
        }
        if (heatSpot && Math.abs(i - heatSpot.i) <= 2) src += (heatSpot.sign * 150) / timeScale(); // heater: ~150 K per real second
        const AT = di * T[i] + (i > 0 ? lo * T[i - 1] : 0) + (i < N - 1 ? up * T[i + 1] : 0) + src;
        a[i] = -(h / 2) * lo; b[i] = 1 - (h / 2) * di; c[i] = -(h / 2) * up;
        d[i] = T[i] + (h / 2) * AT + (h / 2) * src;
      }
      // Thomas algorithm
      cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
      for (let i = 1; i < N; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
      T[N - 1] = dp[N - 1];
      for (let i = N - 2; i >= 0; i--) T[i] = dp[i] - cp[i] * T[i + 1];
    }
    function steadyState(x) {
      if (S.left === 'fixed' && S.right === 'fixed') return S.TL + (S.TR - S.TL) * x;
      if (S.left === 'fixed' && S.right === 'ins') return S.TL;
      if (S.left === 'ins' && S.right === 'fixed') return S.TR;
      if (S.left === 'conv' && S.right === 'conv') return S.Tinf;
      if ((S.left === 'conv' && S.right === 'ins') || (S.left === 'ins' && S.right === 'conv')) return S.Tinf;
      if (S.left === 'fixed' && S.right === 'conv') { const p = prop(), Bi = (S.h * S.L) / p.k, TRs = (S.TL + Bi * S.Tinf) / (1 + Bi); return S.TL + (TRs - S.TL) * x; }
      if (S.left === 'conv' && S.right === 'fixed') { const p = prop(), Bi = (S.h * S.L) / p.k, TLs = (S.TR + Bi * S.Tinf) / (1 + Bi); return TLs + (S.TR - TLs) * x; }
      return NaN;
    }
    const probe = (f) => { const x = f * (N - 1), i = Math.min(N - 2, Math.floor(x)), u = x - i; return T[i] * (1 - u) + T[i + 1] * u; };
    function timeScale() { if (!S.autoScale) return S.scale; const p = prop(); return (S.L * S.L) / p.alpha / 20; }
    const fmtTime = (s) => (s < 120 ? s.toFixed(2) + ' s' : s < 7200 ? (s / 60).toFixed(2) + ' min' : s < 172800 ? (s / 3600).toFixed(2) + ' h' : (s / 86400).toFixed(2) + ' d');

    ui.section('Rod');
    ui.select('Material', Object.entries(MAT).map(([k, v]) => [k, v[0]]), S.mat, (v) => { S.mat = v; });
    ui.slider('Rod length L', { min: 0.01, max: 2, value: S.L, log: true, fmt: (v) => (v < 0.1 ? (v * 1000).toFixed(1) + ' mm' : v.toFixed(3) + ' m'), onInput: (v) => (S.L = v) });
    ui.section('Boundary conditions');
    const BC = [['fixed', 'Fixed temperature'], ['ins', 'Insulated'], ['conv', 'Convective (h, T∞)']];
    ui.select('Left end', BC, S.left, (v) => { S.left = v; applyFixed(); });
    ui.slider('Left temperature T_L', { min: -50, max: 500, step: 1, value: S.TL, fmt: (v) => v + ' °C', onInput: (v) => { S.TL = v; applyFixed(); } });
    ui.select('Right end', BC, S.right, (v) => { S.right = v; applyFixed(); });
    ui.slider('Right temperature T_R', { min: -50, max: 500, step: 1, value: S.TR, fmt: (v) => v + ' °C', onInput: (v) => { S.TR = v; applyFixed(); } });
    ui.slider('Heat transfer coefficient h', { min: 1, max: 5000, value: S.h, log: true, fmt: (v) => v.toPrecision(3) + ' W/m²K', onInput: (v) => (S.h = v) });
    ui.slider('Ambient temperature T∞', { min: -50, max: 200, step: 1, value: S.Tinf, fmt: (v) => v + ' °C', onInput: (v) => (S.Tinf = v) });
    ui.section('Start and time');
    ui.select('Initial state', [['uniform', 'Uniform at T₀'], ['hot', 'Uniform 100 °C'], ['step', 'Left half T_L, right half T_R'], ['pulse', 'Heat pulse in the centre'], ['linear', 'Linear T_L → T_R']], S.init, (v) => { S.init = v; reset(); });
    ui.slider('Initial temperature T₀', { min: -50, max: 500, step: 1, value: S.T0, fmt: (v) => v + ' °C', onInput: (v) => (S.T0 = v) });
    ui.toggle('Auto time scale (L²/α in 20 s)', S.autoScale, (v) => (S.autoScale = v));
    ui.slider('Time scale', { min: 0.01, max: 100000, value: S.scale, log: true, fmt: (v) => v.toPrecision(3) + ' s per s', onInput: (v) => (S.scale = v) });
    ui.section('Probes (fraction of length)');
    ui.slider('Probe 1 position', { min: 0, max: 1, step: 0.01, value: S.p1, fmt: (v) => (v * 100).toFixed(0) + ' %', onInput: (v) => (S.p1 = v) });
    ui.slider('Probe 2 position', { min: 0, max: 1, step: 0.01, value: S.p2, fmt: (v) => (v * 100).toFixed(0) + ' %', onInput: (v) => (S.p2 = v) });
    ui.slider('Probe 3 position', { min: 0, max: 1, step: 0.01, value: S.p3, fmt: (v) => (v * 100).toFixed(0) + ' %', onInput: (v) => (S.p3 = v) });
    ui.buttons([{ label: 'Restart', primary: true, onClick: reset }]);
    reset();

    const geo = () => { const W = env.W; return { x0: 50, x1: W - 30, y: 40, h: Math.min(60, env.H * 0.1) }; };
    function color(v, lo, hi) {
      const u = U.clamp((v - lo) / (hi - lo || 1), 0, 1);
      // perceptual-ish: black-red-yellow-white
      const r = Math.min(1, u * 2.2), g = U.clamp(u * 2.2 - 0.8, 0, 1), bb = U.clamp(u * 3 - 2, 0, 1);
      return `rgb(${(40 + 215 * r) | 0},${(40 + 215 * g) | 0},${(60 + 195 * bb) | 0})`;
    }

    return {
      reset,
      step(dt) {
        const tp = dt * timeScale(), p = prop(), dtmax = (dx() * dx()) / (2 * p.alpha);
        const n = Math.min(200, Math.max(1, Math.ceil(tp / (dtmax * 4)))), h = tp / n;
        for (let i = 0; i < n; i++) stepCN(h);
        t += tp;
        phT += dt;
        if (phT > 0.05) { phT = 0; ph.push([t, probe(S.p1), probe(S.p2), probe(S.p3)]); if (ph.length > PH) ph.shift(); }
      },
      pointerdown(p, e) { const G = geo(); if (p.y > G.y - 20 && p.y < G.y + G.h + 30) heatSpot = { i: Math.round(U.clamp((p.x - G.x0) / (G.x1 - G.x0), 0, 1) * (N - 1)), sign: (e && e.button === 2) ? -1 : 1 }; },
      pointermove(p) { if (heatSpot) { const G = geo(); heatSpot.i = Math.round(U.clamp((p.x - G.x0) / (G.x1 - G.x0), 0, 1) * (N - 1)); } },
      pointerup() { heatSpot = null; },
      draw(ctx) {
        const W = env.W, H = env.H, G = geo();
        ctx.fillStyle = '#111214'; ctx.fillRect(0, 0, W, H);
        let lo = Infinity, hi = -Infinity;
        for (let i = 0; i < N; i++) { lo = Math.min(lo, T[i], Tinit[i]); hi = Math.max(hi, T[i], Tinit[i]); }
        for (const v of [S.TL, S.TR, S.Tinf]) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
        if (hi - lo < 1) { hi += 0.5; lo -= 0.5; }
        const cw = (G.x1 - G.x0) / N;
        for (let i = 0; i < N; i++) { ctx.fillStyle = color(T[i], lo, hi); ctx.fillRect(G.x0 + i * cw, G.y, cw + 0.6, G.h); }
        ctx.strokeStyle = '#888'; ctx.strokeRect(G.x0, G.y, G.x1 - G.x0, G.h);
        const endLabel = (side, x) => { const bc = side === 'L' ? S.left : S.right; const txt = bc === 'fixed' ? (side === 'L' ? S.TL : S.TR) + ' °C' : bc === 'ins' ? 'insulated' : 'h → ' + S.Tinf + ' °C'; U.label(ctx, x, G.y - 12, txt, '#d4d7dc', side === 'L' ? 'left' : 'right'); };
        endLabel('L', G.x0); endLabel('R', G.x1);
        U.label(ctx, (G.x0 + G.x1) / 2, G.y - 12, `${MAT[S.mat][0]}, L = ${S.L.toPrecision(3)} m, α = ${prop().alpha.toExponential(3)} m²/s · t = ${fmtTime(t)}`, '#aaa', 'center');
        [S.p1, S.p2, S.p3].forEach((f, k) => { const x = G.x0 + f * (G.x1 - G.x0); ctx.strokeStyle = ['#4dabf7', '#69db7c', '#ffd43b'][k]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, G.y + G.h); ctx.lineTo(x, G.y + G.h + 10); ctx.stroke(); U.label(ctx, x, G.y + G.h + 18, 'P' + (k + 1), ctx.strokeStyle, 'center', 10); });
        const top = G.y + G.h + 30, wide = W > 760, pw = wide ? (W - 12) / 2 : W - 8, phh = wide ? H - top - 6 : (H - top - 10) / 2;
        // profile
        const xs = [], ys = [], y0s = [], yss = [];
        for (let i = 0; i < N; i++) { const x = (i / (N - 1)) * S.L; xs.push(x); ys.push(T[i]); y0s.push(Tinit[i]); yss.push(steadyState(i / (N - 1))); }
        const F = U.plot(ctx, 4, top, pw, phh, { x0: 0, x1: S.L, y0: lo - (hi - lo) * 0.05, y1: hi + (hi - lo) * 0.05, xl: 'position x (m)', yl: 'temperature (°C)', title: 'T(x): now (solid), start (grey), steady state (dashed)' });
        F.clip();
        U.curve(ctx, F, xs, y0s, '#6c757d', 1.2);
        if (yss.every(isFinite)) U.curve(ctx, F, xs, yss, '#e9ecef', 1.2, [6, 4]);
        U.curve(ctx, F, xs, ys, '#ff6b6b', 2.2);
        ctx.restore();
        // probe history
        const qx = wide ? pw + 8 : 4, qy = wide ? top : top + phh + 6;
        const tt = ph.map((r) => r[0]);
        const tmax = Math.max(1e-9, tt.length ? tt[tt.length - 1] : 1), tmin = tt.length ? tt[0] : 0;
        const F2 = U.plot(ctx, qx, qy, pw, phh, { x0: tmin, x1: Math.max(tmax, tmin + 1e-6), y0: lo - (hi - lo) * 0.05, y1: hi + (hi - lo) * 0.05, xl: 'physical time (s)', yl: 'temperature (°C)', title: 'Probe temperatures over time' });
        F2.clip();
        ['#4dabf7', '#69db7c', '#ffd43b'].forEach((col, k) => U.curve(ctx, F2, tt, ph.map((r) => r[k + 1]), col, 1.8));
        ctx.restore();
      },
      readouts() {
        const p = prop();
        let mean = 0, dev = 0, ok = true;
        for (let i = 0; i < N; i++) { mean += T[i] * (i === 0 || i === N - 1 ? 0.5 : 1); const ss = steadyState(i / (N - 1)); if (!isFinite(ss)) ok = false; else dev = Math.max(dev, Math.abs(T[i] - ss)); }
        mean /= N - 1;
        const qL = (-p.k * (T[1] - T[0])) / dx(), qR = (-p.k * (T[N - 1] - T[N - 2])) / dx();
        return [
          ['Physical time', t.toPrecision(6) + ' s'],
          ['T probe 1', probe(S.p1).toFixed(4) + ' °C'], ['T probe 2', probe(S.p2).toFixed(4) + ' °C'], ['T probe 3', probe(S.p3).toFixed(4) + ' °C'],
          ['Mean temperature', mean.toFixed(4) + ' °C'], ['Deviation from steady state', ok ? dev.toPrecision(5) + ' °C' : '—'],
          ['Heat flux in at left', qL.toPrecision(5) + ' W/m²'], ['Heat flux out at right', qR.toPrecision(5) + ' W/m²'],
          ['Stored heat change', ((heatContent() - Q0) / 1000).toPrecision(5) + ' kJ/m²'],
          ['Thermal diffusivity α', p.alpha.toExponential(4) + ' m²/s'], ['Conductivity k', p.k + ' W/m·K'],
          ['Diffusion time L²/α', ((S.L * S.L) / p.alpha).toPrecision(5) + ' s'], ['Fourier number Fo', ((p.alpha * t) / (S.L * S.L)).toFixed(4)],
          ['Slowest decay rate (fixed–fixed)', ((p.alpha * Math.PI * Math.PI) / (S.L * S.L)).toPrecision(5) + ' /s'],
          ['Biot number hL/k', ((S.h * S.L) / p.k).toPrecision(4)],
        ];
      },
    };
  },
});

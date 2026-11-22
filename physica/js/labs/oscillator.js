'use strict';
/* Damped, driven harmonic oscillator: transient + steady state, resonance curve, Q factor, phase */
PhysLab.define({
  id: 'oscillator',
  title: 'Driven Damped Oscillator',
  subtitle: 'Mass–spring–damper with sinusoidal drive: free decay, resonance curve, Q factor, phase lag and power.',
  color: '#1f5fbf',
  cat: 'Mechanics',
  tags: ['Oscillations', 'Resonance', 'Q factor', 'RK4'],
  hint: 'Drag the mass to displace it · change the drive frequency to find resonance · Experiment tab: sweep the drive frequency',
  howto: [
    '<b>Drag the mass</b> to set a new position; it is released when you let go.',
    'With the drive off you see the <b>free, damped oscillation</b>; fit a damped sinusoid to x(t) in the Data tab to measure f and γ.',
    'Switch the drive on and move its frequency: the steady-state amplitude peaks near f₀ (dashed curve = theory).',
    '<b>Standard experiments</b> in the Experiment tab record a full resonance curve automatically.',
  ],
  theory: `
  <h3>Equation of motion</h3>
  <div class="eq">m x'' + b x' + k x = F₀ cos(2π f t)</div>
  <p>Integrated with 4th-order Runge–Kutta, step ≤ 0.5 ms.</p>
  <h3>Characteristic quantities</h3>
  <div class="eq">ω₀ = √(k/m),  f₀ = ω₀/2π,  γ = b/2m,  ζ = b / (2√(km)),  Q = √(km) / b</div>
  <div class="eq">Free decay: x(t) = A e^(−γt) cos(ω_d t + φ),  ω_d = √(ω₀² − γ²)</div>
  <h3>Steady state</h3>
  <div class="eq">A(ω) = (F₀/m) / √((ω₀² − ω²)² + (2γω)²)</div>
  <div class="eq">tan δ = 2γω / (ω₀² − ω²)   (phase lag of x behind the force)</div>
  <div class="eq">⟨P⟩ = ½ F₀ ω A sin δ   (mean power absorbed = power dissipated)</div>
  <p>The amplitude peak lies at ω_r = √(ω₀² − 2γ²); for light damping the full width at half power is Δω ≈ 2γ = ω₀/Q. The measured amplitude is (max − min)/2 of x over the last two drive periods, so wait for transients (time constant 1/γ) to decay before reading it.</p>`,
  experiment: { duration: 30, interval: 0.02, param: 'Drive frequency f', from: 0.4, to: 1.8, points: 29, settle: 14, measure: 4, stat: 'mean' },
  protocols: [
    { t: 'Resonance curve', h: 'Drive on; sweep f from 0.4 to 1.8 Hz, wait for the steady state at each point and record the amplitude. Fit a Gaussian near the peak or compare with the theory column.', setup: { set: { 'Drive on': true }, mode: 'sweep', param: 'Drive frequency f', from: 0.4, to: 1.8, points: 29, settle: 14, measure: 4, stat: 'mean', y: 'Measured amplitude' } },
    { t: 'Free decay: measure f_d, γ and Q', h: 'Drive off, start from x₀ = 0.2 m and record 25 s. Fit a damped sinusoid to x(t): it returns f, γ and Q directly.', setup: { set: { 'Drive on': false }, mode: 'time', duration: 25, interval: 0.02, reset: true, x: 'Time', y: 'Position x', fit: 'dsine' } },
    { t: 'Period vs mass', h: 'Drive off, sweep the mass and record the natural frequency. A power-law fit should give exponent −½.', setup: { set: { 'Drive on': false }, mode: 'sweep', param: 'Mass m', from: 0.2, to: 5, points: 10, settle: 0, measure: 0.2, stat: 'mean', y: 'Natural frequency f₀', fit: 'power' } },
    { t: 'Phase lag across resonance', h: 'Same sweep as the resonance curve, plot “Phase lag (theory)” and “Measured phase lag” against frequency: δ passes 90° at f₀.', setup: { set: { 'Drive on': true }, mode: 'sweep', param: 'Drive frequency f', from: 0.4, to: 1.8, points: 15, settle: 14, measure: 4, stat: 'mean', y: 'Measured phase lag' } },
  ],

  create(env) {
    const { ui } = env;
    const TAU = U.TAU;
    const S = { m: 1, k: 40, b: 0.8, F0: 2, f: 0.9, drive: true, x0: 0.2, v0: 0 };
    let x = 0, v = 0, t = 0, drag = false;
    const HN = 1200, hx = new Float64Array(HN), ht = new Float64Array(HN), hF = new Float64Array(HN);
    let hi = 0, hn = 0, sampleT = 0;
    let phaseMeas = NaN, lastUpCrossF = NaN, lastUpCrossX = NaN, prevF = 0, prevX = 0;
    let workIn = 0, workOut = 0, avgP = 0;

    const w0 = () => Math.sqrt(S.k / S.m), gam = () => S.b / (2 * S.m);
    const force = (tt) => (S.drive ? S.F0 * Math.cos(TAU * S.f * tt) : 0);
    const acc = (xx, vv, tt) => (force(tt) - S.b * vv - S.k * xx) / S.m;
    function reset() { x = S.x0; v = S.v0; t = 0; hn = 0; hi = 0; sampleT = 0; phaseMeas = NaN; lastUpCrossF = NaN; lastUpCrossX = NaN; workIn = workOut = 0; avgP = 0; }
    function theoryA(f) { const w = TAU * f, W0 = w0(), g = gam(); return S.F0 / S.m / Math.sqrt((W0 * W0 - w * w) ** 2 + (2 * g * w) ** 2); }
    function theoryPhase(f) { const w = TAU * f, W0 = w0(), g = gam(); return Math.atan2(2 * g * w, W0 * W0 - w * w); }
    function measAmp() {
      if (hn < 10) return NaN;
      const span = 2 / (S.drive ? S.f : w0() / TAU);
      let lo = Infinity, hiV = -Infinity, cover = 0;
      for (let k = 0; k < hn; k++) {
        const j = (hi - 1 - k + HN) % HN;
        if (t - ht[j] > span) break;
        cover = t - ht[j];
        if (hx[j] < lo) lo = hx[j]; if (hx[j] > hiV) hiV = hx[j];
      }
      return cover > span * 0.9 ? (hiV - lo) / 2 : NaN;
    }

    ui.section('System');
    ui.slider('Mass m', { min: 0.1, max: 10, value: S.m, log: true, fmt: (v) => v.toFixed(2) + ' kg', onInput: (v) => (S.m = v) });
    ui.slider('Spring constant k', { min: 1, max: 400, value: S.k, log: true, fmt: (v) => v.toFixed(1) + ' N/m', onInput: (v) => (S.k = v) });
    ui.slider('Damping coefficient b', { min: 0, max: 20, step: 0.01, value: S.b, fmt: (v) => v.toFixed(2) + ' kg/s', onInput: (v) => (S.b = v) });
    ui.section('Drive');
    ui.toggle('Drive on', S.drive, (v) => (S.drive = v));
    ui.slider('Drive amplitude F₀', { min: 0, max: 20, step: 0.1, value: S.F0, fmt: (v) => v.toFixed(1) + ' N', onInput: (v) => (S.F0 = v) });
    const fS = ui.slider('Drive frequency f', { min: 0.05, max: 5, step: 0.005, value: S.f, fmt: (v) => v.toFixed(3) + ' Hz', onInput: (v) => (S.f = v) });
    ui.section('Initial conditions (used on restart)');
    ui.slider('Initial position x₀', { min: -0.5, max: 0.5, step: 0.005, value: S.x0, fmt: (v) => v.toFixed(3) + ' m', onInput: (v) => (S.x0 = v) });
    ui.slider('Initial velocity v₀', { min: -3, max: 3, step: 0.01, value: S.v0, fmt: (v) => v.toFixed(2) + ' m/s', onInput: (v) => (S.v0 = v) });
    ui.buttons([{ label: 'Restart', primary: true, onClick: reset }, { label: 'Tune drive to f₀', onClick: () => fS.set(w0() / TAU, true) }]);
    reset();

    const geo = () => {
      const W = env.W, H = env.H, top = 16, mh = Math.min(170, H * 0.3);
      return { W, H, top, mh, cx: W * 0.5, sc: Math.min(W * 0.32, 520) / 0.5 };
    };

    return {
      reset,
      step(dt) {
        if (drag) { t += dt; return; }
        const n = Math.max(1, Math.ceil(dt / 0.0005)), h = dt / n;
        for (let i = 0; i < n; i++) {
          const k1x = v, k1v = acc(x, v, t);
          const k2x = v + k1v * h / 2, k2v = acc(x + k1x * h / 2, v + k1v * h / 2, t + h / 2);
          const k3x = v + k2v * h / 2, k3v = acc(x + k2x * h / 2, v + k2v * h / 2, t + h / 2);
          const k4x = v + k3v * h, k4v = acc(x + k3x * h, v + k3v * h, t + h);
          const F = force(t);
          x += (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
          v += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
          t += h;
          workIn += F * v * h; workOut += S.b * v * v * h;
          avgP += (F * v - avgP) * Math.min(1, h * (S.drive ? S.f : 1) / 2);
          // phase: time between upward zero crossings of the force and of x
          const Fn = force(t);
          if (S.drive && prevF < 0 && Fn >= 0) lastUpCrossF = t;
          if (prevX < 0 && x >= 0) { lastUpCrossX = t; if (S.drive && isFinite(lastUpCrossF)) { let d = (lastUpCrossX - lastUpCrossF) * S.f * 360; d = ((d % 360) + 360) % 360; phaseMeas = d; } }
          prevF = Fn; prevX = x;
        }
        if (t - sampleT >= 0.01) { sampleT = t; hx[hi] = x; ht[hi] = t; hF[hi] = force(t); hi = (hi + 1) % HN; if (hn < HN) hn++; }
      },
      pointerdown(p) { const G = geo(); const mx = G.cx + x * G.sc; if (Math.abs(p.x - mx) < 50 && p.y < G.top + G.mh + 20) { drag = true; } },
      pointermove(p) { if (!drag) return; const G = geo(); x = U.clamp((p.x - G.cx) / G.sc, -0.6, 0.6); v = 0; },
      pointerup() { drag = false; },
      draw(ctx) {
        const G = geo(), { W, H } = G;
        ctx.fillStyle = '#111214'; ctx.fillRect(0, 0, W, H);
        // --- apparatus
        const y0 = G.top + G.mh / 2, wallX = G.cx - 0.62 * G.sc - 30;
        ctx.fillStyle = '#3a3d43'; ctx.fillRect(wallX - 14, G.top, 14, G.mh);
        ctx.strokeStyle = '#555'; ctx.beginPath(); ctx.moveTo(wallX - 14, G.top + G.mh); ctx.lineTo(W - 10, G.top + G.mh); ctx.stroke();
        const mx = G.cx + x * G.sc, bw = 56;
        ctx.strokeStyle = '#c8ccd2'; ctx.lineWidth = 2; ctx.beginPath();
        const s0 = wallX, s1 = mx - bw / 2, coils = 14;
        ctx.moveTo(s0, y0);
        for (let i = 1; i < coils * 2; i++) ctx.lineTo(s0 + ((s1 - s0) * i) / (coils * 2), y0 + (i % 2 ? -14 : 14));
        ctx.lineTo(s1, y0); ctx.stroke();
        ctx.fillStyle = drag ? '#5c8fe0' : '#3f73c4'; ctx.fillRect(mx - bw / 2, y0 - 28, bw, 56);
        ctx.fillStyle = '#fff'; ctx.font = '600 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(S.m.toFixed(2) + ' kg', mx, y0);
        // ruler
        ctx.strokeStyle = '#777'; ctx.lineWidth = 1; ctx.fillStyle = '#aaa'; ctx.font = '10px system-ui';
        for (let k = -5; k <= 5; k++) { const px = G.cx + k * 0.1 * G.sc; ctx.beginPath(); ctx.moveTo(px, G.top + G.mh - 8); ctx.lineTo(px, G.top + G.mh); ctx.stroke(); if (k % 1 === 0) ctx.fillText((k / 10).toFixed(1), px, G.top + G.mh - 14); }
        if (S.drive) {
          const F = force(t), fl = (F / Math.max(1e-9, S.F0)) * 40;
          ctx.strokeStyle = '#e8590c'; ctx.lineWidth = 2; ctx.beginPath(); U.arrow(ctx, mx + bw / 2 + 4, y0 - 36, mx + bw / 2 + 4 + fl, y0 - 36, 7); ctx.stroke();
          U.label(ctx, mx + bw / 2 + 8, y0 - 48, 'F(t)', '#e8590c', 'left', 10);
        }
        // --- x(t) trace
        const py = G.top + G.mh + 14, ph = Math.max(120, (H - py - 10) * (W > 700 ? 1 : 0.5));
        const pw = W > 700 ? W * 0.58 : W - 10;
        const span = 10, t1 = t, t0 = Math.max(0, t - span);
        let amp = 0.05; for (let k = 0; k < hn; k++) amp = Math.max(amp, Math.abs(hx[k]));
        const F1 = U.plot(ctx, 4, py, pw, ph, { x0: t1 - span, x1: t1, y0: -amp * 1.15, y1: amp * 1.15, xl: 'time t (s)', yl: 'x (m)', title: 'Position x(t)' + (S.drive ? ' and drive force (scaled, orange)' : '') });
        F1.clip();
        const xs = [], ys = [], fs = [];
        for (let k = 0; k < hn; k++) { const j = (hi - hn + k + HN) % HN; if (ht[j] < t0) continue; xs.push(ht[j]); ys.push(hx[j]); fs.push((hF[j] / Math.max(1e-9, S.F0)) * amp * 0.5); }
        if (S.drive) U.curve(ctx, F1, xs, fs, 'rgba(232,89,12,0.7)', 1.2);
        U.curve(ctx, F1, xs, ys, '#74a7f5', 1.8);
        ctx.restore();
        // --- resonance curve
        const rx = W > 700 ? pw + 12 : 4, ry = W > 700 ? py : py + ph + 8, rw = W > 700 ? W - pw - 16 : W - 10, rh = W > 700 ? ph : Math.max(100, H - ry - 6);
        if (rh > 60) {
          const fmax = Math.max(2.2 * w0() / TAU, S.f * 1.3), N = 240, fx = [], ay = [];
          let amax = 0;
          for (let i = 1; i <= N; i++) { const f = (fmax * i) / N; fx.push(f); const a = theoryA(f); ay.push(a); if (a > amax) amax = a; }
          const am = measAmp();
          amax = Math.max(amax, isFinite(am) ? am : 0) * 1.1 || 1;
          const F2 = U.plot(ctx, rx, ry, rw, rh, { x0: 0, x1: fmax, y0: 0, y1: amax, xl: 'drive frequency f (Hz)', yl: 'amplitude (m)', title: 'Resonance curve (theory) and current point' });
          F2.clip();
          U.curve(ctx, F2, fx, ay, '#c8ccd2', 1.4, [5, 3]);
          ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(F2.sx(w0() / TAU), F2.T); ctx.lineTo(F2.sx(w0() / TAU), F2.B); ctx.stroke();
          if (S.drive && isFinite(am)) { ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.arc(F2.sx(S.f), F2.sy(am), 5, 0, TAU); ctx.fill(); }
          ctx.restore();
          U.label(ctx, F2.sx(w0() / TAU) + 4, F2.T + 10, 'f₀', '#aaa');
        }
      },
      readouts() {
        const W0 = w0(), g = gam(), am = measAmp(), E = 0.5 * S.m * v * v + 0.5 * S.k * x * x;
        const zeta = S.b / (2 * Math.sqrt(S.k * S.m)), Q = S.b > 0 ? Math.sqrt(S.k * S.m) / S.b : Infinity, wd = W0 * W0 - g * g;
        return [
          ['Time', t.toFixed(3) + ' s'], ['Position x', x.toFixed(5) + ' m'], ['Velocity v', v.toFixed(5) + ' m/s'], ['Acceleration a', acc(x, v, t).toFixed(4) + ' m/s²'],
          ['Energy E', E.toFixed(5) + ' J'], ['Drive force F', force(t).toFixed(4) + ' N'],
          ['Natural frequency f₀', (W0 / TAU).toFixed(5) + ' Hz'], ['Damped frequency f_d', wd > 0 ? (Math.sqrt(wd) / TAU).toFixed(5) + ' Hz' : 'overdamped'],
          ['Damping ratio ζ', zeta.toFixed(5)], ['Quality factor Q', isFinite(Q) ? Q.toFixed(3) : '∞'], ['Decay time 1/γ', g > 0 ? (1 / g).toFixed(4) + ' s' : '∞'],
          ['Measured amplitude', isFinite(am) ? am.toFixed(5) + ' m' : '—'], ['Theory amplitude', S.drive ? theoryA(S.f).toFixed(5) + ' m' : '—'],
          ['Measured phase lag', S.drive && isFinite(phaseMeas) ? phaseMeas.toFixed(2) + ' °' : '—'], ['Phase lag (theory)', S.drive ? ((theoryPhase(S.f) / U.DEG)).toFixed(2) + ' °' : '—'],
          ['Mean input power', S.drive ? avgP.toFixed(5) + ' W' : '—'], ['Work by drive', workIn.toFixed(4) + ' J'], ['Energy dissipated', workOut.toFixed(4) + ' J'],
        ];
      },
    };
  },
});

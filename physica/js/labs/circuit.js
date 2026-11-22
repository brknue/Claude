'use strict';
/* RC / RL / RLC series circuits: step response, square-wave and AC drive, oscilloscope, impedance & resonance */
PhysLab.define({
  id: 'circuit',
  title: 'RC, RL & RLC Circuits',
  subtitle: 'Series circuits with DC step, square-wave or sine source: transients, time constants, impedance, phase and resonance.',
  color: '#1f5fbf',
  cat: 'Electricity & Magnetism',
  tags: ['Circuits', 'Transients', 'AC', 'Impedance', 'Resonance'],
  hint: 'Choose the circuit and source in the panel · the oscilloscope shows source, capacitor/inductor voltage and current',
  howto: [
    'Pick <b>RC</b>, <b>RL</b> or <b>RLC</b> and a source. “Close switch” restarts the circuit with uncharged components at t = 0.',
    '<b>Auto time scale</b> (on by default) slows circuit time so one scope span (6 τ for a step, ≥ 3 source periods for AC) takes about 3 s; switch it off to set the time scale yourself. All readouts and recordings use real circuit time in seconds — record “Circuit time t” as your x axis.',
    'For AC the amplitude readouts are taken over the last full source period; wait a few time constants for the steady state.',
  ],
  theory: `
  <h3>Circuit equations (series loop, Kirchhoff’s voltage law)</h3>
  <div class="eq">RC:  R dq/dt + q/C = V(t),   V_C = q/C</div>
  <div class="eq">RL:  L dI/dt + R I = V(t)</div>
  <div class="eq">RLC: L d²q/dt² + R dq/dt + q/C = V(t),   I = dq/dt</div>
  <p>Integrated with 4th-order Runge–Kutta with a step much smaller than the shortest time constant or source period.</p>
  <h3>Step response</h3>
  <div class="eq">RC: V_C = V₀(1 − e^(−t/τ)),  I = (V₀/R) e^(−t/τ),  τ = RC</div>
  <div class="eq">RL: I = (V₀/R)(1 − e^(−t/τ)),  τ = L/R</div>
  <div class="eq">RLC: ω₀ = 1/√(LC),  α = R/2L,  underdamped if α &lt; ω₀ (R &lt; 2√(L/C))</div>
  <h3>Sinusoidal steady state</h3>
  <div class="eq">Z = R + j(ωL − 1/ωC),  |Z| = √(R² + (ωL − 1/ωC)²),  φ = atan((ωL − 1/ωC)/R)</div>
  <div class="eq">I₀ = V₀/|Z|,  f₀ = 1/(2π√(LC)),  Q = (1/R)√(L/C),  bandwidth Δf = f₀/Q</div>
  <p>Energy stored: ½CV_C² + ½LI². Power dissipated: I²R.</p>`,
  experiment: { duration: 10, interval: 0.02, param: 'Source frequency f', from: 20, to: 2000, points: 25, logSpace: true, settle: 5, measure: 1.2, stat: 'final' },
  protocols: [
    { t: 'RC charging: measure τ', h: 'RC with DC step, record 8 s at the default time scale. Fit an exponential to V_R against circuit time: τ = 1/|k| should equal RC.', setup: { set: { Circuit: 'RC', Source: 'step' }, press: 'Close switch', mode: 'time', duration: 8, interval: 0.02, reset: true, x: 'Circuit time t', y: 'V_R', fit: 'exp' } },
    { t: 'RLC resonance curve', h: 'RLC with a sine source: sweep the frequency logarithmically and record the current amplitude. The peak is at f₀ = 1/(2π√(LC)); its width gives Q.', setup: { set: { Circuit: 'RLC', Source: 'sine', 'Resistance R': 10 }, mode: 'sweep', param: 'Source frequency f', from: 20, to: 2000, points: 25, logSpace: true, settle: 5, measure: 1.2, stat: 'final', y: 'Current amplitude I₀', fit: 'none' } },
    { t: 'Damped ringing of an RLC circuit', h: 'RLC, DC step, small R: record and fit a damped sinusoid to V_C − V₀ vs circuit time; compare f and γ = R/2L with theory.', setup: { set: { Circuit: 'RLC', Source: 'step', 'Resistance R': 20 }, press: 'Close switch', mode: 'time', duration: 8, interval: 0.01, reset: true, x: 'Circuit time t', y: 'V_C', fit: 'dsine' } },
    { t: 'RC low-pass filter', h: 'RC with sine source: sweep f and record the capacitor voltage amplitude; the −3 dB point (0.707 V₀) is at f_c = 1/(2πRC).', setup: { set: { Circuit: 'RC', Source: 'sine' }, mode: 'sweep', param: 'Source frequency f', from: 0.5, to: 200, points: 20, logSpace: true, settle: 5, measure: 1.2, stat: 'final', y: 'V_C amplitude' } },
  ],

  create(env) {
    const { ui } = env;
    const TAU = U.TAU;
    const S = { kind: 'RC', src: 'step', R: 100, C: 100, L: 100, V0: 5, f: 50, scale: 0.01, auto: true };
    // C in µF, L in mH; scale = circuit seconds per real second
    let q = 0, I = 0, tc = 0, phase = 0;
    const N = 3000, buf = { t: new Float64Array(N), vs: new Float64Array(N), vc: new Float64Array(N), vl: new Float64Array(N), i: new Float64Array(N) };
    let bi = 0, bn = 0, lastSample = -1, dotPhase = 0;
    const Cf = () => S.C * 1e-6, Lh = () => S.L * 1e-3;
    function Vsrc(t) {
      if (S.src === 'step') return S.V0;
      if (S.src === 'square') return (Math.sin(TAU * S.f * t) >= 0 ? 1 : -1) * S.V0;
      return S.V0 * Math.sin(TAU * S.f * t);
    }
    function deriv(t, qq, ii, o) {
      const V = Vsrc(t);
      if (S.kind === 'RC') { o[0] = (V - qq / Cf()) / S.R; o[1] = 0; }
      else if (S.kind === 'RL') { o[0] = 0; o[1] = (V - S.R * ii) / Lh(); }
      else { o[0] = ii; o[1] = (V - S.R * ii - qq / Cf()) / Lh(); }
    }
    function current() { return S.kind === 'RC' ? (Vsrc(tc) - q / Cf()) / S.R : I; }
    function vC() { return S.kind === 'RL' ? 0 : q / Cf(); }
    function vL() { return S.kind === 'RC' ? 0 : Vsrc(tc) - S.R * current() - vC(); }
    function tauC() { return S.kind === 'RC' ? S.R * Cf() : S.kind === 'RL' ? Lh() / S.R : (2 * Lh()) / S.R; }
    function hStep() {
      let h = tauC() / 60;
      if (S.kind === 'RLC') h = Math.min(h, TAU * Math.sqrt(Lh() * Cf()) / 80);
      if (S.src !== 'step') h = Math.min(h, 1 / S.f / 120);
      return h;
    }
    function reset() { q = 0; I = 0; tc = 0; bn = 0; bi = 0; lastSample = -1; }
    const k1 = [0, 0], k2 = [0, 0], k3 = [0, 0], k4 = [0, 0];
    function advance(T) {
      const hmax = hStep(), n = Math.min(40000, Math.max(1, Math.ceil(T / hmax))), h = T / n;
      for (let s = 0; s < n; s++) {
        deriv(tc, q, I, k1);
        deriv(tc + h / 2, q + k1[0] * h / 2, I + k1[1] * h / 2, k2);
        deriv(tc + h / 2, q + k2[0] * h / 2, I + k2[1] * h / 2, k3);
        deriv(tc + h, q + k3[0] * h, I + k3[1] * h, k4);
        q += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
        I += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
        tc += h;
        const span = scopeSpan();
        if (tc - lastSample >= span / 1500) {
          lastSample = tc;
          buf.t[bi] = tc; buf.vs[bi] = Vsrc(tc); buf.vc[bi] = vC(); buf.vl[bi] = vL(); buf.i[bi] = current();
          bi = (bi + 1) % N; if (bn < N) bn++;
        }
      }
    }
    function scopeSpan() {
      if (S.src === 'step') return Math.max(6 * tauC(), 1e-6);
      return Math.max(3 / S.f, 2 * tauC());
    }
    /** amplitude over the last full source period (or NaN) */
    function lastPeriodAmp(arr) {
      if (S.src === 'step' || bn < 10) return NaN;
      const P = 1 / S.f;
      let lo = Infinity, hi = -Infinity, cover = 0;
      for (let k = 0; k < bn; k++) {
        const j = (bi - 1 - k + N) % N;
        if (tc - buf.t[j] > P) break;
        cover = tc - buf.t[j];
        const v = arr[j]; if (v < lo) lo = v; if (v > hi) hi = v;
      }
      return cover > P * 0.9 ? (hi - lo) / 2 : NaN;
    }

    ui.section('Circuit');
    ui.select('Circuit', [['RC', 'RC (resistor + capacitor)'], ['RL', 'RL (resistor + inductor)'], ['RLC', 'RLC series']], S.kind, (v) => { S.kind = v; reset(); });
    ui.select('Source', [['step', 'DC step (switch closes at t = 0)'], ['square', 'Square wave ±V₀'], ['sine', 'Sine V₀·sin(2πft)']], S.src, (v) => { S.src = v; reset(); });
    ui.slider('Resistance R', { min: 1, max: 100000, value: S.R, log: true, fmt: (v) => (v >= 1000 ? (v / 1000).toPrecision(3) + ' kΩ' : v.toPrecision(3) + ' Ω'), onInput: (v) => (S.R = v) });
    ui.slider('Capacitance C', { min: 0.01, max: 10000, value: S.C, log: true, fmt: (v) => v.toPrecision(3) + ' µF', onInput: (v) => (S.C = v) });
    ui.slider('Inductance L', { min: 0.1, max: 10000, value: S.L, log: true, fmt: (v) => v.toPrecision(3) + ' mH', onInput: (v) => (S.L = v) });
    ui.section('Source');
    ui.slider('Source amplitude V₀', { min: 0, max: 24, step: 0.1, value: S.V0, fmt: (v) => v.toFixed(1) + ' V', onInput: (v) => (S.V0 = v) });
    ui.slider('Source frequency f', { min: 0.1, max: 20000, value: S.f, log: true, fmt: (v) => v.toPrecision(4) + ' Hz', onInput: (v) => (S.f = v) });
    ui.slider('Time scale', { min: 1e-5, max: 1, value: S.scale, log: true, fmt: (v) => v.toPrecision(2) + ' s circuit / s', onInput: (v) => (S.scale = v) });
    ui.toggle('Auto time scale (screen shows ≈ 3 s of the scope span)', S.auto, (v) => (S.auto = v));
    ui.buttons([{ label: 'Close switch', primary: true, onClick: reset }]);
    reset();

    function drawSchematic(ctx, x, y, w, h) {
      ctx.save();
      ctx.strokeStyle = '#c8ccd2'; ctx.lineWidth = 2; ctx.fillStyle = '#c8ccd2'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const L = x + 64, R = x + w - 40, T = y + 34, B = y + h - 34;
      // source on the left side
      const sy = (T + B) / 2;
      ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, sy - 22); ctx.moveTo(L, sy + 22); ctx.lineTo(L, B); ctx.stroke();
      ctx.beginPath(); ctx.arc(L, sy, 22, 0, TAU); ctx.stroke();
      if (S.src === 'sine') { ctx.beginPath(); for (let k = 0; k <= 20; k++) { const xx = L - 12 + k * 1.2, yy = sy - 7 * Math.sin((k / 20) * TAU); k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
      else if (S.src === 'square') { ctx.beginPath(); ctx.moveTo(L - 12, sy + 7); ctx.lineTo(L - 12, sy - 7); ctx.lineTo(L, sy - 7); ctx.lineTo(L, sy + 7); ctx.lineTo(L + 12, sy + 7); ctx.lineTo(L + 12, sy - 7); ctx.stroke(); }
      else { ctx.fillText('+', L, sy - 9); ctx.fillText('−', L, sy + 9); }
      ctx.fillText('V(t)', L - 34, sy);
      // top wire with R, bottom wire with C and/or L
      const parts = S.kind === 'RC' ? ['R', 'C'] : S.kind === 'RL' ? ['R', 'L'] : ['R', 'L', 'C'];
      const segs = [[L, T, R, T], [R, T, R, B], [R, B, L, B]];
      const place = parts.length === 2 ? [[0, 0.5], [1, 0.5]] : [[0, 0.5], [1, 0.5], [2, 0.5]];
      const comp = {};
      place.forEach(([si, f], k) => (comp[si] = parts[k]));
      segs.forEach(([x1, y1, x2, y2], si) => {
        const c = comp[si];
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, horiz = y1 === y2, half = 24;
        const ux = horiz ? Math.sign(x2 - x1) : 0, uy = horiz ? 0 : Math.sign(y2 - y1);
        ctx.beginPath(); ctx.moveTo(x1, y1);
        if (!c) { ctx.lineTo(x2, y2); ctx.stroke(); return; }
        ctx.lineTo(mx - ux * half, my - uy * half); ctx.moveTo(mx + ux * half, my + uy * half); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.beginPath();
        const px = -uy, py = ux; // perpendicular
        if (c === 'R') { ctx.moveTo(mx - ux * half, my - uy * half); for (let k = 1; k < 8; k++) { const t2 = -half + (k * 2 * half) / 8; ctx.lineTo(mx + ux * t2 + px * (k % 2 ? 8 : -8), my + uy * t2 + py * (k % 2 ? 8 : -8)); } ctx.lineTo(mx + ux * half, my + uy * half); }
        if (c === 'C') { ctx.moveTo(mx - ux * half, my - uy * half); ctx.lineTo(mx - ux * 4, my - uy * 4); ctx.moveTo(mx + ux * 4, my + uy * 4); ctx.lineTo(mx + ux * half, my + uy * half); ctx.moveTo(mx - ux * 4 + px * 14, my - uy * 4 + py * 14); ctx.lineTo(mx - ux * 4 - px * 14, my - uy * 4 - py * 14); ctx.moveTo(mx + ux * 4 + px * 14, my + uy * 4 + py * 14); ctx.lineTo(mx + ux * 4 - px * 14, my + uy * 4 - py * 14); }
        if (c === 'L') { ctx.moveTo(mx - ux * half, my - uy * half); for (let k = 0; k < 4; k++) { const c0 = -half + 6 + k * 12; ctx.arc(mx + ux * c0, my + uy * c0, 6, horiz ? Math.PI : -Math.PI / 2, horiz ? 0 : Math.PI / 2, horiz ? ux < 0 : uy > 0); } ctx.lineTo(mx + ux * half, my + uy * half); }
        ctx.stroke();
        const lab = c === 'R' ? 'R = ' + (S.R >= 1000 ? (S.R / 1000).toPrecision(3) + ' kΩ' : S.R.toPrecision(3) + ' Ω') : c === 'C' ? 'C = ' + S.C.toPrecision(3) + ' µF' : 'L = ' + S.L.toPrecision(3) + ' mH';
        if (horiz) ctx.fillText(lab, mx, my + (si === 0 ? -22 : 24));
        else { ctx.textAlign = 'right'; ctx.fillText(lab, mx - 22, my); ctx.textAlign = 'center'; }
      });
      // moving charge dots show current direction and size
      const Ival = current(), per = 2 * (R - L) + 2 * (B - T);
      dotPhase += Ival * 40 / Math.max(1e-9, S.V0 / S.R + 1e-9) * 0.016;
      ctx.fillStyle = '#ffd43b';
      for (let k = 0; k < 24; k++) {
        let d = ((k / 24) * per + dotPhase * 6) % per; if (d < 0) d += per;
        let px, py;
        if (d < R - L) { px = L + d; py = T; } else if (d < R - L + B - T) { px = R; py = T + d - (R - L); } else if (d < 2 * (R - L) + B - T) { px = R - (d - (R - L) - (B - T)); py = B; } else { px = L; py = B - (d - 2 * (R - L) - (B - T)); }
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    return {
      reset,
      step(dt) { advance(dt * (S.auto ? scopeSpan() / 3 : S.scale)); },
      draw(ctx) {
        const W = env.W, H = env.H;
        ctx.fillStyle = '#111214'; ctx.fillRect(0, 0, W, H);
        const wide = W > 760;
        const sw = wide ? Math.min(360, W * 0.34) : W, sh = wide ? Math.min(280, H) : Math.min(220, H * 0.36);
        drawSchematic(ctx, 0, 0, sw, sh);
        const ox = wide ? sw + 6 : 4, oy = wide ? 4 : sh + 4, ow = W - ox - 4, oh = H - oy - 6;
        const span = scopeSpan(), t1 = tc, t0 = t1 - span;
        const xs = [], vs = [], vc = [], vl = [], is = [];
        let vmax = Math.max(S.V0, 0.1) * 1.15, imax = 1e-12;
        for (let k = 0; k < bn; k++) { const j = (bi - bn + k + N) % N; if (buf.t[j] < t0) continue; xs.push(buf.t[j]); vs.push(buf.vs[j]); vc.push(buf.vc[j]); vl.push(buf.vl[j]); is.push(buf.i[j]); vmax = Math.max(vmax, Math.abs(buf.vc[j]) * 1.1, Math.abs(buf.vl[j]) * 1.1); imax = Math.max(imax, Math.abs(buf.i[j])); }
        const tu = span < 2e-3 ? [1e6, 'µs'] : span < 2 ? [1e3, 'ms'] : [1, 's'];
        const xsU = xs.map((v) => (v - t0) * tu[0]);
        const F = U.plot(ctx, ox, oy, ow, oh, { x0: 0, x1: span * tu[0], y0: -vmax, y1: vmax, xl: `circuit time since ${U.fmt(t0 * tu[0], 3)} ${tu[1]}  (${tu[1]})`, yl: 'voltage (V)  ·  current scaled', title: 'Oscilloscope' });
        F.clip();
        U.curve(ctx, F, xsU, vs, '#adb5bd', 1.4, [5, 3]);
        if (S.kind !== 'RL') U.curve(ctx, F, xsU, vc, '#4dabf7', 2);
        if (S.kind !== 'RC') U.curve(ctx, F, xsU, vl, '#69db7c', 2);
        const isc = is.map((v) => (v / imax) * vmax * 0.8);
        U.curve(ctx, F, xsU, isc, '#ffd43b', 1.6);
        ctx.restore();
        let ly = F.T + 12;
        const leg = [['source V(t)', '#adb5bd'], ...(S.kind !== 'RL' ? [['V_C', '#4dabf7']] : []), ...(S.kind !== 'RC' ? [['V_L', '#69db7c']] : []), [`current (full scale ${U.fmt(imax * 1000, 3)} mA)`, '#ffd43b']];
        for (const [t, c] of leg) { ctx.fillStyle = c; ctx.fillRect(F.L + 8, ly - 1, 14, 3); U.label(ctx, F.L + 28, ly, t, '#d4d7dc'); ly += 15; }
      },
      readouts() {
        const w = TAU * S.f, Cv = Cf(), Lv = Lh();
        const X = S.kind === 'RC' ? -1 / (w * Cv) : S.kind === 'RL' ? w * Lv : w * Lv - 1 / (w * Cv);
        const Z = Math.hypot(S.R, X), phi = Math.atan2(X, S.R) / U.DEG;
        const Iv = current(), E = 0.5 * Cv * vC() ** 2 + (S.kind !== 'RC' ? 0.5 * Lv * Iv * Iv : 0);
        const out = [
          ['Circuit time t', tc.toPrecision(6) + ' s'], ['Source V_s', Vsrc(tc).toFixed(4) + ' V'], ['Current I', (Iv * 1000).toPrecision(5) + ' mA'],
          ['V_R', (Iv * S.R).toFixed(4) + ' V'],
        ];
        if (S.kind !== 'RL') out.push(['V_C', vC().toFixed(4) + ' V']);
        if (S.kind !== 'RC') out.push(['V_L', vL().toFixed(4) + ' V']);
        out.push(['Time constant τ', (tauC() * 1000).toPrecision(5) + ' ms']);
        if (S.kind === 'RLC') { const f0 = 1 / (TAU * Math.sqrt(Lv * Cv)); out.push(['Resonance f₀', f0.toPrecision(5) + ' Hz'], ['Quality factor Q', (Math.sqrt(Lv / Cv) / S.R).toPrecision(4)], ['Critical R = 2√(L/C)', (2 * Math.sqrt(Lv / Cv)).toPrecision(4) + ' Ω']); }
        if (S.kind === 'RC') out.push(['Cut-off f_c = 1/2πRC', (1 / (TAU * S.R * Cv)).toPrecision(5) + ' Hz']);
        if (S.kind === 'RL') out.push(['Cut-off f_c = R/2πL', (S.R / (TAU * Lv)).toPrecision(5) + ' Hz']);
        if (S.src !== 'step') {
          out.push(['Impedance |Z|', Z.toPrecision(5) + ' Ω'], ['Phase φ (V ahead of I)', phi.toFixed(2) + ' °'], ['Theory I₀ = V₀/|Z|', ((S.V0 / Z) * 1000).toPrecision(5) + ' mA']);
          const ia = lastPeriodAmp(buf.i), ca = lastPeriodAmp(buf.vc);
          out.push(['Current amplitude I₀', isFinite(ia) ? (ia * 1000).toPrecision(5) + ' mA' : '—']);
          if (S.kind !== 'RL') out.push(['V_C amplitude', isFinite(ca) ? ca.toPrecision(5) + ' V' : '—']);
        }
        out.push(['Power in R', (Iv * Iv * S.R * 1000).toPrecision(4) + ' mW'], ['Stored energy', (E * 1000).toPrecision(4) + ' mJ']);
        return out;
      },
    };
  },
});

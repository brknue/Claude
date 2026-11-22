'use strict';
/* Photoelectric effect: vacuum photocell, retarding voltage, I–V curves, stopping potential, Planck's constant */
PhysLab.define({
  id: 'photoelectric',
  title: 'Photoelectric Effect',
  subtitle: 'Vacuum photocell with real cathode metals: I–V curves with shot noise, stopping potential vs frequency and a measurement of h/e.',
  color: '#1f5fbf',
  cat: 'Quantum & Modern',
  tags: ['Photoelectric', 'Planck constant', 'Work function', 'Millikan', 'Shot noise'],
  hint: 'Set wavelength, intensity and the anode voltage · negative voltage retards electrons · find where the current drops to zero',
  howto: [
    'Light of wavelength λ falls on the cathode (left). Electrons leave with kinetic energies up to E_max = hf − φ and are collected by the anode (right).',
    'A <b>negative anode voltage</b> pushes electrons back; the current vanishes at the stopping potential V_s = E_max/e.',
    'The ammeter shows the current with realistic shot noise (it averages over the chosen integration time) plus a small dark current.',
    'Experiment tab: record an I–V curve by sweeping the voltage, or sweep λ and plot the stopping potential against frequency — the slope is h/e (Millikan, 1916).',
  ],
  theory: `
  <h3>Einstein’s photoelectric equation</h3>
  <div class="eq">E_photon = h f = h c / λ,   E_max = h f − φ,   e V_s = E_max</div>
  <div class="eq">V_s = (h/e) f − φ/e   →  slope h/e = 4.135 667 × 10⁻¹⁵ V·s,  intercept −φ/e</div>
  <div class="eq">Threshold: f₀ = φ/h,  λ₀ = hc/φ = 1239.84 nm·eV / φ</div>
  <h3>Model of the photocell</h3>
  <p>Photon flux Φ = P/(hf) for incident power P; quantum efficiency η (electrons per photon) is constant above threshold. Emitted electrons have normal kinetic energies spread uniformly between 0 and E_max, so for a retarding voltage V &lt; 0 the collected current is</p>
  <div class="eq">I(V) = I_sat · (1 − e|V| / E_max)   for 0 ≤ e|V| ≤ E_max,   I = I_sat for V ≥ 0</div>
  <p>Measured current = shot noise (Poisson counting of electrons during the integration time) + dark current 2 pA. Real cells add contact potentials and reverse anode currents, which shift V_s slightly.</p>
  <h3>Work functions used</h3>
  <table><tr><th>Cs</th><th>K</th><th>Na</th><th>Ca</th><th>Zn</th><th>Ag</th><th>Cu</th><th>Pt</th></tr><tr><td>2.14</td><td>2.30</td><td>2.36</td><td>2.87</td><td>4.33</td><td>4.26</td><td>4.65</td><td>5.65 eV</td></tr></table>`,
  experiment: { mode: 'sweep', param: 'Anode voltage V', from: -3, to: 2, points: 51, settle: 0.2, measure: 1, stat: 'mean' },
  protocols: [
    { t: 'I–V characteristic', h: 'Sweep the anode voltage from −3 V to +2 V and record the mean current: it saturates for V > 0 and reaches zero at −V_s.', setup: { mode: 'sweep', param: 'Anode voltage V', from: -3, to: 2, points: 51, settle: 0.2, measure: 1, stat: 'mean', x: 'Anode voltage V', y: 'Photocurrent I' } },
    { t: 'Measure Planck’s constant (Millikan)', h: 'Sweep λ from 250 to 550 nm (sodium cathode) and record the stopping potential. Plot V_s against photon frequency and fit a line: h = e × slope, φ = −e × intercept.', setup: { set: { 'Cathode metal': 'Na' }, mode: 'sweep', param: 'Wavelength λ', from: 250, to: 520, points: 10, settle: 0.2, measure: 1, stat: 'mean', x: 'Photon frequency f', y: 'Stopping potential V_s (measured)', fit: 'linear' } },
    { t: 'Saturation current vs intensity', h: 'At V = +2 V sweep the light power: the current is proportional to intensity, while V_s does not change.', setup: { set: { 'Anode voltage V': 2 }, mode: 'sweep', param: 'Light power P', from: 0.5, to: 10, points: 10, settle: 0.2, measure: 1, stat: 'mean', x: 'Light power P', y: 'Photocurrent I', fit: 'prop' } },
  ],

  create(env) {
    const { ui } = env;
    const hc = 1239.84198; // eV·nm
    const e = 1.602176634e-19, hPl = 6.62607015e-34;
    const METALS = { Cs: ['Caesium', 2.14], K: ['Potassium', 2.3], Na: ['Sodium', 2.36], Ca: ['Calcium', 2.87], Zn: ['Zinc', 4.33], Ag: ['Silver', 4.26], Cu: ['Copper', 4.65], Pt: ['Platinum', 5.65] };
    const DARK = 2e-12; // A
    const S = { metal: 'Na', lam: 405, P: 2, V: 0, eta: 1e-4, tint: 0.2 };
    let Imeas = 0, Ibuf = [], acc = 0, accN = 0, tacc = 0;
    const els = [];
    const phi = () => METALS[S.metal][1];
    const Eph = () => hc / S.lam;
    const Emax = () => Math.max(0, Eph() - phi());
    function Isat() { if (Eph() <= phi()) return 0; const flux = (S.P * 1e-6) / (Eph() * e); return flux * S.eta * e; } // A
    function Imodel(V) {
      const Em = Emax(); if (Em <= 0) return 0;
      if (V >= 0) return Isat();
      const f = 1 - (-V) / Em; return f > 0 ? Isat() * f : 0;
    }
    // measured stopping potential: scan the noiseless model for I < 1% of I_sat, then add the instrument's resolution
    let vsMeas = NaN;
    function measureVs() {
      if (Emax() <= 0) { vsMeas = 0; return; }
      // a short simulated scan with shot noise and linear extrapolation of the falling edge
      const pts = [];
      for (let k = 0; k <= 30; k++) {
        const V = -Emax() * (0.2 + (k / 30) * 0.7), I = noisy(Imodel(V), 0.5) - DARK; // dark current subtracted, as measured with the light blocked
        pts.push([V, I]);
      }
      let sx = 0, sy = 0, sxx = 0, sxy = 0;
      for (const [x, y] of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
      const n = pts.length, m = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - m * sx) / n;
      vsMeas = m !== 0 ? -(-b / m) : NaN;
    }
    function noisy(I, tint) {
      const rate = (I + DARK) / e, mean = rate * tint;
      const n = mean > 50 ? mean + Math.sqrt(mean) * U.randn() : (() => { let L = Math.exp(-mean), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; })();
      return (Math.max(0, n) * e) / tint;
    }

    ui.section('Light');
    ui.slider('Wavelength λ', { min: 150, max: 800, step: 1, value: S.lam, fmt: (v) => v + ' nm', onInput: (v) => (S.lam = v) });
    ui.slider('Light power P', { min: 0, max: 10, step: 0.05, value: S.P, fmt: (v) => v.toFixed(2) + ' µW', onInput: (v) => (S.P = v) });
    ui.section('Photocell');
    ui.select('Cathode metal', Object.entries(METALS).map(([k, v]) => [k, `${v[0]} (φ = ${v[1]} eV)`]), S.metal, (v) => (S.metal = v));
    ui.slider('Anode voltage V', { min: -6, max: 6, step: 0.01, value: S.V, fmt: (v) => v.toFixed(2) + ' V', onInput: (v) => (S.V = v) });
    ui.slider('Quantum efficiency η', { min: 1e-6, max: 0.1, value: S.eta, log: true, fmt: (v) => v.toExponential(1), onInput: (v) => (S.eta = v) });
    ui.slider('Ammeter integration time', { min: 0.01, max: 2, value: S.tint, log: true, fmt: (v) => v.toPrecision(2) + ' s', onInput: (v) => (S.tint = v) });

    return {
      reset() { els.length = 0; Ibuf = []; acc = 0; accN = 0; },
      step(dt) {
        tacc += dt;
        // ammeter: integrate electrons over the integration time
        const I = Imodel(S.V);
        acc += I * dt; accN += dt;
        if (accN >= S.tint) { Imeas = noisy(acc / accN, accN); acc = 0; accN = 0; Ibuf.push([S.V, Imeas]); if (Ibuf.length > 400) Ibuf.shift(); }
        // visual electrons (not used for the measurement)
        const rate = Math.min(120, (Isat() / 1e-9) * 6);
        let n = rate * dt; while (n > 0) { if (Math.random() < n) els.push({ x: 0, y: Math.random(), ke: Math.random() * Emax(), v: 0 }); n -= 1; }
        for (let i = els.length - 1; i >= 0; i--) {
          const p = els[i];
          if (!p.v) p.v = Math.sqrt(p.ke + 0.05) * 0.9;
          p.v += (S.V / 6) * dt * 2.2; // field accelerates (V>0) or retards (V<0)
          p.x += p.v * dt * 0.8;
          if (p.x >= 1 || p.x < 0 || p.v < -2) els.splice(i, 1);
        }
        if (tacc > 0.5) { tacc = 0; measureVs(); }
      },
      draw(ctx) {
        const W = env.W, H = env.H;
        ctx.fillStyle = '#111214'; ctx.fillRect(0, 0, W, H);
        const wide = W > 760, tw = wide ? W * 0.45 : W - 16, th = wide ? H - 20 : H * 0.42;
        // tube
        const tx = 10, ty = 10, cx0 = tx + tw * 0.15, cx1 = tx + tw * 0.85, cy = ty + th * 0.45, gh = th * 0.5;
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5; U.rrect(ctx, tx + tw * 0.06, cy - gh * 0.75, tw * 0.88, gh * 1.5, 40); ctx.stroke();
        ctx.fillStyle = '#adb5bd'; ctx.fillRect(cx0 - 8, cy - gh / 2, 8, gh);
        ctx.fillStyle = '#868e96'; ctx.fillRect(cx1, cy - gh / 2, 8, gh);
        U.label(ctx, cx0 - 4, cy + gh / 2 + 14, 'cathode (' + S.metal + ')', '#d4d7dc', 'center', 11);
        U.label(ctx, cx1 + 4, cy + gh / 2 + 14, 'anode', '#d4d7dc', 'center', 11);
        // light beam
        const vis = S.lam >= 380 && S.lam <= 780, [r, g, b] = vis ? U.wl2rgb(S.lam) : [200, 120, 255];
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.15 + 0.08 * S.P})`; ctx.lineWidth = 14;
        ctx.beginPath(); ctx.moveTo(tx + tw * 0.6, ty + 4); ctx.lineTo(cx0 - 4, cy); ctx.stroke(); ctx.lineWidth = 1;
        U.label(ctx, tx + tw * 0.62, ty + 14, `${S.lam} nm${vis ? '' : S.lam < 380 ? ' (UV)' : ' (IR)'}, ${S.P.toFixed(2)} µW`, '#d4d7dc');
        ctx.fillStyle = '#74c0fc';
        for (const p of els) { ctx.beginPath(); ctx.arc(cx0 + p.x * (cx1 - cx0), cy - gh / 2 + 6 + p.y * (gh - 12), 2.2, 0, U.TAU); ctx.fill(); }
        // circuit and meter
        const my = cy + gh * 0.75 + 30;
        ctx.strokeStyle = '#777'; ctx.beginPath(); ctx.moveTo(cx0 - 4, cy + gh / 2); ctx.lineTo(cx0 - 4, my); ctx.lineTo(cx1 + 4, my); ctx.lineTo(cx1 + 4, cy + gh / 2); ctx.stroke();
        U.label(ctx, (cx0 + cx1) / 2, my - 10, `V = ${S.V.toFixed(2)} V   ·   I = ${(Imeas * 1e9).toPrecision(4)} nA`, '#ffd43b', 'center', 13);
        U.label(ctx, (cx0 + cx1) / 2, my + 14, Emax() > 0 ? `E_max = ${Emax().toFixed(3)} eV → V_s = ${Emax().toFixed(3)} V` : `below threshold (λ₀ = ${(hc / phi()).toFixed(0)} nm): no emission`, '#adb5bd', 'center', 11);
        // I–V plot
        const px = wide ? tw + 20 : 4, py = wide ? 6 : th + 16, pw = W - px - 4, phh = H - py - 6;
        let imax = Isat() * 1.15 || 1e-10; for (const [, I] of Ibuf) imax = Math.max(imax, I * 1.05);
        const F = U.plot(ctx, px, py, pw, phh, { x0: -6, x1: 6, y0: 0, y1: imax * 1e9, xl: 'anode voltage V (V)', yl: 'photocurrent I (nA)', title: 'I–V curve: model (line) and ammeter readings (dots)' });
        F.clip();
        const xs = [], ys = [];
        for (let i = 0; i <= 240; i++) { const V = -6 + (12 * i) / 240; xs.push(V); ys.push(Imodel(V) * 1e9); }
        U.curve(ctx, F, xs, ys, '#adb5bd', 1.4, [5, 3]);
        ctx.fillStyle = '#ffd43b'; for (const [V, I] of Ibuf) { ctx.beginPath(); ctx.arc(F.sx(V), F.sy(I * 1e9), 2.2, 0, U.TAU); ctx.fill(); }
        ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(F.sx(S.V), F.T); ctx.lineTo(F.sx(S.V), F.B); ctx.stroke();
        ctx.restore();
      },
      readouts() {
        const f = (2.99792458e8 / (S.lam * 1e-9)) / 1e12;
        return [
          ['Wavelength λ', S.lam + ' nm'], ['Photon frequency f', f.toPrecision(6) + ' THz'], ['Photon energy', Eph().toFixed(5) + ' eV'],
          ['Work function φ', phi() + ' eV'], ['Threshold wavelength λ₀', (hc / phi()).toFixed(2) + ' nm'], ['Threshold frequency f₀', ((phi() * e) / hPl / 1e12).toPrecision(5) + ' THz'],
          ['Max kinetic energy', Emax().toFixed(5) + ' eV'], ['Stopping potential V_s (theory)', Emax().toFixed(5) + ' V'],
          ['Stopping potential V_s (measured)', isFinite(vsMeas) ? vsMeas.toFixed(4) + ' V' : '—'],
          ['Anode voltage V', S.V.toFixed(3) + ' V'], ['Photocurrent I', (Imeas * 1e9).toPrecision(5) + ' nA'], ['Model current', (Imodel(S.V) * 1e9).toPrecision(5) + ' nA'],
          ['Saturation current', (Isat() * 1e9).toPrecision(5) + ' nA'], ['Photon flux', ((S.P * 1e-6) / (Eph() * e)).toPrecision(4) + ' 1/s'],
          ['Light power P', S.P.toFixed(3) + ' µW'],
        ];
      },
    };
  },
});

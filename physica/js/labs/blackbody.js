'use strict';
/* Planck black-body spectrum: Wien peak, Stefan–Boltzmann, band powers, photon flux, grey bodies */
PhysLab.define({
  id: 'blackbody',
  title: 'Black-Body Radiation',
  subtitle: 'Planck spectrum from 1 K to 100 000 K: numerical peak and band integrals, Wien and Stefan–Boltzmann laws, photon flux, grey bodies.',
  color: '#1f5fbf',
  cat: 'Thermodynamics & Statistical',
  tags: ['Planck', 'Wien', 'Stefan–Boltzmann', 'Spectroscopy', 'Astrophysics'],
  hint: 'Move the temperature or pick a source · drag on the plot to place a filter band · values are integrated numerically from the Planck law',
  howto: [
    'Peak position and integrated powers are computed <b>numerically</b> from the Planck function (adaptive log-spaced Simpson integration), so sweeping T and fitting power laws is a genuine test of Wien’s and Stefan–Boltzmann’s laws.',
    '<b>Drag horizontally on the plot</b> to set a filter band (e.g. a detector or a photometric band); its share of the power is shown.',
    'Up to three reference curves can be pinned for comparison.',
  ],
  theory: `
  <h3>Planck’s law</h3>
  <div class="eq">B_λ(T) = (2hc²/λ⁵) · 1 / (e^(hc/λk_BT) − 1)    [W·sr⁻¹·m⁻³]</div>
  <div class="eq">Radiant exitance of a grey body: M = ε π ∫ B_λ dλ = ε σ T⁴</div>
  <h3>Laws to test</h3>
  <div class="eq">Wien: λ_max = b / T,  b = 2.897 771 955 × 10⁻³ m·K</div>
  <div class="eq">Stefan–Boltzmann: σ = 2π⁵k⁴/(15h³c²) = 5.670 374 419 × 10⁻⁸ W·m⁻²·K⁻⁴</div>
  <div class="eq">Photon exitance: Φ = 1.520 4 × 10¹⁵ T³ photons·s⁻¹·m⁻²;  mean photon energy ≈ 2.701 k_BT</div>
  <p>Constants (CODATA 2018, exact SI): h = 6.626 070 15 × 10⁻³⁴ J·s, c = 299 792 458 m/s, k_B = 1.380 649 × 10⁻²³ J/K.</p>
  <p>The “approximate colour” swatch weights the visible spectrum with a simple wavelength-to-RGB map; it is a guide, not a colorimetric (CIE) calculation.</p>`,
  experiment: { mode: 'sweep', param: 'Temperature T', from: 1000, to: 20000, points: 12, logSpace: true, settle: 0, measure: 0.05, stat: 'final' },
  protocols: [
    { t: 'Verify Wien’s displacement law', h: 'Sweep T logarithmically from 300 K to 30 000 K and record the numerically found peak. A power-law fit should give n = −1 and A = b = 2.898 × 10⁻³ m·K (in µm·K: 2898).', setup: { mode: 'sweep', param: 'Temperature T', from: 300, to: 30000, points: 15, logSpace: true, settle: 0, measure: 0.05, stat: 'final', y: 'Peak wavelength (numerical)', fit: 'power' } },
    { t: 'Verify the Stefan–Boltzmann law', h: 'Same sweep, record the numerically integrated exitance. The power-law exponent should be 4 and A = σ (with ε = 1).', setup: { set: { 'Emissivity ε': 1 }, mode: 'sweep', param: 'Temperature T', from: 300, to: 30000, points: 15, logSpace: true, settle: 0, measure: 0.05, stat: 'final', y: 'Exitance M (numerical)', fit: 'power' } },
    { t: 'Luminous efficiency of hot sources', h: 'Sweep T from 1000 K to 20 000 K and record the visible fraction: it peaks near 7000 K — why incandescent lamps (2800 K) are inefficient.', setup: { mode: 'sweep', param: 'Temperature T', from: 1000, to: 20000, points: 20, logSpace: true, settle: 0, measure: 0.05, stat: 'final', y: 'Visible fraction (380–750 nm)' } },
  ],

  create(env) {
    const { ui } = env;
    const h = 6.62607015e-34, c = 299792458, kB = 1.380649e-23, SIG = 5.670374419e-8, WIEN = 2.897771955e-3;
    const S = { T: 5772, eps: 1, A: 1, b1: 400, b2: 700, auto: true, lmax: 3, logx: false, logy: false };
    const refs = [];
    let drag = null;
    const B = (lam, T) => { const x = (h * c) / (lam * kB * T); return x > 700 ? 0 : (2 * h * c * c) / Math.pow(lam, 5) / Math.expm1(x); };
    // ∫ B_λ dλ from l1 to l2 (m), Simpson in ln λ with 400 intervals
    function integ(T, l1, l2, photon) {
      const n = 400, a = Math.log(l1), bb = Math.log(l2), dh = (bb - a) / n;
      let s = 0;
      for (let k = 0; k <= n; k++) { const lam = Math.exp(a + k * dh), w = k === 0 || k === n ? 1 : k % 2 ? 4 : 2; let v = B(lam, T) * lam; if (photon) v *= lam / (h * c); s += w * v; }
      return (s * dh) / 3;
    }
    const total = (T, photon) => integ(T, (WIEN / T) * 0.01, (WIEN / T) * 200, photon);
    function peakNumeric(T) {
      // golden-section search on B_λ in ln λ
      let a = Math.log((WIEN / T) * 0.2), bb = Math.log((WIEN / T) * 5); const g = 0.6180339887;
      for (let k = 0; k < 90; k++) { const x1 = bb - g * (bb - a), x2 = a + g * (bb - a); if (B(Math.exp(x1), T) > B(Math.exp(x2), T)) bb = x2; else a = x1; }
      return Math.exp((a + bb) / 2);
    }
    function colour(T) {
      let r = 0, g = 0, b = 0;
      for (let l = 380; l <= 750; l += 5) { const [R, G, Bc] = U.wl2rgb(l), w = B(l * 1e-9, T); r += R * w; g += G * w; b += Bc * w; }
      const m = Math.max(r, g, b) || 1;
      return [Math.round((255 * r) / m), Math.round((255 * g) / m), Math.round((255 * b) / m)];
    }
    const presets = [['CMB', 2.725], ['Human body', 310], ['Lava', 1400], ['Bulb', 2800], ['Sun', 5772], ['Sirius', 9940], ['Rigel', 12100]];

    ui.section('Source');
    const Ts = ui.slider('Temperature T', { min: 1, max: 100000, value: S.T, log: true, fmt: (v) => (v < 100 ? v.toFixed(3) : v.toFixed(0)) + ' K', onInput: (v) => (S.T = v) });
    ui.buttons(presets.map(([n, T]) => ({ label: `${n} (${T} K)`, onClick: () => Ts.set(T, true) })));
    ui.slider('Emissivity ε', { min: 0.01, max: 1, step: 0.01, value: S.eps, fmt: (v) => v.toFixed(2), onInput: (v) => (S.eps = v) });
    ui.slider('Emitting area A', { min: 1e-6, max: 1e4, value: S.A, log: true, fmt: (v) => v.toPrecision(3) + ' m²', onInput: (v) => (S.A = v) });
    ui.section('Filter band');
    ui.slider('Band from λ₁', { min: 10, max: 100000, value: S.b1, log: true, fmt: (v) => v.toPrecision(4) + ' nm', onInput: (v) => (S.b1 = v) });
    ui.slider('Band to λ₂', { min: 10, max: 100000, value: S.b2, log: true, fmt: (v) => v.toPrecision(4) + ' nm', onInput: (v) => (S.b2 = v) });
    ui.section('Display');
    ui.toggle('Auto wavelength range', S.auto, (v) => (S.auto = v));
    ui.slider('Wavelength axis maximum', { min: 0.1, max: 10000, value: S.lmax, log: true, fmt: (v) => v.toPrecision(3) + ' µm', onInput: (v) => (S.lmax = v) });
    ui.toggle('Log wavelength axis', S.logx, (v) => (S.logx = v));
    ui.toggle('Log radiance axis', S.logy, (v) => (S.logy = v));
    ui.buttons([{ label: 'Pin this curve', onClick: () => { refs.push(S.T); if (refs.length > 3) refs.shift(); } }, { label: 'Clear pinned', onClick: () => (refs.length = 0) }]);

    const range = () => {
      const pk = WIEN / S.T;
      if (S.auto) return S.logx ? [pk * 0.05e6, pk * 50e6] : [0, pk * 5e6];
      return S.logx ? [S.lmax * 1e-3, S.lmax] : [0, S.lmax];
    };
    let FR = null;
    const pxToNm = (px) => { if (!FR) return NaN; const [l0, l1] = range(), u = (px - FR.L) / (FR.R - FR.L); return (S.logx ? Math.exp(Math.log(l0) + u * (Math.log(l1) - Math.log(l0))) : l0 + u * (l1 - l0)) * 1000; };

    return {
      pointerdown(p) { if (!FR || p.y < FR.T || p.y > FR.B) return; drag = pxToNm(p.x); },
      pointermove(p) { if (drag === null) return; const now = pxToNm(p.x); if (!(now > 0 && drag > 0)) return; const reg = PhysLab.internal.reg.params; const a = reg.find((q) => q.label === 'Band from λ₁'), b = reg.find((q) => q.label === 'Band to λ₂'); a.set(U.clamp(Math.min(drag, now), 10, 1e5)); b.set(U.clamp(Math.max(drag, now) + 1, 10, 1e5)); },
      pointerup() { drag = null; },
      draw(ctx) {
        const W = env.W, H = env.H;
        ctx.fillStyle = '#111214'; ctx.fillRect(0, 0, W, H);
        const [l0, l1] = range(); // µm
        const N = 400, xs = [], ys = [];
        let ymax = 0;
        for (let i = 0; i <= N; i++) { const lu = S.logx ? Math.exp(Math.log(l0) + (i / N) * (Math.log(l1) - Math.log(l0))) : l0 + ((l1 - l0) * i) / N; const v = S.eps * B(lu * 1e-6, S.T) * 1e-6; xs.push(lu); ys.push(v); ymax = Math.max(ymax, v); }
        for (const T of refs) for (const lu of xs) ymax = Math.max(ymax, B(lu * 1e-6, T) * 1e-6);
        const ph = H - 70;
        const F = U.plot(ctx, 4, 6, W - 8, ph, { x0: S.logx ? l0 : 0, x1: l1, y0: S.logy ? ymax * 1e-6 : 0, y1: ymax * 1.08, logx: S.logx, logy: S.logy, xl: 'wavelength λ (µm)', yl: 'spectral radiance B_λ  (W·sr⁻¹·m⁻²·µm⁻¹)', title: `Planck spectrum at T = ${S.T < 100 ? S.T.toFixed(3) : S.T.toFixed(0)} K${S.eps < 1 ? `, ε = ${S.eps.toFixed(2)}` : ''}` });
        FR = F;
        F.clip();
        // visible band
        const v0 = F.sx(0.38), v1 = F.sx(0.75);
        if (v1 > F.L && v0 < F.R) for (let px = Math.max(F.L, v0); px < Math.min(F.R, v1); px += 2) { const lam = pxToNm(px); const [r, g, b] = U.wl2rgb(lam); ctx.fillStyle = `rgba(${r},${g},${b},0.22)`; ctx.fillRect(px, F.T, 2, F.B - F.T); }
        // filter band
        const f0 = F.sx(S.b1 / 1000), f1 = F.sx(S.b2 / 1000);
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(Math.min(f0, f1), F.T, Math.abs(f1 - f0), F.B - F.T);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([3, 3]); ctx.strokeRect(Math.min(f0, f1), F.T, Math.abs(f1 - f0), F.B - F.T); ctx.setLineDash([]);
        refs.forEach((T, k) => U.curve(ctx, F, xs, xs.map((lu) => B(lu * 1e-6, T) * 1e-6), ['#adb5bd', '#868e96', '#5c636a'][k], 1.3, [5, 3]));
        U.curve(ctx, F, xs, ys, '#ff8787', 2.2);
        const pk = peakNumeric(S.T) * 1e6;
        if (pk > (S.logx ? l0 : 0) && pk < l1) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(F.sx(pk), F.T); ctx.lineTo(F.sx(pk), F.B); ctx.stroke(); }
        ctx.restore();
        refs.forEach((T, k) => U.label(ctx, F.R - 8, F.T + 14 + k * 14, `pinned ${T.toFixed(0)} K`, ['#adb5bd', '#868e96', '#5c636a'][k], 'right'));
        if (pk > (S.logx ? l0 : 0) && pk < l1) U.label(ctx, F.sx(pk) + 4, F.T + 12, `λ_max = ${pk.toPrecision(4)} µm`, '#e9ecef');
        // colour swatch
        const [r, g, b] = colour(S.T);
        ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(12, H - 52, 46, 40);
        ctx.strokeStyle = '#666'; ctx.strokeRect(12, H - 52, 46, 40);
        U.label(ctx, 66, H - 40, 'approximate colour of the source', '#d4d7dc');
        U.label(ctx, 66, H - 22, `filter band ${S.b1.toPrecision(4)}–${S.b2.toPrecision(4)} nm (drag on the plot to change)`, '#888');
      },
      readouts() {
        const T = S.T, pk = peakNumeric(T), Mtot = Math.PI * total(T) * S.eps;
        const vis = (Math.PI * integ(T, 380e-9, 750e-9) * S.eps) / Mtot;
        const l1 = Math.min(S.b1, S.b2) * 1e-9, l2 = Math.max(S.b1, S.b2) * 1e-9, band = Math.PI * integ(T, l1, l2) * S.eps;
        const phot = Math.PI * total(T, true) * S.eps;
        return [
          ['Temperature T', T.toPrecision(6) + ' K'],
          ['Peak wavelength (numerical)', (pk * 1e6).toPrecision(6) + ' µm'], ['Wien b/T', ((WIEN / T) * 1e6).toPrecision(6) + ' µm'],
          ['Peak frequency (Wien, ν)', ((5.878925757e10 * T) / 1e12).toPrecision(5) + ' THz'],
          ['Peak radiance B_λ', (S.eps * B(pk, T) * 1e-6).toPrecision(5) + ' W/(sr·m²·µm)'],
          ['Exitance M (numerical)', Mtot.toPrecision(6) + ' W/m²'], ['εσT⁴', (S.eps * SIG * T ** 4).toPrecision(6) + ' W/m²'],
          ['Total power P = M·A', (Mtot * S.A).toPrecision(5) + ' W'],
          ['Visible fraction (380–750 nm)', (vis * 100).toPrecision(5) + ' %'],
          ['Band exitance', band.toPrecision(5) + ' W/m²'], ['Band fraction', ((band / Mtot) * 100).toPrecision(5) + ' %'],
          ['Photon exitance', phot.toPrecision(5) + ' 1/(s·m²)'], ['Mean photon energy', ((Mtot / phot) / 1.602176634e-19).toPrecision(5) + ' eV'],
          ['k_B T', ((kB * T) / 1.602176634e-19).toPrecision(5) + ' eV'],
        ];
      },
    };
  },
});

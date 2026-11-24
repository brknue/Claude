'use strict';
/* ==========================================================================
   Simple Mol Lab — Analysis Lab: quantitative chemistry instruments
   (acid–base titration, reaction kinetics, UV-Vis spectrophotometer, real gases)
   Each instrument: parameters → readouts (with optional instrument noise);
   experiments sweep one variable with replicates; data → fit → PDF / CSV / JSON.
   ========================================================================== */
(function () {
  const $ = (s) => document.querySelector(s);
  const S = window.SML, { fmtN, esc, stats, isNum } = S;
  const randn = S.U.randn;
  const R = 8.314462618; // J/(mol·K)

  /* ---------------- instruments ---------------- */
  // titration: analytes as polyprotic acids (fully protonated charge z0) with spectator ions
  const ANALYTES = {
    hcl: { n: 'Hydrochloric acid (strong)', pka: [], z0: 0, an: 1, strongAcid: 1 },
    acetic: { n: 'Acetic acid', pka: [4.756], z0: 0 },
    formic: { n: 'Formic acid', pka: [3.745], z0: 0 },
    benzoic: { n: 'Benzoic acid', pka: [4.204], z0: 0 },
    phosphoric: { n: 'Phosphoric acid (triprotic)', pka: [2.148, 7.198, 12.319], z0: 0 },
    citric: { n: 'Citric acid (triprotic)', pka: [3.128, 4.761, 6.396], z0: 0 },
    carbonic: { n: 'Carbonic acid (CO₂ aq)', pka: [6.351, 10.329], z0: 0 },
    nh4cl: { n: 'Ammonium chloride', pka: [9.25], z0: 1, an: 1 },
    nh3: { n: 'Ammonia (titrate with HCl)', pka: [9.25], z0: 1, base: 1, start: 1 },
    na2co3: { n: 'Sodium carbonate (titrate with HCl)', pka: [6.351, 10.329], z0: 0, cat: 2, base: 1, start: 2 },
  };
  const INDICATORS = [['Methyl orange', 3.1, 4.4, '#e03131', '#f59f00'], ['Bromothymol blue', 6.0, 7.6, '#f2c94c', '#1c7ed6'], ['Phenolphthalein', 8.2, 10.0, '#f1f3f5', '#d6336c']];
  function phOf(P, Vt) {
    const A = ANALYTES[P.analyte], Vtot = (P.V0 + Vt) / 1000;
    const CA = (P.CA * P.V0) / 1000 / Vtot, Ct = (P.Ct * Vt) / 1000 / Vtot;
    const base = P.titrant === 'naoh';
    const Na = (base ? Ct : 0) + (A.cat || 0) * CA, Cl = (base ? 0 : Ct) + (A.an || 0) * CA;
    const Kw = 1e-14, Ka = A.pka.map((p) => Math.pow(10, -p));
    const charge = (h) => {
      let q = h + Na - Kw / h - Cl;
      if (A.strongAcid) return q - CA * 0; // Cl- already counted as spectator
      // fractions of HnA species
      const n = Ka.length; const terms = [1]; let prod = 1;
      for (let i = 0; i < n; i++) { prod *= Ka[i] / h; terms.push(prod); }
      const sum = terms.reduce((a, b) => a + b, 0);
      for (let i = 0; i <= n; i++) q += CA * (terms[i] / sum) * (A.z0 - i);
      return q;
    };
    let lo = -2, hi = 16; // pH bracket
    for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (charge(Math.pow(10, -m)) > 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  function eqVolumes(P) {
    const A = ANALYTES[P.analyte], nA = P.CA * P.V0, out = [];
    if (A.strongAcid) return [nA / P.Ct];
    const k = A.pka.length;
    if (A.base) for (let i = 1; i <= (A.start || k); i++) out.push((i * nA) / P.Ct);
    else for (let i = 1; i <= k; i++) out.push((i * nA) / P.Ct);
    return out;
  }

  const RX = {
    n2o5: { n: 'N₂O₅ → 2 NO₂ + ½ O₂ (first order)', order: 1, A: 4.94e13, Ea: 103.4, T: 318, C0: 0.02, eps: 0, unitA: '1/s' },
    cv: { n: 'Crystal violet + OH⁻ (pseudo-first order, [OH⁻] = 0.02 M)', order: 1, A: 6.0e9 * 0.02, Ea: 61, T: 298, C0: 1.0e-5, eps: 87000, unitA: '1/s', approx: 1 },
    no2: { n: '2 NO₂ → 2 NO + O₂ (second order)', order: 2, A: 4.0e9, Ea: 111, T: 600, C0: 0.01, eps: 0, unitA: 'L/(mol·s)', approx: 1 },
    h2o2: { n: 'H₂O₂ decomposition, iodide-catalysed (first order)', order: 1, A: 1.0e6, Ea: 56, T: 298, C0: 0.5, eps: 0, unitA: '1/s', approx: 1 },
    custom: { n: 'Custom (choose order, A and Eₐ)', order: 1, A: 1e10, Ea: 75, T: 298, C0: 0.1, eps: 0, unitA: '' },
  };
  const kOf = (P) => P.Apre * Math.exp((-P.Ea * 1000) / (R * P.T));
  function concOf(P, t) {
    const k = kOf(P), c0 = P.C0;
    if (P.order === 0) return Math.max(0, c0 - k * t);
    if (P.order === 1) return c0 * Math.exp(-k * t);
    return c0 / (1 + k * c0 * t);
  }
  function halfLife(P) { const k = kOf(P); return P.order === 0 ? P.C0 / (2 * k) : P.order === 1 ? Math.LN2 / k : 1 / (k * P.C0); }

  const DYES = {
    kmno4: { n: 'Potassium permanganate KMnO₄', bands: [[526, 2455, 17], [546, 2300, 12], [507, 1600, 12]], c: 2e-4 },
    cv: { n: 'Crystal violet', bands: [[590, 87000, 32], [540, 30000, 25]], c: 5e-6 },
    mb: { n: 'Methylene blue', bands: [[664, 95000, 20], [612, 45000, 25], [292, 40000, 15]], c: 5e-6 },
    cuso4: { n: 'Copper(II) sulfate (aq)', bands: [[810, 12.5, 130]], c: 0.05 },
    dichromate: { n: 'Potassium dichromate (acidic)', bands: [[257, 4300, 22], [350, 3150, 28]], c: 2e-4 },
    nadh: { n: 'NADH', bands: [[340, 6220, 25], [260, 16000, 18]], c: 1e-4 },
  };
  const rawEps = (dye, lam) => DYES[dye].bands.reduce((s, [l0, e, w]) => s + e * Math.exp(-((lam - l0) ** 2) / (2 * w * w)), 0);
  // scale each spectrum so that ε at the first (reference) band maximum equals the literature value
  for (const k in DYES) { const [l0, e] = DYES[k].bands[0]; DYES[k].scale = e / rawEps(k, l0); }
  const epsAt = (dye, lam) => DYES[dye].scale * rawEps(dye, lam);
  const UNK = { dye: 'kmno4', c: 0 };
  function newUnknown() { const keys = Object.keys(DYES); UNK.dye = keys[(Math.random() * keys.length) | 0]; UNK.c = DYES[UNK.dye].c * (0.4 + Math.random() * 1.2); }
  newUnknown();
  let calib = null; // {slope, intercept, lam, dye, path}

  const GASES = {
    he: ['Helium', 0.0346, 0.0238], h2: ['Hydrogen', 0.2476, 0.02661], n2: ['Nitrogen', 1.37, 0.0387], o2: ['Oxygen', 1.382, 0.03186], ar: ['Argon', 1.355, 0.03201],
    ch4: ['Methane', 2.283, 0.04278], co2: ['Carbon dioxide', 3.64, 0.04267], nh3: ['Ammonia', 4.225, 0.0371], h2o: ['Water', 5.537, 0.03049],
  };
  const Rb = 0.0831446; // L·bar/(mol·K)
  const vdw = (P) => { const [, a, b] = GASES[P.gas]; return (P.n * Rb * P.T) / (P.V - P.n * b) - (a * P.n * P.n) / (P.V * P.V); };

  const INSTR = [
    {
      id: 'titration', name: 'Acid–base titration', short: 'pH meter and burette; equivalence points, pKₐ, buffers',
      params: [
        { k: 'analyte', l: 'Analyte', t: 'sel', o: Object.entries(ANALYTES).map(([k, v]) => [k, v.n]), v: 'acetic' },
        { k: 'CA', l: 'Analyte concentration', t: 'num', v: 0.1, min: 0.0001, max: 2, u: 'mol/L' },
        { k: 'V0', l: 'Analyte volume', t: 'num', v: 25, min: 1, max: 250, u: 'mL' },
        { k: 'titrant', l: 'Titrant', t: 'sel', o: [['naoh', 'NaOH (strong base)'], ['hcl', 'HCl (strong acid)']], v: 'naoh' },
        { k: 'Ct', l: 'Titrant concentration', t: 'num', v: 0.1, min: 0.0001, max: 2, u: 'mol/L' },
        { k: 'Vt', l: 'Titrant added', t: 'range', v: 0, min: 0, max: 60, step: 0.01, u: 'mL' },
      ],
      sweep: [{ k: 'Vt', l: 'Titrant added', u: 'mL', from: 0, to: 50, n: 101 }, { k: 'CA', l: 'Analyte concentration', u: 'mol/L', from: 0.001, to: 0.2, n: 10, log: true }],
      xname: { Vt: 'Titrant volume', CA: 'Analyte concentration' },
      measure(P, noise) {
        const Vread = P.Vt, Vtrue = Math.max(0, P.Vt + (noise ? 0.01 * randn() : 0));
        const ph = phOf(P, Vtrue) + (noise ? 0.01 * randn() : 0);
        const d = 0.02, deriv = (phOf(P, P.Vt + d) - phOf(P, Math.max(0, P.Vt - d))) / (P.Vt > d ? 2 * d : d + P.Vt);
        const ind = INDICATORS.map(([n, a, b]) => n + ': ' + (ph < a ? 'acid colour' : ph > b ? 'base colour' : 'changing')).join(' · ');
        const eq = eqVolumes(P);
        return [['Titrant volume', Vread, 'mL'], ['Analyte concentration', P.CA, 'mol/L'], ['pH', ph, ''], ['[H⁺]', Math.pow(10, -ph), 'mol/L'], ['pOH', 14 - ph, ''], ['dpH/dV (model)', deriv, '1/mL'],
          ['Total volume', P.V0 + P.Vt, 'mL'], ['Fraction to 1st equivalence', P.Vt / eq[0], ''], ...eq.map((v, i) => ['Equivalence volume ' + (i + 1), v, 'mL']), ...ANALYTES[P.analyte].pka.map((p, i) => ['pKa' + (i + 1) + ' (25 °C)', p, '']), ['Indicators', ind, 'text']];
      },
      preview(P) { const xs = [], ys = [], vmax = Math.max(P.Vt, eqVolumes(P).slice(-1)[0] * 1.6); for (let i = 0; i <= 300; i++) { const v = (vmax * i) / 300; xs.push(v); ys.push(phOf(P, v)); } return { x: 'Titrant volume', y: 'pH', xs, ys, xl: 'titrant volume (mL)', yl: 'pH', mark: [P.Vt, phOf(P, P.Vt)] }; },
      post(run) {
        // numerical derivative of the measured curve and equivalence points (maxima of |dpH/dV|)
        const x = run.cols[0].v, ph = (run.cols.find((c) => c.name === 'pH') || {}).v;
        if (!ph || run.cols[0].name !== 'Titrant volume') return;
        const d = x.map((_, i) => (i === 0 || i === x.length - 1 ? NaN : (ph[i + 1] - ph[i - 1]) / (x[i + 1] - x[i - 1])));
        run.cols.splice(2, 0, { name: 'dpH/dV (from data)', unit: '1/mL', v: d });
        const peaks = [];
        for (let i = 2; i < d.length - 2; i++) if (isNum(d[i]) && Math.abs(d[i]) > 0.3 && Math.abs(d[i]) >= Math.abs(d[i - 1]) && Math.abs(d[i]) >= Math.abs(d[i + 1]) && Math.abs(d[i]) > Math.abs(d[i - 2]) && Math.abs(d[i]) > Math.abs(d[i + 2])) peaks.push([x[i], ph[i], d[i]]);
        run.findings = peaks.slice(0, 4).map(([v, p, s], i) => [`Equivalence point ${i + 1} (max |dpH/dV|)`, `V = ${fmtN(v, 4)} mL, pH = ${fmtN(p, 4)}, slope ${fmtN(s, 3)} /mL`]);
        if (peaks.length) {
          const ve = peaks[0][0], half = ve / 2; let best = 0;
          for (let i = 1; i < x.length; i++) if (Math.abs(x[i] - half) < Math.abs(x[best] - half)) best = i;
          if (!ANALYTES[run.P.analyte].strongAcid && !ANALYTES[run.P.analyte].base) run.findings.push(['pH at half equivalence (≈ pKa1)', `${fmtN(ph[best], 4)} at V = ${fmtN(x[best], 4)} mL`]);
          run.findings.push(['Analyte concentration from 1st equivalence', `${fmtN((ve * run.P.Ct) / run.P.V0, 5)} mol/L (set value ${run.P.CA} mol/L)`]);
        }
      },
      theory: `<h3>Model</h3><p>The pH is found by solving the full charge balance (no approximations) at each added volume, including dilution and water autoionisation:</p>
        <div class="eq">[H⁺] + [Na⁺] + Σ z·[species] = [OH⁻] + [Cl⁻],   K_w = 10⁻¹⁴ (25 °C)</div>
        <div class="eq">Fractions of HₙA: α_i ∝ ∏_{j≤i} K_aj / [H⁺]^i</div>
        <p>Instrument noise (when on): pH meter σ = 0.01, burette volume σ = 0.01 mL. Equivalence points are found as maxima of the numerical derivative of the recorded curve. For a weak monoprotic acid, pH at half equivalence ≈ pKₐ (Henderson–Hasselbalch).</p>
        <h3>pKₐ values used (25 °C)</h3><p>Acetic 4.756 · formic 3.745 · benzoic 4.204 · phosphoric 2.148 / 7.198 / 12.319 · citric 3.128 / 4.761 / 6.396 · carbonic 6.351 / 10.329 · ammonium 9.25. Activity coefficients are taken as 1.</p>`,
      protocols: [
        { t: 'Titration curve of acetic acid', h: 'Add 0–50 mL of 0.1 M NaOH in 101 steps. The run marks the equivalence point and reads pKₐ at half equivalence.', set: { analyte: 'acetic', titrant: 'naoh' }, sw: 'Vt', from: 0, to: 50, n: 101, rep: 1, y: 'pH' },
        { t: 'Phosphoric acid: three equivalence points?', h: 'Titrate 0.1 M H₃PO₄ with NaOH up to 80 mL. Only two jumps are visible — the third pKₐ is too close to the pH of the titrant.', set: { analyte: 'phosphoric', titrant: 'naoh' }, sw: 'Vt', from: 0, to: 80, n: 161, rep: 1, y: 'pH' },
        { t: 'Ammonia with HCl', h: 'Weak base with strong acid: the equivalence point lies in the acidic range — choose methyl orange, not phenolphthalein.', set: { analyte: 'nh3', titrant: 'hcl' }, sw: 'Vt', from: 0, to: 50, n: 101, rep: 1, y: 'pH' },
      ],
    },
    {
      id: 'kinetics', name: 'Reaction kinetics', short: 'concentration vs time, rate laws, Arrhenius plot',
      params: [
        { k: 'rx', l: 'Reaction', t: 'sel', o: Object.entries(RX).map(([k, v]) => [k, v.n]), v: 'n2o5' },
        { k: 'order', l: 'Reaction order', t: 'sel', o: [[0, 'zero order'], [1, 'first order'], [2, 'second order']], v: 1 },
        { k: 'Apre', l: 'Pre-exponential factor A', t: 'num', v: 4.94e13, min: 1e-3, max: 1e18 },
        { k: 'Ea', l: 'Activation energy Eₐ', t: 'num', v: 103.4, min: 0, max: 400, u: 'kJ/mol' },
        { k: 'T', l: 'Temperature', t: 'range', v: 318, min: 250, max: 800, step: 0.5, u: 'K' },
        { k: 'C0', l: 'Initial concentration [A]₀', t: 'num', v: 0.02, min: 1e-9, max: 10, u: 'mol/L' },
        { k: 't', l: 'Time', t: 'range', v: 0, min: 0, max: 20000, step: 1, u: 's' },
      ],
      sweep: [{ k: 't', l: 'Time', u: 's', from: 0, to: 6000, n: 61 }, { k: 'T', l: 'Temperature', u: 'K', from: 300, to: 340, n: 9 }, { k: 'C0', l: 'Initial concentration [A]₀', u: 'mol/L', from: 0.005, to: 0.05, n: 10 }],
      xname: { t: 'Time', T: 'Temperature', C0: 'Initial concentration' },
      onParam(P, k) { if (k === 'rx') { const r = RX[P.rx]; Object.assign(P, { order: r.order, Apre: r.A, Ea: r.Ea, T: r.T, C0: r.C0, t: 0 }); return true; } },
      measure(P, noise) {
        const k = kOf(P), c = concOf(P, P.t), eps = RX[P.rx].eps;
        const cm = c * (1 + (noise ? 0.005 * randn() : 0)) + (noise ? 1e-4 * P.C0 * randn() : 0);
        const km = k * (1 + (noise ? 0.02 * randn() : 0));
        const out = [['Time', P.t, 's'], ['Temperature', P.T, 'K'], ['Initial concentration', P.C0, 'mol/L'], ['[A]', cm, 'mol/L'], ['ln [A]', Math.log(Math.max(1e-300, cm)), ''], ['1/[A]', 1 / cm, 'L/mol'], ['Fraction remaining', cm / P.C0, '']];
        if (eps) out.push(['Absorbance (590 nm, 1 cm)', eps * c + (noise ? 0.002 * randn() : 0), '']);
        const ku = P.order === 0 ? 'mol/(L·s)' : P.order === 1 ? '1/s' : 'L/(mol·s)';
        out.push(['Rate constant k', km, ku], ['ln k', Math.log(km), ''], ['1/T', 1 / P.T, '1/K'], ['Half-life t½', halfLife(P), 's'], ['Initial rate', P.order === 0 ? k : P.order === 1 ? k * P.C0 : k * P.C0 * P.C0, 'mol/(L·s)'], ['Rate now', P.order === 0 ? (c > 0 ? k : 0) : P.order === 1 ? k * c : k * c * c, 'mol/(L·s)']);
        return out;
      },
      preview(P) { const th = halfLife(P), tm = Math.max(P.t * 1.1, 5 * (isFinite(th) ? th : 1000)), xs = [], ys = []; for (let i = 0; i <= 300; i++) { const t = (tm * i) / 300; xs.push(t); ys.push(concOf(P, t)); } return { x: 'Time', y: '[A]', xs, ys, xl: 'time (s)', yl: '[A] (mol/L)', mark: [P.t, concOf(P, P.t)] }; },
      theory: `<h3>Integrated rate laws</h3>
        <div class="eq">0th order: [A] = [A]₀ − k t      t½ = [A]₀ / 2k</div>
        <div class="eq">1st order: [A] = [A]₀ e^(−k t)     t½ = ln 2 / k     (ln[A] linear in t)</div>
        <div class="eq">2nd order: 1/[A] = 1/[A]₀ + k t    t½ = 1 / (k [A]₀)  (1/[A] linear in t)</div>
        <h3>Arrhenius equation</h3>
        <div class="eq">k = A e^(−Eₐ / RT)    ln k = ln A − (Eₐ/R)(1/T)</div>
        <p>Plot ln k against 1/T: slope = −Eₐ/R (R = 8.314 J/(mol·K)). Instrument noise (when on): concentration σ = 0.5 % + 0.01 % of [A]₀; rate constants from a single run σ = 2 %; absorbance σ = 0.002.</p>
        <h3>Data</h3><p>N₂O₅ decomposition: A = 4.94 × 10¹³ s⁻¹, Eₐ = 103.4 kJ/mol (gas phase, classic data). The other presets use approximate literature values and are meant for practice.</p>`,
      protocols: [
        { t: 'Rate constant of N₂O₅ decomposition', h: 'Record [A] for 6000 s at 318 K and fit an exponential: k = −(fit k), and t½ = ln2/k.', set: { rx: 'n2o5' }, sw: 't', from: 0, to: 6000, n: 61, rep: 1, y: '[A]', fit: 'exp' },
        { t: 'Arrhenius plot: activation energy', h: 'Sweep the temperature 300–340 K, measure k three times at each point. Plot ln k against 1/T and fit a line: Eₐ = −slope × R.', set: { rx: 'n2o5' }, sw: 'T', from: 300, to: 340, n: 9, rep: 3, x: '1/T', y: 'ln k', fit: 'linear' },
        { t: 'Find the order: second-order decay', h: 'NO₂ at 600 K: record 120 s. ln[A] is curved, 1/[A] is a straight line — fit a line to 1/[A] against time; the slope is k.', set: { rx: 'no2' }, sw: 't', from: 0, to: 120, n: 61, rep: 1, y: '1/[A]', fit: 'linear' },
      ],
    },
    {
      id: 'spectro', name: 'UV-Vis spectrophotometer', short: 'Beer–Lambert law, calibration curves, spectra, unknowns',
      params: [
        { k: 'sample', l: 'Sample', t: 'sel', o: [['known', 'Standard solution (known)'], ['unknown', 'Unknown sample']], v: 'known' },
        { k: 'dye', l: 'Compound (standards)', t: 'sel', o: Object.entries(DYES).map(([k, v]) => [k, v.n]), v: 'kmno4' },
        { k: 'c', l: 'Concentration of the standard', t: 'num', v: 2e-4, min: 1e-9, max: 1, u: 'mol/L' },
        { k: 'lam', l: 'Wavelength λ', t: 'range', v: 526, min: 200, max: 900, step: 1, u: 'nm' },
        { k: 'path', l: 'Path length', t: 'num', v: 1, min: 0.01, max: 10, u: 'cm' },
        { k: 'stray', l: 'Stray light', t: 'num', v: 0.05, min: 0, max: 5, u: '%' },
      ],
      sweep: [{ k: 'c', l: 'Concentration', u: 'mol/L', from: 2e-5, to: 4e-4, n: 10 }, { k: 'lam', l: 'Wavelength', u: 'nm', from: 300, to: 800, n: 251 }, { k: 'path', l: 'Path length', u: 'cm', from: 0.2, to: 5, n: 10 }],
      xname: { c: 'Concentration', lam: 'Wavelength', path: 'Path length' },
      onParam(P, k) { if (k === 'dye') { P.c = DYES[P.dye].c; P.lam = DYES[P.dye].bands[0][0]; return true; } },
      measure(P, noise) {
        const unk = P.sample === 'unknown', dye = unk ? UNK.dye : P.dye, c = unk ? UNK.c : P.c;
        const eps = epsAt(dye, P.lam), Atrue = eps * P.path * c, s = P.stray / 100;
        const T = (Math.pow(10, -Atrue) + s) / (1 + s);
        let A = -Math.log10(T);
        if (noise) A += 0.0015 * randn() + 0.003 * A * randn();
        const out = [['Concentration', unk ? NaN : c, 'mol/L'], ['Wavelength', P.lam, 'nm'], ['Path length', P.path, 'cm'], ['Absorbance A', A, ''], ['Transmittance', 100 * Math.pow(10, -A), '%']];
        if (!unk) out.push(['ε at λ', eps, 'L/(mol·cm)'], ['Beer–Lambert A = εlc', Atrue, '']);
        if (unk) {
          if (calib && calib.lam === P.lam && calib.path === P.path && calib.slope) out.push(['c from calibration', (A - calib.intercept) / calib.slope, 'mol/L'], ['Calibration slope εl', calib.slope, 'L/mol']);
          else out.push(['c from calibration', NaN, 'mol/L']);
        }
        return out;
      },
      preview(P) { const unk = P.sample === 'unknown', dye = unk ? null : P.dye, xs = [], ys = []; if (dye) for (let l = 200; l <= 900; l += 2) { xs.push(l); ys.push(epsAt(dye, l) * P.path * P.c); } return { x: 'Wavelength', y: 'Absorbance A', xs, ys, xl: 'wavelength (nm)', yl: 'absorbance', mark: unk ? null : [P.lam, epsAt(P.dye, P.lam) * P.path * P.c] }; },
      post(run) {
        if (run.cols[0].name !== 'Concentration' || run.P.sample !== 'known') return;
        const A = run.cols.find((c) => c.name === 'Absorbance A'); if (!A) return;
        const F = S.fit('linear', run.cols[0].v, A.v);
        if (F && !F.err) { calib = { slope: F.q[1], intercept: F.q[0], lam: run.P.lam, path: run.P.path }; run.findings = [['Calibration (linear fit)', `A = ${fmtN(F.q[0], 4)} + ${fmtN(F.q[1], 6)} · c   (R² = ${F.r2.toFixed(5)})`], ['ε from slope / path', `${fmtN(F.q[1] / run.P.path, 5)} ± ${fmtN(F.se[1] / run.P.path, 3)} L/(mol·cm) at ${run.P.lam} nm`], ['Now usable for unknowns', `switch Sample to “Unknown sample” and keep λ = ${run.P.lam} nm, l = ${run.P.path} cm`]]; }
      },
      theory: `<h3>Beer–Lambert law</h3><div class="eq">A = −log₁₀(I/I₀) = ε l c</div>
        <p>ε = molar absorption coefficient (L·mol⁻¹·cm⁻¹), l = path length (cm), c = concentration (mol/L).</p>
        <h3>Instrument model</h3><div class="eq">T_measured = (10^(−A_true) + s) / (1 + s),   s = stray-light fraction</div>
        <p>Stray light makes calibration curves bend over at high absorbance (keep A below about 1.5). Noise (when on): σ = 0.0015 + 0.3 % of A.</p>
        <h3>Spectra</h3><p>Bands are modelled as Gaussians placed at literature maxima with literature ε at λ_max: KMnO₄ 526 nm (≈2 400), crystal violet 590 nm (≈87 000), methylene blue 664 nm (≈95 000), CuSO₄ 810 nm (≈12.5), K₂Cr₂O₇ 350 nm (≈3 150) and 257 nm, NADH 340 nm (6 220). Band widths are approximate.</p>
        <h3>Unknowns</h3><p>Record a calibration series (sweep the concentration) — its linear fit is stored and used to report the concentration of the unknown at the same wavelength and path length. “New unknown” picks another compound and concentration; identify it from its spectrum first.</p>`,
      protocols: [
        { t: 'Calibration curve of KMnO₄ at 526 nm', h: 'Sweep the standard from 20 to 400 µmol/L, three replicates each, and fit a line: slope/l = ε.', set: { sample: 'known', dye: 'kmno4', lam: 526, path: 1 }, sw: 'c', from: 2e-5, to: 4e-4, n: 10, rep: 3, y: 'Absorbance A', fit: 'linear' },
        { t: 'Absorption spectrum', h: 'Scan the wavelength from 300 to 800 nm in 2 nm steps. Fit a Gaussian around the main band to get λ_max.', set: { sample: 'known' }, sw: 'lam', from: 300, to: 800, n: 251, rep: 1, y: 'Absorbance A' },
        { t: 'Stray light and linearity', h: 'Set stray light to 1 % and sweep crystal violet up to 4 × 10⁻⁵ mol/L: the calibration bends above A ≈ 1.5.', set: { sample: 'known', dye: 'cv', lam: 590, stray: 1 }, sw: 'c', from: 1e-6, to: 4e-5, n: 15, rep: 2, y: 'Absorbance A' },
        { t: 'Identify the unknown', h: 'Choose “Unknown sample” and scan the spectrum to identify it; then calibrate with standards of that compound and measure the unknown at λ_max.', set: { sample: 'unknown' }, sw: 'lam', from: 250, to: 900, n: 326, rep: 1, y: 'Absorbance A' },
      ],
    },
    {
      id: 'gas', name: 'Real gases (van der Waals)', short: 'isotherms, compressibility factor, critical constants',
      params: [
        { k: 'gas', l: 'Gas', t: 'sel', o: Object.entries(GASES).map(([k, v]) => [k, v[0]]), v: 'co2' },
        { k: 'T', l: 'Temperature', t: 'range', v: 300, min: 100, max: 1000, step: 0.5, u: 'K' },
        { k: 'n', l: 'Amount of gas', t: 'num', v: 1, min: 0.001, max: 100, u: 'mol' },
        { k: 'V', l: 'Volume', t: 'range', v: 1, min: 0.05, max: 50, step: 0.01, u: 'L' },
      ],
      sweep: [{ k: 'V', l: 'Volume', u: 'L', from: 0.08, to: 2, n: 60, log: true }, { k: 'T', l: 'Temperature', u: 'K', from: 200, to: 600, n: 21 }],
      xname: { V: 'Volume', T: 'Temperature' },
      measure(P, noise) {
        const [, a, b] = GASES[P.gas];
        const p = vdw(P) * (1 + (noise ? 0.002 * randn() : 0)), pid = (P.n * Rb * P.T) / P.V;
        return [['Volume', P.V, 'L'], ['Temperature', P.T, 'K'], ['Pressure (van der Waals)', p, 'bar'], ['Pressure (ideal gas)', pid, 'bar'], ['Compressibility Z = PV/nRT', (p * P.V) / (P.n * Rb * P.T), ''], ['Molar volume', P.V / P.n, 'L/mol'],
          ['Critical temperature T_c', (8 * a) / (27 * Rb * b), 'K'], ['Critical pressure p_c', a / (27 * b * b), 'bar'], ['Critical molar volume', 3 * b, 'L/mol'], ['Reduced temperature T/T_c', P.T / ((8 * a) / (27 * Rb * b)), ''], ['Boyle temperature a/Rb', a / (Rb * b), 'K'], ['a', a, 'L²·bar/mol²'], ['b', b, 'L/mol']];
      },
      preview(P) {
        const xs = [], ys = [], v0 = Math.max(GASES[P.gas][2] * P.n * 1.15, 0.02), v1 = Math.max(P.V * 2, 2 * P.n);
        for (let i = 0; i <= 300; i++) { const v = v0 * Math.pow(v1 / v0, i / 300); xs.push(v); ys.push(vdw(Object.assign({}, P, { V: v }))); }
        return { x: 'Volume', y: 'Pressure (van der Waals)', xs, ys, xl: 'volume (L)', yl: 'pressure (bar)', mark: [P.V, vdw(P)], logx: true };
      },
      theory: `<h3>Van der Waals equation</h3><div class="eq">(p + a n²/V²)(V − n b) = n R T,   R = 0.083 144 6 L·bar/(mol·K)</div>
        <div class="eq">T_c = 8a / (27 R b),  p_c = a / (27 b²),  V_c = 3 b,   Boyle temperature T_B = a / (R b)</div>
        <div class="eq">Compressibility factor Z = pV / (nRT)   (Z = 1 for an ideal gas)</div>
        <p>Below T_c the van der Waals isotherm has a loop (unphysical region where liquid and vapour coexist; Maxwell construction not applied). Pressure gauge noise (when on): σ = 0.2 %.</p>
        <h3>Constants used (a in L²·bar/mol², b in L/mol)</h3><p>He 0.0346 / 0.0238 · H₂ 0.2476 / 0.02661 · N₂ 1.370 / 0.0387 · O₂ 1.382 / 0.03186 · Ar 1.355 / 0.03201 · CH₄ 2.283 / 0.04278 · CO₂ 3.640 / 0.04267 · NH₃ 4.225 / 0.0371 · H₂O 5.537 / 0.03049</p>`,
      protocols: [
        { t: 'CO₂ isotherm at 300 K', h: 'Sweep the volume of 1 mol CO₂ from 0.08 to 2 L (log steps). Compare van der Waals and ideal pressures and look at Z.', set: { gas: 'co2', T: 300, n: 1 }, sw: 'V', from: 0.08, to: 2, n: 60, rep: 1, y: 'Pressure (van der Waals)' },
        { t: 'Z against temperature (Boyle temperature)', h: 'Nitrogen at 0.2 L/mol: sweep T and plot Z — it crosses 1 near the Boyle temperature.', set: { gas: 'n2', V: 0.2, n: 1 }, sw: 'T', from: 150, to: 900, n: 26, rep: 1, y: 'Compressibility Z = PV/nRT' },
        { t: 'Pressure law at constant volume', h: 'Sweep T at fixed V and fit a line to p(T): the vdW gas is exactly linear in T, with slope nR/(V − nb).', set: { gas: 'co2', V: 1, n: 1 }, sw: 'T', from: 300, to: 600, n: 13, rep: 2, y: 'Pressure (van der Waals)', fit: 'linear' },
      ],
    },
  ];

  /* ---------------- state ---------------- */
  const st = { ins: INSTR[0], P: {}, noise: true, runs: [], active: null, view: { run: '', x: '', y: '', fit: 'none', logx: false, logy: false } };
  const exp = { sw: '', from: 0, to: 1, n: 10, rep: 1, log: false, notes: '' };
  INSTR.forEach((I) => { I.P = {}; I.params.forEach((p) => (I.P[p.k] = p.v)); if (I.onParam && I.params[0].t === 'sel') I.onParam(I.P, I.params[0].k); });

  /* ---------------- UI ---------------- */
  const main = $('#A');
  main.innerHTML = `<aside id="aleft"></aside><section class="stage"><canvas id="aplot"></canvas><div id="aread"></div></section><aside id="aright"></aside>`;
  const left = $('#aleft'), right = $('#aright'), cv = $('#aplot');
  function readouts(P, noise) { return st.ins.measure(P, noise).map(([n, v, u]) => ({ n, v, u })); }
  function fmtVal(r) { return r.u === 'text' ? r.v : isNum(r.v) ? fmtN(r.v, 6) + (r.u ? ' ' + r.u : '') : '—'; }
  function renderLeft() {
    const I = st.ins, P = I.P;
    let h = `<h3>Instrument</h3>` + INSTR.map((x) => `<button class="ins${x === I ? ' on' : ''}" data-ins="${x.id}">${esc(x.name)}<small>${esc(x.short)}</small></button>`).join('');
    h += `<h3>Settings</h3>`;
    for (const p of I.params) {
      const v = P[p.k];
      if (p.t === 'sel') h += `<label class="fld"><span>${esc(p.l)}</span><select data-p="${p.k}">${p.o.map(([k, n]) => `<option value="${k}"${String(k) === String(v) ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`;
      else if (p.t === 'range') h += `<label class="fld"><span>${esc(p.l)} <b>${fmtN(+v, 5)} ${p.u || ''}</b></span><input type="range" data-p="${p.k}" min="${p.min}" max="${p.max}" step="${p.step}" value="${v}"><input type="number" data-p="${p.k}" step="any" value="${v}"></label>`;
      else h += `<label class="fld"><span>${esc(p.l)}${p.u ? ' (' + p.u + ')' : ''}</span><input type="number" data-p="${p.k}" step="any" value="${v}"></label>`;
    }
    h += `<label style="margin-top:8px"><input type="checkbox" id="anoise"${st.noise ? ' checked' : ''}> Instrument noise (realistic scatter)</label>`;
    if (I.id === 'spectro') h += `<div class="btns"><button id="aunk">New unknown sample</button><button id="arev">Reveal unknown</button></div>`;
    left.innerHTML = h;
    left.querySelectorAll('[data-ins]').forEach((b) => (b.onclick = () => { st.ins = INSTR.find((x) => x.id === b.dataset.ins); st.view = { run: '', x: '', y: '', fit: 'none', logx: false, logy: false }; Object.assign(exp, defExp()); renderAll(); }));
    left.querySelectorAll('[data-p]').forEach((el) => el.addEventListener(el.type === 'range' ? 'input' : 'change', () => {
      const p = I.params.find((q) => q.k === el.dataset.p);
      let v = p.t === 'sel' ? (isNaN(+el.value) || el.value === '' ? el.value : +el.value) : parseFloat(el.value);
      if (p.t !== 'sel') { if (!isFinite(v)) return; v = Math.min(p.max, Math.max(p.min, v)); }
      P[p.k] = v;
      const re = I.onParam && I.onParam(P, p.k);
      if (re || el.type === 'number' || p.t === 'sel') renderLeft(); else { const b = el.parentElement.querySelector('b'); if (b) b.textContent = fmtN(+v, 5) + ' ' + (p.u || ''); const nb = el.parentElement.querySelector('input[type=number]'); if (nb) nb.value = v; }
      draw(); renderRead();
    }));
    $('#anoise').onchange = (e) => { st.noise = e.target.checked; renderRead(); };
    if ($('#aunk')) { $('#aunk').onclick = () => { newUnknown(); toastA('New unknown sample prepared'); renderRead(); draw(); }; $('#arev').onclick = () => toastA(`Unknown: ${DYES[UNK.dye].n}, c = ${fmtN(UNK.c, 4)} mol/L`, 6000); }
  }
  function toastA(m, ms) { try { const t = $('#toast'); if (t) { t.textContent = m; t.classList.add('show'); clearTimeout(toastA.t); toastA.t = setTimeout(() => t.classList.remove('show'), ms || 2600); return; } } catch (e) { /* ignore */ } }
  function renderRead() { $('#aread').innerHTML = readouts(st.ins.P, st.noise).map((r) => `<div title="${esc(r.n)}"><span>${esc(r.n)}</span><b>${esc(fmtVal(r))}</b></div>`).join(''); }
  function defExp() { const s = st.ins.sweep[0]; return { sw: s.k, from: s.from, to: s.to, n: s.n, rep: 1, log: !!s.log }; }
  Object.assign(exp, defExp());
  function renderRight() {
    const I = st.ins, runs = st.runs.filter((r) => r.ins === I.id), act = st.active;
    const opt = (v, t, sel) => `<option value="${esc(v)}"${String(v) === String(sel) ? ' selected' : ''}>${esc(t)}</option>`;
    let h = `<h3>Experiment</h3><p class="note">Sweep one variable; at each point the instrument is read “replicates” times (mean ± SD). Turn noise off for exact model values.</p>
      <label class="fld"><span>Vary</span><select id="asw">${I.sweep.map((s) => opt(s.k, `${s.l} (${s.u})`, exp.sw)).join('')}</select></label>
      <div class="r3"><label class="fld"><span>From</span><input type="number" id="afrom" step="any" value="${exp.from}"></label><label class="fld"><span>To</span><input type="number" id="ato" step="any" value="${exp.to}"></label><label class="fld"><span>Points</span><input type="number" id="an" step="1" value="${exp.n}"></label></div>
      <div class="r2"><label class="fld"><span>Replicates</span><input type="number" id="arep" step="1" min="1" value="${exp.rep}"></label><label style="align-self:end"><input type="checkbox" id="alog"${exp.log ? ' checked' : ''}> log spacing</label></div>
      <label class="fld"><span>Notes for the report</span><textarea id="anotes" rows="2" placeholder="Sample, aim, conditions…">${esc(exp.notes || '')}</textarea></label>
      <div class="btns">${act ? '<button class="stop" id="astop">Stop</button>' : '<button class="pri" id="arun">Run experiment</button>'}</div><div id="aprog"><i></i></div>
      <h3>Standard experiments</h3>${I.protocols.map((p, i) => `<div class="note"><b>${esc(p.t)}</b><br>${esc(p.h)} <a href="#" data-pr="${i}">Load</a></div>`).join('')}`;
    // data
    const run = runs.find((r) => String(r.id) === st.view.run) || runs[runs.length - 1];
    h += `<h3>Data</h3>`;
    if (!run) h += `<p class="note">No run yet. Results appear here with plots, fits, statistics and exports.</p>`;
    else {
      if (st.view.run !== String(run.id)) { st.view.run = String(run.id); st.view.x = run.x || run.cols[0].name; st.view.y = run.y || ''; st.view.fit = run.fit0 || 'none'; }
      const names = run.cols.map((c) => c.name);
      if (!names.includes(st.view.x)) st.view.x = names[0];
      if (!names.includes(st.view.y) || st.view.y === st.view.x) st.view.y = (run.cols.find((c) => c.name !== st.view.x && stats(c.v).max > stats(c.v).min) || run.cols[1] || run.cols[0]).name;
      const cols = (sel) => run.cols.map((c) => opt(c.name, S.colLabel(c), sel)).join('');
      h += `<div class="r2"><label class="fld"><span>Run</span><select id="arun2">${runs.slice().reverse().map((r) => opt(r.id, `Run ${r.id}: ${r.label}`, run.id)).join('')}</select></label><label class="fld"><span>Fit</span><select id="afit">${Object.entries(S.MODELS).map(([k, m]) => opt(k, m.label, st.view.fit)).join('')}</select></label></div>
        <div class="r2"><label class="fld"><span>x</span><select id="ax">${cols(st.view.x)}</select></label><label class="fld"><span>y</span><select id="ay">${cols(st.view.y)}</select></label></div>
        <label><input type="checkbox" id="alx"${st.view.logx ? ' checked' : ''}> log x</label><label><input type="checkbox" id="aly"${st.view.logy ? ' checked' : ''}> log y</label>
        <div id="afitres"></div>${run.findings ? `<div class="fitbox" style="border-left-color:var(--ac)">${run.findings.map(([k, v]) => `<div><b>${esc(k)}:</b> ${esc(v)}</div>`).join('')}</div>` : ''}
        <div class="btns"><button class="pri" id="apdf">PDF report</button><button id="acsv">CSV</button><button id="ajson">JSON</button></div>
        <h3>Statistics</h3><div class="tsc"><table class="dt"><tr><th>Quantity</th><th>Unit</th><th>N</th><th>Mean</th><th>SD</th><th>Min</th><th>Max</th></tr>${run.cols.map((c) => { const q = stats(c.v); return `<tr><td>${esc(c.name)}</td><td>${esc(c.unit)}</td><td>${q.n || 0}</td><td>${fmtN(q.mean)}</td><td>${fmtN(q.sd, 4)}</td><td>${fmtN(q.min)}</td><td>${fmtN(q.max)}</td></tr>`; }).join('')}</table></div>
        <h3>Data table <small class="note">${run.cols[0].v.length} rows</small></h3><div class="tsc"><table class="dt"><tr><th>#</th>${run.cols.map((c) => `<th>${esc(c.name)}${c.unit ? '<br><small>' + esc(c.unit) + '</small>' : ''}</th>${c.sd ? '<th>SD</th>' : ''}`).join('')}</tr>${run.cols[0].v.map((_, i) => `<tr><td>${i + 1}</td>${run.cols.map((c) => `<td>${fmtN(c.v[i])}</td>${c.sd ? `<td>${fmtN(c.sd[i], 3)}</td>` : ''}`).join('')}</tr>`).join('')}</table></div>`;
    }
    h += `<h3>Theory</h3><div class="note" style="color:var(--tx)">${I.theory}</div>`;
    right.innerHTML = h;
    const num = (id) => parseFloat($(id).value);
    const rd = () => { exp.sw = $('#asw').value; exp.from = num('#afrom'); exp.to = num('#ato'); exp.n = Math.max(2, Math.round(num('#an')) || 2); exp.rep = Math.max(1, Math.round(num('#arep')) || 1); exp.log = $('#alog').checked; exp.notes = $('#anotes').value; };
    $('#asw').onchange = () => { const s = I.sweep.find((q) => q.k === $('#asw').value); Object.assign(exp, { sw: s.k, from: s.from, to: s.to, n: s.n, log: !!s.log }); renderRight(); };
    ['#afrom', '#ato', '#an', '#arep', '#alog', '#anotes'].forEach((id) => $(id).addEventListener('change', rd));
    if ($('#arun')) $('#arun').onclick = () => { rd(); start(); };
    if ($('#astop')) $('#astop').onclick = () => finish(true);
    right.querySelectorAll('[data-pr]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); loadProto(I.protocols[+a.dataset.pr]); }));
    if (run) {
      const bind = (id, k, ev = 'change') => ($(id)[ev === 'change' ? 'onchange' : 'oninput'] = () => { st.view[k] = $(id).type === 'checkbox' ? $(id).checked : $(id).value; if (k === 'run') { st.view.x = ''; } renderRight(); draw(); });
      bind('#arun2', 'run'); bind('#afit', 'fit'); bind('#ax', 'x'); bind('#ay', 'y'); bind('#alx', 'logx'); bind('#aly', 'logy');
      const F = curFit(run);
      $('#afitres').innerHTML = F ? (F.err ? `<div class="fitbox">${esc(F.err)}</div>` : `<div class="fitbox"><b>${esc(F.label)}</b><table>${F.names.map((n, i) => `<tr><td>${esc(n)}</td><td>${fmtN(F.q[i], 6)}</td><td>± ${fmtN(F.se[i], 3)}</td></tr>`).join('')}${F.derived.map(([n, v, s]) => `<tr><td>${esc(n)}</td><td>${fmtN(v, 6)}</td><td>± ${fmtN(s, 3)}</td></tr>`).join('')}</table><small>R² = ${F.r2.toFixed(6)} · RMSE = ${fmtN(F.rmse, 4)} · n = ${F.n} · ± = 1 standard error</small></div>`) : '';
      $('#apdf').onclick = () => pdf(run);
      $('#acsv').onclick = () => S.download(new Blob([S.csv(run.cols, I.name + ' run ' + run.id)], { type: 'text/csv' }), `simple-mol-lab-${I.id}-run-${run.id}.csv`);
      $('#ajson').onclick = () => S.download(new Blob([JSON.stringify({ software: 'Simple Mol Lab', instrument: I.name, run: run.id, label: run.label, settings: run.P, sweep: run.exp, noise: run.noise, findings: run.findings, columns: run.cols }, null, 1)], { type: 'application/json' }), `simple-mol-lab-${I.id}-run-${run.id}.json`);
    }
  }
  function curFit(run) {
    if (st.view.fit === 'none') return null;
    const cx = run.cols.find((c) => c.name === st.view.x), cy = run.cols.find((c) => c.name === st.view.y);
    if (!cx || !cy) return null;
    const idx = cx.v.map((_, i) => i).filter((i) => isNum(cx.v[i]) && isNum(cy.v[i])).sort((i, j) => cx.v[i] - cx.v[j]);
    return S.fit(st.view.fit, idx.map((i) => cx.v[i]), idx.map((i) => cy.v[i]));
  }
  function loadProto(p) {
    const I = st.ins;
    if (p.set) for (const [k, v] of Object.entries(p.set)) { I.P[k] = v; if (I.onParam) I.onParam(I.P, k); }
    if (p.set) for (const [k, v] of Object.entries(p.set)) I.P[k] = v; // explicit values win over presets
    const s = I.sweep.find((q) => q.k === p.sw);
    Object.assign(exp, { sw: p.sw, from: p.from, to: p.to, n: p.n, rep: p.rep || 1, log: s ? !!s.log : false });
    st.pend = { x: p.x, y: p.y, fit: p.fit };
    renderAll(); toastA('Set-up loaded — press Run experiment');
  }

  /* ---------------- running ---------------- */
  function start() {
    const I = st.ins, s = I.sweep.find((q) => q.k === exp.sw);
    if (!(isNum(exp.from) && isNum(exp.to)) || exp.from === exp.to) { toastA('Set different start and end values'); return; }
    const vals = [];
    for (let i = 0; i < exp.n; i++) { const t = i / (exp.n - 1); vals.push(exp.log && exp.from > 0 && exp.to > 0 ? exp.from * Math.pow(exp.to / exp.from, t) : exp.from + (exp.to - exp.from) * t); }
    st.active = { I, s, vals, i: 0, rows: [], orig: I.P[s.k], started: new Date(), P0: Object.assign({}, I.P), noise: st.noise, exp: Object.assign({}, exp) };
    renderRight();
  }
  function tick() {
    const A = st.active; if (!A) return;
    const per = Math.max(1, Math.ceil(A.vals.length / 90)); // whole sweep in about 6 s
    for (let k = 0; k < per && A.i < A.vals.length; k++, A.i++) {
      const P = Object.assign({}, A.I.P, { [A.s.k]: A.vals[A.i] });
      const reps = [];
      for (let r = 0; r < A.exp.rep; r++) reps.push(A.I.measure(P, A.noise));
      A.rows.push(reps);
      A.I.P[A.s.k] = A.vals[A.i];
    }
    const bar = $('#aprog i'); if (bar) bar.style.width = (100 * A.i) / A.vals.length + '%';
    renderRead(); draw();
    if (A.i >= A.vals.length) finish(false);
  }
  function finish(stopped) {
    const A = st.active; if (!A) return; st.active = null;
    if (!A.rows.length) { renderRight(); return; }
    const first = A.rows[0][0], cols = [];
    const xName = (A.I.xname && A.I.xname[A.s.k]) || A.s.l;
    first.forEach(([n, , u], j) => {
      if (u === 'text') return;
      const v = A.rows.map((reps) => (A.exp.rep > 1 ? stats(reps.map((m) => m[j][1])).mean : reps[0][j][1]));
      const sd = A.exp.rep > 1 ? A.rows.map((reps) => stats(reps.map((m) => m[j][1])).sd) : null;
      cols.push({ name: n, unit: u, v, sd: sd && sd.some((x) => x > 0) ? sd : null });
    });
    // put the swept variable first
    const xi = cols.findIndex((c) => c.name === xName);
    if (xi > 0) cols.unshift(cols.splice(xi, 1)[0]);
    const keep = cols.filter((c, i) => i === 0 || stats(c.v).n);
    const run = { id: st.runs.length + 1, ins: A.I.id, label: `${A.s.l} ${fmtN(A.vals[0], 4)} → ${fmtN(A.vals[A.vals.length - 1], 4)}`, cols: keep, P: A.P0, exp: A.exp, noise: A.noise, started: A.started, finished: new Date(), stopped, shot: null };
    if (A.I.post) A.I.post(run);
    if (st.pend) { run.x = st.pend.x; run.y = st.pend.y; run.fit0 = st.pend.fit; st.pend = null; }
    st.runs.push(run);
    st.view.run = '';
    renderRight(); draw();
    run.shot = S.canvasJPEG(cv);
    toastA(`Run ${run.id} ${stopped ? 'stopped' : 'finished'}: ${keep[0].v.length} points — see Data`);
  }

  /* ---------------- drawing ---------------- */
  function draw() {
    const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), w = Math.max(100, r.width), h = Math.max(100, r.height);
    if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    const I = st.ins, pv = I.preview(I.P), runs = st.runs.filter((q) => q.ins === I.id);
    const run = (st.active && st.active.I === I) ? null : runs.find((q) => String(q.id) === st.view.run) || runs[runs.length - 1];
    const series = [];
    let xl = pv.xl, yl = pv.yl, F = null, logx = !!pv.logx, logy = false;
    // live points of a running sweep
    const A = st.active && st.active.I === I ? st.active : null;
    if (A) {
      const first = A.rows[0] && A.rows[0][0];
      if (first) {
        const jx = first.findIndex((q) => q[0] === pv.x), jy = first.findIndex((q) => q[0] === pv.y);
        if (jx >= 0 && jy >= 0) series.push({ x: A.rows.map((rr) => rr[0][jx][1]), y: A.rows.map((rr) => stats(rr.map((m) => m[jy][1])).mean), color: '#1f5fbf', name: 'running', line: false });
      }
      series.unshift({ x: pv.xs, y: pv.ys, color: '#adb5bd', name: 'model', line: true });
    } else if (run) {
      const cx = run.cols.find((c) => c.name === st.view.x), cy = run.cols.find((c) => c.name === st.view.y);
      if (cx && cy) {
        series.push({ x: cx.v, y: cy.v, sd: cy.sd, color: '#1f5fbf', name: 'Run ' + run.id, line: false });
        xl = S.colLabel(cx); yl = S.colLabel(cy); logx = st.view.logx; logy = st.view.logy;
        const f = curFit(run); if (f && !f.err) F = f;
        if (cx.name === pv.x && cy.name === pv.y && !logy) series.unshift({ x: pv.xs, y: pv.ys, color: '#adb5bd', name: 'model (current settings)', line: true });
      }
    } else series.push({ x: pv.xs, y: pv.ys, color: '#1f5fbf', name: 'model', line: true });
    if (pv.mark && !run && !A) series.push({ x: [pv.mark[0]], y: [pv.mark[1]], color: '#c92a2a', name: 'current setting', line: false });
    S.drawPlot(S.canvasPainter(g), 0, 0, w, h, series, xl, yl, F, logx, logy, 12);
    g.fillStyle = '#555'; g.font = '600 12px system-ui'; g.textAlign = 'right'; g.textBaseline = 'top';
    g.fillText(I.name + (run && !A ? ' — Run ' + run.id : A ? ' — measuring…' : ' — model at current settings'), w - 12, 6);
  }
  function pdf(run) {
    const I = INSTR.find((x) => x.id === run.ins);
    const p = I.params.map((q) => [q.l, q.k === run.exp.sw ? 'varied in the experiment (see above)' : q.t === 'sel' ? (q.o.find(([k]) => String(k) === String(run.P[q.k])) || [0, run.P[q.k]])[1] : fmtN(+run.P[q.k], 6) + (q.u ? ' ' + q.u : '')]);
    const F = curFit(run);
    const pages = S.report({
      kind: 'Analysis report', title: I.name + ' — Run ' + run.id, subtitle: I.short,
      info: [['Run', 'Run ' + run.id + (run.stopped ? ' (stopped early)' : '')], ['Experiment', `vary ${run.label} in ${run.cols[0].v.length} ${run.exp.log ? 'logarithmic' : 'linear'} steps, ${run.exp.rep} replicate(s) per point`], ['Instrument noise', run.noise ? 'on (see method)' : 'off (exact model values)'], ['Started', S.stamp(run.started)], ['Finished', S.stamp(run.finished)]],
      notes: run.exp.notes, images: [run.shot && Object.assign(run.shot, { caption: 'instrument display at the end of the run', maxH: 220 })],
      sections: [{ h: 'Settings', rows: p }].concat(run.findings ? [{ h: 'Results found in the data', rows: run.findings }] : []),
      cols: run.cols, x: st.view.x, y: st.view.y, fit: F && !F.err ? F : null, logx: st.view.logx, logy: st.view.logy, points: true, runName: 'Run ' + run.id,
      theory: S.htmlToBlocks(I.theory), file: 'simple-mol-lab-' + I.id + '-run-' + run.id, sourceNote: 'computed from the stated models with optional simulated instrument noise',
    });
    toastA('PDF report saved (' + pages + ' pages)');
  }
  function renderAll() { renderLeft(); renderRight(); renderRead(); draw(); }

  /* ---------------- tab switching ---------------- */
  document.querySelectorAll('nav button').forEach((b) => b.addEventListener('click', () => {
    const on = b.dataset.t === 'A';
    main.hidden = !on;
    const t = b.dataset.t, dp = $('#dp');
    if (dp && t !== 'B') dp.hidden = true; // the gas-lab data panel belongs to the builder tab
    if (t === 'B') { try { dpShow(); } catch (e) { /* ignore */ } }
    if (on) requestAnimationFrame(renderAll);
  }));
  window.addEventListener('resize', () => { if (!main.hidden) draw(); });
  let liveN = 0;
  setInterval(() => { if (!main.hidden) { if (st.active) tick(); else if (st.noise && ++liveN % 12 === 0) renderRead(); } }, 66);
  window.SMLanalysis = { st, INSTR, start, phOf, renderAll };
})();

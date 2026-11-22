'use strict';
/* Radioactive decay: Monte-Carlo atoms, real isotopes and decay chains, Bateman solution, Geiger counter */
PhysLab.define({
  id: 'decay',
  title: 'Radioactive Decay',
  subtitle: 'Monte-Carlo decay of real isotopes and decay chains (Mo-99 → Tc-99m, Sr-90 → Y-90, Rn-222 …) with Bateman solution and a Geiger counter.',
  color: '#1f5fbf',
  cat: 'Quantum & Modern',
  tags: ['Nuclear', 'Half-life', 'Monte Carlo', 'Bateman', 'Poisson'],
  hint: 'Pick an isotope or chain · every square is one nucleus · the plot compares the random simulation with the exact solution',
  howto: [
    'Each nucleus decays at random with probability λ·dt per time step. The plot shows the simulated numbers (solid) and the Bateman solution (dashed).',
    'Time is shown in the natural unit of the chosen isotope (years, days, hours, minutes). The playback speed slider sets how many real seconds one parent half-life takes.',
    'The <b>Geiger counter</b> counts decays with a chosen efficiency plus background, in fixed counting intervals — exactly like a lab measurement, including Poisson noise.',
    'Fit an exponential to “Parent N₁” (or to the count rate) against “Elapsed time” in the Data tab to measure the half-life.',
  ],
  theory: `
  <h3>Decay law</h3>
  <div class="eq">dN/dt = −λN,   N(t) = N₀ e^(−λt),   T½ = ln 2 / λ,   τ = 1/λ</div>
  <div class="eq">Activity A = λN   (1 Bq = 1 decay per second)</div>
  <h3>Decay chains (Bateman equations)</h3>
  <div class="eq">dN₁/dt = −λ₁N₁,   dN₂/dt = λ₁N₁ − λ₂N₂,   dN₃/dt = λ₂N₂ − λ₃N₃ …</div>
  <div class="eq">N_n(t) = N₁(0) · (∏_{i&lt;n} λ_i) · Σ_i e^(−λ_i t) / ∏_{j≠i} (λ_j − λ_i)</div>
  <p><b>Transient equilibrium</b> (T½ parent somewhat longer than daughter, e.g. Mo-99/Tc-99m): the daughter activity overtakes and then follows the parent with ratio λ₂/(λ₂ − λ₁). <b>Secular equilibrium</b> (parent much longer lived, e.g. Sr-90/Y-90): activities become equal.</p>
  <h3>Counting statistics</h3>
  <p>Decays are independent, so counts in a fixed interval follow a Poisson distribution with standard deviation √N. The Monte-Carlo sample therefore scatters around the exact curve by about √N.</p>
  <h3>Data used</h3>
  <table><tr><th>Nuclide</th><th>T½</th><th>Decay</th></tr>
  <tr><td>C-14</td><td>5 730 a</td><td>β⁻ → N-14</td></tr><tr><td>I-131</td><td>8.0252 d</td><td>β⁻ → Xe-131</td></tr>
  <tr><td>Tc-99m</td><td>6.0067 h</td><td>IT → Tc-99</td></tr><tr><td>Mo-99</td><td>65.94 h</td><td>β⁻ → Tc-99m</td></tr>
  <tr><td>Sr-90</td><td>28.79 a</td><td>β⁻ → Y-90 (64.0 h) → Zr-90</td></tr><tr><td>Rn-222</td><td>3.8235 d</td><td>α → Po-218 (3.098 min) → Pb-214 (26.8 min)</td></tr>
  <tr><td>Ba-137m</td><td>2.552 min</td><td>IT → Ba-137</td></tr><tr><td>Co-60</td><td>5.2714 a</td><td>β⁻ → Ni-60</td></tr></table>`,
  experiment: { duration: 40, interval: 0.1 },
  protocols: [
    { t: 'Measure the half-life of I-131', h: 'Record 40 s (5 half-lives at the default speed). Fit an exponential to Parent N₁ against Elapsed time; the fit returns T½ in days.', setup: { set: { Nuclide: 'I131' }, mode: 'time', duration: 40, interval: 0.1, reset: true, x: 'Elapsed time', y: 'Parent N₁', fit: 'exp' } },
    { t: 'Half-life from Geiger counts (with background)', h: 'Ba-137m, efficiency 20 %, background on. Fit “exponential + offset” to the count rate: the offset is the background.', setup: { set: { Nuclide: 'Ba137m', 'Detector efficiency': 20, 'Background rate': 30 }, mode: 'time', duration: 50, interval: 0.25, reset: true, x: 'Elapsed time', y: 'Count rate', fit: 'expoff' } },
    { t: 'Technetium generator (transient equilibrium)', h: 'Mo-99 → Tc-99m: record and plot the daughter activity A₂; it rises, overtakes the parent and then decays with the parent half-life.', setup: { set: { Nuclide: 'Mo99' }, mode: 'time', duration: 60, interval: 0.2, reset: true, x: 'Elapsed time', y: 'Daughter activity A₂' } },
    { t: 'Statistical scatter vs sample size', h: 'Sweep the number of nuclei and record the deviation from the exact solution at a fixed time: it grows like √N (power-law exponent ½).', setup: { set: { Nuclide: 'I131' }, mode: 'sweep', param: 'Number of nuclei N₀', from: 100, to: 20000, points: 10, logSpace: true, resetEach: true, settle: 8, measure: 0.1, stat: 'final', y: '|N₁ − theory|', fit: 'power' } },
  ],

  create(env) {
    const { ui } = env;
    const LN2 = Math.LN2;
    // half-lives in seconds
    const Y = 365.25 * 86400, D = 86400, Hh = 3600, MIN = 60;
    const NUC = {
      I131: { name: 'I-131', chain: [['I-131', 8.0252 * D], ['Xe-131', 0]], unit: ['d', D] },
      C14: { name: 'C-14', chain: [['C-14', 5730 * Y], ['N-14', 0]], unit: ['a', Y] },
      Tc99m: { name: 'Tc-99m', chain: [['Tc-99m', 6.0067 * Hh], ['Tc-99', 0]], unit: ['h', Hh] },
      Co60: { name: 'Co-60', chain: [['Co-60', 5.2714 * Y], ['Ni-60', 0]], unit: ['a', Y] },
      Ba137m: { name: 'Ba-137m', chain: [['Ba-137m', 2.552 * MIN], ['Ba-137', 0]], unit: ['min', MIN] },
      Mo99: { name: 'Mo-99 → Tc-99m → Tc-99', chain: [['Mo-99', 65.94 * Hh], ['Tc-99m', 6.0067 * Hh], ['Tc-99', 0]], unit: ['h', Hh] },
      Sr90: { name: 'Sr-90 → Y-90 → Zr-90', chain: [['Sr-90', 28.79 * Y], ['Y-90', 64.0 * Hh], ['Zr-90', 0]], unit: ['a', Y] },
      Rn222: { name: 'Rn-222 → Po-218 → Pb-214 → …', chain: [['Rn-222', 3.8235 * D], ['Po-218', 3.098 * MIN], ['Pb-214', 26.8 * MIN], ['later products', 0]], unit: ['d', D] },
      custom: { name: 'Custom', chain: [['parent', 10], ['daughter', 0]], unit: ['s', 1] },
    };
    const S = { nuc: 'I131', N0: 5000, play: 8, eff: 100, bkg: 0, bin: 1, customT: 10, logy: false };
    const COL = ['#4dabf7', '#ff922b', '#69db7c', '#adb5bd'];
    let atoms, counts, t = 0, nuc, lam, decays1 = 0, decays2 = 0, binAcc = 0, binN = 0, binDecays = 0, lastRate = NaN, lastRateErr = NaN;
    const hist = []; // {t, n:[...], rate}
    let histT = 0;

    function setup() {
      nuc = NUC[S.nuc];
      if (S.nuc === 'custom') nuc.chain[0][1] = S.customT;
      lam = nuc.chain.map(([, T]) => (T > 0 ? LN2 / T : 0));
      const N = Math.round(S.N0);
      atoms = new Uint8Array(N);
      counts = new Array(nuc.chain.length).fill(0); counts[0] = N;
      t = 0; decays1 = 0; decays2 = 0; binAcc = 0; binN = 0; binDecays = 0; lastRate = NaN; lastRateErr = NaN; hist.length = 0; histT = 0;
      record();
    }
    const T1 = () => nuc.chain[0][1];
    const scale = () => T1() / S.play; // physical seconds per real second
    function poisson(m) {
      if (m <= 0) return 0;
      if (m > 50) return Math.max(0, Math.round(m + Math.sqrt(m) * U.randn()));
      let L = Math.exp(-m), k = 0, p = 1;
      do { k++; p *= Math.random(); } while (p > L);
      return k - 1;
    }
    function bateman(n, tt) {
      // number of species n (0-based) with only species 0 present at t=0
      const N0 = Math.round(S.N0);
      if (n === 0) return N0 * Math.exp(-lam[0] * tt);
      if (lam[n] === 0) { let s = N0; for (let k = 0; k < n; k++) s -= bateman(k, tt); return s; }
      let prod = 1; for (let i = 0; i < n; i++) prod *= lam[i];
      let sum = 0;
      for (let i = 0; i <= n; i++) { let den = 1; for (let j = 0; j <= n; j++) if (j !== i) den *= lam[j] - lam[i]; sum += Math.exp(-lam[i] * tt) / den; }
      return N0 * prod * sum;
    }
    function record() { hist.push({ t, n: counts.slice(), rate: lastRate }); if (hist.length > 1500) hist.splice(0, hist.length - 1500); }
    function advance(dtp) {
      // dtp: physical seconds. Sub-step so that the decay probability per step of the fastest
      // unstable species still present stays small (short-lived daughters need short steps).
      let lmax = lam[0];
      for (let k = 1; k < lam.length; k++) if (lam[k] > lmax && counts[k] > 0) lmax = lam[k];
      if (lam[1] > lmax && t > 0) lmax = lam[1];
      const n = Math.min(400, Math.max(1, Math.ceil((dtp * lmax) / 0.05))), h = dtp / n;
      const p = lam.map((l) => 1 - Math.exp(-l * h));
      for (let s = 0; s < n; s++) {
        let d1 = 0, d2 = 0;
        for (let i = 0; i < atoms.length; i++) {
          const sp = atoms[i];
          if (lam[sp] === 0) continue;
          if (Math.random() < p[sp]) {
            counts[sp]--; counts[sp + 1]++; atoms[i] = sp + 1;
            if (sp === 0) d1++; else if (sp === 1) d2++;
          }
        }
        decays1 += d1; decays2 += d2;
        binDecays += d1 + d2;
        t += h;
        binAcc += h;
        const binP = S.bin * nuc.unit[1];
        if (binAcc >= binP) {
          const c = poisson((binDecays * S.eff) / 100) + poisson(S.bkg * S.bin);
          lastRate = c / S.bin; lastRateErr = Math.sqrt(c) / S.bin; binN = c;
          binAcc -= binP; binDecays = 0;
        }
      }
    }

    ui.section('Sample');
    ui.select('Nuclide', Object.entries(NUC).map(([k, v]) => [k, v.name]), S.nuc, (v) => { S.nuc = v; setup(); });
    ui.slider('Number of nuclei N₀', { min: 10, max: 20000, step: 1, value: S.N0, log: true, fmt: (v) => Math.round(v) + '', onInput: (v) => (S.N0 = v), onChange: setup });
    ui.slider('Custom half-life', { min: 1, max: 1000, value: S.customT, log: true, fmt: (v) => v.toPrecision(3) + ' s', onInput: (v) => (S.customT = v), onChange: () => S.nuc === 'custom' && setup() });
    ui.slider('Playback: real seconds per half-life', { min: 1, max: 60, step: 0.5, value: S.play, fmt: (v) => v.toFixed(1) + ' s', onInput: (v) => (S.play = v) });
    ui.section('Geiger counter');
    ui.slider('Detector efficiency', { min: 1, max: 100, step: 1, value: S.eff, fmt: (v) => v + ' %', onInput: (v) => (S.eff = v) });
    ui.slider('Background rate', { min: 0, max: 500, step: 1, value: S.bkg, fmt: (v) => v + ' counts per unit time', onInput: (v) => (S.bkg = v) });
    ui.slider('Counting interval', { min: 0.05, max: 5, step: 0.05, value: S.bin, fmt: (v) => v.toFixed(2) + ' time units', onInput: (v) => (S.bin = v) });
    ui.section('Display');
    ui.toggle('Logarithmic N axis', S.logy, (v) => (S.logy = v));
    ui.buttons([{ label: 'Restart sample', primary: true, onClick: setup }]);
    setup();

    return {
      reset: setup,
      step(dt) {
        advance(dt * scale());
        histT += dt;
        if (histT >= 0.05) { histT = 0; record(); }
      },
      draw(ctx) {
        const W = env.W, H = env.H;
        ctx.fillStyle = '#111214'; ctx.fillRect(0, 0, W, H);
        const wide = W > 760;
        const gw = wide ? Math.min(W * 0.38, H - 20) : W - 16, gh = wide ? gw : Math.min(H * 0.34, W * 0.6);
        // nucleus grid (first 2500 atoms)
        const show = Math.min(atoms.length, 2500), cols = Math.ceil(Math.sqrt(show * (gw / gh))), rows = Math.ceil(show / cols);
        const cs = Math.min(gw / cols, gh / rows), ox = 8, oy = 8;
        for (let i = 0; i < show; i++) { ctx.fillStyle = COL[Math.min(atoms[i], 3)]; ctx.fillRect(ox + (i % cols) * cs, oy + Math.floor(i / cols) * cs, Math.max(1, cs - (cs > 4 ? 1 : 0)), Math.max(1, cs - (cs > 4 ? 1 : 0))); }
        let ly = oy + rows * cs + 14;
        nuc.chain.forEach(([nm], k) => { if (!wide && k > 0 && ly > H) return; ctx.fillStyle = COL[Math.min(k, 3)]; ctx.fillRect(ox, ly - 5, 10, 10); U.label(ctx, ox + 16, ly, `${nm}${nuc.chain[k][1] ? ' (T½ = ' + U.fmt(nuc.chain[k][1] / nuc.unit[1], 4) + ' ' + nuc.unit[0] + ')' : ' (stable)'}: ${counts[k]}`, '#d4d7dc'); ly += 16; });
        if (atoms.length > show) U.label(ctx, ox, ly, `grid shows ${show} of ${atoms.length} nuclei`, '#888');
        // plot N(t)
        const px = wide ? gw + 20 : 4, py = wide ? 4 : oy + gh + 70, pw = W - px - 4, ph = (H - py - 6) * 0.62;
        const tu = nuc.unit[1], tmax = Math.max(5 * T1(), t * 1.05) / tu;
        const N0 = Math.round(S.N0);
        const F = U.plot(ctx, px, py, pw, ph, { x0: 0, x1: tmax, y0: S.logy ? 0.5 : 0, y1: N0 * 1.05, logy: S.logy, xl: `elapsed time (${nuc.unit[0]})`, yl: 'number of nuclei', title: 'Simulation (solid) vs Bateman solution (dashed)' });
        F.clip();
        const xsT = [], fine = 200;
        for (let i = 0; i <= fine; i++) xsT.push((tmax * i) / fine);
        nuc.chain.forEach((c, k) => {
          U.curve(ctx, F, xsT, xsT.map((x) => bateman(k, x * tu)), COL[Math.min(k, 3)], 1.2, [5, 3]);
          U.curve(ctx, F, hist.map((h) => h.t / tu), hist.map((h) => h.n[k]), COL[Math.min(k, 3)], 2);
        });
        ctx.restore();
        // count rate plot
        const ry = py + ph + 6, rh = H - ry - 6;
        if (rh > 70) {
          const rs = hist.filter((h) => isFinite(h.rate));
          let rmax = 1; for (const h of rs) rmax = Math.max(rmax, h.rate);
          const F2 = U.plot(ctx, px, ry, pw, rh, { x0: 0, x1: tmax, y0: 0, y1: rmax * 1.1, xl: `elapsed time (${nuc.unit[0]})`, yl: `counts / ${nuc.unit[0]}`, title: `Geiger counter: ${S.eff} % efficiency, background ${S.bkg} / ${nuc.unit[0]}` });
          F2.clip();
          ctx.fillStyle = '#ffd43b';
          for (const h of rs) { ctx.beginPath(); ctx.arc(F2.sx(h.t / tu), F2.sy(h.rate), 2, 0, U.TAU); ctx.fill(); }
          ctx.restore();
        }
      },
      readouts() {
        const tu = nuc.unit[1], un = nuc.unit[0];
        const out = [
          ['Elapsed time', (t / tu).toPrecision(6) + ' ' + un], ['t / T½ (parent)', (t / T1()).toFixed(4)],
          ['Parent N₁', counts[0]], ['Theory N₁', bateman(0, t).toFixed(2)], ['|N₁ − theory|', Math.abs(counts[0] - bateman(0, t)).toFixed(2)],
          ['Remaining fraction', ((counts[0] / Math.max(1, atoms.length)) * 100).toFixed(3) + ' %'],
          ['Parent activity A₁', (lam[0] * counts[0] * tu).toPrecision(5) + ' /' + un],
        ];
        if (nuc.chain.length > 2 || lam[1] > 0) {
          out.push(['Daughter N₂', counts[1]], ['Theory N₂', bateman(1, t).toFixed(2)], ['Daughter activity A₂', (lam[1] * counts[1] * tu).toPrecision(5) + ' /' + un]);
          if (lam[1] > 0) out.push(['A₂ / A₁', counts[0] ? ((lam[1] * counts[1]) / (lam[0] * counts[0])).toFixed(4) : '—']);
        } else out.push(['Daughter N₂', counts[1]]);
        if (nuc.chain.length > 2) out.push(['Third N₃', counts[2]]);
        if (nuc.chain.length > 3) out.push(['Later products', counts[3]]);
        out.push(['Count rate', isFinite(lastRate) ? lastRate.toPrecision(5) + ' /' + un : '—'], ['Count rate ±√N', isFinite(lastRateErr) ? lastRateErr.toPrecision(3) + ' /' + un : '—'], ['Counts in last interval', binN]);
        out.push(['Half-life T½', U.fmt(T1() / tu, 5) + ' ' + un], ['Mean life τ', U.fmt(T1() / LN2 / tu, 5) + ' ' + un], ['Decay constant λ', U.fmt(lam[0] * tu, 5) + ' /' + un]);
        return out;
      },
    };
  },
});

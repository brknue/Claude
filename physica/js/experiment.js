'use strict';
/* ==========================================================================
   PHYSICA experiments & data
   - Experiment tab: time-series runs and parameter sweeps, instrument noise,
     suggested protocols, reproducible links
   - Data tab: any column vs any column, log axes, curve fits with standard
     errors and R², statistics, full data table, run comparison
   - Exports: PDF report (pdf.js), CSV, JSON
   ========================================================================== */
(function () {
  const P = window.PhysLab, I = P.internal;
  const { app, reg, el, toast, escHTML: esc } = I;
  const $ = (s) => document.querySelector(s);

  /* ---------------- helpers ---------------- */
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  function fmtN(v, sig = 6) {
    if (!isNum(v)) return '—';
    if (v === 0) return '0';
    const a = Math.abs(v);
    if (a >= 1e6 || a < 1e-3) return v.toExponential(Math.max(1, sig - 2)).replace('e+', 'e');
    return String(+v.toPrecision(sig));
  }
  const unitOf = (c) => (c.unit ? ` (${c.unit})` : '');
  const colLabel = (c) => c.name + unitOf(c);
  function download(blob, name) {
    const a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const stamp = (d) => { const p = (v) => String(v).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };
  function stats(arr) {
    let n = 0, s = 0, lo = Infinity, hi = -Infinity;
    for (const v of arr) if (isNum(v)) { n++; s += v; if (v < lo) lo = v; if (v > hi) hi = v; }
    if (!n) return { n: 0 };
    const mean = s / n;
    let ss = 0;
    for (const v of arr) if (isNum(v)) ss += (v - mean) * (v - mean);
    let sd = n > 1 ? Math.sqrt(ss / (n - 1)) : 0;
    if (sd < 1e-12 * Math.max(Math.abs(mean), Math.abs(lo), Math.abs(hi))) sd = 0; // rounding noise of a constant column
    return { n, mean, sd, sem: sd / Math.sqrt(n), min: lo, max: hi };
  }
  const liveParams = () => reg.params.filter((p) => document.contains(p.el));
  const liveActions = () => reg.actions.filter((a) => document.contains(a.el));

  /* ---------------- linear algebra & fitting ---------------- */
  function solveLSQ(rows, y) {
    const p = rows[0].length, A = Array.from({ length: p }, () => new Float64Array(p)), b = new Float64Array(p);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      for (let j = 0; j < p; j++) { b[j] += r[j] * y[i]; for (let k = 0; k < p; k++) A[j][k] += r[j] * r[k]; }
    }
    // invert A (Gauss–Jordan) so we get both beta and the covariance
    const M = A.map((r, i) => { const o = new Float64Array(2 * p); o.set(r); o[p + i] = 1; return o; });
    for (let c = 0; c < p; c++) {
      let piv = c;
      for (let r = c + 1; r < p; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      if (Math.abs(M[piv][c]) < 1e-300) return null;
      [M[c], M[piv]] = [M[piv], M[c]];
      const d = M[c][c];
      for (let k = 0; k < 2 * p; k++) M[c][k] /= d;
      for (let r = 0; r < p; r++) if (r !== c) { const f = M[r][c]; if (f) for (let k = 0; k < 2 * p; k++) M[r][k] -= f * M[c][k]; }
    }
    const inv = M.map((r) => r.slice(p));
    const beta = inv.map((r) => r.reduce((s, v, k) => s + v * b[k], 0));
    return { beta, inv };
  }
  const MODELS = {
    none: { label: 'No fit' },
    linear: { label: 'Linear: y = a + b·x', names: ['a', 'b'], basis: (x) => [1, x], f: (q, x) => q[0] + q[1] * x },
    prop: { label: 'Proportional: y = b·x', names: ['b'], basis: (x) => [x], f: (q, x) => q[0] * x },
    quad: { label: 'Quadratic: y = a + b·x + c·x²', names: ['a', 'b', 'c'], basis: (x) => [1, x, x * x], f: (q, x) => q[0] + q[1] * x + q[2] * x * x },
    cubic: { label: 'Cubic: y = a + b·x + c·x² + d·x³', names: ['a', 'b', 'c', 'd'], basis: (x) => [1, x, x * x, x * x * x], f: (q, x) => q[0] + q[1] * x + q[2] * x * x + q[3] * x * x * x },
    exp: { label: 'Exponential: y = A·e^(k·x)', names: ['A', 'k'], log: 'y', f: (q, x) => q[0] * Math.exp(q[1] * x) },
    power: { label: 'Power law: y = A·x^n', names: ['A', 'n'], log: 'xy', f: (q, x) => q[0] * Math.pow(x, q[1]) },
    logx: { label: 'Logarithmic: y = a + b·ln x', names: ['a', 'b'], basis: (x) => [1, Math.log(x)], needPosX: true, f: (q, x) => q[0] + q[1] * Math.log(x) },
    sine: { label: 'Sinusoid: y = c + A·sin(2π f x + φ)', names: ['c', 'A', 'f', 'φ'], f: (q, x) => q[0] + q[1] * Math.sin(2 * Math.PI * q[2] * x + q[3]) },
    gauss: { label: 'Gaussian: y = c + A·exp(−(x−μ)²/2σ²)', names: ['c', 'A', 'μ', 'σ'], f: (q, x) => q[0] + q[1] * Math.exp(-((x - q[2]) ** 2) / (2 * q[3] * q[3])) },
    dsine: { label: 'Damped sinusoid: y = c + A·e^(−γx)·sin(2π f x + φ)', names: ['c', 'A', 'γ', 'f', 'φ'], f: (q, x) => q[0] + q[1] * Math.exp(-q[2] * x) * Math.sin(2 * Math.PI * q[3] * x + q[4]) },
    expoff: { label: 'Exponential + offset: y = c + A·e^(k·x)', names: ['c', 'A', 'k'], f: (q, x) => q[0] + q[1] * Math.exp(q[2] * x) },
  };
  function fitSine(xs, ys) {
    // scan frequencies, solve the linear problem at each, refine the best by golden-section search
    const n = xs.length, span = xs[n - 1] - xs[0];
    if (!(span > 0)) return null;
    const sse = (f) => {
      const w = 2 * Math.PI * f, r = solveLSQ(xs.map((x) => [1, Math.sin(w * x), Math.cos(w * x)]), ys);
      if (!r) return { e: Infinity };
      let e = 0;
      for (let i = 0; i < n; i++) { const d = ys[i] - (r.beta[0] + r.beta[1] * Math.sin(w * xs[i]) + r.beta[2] * Math.cos(w * xs[i])); e += d * d; }
      return { e, r };
    };
    const fmin = 0.5 / span, fmax = Math.max(fmin * 2, (n / span) / 2.2);
    let best = fmin, be = Infinity;
    const N = 400;
    for (let i = 0; i <= N; i++) { const f = fmin * Math.pow(fmax / fmin, i / N), e = sse(f).e; if (e < be) { be = e; best = f; } }
    let a = best / Math.pow(fmax / fmin, 1.5 / N), b = best * Math.pow(fmax / fmin, 1.5 / N);
    const g = 0.618034;
    for (let k = 0; k < 60; k++) { const c = b - g * (b - a), d = a + g * (b - a); if (sse(c).e < sse(d).e) b = d; else a = c; }
    const f = (a + b) / 2, { r } = sse(f);
    if (!r) return null;
    const [c0, s, co] = r.beta, A = Math.hypot(s, co), phi = Math.atan2(co, s);
    // uncertainties: numerical Jacobian of the 4-parameter model at the optimum
    const q = [c0, A, f, phi];
    return { q, jac: true };
  }
  function fitGauss(xs, ys) {
    let lo = Infinity, hi = -Infinity, imax = 0;
    ys.forEach((y, i) => { if (y < lo) lo = y; if (y > hi) { hi = y; imax = i; } });
    let q = [lo, hi - lo, xs[imax], (xs[xs.length - 1] - xs[0]) / 6 || 1];
    // a few Gauss–Newton iterations with step damping
    const f = MODELS.gauss.f;
    for (let it = 0; it < 60; it++) {
      const J = xs.map((x) => { const e = Math.exp(-((x - q[2]) ** 2) / (2 * q[3] * q[3])); return [1, e, q[1] * e * (x - q[2]) / (q[3] * q[3]), q[1] * e * (x - q[2]) ** 2 / (q[3] ** 3)]; });
      const res = ys.map((y, i) => y - f(q, xs[i]));
      const s = solveLSQ(J, res);
      if (!s) break;
      let lam = 1, e0 = res.reduce((a, v) => a + v * v, 0), moved = false;
      while (lam > 1e-4) {
        const qn = q.map((v, k) => v + lam * s.beta[k]);
        const e1 = ys.reduce((a, y, i) => a + (y - f(qn, xs[i])) ** 2, 0);
        if (e1 < e0 && isFinite(e1)) { q = qn; moved = true; break; }
        lam /= 2;
      }
      if (!moved) break;
    }
    q[3] = Math.abs(q[3]);
    return { q, jac: true };
  }
  function gaussNewton(f, q, xs, ys, iters = 80) {
    const sse = (qq) => { let e = 0; for (let i = 0; i < xs.length; i++) { const d = ys[i] - f(qq, xs[i]); e += d * d; } return e; };
    let e0 = sse(q);
    for (let it = 0; it < iters; it++) {
      const J = xs.map((x) => q.map((v, k) => { const h = Math.abs(v) * 1e-6 + 1e-9, qp = q.slice(); qp[k] += h; return (f(qp, x) - f(q, x)) / h; }));
      const s = solveLSQ(J, ys.map((y, i) => y - f(q, xs[i])));
      if (!s) break;
      let lam = 1, moved = false;
      while (lam > 1e-5) {
        const qn = q.map((v, k) => v + lam * s.beta[k]), e1 = sse(qn);
        if (isFinite(e1) && e1 < e0) { const done = e0 - e1 < 1e-12 * (1 + e0); q = qn; e0 = e1; moved = !done; break; }
        lam /= 2;
      }
      if (!moved) break;
    }
    return q;
  }
  /** fits model m to (xs, ys); returns { q, se, r2, rmse, n, derived } */
  function fit(mk, xs0, ys0) {
    const m = MODELS[mk];
    if (!m || mk === 'none') return null;
    const xs = [], ys = [];
    for (let i = 0; i < xs0.length; i++) {
      const x = xs0[i], y = ys0[i];
      if (!isNum(x) || !isNum(y)) continue;
      if ((m.log === 'xy' || m.needPosX) && x <= 0) continue;
      if (m.log && y <= 0) continue;
      xs.push(x); ys.push(y);
    }
    const np = m.names.length;
    if (xs.length < np + 1) return { err: `Need at least ${np + 1} usable points${m.log ? ' (with y > 0' + (m.log === 'xy' ? ' and x > 0' : '') + ')' : ''}.` };
    let q, se;
    if (m.basis) {
      const r = solveLSQ(xs.map(m.basis), ys);
      if (!r) return { err: 'The fit is singular (are all x values the same?).' };
      q = r.beta;
      const sse = ys.reduce((a, y, i) => a + (y - m.f(q, xs[i])) ** 2, 0), s2 = sse / Math.max(1, xs.length - np);
      se = r.inv.map((row, i) => Math.sqrt(Math.max(0, row[i] * s2)));
    } else if (m.log) {
      // start from the log-linearised fit, then minimise the squared residuals in y itself (like curve_fit)
      const X = m.log === 'xy' ? xs.map(Math.log) : xs, Y = ys.map(Math.log);
      const r = solveLSQ(X.map((x) => [1, x]), Y);
      if (!r) return { err: 'The fit is singular.' };
      q = gaussNewton(m.f, [Math.exp(r.beta[0]), r.beta[1]], xs, ys);
      const J = xs.map((x) => q.map((v, k) => { const h = Math.abs(v) * 1e-6 + 1e-12, qp = q.slice(); qp[k] += h; return (m.f(qp, x) - m.f(q, x)) / h; }));
      const rj = solveLSQ(J, ys.map(() => 0));
      const sse = ys.reduce((a, y, i) => a + (y - m.f(q, xs[i])) ** 2, 0), s2 = sse / Math.max(1, xs.length - np);
      se = rj ? rj.inv.map((row, i) => Math.sqrt(Math.max(0, row[i] * s2))) : q.map(() => NaN);
    } else {
      let res;
      if (mk === 'sine') res = fitSine(xs, ys);
      else if (mk === 'gauss') res = fitGauss(xs, ys);
      else if (mk === 'dsine') {
        const s0 = fitSine(xs, ys);
        if (s0) {
          // seed the decay rate from the ratio of amplitudes in the first and last thirds
          const n3 = Math.max(2, Math.floor(xs.length / 3)), amp = (a, b) => { let lo = Infinity, hi = -Infinity; for (let i = a; i < b; i++) { lo = Math.min(lo, ys[i]); hi = Math.max(hi, ys[i]); } return (hi - lo) / 2; };
          const a1 = amp(0, n3), a2 = amp(xs.length - n3, xs.length), dt = (xs[xs.length - 1] - xs[0]) * 2 / 3;
          const g0 = a1 > 0 && a2 > 0 && dt > 0 ? Math.max(0, Math.log(a1 / a2) / dt) : 0;
          const x0 = xs[0], A0 = s0.q[1] * Math.exp(g0 * (xs.length ? (xs[0] + xs[xs.length - 1]) / 2 - x0 : 0));
          res = { q: gaussNewton(MODELS.dsine.f, [s0.q[0], A0 * Math.exp(g0 * x0), g0, s0.q[2], s0.q[3]], xs, ys) };
        }
      } else if (mk === 'expoff') {
        // seed: offset from the last point, then a log-linear fit
        const c0 = ys[ys.length - 1] + (ys[ys.length - 1] - ys[0]) * 0.05, Y = ys.map((y) => Math.log(Math.abs(y - c0) || 1e-12));
        const r0 = solveLSQ(xs.map((x) => [1, x]), Y);
        const sgn = Math.sign(ys[0] - c0) || 1;
        res = r0 ? { q: gaussNewton(MODELS.expoff.f, [c0, sgn * Math.exp(r0.beta[0]), r0.beta[1]], xs, ys) } : null;
      }
      if (!res) return { err: 'The fit did not converge.' };
      q = res.q;
      // covariance from the numerical Jacobian
      const J = xs.map((x) => q.map((v, k) => { const h = Math.abs(v) * 1e-6 + 1e-9, qp = q.slice(); qp[k] += h; return (m.f(qp, x) - m.f(q, x)) / h; }));
      const r = solveLSQ(J, ys.map(() => 0));
      const sse = ys.reduce((a, y, i) => a + (y - m.f(q, xs[i])) ** 2, 0), s2 = sse / Math.max(1, xs.length - np);
      se = r ? r.inv.map((row, i) => Math.sqrt(Math.max(0, row[i] * s2))) : q.map(() => NaN);
    }
    const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
    let ssr = 0, sst = 0;
    for (let i = 0; i < xs.length; i++) { ssr += (ys[i] - m.f(q, xs[i])) ** 2; sst += (ys[i] - mean) ** 2; }
    const derived = [];
    if (mk === 'exp' && q[1] !== 0) { derived.push(['Time constant 1/|k|', 1 / Math.abs(q[1]), se[1] / (q[1] * q[1])]); derived.push(['Half-life (or doubling) ln2/|k|', Math.LN2 / Math.abs(q[1]), (Math.LN2 * se[1]) / (q[1] * q[1])]); }
    if (mk === 'sine' && q[2]) { derived.push(['Period 1/f', 1 / q[2], se[2] / (q[2] * q[2])]); derived.push(['Angular frequency 2πf', 2 * Math.PI * q[2], 2 * Math.PI * se[2]]); }
    if (mk === 'gauss') derived.push(['FWHM 2.3548σ', 2.35482 * q[3], 2.35482 * se[3]]);
    if (mk === 'dsine') { if (q[3]) derived.push(['Period 1/f', 1 / q[3], se[3] / (q[3] * q[3])]); if (q[2] > 0) derived.push(['Decay time 1/γ', 1 / q[2], se[2] / (q[2] * q[2])]); if (q[2] > 0 && q[3]) derived.push(['Quality factor Q = πf/γ', (Math.PI * q[3]) / q[2], (Math.PI * q[3] / q[2]) * Math.hypot(se[3] / q[3], se[2] / q[2])]); }
    if (mk === 'expoff' && q[2] !== 0) { derived.push(['Time constant 1/|k|', 1 / Math.abs(q[2]), se[2] / (q[2] * q[2])]); derived.push(['Half-life ln2/|k|', Math.LN2 / Math.abs(q[2]), (Math.LN2 * se[2]) / (q[2] * q[2])]); }
    if (mk === 'linear' && q[1]) derived.push(['x-intercept −a/b', -q[0] / q[1], Math.abs(q[0] / q[1]) * Math.hypot(se[0] / (q[0] || 1), se[1] / q[1])]);
    return { mk, label: m.label, names: m.names, q, se, r2: sst > 0 ? 1 - ssr / sst : 1, rmse: Math.sqrt(ssr / xs.length), n: xs.length, derived, f: (x) => m.f(q, x) };
  }

  /* ---------------- state ---------------- */
  const runs = [];
  let runSeq = 0, active = null;
  const view = { run: 'live', x: '', y: '', fit: 'none', logx: false, logy: false, cmp: '', fx0: '', fx1: '' };
  let cfg = null;
  const expOf = (def) => def.experiment || (P.expDefaults || {})[def.id] || {};
  const protosOf = (def) => def.protocols || (P.protocols || {})[def.id] || [];
  function defaultCfg(def) {
    const e = expOf(def);
    return {
      mode: e.mode || 'time', duration: e.duration || 20, interval: e.interval || 0.1, reset: def.resetOnRun !== false && !(P.noResetOnRun || []).includes(def.id), noise: 0,
      param: e.param || '', from: e.from, to: e.to, points: e.points || 10, logSpace: !!e.logSpace, action: e.action || '',
      resetEach: !!e.resetEach, settle: e.settle != null ? e.settle : 1, measure: e.measure != null ? e.measure : 2, stat: e.stat || 'mean', notes: '',
    };
  }

  /* ---------------- running experiments ---------------- */
  function noisy(v) {
    if (!cfg.noise || !isNum(v)) return v;
    return v * (1 + (cfg.noise / 100) * U.randn());
  }
  function snapshot() {
    const cv = I.cv();
    try {
      const max = 1400, s = Math.min(1, max / cv.width);
      const c = document.createElement('canvas');
      c.width = Math.round(cv.width * s); c.height = Math.round(cv.height * s);
      const g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(cv, 0, 0, c.width, c.height);
      return { url: c.toDataURL('image/jpeg', 0.88), w: c.width, h: c.height };
    } catch (e) { return null; }
  }
  function paramSnapshot() { return liveParams().map((p) => ({ section: p.section, label: p.label, text: p.text })); }
  function sweepValues() {
    const p = liveParams()[+cfg.param] ;
    const n = Math.max(2, Math.round(cfg.points)), a = +cfg.from, b = +cfg.to, out = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      out.push(cfg.logSpace && a > 0 && b > 0 ? a * Math.pow(b / a, t) : a + (b - a) * t);
    }
    if (p && p.step) return out.map((v) => Math.round(v / p.step) * p.step);
    return out;
  }
  function startRun() {
    if (active) return;
    readForm();
    const def = app.def;
    if (cfg.mode === 'sweep') {
      const p = liveParams()[+cfg.param];
      if (!p || p.kind !== 'slider') { toast('Choose a parameter to sweep'); return; }
      if (!(isNum(+cfg.from) && isNum(+cfg.to)) || +cfg.from === +cfg.to) { toast('Set different start and end values'); return; }
      const vals = sweepValues();
      active = { mode: 'sweep', def, p, vals, idx: -1, phase: 'settle', t0: 0, buf: null, rows: [], keys: [], units: {}, orig: p.value, started: new Date(), action: liveActions().find((a) => a.label === cfg.action) || null };
      nextPoint();
    } else {
      if (!(cfg.duration > 0) || !(cfg.interval > 0)) { toast('Duration and sample interval must be positive'); return; }
      if (cfg.reset && app.lab && app.lab.reset) { app.lab.reset(); }
      P.maxStep = cfg.interval;
      active = { mode: 'time', def, t0: app.simT, next: app.simT, n: 0, t: [], cols: {}, units: {}, order: [], started: new Date(), params: paramSnapshot() };
    }
    if (app.paused) { app.paused = false; I.updatePause(); }
    renderExperiment();
    toast(cfg.mode === 'sweep' ? `Sweep started: ${active.vals.length} points` : `Recording ${cfg.duration} s of simulated time`);
  }
  function nextPoint() {
    const A = active;
    A.idx++;
    if (A.idx >= A.vals.length) { finishRun(); return; }
    A.p.set(A.vals[A.idx]);
    if (cfg.resetEach && app.lab && app.lab.reset) app.lab.reset();
    if (A.action) { try { A.action.run(); } catch (e) { /* ignore */ } }
    A.phase = cfg.settle > 0 ? 'settle' : 'measure';
    A.t0 = app.simT;
    A.buf = {};
  }
  function onStep(simT) {
    const A = active;
    if (!A || A.def !== app.def) return;
    if (A.mode === 'time') {
      if (simT + 1e-9 >= A.next) {
        const r = I.sampleReadouts();
        const L = A.t.length;
        A.t.push(simT - A.t0);
        for (const [k, , v, unit] of r) {
          let c = A.cols[k];
          if (!c) { c = A.cols[k] = new Array(L).fill(NaN); A.order.push(k); }
          if (unit && !A.units[k]) A.units[k] = unit;
          c.push(noisy(v));
        }
        for (const k of A.order) { const c = A.cols[k]; while (c.length < L + 1) c.push(NaN); }
        A.n++;
        A.next = A.t0 + A.n * cfg.interval;
        if (A.next < simT) A.next = simT + cfg.interval * 0.5;
      }
      if (simT - A.t0 >= cfg.duration - 1e-9) finishRun();
    } else {
      const el2 = simT - A.t0;
      if (A.phase === 'settle') { if (el2 >= cfg.settle) { A.phase = 'measure'; A.t0 = simT; } return; }
      const r = I.sampleReadouts();
      for (const [k, , v, unit] of r) {
        if (!A.buf[k]) { A.buf[k] = []; if (!A.keys.includes(k)) A.keys.push(k); }
        if (unit && !A.units[k]) A.units[k] = unit;
        A.buf[k].push(v);
      }
      if (el2 >= cfg.measure) {
        const row = { x: A.vals[A.idx], v: {}, sd: {} };
        for (const k in A.buf) {
          const arr = A.buf[k].filter(isNum);
          if (!arr.length) { row.v[k] = NaN; continue; }
          const s = stats(arr);
          if (cfg.stat === 'final') row.v[k] = arr[arr.length - 1];
          else if (cfg.stat === 'max') row.v[k] = s.max;
          else if (cfg.stat === 'min') row.v[k] = s.min;
          else { row.v[k] = s.mean; row.sd[k] = s.sd; }
          row.v[k] = noisy(row.v[k]);
        }
        A.rows.push(row);
        nextPoint();
      }
    }
  }
  function finishRun(stopped) {
    const A = active;
    if (!A) return;
    active = null;
    P.maxStep = 0;
    const def = A.def, shot = snapshot();
    let cols = [];
    if (A.mode === 'time') {
      cols.push({ name: 'Run time', unit: 's', v: A.t });
      for (const k of A.order) cols.push({ name: k, unit: A.units[k] || '', v: A.cols[k] });
    } else {
      const unit = I.parseReading(A.p.text).unit;
      cols.push({ name: A.p.label, unit, v: A.rows.map((r) => r.x) });
      for (const k of A.keys) cols.push({ name: k, unit: A.units[k] || '', v: A.rows.map((r) => r.v[k]), sd: cfg.stat === 'mean' ? A.rows.map((r) => r.sd[k]) : null });
      A.p.set(A.orig);
    }
    cols = cols.filter((c, i) => i === 0 || c.v.some(isNum));
    const n = cols[0] ? cols[0].v.length : 0;
    if (!n) { toast('Experiment stopped — no data recorded'); renderExperiment(); return; }
    runSeq++;
    const run = {
      id: runSeq, name: `Run ${runSeq}`, lab: def.id, labTitle: def.title, mode: A.mode, started: A.started, finished: new Date(), stopped: !!stopped,
      cfg: Object.assign({}, cfg, { paramLabel: A.p ? A.p.label : '', actionLabel: A.action ? A.action.label : '' }),
      params: A.params || paramSnapshot(), cols, shot, notes: cfg.notes || '',
    };
    runs.push(run);
    view.run = String(run.id); view.x = ''; view.y = ''; view.cmp = '';
    renderExperiment();
    toast(`${run.name} ${stopped ? 'stopped' : 'complete'}: ${n} ${A.mode === 'sweep' ? 'points' : 'samples'} × ${cols.length} columns — see the Data tab`, 4200);
    I.showTab('data');
  }
  function stopRun() { if (active) finishRun(true); }

  /* ---------------- Experiment tab ---------------- */
  function readForm() {
    const f = $('#exp-form');
    if (!f || !cfg) return;
    f.querySelectorAll('[data-k]').forEach((i) => {
      const k = i.dataset.k;
      cfg[k] = i.type === 'checkbox' ? i.checked : i.type === 'number' ? parseFloat(i.value) : i.value;
    });
  }
  function renderExperiment() {
    const box = $('#tab-experiment');
    if (!box || !app.def || !cfg) return;
    const def = app.def, ps = liveParams(), sliders = ps.map((p, i) => [p, i]).filter(([p]) => p.kind === 'slider');
    if (cfg.mode === 'sweep' && (cfg.param === '' || !ps[+cfg.param] || ps[+cfg.param].kind !== 'slider') && sliders.length) {
      const want = expOf(def).param || '';
      const hit = sliders.find(([p]) => p.label === want) || sliders[0];
      cfg.param = String(hit[1]);
    }
    const cur = ps[+cfg.param];
    if (cur && cur.kind === 'slider' && (cfg.from === undefined || cfg._for !== cur.label)) {
      const e = expOf(def);
      const useDef = e.param === cur.label;
      cfg.from = useDef && e.from != null ? e.from : cur.min; cfg.to = useDef && e.to != null ? e.to : cur.max; cfg._for = cur.label;
    }
    const acts = liveActions();
    const opt = (v, t, sel) => `<option value="${esc(v)}"${String(sel) === String(v) ? ' selected' : ''}>${esc(t)}</option>`;
    const num = (k, label, step, unit) => `<label class="fld"><span>${label}</span><span class="in"><input type="number" data-k="${k}" step="${step}" value="${esc(cfg[k])}">${unit ? `<em>${unit}</em>` : ''}</span></label>`;
    const chk = (k, label) => `<label class="chk"><input type="checkbox" data-k="${k}"${cfg[k] ? ' checked' : ''}> ${label}</label>`;
    const running = active && active.def === def;
    let h = `<div class="sec">Run an experiment</div>
      <p class="note">Set up the lab in <b>Controls</b>, then record. Data are logged in simulated time, so the speed setting does not change the results — use 8× or 16× for long runs.</p>
      <div id="exp-form">
      <label class="fld"><span>Type</span><select data-k="mode">${opt('time', 'Time series — record all readouts over time', cfg.mode)}${opt('sweep', 'Parameter sweep — step one control, measure at each value', cfg.mode)}</select></label>`;
    if (cfg.mode === 'time') {
      h += `<div class="row2">${num('duration', 'Duration', 'any', 's')}${num('interval', 'Sample every', 'any', 's')}</div>
        ${chk('reset', 'Restart the simulation when the run starts')}
        <p class="note" id="exp-nsamp">≈ ${Math.round(cfg.duration / cfg.interval) || 0} samples.</p>`;
    } else {
      h += `<label class="fld"><span>Parameter</span><select data-k="param">${sliders.map(([p, i]) => opt(i, (p.section ? p.section + ' › ' : '') + p.label, cfg.param)).join('') || '<option>no sliders in this lab</option>'}</select></label>
        <div class="row3">${num('from', 'From', 'any')}${num('to', 'To', 'any')}${num('points', 'Points', '1')}</div>
        ${cur ? `<p class="note">Slider range ${fmtN(cur.min)} … ${fmtN(cur.max)} · now ${esc(cur.text)}</p>` : ''}
        ${chk('logSpace', 'Logarithmic spacing')}
        <label class="fld"><span>At each point press</span><select data-k="action">${opt('', '— nothing —', cfg.action)}${acts.map((a) => opt(a.label, a.label, cfg.action)).join('')}</select></label>
        ${chk('resetEach', 'Restart the simulation at each point')}
        <div class="row2">${num('settle', 'Settle time', 'any', 's')}${num('measure', 'Measure for', 'any', 's')}</div>
        <label class="fld"><span>Record</span><select data-k="stat">${opt('mean', 'Mean ± standard deviation', cfg.stat)}${opt('final', 'Final value', cfg.stat)}${opt('max', 'Maximum', cfg.stat)}${opt('min', 'Minimum', cfg.stat)}</select></label>`;
    }
    h += `${num('noise', 'Instrument noise (Gaussian, % of reading)', 'any', '%')}
      <label class="fld"><span>Notes for the report</span><textarea data-k="notes" rows="2" placeholder="Aim, sample, conditions…">${esc(cfg.notes)}</textarea></label>
      </div>
      <div class="btns">${running ? '<button class="btn danger" id="exp-stop">■ Stop and keep data</button>' : '<button class="btn primary" id="exp-start">● Start recording</button>'}</div>
      <div id="exp-prog" class="${running ? '' : 'hidden'}"><div class="bar"><i></i></div><small></small></div>`;
    const protos = protosOf(def);
    if (protos.length) {
      h += `<div class="sec">Standard experiments</div>` + protos.map((p, i) => `<div class="proto"><b>${p.t}</b><small>${p.h}</small>${p.setup ? `<button class="btn" data-proto="${i}">Load this set-up</button>` : ''}</div>`).join('');
    }
    h += `<div class="sec">Current parameters</div><table class="ptable">${ps.map((p) => `<tr><td>${esc(p.label)}</td><td>${esc(p.text)}</td></tr>`).join('')}</table>
      <div class="btns"><button class="btn" id="exp-link" title="A link that opens this lab with exactly these parameter values">Copy link with these parameters</button></div>`;
    if (runs.some((r) => r.lab === def.id)) h += `<p class="note">${runs.filter((r) => r.lab === def.id).length} run(s) recorded in this lab — open the <b>Data</b> tab.</p>`;
    box.innerHTML = h;
    box.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('change', () => {
      const k = i.dataset.k;
      readForm();
      if (k === 'mode' || k === 'param') { if (k === 'param') cfg.from = undefined; renderExperiment(); }
      else if (k === 'duration' || k === 'interval') { const nn = $('#exp-nsamp'); if (nn) nn.textContent = `≈ ${Math.round(cfg.duration / cfg.interval) || 0} samples.`; }
    }));
    const st = $('#exp-start'); if (st) st.onclick = startRun;
    const sp = $('#exp-stop'); if (sp) sp.onclick = stopRun;
    $('#exp-link').onclick = copyLink;
    box.querySelectorAll('[data-proto]').forEach((b) => b.onclick = () => loadProto(protos[+b.dataset.proto]));
  }
  function loadProto(p) {
    const s = p.setup || {};
    if (s.set) for (const [label, v] of Object.entries(s.set)) { const q = liveParams().find((x) => x.label === label); if (q) q.set(v); }
    if (s.press) { const a = liveActions().find((x) => x.label === s.press); if (a) a.run(); }
    Object.assign(cfg, { mode: s.mode || 'time' });
    if (s.mode === 'sweep') {
      const i = liveParams().findIndex((x) => x.label === s.param);
      if (i >= 0) cfg.param = String(i);
      Object.assign(cfg, { from: s.from, to: s.to, points: s.points || 10, logSpace: !!s.logSpace, action: s.action || '', resetEach: !!s.resetEach, settle: s.settle != null ? s.settle : 1, measure: s.measure != null ? s.measure : 2, stat: s.stat || 'mean', _for: s.param });
    } else {
      Object.assign(cfg, { duration: s.duration || cfg.duration, interval: s.interval || cfg.interval, reset: s.reset !== undefined ? s.reset : cfg.reset });
    }
    view.wantX = s.x || ''; view.wantY = s.y || ''; view.wantFit = s.fit || '';
    renderExperiment();
    toast('Set-up loaded — press Start recording');
  }
  function onFrame() {
    const A = active;
    const pr = $('#exp-prog');
    const tag = $('#recTag');
    if (!A || A.def !== app.def) { if (tag) tag.style.display = 'none'; return; }
    let frac, txt;
    if (A.mode === 'time') { const e = app.simT - A.t0; frac = e / cfg.duration; txt = `${e.toFixed(1)} / ${cfg.duration} s · ${A.n} samples`; }
    else { frac = (A.idx + (A.phase === 'measure' ? 0.5 : 0)) / A.vals.length; txt = `point ${A.idx + 1} / ${A.vals.length} · ${A.p.label} = ${fmtN(A.vals[A.idx], 4)} · ${A.phase}`; }
    if (pr) { pr.querySelector('i').style.width = Math.min(100, frac * 100).toFixed(1) + '%'; pr.querySelector('small').textContent = txt; }
    if (tag) { tag.style.display = 'block'; tag.textContent = '● REC  ' + txt; }
  }

  /* ---------------- reproducible links ---------------- */
  function copyLink() {
    const ps = liveParams().map((p) => [p.label, p.kind === 'slider' ? +(+p.value).toPrecision(6) : p.value]);
    const q = 'p=' + encodeURIComponent(JSON.stringify(ps));
    const url = location.href.split('#')[0] + '#/lab/' + app.def.id + '?' + q;
    const done = () => toast('Link copied — it reopens this lab with the same parameters');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => prompt('Copy this link:', url));
    else prompt('Copy this link:', url);
  }
  P.applyQuery = function (qs) {
    try {
      const m = qs.match(/(?:^|&)p=([^&]*)/);
      if (!m) return;
      const list = JSON.parse(decodeURIComponent(m[1]));
      const used = new Set();
      for (const [label, v] of list) {
        const p = liveParams().find((x, i) => x.label === label && !used.has(i) && (used.add(i), true));
        if (p) p.set(v);
      }
      toast('Parameters loaded from the link');
      renderExperiment();
    } catch (e) { toast('Could not read the parameters in this link'); }
  };

  /* ---------------- Data tab ---------------- */
  function liveRun() {
    const d = I.data, keys = Object.keys(d.cols);
    return { id: 'live', name: 'Live log', lab: app.def.id, labTitle: app.def.title, mode: 'live', started: null, finished: new Date(), params: paramSnapshot(), notes: '',
      cols: [{ name: 'Simulation time', unit: 's', v: d.t.slice() }, ...keys.map((k) => ({ name: k, unit: d.units[k] || '', v: d.cols[k].slice() }))].filter((c, i) => i === 0 || c.v.some(isNum)), cfg: {} };
  }
  function currentRun() {
    if (view.run === 'live') return liveRun();
    return runs.find((r) => String(r.id) === view.run && r.lab === app.def.id) || liveRun();
  }
  function pickDefaults(run) {
    const names = run.cols.map((c) => c.name);
    if (view.wantX && names.includes(view.wantX)) { view.x = view.wantX; view.wantX = ''; }
    if (view.wantY && names.includes(view.wantY)) { view.y = view.wantY; view.wantY = ''; }
    if (view.wantFit) { view.fit = view.wantFit; view.wantFit = ''; }
    if (!names.includes(view.x)) view.x = names[0] || '';
    if (!names.includes(view.y) || view.y === view.x) {
      const varying = run.cols.find((c) => c.name !== view.x && (() => { const s = stats(c.v); return s.n > 1 && s.max > s.min; })());
      view.y = varying ? varying.name : names.find((n) => n !== view.x) || '';
    }
  }
  let dataSig = '';
  function renderData(force) {
    const box = $('#tab-data');
    if (!box || !app.def) return;
    const run = currentRun();
    pickDefaults(run);
    const labRuns = runs.filter((r) => r.lab === app.def.id);
    const opt = (v, t, sel) => `<option value="${esc(v)}"${String(sel) === String(v) ? ' selected' : ''}>${esc(t)}</option>`;
    const colOpts = (sel) => run.cols.map((c) => opt(c.name, colLabel(c), sel)).join('');
    const n = run.cols[0] ? run.cols[0].v.length : 0;
    const sig = [view.run, labRuns.length].join('|');
    if (!force && sig === dataSig && box.querySelector('#dplot')) { updateDataBody(run); return; }
    dataSig = sig;
    box.innerHTML = `<div class="sec">Data set</div>
      <div class="row2"><label class="fld"><span>Show</span><select id="d-run">${opt('live', `Live log (continuous, last ${I.data.t.length} samples)`, view.run)}${labRuns.slice().reverse().map((r) => opt(r.id, `${r.name} — ${r.mode === 'sweep' ? 'sweep of ' + r.cfg.paramLabel : 'time series'} (${r.cols[0].v.length})`, view.run)).join('')}</select></label>
      <label class="fld"><span>Compare with</span><select id="d-cmp">${opt('', '— none —', view.cmp)}${labRuns.filter((r) => String(r.id) !== view.run).map((r) => opt(r.id, r.name, view.cmp)).join('')}</select></label></div>
      <div class="sec">Plot</div>
      <div class="row2"><label class="fld"><span>x axis</span><select id="d-x">${colOpts(view.x)}</select></label><label class="fld"><span>y axis</span><select id="d-y">${colOpts(view.y)}</select></label></div>
      <div class="chkrow"><label class="chk"><input type="checkbox" id="d-logx"${view.logx ? ' checked' : ''}> log x</label><label class="chk"><input type="checkbox" id="d-logy"${view.logy ? ' checked' : ''}> log y</label></div>
      <canvas id="dplot"></canvas>
      <div class="row3"><label class="fld"><span>Fit model</span><select id="d-fit">${Object.entries(MODELS).map(([k, m]) => opt(k, m.label, view.fit)).join('')}</select></label>
      <label class="fld"><span>Fit from x</span><input type="number" id="d-fx0" step="any" value="${esc(view.fx0)}" placeholder="all"></label>
      <label class="fld"><span>to x</span><input type="number" id="d-fx1" step="any" value="${esc(view.fx1)}" placeholder="all"></label></div>
      <div id="d-fitres"></div>
      <div class="btns"><button class="btn primary" id="d-pdf">⬇ PDF report</button><button class="btn" id="d-csv">⬇ CSV</button><button class="btn" id="d-json">⬇ JSON</button>${labRuns.length ? '<button class="btn" id="d-clear">Delete runs</button>' : ''}</div>
      <div class="sec">Statistics</div><div id="d-stats" class="tscroll"></div>
      <div class="sec">Data table <small id="d-n"></small></div><div id="d-table" class="tscroll tall"></div>`;
    const bind = (id, k, ev = 'change', fn) => { const e = $(id); if (e) e.addEventListener(ev, () => { view[k] = e.type === 'checkbox' ? e.checked : e.value; fn ? fn() : updateDataBody(currentRun()); }); };
    bind('#d-run', 'run', 'change', () => { view.cmp = ''; renderData(true); });
    bind('#d-cmp', 'cmp');
    bind('#d-x', 'x'); bind('#d-y', 'y'); bind('#d-logx', 'logx'); bind('#d-logy', 'logy'); bind('#d-fit', 'fit');
    bind('#d-fx0', 'fx0'); bind('#d-fx1', 'fx1');
    $('#d-pdf').onclick = () => makeReport(currentRun());
    $('#d-csv').onclick = () => exportCSV(currentRun());
    $('#d-json').onclick = () => exportJSON(currentRun());
    const cl = $('#d-clear'); if (cl) cl.onclick = () => { if (!confirm('Delete all recorded runs of this lab?')) return; for (let i = runs.length - 1; i >= 0; i--) if (runs[i].lab === app.def.id) runs.splice(i, 1); view.run = 'live'; renderData(true); };
    updateDataBody(run);
    void n;
  }
  function fitFor(run) {
    const cx = run.cols.find((c) => c.name === view.x), cy = run.cols.find((c) => c.name === view.y);
    if (!cx || !cy || view.fit === 'none') return null;
    const a = view.fx0 === '' ? -Infinity : +view.fx0, b = view.fx1 === '' ? Infinity : +view.fx1;
    const xs = [], ys = [];
    for (let i = 0; i < cx.v.length; i++) if (cx.v[i] >= a && cx.v[i] <= b) { xs.push(cx.v[i]); ys.push(cy.v[i]); }
    const order = xs.map((x, i) => i).sort((i, j) => xs[i] - xs[j]);
    return fit(view.fit, order.map((i) => xs[i]), order.map((i) => ys[i]));
  }
  function fitHTML(F, cx, cy) {
    if (!F) return '';
    if (F.err) return `<div class="fitbox err">${esc(F.err)}</div>`;
    const ux = cx.unit, uy = cy.unit;
    return `<div class="fitbox"><b>${esc(F.label)}</b><table>${F.names.map((nm, i) => `<tr><td>${esc(nm)}</td><td>${fmtN(F.q[i], 6)}</td><td>± ${fmtN(F.se[i], 3)}</td></tr>`).join('')}
      ${F.derived.map(([nm, v, s]) => `<tr><td>${esc(nm)}</td><td>${fmtN(v, 6)}</td><td>± ${fmtN(s, 3)}</td></tr>`).join('')}</table>
      <small>R² = ${F.r2.toFixed(6)} · RMSE = ${fmtN(F.rmse, 4)}${uy ? ' ' + esc(uy) : ''} · n = ${F.n}${ux || uy ? ` · x in ${esc(ux || '—')}, y in ${esc(uy || '—')}` : ''} · ± = 1 standard error</small></div>`;
  }
  function updateDataBody(run) {
    const cx = run.cols.find((c) => c.name === view.x), cy = run.cols.find((c) => c.name === view.y);
    const cmp = view.cmp ? runs.find((r) => String(r.id) === view.cmp) : null;
    const F = fitFor(run);
    const cv = $('#dplot');
    if (cv && cx && cy) {
      const W = cv.clientWidth || 320, H = Math.round(Math.min(340, Math.max(220, W * 0.62))), d = Math.min(2, window.devicePixelRatio || 1);
      cv.style.height = H + 'px';
      cv.width = Math.round(W * d); cv.height = Math.round(H * d);
      const g = cv.getContext('2d');
      g.setTransform(d, 0, 0, d, 0, 0);
      const series = [{ x: cx.v, y: cy.v, sd: cy.sd, color: '#1f5fbf', name: run.name, line: run.mode !== 'sweep' }];
      if (cmp) { const ax = cmp.cols.find((c) => c.name === view.x), ay = cmp.cols.find((c) => c.name === view.y); if (ax && ay) series.push({ x: ax.v, y: ay.v, sd: ay.sd, color: '#d9480f', name: cmp.name, line: cmp.mode !== 'sweep' }); }
      drawPlot(canvasPainter(g), 0, 0, W, H, series, colLabel(cx), colLabel(cy), F && !F.err ? F : null, view.logx, view.logy, 11);
    }
    $('#d-fitres').innerHTML = cx && cy ? fitHTML(F, cx, cy) : '';
    // statistics
    let s = '<table class="dt"><tr><th>Quantity</th><th>Unit</th><th>N</th><th>Mean</th><th>SD</th><th>SEM</th><th>Min</th><th>Max</th></tr>';
    for (const c of run.cols) { const q = stats(c.v); s += `<tr><td>${esc(c.name)}</td><td>${esc(c.unit)}</td><td>${q.n || 0}</td><td>${fmtN(q.mean)}</td><td>${fmtN(q.sd, 4)}</td><td>${fmtN(q.sem, 3)}</td><td>${fmtN(q.min)}</td><td>${fmtN(q.max)}</td></tr>`; }
    $('#d-stats').innerHTML = s + '</table>';
    // table
    const n = run.cols[0] ? run.cols[0].v.length : 0, MAXR = 400, step = Math.max(1, Math.ceil(n / MAXR));
    let t = '<table class="dt"><tr><th>#</th>' + run.cols.map((c) => `<th>${esc(c.name)}${c.unit ? `<br><small>${esc(c.unit)}</small>` : ''}</th>${c.sd ? '<th>SD</th>' : ''}`).join('') + '</tr>';
    for (let i = 0; i < n; i += step) t += `<tr><td>${i + 1}</td>` + run.cols.map((c) => `<td>${fmtN(c.v[i])}</td>${c.sd ? `<td>${fmtN(c.sd[i], 3)}</td>` : ''}`).join('') + '</tr>';
    $('#d-table').innerHTML = t + '</table>';
    $('#d-n').textContent = `${n} rows${step > 1 ? ` (every ${step}th shown — exports contain all)` : ''}`;
  }

  /* ---------------- plotting (shared by canvas and PDF) ---------------- */
  function niceTicks(lo, hi, target) {
    const step = U.niceStep(hi - lo, target), out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return out;
  }
  const tickLabel = (v, log) => (log ? (Math.abs(v - Math.round(v)) < 1e-9 ? '1e' + Math.round(v) : '') : fmtN(v, 4));
  function canvasPainter(g) {
    return {
      line(x1, y1, x2, y2, c, w, dash) { g.strokeStyle = c; g.lineWidth = w || 1; g.setLineDash(dash || []); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]); },
      poly(pts, c, w, dash) { g.strokeStyle = c; g.lineWidth = w || 1.5; g.setLineDash(dash || []); g.beginPath(); let pen = false; for (const p of pts) { if (!p) { pen = false; continue; } if (pen) g.lineTo(p[0], p[1]); else { g.moveTo(p[0], p[1]); pen = true; } } g.stroke(); g.setLineDash([]); },
      dot(x, y, r, c) { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); },
      text(x, y, s, size, c, align, rot) { g.save(); g.fillStyle = c || '#222'; g.font = `${size}px system-ui, -apple-system, Segoe UI, sans-serif`; g.textAlign = align || 'left'; g.textBaseline = 'middle'; g.translate(x, y); if (rot) g.rotate(rot); g.fillText(s, 0, 0); g.restore(); },
      rect(x, y, w, h, fill, stroke) { if (fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); } },
      tw(s, size) { g.font = `${size}px system-ui, sans-serif`; return g.measureText(s).width; },
    };
  }
  function pdfPainter(pdf) {
    return {
      line(x1, y1, x2, y2, c, w, dash) { pdf.line(x1, y1, x2, y2, { color: c, width: w || 0.5, dash }); },
      poly(pts, c, w, dash) { pdf.polyline(pts.map((p) => p || [NaN, NaN]), { color: c, width: w || 0.9, dash }); },
      dot(x, y, r, c) { pdf.circle(x, y, r, { fill: c }); },
      text(x, y, s, size, c, align, rot) { if (rot) { pdf._op(`q 0 1 -1 0 ${x} ${pdf.H - y} cm BT /F1 ${size} Tf 0.13 0.13 0.13 rg ${-pdf.width(s, size) / 2} ${-size / 3} Td (${PhysPDF.winAnsi(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}) Tj ET Q`); return; } pdf.text(x, y + size / 3, s, { size, color: c || '#222222', align }); },
      rect(x, y, w, h, fill, stroke) { pdf.rect(x, y, w, h, { fill, stroke }); },
      tw(s, size) { return pdf.width(s, size); },
    };
  }
  function drawPlot(P2, X, Y, W, H, series, xl, yl, F, logx, logy, fs) {
    const tx = (v) => (logx ? (v > 0 ? Math.log10(v) : NaN) : v), ty = (v) => (logy ? (v > 0 ? Math.log10(v) : NaN) : v);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const s of series) for (let i = 0; i < s.x.length; i++) {
      const a = tx(s.x[i]), b = ty(s.y[i]);
      if (!isNum(a) || !isNum(b)) continue;
      const e = s.sd && isNum(s.sd[i]) && !logy ? s.sd[i] : 0;
      if (a < x0) x0 = a; if (a > x1) x1 = a; if (b - e < y0) y0 = b - e; if (b + e > y1) y1 = b + e;
    }
    P2.rect(X, Y, W, H, '#ffffff', null);
    if (x0 === Infinity) { P2.text(X + W / 2, Y + H / 2, 'No numeric data to plot', fs, '#777', 'center'); return; }
    if (x1 === x0) { x0 -= 1; x1 += 1; }
    if (y1 === y0) { const d = Math.abs(y0) * 0.1 || 1; y0 -= d; y1 += d; }
    const py = (y1 - y0) * 0.06; y0 -= py; y1 += py;
    const L = X + fs * 5.2, R = X + W - fs * 1.2, T = Y + fs * 1.2, B = Y + H - fs * 3.4;
    const sx = (v) => L + ((v - x0) / (x1 - x0)) * (R - L), sy = (v) => B - ((v - y0) / (y1 - y0)) * (B - T);
    const xt = niceTicks(x0, x1, Math.max(3, Math.floor((R - L) / (fs * 6)))), yt = niceTicks(y0, y1, Math.max(3, Math.floor((B - T) / (fs * 3))));
    for (const v of xt) { P2.line(sx(v), T, sx(v), B, '#e6e6e6', 0.6); P2.text(sx(v), B + fs * 0.9, tickLabel(v, logx), fs * 0.85, '#444', 'center'); }
    for (const v of yt) { P2.line(L, sy(v), R, sy(v), '#e6e6e6', 0.6); P2.text(L - fs * 0.4, sy(v), tickLabel(v, logy), fs * 0.85, '#444', 'right'); }
    P2.rect(L, T, R - L, B - T, null, '#888888');
    P2.text((L + R) / 2, B + fs * 2.3, xl + (logx ? '  [log]' : ''), fs, '#222', 'center');
    P2.text(X + fs * 0.8, (T + B) / 2, yl + (logy ? '  [log]' : ''), fs, '#222', 'center', -Math.PI / 2);
    for (const s of series) {
      const n = s.x.length, pts = [];
      const idx = [...Array(n).keys()];
      if (!s.line) idx.sort((i, j) => s.x[i] - s.x[j]);
      for (const i of idx) {
        const a = tx(s.x[i]), b = ty(s.y[i]);
        if (!isNum(a) || !isNum(b)) { pts.push(null); continue; }
        pts.push([sx(a), sy(b)]);
        if (s.sd && isNum(s.sd[i]) && s.sd[i] > 0 && !logy) { P2.line(sx(a), sy(b - s.sd[i]), sx(a), sy(b + s.sd[i]), s.color, 0.8); P2.line(sx(a) - 3, sy(b - s.sd[i]), sx(a) + 3, sy(b - s.sd[i]), s.color, 0.8); P2.line(sx(a) - 3, sy(b + s.sd[i]), sx(a) + 3, sy(b + s.sd[i]), s.color, 0.8); }
      }
      P2.poly(pts, s.color, s.line ? 1.3 : 0.8, s.line ? null : [3, 2]);
      if (!s.line || n < 60) for (const p of pts) if (p) P2.dot(p[0], p[1], s.line ? 1.6 : 2.6, s.color);
    }
    if (F) {
      const pts = [];
      for (let k = 0; k <= 200; k++) {
        const a = x0 + ((x1 - x0) * k) / 200, xv = logx ? Math.pow(10, a) : a, yv = ty(F.f(xv));
        pts.push(isNum(yv) && yv > y0 - (y1 - y0) && yv < y1 + (y1 - y0) ? [sx(a), sy(Math.max(y0, Math.min(y1, yv)))] : null);
      }
      P2.poly(pts, '#c92a2a', 1.4, [6, 3]);
    }
    if (series.length > 1 || F) {
      let lx = L + 8, ly = T + fs;
      for (const s of series) { P2.line(lx, ly, lx + 16, ly, s.color, 2); P2.text(lx + 20, ly, s.name, fs * 0.85, '#222'); ly += fs * 1.3; }
      if (F) { P2.line(lx, ly, lx + 16, ly, '#c92a2a', 1.5, [4, 2]); P2.text(lx + 20, ly, 'fit', fs * 0.85, '#222'); }
    }
  }

  /* ---------------- exports ---------------- */
  function fileBase(run) { return `physica-${run.lab}-${slug(run.name)}-${(run.finished || new Date()).toISOString().slice(0, 19).replace(/[:T]/g, '-')}`; }
  function exportCSV(run) {
    const n = run.cols[0] ? run.cols[0].v.length : 0;
    if (!n) { toast('No data yet'); return; }
    const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    const head = [];
    for (const c of run.cols) { head.push(q(c.name + (c.unit ? ` [${c.unit}]` : ''))); if (c.sd) head.push(q(c.name + ' SD' + (c.unit ? ` [${c.unit}]` : ''))); }
    let out = `# Physica — ${run.labTitle} — ${run.name}\n# exported ${stamp(new Date())}; simulated data\n` + head.join(',') + '\n';
    for (let i = 0; i < n; i++) {
      const row = [];
      for (const c of run.cols) { row.push(isNum(c.v[i]) ? c.v[i] : ''); if (c.sd) row.push(isNum(c.sd[i]) ? c.sd[i] : ''); }
      out += row.join(',') + '\n';
    }
    download(new Blob([out], { type: 'text/csv' }), fileBase(run) + '.csv');
    toast(`CSV saved: ${n} rows`);
  }
  function exportJSON(run) {
    const o = { software: 'Physica virtual physics laboratory', lab: run.lab, labTitle: run.labTitle, run: run.name, mode: run.mode, started: run.started, finished: run.finished, settings: run.cfg, notes: run.notes, parameters: run.params, columns: run.cols.map((c) => ({ name: c.name, unit: c.unit, values: c.v, sd: c.sd || undefined })) };
    download(new Blob([JSON.stringify(o, null, 1)], { type: 'application/json' }), fileBase(run) + '.json');
  }

  /* ---------------- PDF report ---------------- */
  function htmlToBlocks(html) {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    const out = [];
    const walk = (node) => {
      for (const n of node.children) {
        const t = (n.textContent || '').replace(/\s+/g, ' ').trim();
        if (!t) continue;
        if (/^H\d$/.test(n.tagName)) out.push(['h', t]);
        else if (n.classList.contains('eq')) out.push(['eq', t]);
        else if (n.tagName === 'UL' || n.tagName === 'OL') for (const li of n.children) out.push(['li', li.textContent.replace(/\s+/g, ' ').trim()]);
        else if (n.tagName === 'TABLE') for (const tr of n.querySelectorAll('tr')) out.push(['eq', [...tr.children].map((c) => c.textContent.trim()).join('   ')]);
        else out.push(['p', t]);
      }
    };
    walk(d);
    return out;
  }
  function makeReport(run) {
    const n = run.cols[0] ? run.cols[0].v.length : 0;
    if (!n) { toast('Record some data first'); return; }
    const def = P.labs.find((l) => l.id === run.lab) || app.def;
    const pdf = new PhysPDF({ title: `Physica report - ${run.labTitle} - ${run.name}` });
    const M = 48, PW = pdf.W - 2 * M, BOT = pdf.H - 46;
    let y = M;
    const need = (h) => { if (y + h > BOT) { pdf.addPage(); y = M; return true; } return false; };
    const heading = (t, room = 40) => { need(40 + room); y += 12; pdf.text(M, y, t, { size: 13, font: 'F2' }); y += 6; pdf.line(M, y, M + PW, y, { color: '#999999', width: 0.6 }); y += 14; };
    const para = (t, o = {}) => {
      const size = o.size || 9.5, font = o.font || 'F1', ind = o.indent || 0;
      for (const ln of pdf.wrap(t, size, font, PW - ind)) { need(size * 1.4); pdf.text(M + ind, y, ln, { size, font, color: o.color }); y += size * 1.38; }
      y += o.after != null ? o.after : 4;
    };
    const kv = (rows, w1 = 150) => {
      for (const [k, v] of rows) {
        const lines = pdf.wrap(String(v), 9.5, 'F1', PW - w1);
        need(lines.length * 13 + 2);
        pdf.text(M, y, k, { size: 9.5, font: 'F2' });
        lines.forEach((ln, i) => pdf.text(M + w1, y + i * 13, ln, { size: 9.5 }));
        y += lines.length * 13 + 2;
      }
    };
    const date = run.finished || new Date();
    // ---- title block
    pdf.text(M, y + 4, 'PHYSICA · EXPERIMENT REPORT', { size: 9, font: 'F2', color: '#555555' });
    pdf.text(M + PW, y + 4, stamp(date), { size: 9, color: '#555555', align: 'right' });
    y += 28;
    para(run.labTitle, { size: 20, font: 'F2', after: 2 });
    para(def ? def.subtitle : '', { size: 10, color: '#444444', after: 8 });
    pdf.line(M, y, M + PW, y, { color: '#000000', width: 1 }); y += 16;
    const c = run.cfg || {};
    const info = [['Run', run.name + (run.stopped ? ' (stopped early)' : '')], ['Type', run.mode === 'sweep' ? 'Parameter sweep' : run.mode === 'live' ? 'Continuous live log' : 'Time series']];
    if (run.started) info.push(['Started', stamp(run.started)]);
    info.push(['Finished', stamp(date)]);
    if (run.mode === 'time') info.push(['Duration', `${fmtN(c.duration)} s simulated, one sample every ${fmtN(c.interval)} s`], ['Start condition', c.reset ? 'simulation restarted at t = 0' : 'continued from the current state']);
    if (run.mode === 'sweep') {
      info.push(['Swept parameter', `${c.paramLabel}: ${fmtN(+c.from)} → ${fmtN(+c.to)} in ${c.points} ${c.logSpace ? 'logarithmic' : 'linear'} steps`]);
      info.push(['At each point', `${c.resetEach ? 'restart, ' : ''}${c.actionLabel ? 'press "' + c.actionLabel + '", ' : ''}settle ${fmtN(c.settle)} s, measure ${fmtN(c.measure)} s, record ${({ mean: 'mean ± SD', final: 'final value', max: 'maximum', min: 'minimum' })[c.stat]}`]);
    }
    info.push(['Data', `${n} ${run.mode === 'sweep' ? 'points' : 'rows'} × ${run.cols.length} columns`]);
    if (c.noise) info.push(['Instrument noise', `Gaussian, σ = ${fmtN(c.noise)} % of each reading (added on purpose)`]);
    info.push(['Source', 'Physica virtual physics laboratory — https://brknue.github.io/Claude/physica/ — numerically simulated data, not a physical measurement']);
    kv(info, 110);
    if (run.notes) { y += 4; pdf.text(M, y, 'Notes', { size: 9.5, font: 'F2' }); para(run.notes, { indent: 110 }); }
    // ---- snapshot
    if (run.shot && run.shot.url) {
      const bin = atob(run.shot.url.split(',')[1]), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      let w = PW, h = (run.shot.h / run.shot.w) * w;
      if (h > 250) { h = 250; w = (run.shot.w / run.shot.h) * h; }
      need(h + 26);
      y += 6;
      pdf.image(bytes, run.shot.w, run.shot.h, M + (PW - w) / 2, y, w, h);
      pdf.rect(M + (PW - w) / 2, y, w, h, { stroke: '#999999' });
      y += h + 12;
      para('Figure 1 — state of the simulation at the end of the run.', { size: 8.5, color: '#555555' });
    }
    // ---- parameters
    heading('Parameters');
    let sec = null;
    for (const p of run.params) {
      need(13);
      if (p.section !== sec) { sec = p.section; if (sec) { y += 3; pdf.text(M, y, sec, { size: 9, font: 'F2', color: '#444444' }); y += 12; need(13); } }
      pdf.text(M + 12, y, p.label, { size: 9.5 });
      pdf.text(M + 260, y, p.text, { size: 9.5, font: 'F3' });
      y += 12.5;
    }
    // ---- main plot + fit
    const cx = run.cols.find((q) => q.name === view.x) || run.cols[0];
    const cy = run.cols.find((q) => q.name === view.y && q !== cx) || run.cols.find((q) => q !== cx && stats(q.v).max > stats(q.v).min) || run.cols[1];
    const F = String(view.run) === String(run.id) ? fitFor(run) : null;
    if (cy) {
      heading('Main result', 270);
      drawPlot(pdfPainter(pdf), M, y, PW, 260, [{ x: cx.v, y: cy.v, sd: cy.sd, color: '#1f5fbf', name: run.name, line: run.mode !== 'sweep' }], colLabel(cx), colLabel(cy), F && !F.err ? F : null, view.logx, view.logy, 9);
      y += 268;
      para(`Figure 2 — ${colLabel(cy)} against ${colLabel(cx)}${cy.sd ? '; error bars = ±1 SD over the measuring window' : ''}${F && !F.err ? '; dashed red line = least-squares fit' : ''}.`, { size: 8.5, color: '#555555' });
      if (F && !F.err) {
        need(30 + 13 * (F.names.length + F.derived.length));
        pdf.text(M, y + 2, 'Fit: ' + F.label, { size: 10, font: 'F2' }); y += 16;
        const rowsF = F.names.map((nm, i) => [nm, F.q[i], F.se[i]]).concat(F.derived);
        for (const [nm, v, s] of rowsF) { pdf.text(M + 12, y, nm, { size: 9.5 }); pdf.text(M + 240, y, fmtN(v, 7), { size: 9.5, font: 'F3', align: 'right' }); pdf.text(M + 252, y, '± ' + fmtN(s, 3), { size: 9.5, font: 'F3' }); y += 12.5; }
        para(`R² = ${F.r2.toFixed(6)}, RMSE = ${fmtN(F.rmse, 4)} ${cy.unit || ''}, n = ${F.n} points${view.fx0 !== '' || view.fx1 !== '' ? `, fitted for ${view.fx0 || '−∞'} ≤ x ≤ ${view.fx1 || '∞'}` : ''}. Unweighted least squares in y; uncertainties are 1 standard error from the covariance matrix (they assume independent residuals, so successive samples of one time series can make them optimistic).`, { size: 9 });
      }
    }
    // ---- statistics
    heading('Summary statistics');
    const sc = [M, M + 150, M + 205, M + 240, M + 300, M + 355, M + 410, M + 460];
    const sh = ['Quantity', 'Unit', 'N', 'Mean', 'SD', 'SEM', 'Min', 'Max'];
    need(16); sh.forEach((t, i) => pdf.text(sc[i], y, t, { size: 8.5, font: 'F2' })); y += 4; pdf.line(M, y, M + PW, y, { color: '#999999' }); y += 11;
    for (const col of run.cols) {
      const q = stats(col.v), nameL = pdf.wrap(col.name, 8.5, 'F1', 145);
      need(11 * nameL.length + 2);
      nameL.forEach((ln, i) => pdf.text(sc[0], y + i * 10.5, ln, { size: 8.5 }));
      pdf.text(sc[1], y, (col.unit || '').slice(0, 10), { size: 8.5 });
      [q.n || 0, fmtN(q.mean, 5), fmtN(q.sd, 3), fmtN(q.sem, 3), fmtN(q.min, 5), fmtN(q.max, 5)].forEach((v, i) => pdf.text(sc[i + 2], y, String(v), { size: 8, font: 'F3' }));
      y += 10.5 * nameL.length + 2.5;
    }
    // ---- all quantities
    const plotCols = run.cols.filter((q) => q !== cx && (() => { const s = stats(q.v); return s.n > 1 && s.max > s.min; })());
    if (plotCols.length) {
      heading('All measured quantities');
      const gw = (PW - 14) / 2, gh = 150;
      plotCols.forEach((col, i) => {
        if (i % 2 === 0) need(gh + 8);
        const gx = M + (i % 2) * (gw + 14);
        drawPlot(pdfPainter(pdf), gx, y, gw, gh, [{ x: cx.v, y: col.v, sd: col.sd, color: '#1f5fbf', name: run.name, line: run.mode !== 'sweep' }], colLabel(cx), colLabel(col), null, false, false, 7);
        if (i % 2 === 1 || i === plotCols.length - 1) y += gh + 8;
      });
    }
    // ---- data table (all rows, columns split into blocks that fit the page)
    heading('Data');
    const flat = [];
    run.cols.forEach((col) => { flat.push({ h: col.name, u: col.unit, v: col.v }); if (col.sd) flat.push({ h: col.name + ' SD', u: col.unit, v: col.sd }); });
    const MAXROWS = 5000, stepR = Math.max(1, Math.ceil(n / MAXROWS));
    if (stepR > 1) para(`The run has ${n} rows; every ${stepR}th row is printed here. The CSV export contains all of them.`, { size: 9 });
    else para(`All ${n} rows. Values are printed with 6 significant digits; the CSV and JSON exports keep full precision.`, { size: 9 });
    const CW = 11 * 4.8 + 6, perBlock = Math.max(1, Math.floor((PW - 30) / CW));
    for (let b0 = 0; b0 < flat.length; b0 += perBlock) {
      const blk = flat.slice(b0, b0 + perBlock);
      const head = () => {
        const hl = blk.map((c) => pdf.wrap(c.h, 7, 'F2', CW - 4).slice(0, 3));
        const rowsH = Math.max(...hl.map((l) => l.length));
        need(rowsH * 8.5 + 22);
        pdf.text(M, y, '#', { size: 7, font: 'F2' });
        hl.forEach((l, i) => l.forEach((ln, j) => pdf.text(M + 30 + i * CW, y + j * 8.5, ln, { size: 7, font: 'F2' })));
        y += rowsH * 8.5;
        blk.forEach((c, i) => pdf.text(M + 30 + i * CW, y, c.u ? '[' + c.u + ']' : '', { size: 7, color: '#555555' }));
        y += 3; pdf.line(M, y, M + 30 + blk.length * CW, y, { color: '#999999', width: 0.5 }); y += 8;
      };
      head();
      for (let i = 0; i < n; i += stepR) {
        if (need(8.6)) head();
        pdf.text(M, y, String(i + 1), { size: 7, font: 'F3', color: '#666666' });
        blk.forEach((c, k) => pdf.text(M + 30 + k * CW, y, fmtN(c.v[i], 6), { size: 7, font: 'F3' }));
        y += 8.6;
      }
      y += 10;
    }
    // ---- method / theory
    if (def && def.theory) {
      heading('Model and method');
      for (const [kind, t] of htmlToBlocks(def.theory)) {
        if (kind === 'h') { need(24); y += 6; pdf.text(M, y, t, { size: 10.5, font: 'F2' }); y += 14; }
        else if (kind === 'eq') para(t, { font: 'F3', size: 8.5, indent: 14 });
        else if (kind === 'li') para('• ' + t, { indent: 8, size: 9.5, after: 1 });
        else para(t, { size: 9.5 });
      }
    }
    // ---- footer on every page
    const total = pdf.pageCount;
    pdf.pages.forEach((pg, i) => {
      pdf.cur = pg;
      pdf.line(M, pdf.H - 34, M + PW, pdf.H - 34, { color: '#bbbbbb', width: 0.5 });
      pdf.text(M, pdf.H - 22, `Physica · ${run.labTitle} · ${run.name} · simulated data`, { size: 7.5, color: '#666666' });
      pdf.text(M + PW, pdf.H - 22, `page ${i + 1} of ${total}`, { size: 7.5, color: '#666666', align: 'right' });
    });
    download(pdf.output(), fileBase(run) + '.pdf');
    toast(`PDF report saved (${total} pages)`);
  }

  /* ---------------- hooks into the core ---------------- */
  P.onStep = onStep;
  P.onBuild = (def) => {
    if (active && active.def !== def) { active = null; P.maxStep = 0; }
    cfg = defaultCfg(def);
    view.run = 'live'; view.x = ''; view.y = ''; view.fit = 'none'; view.cmp = ''; view.fx0 = ''; view.fx1 = ''; view.logx = false; view.logy = false;
    dataSig = '';
    // let the lab's controls settle before listing them
    setTimeout(() => { renderExperiment(); renderData(true); }, 0);
  };
  P.onMenu = () => { if (active) active = null; P.maxStep = 0; };
  let lastData = 0, lastExp = 0;
  P.onFrame = (now) => {
    onFrame();
    const tab = document.querySelector('.ptab.active');
    const t = tab && tab.dataset.tab;
    if (t === 'data' && view.run === 'live' && now - lastData > 1000 && !app.paused) { lastData = now; renderData(); }
    if (t === 'experiment' && !active && now - lastExp > 1500) {
      lastExp = now;
      const tbl = document.querySelector('#tab-experiment .ptable');
      const ae = document.activeElement;
      if (tbl && !(ae && ae.closest && ae.closest('#tab-experiment'))) tbl.innerHTML = liveParams().map((p) => `<tr><td>${esc(p.label)}</td><td>${esc(p.text)}</td></tr>`).join('');
    }
  };
  P.onTab = (t) => { if (t === 'data') renderData(true); if (t === 'experiment') renderExperiment(); };
  window.addEventListener('resize', () => { if ($('#dplot') && !$('#tab-data').classList.contains('hidden')) updateDataBody(currentRun()); });
  P.experiments = { runs, fit, MODELS, stats, makeReport, exportCSV, startRun, stopRun, get cfg() { return cfg; }, get active() { return active; }, view, currentRun, renderData, renderExperiment };
})();

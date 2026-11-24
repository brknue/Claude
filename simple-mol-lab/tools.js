'use strict';
/* ==========================================================================
   Simple Mol Lab tools: statistics, least-squares fits, plots (canvas + PDF),
   a generic PDF report builder, downloads and the plain-text pass.
   Fitting and plotting are shared with Physica (same algorithms).
   ========================================================================== */
(function () {
  const U = {
    randn() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
    niceStep(range, target = 8) { const raw = Math.max(range, 1e-300) / target, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; },
  };
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  function fmtN(v, sig = 6) {
    if (!isNum(v)) return '—';
    if (v === 0) return '0';
    const a = Math.abs(v);
    if (a >= 1e6 || a < 1e-3) return v.toExponential(Math.max(1, sig - 2)).replace('e+', 'e');
    return String(+v.toPrecision(sig));
  }
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function stats(arr) {
    let n = 0, s = 0, lo = Infinity, hi = -Infinity;
    for (const v of arr) if (isNum(v)) { n++; s += v; if (v < lo) lo = v; if (v > hi) hi = v; }
    if (!n) return { n: 0 };
    const mean = s / n;
    let ss = 0;
    for (const v of arr) if (isNum(v)) ss += (v - mean) * (v - mean);
    let sd = n > 1 ? Math.sqrt(ss / (n - 1)) : 0;
    if (sd < 1e-12 * Math.max(Math.abs(mean), Math.abs(lo), Math.abs(hi))) sd = 0;
    return { n, mean, sd, sem: sd / Math.sqrt(n), min: lo, max: hi };
  }
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  const stamp = (d) => { const p = (v) => String(v).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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


  /* ---------------- generic PDF report ----------------
     spec = { title, subtitle, kind, info:[[k,v]], notes, images:[{url,w,h,caption}], sections:[{h, rows:[[k,v]]} | {h, text}],
              cols:[{name,unit,v,sd}], x, y, fit, theory:[[kind,text]] , file } */
  function imgBytes(url) { const bin = atob(url.split(',')[1]), b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b; }
  function canvasJPEG(cv, max = 1400) {
    try {
      const s = Math.min(1, max / Math.max(cv.width, cv.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(cv.width * s)); c.height = Math.max(1, Math.round(cv.height * s));
      const g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(cv, 0, 0, c.width, c.height);
      return { url: c.toDataURL('image/jpeg', 0.9), w: c.width, h: c.height };
    } catch (e) { return null; }
  }
  function report(spec) {
    const pdf = new PhysPDF({ title: String(spec.title).replace(/[—–]/g, '-') });
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
        const kl = pdf.wrap(String(k), 9.5, 'F2', w1 - 8);
        const n = Math.max(lines.length, kl.length);
        need(n * 13 + 2);
        kl.forEach((ln, i) => pdf.text(M, y + i * 13, ln, { size: 9.5, font: 'F2' }));
        lines.forEach((ln, i) => pdf.text(M + w1, y + i * 13, ln, { size: 9.5 }));
        y += n * 13 + 2;
      }
    };
    const date = new Date();
    pdf.text(M, y + 4, 'SIMPLE MOL LAB · ' + (spec.kind || 'REPORT').toUpperCase(), { size: 9, font: 'F2', color: '#555555' });
    pdf.text(M + PW, y + 4, stamp(date), { size: 9, color: '#555555', align: 'right' });
    y += 28;
    para(spec.title, { size: 19, font: 'F2', after: 2 });
    if (spec.subtitle) para(spec.subtitle, { size: 10, color: '#444444', after: 8 });
    pdf.line(M, y, M + PW, y, { color: '#000000', width: 1 }); y += 16;
    if (spec.info && spec.info.length) kv(spec.info.concat([['Source', 'Simple Mol Lab — https://brknue.github.io/Claude/simple-mol-lab/ — ' + (spec.sourceNote || 'computed or simulated in the browser, not a physical measurement')]]), 120);
    if (spec.notes) { y += 4; pdf.text(M, y, 'Notes', { size: 9.5, font: 'F2' }); para(spec.notes, { indent: 120 }); }
    let fig = 0;
    for (const im of spec.images || []) {
      if (!im || !im.url) continue;
      let w = PW, h = (im.h / im.w) * w;
      const maxH = im.maxH || 260;
      if (h > maxH) { h = maxH; w = (im.w / im.h) * h; }
      need(h + 26); y += 6;
      pdf.image(imgBytes(im.url), im.w, im.h, M + (PW - w) / 2, y, w, h);
      pdf.rect(M + (PW - w) / 2, y, w, h, { stroke: '#999999' });
      y += h + 12;
      fig++;
      para(`Figure ${fig} — ${im.caption || ''}`, { size: 8.5, color: '#555555' });
    }
    for (const s of spec.sections || []) {
      heading(s.h, s.rows ? Math.min(120, s.rows.length * 13) : 30);
      if (s.rows) kv(s.rows, s.w1 || 200);
      if (s.text) para(s.text, { font: s.mono ? 'F3' : 'F1', size: s.mono ? 8 : 9.5 });
      if (s.table) {
        const t = s.table, cw = (PW - 4) / t.head.length;
        need(14); t.head.forEach((h, i) => pdf.text(M + i * cw, y, h, { size: 8.5, font: 'F2' })); y += 4; pdf.line(M, y, M + PW, y, { color: '#999999' }); y += 11;
        for (const r of t.rows) { need(11); r.forEach((v, i) => pdf.text(M + i * cw, y, String(v), { size: 8, font: i ? 'F3' : 'F1' })); y += 10.5; }
      }
    }
    const cols = spec.cols || [];
    const n = cols[0] ? cols[0].v.length : 0;
    if (n) {
      const cx = cols.find((q) => q.name === spec.x) || cols[0];
      const cy = cols.find((q) => q.name === spec.y && q !== cx) || cols.find((q) => q !== cx && stats(q.v).max > stats(q.v).min) || cols[1];
      const F = spec.fit && !spec.fit.err ? spec.fit : null;
      if (cy) {
        heading('Main result', 270);
        drawPlot(pdfPainter(pdf), M, y, PW, 260, [{ x: cx.v, y: cy.v, sd: cy.sd, color: '#1f5fbf', name: spec.runName || 'data', line: !spec.points }], colLabel(cx), colLabel(cy), F, !!spec.logx, !!spec.logy, 9);
        y += 268; fig++;
        para(`Figure ${fig} — ${colLabel(cy)} against ${colLabel(cx)}${cy.sd ? '; error bars = ±1 SD of the replicates' : ''}${F ? '; dashed red line = least-squares fit' : ''}.`, { size: 8.5, color: '#555555' });
        if (F) {
          need(30 + 13 * (F.names.length + F.derived.length));
          pdf.text(M, y + 2, 'Fit: ' + F.label, { size: 10, font: 'F2' }); y += 16;
          for (const [nm, v, s] of F.names.map((nm, i) => [nm, F.q[i], F.se[i]]).concat(F.derived)) { pdf.text(M + 12, y, nm, { size: 9.5 }); pdf.text(M + 250, y, fmtN(v, 7), { size: 9.5, font: 'F3', align: 'right' }); pdf.text(M + 262, y, '± ' + fmtN(s, 3), { size: 9.5, font: 'F3' }); y += 12.5; }
          para(`R² = ${F.r2.toFixed(6)}, RMSE = ${fmtN(F.rmse, 4)} ${cy.unit || ''}, n = ${F.n}${spec.fitRange ? ', ' + spec.fitRange : ''}. Unweighted least squares in y; ± = 1 standard error from the covariance matrix.`, { size: 9 });
        }
      }
      heading('Summary statistics');
      const sc = [M, M + 150, M + 205, M + 240, M + 300, M + 355, M + 410, M + 460];
      need(16); ['Quantity', 'Unit', 'N', 'Mean', 'SD', 'SEM', 'Min', 'Max'].forEach((t, i) => pdf.text(sc[i], y, t, { size: 8.5, font: 'F2' })); y += 4; pdf.line(M, y, M + PW, y, { color: '#999999' }); y += 11;
      for (const col of cols) {
        const q = stats(col.v), nameL = pdf.wrap(col.name, 8.5, 'F1', 145);
        need(11 * nameL.length + 2);
        nameL.forEach((ln, i) => pdf.text(sc[0], y + i * 10.5, ln, { size: 8.5 }));
        pdf.text(sc[1], y, (col.unit || '').slice(0, 11), { size: 8.5 });
        [q.n || 0, fmtN(q.mean, 5), fmtN(q.sd, 3), fmtN(q.sem, 3), fmtN(q.min, 5), fmtN(q.max, 5)].forEach((v, i) => pdf.text(sc[i + 2], y, String(v), { size: 8, font: 'F3' }));
        y += 10.5 * nameL.length + 2.5;
      }
      const plotCols = cols.filter((q) => q !== cx && (() => { const s = stats(q.v); return s.n > 1 && s.max > s.min; })());
      if (plotCols.length > 1) {
        heading('All measured quantities', 160);
        const gw = (PW - 14) / 2, gh = 150;
        plotCols.forEach((col, i) => {
          if (i % 2 === 0) need(gh + 8);
          drawPlot(pdfPainter(pdf), M + (i % 2) * (gw + 14), y, gw, gh, [{ x: cx.v, y: col.v, sd: col.sd, color: '#1f5fbf', name: 'data', line: !spec.points }], colLabel(cx), colLabel(col), null, false, false, 7);
          if (i % 2 === 1 || i === plotCols.length - 1) y += gh + 8;
        });
      }
      heading('Data');
      const flat = [];
      cols.forEach((col) => { flat.push({ h: col.name, u: col.unit, v: col.v }); if (col.sd) flat.push({ h: col.name + ' SD', u: col.unit, v: col.sd }); });
      const MAXROWS = 5000, stepR = Math.max(1, Math.ceil(n / MAXROWS));
      para(stepR > 1 ? `The data set has ${n} rows; every ${stepR}th row is printed. The CSV export contains all of them.` : `All ${n} rows, 6 significant digits (CSV and JSON keep full precision).`, { size: 9 });
      const CW = 11 * 4.8 + 6, perBlock = Math.max(1, Math.floor((PW - 30) / CW));
      for (let b0 = 0; b0 < flat.length; b0 += perBlock) {
        const blk = flat.slice(b0, b0 + perBlock);
        const head = () => {
          const hl = blk.map((c) => pdf.wrap(c.h, 7, 'F2', CW - 4).slice(0, 3)), rowsH = Math.max(...hl.map((l) => l.length));
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
    }
    if (spec.mono && spec.mono.text) {
      heading(spec.mono.h || 'Sequence');
      for (const ln of String(spec.mono.text).split('\n')) { need(9.5); pdf.text(M, y, ln, { size: 7.5, font: 'F3' }); y += 9.5; }
    }
    if (spec.theory && spec.theory.length) {
      heading(spec.theoryTitle || 'Model and method');
      for (const [kind, t] of spec.theory) {
        if (kind === 'h') { need(24); y += 6; pdf.text(M, y, t, { size: 10.5, font: 'F2' }); y += 14; }
        else if (kind === 'eq') para(t, { font: 'F3', size: 8.5, indent: 14 });
        else if (kind === 'li') para('• ' + t, { indent: 8, size: 9.5, after: 1 });
        else para(t, { size: 9.5 });
      }
    }
    const total = pdf.pageCount;
    pdf.pages.forEach((pg, i) => {
      pdf.cur = pg;
      pdf.line(M, pdf.H - 34, M + PW, pdf.H - 34, { color: '#bbbbbb', width: 0.5 });
      pdf.text(M, pdf.H - 22, `Simple Mol Lab · ${spec.title}`, { size: 7.5, color: '#666666' });
      pdf.text(M + PW, pdf.H - 22, `page ${i + 1} of ${total}`, { size: 7.5, color: '#666666', align: 'right' });
    });
    download(pdf.output(), (spec.file || 'simple-mol-lab-' + slug(spec.title)) + '-' + date.toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.pdf');
    return total;
  }
  function csv(cols, title) {
    const n = cols[0] ? cols[0].v.length : 0;
    const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    const head = [];
    for (const c of cols) { head.push(q(c.name + (c.unit ? ` [${c.unit}]` : ''))); if (c.sd) head.push(q(c.name + ' SD' + (c.unit ? ` [${c.unit}]` : ''))); }
    let out = `# Simple Mol Lab — ${title}\n# exported ${stamp(new Date())}\n` + head.join(',') + '\n';
    for (let i = 0; i < n; i++) { const r = []; for (const c of cols) { r.push(isNum(c.v[i]) ? c.v[i] : ''); if (c.sd) r.push(isNum(c.sd[i]) ? c.sd[i] : ''); } out += r.join(',') + '\n'; }
    return out;
  }
  function htmlToBlocks(html) {
    const d = document.createElement('div'); d.innerHTML = html || ''; const out = [];
    for (const n of d.children) {
      const t = (n.textContent || '').replace(/\s+/g, ' ').trim(); if (!t) continue;
      if (/^H\d$/.test(n.tagName)) out.push(['h', t]); else if (n.classList.contains('eq')) out.push(['eq', t]);
      else if (n.tagName === 'UL') for (const li of n.children) out.push(['li', li.textContent.replace(/\s+/g, ' ').trim()]);
      else if (n.tagName === 'TABLE') for (const tr of n.querySelectorAll('tr')) out.push(['eq', [...tr.children].map((c) => c.textContent.trim()).join('   ')]);
      else out.push(['p', t]);
    }
    return out;
  }
  const colLabel = (c) => c.name + (c.unit ? ` (${c.unit})` : '');

  /* ---------------- plain text: drop decorative emoji from labels (icon-only buttons keep theirs) ---------------- */
  const EMO = /(?:[\u{1F000}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{2B00}-\u{2BFF}]|[\u{23E9}-\u{23FA}]|\u{2328}|\u{231A}|\u{231B}|[\u{FE0F}\u{200D}])+\s*/gu;
  const EMO1 = new RegExp(EMO.source, 'u');
  function plainNode(t) {
    const v = t.nodeValue;
    if (!v || !EMO1.test(v)) return;
    const p = t.parentElement; if (!p || p.closest('canvas,textarea,script,style')) return;
    const nv = v.replace(EMO, '');
    if (!nv.trim()) return; // icon-only text (e.g. a close cross) stays
    t.nodeValue = nv;
  }
  function plainPass(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let t; while ((t = w.nextNode())) plainNode(t);
  }
  let pt = null;
  new MutationObserver(() => { clearTimeout(pt); pt = setTimeout(() => plainPass(document.body), 60); }).observe(document.body, { childList: true, subtree: true, characterData: true });
  plainPass(document.body);

  window.SML = { U, isNum, fmtN, esc, stats, fit, MODELS, drawPlot, canvasPainter, colLabel, download, stamp, slug, report, csv, canvasJPEG, htmlToBlocks };
})();

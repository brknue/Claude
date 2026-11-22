'use strict';
/* Fraunhofer diffraction: single slit, double slit, N-slit grating, circular aperture; photon counting detector */
PhysLab.define({
  id: 'diffraction',
  title: 'Diffraction & Interference',
  subtitle: 'Fraunhofer patterns of slits, gratings and circular apertures with real wavelengths and sizes; scanning photon-counting detector.',
  color: '#1f5fbf',
  cat: 'Waves & Optics',
  tags: ['Diffraction', 'Interference', 'Grating', 'Airy disc', 'Photon counting'],
  hint: 'Choose aperture, wavelength and sizes · drag on the screen or the plot to move the detector · turn on photon mode to build the pattern photon by photon',
  howto: [
    'The pattern is computed from the Fraunhofer (far-field) formulas for the given wavelength, slit width a, slit separation d and screen distance L.',
    '<b>Drag</b> on the screen image or the intensity plot to move the detector; its readouts give position, angle and relative intensity.',
    '<b>Photon mode</b> sends single photons that land at random positions with probability ∝ I(y): the pattern builds up from noise, and the detector counts photons in its window (Poisson statistics).',
    'Experiment tab → “Detector scan” records the full intensity profile as data for fitting.',
  ],
  theory: `
  <h3>Fraunhofer intensity</h3>
  <div class="eq">Single slit: I = I₀ (sin β / β)²,  β = π a sinθ / λ</div>
  <div class="eq">N slits:  I = I₀ (sin β / β)² · (sin Nγ / N sin γ)²,  γ = π d sinθ / λ</div>
  <div class="eq">Circular aperture (diameter D): I = I₀ (2 J₁(x)/x)²,  x = π D sinθ / λ</div>
  <h3>Positions on the screen (y = L tan θ)</h3>
  <div class="eq">Single-slit minima: a sinθ = mλ  (m = ±1, ±2 …)</div>
  <div class="eq">Grating maxima: d sinθ = mλ,   fringe spacing (small θ) Δy ≈ λL/d</div>
  <div class="eq">Airy disc: first dark ring at sinθ = 1.2197 λ/D  (Rayleigh criterion)</div>
  <div class="eq">Grating resolving power R = λ/Δλ = mN</div>
  <p>The far-field condition requires L ≫ a²/λ (Fraunhofer distance); the readout shows the ratio. J₁ is evaluated by numerical integration of Bessel’s integral.</p>`,
  experiment: { duration: 20, interval: 0.1, param: 'Detector position y', from: -20, to: 20, points: 81, settle: 0, measure: 0.25, stat: 'mean' },
  protocols: [
    { t: 'Detector scan of a double slit', h: 'Sweep the detector across the screen and record I/I₀. Fit nothing — compare the fringe spacing with λL/d, and the envelope minima with λL/a.', setup: { set: { Aperture: 'double', 'Photon mode': false }, mode: 'sweep', param: 'Detector position y', from: -20, to: 20, points: 161, settle: 0, measure: 0.05, stat: 'mean', y: 'Relative intensity I/I₀' } },
    { t: 'Measure a wavelength with a grating', h: 'Grating, sweep λ and record the position of the first-order maximum. Plot y₁ against λ: the slope is L/d for small angles.', setup: { set: { Aperture: 'grating' }, mode: 'sweep', param: 'Wavelength λ', from: 400, to: 700, points: 13, settle: 0, measure: 0.05, stat: 'final', y: 'First order maximum y₁', fit: 'linear' } },
    { t: 'Single-slit width from the central peak', h: 'Single slit, sweep the slit width and record the first-minimum position y₁. A power law gives exponent −1 (y₁ = λL/a).', setup: { set: { Aperture: 'single' }, mode: 'sweep', param: 'Slit width / diameter a', from: 20, to: 400, points: 12, logSpace: true, settle: 0, measure: 0.05, stat: 'final', y: 'First minimum y₁', fit: 'power' } },
    { t: 'Photon counting statistics', h: 'Photon mode, park the detector on the central maximum and record its count rate for 30 s: the fluctuations are Poissonian (SD ≈ √mean of the counts per interval).', setup: { set: { 'Photon mode': true, 'Detector position y': 0 }, mode: 'time', duration: 30, interval: 1, reset: true, y: 'Detector counts (last s)' } },
  ],

  create(env) {
    const { ui } = env;
    const S = { ap: 'double', lam: 532, a: 40, d: 200, N: 10, L: 1, half: 25, det: 0, win: 0.5, photons: false, rate: 2000 };
    const NP = 801;
    let prof = new Float64Array(NP), cdf = new Float64Array(NP), hits = new Float32Array(NP), nHits = 0;
    const airy = { c: null, key: '' };
    let detCounts = [], detSecond = 0, detNow = 0, detLast = NaN, tt = 0, dragging = false;
    const lamM = () => S.lam * 1e-9, aM = () => S.a * 1e-6, dM = () => S.d * 1e-6;
    function J1(x) {
      if (Math.abs(x) < 1e-8) return x / 2;
      const n = Math.max(64, Math.min(2000, Math.ceil(Math.abs(x) * 4)) | 1);
      let s = 0;
      for (let k = 0; k <= n; k++) { const tau = (Math.PI * k) / n, w = k === 0 || k === n ? 1 : k % 2 ? 4 : 2; s += w * Math.cos(tau - x * Math.sin(tau)); }
      return (s * (Math.PI / n)) / 3 / Math.PI;
    }
    function I(yM) {
      const th = Math.atan2(yM, S.L), st = Math.sin(th);
      if (S.ap === 'circ') { const x = (Math.PI * aM() * st) / lamM(); const v = Math.abs(x) < 1e-9 ? 1 : (2 * J1(x)) / x; return v * v; }
      const beta = (Math.PI * aM() * st) / lamM(), env1 = Math.abs(beta) < 1e-12 ? 1 : (Math.sin(beta) / beta) ** 2;
      if (S.ap === 'single') return env1;
      const n = S.ap === 'double' ? 2 : Math.round(S.N), g = (Math.PI * dM() * st) / lamM(), sg = Math.sin(g);
      const arr = Math.abs(sg) < 1e-9 ? 1 : (Math.sin(n * g) / (n * sg)) ** 2;
      return env1 * arr;
    }
    function compute() {
      let s = 0;
      for (let i = 0; i < NP; i++) { const y = ((i / (NP - 1)) * 2 - 1) * S.half * 1e-3; prof[i] = I(y); s += prof[i]; cdf[i] = s; }
      for (let i = 0; i < NP; i++) cdf[i] /= s || 1;
    }
    function clearHits() { hits.fill(0); nHits = 0; detCounts = []; detNow = 0; detSecond = 0; detLast = NaN; }
    function reset() { compute(); clearHits(); tt = 0; }
    const yIndex = (ymm) => Math.round(((ymm / S.half + 1) / 2) * (NP - 1));
    function firstMin() {
      if (S.ap === 'circ') { const s = (1.2197 * lamM()) / aM(); return s < 1 ? S.L * Math.tan(Math.asin(s)) * 1e3 : NaN; }
      const s = lamM() / aM(); return s < 1 ? S.L * Math.tan(Math.asin(s)) * 1e3 : NaN;
    }
    function order1() { if (S.ap === 'single' || S.ap === 'circ') return NaN; const s = lamM() / dM(); return s < 1 ? S.L * Math.tan(Math.asin(s)) * 1e3 : NaN; }

    ui.section('Aperture');
    ui.select('Aperture', [['single', 'Single slit'], ['double', 'Double slit'], ['grating', 'N-slit grating'], ['circ', 'Circular aperture (Airy)']], S.ap, (v) => { S.ap = v; reset(); });
    ui.slider('Wavelength λ', { min: 200, max: 1600, step: 1, value: S.lam, fmt: (v) => v + ' nm', onInput: (v) => { S.lam = v; reset(); } });
    ui.slider('Slit width / diameter a', { min: 1, max: 1000, value: S.a, log: true, fmt: (v) => v.toPrecision(3) + ' µm', onInput: (v) => { S.a = v; reset(); } });
    ui.slider('Slit separation d', { min: 2, max: 5000, value: S.d, log: true, fmt: (v) => v.toPrecision(3) + ' µm', onInput: (v) => { S.d = v; reset(); } });
    ui.slider('Number of slits N', { min: 2, max: 200, step: 1, value: S.N, fmt: (v) => v + '', onInput: (v) => { S.N = v; reset(); } });
    ui.section('Screen and detector');
    ui.slider('Screen distance L', { min: 0.05, max: 10, value: S.L, log: true, fmt: (v) => v.toPrecision(3) + ' m', onInput: (v) => { S.L = v; reset(); } });
    ui.slider('Screen half-width', { min: 0.5, max: 500, value: S.half, log: true, fmt: (v) => v.toPrecision(3) + ' mm', onInput: (v) => { S.half = v; reset(); } });
    ui.slider('Detector position y', { min: -500, max: 500, step: 0.01, value: S.det, fmt: (v) => v.toFixed(2) + ' mm', onInput: (v) => (S.det = v) });
    ui.slider('Detector window width', { min: 0.01, max: 10, value: S.win, log: true, fmt: (v) => v.toPrecision(2) + ' mm', onInput: (v) => (S.win = v) });
    ui.section('Photon mode');
    ui.toggle('Photon mode', S.photons, (v) => { S.photons = v; clearHits(); });
    ui.slider('Photon rate', { min: 10, max: 200000, value: S.rate, log: true, fmt: (v) => Math.round(v) + ' /s', onInput: (v) => (S.rate = v) });
    ui.buttons([{ label: 'Clear photons', onClick: clearHits }]);
    reset();
    const detP = () => PhysLab.internal.reg.params.find((p) => p.label === 'Detector position y');

    const layout = () => { const W = env.W, H = env.H; const sh = Math.min(200, H * 0.34); return { sx: 50, sw: W - 66, sy: 30, sh, py: 30 + sh + 16, ph: H - (30 + sh + 16) - 8 }; };
    function setDetFromX(px) { const G = layout(); const y = ((px - G.sx) / G.sw * 2 - 1) * S.half; const p = detP(); if (p) p.set(+y.toFixed(3)); }

    return {
      reset,
      step(dt) {
        tt += dt;
        if (!S.photons) return;
        const n = Math.min(20000, Math.round(S.rate * dt + (Math.random() < (S.rate * dt) % 1 ? 1 : 0)));
        const di0 = yIndex(S.det - S.win / 2), di1 = yIndex(S.det + S.win / 2);
        for (let k = 0; k < n; k++) {
          const u = Math.random();
          let lo = 0, hi = NP - 1;
          while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] < u) lo = m + 1; else hi = m; }
          hits[lo]++; nHits++;
          if (lo >= di0 && lo <= di1) detNow++;
        }
        detSecond += dt;
        if (detSecond >= 1) { detLast = detNow; detNow = 0; detSecond -= 1; }
      },
      pointerdown(p) { dragging = true; setDetFromX(p.x); },
      pointermove(p) { if (dragging) setDetFromX(p.x); },
      pointerup() { dragging = false; },
      draw(ctx) {
        const W = env.W, G = layout();
        ctx.fillStyle = '#111214'; ctx.fillRect(0, 0, W, env.H);
        const [r, g, b] = S.lam >= 380 && S.lam <= 780 ? U.wl2rgb(S.lam) : [220, 220, 220];
        U.label(ctx, G.sx, 14, `Screen at L = ${S.L.toPrecision(3)} m · λ = ${S.lam} nm${S.lam < 380 ? ' (UV, false colour)' : S.lam > 780 ? ' (IR, false colour)' : ''}`, '#d4d7dc');
        // screen image
        if (S.photons) {
          let mx = 1; for (let i = 0; i < NP; i++) if (hits[i] > mx) mx = hits[i];
          for (let i = 0; i < NP; i++) { const v = Math.sqrt(hits[i] / mx); ctx.fillStyle = `rgb(${(r * v) | 0},${(g * v) | 0},${(b * v) | 0})`; ctx.fillRect(G.sx + (i / NP) * G.sw, G.sy, G.sw / NP + 1, G.sh); }
        } else if (S.ap === 'circ') {
          const key = [S.lam, S.a, S.L, S.half, Math.round(G.sw), Math.round(G.sh)].join();
          if (!airy.c || airy.key !== key) {
            const w = Math.max(10, Math.round(Math.min(G.sw, 700))), h = Math.max(10, Math.round(w * (G.sh / G.sw)));
            const c = airy.c || document.createElement('canvas'); c.width = w; c.height = h;
            const g2 = c.getContext('2d'), img = g2.createImageData(w, h);
            for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
              const rr = Math.hypot((px - w / 2) / (w / 2), (py - h / 2) / (w / 2)), idx = Math.min(NP - 1, Math.round(((rr + 1) / 2) * (NP - 1)));
              const v = Math.pow(prof[idx], 0.35), o = (py * w + px) * 4;
              img.data[o] = r * v; img.data[o + 1] = g * v; img.data[o + 2] = b * v; img.data[o + 3] = 255;
            }
            g2.putImageData(img, 0, 0); airy.c = c; airy.key = key;
          }
          ctx.imageSmoothingEnabled = true; ctx.drawImage(airy.c, G.sx, G.sy, G.sw, G.sh);
        } else {
          for (let i = 0; i < NP; i++) { const v = Math.pow(prof[i], 0.45); ctx.fillStyle = `rgb(${(r * v) | 0},${(g * v) | 0},${(b * v) | 0})`; ctx.fillRect(G.sx + (i / NP) * G.sw, G.sy, G.sw / NP + 1, G.sh); }
        }
        ctx.strokeStyle = '#666'; ctx.strokeRect(G.sx, G.sy, G.sw, G.sh);
        const dxp = G.sx + ((S.det / S.half + 1) / 2) * G.sw, wpx = Math.max(2, (S.win / (2 * S.half)) * G.sw);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(dxp - wpx / 2, G.sy - 4, wpx, G.sh + 8);
        // intensity plot
        if (G.ph > 60) {
          const xs = [], ys = [];
          for (let i = 0; i < NP; i++) { xs.push(((i / (NP - 1)) * 2 - 1) * S.half); ys.push(prof[i]); }
          const F = U.plot(ctx, 4, G.py, W - 8, G.ph, { x0: -S.half, x1: S.half, y0: 0, y1: 1.08, xl: 'position on screen y (mm)', yl: 'I / I₀', title: S.photons ? `Theory (line) and photon histogram (dots) — ${nHits} photons` : 'Relative intensity I(y) / I₀' });
          F.clip();
          U.curve(ctx, F, xs, ys, `rgb(${r},${g},${b})`, 1.8);
          if (S.photons && nHits) {
            const bins = 160, hb = new Float64Array(bins);
            for (let i = 0; i < NP; i++) hb[Math.min(bins - 1, Math.floor((i / NP) * bins))] += hits[i];
            let mx = 0; for (const v of hb) mx = Math.max(mx, v);
            ctx.fillStyle = '#ffd43b';
            for (let k = 0; k < bins; k++) { const x = ((k + 0.5) / bins * 2 - 1) * S.half; ctx.beginPath(); ctx.arc(F.sx(x), F.sy(hb[k] / mx), 2, 0, U.TAU); ctx.fill(); }
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(F.sx(S.det), F.T); ctx.lineTo(F.sx(S.det), F.B); ctx.stroke(); ctx.setLineDash([]);
          ctx.restore();
        }
      },
      readouts() {
        const yM = S.det * 1e-3, th = Math.atan2(yM, S.L), fm = firstMin(), o1 = order1();
        const out = [
          ['Detector position y', S.det.toFixed(3) + ' mm'], ['Angle θ', (th * 1000).toFixed(4) + ' mrad'], ['Relative intensity I/I₀', I(yM).toExponential(4)],
          ['First minimum y₁', isFinite(fm) ? fm.toPrecision(5) + ' mm' : '—'],
          ['Central max full width', isFinite(fm) ? (2 * fm).toPrecision(5) + ' mm' : '—'],
        ];
        if (S.ap !== 'single' && S.ap !== 'circ') {
          out.push(['First order maximum y₁', isFinite(o1) ? o1.toPrecision(5) + ' mm' : '—'], ['Fringe spacing λL/d', ((lamM() * S.L) / dM() * 1e3).toPrecision(5) + ' mm'], ['Highest order m_max', Math.floor(dM() / lamM())]);
          if (S.ap === 'grating') out.push(['Resolving power (m=1) N', Math.round(S.N)], ['Lines per mm', (1000 / S.d).toPrecision(4)]);
        }
        if (S.ap === 'circ') out.push(['Angular resolution 1.22λ/D', ((1.2197 * lamM()) / aM() * 1e6).toPrecision(5) + ' µrad']);
        out.push(['Fraunhofer ratio L·λ/a²', ((S.L * lamM()) / (aM() * aM())).toPrecision(3)], ['Photon energy', (1239.84 / S.lam).toFixed(4) + ' eV']);
        if (S.photons) out.push(['Photons detected (total)', nHits], ['Detector counts (last s)', isFinite(detLast) ? detLast : '—']);
        return out;
      },
    };
  },
});

'use strict';
/* LAB 15 — Strings & Sound: 1D wave equation on a string, live Fourier analysis, resonance driver and Web Audio output */
PhysLab.define({
  id: 'string',
  cat: 'Waves & Optics',
  title: 'Strings & Sound',
  subtitle: 'Pluck a string, see its harmonics appear in a live spectrum — and hear the exact tone it would make.',
  color: '#e879f9',
  tags: ['Standing waves', 'Fourier analysis', 'Acoustics'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 32c9-22 19-22 28 0s19 22 28 0"/><path d="M4 32c9 22 19 22 28 0s19-22 28 0" opacity=".45"/><circle cx="4" cy="32" r="3" fill="currentColor"/><circle cx="60" cy="32" r="3" fill="currentColor"/><path d="M14 54v-6M22 54v-12M30 54v-4M38 54v-9M46 54v-3" stroke-width="4"/></svg>`,
  hint: 'Drag the string and let go to pluck it · click a spectrum bar to add that harmonic · turn on Sound to hear it',
  howto: [
    '<b>Drag the string</b> anywhere and release to pluck it. Plucking near the end gives a brighter tone (more high harmonics).',
    '<b>Click a bar</b> in the spectrum to add that harmonic; the mode buttons set a pure standing wave.',
    'Turn on <b>Sound</b> to hear the string: each harmonic drives a sine oscillator at its real frequency.',
    'Turn on the <b>driver</b> and slowly sweep its frequency — at 1, 2, 3… × f₁ the string resonates.',
  ],
  theory: `
  <h3>Wave equation on a string</h3>
  <div class="eq">∂²y/∂t² = c² ∂²y/∂x² ,   c = √(T/μ)</div>
  <p>T is the tension and μ the mass per metre. The simulation uses a leapfrog scheme at a Courant number just below 1, which follows the exact travelling-wave solution very closely.</p>
  <h3>Standing waves &amp; harmonics</h3>
  <div class="eq">fₙ = n · c / 2L        (both ends fixed, n = 1, 2, 3…)</div>
  <div class="eq">fₙ = (2n − 1) · c / 4L   (one end free — odd harmonics only)</div>
  <p>Only waves that fit between the ends survive. Tighten the string or shorten it and the pitch rises — exactly how guitars and violins are tuned and played.</p>
  <h3>Fourier analysis</h3>
  <div class="eq">y(x,t) = Σ Aₙ sin(nπx/L) cos(2πfₙt + φₙ)</div>
  <p>Any shape is a sum of harmonics. A string plucked at its centre has only odd harmonics with amplitudes ∝ 1/n²; pluck at 1/n of the length and the n-th harmonic vanishes. The mix of harmonics is the <b>timbre</b> — why a guitar and a flute sound different on the same note.</p>
  <h3>Resonance</h3>
  <p>Shake one end at exactly a harmonic frequency and each push arrives in step with the reflected wave: the amplitude builds up until damping balances the input.</p>`,

  create(env) {
    const { ui } = env;
    const N = 240, NM = 16, TAU = U.TAU, CO = 0.985;
    const S = { fv: 0.8, damp: 0.15, bc: 'fixed', L: 0.65, T: 70, mu: 1.2, sound: false, vol: 0.5, drive: false, fd: 1, dA: 0.06, env: true };
    let y = new Float32Array(N + 1), yp = new Float32Array(N + 1), yn = new Float32Array(N + 1);
    const peak = new Float32Array(N + 1), amp = new Float32Array(NM);
    let t = 0, accum = 0, grab = null, audio = null, bars = [];

    const kn = (n) => (S.bc === 'fixed' ? n * Math.PI : (n - 0.5) * Math.PI);
    const ratio = (n) => (S.bc === 'fixed' ? n : 2 * n - 1);
    const fBase = () => (Math.sqrt(S.T / (S.mu / 1000)) / (2 * S.L)) * (S.bc === 'fixed' ? 1 : 0.5); // Hz of mode 1
    const cVis = () => 2 * S.fv; // string length = 1, visual f1 (fixed) = fv

    function setShape(fn) { for (let j = 0; j <= N; j++) { y[j] = fn(j / N); yp[j] = y[j]; } y[0] = yp[0] = 0; if (S.bc === 'fixed') y[N] = yp[N] = 0; peak.fill(0); }
    function mode(n, A = 0.6) { setShape((x) => A * Math.sin(kn(n) * x)); }
    function addMode(n, A) { for (let j = 0; j <= N; j++) { const d = A * Math.sin(kn(n) * (j / N)); y[j] += d; yp[j] += d; } }
    function pluckShape(xg, yg) { setShape((x) => (x < xg ? (yg * x) / xg : S.bc === 'fixed' ? (yg * (1 - x)) / (1 - xg) : yg)); }

    function simStep() {
      // centred (energy-stable) damping; Courant number just below 1 for a stability margin
      const dt = CO / (N * cVis()), g = S.damp * dt, C2 = CO * CO, ig = 1 / (1 + g);
      t += dt;
      for (let j = 1; j < N; j++) yn[j] = (2 * y[j] - (1 - g) * yp[j] + C2 * (y[j - 1] + y[j + 1] - 2 * y[j])) * ig;
      yn[0] = S.drive ? S.dA * Math.sin(TAU * S.fd * S.fv * (S.bc === 'fixed' ? 1 : 0.5) * t) : 0;
      yn[N] = S.bc === 'fixed' ? 0 : yn[N - 1];
      const tmp = yp; yp = y; y = yn; yn = tmp;
      if (grab) for (let j = 0; j <= N; j++) { y[j] = grab.shape[j]; yp[j] = y[j]; }
    }
    function analyse() {
      const dt = CO / (N * cVis());
      let e = 0;
      for (let n = 1; n <= NM; n++) {
        const k = kn(n), w = k * cVis();
        let a = 0, b = 0;
        for (let j = 1; j <= N; j++) { const sn = Math.sin(k * (j / N)); a += y[j] * sn; b += ((y[j] - yp[j]) / dt) * sn; }
        a *= 2 / N; b *= 2 / N / w;
        amp[n - 1] = Math.hypot(a, b);
        e += amp[n - 1] * amp[n - 1] * n * n;
      }
      return e;
    }

    /* ---------- audio ---------- */
    function startAudio() {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        const ac = new AC(), master = ac.createGain();
        master.gain.value = 0; master.connect(ac.destination);
        const osc = [];
        for (let n = 1; n <= NM; n++) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; g.gain.value = 0; o.connect(g); g.connect(master); o.start(); osc.push({ o, g }); }
        audio = { ac, master, osc };
      } catch (e) { env.toast('Audio is not available in this browser'); S.sound = false; soundT.set(false); }
    }
    function updateAudio() {
      if (!audio) return;
      const now = audio.ac.currentTime, f0 = fBase();
      audio.master.gain.setTargetAtTime(S.sound && !env.paused ? S.vol * 0.35 : 0, now, 0.05);
      audio.osc.forEach((v, i) => {
        const f = f0 * ratio(i + 1);
        v.o.frequency.setTargetAtTime(Math.min(f, 16000), now, 0.02);
        v.g.gain.setTargetAtTime(f < 15000 ? Math.min(0.6, amp[i] * 0.9) : 0, now, 0.03);
      });
    }
    const noteName = (f) => { if (!(f > 0)) return '—'; const m = Math.round(12 * Math.log2(f / 440) + 69); return ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); };

    /* ---------- UI ---------- */
    ui.section('Sound');
    const soundT = ui.toggle('🔊 Sound on', S.sound, (v) => { S.sound = v; if (v && !audio) startAudio(); if (audio && audio.ac.state === 'suspended') audio.ac.resume(); });
    ui.slider('Volume', { min: 0, max: 1, value: S.vol, fmt: (v) => Math.round(v * 100) + ' %', onInput: (v) => (S.vol = v) });
    ui.section('Excite the string');
    ui.buttons([1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ label: 'Mode ' + n, onClick: () => mode(n, 0.6 / Math.sqrt(n)) })));
    ui.buttons([
      { label: 'Pluck centre', onClick: () => pluckShape(0.5, 0.6) }, { label: 'Pluck near end', onClick: () => pluckShape(0.12, 0.5) },
      { label: 'Pluck at 1/3', onClick: () => pluckShape(1 / 3, 0.55) },
      { label: 'Travelling pulse', onClick: () => { setShape((x) => 0.6 * Math.exp(-((x - 0.25) ** 2) / 0.002)); for (let j = 1; j < N; j++) yp[j] = 0.6 * Math.exp(-((j / N - 0.25 + CO / N) ** 2) / 0.002); } },
      { label: 'Square-ish', onClick: () => { setShape(() => 0); for (let n = 1; n <= 15; n += 2) addMode(n, 0.6 / n); } },
      { label: 'Silence', onClick: () => setShape(() => 0) },
    ]);
    ui.section('The string (sets the pitch)');
    ui.slider('Length L', { min: 0.2, max: 1.5, step: 0.005, value: S.L, fmt: (v) => (v * 100).toFixed(1) + ' cm', onInput: (v) => (S.L = v) });
    ui.slider('Tension T', { min: 10, max: 300, step: 1, value: S.T, fmt: (v) => v + ' N', onInput: (v) => (S.T = v) });
    ui.slider('Mass per metre μ', { min: 0.3, max: 12, value: S.mu, log: true, fmt: (v) => v.toFixed(2) + ' g/m', onInput: (v) => (S.mu = v) });
    ui.select('Right end', [['fixed', 'Fixed (guitar string)'], ['free', 'Free (odd harmonics)']], S.bc, (v) => { S.bc = v; setShape(() => 0); });
    ui.slider('Damping', { min: 0, max: 2, step: 0.01, value: S.damp, fmt: (v) => v.toFixed(2), onInput: (v) => (S.damp = v) });
    ui.section('Resonance driver (left end)');
    ui.toggle('Shake the left end', S.drive, (v) => (S.drive = v));
    ui.slider('Driver frequency', { min: 0.3, max: 8.5, step: 0.01, value: S.fd, fmt: (v) => v.toFixed(2) + ' × f₁', onInput: (v) => (S.fd = v) });
    ui.slider('Driver amplitude', { min: 0.01, max: 0.2, step: 0.005, value: S.dA, fmt: (v) => v.toFixed(3), onInput: (v) => (S.dA = v) });
    ui.section('Display');
    ui.slider('Slow-motion speed (visual f₁)', { min: 0.1, max: 4, value: S.fv, log: true, fmt: (v) => v.toFixed(2) + ' Hz', onInput: (v) => (S.fv = v) });
    ui.toggle('Show vibration envelope', S.env, (v) => (S.env = v));

    pluckShape(0.22, 0.55);

    const geo = () => { const W = env.W, H = env.H; return { x0: 50, x1: W - 50, cy: H * 0.36, A: Math.min(H * 0.27, 220), sy: H * 0.68, sh: H * 0.24 }; };

    return {
      step(dt) {
        accum += (Math.min(dt, 0.05) * N * cVis()) / CO;
        let n = 0;
        while (accum >= 1 && n < 400) { simStep(); accum -= 1; n++; }
        if (n >= 400) accum = 0;
        for (let j = 0; j <= N; j++) { const a = Math.abs(y[j]); peak[j] = a > peak[j] ? a : peak[j] * 0.992; }
      },
      draw(ctx) {
        const W = env.W, H = env.H, G = geo();
        const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#100818'); bg.addColorStop(1, '#06040c');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        analyse(); updateAudio();
        const X = (j) => G.x0 + (j / N) * (G.x1 - G.x0), Y = (v) => G.cy - U.clamp(v, -1.2, 1.2) * G.A;
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(G.x0, G.cy); ctx.lineTo(G.x1, G.cy); ctx.stroke();
        if (S.env) {
          ctx.fillStyle = 'rgba(232,121,249,0.10)'; ctx.beginPath(); ctx.moveTo(X(0), Y(peak[0]));
          for (let j = 1; j <= N; j++) ctx.lineTo(X(j), Y(peak[j]));
          for (let j = N; j >= 0; j--) ctx.lineTo(X(j), Y(-peak[j]));
          ctx.fill();
        }
        // the string
        for (const [lw, col] of [[9, 'rgba(232,121,249,0.15)'], [4, 'rgba(240,160,255,0.5)'], [1.8, '#fff']]) {
          ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.beginPath();
          for (let j = 0; j <= N; j++) j ? ctx.lineTo(X(j), Y(y[j])) : ctx.moveTo(X(0), Y(y[0]));
          ctx.stroke();
        }
        // supports
        ctx.fillStyle = '#cbd5e1';
        U.rrect(ctx, G.x0 - 12, Y(y[0]) - 14, 12, 28, 3); ctx.fill();
        if (S.bc === 'fixed') { U.rrect(ctx, G.x1, G.cy - 14, 12, 28, 3); ctx.fill(); }
        else { ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(G.x1 + 4, G.cy - G.A * 0.8); ctx.lineTo(G.x1 + 4, G.cy + G.A * 0.8); ctx.stroke(); ctx.beginPath(); ctx.arc(G.x1 + 4, Y(y[N]), 6, 0, TAU); ctx.stroke(); }
        if (S.drive) { ctx.fillStyle = '#fbbf24'; ctx.font = '11px Segoe UI, sans-serif'; ctx.textBaseline = 'bottom'; ctx.fillText('driver', G.x0 - 24, G.cy - G.A * 0.5); }
        // spectrum
        const f0 = fBase(), bw = (G.x1 - G.x0) / NM;
        U.panel(ctx, G.x0 - 14, G.sy - 30, G.x1 - G.x0 + 28, G.sh + 62, 'Harmonic spectrum — click a bar to add that harmonic');
        let mx = 0.05; for (let n = 0; n < NM; n++) mx = Math.max(mx, amp[n]);
        bars = [];
        ctx.font = '10.5px Consolas, monospace'; ctx.textAlign = 'center';
        for (let n = 0; n < NM; n++) {
          const x = G.x0 + n * bw + 4, h = (amp[n] / mx) * (G.sh - 14);
          const [r, g, b] = U.hsl2rgb(290 - n * 16, 0.9, 0.62);
          ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(x, G.sy, bw - 8, G.sh);
          ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(x, G.sy + G.sh - h, bw - 8, h);
          ctx.fillStyle = '#c9d6f5'; ctx.textBaseline = 'top';
          ctx.fillText('n=' + ratio(n + 1), x + (bw - 8) / 2, G.sy + G.sh + 4);
          const f = f0 * ratio(n + 1);
          ctx.fillStyle = '#8d9cc4'; ctx.fillText(f >= 1000 ? (f / 1000).toFixed(2) + 'k' : f.toFixed(0), x + (bw - 8) / 2, G.sy + G.sh + 17);
          bars.push([x, G.sy, bw - 8, G.sh, n + 1]);
        }
        ctx.textAlign = 'left';
        // headline
        ctx.fillStyle = '#f5d0fe'; ctx.font = '600 15px Segoe UI, sans-serif'; ctx.textBaseline = 'top';
        ctx.fillText(`f₁ = ${f0.toFixed(1)} Hz  (${noteName(f0)})`, 16, 14);
        ctx.fillStyle = '#9fb3e0'; ctx.font = '12px Segoe UI, sans-serif';
        ctx.fillText(`shown ${(f0 / (S.fv * (S.bc === 'fixed' ? 1 : 0.5))).toFixed(0)}× slower than real life` + (S.sound ? '' : '  ·  sound is off'), 16, 36);
      },
      pointerdown(p) {
        for (const b of bars) if (p.x >= b[0] && p.x <= b[0] + b[2] && p.y >= b[1] && p.y <= b[1] + b[3] + 30) { addMode(b[4], 0.35 / Math.sqrt(b[4])); return; }
        const G = geo();
        if (p.y < G.sy - 34 && p.x > G.x0 && p.x < G.x1) { grab = { shape: new Float32Array(N + 1) }; this.pointermove(p); }
      },
      pointermove(p) {
        if (!grab) return;
        const G = geo(), xg = U.clamp((p.x - G.x0) / (G.x1 - G.x0), 0.02, 0.98), yg = U.clamp((G.cy - p.y) / G.A, -1.1, 1.1);
        for (let j = 0; j <= N; j++) { const x = j / N; grab.shape[j] = x < xg ? (yg * x) / xg : S.bc === 'fixed' ? (yg * (1 - x)) / (1 - xg) : yg; }
        for (let j = 0; j <= N; j++) { y[j] = grab.shape[j]; yp[j] = y[j]; }
      },
      pointerup() { if (grab) { grab = null; peak.fill(0); } },
      reset() { pluckShape(0.22, 0.55); t = 0; },
      destroy() { if (audio) { try { audio.ac.close(); } catch (e) {} audio = null; } },
      readouts() {
        const f0 = fBase(), c = Math.sqrt(S.T / (S.mu / 1000));
        let dom = 0; for (let n = 1; n < NM; n++) if (amp[n] > amp[dom]) dom = n;
        const near = S.drive ? Math.round(S.fd) : null;
        return [
          ['Fundamental f₁', f0.toFixed(1) + ' Hz'], ['Musical note', noteName(f0)], ['Wave speed c', c.toFixed(1) + ' m/s'],
          ['Wavelength λ₁', ((S.bc === 'fixed' ? 2 : 4) * S.L).toFixed(2) + ' m'], ['Strongest harmonic', 'n = ' + ratio(dom + 1)],
          ['Its frequency', (f0 * ratio(dom + 1)).toFixed(0) + ' Hz'], ['Peak amplitude', Math.max(...peak).toFixed(3)],
          ['Driver', S.drive ? S.fd.toFixed(2) + ' f₁' + (Math.abs(S.fd - near) < 0.03 && near > 0 ? '  RESONANCE' : '') : 'off'],
        ];
      },
    };
  },
});

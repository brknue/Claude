'use strict';
/* LAB 11 — Quantum Tunnelling: 1D time-dependent Schrödinger equation, Crank–Nicolson (unitary), drawable potentials */
PhysLab.define({
  id: 'quantum',
  cat: 'Modern Physics',
  title: 'Quantum Tunnelling',
  subtitle: 'Fire a wave packet at barriers and wells: the time-dependent Schrödinger equation solved live, with measurement collapse.',
  color: '#c084fc',
  tags: ['Quantum mechanics', 'Schrödinger', 'Tunnelling'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 46c5 0 6-30 12-30s7 30 13 30"/><rect x="29" y="12" width="7" height="36" fill="currentColor" fill-opacity=".3"/><path d="M38 46c3 0 4-10 8-10s5 10 8 10h8"/><path d="M2 50h60"/></svg>`,
  hint: 'Press “Fire packet” to launch · drag on the plot to draw your own potential · “Measure” collapses the wavefunction',
  howto: [
    'The coloured area is the probability density <b>|ψ|²</b>; the colour is the quantum <b>phase</b> of ψ.',
    'The grey shape is the potential energy V(x); the dashed line is the packet\'s mean energy ⟨E⟩.',
    '<b>Drag on the plot</b> to draw any potential you like (Draw tool) or wipe it (Erase tool).',
    '<b>Measure position</b> picks a random location with probability |ψ|² and collapses the wave there.',
  ],
  theory: `
  <h3>Time-dependent Schrödinger equation</h3>
  <div class="eq">iħ ∂ψ/∂t = −(ħ²/2m) ∂²ψ/∂x² + V(x) ψ</div>
  <p>Solved with the <b>Crank–Nicolson</b> scheme, which is unconditionally stable and exactly unitary — total probability stays 1 (watch the Norm readout) unless the absorbing edges swallow it.</p>
  <div class="eq">(1 + iΔt·H/2) ψⁿ⁺¹ = (1 − iΔt·H/2) ψⁿ</div>
  <h3>Wave packets</h3>
  <div class="eq">ψ(x,0) = exp(−(x−x₀)²/4σ²) · e^{ik₀x} ,   E = ħ²k₀²/2m</div>
  <p>A narrow packet has a wide spread of momenta (Heisenberg: Δx·Δp ≥ ħ/2), so it spreads out faster as it moves.</p>
  <h3>Tunnelling</h3>
  <div class="eq">T = [1 + V₀² sinh²(κa) / 4E(V₀−E)]⁻¹ ,  κ = √(2m(V₀−E))/ħ</div>
  <p>Classically a particle with E &lt; V₀ always bounces back. Quantum mechanically part of the wave leaks through — the basis of the scanning tunnelling microscope, flash memory and nuclear fusion in the Sun. Compare the measured T with the formula in the readouts.</p>
  <h3>More to try</h3>
  <ul>
    <li><b>Double barrier</b>: at certain energies the packet resonates between the barriers and passes almost freely.</li>
    <li><b>Harmonic well</b>: a displaced Gaussian sloshes back and forth without changing shape — a coherent state, the quantum cousin of a pendulum.</li>
    <li><b>Crystal</b>: a periodic potential only lets certain energy bands through.</li>
  </ul>`,

  create(env) {
    const { ui } = env;
    const N = env.q >= 0.75 ? 1024 : 512, DT = 0.4, EMAX = 0.8;
    const S = { k0: 0.6, sigma: 26, x0: 0.2, V0: 0.24, a: 4, preset: 'barrier', spf: 8, showRe: true, absorb: true, tool: 'draw' };
    const re = new Float64Array(N), im = new Float64Array(N), dr = new Float64Array(N), di = new Float64Array(N);
    const V = new Float64Array(N), Wab = new Float64Array(N);
    const cpr = new Float64Array(N), cpi = new Float64Array(N), inr = new Float64Array(N), ini = new Float64Array(N);
    const r = DT / 4;
    let dirty = true, peak0 = 0.02, absL = 0, absR = 0, split = N * 0.55, time = 0, flash = null, lastDraw = null;
    const HUES = Array.from({ length: 48 }, (_, k) => `hsl(${k * 7.5},95%,58%)`);

    function prep() {
      const sp = Math.round(N * 0.06);
      for (let j = 0; j < N; j++) {
        const d = Math.min(j, N - 1 - j);
        Wab[j] = S.absorb && d < sp ? 0.08 * Math.pow((sp - d) / sp, 2) : 0;
      }
      let pr = 0, pi = 0;
      for (let j = 0; j < N; j++) {
        const br = 1 + DT * Wab[j] * 0.5, bi = 2 * r + DT * V[j] * 0.5;
        const er = br - r * pi, ei = bi + r * pr, m = er * er + ei * ei;
        inr[j] = er / m; ini[j] = -ei / m;
        pr = cpr[j] = r * ini[j]; pi = cpi[j] = -r * inr[j];
      }
      dirty = false;
    }
    function stepCN() {
      let pr = 0, pi = 0;
      for (let j = 0; j < N; j++) {
        const sr = (j > 0 ? re[j - 1] : 0) + (j < N - 1 ? re[j + 1] : 0), si = (j > 0 ? im[j - 1] : 0) + (j < N - 1 ? im[j + 1] : 0);
        const ar = 1 - DT * Wab[j] * 0.5, ai = -(2 * r + DT * V[j] * 0.5);
        const rr = re[j] * ar - im[j] * ai - r * si, ri = re[j] * ai + im[j] * ar + r * sr;
        const nr = rr - r * pi, ni = ri + r * pr;
        pr = dr[j] = nr * inr[j] - ni * ini[j]; pi = di[j] = nr * ini[j] + ni * inr[j];
      }
      re[N - 1] = dr[N - 1]; im[N - 1] = di[N - 1];
      for (let j = N - 2; j >= 0; j--) {
        re[j] = dr[j] - (cpr[j] * re[j + 1] - cpi[j] * im[j + 1]);
        im[j] = di[j] - (cpr[j] * im[j + 1] + cpi[j] * re[j + 1]);
      }
      time += DT;
    }

    function packet(xc, sigma, k0) {
      let n = 0;
      for (let j = 0; j < N; j++) {
        const g = Math.exp(-((j - xc) ** 2) / (4 * sigma * sigma));
        re[j] = g * Math.cos(k0 * j); im[j] = g * Math.sin(k0 * j); n += g * g;
      }
      n = Math.sqrt(n);
      for (let j = 0; j < N; j++) { re[j] /= n; im[j] /= n; }
      peak0 = 1 / (sigma * Math.sqrt(2 * Math.PI));
      absL = absR = 0; time = 0;
    }
    function fire() { packet(S.x0 * N, S.sigma * (N / 1024), S.k0); }

    function setPotential(name) {
      S.preset = name;
      V.fill(0);
      const c = Math.round(N * 0.55), a = Math.max(2, Math.round(S.a * (N / 1024)));
      split = c;
      if (name === 'barrier') for (let j = c - (a >> 1); j < c - (a >> 1) + a; j++) V[j] = S.V0;
      else if (name === 'step') for (let j = c; j < N; j++) V[j] = S.V0;
      else if (name === 'well') for (let j = c - 2 * a; j < c + 2 * a; j++) V[j] = -S.V0;
      else if (name === 'double') { for (let j = c - 3 * a; j < c - 2 * a; j++) V[j] = S.V0; for (let j = c + 2 * a; j < c + 3 * a; j++) V[j] = S.V0; }
      else if (name === 'crystal') { for (let k = 0; k < 9; k++) for (let j = c + k * 3 * a; j < c + k * 3 * a + a && j < N; j++) V[j] = S.V0 * 0.7; }
      else if (name === 'harmonic') {
        const w = 0.005 * (1024 / N);
        for (let j = 0; j < N; j++) V[j] = 0.5 * w * w * (j - N / 2) ** 2;
        dirty = true;
        packet(N * 0.3, Math.sqrt(1 / (2 * w)), 0);
        split = N / 2;
        return;
      }
      dirty = true;
      fire();
    }

    /* ---------- UI ---------- */
    ui.section('Potential');
    ui.buttons([
      { label: 'Barrier', onClick: () => setPotential('barrier') }, { label: 'Step', onClick: () => setPotential('step') },
      { label: 'Well', onClick: () => setPotential('well') }, { label: 'Double barrier', onClick: () => setPotential('double') },
      { label: 'Crystal', onClick: () => setPotential('crystal') }, { label: 'Harmonic well', onClick: () => setPotential('harmonic') },
      { label: 'Free space', onClick: () => setPotential('free') },
    ]);
    ui.slider('Barrier height V₀', { min: 0.02, max: 0.7, step: 0.005, value: S.V0, fmt: (v) => v.toFixed(3), onInput: (v) => (S.V0 = v), onChange: () => S.preset !== 'harmonic' && setPotential(S.preset) });
    ui.slider('Barrier width a', { min: 2, max: 60, step: 1, value: S.a, fmt: (v) => v + ' cells', onInput: (v) => (S.a = v), onChange: () => S.preset !== 'harmonic' && setPotential(S.preset) });
    ui.tools([{ id: 'draw', label: '✎ Draw potential' }, { id: 'erase', label: '⌫ Erase potential' }], S.tool, (v) => (S.tool = v));
    ui.section('Wave packet');
    ui.slider('Momentum k₀ (energy)', { min: 0, max: 1.1, step: 0.01, value: S.k0, fmt: (v) => `k=${v.toFixed(2)}  E=${(v * v / 2).toFixed(3)}`, onInput: (v) => (S.k0 = v) });
    ui.slider('Width σ', { min: 6, max: 80, step: 1, value: S.sigma, fmt: (v) => v + ' cells', onInput: (v) => (S.sigma = v) });
    ui.slider('Start position', { min: 0.1, max: 0.9, step: 0.01, value: S.x0, fmt: (v) => (v * 100).toFixed(0) + ' %', onInput: (v) => (S.x0 = v) });
    ui.buttons([
      { label: '▶ Fire packet', primary: true, onClick: fire },
      { label: '👁 Measure position', onClick: () => {
        let tot = 0; for (let j = 0; j < N; j++) tot += re[j] * re[j] + im[j] * im[j];
        let u = Math.random() * tot, jx = 0;
        for (let j = 0; j < N; j++) { u -= re[j] * re[j] + im[j] * im[j]; if (u <= 0) { jx = j; break; } }
        packet(jx, 5 * (N / 1024), 0);
        flash = { j: jx, t: 1 };
        env.toast('Measured! The wavefunction collapsed to x = ' + ((jx / N) * 100).toFixed(1) + ' %');
      } },
    ]);
    ui.section('Simulation');
    ui.slider('Steps per frame', { min: 1, max: 30, step: 1, value: S.spf, fmt: (v) => v + '', onInput: (v) => (S.spf = v) });
    ui.toggle('Absorbing edges (open space)', S.absorb, (v) => { S.absorb = v; dirty = true; });
    ui.toggle('Show Re ψ (white line)', S.showRe, (v) => (S.showRe = v));

    setPotential('barrier');

    const geo = () => ({ base: env.H - 80, top: 50 });
    const yE = (E, G) => G.base - (E / EMAX) * (G.base - G.top);

    function stats() {
      let n = 0, x = 0, p = 0, E = 0, PL = 0, PR = 0;
      for (let j = 0; j < N; j++) {
        const rho = re[j] * re[j] + im[j] * im[j];
        n += rho; x += rho * j;
        if (j < split) PL += rho; else PR += rho;
        if (j < N - 1) {
          const dxr = re[j + 1] - re[j], dxi = im[j + 1] - im[j];
          p += re[j] * dxi - im[j] * dxr;
          E += 0.5 * (dxr * dxr + dxi * dxi);
        }
        E += V[j] * rho;
      }
      return { n, x: x / (n || 1), p: p / (n || 1), E: E / (n || 1), PL, PR };
    }

    return {
      step(dt) {
        if (dirty) prep();
        const n = Math.max(1, Math.round(S.spf * Math.min(3, dt * 60)));
        for (let k = 0; k < n; k++) stepCN();
        if (S.absorb) {
          const sp = Math.round(N * 0.06);
          let l = 0, rr = 0;
          for (let j = 0; j < sp; j++) { l += 2 * Wab[j] * (re[j] * re[j] + im[j] * im[j]); const q = N - 1 - j; rr += 2 * Wab[q] * (re[q] * re[q] + im[q] * im[q]); }
          absL += l * DT * n; absR += rr * DT * n;
        }
        if (flash) { flash.t -= dt * 1.2; if (flash.t <= 0) flash = null; }
      },
      draw(ctx) {
        const W = env.W, H = env.H, G = geo(), sx = W / N;
        ctx.fillStyle = '#07060f'; ctx.fillRect(0, 0, W, H);
        // energy grid
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.fillStyle = 'rgba(200,210,255,0.5)'; ctx.font = '10px Consolas, monospace'; ctx.textBaseline = 'middle'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let e = 0; e <= EMAX + 1e-9; e += 0.1) { ctx.moveTo(0, yE(e, G)); ctx.lineTo(W, yE(e, G)); }
        ctx.stroke();
        for (let e = 0.1; e <= EMAX + 1e-9; e += 0.1) ctx.fillText('E=' + e.toFixed(1), 6, yE(e, G) - 7);
        // potential
        ctx.beginPath(); ctx.moveTo(0, G.base);
        for (let j = 0; j < N; j++) { const y = Math.max(G.top - 20, Math.min(H - 12, yE(V[j], G))); ctx.lineTo(j * sx, y); ctx.lineTo((j + 1) * sx, y); }
        ctx.lineTo(W, G.base); ctx.closePath();
        ctx.fillStyle = 'rgba(160,170,200,0.22)'; ctx.fill();
        ctx.strokeStyle = 'rgba(210,220,255,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
        // absorbing zones
        if (S.absorb) {
          const sp = N * 0.06 * sx;
          const gl = ctx.createLinearGradient(0, 0, sp, 0); gl.addColorStop(0, 'rgba(192,132,252,0.18)'); gl.addColorStop(1, 'rgba(192,132,252,0)');
          ctx.fillStyle = gl; ctx.fillRect(0, G.top, sp, G.base - G.top);
          const g2 = ctx.createLinearGradient(W, 0, W - sp, 0); g2.addColorStop(0, 'rgba(192,132,252,0.18)'); g2.addColorStop(1, 'rgba(192,132,252,0)');
          ctx.fillStyle = g2; ctx.fillRect(W - sp, G.top, sp, G.base - G.top);
        }
        // |psi|^2 coloured by phase
        const ps = (0.5 * (G.base - G.top)) / peak0, step = 2;
        for (let px = 0; px < W; px += step) {
          const j = Math.min(N - 1, (px / sx) | 0);
          const rho = re[j] * re[j] + im[j] * im[j], hgt = Math.min(G.base - 8, rho * ps);
          if (hgt < 0.4) continue;
          let hi = ((Math.atan2(im[j], re[j]) / (2 * Math.PI) + 1) * 48) | 0;
          ctx.fillStyle = HUES[hi % 48];
          ctx.fillRect(px, G.base - hgt, step, hgt);
        }
        if (S.showRe) {
          const rs = (0.22 * (G.base - G.top)) / Math.sqrt(peak0);
          ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1; ctx.beginPath();
          for (let j = 0; j < N; j++) { const y = G.base - re[j] * rs; j ? ctx.lineTo(j * sx, y) : ctx.moveTo(0, y); }
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.moveTo(0, G.base); ctx.lineTo(W, G.base); ctx.stroke();
        // mean energy line
        const st = stats();
        if (st.n > 0.02) {
          ctx.setLineDash([7, 5]); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(0, yE(st.E, G)); ctx.lineTo(W, yE(st.E, G)); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#fde047'; ctx.fillText('⟨E⟩ = ' + st.E.toFixed(3), W - 110, yE(st.E, G) - 8);
          // <x> marker
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(st.x * sx, G.base + 4); ctx.lineTo(st.x * sx - 6, G.base + 14); ctx.lineTo(st.x * sx + 6, G.base + 14); ctx.fill();
          ctx.fillText('⟨x⟩', st.x * sx - 9, G.base + 24);
        }
        if (flash) {
          ctx.strokeStyle = `rgba(255,255,255,${flash.t})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(flash.j * sx, G.base - 30, (1 - flash.t) * 90 + 6, 0, U.TAU); ctx.stroke();
        }
        // probability bars
        const L = st.PL + absL, Rr = st.PR + absR, tot = L + Rr || 1;
        U.panel(ctx, W - 250, 12, 238, 62, 'Where is the particle?');
        ctx.fillStyle = '#60a5fa'; ctx.fillRect(W - 240, 36, 218 * (L / tot), 12);
        ctx.fillStyle = '#f472b6'; ctx.fillRect(W - 240 + 218 * (L / tot), 36, 218 * (Rr / tot), 12);
        ctx.font = '11px Segoe UI, sans-serif'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#60a5fa'; ctx.fillText('left / reflected ' + ((L / tot) * 100).toFixed(1) + '%', W - 240, 54);
        ctx.fillStyle = '#f472b6'; ctx.fillText('right ' + ((Rr / tot) * 100).toFixed(1) + '%', W - 78, 54);
      },
      pointerdown(p) { lastDraw = null; this.pointermove(p); },
      pointermove(p) {
        if (!env.pointer.down) return;
        const G = geo(), j = U.clamp(Math.round((p.x / env.W) * N), 0, N - 1);
        const E = S.tool === 'erase' ? 0 : U.clamp(((G.base - p.y) / (G.base - G.top)) * EMAX, -0.15, EMAX * 1.1);
        const j0 = lastDraw ? lastDraw[0] : j, e0 = lastDraw ? lastDraw[1] : E;
        const a = Math.min(j0, j), b = Math.max(j0, j);
        for (let k = a; k <= b; k++) { const t = b === a ? 1 : (k - j0) / (j - j0); V[k] = S.tool === 'erase' ? 0 : e0 + (E - e0) * t; }
        if (S.tool === 'erase') for (let k = Math.max(0, a - 6); k <= Math.min(N - 1, b + 6); k++) V[k] = 0;
        lastDraw = [j, E];
        dirty = true; S.presetDrawn = true;
      },
      pointerup() { lastDraw = null; },
      reset() { setPotential(S.preset); },
      readouts() {
        const st = stats(), E = S.k0 * S.k0 / 2, a = Math.max(2, Math.round(S.a * (N / 1024)));
        let Tth = null;
        if (S.preset === 'barrier' && E > 0) {
          if (E < S.V0) { const k = Math.sqrt(2 * (S.V0 - E)); Tth = 1 / (1 + (S.V0 * S.V0 * Math.sinh(k * a) ** 2) / (4 * E * (S.V0 - E))); }
          else if (E > S.V0) { const k = Math.sqrt(2 * (E - S.V0)); Tth = 1 / (1 + (S.V0 * S.V0 * Math.sin(k * a) ** 2) / (4 * E * (E - S.V0))); }
        }
        const L = st.PL + absL, Rr = st.PR + absR, tot = L + Rr || 1;
        return [
          ['Norm ∫|ψ|²dx', st.n.toFixed(5)], ['⟨x⟩', ((st.x / N) * 100).toFixed(1) + ' %'], ['⟨p⟩', st.p.toFixed(3)], ['⟨E⟩', st.E.toFixed(4)],
          ['Transmitted', ((Rr / tot) * 100).toFixed(2) + ' %'], ['Reflected', ((L / tot) * 100).toFixed(2) + ' %'],
          ['Theory T (plane wave)', Tth === null ? '—' : (Tth * 100).toFixed(2) + ' %'], ['Time', time.toFixed(0)], ['Grid points', N],
        ];
      },
    };
  },
});

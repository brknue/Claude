'use strict';
/* LAB 14 — Ising Magnet: Monte-Carlo ferromagnet (Metropolis + Wolff), phase transition, hysteresis */
PhysLab.define({
  id: 'ising',
  cat: 'Thermal & Statistical',
  title: 'Ising Magnet',
  subtitle: 'Tens of thousands of atomic spins: heat a magnet past its Curie point, watch domains grow, trace hysteresis loops.',
  color: '#f5b041',
  tags: ['Magnetism', 'Monte Carlo', 'Critical phenomena'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22v-12M12 10l-4 5M12 10l4 5M28 10v12M28 22l-4-5M28 22l4-5M44 22v-12M44 10l-4 5M44 10l4 5M12 42v12M12 54l-4-5M12 54l4-5M28 54v-12M28 42l-4 5M28 42l4 5M44 54v-12M44 42l-4 5M44 42l4 5M58 10v12M58 22l-3-4M58 22l3-4M58 42v12M58 54l-3-4M58 54l3-4"/></svg>`,
  hint: 'Slide the temperature through T_c ≈ 2.27 and watch order appear · paint spins with the mouse (left = up, right = down)',
  howto: [
    'Yellow cells are spin-<b>up</b> atoms, blue are spin-<b>down</b>. Neighbours prefer to align.',
    'Lower the <b>temperature</b> below T_c ≈ 2.269 and large magnetic domains form on their own.',
    '<b>Paint</b> spins with the mouse: left button = up, right button = down.',
    'Turn on <b>Auto-sweep field</b> below T_c to trace a hysteresis loop — the memory effect used in hard drives.',
  ],
  theory: `
  <h3>The Ising model</h3>
  <div class="eq">E = −J Σ⟨i,j⟩ sᵢ sⱼ − h Σᵢ sᵢ ,   sᵢ = ±1</div>
  <p>Each spin interacts only with its four nearest neighbours (J &gt; 0 favours alignment) and with an external field h.</p>
  <h3>Metropolis Monte Carlo</h3>
  <div class="eq">flip with probability  min(1, e^{−ΔE / k_BT})</div>
  <p>Random single-spin flips sample the Boltzmann distribution. Near the critical point this slows down dramatically ("critical slowing down"), so the <b>Wolff</b> algorithm flips whole clusters at once instead.</p>
  <h3>Phase transition</h3>
  <div class="eq">k_BT_c / J = 2 / ln(1 + √2) ≈ 2.269</div>
  <div class="eq">|M| = [1 − sinh⁻⁴(2J/k_BT)]^{1/8}   for T &lt; T_c   (Onsager, 1944)</div>
  <p>Above T_c thermal noise wins and the net magnetisation is zero. Below it the symmetry breaks spontaneously. The |M|–T plot compares your measurements with Onsager's exact solution. Exactly at T_c, clusters of every size exist — the pattern looks the same at every zoom level (scale invariance).</p>
  <h3>Hysteresis</h3>
  <p>Below T_c, the magnetisation lags behind a changing field: it takes a finite reverse field to flip the domains. The loop area is the energy lost per cycle.</p>
  <h3>Antiferromagnet</h3>
  <p>With J &lt; 0 neighbours prefer to be opposite, giving a checkerboard ground state with zero net magnetisation.</p>`,

  create(env) {
    const { ui } = env;
    const L = env.q >= 1 ? 256 : env.q >= 0.75 ? 192 : 128, N = L * L, TC = 2 / Math.log(1 + Math.SQRT2);
    const S = { T: 2.0, h: 0, J: 1, algo: 'metropolis', sweeps: 2, sweepH: false, brush: 8 };
    const s = new Int8Array(N), stack = new Int32Array(N);
    const off = document.createElement('canvas'); off.width = off.height = L;
    const octx = off.getContext('2d'), img = octx.createImageData(L, L), u32 = new Uint32Array(img.data.buffer);
    const UPC = (255 << 24) | (70 << 16) | (176 << 8) | 245, DNC = (255 << 24) | (102 << 16) | (42 << 8) | 21;
    const Mh = new U.Ring(360), acc = new Float32Array(10);
    const TB = 92, mT = new Float32Array(TB), mTn = new Uint16Array(TB); // |M| binned over T in [0.5,5]
    let M = 0, sweepsDone = 0, hPhase = 0, loop = [], area = { x: 0, y: 0, s: 1 }, painting = 0;

    function table() { for (let k = 0; k < 10; k++) { const sp = k < 5 ? -1 : 1, nb = ((k % 5) - 2) * 2; const dE = 2 * sp * (S.J * nb + S.h); acc[k] = dE <= 0 ? 1 : Math.exp(-dE / S.T); } }
    function randomize(p = 0.5) { for (let i = 0; i < N; i++) s[i] = Math.random() < p ? 1 : -1; recount(); }
    function recount() { M = 0; for (let i = 0; i < N; i++) M += s[i]; }

    function metropolis(n) {
      const Lm = L - 1;
      for (let k = 0; k < n; k++) {
        const i = (Math.random() * N) | 0, x = i % L, y = (i / L) | 0, sp = s[i];
        const nb = s[y * L + (x === 0 ? Lm : x - 1)] + s[y * L + (x === Lm ? 0 : x + 1)] + s[(y === 0 ? Lm : y - 1) * L + x] + s[(y === Lm ? 0 : y + 1) * L + x];
        const a = acc[(sp > 0 ? 5 : 0) + (nb >> 1) + 2];
        if (a >= 1 || Math.random() < a) { s[i] = -sp; M -= 2 * sp; }
      }
    }
    function wolff() {
      const p = 1 - Math.exp((-2 * S.J) / S.T), Lm = L - 1;
      const i0 = (Math.random() * N) | 0, sp = s[i0];
      let top = 0, size = 1;
      stack[top++] = i0; s[i0] = -sp;
      while (top) {
        const i = stack[--top], x = i % L, y = (i / L) | 0;
        const nbs = [y * L + (x === 0 ? Lm : x - 1), y * L + (x === Lm ? 0 : x + 1), (y === 0 ? Lm : y - 1) * L + x, (y === Lm ? 0 : y + 1) * L + x];
        for (let k = 0; k < 4; k++) { const j = nbs[k]; if (s[j] === sp && Math.random() < p) { s[j] = -sp; stack[top++] = j; size++; } }
      }
      M -= 2 * sp * size;
      return size;
    }
    function energy() {
      let E = 0;
      const Lm = L - 1;
      for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) { const i = y * L + x; E -= S.J * s[i] * (s[y * L + (x === Lm ? 0 : x + 1)] + s[(y === Lm ? 0 : y + 1) * L + x]) + S.h * s[i]; }
      return E / N;
    }
    const onsager = (T) => (T < TC ? Math.pow(1 - Math.pow(Math.sinh(2 / T), -4), 0.125) : 0);

    /* ---------- UI ---------- */
    ui.section('Scenarios');
    ui.buttons([
      { label: '🔥 Hot (T = 4)', onClick: () => { setT(4); } },
      { label: '◎ Critical point', onClick: () => { setT(TC); S.algo = 'wolff'; algoSel.set('wolff'); } },
      { label: '❄ Quench to T = 1.5', onClick: () => { randomize(); setT(1.5); S.algo = 'metropolis'; algoSel.set('metropolis'); } },
      { label: 'All spins up', onClick: () => { s.fill(1); recount(); } },
      { label: 'Randomise spins', onClick: () => randomize() },
      { label: 'Clear |M|–T plot', onClick: () => { mT.fill(0); mTn.fill(0); } },
    ]);
    ui.section('Thermodynamics');
    const tSl = ui.slider('Temperature k_BT / J', { min: 0.5, max: 5, step: 0.01, value: S.T, fmt: (v) => v.toFixed(2) + (Math.abs(v - TC) < 0.03 ? '  ≈ T_c' : v < TC ? '  (ordered)' : '  (disordered)'), onInput: (v) => { S.T = v; table(); } });
    const hSl = ui.slider('External field h', { min: -1.5, max: 1.5, step: 0.01, value: S.h, fmt: (v) => v.toFixed(2), onInput: (v) => { S.h = v; table(); } });
    ui.toggle('Auto-sweep field (hysteresis loop)', S.sweepH, (v) => { S.sweepH = v; loop = []; if (v && S.algo === 'wolff') { S.algo = 'metropolis'; algoSel.set('metropolis'); } });
    ui.select('Coupling', [['1', 'Ferromagnet (J > 0)'], ['-1', 'Antiferromagnet (J < 0)']], '1', (v) => { S.J = +v; table(); if (S.J < 0) { S.algo = 'metropolis'; algoSel.set('metropolis'); } });
    ui.section('Algorithm');
    const algoSel = ui.select('Monte-Carlo move', [['metropolis', 'Metropolis (single spin)'], ['wolff', 'Wolff (cluster flips)']], S.algo, (v) => { S.algo = v; if (v === 'wolff' && (S.J < 0 || S.h !== 0)) env.toast('Wolff clusters need J > 0 and h = 0 — using Metropolis until then'); });
    ui.slider('Speed (sweeps per frame)', { min: 0.1, max: 8, value: S.sweeps, log: true, fmt: (v) => v.toFixed(1), onInput: (v) => (S.sweeps = v) });
    ui.slider('Paint brush', { min: 2, max: 30, step: 1, value: S.brush, fmt: (v) => v + ' cells', onInput: (v) => (S.brush = v) });
    ui.note(`Lattice ${L} × ${L} = ${N.toLocaleString()} spins with periodic boundaries.`);
    function setT(T) { S.T = T; tSl.set(T); table(); }

    randomize();
    table();

    function paint(p) {
      const x0 = Math.floor((p.x - area.x) / area.s), y0 = Math.floor((p.y - area.y) / area.s), r = S.brush;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const x = x0 + dx, y = y0 + dy;
        if (x < 0 || y < 0 || x >= L || y >= L) continue;
        const i = y * L + x;
        if (s[i] !== painting) { M += painting - s[i]; s[i] = painting; }
      }
    }

    /* ===== v3 extras ===== */
    const FL = { n: 0, m: 0, m2: 0, e: 0, e2: 0, key: '', f: 0 };
    const WALLC = (255 << 24) | (120 << 16) | (230 << 8) | 255, DARKC = (255 << 24) | (34 << 16) | (16 << 8) | 10;
    function renderView() {
      const Lm = L - 1;
      if (S.view === 'walls') {
        for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) { const i = y * L + x; u32[i] = s[i] !== s[y * L + (x === Lm ? 0 : x + 1)] || s[i] !== s[(y === Lm ? 0 : y + 1) * L + x] ? WALLC : DARKC; }
        return;
      }
      const b = S.view === 'b3' ? 3 : 9;
      for (let by = 0; by < L; by += b) for (let bx = 0; bx < L; bx += b) {
        let sum = 0;
        const y1 = Math.min(L, by + b), x1 = Math.min(L, bx + b);
        for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++) sum += s[y * L + x];
        const c = sum >= 0 ? UPC : DNC;
        for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++) u32[y * L + x] = c;
      }
    }
    ui.section('Analysis');
    ui.select('View', [['spins', 'Individual spins'], ['b3', 'Block spins 3×3 (zoomed out)'], ['b9', 'Block spins 9×9 (zoomed out more)'], ['walls', 'Domain walls only']], 'spins', (v) => (S.view = v));
    ui.note('<b>Block spins</b> replace each block by its majority vote — the "renormalisation" step. Away from T_c the picture simplifies to all-one-colour or grey noise; exactly at T_c it looks the same at every zoom level. The panel on the lattice measures the <b>susceptibility χ</b> and <b>heat capacity C</b> from fluctuations; both peak sharply at T_c.');
    const ext = {
      step() {
        const key = S.T + '|' + S.h + '|' + S.J + '|' + S.sweepH;
        if (key !== FL.key) { FL.key = key; FL.n = 0; FL.m = FL.m2 = FL.e = FL.e2 = 0; }
        if (S.sweepH || FL.f++ % 2) return;
        const m = Math.abs(M / N), e = energy();
        FL.n++; FL.m += m; FL.m2 += m * m; FL.e += e; FL.e2 += e * e;
      },
      draw(ctx) {
        if (FL.n < 5) return;
        const am = FL.m / FL.n, chi = (N * (FL.m2 / FL.n - am * am)) / S.T, ae = FL.e / FL.n, cv = (N * (FL.e2 / FL.n - ae * ae)) / (S.T * S.T);
        const x = area.x + 10, y = area.y + 10;
        U.panel(ctx, x, y, 214, 76, 'Fluctuations at this T');
        ctx.font = '11.5px Consolas, monospace'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#fde047'; ctx.fillText('susceptibility χ = ' + U.fmt(chi, 2), x + 10, y + 26);
        ctx.fillStyle = '#7dd3fc'; ctx.fillText('heat capacity C = ' + U.fmt(cv, 3), x + 10, y + 42);
        ctx.fillStyle = '#9fb3e0'; ctx.fillText('samples ' + FL.n, x + 10, y + 58);
      },
    };

    return {
      ext,
      probe() { return { absM: Math.abs(M / N), h: S.h, T: S.T, samples: FL.n, loop: loop.length }; },
      step(dt) {
        const f = Math.min(3, dt * 60);
        if (S.sweepH) {
          hPhase += dt * 0.5;
          S.h = 1.2 * Math.sin(hPhase); hSl.set(S.h); table();
        }
        if (S.algo === 'wolff' && S.J > 0 && S.h === 0) {
          let flipped = 0; const target = S.sweeps * N * f * 0.5;
          for (let k = 0; k < 400 && flipped < target; k++) flipped += wolff();
          sweepsDone += flipped / N;
        } else { const n = Math.round(S.sweeps * N * f); metropolis(n); sweepsDone += n / N; }
        const m = M / N;
        Mh.push(m);
        if (S.sweepH) { loop.push(S.h, m); if (loop.length > 1600) loop.splice(0, 2); }
        else if (S.h === 0 && S.J > 0) { const b = Math.round(((S.T - 0.5) / 4.5) * (TB - 1)); if (b >= 0 && b < TB) { mTn[b] = Math.min(60000, mTn[b] + 1); mT[b] += (Math.abs(m) - mT[b]) * (mTn[b] < 40 ? 1 / mTn[b] : 0.03); } }
      },
      draw(ctx) {
        const W = env.W, H = env.H;
        ctx.fillStyle = '#070912'; ctx.fillRect(0, 0, W, H);
        if (S.view && S.view !== 'spins') renderView(); else for (let i = 0; i < N; i++) u32[i] = s[i] > 0 ? UPC : DNC;
        octx.putImageData(img, 0, 0);
        const side = W >= 860 ? 300 : 0;
        const size = Math.max(64, Math.min(W - side - 24, H - 24));
        area = { x: (W - side - size) / 2, y: (H - size) / 2, s: size / L };
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, area.x, area.y, size, size);
        ctx.imageSmoothingEnabled = true;
        ctx.strokeStyle = 'rgba(245,176,65,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(area.x - 1, area.y - 1, size + 2, size + 2);
        if (env.pointer.inside) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(env.pointer.x, env.pointer.y, S.brush * area.s, 0, U.TAU); ctx.stroke(); }
        if (!side) return;
        const px = W - side + 6, pw = side - 18;
        // magnetisation trace
        U.panel(ctx, px, 12, pw, 120, 'Magnetisation M (time)');
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(px + 10, 80); ctx.lineTo(px + pw - 10, 80); ctx.stroke();
        ctx.strokeStyle = '#f5b041'; ctx.lineWidth = 1.5; Mh.draw(ctx, px + 10, 36, pw - 20, 88, -1.02, 1.02);
        // |M| vs T
        const gy = 144, gh = 190;
        U.panel(ctx, px, gy, pw, gh, '|M| vs temperature');
        const X = (T) => px + 14 + ((T - 0.5) / 4.5) * (pw - 28), Y = (m) => gy + gh - 22 - m * (gh - 52);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(0.5), Y(0)); ctx.lineTo(X(5), Y(0)); ctx.stroke();
        ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(248,113,113,0.7)'; ctx.beginPath(); ctx.moveTo(X(TC), Y(0)); ctx.lineTo(X(TC), Y(1)); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5; ctx.beginPath();
        for (let k = 0; k <= 180; k++) { const T = 0.5 + (k / 180) * 4.5; k ? ctx.lineTo(X(T), Y(onsager(T))) : ctx.moveTo(X(T), Y(onsager(T))); }
        ctx.stroke();
        ctx.fillStyle = '#f5b041';
        for (let b = 0; b < TB; b++) if (mTn[b] > 15) { ctx.beginPath(); ctx.arc(X(0.5 + (b / (TB - 1)) * 4.5), Y(mT[b]), 2.6, 0, U.TAU); ctx.fill(); }
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(S.T), Y(Math.abs(M / N)), 4, 0, U.TAU); ctx.fill();
        ctx.font = '10px Segoe UI, sans-serif'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#f87171'; ctx.fillText('T_c', X(TC) + 4, gy + 26);
        ctx.fillStyle = '#9fb3e0'; ctx.fillText('— Onsager exact   ● measured', px + 12, gy + gh - 16);
        // hysteresis
        const hy = gy + gh + 12, hh = Math.min(190, H - hy - 12);
        if (hh > 90) {
          U.panel(ctx, px, hy, pw, hh, 'M vs field h (hysteresis)');
          const HX = (h) => px + pw / 2 + (h / 1.5) * (pw / 2 - 14), HY = (m) => hy + hh / 2 + 8 - m * (hh / 2 - 26);
          ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(HX(-1.5), HY(0)); ctx.lineTo(HX(1.5), HY(0)); ctx.moveTo(HX(0), HY(-1)); ctx.lineTo(HX(0), HY(1)); ctx.stroke();
          if (loop.length > 4) { ctx.strokeStyle = '#34d399'; ctx.lineWidth = 1.6; ctx.beginPath(); for (let k = 0; k < loop.length; k += 2) k ? ctx.lineTo(HX(loop[k]), HY(loop[k + 1])) : ctx.moveTo(HX(loop[0]), HY(loop[1])); ctx.stroke(); }
          else { ctx.fillStyle = '#6b7aa5'; ctx.fillText('enable “Auto-sweep field”', px + 14, hy + hh / 2 + 16); }
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(HX(S.h), HY(M / N), 3.5, 0, U.TAU); ctx.fill();
        }
      },
      pointerdown(p, e) { painting = e.button === 2 ? -1 : 1; paint(p); },
      pointermove(p) { if (env.pointer.down && painting) paint(p); },
      pointerup() { painting = 0; },
      reset() { randomize(); Mh.clear(); loop = []; sweepsDone = 0; },
      readouts() {
        const m = M / N;
        return [
          ['Magnetisation M', m.toFixed(4)], ['Energy / spin', energy().toFixed(4) + ' J'], ['Temperature', S.T.toFixed(3)], ['T / T_c', (S.T / TC).toFixed(3)],
          ['Onsager |M|', onsager(S.T).toFixed(4)], ['Field h', S.h.toFixed(2)], ['Spins up', (((m + 1) / 2) * 100).toFixed(1) + ' %'], ['MC sweeps', U.fmt(sweepsDone, 0)],
        ];
      },
    };
  },
});

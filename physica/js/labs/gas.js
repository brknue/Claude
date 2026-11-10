'use strict';
/* LAB 05 — Kinetic Gas: hard-disc molecular dynamics, Maxwell–Boltzmann, pressure, piston, diffusion, Brownian motion */
PhysLab.define({
  id: 'gas',
  title: 'Kinetic Gas',
  subtitle: 'Molecular dynamics of a 2D gas: Maxwell–Boltzmann speeds, pressure, a movable piston, diffusion & Brownian motion.',
  color: '#34d399',
  tags: ['Thermodynamics', 'Statistical mechanics'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="10" width="44" height="44" rx="3"/><path d="M50 10v44" stroke-width="5"/><circle cx="17" cy="22" r="3" fill="currentColor"/><circle cx="33" cy="18" r="3" fill="currentColor"/><circle cx="26" cy="34" r="3" fill="currentColor"/><circle cx="40" cy="40" r="3" fill="currentColor"/><circle cx="15" cy="44" r="3" fill="currentColor"/><path d="M26 34l7-5M17 22l-5 3" /></svg>`,
  hint: 'Drag the piston (right wall) to compress the gas · hold left mouse to heat a region, right mouse to cool it',
  howto: [
    '<b>Drag the piston</b> handle on the right wall. Fast compression heats the gas (adiabatic heating).',
    '<b>Left-hold</b> inside the box heats nearby molecules; <b>right-hold</b> cools them.',
    'Compare the live speed histogram with the theoretical Maxwell–Boltzmann curve.',
    'Try <b>Two gases</b> then remove the divider, or <b>Brownian motion</b> to see a pollen grain jostled by molecules.',
  ],
  theory: `
  <h3>Hard-disc molecular dynamics</h3>
  <p>Each molecule is a disc that moves in a straight line until it hits a wall or another molecule. Collisions conserve momentum and kinetic energy:</p>
  <div class="eq">J = 2 m₁m₂/(m₁+m₂) · (v₁−v₂)·n̂ ,  v₁ −= J n̂/m₁ ,  v₂ += J n̂/m₂</div>
  <p>A uniform spatial grid finds neighbouring pairs in O(N) time instead of O(N²).</p>
  <h3>Temperature &amp; Maxwell–Boltzmann</h3>
  <div class="eq">⟨½mv²⟩ = k_B T   (2 degrees of freedom)</div>
  <div class="eq">f(v) = (m v / k_BT) · exp(−m v² / 2k_BT)</div>
  <p>Start everything at the same speed and within a second the collisions randomise the speeds into exactly this distribution.</p>
  <h3>Ideal gas law</h3>
  <div class="eq">P · A = N · k_B T   (2D: pressure = force per length)</div>
  <p>Pressure is measured from the momentum delivered to the walls. The ratio PA/Nk_BT is 1 for an ideal gas; it rises above 1 for big, crowded molecules — the excluded-volume correction of the <b>van der Waals</b> equation.</p>
  <h3>Diffusion &amp; entropy</h3>
  <p>Remove the divider between two gases and they mix irreversibly — entropy increases. In the <b>Brownian</b> preset the heavy grain performs a random walk whose mean squared displacement grows linearly with time (Einstein, 1905).</p>
  <h3>Atmosphere</h3>
  <div class="eq">n(h) ∝ exp(−m g h / k_BT)</div>
  <p>With gravity on, density falls off exponentially with height: the barometric formula.</p>`,

  create(env) {
    const { ui } = env;
    const TAU = U.TAU, q = env.q;
    const NMAX = Math.round(500 + 1500 * q);
    const S = { n: Math.round(350 + 450 * q), r: 3.5, kT: 20000, thermo: false, g: 0, mode: 'ideal', color: 'speed', mB: 4 };
    const X = new Float64Array(NMAX + 1), Y = new Float64Array(NMAX + 1), VX = new Float64Array(NMAX + 1), VY = new Float64Array(NMAX + 1);
    const M = new Float64Array(NMAX + 1), R = new Float64Array(NMAX + 1), SP = new Uint8Array(NMAX + 1);
    const next = new Int32Array(NMAX + 1);
    let N = 0, box = {}, pistonX = 0, pistonTarget = null, pistonV = 0, divider = false, dividerX = 0;
    let impulse = 0, pWin = 0, pressure = 0, coll = 0, collRate = 0, measT = 0;
    let cs = 8, gw = 1, gh = 1, head = new Int32Array(1);
    const NB = 36, hist = new Float32Array(NB), Th = new U.Ring(300), Ph = new U.Ring(300);
    let bigTrail = [], heatAt = null, dragPiston = false, sampleT = 0;

    function layout() {
      const side = env.W >= 900 ? 330 : 0;
      box = { l: 14, t: 14, r: env.W - side - 14, b: env.H - 14, side };
      if (!pistonX || pistonX > box.r) pistonX = box.r;
      pistonX = Math.max(pistonX, box.l + 80);
      dividerX = (box.l + box.r) / 2;
      cs = Math.max(4, 2 * S.r + 0.5);
      gw = Math.ceil(env.W / cs) + 2; gh = Math.ceil(env.H / cs) + 2;
      head = new Int32Array(gw * gh);
    }

    function kTnow() {
      let ke = 0;
      for (let i = 0; i < N; i++) ke += 0.5 * M[i] * (VX[i] * VX[i] + VY[i] * VY[i]);
      return N ? ke / N : 0;
    }
    function setTemp(kT) {
      const cur = kTnow();
      if (cur <= 0) return;
      const s = Math.sqrt(kT / cur);
      for (let i = 0; i < N; i++) { VX[i] *= s; VY[i] *= s; }
    }

    function init() {
      layout();
      pistonX = box.r; pistonTarget = null; pistonV = 0;
      divider = S.mode === 'mix';
      N = Math.min(NMAX, Math.round(S.n));
      bigTrail = [];
      if (S.mode === 'atmosphere') { S.g = 900; gSl.set(900); } else if (S.g === 900) { S.g = 0; gSl.set(0); }
      let start = 0;
      if (S.mode === 'brownian') {
        X[0] = (box.l + box.r) / 2; Y[0] = (box.t + box.b) / 2; VX[0] = 0; VY[0] = 0;
        R[0] = 22; M[0] = 60; SP[0] = 2; start = 1;
      }
      const w = pistonX - box.l, h = box.b - box.t;
      const cols = Math.ceil(Math.sqrt((N * w) / h)), rows = Math.ceil(N / cols);
      for (let i = start; i < N; i++) {
        const k = i - start;
        let x = box.l + ((k % cols) + 0.5) * (w / cols) + U.rand(-1, 1);
        const y = box.t + (Math.floor(k / cols) + 0.5) * (h / rows) + U.rand(-1, 1);
        let sp = 0;
        if (S.mode === 'mix') { sp = x < dividerX ? 0 : 1; if (Math.abs(x - dividerX) < S.r + 1) x += x < dividerX ? -S.r - 1 : S.r + 1; }
        if (S.mode === 'brownian' && Math.hypot(x - X[0], y - Y[0]) < R[0] + S.r + 2) x = box.l + S.r + 2 + Math.random() * 20;
        X[i] = x; Y[i] = y; SP[i] = sp; R[i] = S.r; M[i] = sp === 1 ? S.mB : 1;
        const sd = Math.sqrt(S.kT / M[i]);
        VX[i] = U.randn() * sd; VY[i] = U.randn() * sd;
      }
      setTemp(S.kT);
      hist.fill(0); Th.clear(); Ph.clear(); impulse = 0; pWin = 0; coll = 0;
    }

    /* ---------- dynamics ---------- */
    function pair(i, j) {
      const dx = X[j] - X[i], dy = Y[j] - Y[i], Rr = R[i] + R[j], d2 = dx * dx + dy * dy;
      if (d2 >= Rr * Rr || d2 === 0) return;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
      const vn = (VX[i] - VX[j]) * nx + (VY[i] - VY[j]) * ny;
      const mi = M[i], mj = M[j], mt = mi + mj;
      if (vn > 0) {
        const J = (2 * vn * mi * mj) / mt;
        VX[i] -= (J / mi) * nx; VY[i] -= (J / mi) * ny;
        VX[j] += (J / mj) * nx; VY[j] += (J / mj) * ny;
        coll++;
      }
      const o = Rr - d;
      X[i] -= nx * o * (mj / mt); Y[i] -= ny * o * (mj / mt);
      X[j] += nx * o * (mi / mt); Y[j] += ny * o * (mi / mt);
    }
    function collide() {
      head.fill(-1);
      for (let i = 0; i < N; i++) {
        if (SP[i] === 2) continue;
        const cx = U.clamp((X[i] / cs) | 0, 0, gw - 1), cy = U.clamp((Y[i] / cs) | 0, 0, gh - 1);
        const c = cy * gw + cx;
        next[i] = head[c]; head[c] = i;
      }
      for (let i = 0; i < N; i++) {
        if (SP[i] === 2) continue;
        const cx = U.clamp((X[i] / cs) | 0, 0, gw - 1), cy = U.clamp((Y[i] / cs) | 0, 0, gh - 1);
        for (let oy = -1; oy <= 1; oy++) {
          const yy = cy + oy;
          if (yy < 0 || yy >= gh) continue;
          for (let ox = -1; ox <= 1; ox++) {
            const xx = cx + ox;
            if (xx < 0 || xx >= gw) continue;
            for (let j = head[yy * gw + xx]; j !== -1; j = next[j]) if (j > i) pair(i, j);
          }
        }
      }
      if (S.mode === 'brownian') for (let j = 1; j < N; j++) pair(0, j);
    }
    function walls(h) {
      const l = box.l, t = box.t, b = box.b;
      for (let i = 0; i < N; i++) {
        const r = R[i];
        if (X[i] - r < l) { X[i] = l + r; if (VX[i] < 0) { impulse += -2 * M[i] * VX[i]; VX[i] = -VX[i]; } }
        if (X[i] + r > pistonX) {
          X[i] = pistonX - r;
          if (VX[i] > pistonV) { const nv = 2 * pistonV - VX[i]; impulse += M[i] * (VX[i] - nv); VX[i] = nv; }
        }
        if (Y[i] - r < t) { Y[i] = t + r; if (VY[i] < 0) { impulse += -2 * M[i] * VY[i]; VY[i] = -VY[i]; } }
        if (Y[i] + r > b) { Y[i] = b - r; if (VY[i] > 0) { impulse += 2 * M[i] * VY[i]; VY[i] = -VY[i]; } }
        if (divider && !demonPass(i)) {
          if (X[i] < dividerX && X[i] + r > dividerX) { X[i] = dividerX - r; VX[i] = -Math.abs(VX[i]); }
          else if (X[i] >= dividerX && X[i] - r < dividerX) { X[i] = dividerX + r; VX[i] = Math.abs(VX[i]); }
        }
      }
    }
    function substep(h) {
      const g = S.g;
      pistonX = U.clamp(pistonX + pistonV * h, box.l + 60, box.r);
      for (let i = 0; i < N; i++) {
        if (g) VY[i] += g * h;
        X[i] += VX[i] * h; Y[i] += VY[i] * h;
      }
      collide();
      walls(h);
      if (S.mode === 'brownian') { if (bigTrail.length > 3000) bigTrail.shift(); }
    }

    /* ---------- UI ---------- */
    ui.section('Experiment');
    ui.select('Scenario', [['ideal', 'Ideal gas in a piston'], ['mix', 'Two gases (diffusion)'], ['brownian', 'Brownian motion'], ['atmosphere', 'Atmosphere (gravity)']], S.mode, (v) => { S.mode = v; init(); });
    ui.slider('Number of molecules', { min: 20, max: NMAX, step: 10, value: S.n, fmt: (v) => v + '', onInput: (v) => (S.n = v), onChange: init });
    ui.slider('Molecule radius', { min: 1.5, max: 9, step: 0.5, value: S.r, fmt: (v) => v + ' px', onInput: (v) => (S.r = v), onChange: () => { for (let i = 0; i < N; i++) if (SP[i] !== 2) R[i] = S.r; layout(); } });
    ui.section('Thermodynamics');
    const tSl = ui.slider('Temperature k_BT', { min: 1000, max: 120000, value: S.kT, log: true, fmt: (v) => (v / 1000).toFixed(1) + ' k', onInput: (v) => { S.kT = v; setTemp(v); } });
    ui.toggle('Thermostat (hold T constant)', S.thermo, (v) => (S.thermo = v));
    const gSl = ui.slider('Gravity', { min: 0, max: 2000, step: 10, value: S.g, fmt: (v) => v + ' px/s²', onInput: (v) => (S.g = v) });
    ui.slider('Heavy species mass (two gases)', { min: 1, max: 16, step: 0.5, value: S.mB, fmt: (v) => v + ' m₀', onInput: (v) => { S.mB = v; for (let i = 0; i < N; i++) if (SP[i] === 1) M[i] = v; } });
    ui.buttons([
      { label: 'Heat +20%', onClick: () => { setTemp(kTnow() * 1.2); } },
      { label: 'Cool −20%', onClick: () => { setTemp(kTnow() * 0.8); } },
      { label: 'Toggle divider', onClick: () => { divider = !divider; env.toast(divider ? 'Divider inserted' : 'Divider removed — watch them mix'); } },
      { label: 'Reset piston', onClick: () => { pistonTarget = box.r; } },
    ]);
    ui.section('Display');
    ui.select('Colour molecules by', [['speed', 'Speed'], ['species', 'Species']], S.color, (v) => (S.color = v));
    ui.buttons([{ label: 'Restart', primary: true, onClick: init }]);

    init();

    const pal = [];
    for (let k = 0; k < 12; k++) { const [r, g, b] = U.hsl2rgb(225 - k * 20, 0.9, 0.58); pal.push(`rgb(${r},${g},${b})`); }

    /* ===== v3 extras ===== */
    const DM = { on: false, h: 46, TL: 0, TR: 0, passed: 0 };
    const PV = { pts: [], t: 0, A0: 0, P0: 0, T0: 0 };
    function demonPass(i) {
      if (!DM.on) return false;
      if (Math.abs(Y[i] - (box.t + box.b) / 2) > DM.h) return false;
      const fast = 0.5 * M[i] * (VX[i] * VX[i] + VY[i] * VY[i]) > measT;
      return VX[i] > 0 ? fast : !fast;
    }
    ui.section('New experiments');
    ui.buttons([
      { label: '😈 Maxwell\'s demon', primary: true, onClick: () => { S.mode = 'ideal'; init(); divider = true; DM.on = true; env.toast('The demon opens the door only for fast molecules going right and slow ones going left'); } },
      { label: 'Clear P–V diagram', onClick: () => { PV.pts = []; PV.A0 = 0; } },
    ]);
    ui.note('The <b>P–V diagram</b> (bottom left) traces pressure against volume as you move the piston: compare with the isothermal (PV = const) and adiabatic (PV² = const in 2D) curves.');
    const ext = {
      step(dt) {
        if (!divider) DM.on = false;
        if (DM.on) {
          let kl = 0, nl = 0, kr = 0, nr = 0;
          for (let i = 0; i < N; i++) { const k = 0.5 * M[i] * (VX[i] * VX[i] + VY[i] * VY[i]); if (X[i] < dividerX) { kl += k; nl++; } else { kr += k; nr++; } }
          DM.TL = nl ? kl / nl : 0; DM.TR = nr ? kr / nr : 0;
        }
        PV.t += dt;
        if (PV.t > 0.2 && pressure > 0) {
          PV.t = 0;
          const A = (pistonX - box.l) * (box.b - box.t);
          if (!PV.A0) { PV.A0 = A; PV.P0 = pressure; PV.T0 = measT; }
          PV.pts.push(A, pressure);
          if (PV.pts.length > 900) PV.pts.splice(0, 2);
        }
      },
      draw(ctx) {
        if (DM.on) {
          const cy = (box.t + box.b) / 2;
          ctx.strokeStyle = '#34d399'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(dividerX, cy - DM.h); ctx.lineTo(dividerX, cy + DM.h); ctx.stroke();
          ctx.font = '22px Segoe UI Emoji, sans-serif'; ctx.textBaseline = 'middle'; ctx.fillText('😈', dividerX - 13, cy);
          ctx.font = '600 13px Segoe UI, sans-serif'; ctx.textBaseline = 'top';
          ctx.fillStyle = '#60a5fa'; ctx.fillText('cold side  k_BT = ' + (DM.TL / 1000).toFixed(1) + ' k', box.l + 12, box.t + 10);
          ctx.fillStyle = '#f87171'; ctx.fillText('hot side  k_BT = ' + (DM.TR / 1000).toFixed(1) + ' k', dividerX + 14, box.t + 10);
        }
        if (PV.pts.length > 4 && PV.A0) {
          const pw = 210, ph = 138, x = box.l + 10, y = box.b - ph - 10;
          U.panel(ctx, x, y, pw, ph, 'P–V diagram');
          let a0 = Infinity, a1 = 0, p0 = Infinity, p1 = 0;
          for (let k = 0; k < PV.pts.length; k += 2) { a0 = Math.min(a0, PV.pts[k]); a1 = Math.max(a1, PV.pts[k]); p0 = Math.min(p0, PV.pts[k + 1]); p1 = Math.max(p1, PV.pts[k + 1]); }
          a0 *= 0.92; a1 *= 1.04; p0 *= 0.8; p1 *= 1.15;
          const X = (a) => x + 12 + ((a - a0) / (a1 - a0)) * (pw - 24), Yp = (p) => y + ph - 14 - U.clamp((p - p0) / (p1 - p0), 0, 1) * (ph - 44);
          ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
          for (const [g, c] of [[1, 'rgba(96,165,250,0.8)'], [2, 'rgba(248,113,113,0.8)']]) {
            ctx.strokeStyle = c; ctx.beginPath();
            for (let k = 0; k <= 40; k++) { const a = a0 + ((a1 - a0) * k) / 40, p = PV.P0 * Math.pow(PV.A0 / a, g); k ? ctx.lineTo(X(a), Yp(p)) : ctx.moveTo(X(a), Yp(p)); }
            ctx.stroke();
          }
          ctx.setLineDash([]);
          ctx.strokeStyle = '#34d399'; ctx.lineWidth = 1.6; ctx.beginPath();
          for (let k = 0; k < PV.pts.length; k += 2) k ? ctx.lineTo(X(PV.pts[k]), Yp(PV.pts[k + 1])) : ctx.moveTo(X(PV.pts[0]), Yp(PV.pts[1]));
          ctx.stroke();
          const L = PV.pts.length;
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(PV.pts[L - 2]), Yp(PV.pts[L - 1]), 3.5, 0, U.TAU); ctx.fill();
          ctx.font = '10px Segoe UI, sans-serif'; ctx.textBaseline = 'bottom';
          ctx.fillStyle = '#60a5fa'; ctx.fillText('isotherm', x + 12, y + ph - 2);
          ctx.fillStyle = '#f87171'; ctx.fillText('adiabat', x + 66, y + ph - 2);
          ctx.fillStyle = '#9fb3e0'; ctx.fillText('V →', x + pw - 30, y + ph - 2);
        }
      },
    };

    return {
      ext,
      probe() { return { vol: (pistonX - box.l) / (box.r - box.l), demon: DM.on, ratio: DM.TL > 0 ? DM.TR / DM.TL : 1, kT: measT }; },
      step(dt) {
        if (pistonTarget !== null) {
          pistonV = U.clamp((pistonTarget - pistonX) / Math.max(dt, 1e-3), -1500, 1500);
          if (!dragPiston && Math.abs(pistonTarget - pistonX) < 0.5) { pistonTarget = null; pistonV = 0; }
        } else pistonV = 0;
        let vmax = 1;
        for (let i = 0; i < N; i++) { const v = VX[i] * VX[i] + VY[i] * VY[i]; if (v > vmax) vmax = v; }
        vmax = Math.sqrt(vmax) + Math.abs(pistonV);
        const n = U.clamp(Math.ceil((vmax * dt) / (0.45 * S.r)), 1, 14);
        const c0 = coll;
        for (let k = 0; k < n; k++) substep(dt / n);
        if (S.mode === 'brownian') bigTrail.push(X[0], Y[0]);
        if (bigTrail.length > 6000) bigTrail.splice(0, 2);
        // heat gun
        if (heatAt) {
          const f = heatAt.hot ? Math.pow(1.6, dt) : Math.pow(0.6, dt);
          for (let i = 0; i < N; i++) if ((X[i] - heatAt.x) ** 2 + (Y[i] - heatAt.y) ** 2 < 70 * 70) { VX[i] *= f; VY[i] *= f; }
        }
        measT = kTnow();
        if (S.thermo && measT > 0) { const lam = Math.sqrt(1 + (dt / 0.3) * (S.kT / measT - 1)); for (let i = 0; i < N; i++) { VX[i] *= lam; VY[i] *= lam; } }
        // pressure & histogram
        pWin += dt;
        collRate = collRate * 0.95 + ((coll - c0) / Math.max(dt, 1e-4)) * 0.05;
        if (pWin > 0.25) {
          const per = 2 * (pistonX - box.l) + 2 * (box.b - box.t);
          pressure = pressure ? pressure * 0.6 + (impulse / (per * pWin)) * 0.4 : impulse / (per * pWin);
          impulse = 0; pWin = 0;
        }
        sampleT += dt;
        if (sampleT > 0.1) { sampleT = 0; Th.push(measT); Ph.push(pressure); }
        const vs = Math.sqrt(Math.max(measT, 1)), vmaxH = 4.2 * vs, bw = vmaxH / NB;
        const cnt = new Float32Array(NB);
        let ns = 0;
        for (let i = 0; i < N; i++) { if (SP[i] === 2) continue; const v = Math.hypot(VX[i], VY[i]); const b = (v / bw) | 0; if (b < NB) cnt[b]++; ns++; }
        for (let b = 0; b < NB; b++) hist[b] = hist[b] * 0.93 + (cnt[b] / Math.max(1, ns) / bw) * 0.07;
      },
      draw(ctx) {
        const W = env.W, H = env.H;
        ctx.fillStyle = '#060a14'; ctx.fillRect(0, 0, W, H);
        // box
        ctx.fillStyle = '#0a1224';
        ctx.fillRect(box.l, box.t, pistonX - box.l, box.b - box.t);
        ctx.strokeStyle = 'rgba(140,200,255,0.35)'; ctx.lineWidth = 2;
        ctx.strokeRect(box.l, box.t, box.r - box.l, box.b - box.t);
        if (S.g) {
          const g = ctx.createLinearGradient(0, box.t, 0, box.b);
          g.addColorStop(0, 'rgba(52,211,153,0)'); g.addColorStop(1, 'rgba(52,211,153,0.06)');
          ctx.fillStyle = g; ctx.fillRect(box.l, box.t, pistonX - box.l, box.b - box.t);
        }
        if (divider) { ctx.setLineDash([6, 4]); ctx.strokeStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(dividerX, box.t); ctx.lineTo(dividerX, box.b); ctx.stroke(); ctx.setLineDash([]); }
        // brownian trail
        if (bigTrail.length > 4) {
          ctx.strokeStyle = 'rgba(255,209,102,0.55)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(bigTrail[0], bigTrail[1]);
          for (let k = 2; k < bigTrail.length; k += 2) ctx.lineTo(bigTrail[k], bigTrail[k + 1]);
          ctx.stroke();
        }
        // molecules
        const vs = Math.sqrt(Math.max(measT, 1));
        const paths = [];
        for (let k = 0; k < 14; k++) paths.push(new Path2D());
        for (let i = 0; i < N; i++) {
          let b;
          if (SP[i] === 2) b = 13;
          else if (S.color === 'species') b = SP[i] === 1 ? 12 : 3;
          else b = Math.min(11, ((Math.hypot(VX[i], VY[i]) * Math.sqrt(M[i])) / vs / 2.6) * 11) | 0;
          const p = paths[b];
          p.moveTo(X[i] + R[i], Y[i]); p.arc(X[i], Y[i], R[i], 0, TAU);
        }
        for (let k = 0; k < 12; k++) { ctx.fillStyle = pal[k]; ctx.fill(paths[k]); }
        ctx.fillStyle = '#ff6b6b'; ctx.fill(paths[12]);
        ctx.fillStyle = '#ffd166'; ctx.fill(paths[13]);
        // piston
        const pg = ctx.createLinearGradient(pistonX, 0, pistonX + 14, 0);
        pg.addColorStop(0, '#9aa8c7'); pg.addColorStop(1, '#4b5675');
        ctx.fillStyle = pg; ctx.fillRect(pistonX, box.t, 12, box.b - box.t);
        ctx.fillStyle = '#34d399';
        U.rrect(ctx, pistonX + 1, (box.t + box.b) / 2 - 28, 10, 56, 4); ctx.fill();
        if (pistonX < box.r - 14) { ctx.fillStyle = 'rgba(80,90,120,0.35)'; ctx.fillRect(pistonX + 12, (box.t + box.b) / 2 - 5, box.r - pistonX - 12, 10); }
        // heat gun
        if (heatAt) {
          const g = ctx.createRadialGradient(heatAt.x, heatAt.y, 0, heatAt.x, heatAt.y, 70);
          g.addColorStop(0, heatAt.hot ? 'rgba(255,90,40,0.35)' : 'rgba(60,160,255,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(heatAt.x, heatAt.y, 70, 0, TAU); ctx.fill();
        }
        // plots
        const side = box.side;
        const px = side ? W - side + 4 : W - 250, pw = side ? side - 18 : 236;
        const ph = side ? 220 : 150, py = side ? 14 : 14;
        U.panel(ctx, px, py, pw, ph, 'Speed distribution');
        const gx = px + 10, gy = py + 26, gW = pw - 20, gH = ph - 44;
        const vmaxH = 4.2 * vs, bw = vmaxH / NB;
        // theory
        const fr = [0, 0, 0];
        let ns = 0;
        for (let i = 0; i < N; i++) if (SP[i] !== 2) { fr[SP[i]]++; ns++; }
        const theory = (v) => {
          let f = 0;
          for (let s = 0; s < 2; s++) { if (!fr[s]) continue; const m = s ? S.mB : 1; f += (fr[s] / ns) * ((m * v) / measT) * Math.exp((-m * v * v) / (2 * measT)); }
          return f;
        };
        let ymax = 0;
        for (let b = 0; b < NB; b++) ymax = Math.max(ymax, hist[b], theory((b + 0.5) * bw));
        ymax *= 1.15;
        ctx.fillStyle = 'rgba(52,211,153,0.55)';
        for (let b = 0; b < NB; b++) { const h = (hist[b] / ymax) * gH; ctx.fillRect(gx + (b * gW) / NB + 0.5, gy + gH - h, gW / NB - 1, h); }
        ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = 0; k <= 80; k++) { const v = (k / 80) * vmaxH, y = gy + gH - (theory(v) / ymax) * gH; k ? ctx.lineTo(gx + (k / 80) * gW, y) : ctx.moveTo(gx, y); }
        ctx.stroke();
        ctx.fillStyle = '#9fb3e0'; ctx.font = '10px Segoe UI, sans-serif'; ctx.textBaseline = 'top';
        ctx.fillText('speed →', gx + gW - 42, gy + gH + 3);
        ctx.fillStyle = '#fde68a'; ctx.fillText('— Maxwell–Boltzmann', gx + 4, gy + 2);
        if (side) {
          const ty = py + ph + 12;
          U.panel(ctx, px, ty, pw, 110, 'Temperature k_BT (time)');
          const [lo, hi] = Th.range();
          ctx.strokeStyle = '#f87171'; ctx.lineWidth = 1.5;
          Th.draw(ctx, gx, ty + 26, gW, 74, lo * 0.9, hi * 1.1 + 1);
          const ty2 = ty + 122;
          U.panel(ctx, px, ty2, pw, 110, 'Pressure (time)');
          const [plo, phi] = Ph.range();
          ctx.strokeStyle = '#60a5fa';
          Ph.draw(ctx, gx, ty2 + 26, gW, 74, plo * 0.9, phi * 1.1 + 1e-6);
          const ty3 = ty2 + 122, A = (pistonX - box.l) * (box.b - box.t);
          if (ty3 + 96 < H) {
            U.panel(ctx, px, ty3, pw, 92, 'Ideal-gas check');
            ctx.fillStyle = '#dbe5ff'; ctx.font = '12px Consolas, monospace'; ctx.textBaseline = 'top';
            ctx.fillText(`P·A      = ${U.fmt(pressure * A, 0)}`, gx, ty3 + 28);
            ctx.fillText(`N·k_BT   = ${U.fmt(N * measT, 0)}`, gx, ty3 + 46);
            ctx.fillStyle = '#34d399';
            ctx.fillText(`PA/NkT   = ${(pressure * A / (N * measT || 1)).toFixed(3)}`, gx, ty3 + 64);
          }
        }
      },
      pointerdown(p, e) {
        if (Math.abs(p.x - pistonX - 6) < 18 && p.y > box.t && p.y < box.b) { dragPiston = true; pistonTarget = pistonX; return; }
        if (p.x > box.l && p.x < pistonX && p.y > box.t && p.y < box.b) heatAt = { x: p.x, y: p.y, hot: e.button !== 2 };
      },
      pointermove(p) {
        if (dragPiston) pistonTarget = U.clamp(p.x - 6, box.l + 60, box.r);
        else if (heatAt) { heatAt.x = p.x; heatAt.y = p.y; }
      },
      pointerup() { dragPiston = false; heatAt = null; },
      resize() { const old = box.r; layout(); if (pistonX >= old - 1) pistonX = box.r; for (let i = 0; i < N; i++) { X[i] = U.clamp(X[i], box.l + R[i], pistonX - R[i]); Y[i] = U.clamp(Y[i], box.t + R[i], box.b - R[i]); } },
      reset: init,
      readouts() {
        const A = (pistonX - box.l) * (box.b - box.t);
        let sv = 0, s2 = 0, ns = 0;
        for (let i = 0; i < N; i++) { if (SP[i] === 2) continue; const v = Math.hypot(VX[i], VY[i]); sv += v; s2 += v * v; ns++; }
        const mfp = A / (Math.SQRT2 * ns * 2 * S.r);
        return [
          ['Molecules N', N], ['Temperature k_BT', U.fmt(measT / 1000, 2) + ' k'], ['Pressure P', U.fmt(pressure, 1)],
          ['Area A', U.fmt(A / 1000, 1) + ' k px²'], ['PA / Nk_BT', (pressure * A / (N * measT || 1)).toFixed(3)],
          ['⟨v⟩', U.fmt(sv / Math.max(1, ns), 1) + ' px/s'], ['v_rms', U.fmt(Math.sqrt(s2 / Math.max(1, ns)), 1) + ' px/s'],
          ['Mean free path', U.fmt(mfp, 1) + ' px'], ['Collisions / s', U.fmt(collRate, 0)],
        ];
      },
    };
  },
});

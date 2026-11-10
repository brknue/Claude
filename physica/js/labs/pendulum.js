'use strict';
/* LAB 04 — Chaos Pendulum: exact double-pendulum equations, RK4, phase space & divergence (butterfly effect) */
PhysLab.define({
  id: 'pendulum',
  title: 'Chaos Pendulum',
  subtitle: 'Double pendulums, phase space and the butterfly effect — tiny differences, totally different futures.',
  color: '#f472b6',
  tags: ['Mechanics', 'Chaos', 'Lagrangian'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 6h36"/><circle cx="32" cy="6" r="2.5" fill="currentColor"/><path d="M32 6L20 28L40 44"/><circle cx="20" cy="28" r="5" fill="currentColor"/><circle cx="40" cy="44" r="6" fill="currentColor"/><path d="M8 50c10 8 20-4 28 4s16 0 22-6" stroke-dasharray="2 3"/></svg>`,
  hint: 'Drag a bob to set the starting position · switch to Butterfly or Ensemble mode to see chaos in action',
  howto: [
    '<b>Drag either bob</b> to a new position; it is released when you let go.',
    '<b>Butterfly</b> mode runs two pendulums that start 10⁻⁴ rad apart — watch them part ways.',
    '<b>Ensemble</b> mode runs up to 100 pendulums at once with tiny differences.',
    'The divergence plot rises in a straight line on a log scale: exponential growth, the signature of chaos.',
  ],
  theory: `
  <h3>Equations of motion</h3>
  <p>Derived from the Lagrangian L = T − V of two point masses on massless rods:</p>
  <div class="eq">θ₁'' = [−g(2m₁+m₂)sinθ₁ − m₂g sin(θ₁−2θ₂) − 2 sinΔ m₂(ω₂²L₂ + ω₁²L₁cosΔ)] / L₁D</div>
  <div class="eq">θ₂'' = [2 sinΔ (ω₁²L₁(m₁+m₂) + g(m₁+m₂)cosθ₁ + ω₂²L₂m₂cosΔ)] / L₂D</div>
  <div class="eq">Δ = θ₁ − θ₂ ,  D = 2m₁ + m₂ − m₂cos(2Δ)</div>
  <p>Integrated with 4th-order Runge–Kutta at 400 steps per second. With zero damping the energy readout should stay constant — a check on the accuracy of the integrator.</p>
  <h3>Deterministic chaos</h3>
  <p>The system is fully deterministic, yet two starts that differ by 0.0001 rad separate exponentially:</p>
  <div class="eq">|δ(t)| ≈ |δ₀| · e^{λt}</div>
  <p>λ is the <b>Lyapunov exponent</b>. Because errors grow exponentially, long-term prediction is impossible in practice — the "butterfly effect". At small angles the motion is regular (try θ₁ = 20°, θ₂ = 20°); at large energies it becomes chaotic.</p>
  <h3>Phase space</h3>
  <p>The θ₁–θ₂ plot shows the configuration over time. Regular motion traces tidy curves; chaotic motion fills the space erratically.</p>`,

  create(env) {
    const { ui } = env;
    const TAU = U.TAU, DEG = U.DEG;
    const S = { mode: 'single', count: 40, eps: 1e-4, m1: 1, m2: 1, L1: 1, L2: 1, g: 9.81, b: 0, th1: 125, th2: -20, fade: 0.025, rods: true, trails: true };
    let pends = [], time = 0, E0 = 0, drag = null;
    const Eh = new U.Ring(400), Dh = new U.Ring(400);
    let trail, tctx, ph, pctx;
    const PHS = 170;
    ph = document.createElement('canvas'); ph.width = ph.height = PHS; pctx = ph.getContext('2d');

    function makeTrail() {
      trail = document.createElement('canvas');
      trail.width = Math.round(env.W * env.dpr); trail.height = Math.round(env.H * env.dpr);
      tctx = trail.getContext('2d');
      for (const p of pends) p.px = null;
    }
    const geo = () => {
      const side = env.W > 760 ? 220 : 0;
      const cx = (env.W - side) / 2, cy = env.H * 0.47;
      const sc = (Math.min(env.H * 0.45, (env.W - side) * 0.45)) / (S.L1 + S.L2);
      return { cx, cy, sc, side };
    };

    function reset() {
      pends = [];
      const n = S.mode === 'single' ? 1 : S.mode === 'pair' ? 2 : Math.round(S.count);
      for (let i = 0; i < n; i++) {
        const hue = S.mode === 'single' ? 190 : S.mode === 'pair' ? (i ? 320 : 190) : (i / n) * 300;
        pends.push({ t1: S.th1 * DEG + i * S.eps, t2: S.th2 * DEG, w1: 0, w2: 0, hue, px: null, py: null });
      }
      time = 0; Eh.clear(); Dh.clear();
      E0 = energy(pends[0]);
      if (tctx) { tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.clearRect(0, 0, trail.width, trail.height); }
      pctx.clearRect(0, 0, PHS, PHS);
    }

    function deriv(t1, t2, w1, w2, o) {
      const { m1, m2, L1, L2, g, b } = S;
      const d = t1 - t2, sd = Math.sin(d), cd = Math.cos(d);
      const den = 2 * m1 + m2 - m2 * Math.cos(2 * d);
      o[0] = w1; o[1] = w2;
      o[2] = (-g * (2 * m1 + m2) * Math.sin(t1) - m2 * g * Math.sin(t1 - 2 * t2) - 2 * sd * m2 * (w2 * w2 * L2 + w1 * w1 * L1 * cd)) / (L1 * den) - b * w1;
      o[3] = (2 * sd * (w1 * w1 * L1 * (m1 + m2) + g * (m1 + m2) * Math.cos(t1) + w2 * w2 * L2 * m2 * cd)) / (L2 * den) - b * w2;
    }
    const k1 = new Float64Array(4), k2 = new Float64Array(4), k3 = new Float64Array(4), k4 = new Float64Array(4);
    function rk4(p, h) {
      deriv(p.t1, p.t2, p.w1, p.w2, k1);
      deriv(p.t1 + k1[0] * h / 2, p.t2 + k1[1] * h / 2, p.w1 + k1[2] * h / 2, p.w2 + k1[3] * h / 2, k2);
      deriv(p.t1 + k2[0] * h / 2, p.t2 + k2[1] * h / 2, p.w1 + k2[2] * h / 2, p.w2 + k2[3] * h / 2, k3);
      deriv(p.t1 + k3[0] * h, p.t2 + k3[1] * h, p.w1 + k3[2] * h, p.w2 + k3[3] * h, k4);
      p.t1 += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
      p.t2 += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      p.w1 += (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
      p.w2 += (h / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]);
    }
    function energy(p) {
      const { m1, m2, L1, L2, g } = S;
      const T = 0.5 * m1 * L1 * L1 * p.w1 * p.w1 + 0.5 * m2 * (L1 * L1 * p.w1 * p.w1 + L2 * L2 * p.w2 * p.w2 + 2 * L1 * L2 * p.w1 * p.w2 * Math.cos(p.t1 - p.t2));
      const V = -(m1 + m2) * g * L1 * Math.cos(p.t1) - m2 * g * L2 * Math.cos(p.t2);
      return T + V;
    }
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    function divergence() {
      if (pends.length < 2) return 0;
      if (pends.length === 2) {
        const a = pends[0], b = pends[1];
        return Math.hypot(wrap(a.t1 - b.t1), wrap(a.t2 - b.t2), (a.w1 - b.w1) * 0.3, (a.w2 - b.w2) * 0.3);
      }
      let c = 0, s = 0;
      for (const p of pends) { c += Math.cos(p.t2); s += Math.sin(p.t2); }
      const R = Math.min(0.999999999, Math.hypot(c, s) / pends.length);
      return Math.sqrt(-2 * Math.log(R));
    }
    function positions(p, G) {
      const x1 = G.cx + S.L1 * G.sc * Math.sin(p.t1), y1 = G.cy + S.L1 * G.sc * Math.cos(p.t1);
      return [x1, y1, x1 + S.L2 * G.sc * Math.sin(p.t2), y1 + S.L2 * G.sc * Math.cos(p.t2)];
    }

    /* ---------- UI ---------- */
    ui.section('Mode');
    ui.select('Experiment', [['single', 'Single double-pendulum'], ['pair', 'Butterfly (2 pendulums)'], ['ensemble', 'Ensemble (many)']], S.mode, (v) => { S.mode = v; reset(); });
    ui.slider('Ensemble size', { min: 3, max: 100, step: 1, value: S.count, fmt: (v) => v + '', onInput: (v) => (S.count = v), onChange: () => S.mode === 'ensemble' && reset() });
    ui.slider('Initial difference δθ₁', { min: 1e-9, max: 0.1, value: S.eps, log: true, fmt: (v) => v.toExponential(0) + ' rad', onInput: (v) => (S.eps = v), onChange: reset });
    ui.section('Initial angles');
    const s1 = ui.slider('θ₁ (upper)', { min: -180, max: 180, step: 1, value: S.th1, fmt: (v) => v + '°', onInput: (v) => (S.th1 = v), onChange: reset });
    const s2 = ui.slider('θ₂ (lower)', { min: -180, max: 180, step: 1, value: S.th2, fmt: (v) => v + '°', onInput: (v) => (S.th2 = v), onChange: reset });
    ui.buttons([
      { label: 'Release', primary: true, onClick: reset },
      { label: 'Random angles', onClick: () => { S.th1 = Math.round(U.rand(-180, 180)); S.th2 = Math.round(U.rand(-180, 180)); s1.set(S.th1); s2.set(S.th2); reset(); } },
      { label: 'Gentle (regular)', onClick: () => { S.th1 = 20; S.th2 = 25; s1.set(20); s2.set(25); reset(); } },
    ]);
    ui.section('Physical parameters');
    ui.slider('Mass m₁', { min: 0.1, max: 5, value: S.m1, fmt: (v) => v.toFixed(2) + ' kg', onInput: (v) => (S.m1 = v) });
    ui.slider('Mass m₂', { min: 0.1, max: 5, value: S.m2, fmt: (v) => v.toFixed(2) + ' kg', onInput: (v) => (S.m2 = v) });
    ui.slider('Length L₁', { min: 0.2, max: 2, value: S.L1, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { S.L1 = v; makeTrail(); } });
    ui.slider('Length L₂', { min: 0.2, max: 2, value: S.L2, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { S.L2 = v; makeTrail(); } });
    ui.slider('Gravity g', { min: 0.5, max: 30, value: S.g, fmt: (v) => v.toFixed(2) + ' m/s²', onInput: (v) => (S.g = v) });
    ui.slider('Damping', { min: 0, max: 1, value: S.b, fmt: (v) => v.toFixed(2) + ' /s', onInput: (v) => (S.b = v) });
    ui.section('Display');
    ui.toggle('Trails', S.trails, (v) => (S.trails = v));
    ui.slider('Trail persistence', { min: 0.003, max: 0.2, value: S.fade, log: true, fmt: (v) => (1 / v / 60).toFixed(1) + ' s', onInput: (v) => (S.fade = v) });
    ui.toggle('Draw rods', S.rods, (v) => (S.rods = v));

    reset();
    makeTrail();

    /* ===== v3 extras ===== */
    const MAPN = env.q >= 0.75 ? 56 : 36, mapC = document.createElement('canvas');
    mapC.width = mapC.height = MAPN;
    const mctx = mapC.getContext('2d'), mimg = mctx.createImageData(MAPN, MAPN), m32 = new Uint32Array(mimg.data.buffer);
    const X3 = { on: true, next: 0, key: '', clicks: 0, rect: null };
    function flipTime(a1, a2) {
      const p = { t1: a1, t2: a2, w1: 0, w2: 0 }, h = 1 / 110, TM = 11;
      // energy test: if the start energy is below every flip configuration, it can never flip
      const E = -(S.m1 + S.m2) * S.g * S.L1 * Math.cos(a1) - S.m2 * S.g * S.L2 * Math.cos(a2);
      const Eflip = Math.min((S.m1 + S.m2) * S.g * S.L1 - S.m2 * S.g * S.L2, -(S.m1 + S.m2) * S.g * S.L1 + S.m2 * S.g * S.L2);
      if (E < Eflip && S.b === 0) return -1;
      for (let t = 0; t < TM; t += h) { rk4(p, h); if (p.t1 > Math.PI || p.t1 < -Math.PI || p.t2 > Math.PI || p.t2 < -Math.PI) return t; }
      return -1;
    }
    function mapWork() {
      const key = [S.m1, S.m2, S.L1, S.L2, S.g, S.b].join(',');
      if (key !== X3.key) { X3.key = key; X3.next = 0; m32.fill((255 << 24) | (40 << 16) | (20 << 8) | 14); }
      const t0 = performance.now(), tot = MAPN * MAPN;
      while (X3.next < tot && performance.now() - t0 < 3.5) {
        const i = X3.next++, ix = i % MAPN, iy = (i / MAPN) | 0;
        const ft = flipTime(((ix + 0.5) / MAPN) * U.TAU - Math.PI, Math.PI - ((iy + 0.5) / MAPN) * U.TAU);
        if (ft < 0) m32[i] = (255 << 24) | (70 << 16) | (26 << 8) | 16;
        else { const [r, g, b] = U.hsl2rgb(55 - Math.min(1, Math.log(1 + ft * 4) / Math.log(45)) * 300, 0.95, 0.62 - Math.min(0.3, ft / 30)); m32[i] = (255 << 24) | (b << 16) | (g << 8) | r; }
      }
      mctx.putImageData(mimg, 0, 0);
    }
    ui.section('Chaos map');
    ui.toggle('Show the flip-time fractal', X3.on, (v) => (X3.on = v));
    ui.note('Each pixel is a starting pose (θ₁ across, θ₂ up). Colour = how soon a bob flips over; dark = never. The ragged, fractal borders are chaos made visible. <b>Click the map</b> to launch from that pose.');
    const ext = {
      draw(ctx) {
        if (!X3.on) { X3.rect = null; return; }
        mapWork();
        const size = Math.min(210, env.H * 0.34), x = 14, y = 40;
        U.panel(ctx, x - 6, y - 26, size + 12, size + 50, 'Chaos map — click to launch');
        ctx.imageSmoothingEnabled = false; ctx.drawImage(mapC, x, y, size, size); ctx.imageSmoothingEnabled = true;
        X3.rect = [x, y, size];
        const mx = x + ((wrap(S.th1 * DEG) + Math.PI) / U.TAU) * size, my = y + ((Math.PI - wrap(S.th2 * DEG)) / U.TAU) * size;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, my, 6, 0, U.TAU); ctx.stroke();
        ctx.fillStyle = '#9fb3e0'; ctx.font = '10px Segoe UI, sans-serif'; ctx.textBaseline = 'top';
        ctx.fillText(X3.next < MAPN * MAPN ? 'computing… ' + Math.round((X3.next / (MAPN * MAPN)) * 100) + '%' : 'θ₁ →   θ₂ ↑   bright = flips fast', x, y + size + 6);
      },
      pointerdown(p) {
        const r = X3.rect;
        if (!r || p.x < r[0] || p.y < r[1] || p.x > r[0] + r[2] || p.y > r[1] + r[2]) return false;
        S.th1 = Math.round((((p.x - r[0]) / r[2]) * 360 - 180)); S.th2 = Math.round(180 - ((p.y - r[1]) / r[2]) * 360);
        s1.set(S.th1); s2.set(S.th2); reset(); X3.clicks++;
        return true;
      },
    };

    return {
      ext,
      probe() { return { mode: S.mode, div: divergence(), clicks: X3.clicks, n: pends.length, time }; },
      step(dt) {
        if (drag) return;
        const n = Math.min(60, Math.max(1, Math.ceil(dt * 400))), h = dt / n;
        for (let i = 0; i < n; i++) for (const p of pends) rk4(p, h);
        time += dt;
        Eh.push(energy(pends[0]));
        if (pends.length > 1) Dh.push(Math.log10(Math.max(1e-12, divergence())));
      },
      draw(ctx) {
        const W = env.W, H = env.H, G = geo();
        const bg = ctx.createRadialGradient(G.cx, G.cy, 10, G.cx, G.cy, Math.max(W, H) * 0.7);
        bg.addColorStop(0, '#141a33'); bg.addColorStop(1, '#05060d');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        // reach circle
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(G.cx, G.cy, (S.L1 + S.L2) * G.sc, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(G.cx, G.cy, S.L1 * G.sc, 0, TAU); ctx.stroke();

        // trails layer
        if (S.trails) {
          tctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
          tctx.globalCompositeOperation = 'destination-out';
          tctx.fillStyle = `rgba(0,0,0,${S.fade})`;
          tctx.fillRect(0, 0, W, H);
          tctx.globalCompositeOperation = 'lighter';
          tctx.lineWidth = pends.length > 10 ? 1.1 : 1.8;
          tctx.lineCap = 'round';
          for (const p of pends) {
            const [, , x2, y2] = positions(p, G);
            if (p.px !== null) {
              tctx.strokeStyle = `hsla(${p.hue},95%,62%,${pends.length > 10 ? 0.5 : 0.9})`;
              tctx.beginPath(); tctx.moveTo(p.px, p.py); tctx.lineTo(x2, y2); tctx.stroke();
            }
            p.px = x2; p.py = y2;
          }
          ctx.drawImage(trail, 0, 0, W, H);
        }
        // pendulums
        const many = pends.length > 10;
        for (const p of pends) {
          const [x1, y1, x2, y2] = positions(p, G);
          if (S.rods) {
            ctx.strokeStyle = many ? `hsla(${p.hue},80%,70%,0.35)` : 'rgba(225,232,255,0.85)';
            ctx.lineWidth = many ? 1 : 3;
            ctx.beginPath(); ctx.moveTo(G.cx, G.cy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          }
          const r1 = many ? 3 : 7 + Math.cbrt(S.m1) * 5, r2 = many ? 4 : 7 + Math.cbrt(S.m2) * 5;
          for (const [x, y, r] of [[x1, y1, r1], [x2, y2, r2]]) {
            const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r);
            g.addColorStop(0, `hsl(${p.hue},100%,88%)`); g.addColorStop(1, `hsl(${p.hue},85%,45%)`);
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
          }
        }
        // pivot mount
        ctx.fillStyle = '#cbd5f5';
        ctx.fillRect(G.cx - 26, G.cy - 7, 52, 4);
        ctx.beginPath(); ctx.arc(G.cx, G.cy, 4, 0, TAU); ctx.fill();

        // side plots
        if (G.side) {
          const x = W - G.side + 6, w = G.side - 18;
          // phase space
          U.panel(ctx, x, 12, w, w + 26, 'Phase space θ₁ vs θ₂');
          const px0 = x + 8, py0 = 34, ps = w - 16;
          if (pends.length > 2) pctx.clearRect(0, 0, PHS, PHS);
          else { pctx.globalCompositeOperation = 'destination-out'; pctx.fillStyle = 'rgba(0,0,0,0.004)'; pctx.fillRect(0, 0, PHS, PHS); pctx.globalCompositeOperation = 'source-over'; }
          for (const p of pends) {
            const u = ((wrap(p.t1) / Math.PI) * 0.5 + 0.5) * PHS, v = ((-wrap(p.t2) / Math.PI) * 0.5 + 0.5) * PHS;
            pctx.fillStyle = `hsla(${p.hue},95%,65%,${pends.length > 2 ? 1 : 0.6})`;
            pctx.fillRect(u - 1, v - 1, pends.length > 2 ? 3 : 1.6, pends.length > 2 ? 3 : 1.6);
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.strokeRect(px0, py0, ps, ps);
          ctx.beginPath(); ctx.moveTo(px0 + ps / 2, py0); ctx.lineTo(px0 + ps / 2, py0 + ps); ctx.moveTo(px0, py0 + ps / 2); ctx.lineTo(px0 + ps, py0 + ps / 2); ctx.stroke();
          ctx.drawImage(ph, px0, py0, ps, ps);
          // energy
          let y = w + 50;
          U.panel(ctx, x, y, w, 100, 'Total energy (J)');
          const [lo, hi] = Eh.range(), pad = Math.max(0.05 * Math.abs(E0), (hi - lo) * 0.1, 1e-6);
          ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5;
          Eh.draw(ctx, x + 8, y + 26, w - 16, 64, lo - pad, hi + pad);
          ctx.fillStyle = '#9fb3e0'; ctx.font = '10px monospace'; ctx.textBaseline = 'top';
          ctx.fillText(Eh.last().toFixed(3), x + w - 60, y + 8);
          // divergence
          if (pends.length > 1) {
            y += 112;
            U.panel(ctx, x, y, w, 120, 'log₁₀ divergence');
            const gy = y + 26, gh = 84;
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath();
            for (let k = -10; k <= 1; k += 3) { const yy = gy + gh - ((k + 10) / 11) * gh; ctx.moveTo(x + 8, yy); ctx.lineTo(x + w - 8, yy); }
            ctx.stroke();
            ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 1.5;
            Dh.draw(ctx, x + 8, gy, w - 16, gh, -10, 1);
          }
        }
        if (drag) {
          ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '12px Segoe UI, sans-serif'; ctx.textBaseline = 'top';
          ctx.fillText(`θ₁ = ${(pends[0].t1 / DEG).toFixed(0)}°   θ₂ = ${(pends[0].t2 / DEG).toFixed(0)}°  — release to start`, 14, 14);
        }
      },
      pointerdown(p) {
        const G = geo();
        const [x1, y1, x2, y2] = positions(pends[0], G);
        if (Math.hypot(p.x - x2, p.y - y2) < 30) drag = 2;
        else if (Math.hypot(p.x - x1, p.y - y1) < 30) drag = 1;
        else drag = null;
      },
      pointermove(p) {
        if (!drag) return;
        const G = geo(), base = pends[0];
        if (drag === 1) base.t1 = Math.atan2(p.x - G.cx, p.y - G.cy);
        else { const [x1, y1] = positions(base, G); base.t2 = Math.atan2(p.x - x1, p.y - y1); }
        S.th1 = Math.round(base.t1 / DEG); S.th2 = Math.round(base.t2 / DEG);
        pends.forEach((q, i) => { q.t1 = base.t1 + (i ? i * S.eps : 0); q.t2 = base.t2; q.w1 = q.w2 = 0; q.px = null; });
      },
      pointerup() {
        if (!drag) return;
        drag = null;
        s1.set(S.th1); s2.set(S.th2);
        const t1 = pends[0].t1, t2 = pends[0].t2;
        reset();
        pends.forEach((q, i) => { q.t1 = t1 + i * S.eps; q.t2 = t2; });
        E0 = energy(pends[0]);
      },
      resize() { makeTrail(); },
      reset,
      readouts() {
        const p = pends[0], E = energy(p);
        const d = divergence();
        const lyap = pends.length === 2 && time > 0.5 && d < 0.5 ? (Math.log(d) - Math.log(S.eps)) / time : null;
        return [
          ['θ₁', (wrap(p.t1) / DEG).toFixed(1) + '°'], ['θ₂', (wrap(p.t2) / DEG).toFixed(1) + '°'],
          ['ω₁', p.w1.toFixed(2) + ' rad/s'], ['ω₂', p.w2.toFixed(2) + ' rad/s'],
          ['Energy', E.toFixed(3) + ' J'], ['Energy drift', E0 ? (((E - E0) / Math.abs(E0)) * 100).toExponential(1) + ' %' : '—'],
          ['Time', time.toFixed(1) + ' s'], [pends.length > 1 ? 'Divergence' : 'Pendulums', pends.length > 1 ? d.toExponential(2) : 1],
          ...(lyap !== null ? [['Lyapunov λ ≈', lyap.toFixed(2) + ' /s']] : []),
        ];
      },
    };
  },
});

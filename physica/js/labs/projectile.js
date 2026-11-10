'use strict';
/* LAB 09 — Ballistics: projectile motion with quadratic air drag, wind and planetary environments (RK4) */
PhysLab.define({
  id: 'projectile',
  title: 'Ballistics Range',
  subtitle: 'Projectile motion with real air drag, wind and gravity on other worlds — compare with the ideal parabola.',
  color: '#fb923c',
  tags: ['Kinematics', 'Drag', 'RK4'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 52C18 10 40 6 58 50" stroke-dasharray="3 4"/><path d="M8 52C16 22 32 14 46 52"/><rect x="2" y="50" width="14" height="6" rx="2" fill="currentColor"/><path d="M4 50l10-12" stroke-width="4"/><circle cx="31" cy="20" r="3.5" fill="currentColor"/><path d="M0 58h64"/></svg>`,
  hint: 'Drag on the range to aim, release to fire · or press F · pick a projectile and planet in the panel',
  howto: [
    '<b>Press and drag</b> anywhere to aim the cannon; <b>release</b> to fire. Or press <b>F</b> / the Fire button.',
    'The dashed line is the ideal vacuum parabola; the solid trails are the real flights with drag.',
    'Dots on each trail mark every half-second of flight.',
    'Use <b>Find optimal angle</b> — with drag it is usually well below 45°.',
  ],
  theory: `
  <h3>Equations of motion</h3>
  <div class="eq">m dv/dt = m g − ½ ρ C_d A |v − w| (v − w)</div>
  <p>Gravity pulls down; quadratic drag opposes motion relative to the air (w is the wind velocity). Integrated with 4th-order Runge–Kutta at 400 Hz.</p>
  <h3>The vacuum parabola</h3>
  <div class="eq">y = h₀ + x tanθ − g x² / (2 v₀² cos²θ)</div>
  <div class="eq">R = (v₀ cosθ / g) (v₀ sinθ + √(v₀² sin²θ + 2 g h₀))</div>
  <p>Without air the range is maximal at 45° (from ground level) and the path is symmetric.</p>
  <h3>Terminal velocity</h3>
  <div class="eq">v_t = √(2 m g / (ρ C_d A))</div>
  <p>A ping-pong ball's terminal speed is only ~9 m/s, so drag dominates its flight; a shot-put barely notices the air. With drag, the descent is steeper than the ascent and the best angle drops below 45°.</p>
  <h3>Other worlds</h3>
  <p>On the Moon there is no air and gravity is 1/6 of Earth's; Venus has a crushing atmosphere 50× denser than Earth's; Titan has low gravity but thick air — perfect for flying.</p>`,

  create(env) {
    const { ui } = env;
    const TAU = U.TAU, DEG = U.DEG;
    const PROJ = {
      baseball: { name: 'Baseball', m: 0.145, d: 0.074, cd: 0.35, col: '#f1f5f9' },
      golf: { name: 'Golf ball', m: 0.0459, d: 0.0427, cd: 0.25, col: '#e2e8f0' },
      pingpong: { name: 'Ping-pong ball', m: 0.0027, d: 0.04, cd: 0.5, col: '#fdba74' },
      soccer: { name: 'Football', m: 0.43, d: 0.22, cd: 0.25, col: '#f8fafc' },
      cannon: { name: 'Cannonball', m: 6, d: 0.11, cd: 0.47, col: '#94a3b8' },
      shot: { name: 'Shot put', m: 7.26, d: 0.12, cd: 0.47, col: '#a8a29e' },
      beach: { name: 'Beach ball', m: 0.25, d: 0.5, cd: 0.47, col: '#f472b6' },
    };
    const PLANETS = {
      earth: { name: 'Earth', g: 9.81, rho: 1.225, sky: ['#0c2a4a', '#2e5f8a'], ground: '#1e3a26' },
      moon: { name: 'Moon', g: 1.62, rho: 0, sky: ['#020205', '#0b0d16'], ground: '#4b4b52' },
      mars: { name: 'Mars', g: 3.71, rho: 0.02, sky: ['#3b1d12', '#a0583a'], ground: '#6b2f1a' },
      venus: { name: 'Venus', g: 8.87, rho: 65, sky: ['#3d3214', '#a8873c'], ground: '#5c4a20' },
      titan: { name: 'Titan', g: 1.35, rho: 5.4, sky: ['#2a1d06', '#8a6420'], ground: '#4a3a1c' },
      jupiter: { name: 'Jupiter (cloud tops)', g: 24.79, rho: 0.16, sky: ['#2a1a10', '#b08360'], ground: '#5a3d26' },
    };
    const S = { angle: 40, v0: 35, h0: 0, proj: 'baseball', planet: 'earth', wind: 0, vac: true, vecs: true, m: 0.145, d: 0.074, cd: 0.35, g: 9.81, rho: 1.225 };
    const COLS = ['#fb923c', '#38bdf8', '#a3e635', '#f472b6', '#facc15', '#a78bfa', '#2dd4bf', '#f87171'];
    let shots = [], colorIdx = 0, view = { s: 6, tx: 6 }, aiming = false;

    const area = () => Math.PI * (S.d / 2) ** 2;
    function accel(vx, vy, o) {
      const rx = vx - S.wind, ry = vy, vr = Math.hypot(rx, ry);
      const k = (0.5 * S.rho * S.cd * area()) / S.m;
      o[0] = -k * vr * rx; o[1] = -S.g - k * vr * ry;
    }
    const a1 = [0, 0], a2 = [0, 0], a3 = [0, 0], a4 = [0, 0];
    function rk4(s, h) {
      accel(s.vx, s.vy, a1);
      accel(s.vx + a1[0] * h / 2, s.vy + a1[1] * h / 2, a2);
      accel(s.vx + a2[0] * h / 2, s.vy + a2[1] * h / 2, a3);
      accel(s.vx + a3[0] * h, s.vy + a3[1] * h, a4);
      s.x += h * (s.vx + (h / 6) * (a1[0] + a2[0] + a3[0])); // position via velocity Taylor/RK4 composite
      s.y += h * (s.vy + (h / 6) * (a1[1] + a2[1] + a3[1]));
      s.vx += (h / 6) * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]);
      s.vy += (h / 6) * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
      s.t += h;
    }
    function vacuum() {
      const th = S.angle * DEG, vx = S.v0 * Math.cos(th), vy = S.v0 * Math.sin(th), g = S.g;
      const T = (vy + Math.sqrt(vy * vy + 2 * g * S.h0)) / g;
      return { R: vx * T, H: S.h0 + (vy * vy) / (2 * g), T };
    }
    function fire() {
      const th = S.angle * DEG;
      const s = {
        x: 0, y: S.h0, vx: S.v0 * Math.cos(th), vy: S.v0 * Math.sin(th), t: 0, live: true, pts: [0, S.h0], marks: [], nextMark: 0.5,
        col: COLS[colorIdx++ % COLS.length], maxH: S.h0, name: PROJ[S.proj] ? PROJ[S.proj].name : 'Custom', angle: S.angle, v0: S.v0,
        E0: 0.5 * S.m * S.v0 * S.v0 + S.m * S.g * S.h0, m: S.m, r: Math.max(3, Math.min(9, S.d * 40)), pcol: PROJ[S.proj] ? PROJ[S.proj].col : '#fff',
      };
      shots.push(s);
      if (shots.length > 10) shots.shift();
    }
    function simulateRange(angle) {
      const th = angle * DEG, s = { x: 0, y: S.h0, vx: S.v0 * Math.cos(th), vy: S.v0 * Math.sin(th), t: 0 };
      const h = 1 / 120;
      for (let i = 0; i < 200000; i++) {
        const py = s.y, px = s.x;
        rk4(s, h);
        if (s.y < 0) return px + (s.x - px) * (py / (py - s.y));
      }
      return s.x;
    }
    function optimal() {
      let best = 0, ba = 45;
      for (let a = 1; a <= 89; a += 1) { const r = simulateRange(a); if (r > best) { best = r; ba = a; } }
      for (let a = ba - 1; a <= ba + 1; a += 0.1) { const r = simulateRange(a); if (r > best) { best = r; ba = a; } }
      S.angle = Math.round(ba * 10) / 10; angSl.set(S.angle);
      const vac = vacuum();
      env.toast(`Optimal angle with drag: ${S.angle.toFixed(1)}° → ${best.toFixed(1)} m   (vacuum range at this angle: ${vac.R.toFixed(1)} m)`, 4200);
    }

    function applyProj(k) {
      S.proj = k;
      const p = PROJ[k];
      S.m = p.m; S.d = p.d; S.cd = p.cd;
      mSl.set(S.m); dSl.set(S.d); cdSl.set(S.cd);
    }
    function applyPlanet(k) {
      S.planet = k;
      const p = PLANETS[k];
      S.g = p.g; S.rho = p.rho; gSl.set(S.g); rhoSl.set(Math.max(S.rho, 0.0001));
    }

    /* ---------- UI ---------- */
    ui.section('Launch');
    const angSl = ui.slider('Launch angle θ', { min: 0, max: 90, step: 0.5, value: S.angle, fmt: (v) => v.toFixed(1) + '°', onInput: (v) => (S.angle = v) });
    ui.slider('Launch speed v₀', { min: 1, max: 250, step: 0.5, value: S.v0, fmt: (v) => v.toFixed(1) + ' m/s', onInput: (v) => (S.v0 = v) });
    ui.slider('Launch height h₀', { min: 0, max: 200, step: 0.5, value: S.h0, fmt: (v) => v.toFixed(1) + ' m', onInput: (v) => (S.h0 = v) });
    ui.buttons([
      { label: '🔥 Fire (F)', primary: true, onClick: fire },
      { label: 'Find optimal angle', onClick: optimal },
      { label: 'Clear shots', onClick: () => { shots = []; } },
    ]);
    ui.section('Projectile');
    ui.select('Object', Object.keys(PROJ).map((k) => [k, PROJ[k].name]), S.proj, applyProj);
    const mSl = ui.slider('Mass m', { min: 0.001, max: 20, value: S.m, log: true, fmt: (v) => (v < 1 ? (v * 1000).toFixed(1) + ' g' : v.toFixed(2) + ' kg'), onInput: (v) => (S.m = v) });
    const dSl = ui.slider('Diameter d', { min: 0.01, max: 1, value: S.d, log: true, fmt: (v) => (v * 100).toFixed(1) + ' cm', onInput: (v) => (S.d = v) });
    const cdSl = ui.slider('Drag coefficient C_d', { min: 0, max: 1.5, step: 0.01, value: S.cd, fmt: (v) => v.toFixed(2), onInput: (v) => (S.cd = v) });
    ui.section('Environment');
    ui.select('World', Object.keys(PLANETS).map((k) => [k, PLANETS[k].name]), S.planet, applyPlanet);
    const gSl = ui.slider('Gravity g', { min: 0.5, max: 30, step: 0.01, value: S.g, fmt: (v) => v.toFixed(2) + ' m/s²', onInput: (v) => (S.g = v) });
    const rhoSl = ui.slider('Air density ρ', { min: 0.0001, max: 80, value: S.rho, log: true, fmt: (v) => (v < 0.001 ? '≈ 0' : v.toFixed(3)) + ' kg/m³', onInput: (v) => (S.rho = v < 0.00011 ? 0 : v) });
    ui.slider('Wind (horizontal)', { min: -30, max: 30, step: 0.5, value: S.wind, fmt: (v) => v.toFixed(1) + ' m/s', onInput: (v) => (S.wind = v) });
    ui.section('Display');
    ui.toggle('Ideal vacuum parabola', S.vac, (v) => (S.vac = v));
    ui.toggle('Force & velocity vectors', S.vecs, (v) => (S.vecs = v));

    const origin = () => ({ x: 70, y: env.H - 56 });

    return {
      step(dt) {
        const h = 1 / 400;
        for (const s of shots) {
          if (!s.live) continue;
          let n = Math.min(4000, Math.ceil(dt / h));
          while (n-- > 0) {
            const px = s.x, py = s.y;
            rk4(s, h);
            if (s.y > s.maxH) s.maxH = s.y;
            if (s.t >= s.nextMark) { s.marks.push(s.x, s.y); s.nextMark += 0.5; }
            if (s.y < 0) {
              const f = py / (py - s.y);
              s.x = px + (s.x - px) * f; s.y = 0; s.t -= h * (1 - f);
              s.live = false;
              s.vImp = Math.hypot(s.vx, s.vy); s.angImp = Math.atan2(-s.vy, s.vx) / DEG;
              s.Eloss = 1 - (0.5 * s.m * s.vImp * s.vImp) / s.E0;
              break;
            }
          }
          const L = s.pts.length;
          if (Math.hypot(s.x - s.pts[L - 2], s.y - s.pts[L - 1]) > 0.002 * Math.max(10, s.v0 * s.v0 / 10) || !s.live) s.pts.push(s.x, s.y);
          if (s.pts.length > 20000) s.pts.splice(2, 2);
        }
      },
      draw(ctx) {
        const W = env.W, H = env.H, O = origin(), P = PLANETS[S.planet];
        // view fitting
        const vac = vacuum();
        let xmax = Math.max(10, S.vac ? vac.R : 0), ymax = Math.max(5, S.vac ? vac.H : S.h0);
        for (const s of shots) { xmax = Math.max(xmax, s.x, ...(s.live ? [] : [s.x])); ymax = Math.max(ymax, s.maxH); }
        if (!S.vac && !shots.length) { xmax = Math.max(xmax, vac.R * 0.6); ymax = Math.max(ymax, vac.H * 0.6); }
        view.tx = Math.min((W - O.x - 50) / (xmax * 1.06), (O.y - 50) / (ymax * 1.15));
        view.s += (view.tx - view.s) * 0.12;
        const s = view.s, X = (x) => O.x + x * s, Y = (y) => O.y - y * s;
        // sky & ground
        const sky = ctx.createLinearGradient(0, 0, 0, O.y);
        sky.addColorStop(0, P.sky[0]); sky.addColorStop(1, P.sky[1]);
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, O.y);
        ctx.fillStyle = P.ground; ctx.fillRect(0, O.y, W, H - O.y);
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, O.y, W, 2);
        // grid
        const st = U.niceStep(Math.max((W - O.x) / s, (O.y) / s), 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(230,238,255,0.65)'; ctx.font = '11px Segoe UI, sans-serif';
        ctx.beginPath();
        for (let x = 0; X(x) < W; x += st) { ctx.moveTo(X(x), 0); ctx.lineTo(X(x), O.y); }
        for (let y = st; Y(y) > 0; y += st) { ctx.moveTo(O.x, Y(y)); ctx.lineTo(W, Y(y)); }
        ctx.stroke();
        ctx.textBaseline = 'top'; ctx.textAlign = 'center';
        for (let x = 0; X(x) < W - 10; x += st) ctx.fillText(+x.toFixed(6) + ' m', X(x), O.y + 6);
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        for (let y = st; Y(y) > 10; y += st) ctx.fillText(+y.toFixed(6) + ' m', O.x - 8, Y(y));
        ctx.textAlign = 'left';
        // tower
        if (S.h0 > 0) {
          ctx.fillStyle = '#3b4258'; ctx.fillRect(X(0) - 14, Y(S.h0), 28, S.h0 * s);
          ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(X(0) - 14, Y(S.h0), 28, S.h0 * s);
        }
        // vacuum parabola
        if (S.vac) {
          const th = S.angle * DEG, c = Math.cos(th), tn = Math.tan(th);
          ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5;
          ctx.beginPath();
          const n = 120;
          for (let k = 0; k <= n; k++) {
            const x = (vac.R * k) / n, y = c > 1e-6 ? S.h0 + x * tn - (S.g * x * x) / (2 * S.v0 * S.v0 * c * c) : S.h0;
            k ? ctx.lineTo(X(x), Y(Math.max(0, y))) : ctx.moveTo(X(x), Y(y));
          }
          if (c < 1e-6) { ctx.moveTo(X(0), Y(S.h0)); ctx.lineTo(X(0), Y(vac.H)); }
          ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.fillText(`vacuum: R = ${vac.R.toFixed(1)} m, H = ${vac.H.toFixed(1)} m`, X(vac.R / 2) - 60, Y(vac.H) - 14);
        }
        // shots
        for (const sh of shots) {
          ctx.strokeStyle = sh.col; ctx.lineWidth = 2.2;
          ctx.beginPath();
          for (let i = 0; i < sh.pts.length; i += 2) i ? ctx.lineTo(X(sh.pts[i]), Y(sh.pts[i + 1])) : ctx.moveTo(X(sh.pts[i]), Y(sh.pts[i + 1]));
          if (sh.live) ctx.lineTo(X(sh.x), Y(sh.y));
          ctx.stroke();
          ctx.fillStyle = sh.col;
          for (let i = 0; i < sh.marks.length; i += 2) { ctx.beginPath(); ctx.arc(X(sh.marks[i]), Y(sh.marks[i + 1]), 2.6, 0, TAU); ctx.fill(); }
          if (!sh.live) {
            ctx.strokeStyle = sh.col; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(X(sh.x) - 5, O.y - 5); ctx.lineTo(X(sh.x) + 5, O.y + 5); ctx.moveTo(X(sh.x) + 5, O.y - 5); ctx.lineTo(X(sh.x) - 5, O.y + 5); ctx.stroke();
            ctx.fillStyle = sh.col; ctx.textBaseline = 'top';
            ctx.fillText(sh.x.toFixed(1) + ' m', X(sh.x) - 16, O.y + 22);
          }
        }
        // cannon
        ctx.save(); ctx.translate(X(0), Y(S.h0)); ctx.rotate(-S.angle * DEG);
        const bg = ctx.createLinearGradient(0, -7, 0, 7); bg.addColorStop(0, '#9aa5bd'); bg.addColorStop(1, '#3c4357');
        ctx.fillStyle = bg; U.rrect(ctx, -6, -7, 46, 14, 5); ctx.fill();
        ctx.fillStyle = '#20263a'; ctx.fillRect(36, -8, 6, 16);
        ctx.restore();
        ctx.fillStyle = '#5b4632'; ctx.beginPath(); ctx.arc(X(0), Y(S.h0) + 4, 11, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#2a2016'; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(X(0), Y(S.h0), 60, -S.angle * DEG, 0); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
        ctx.fillText(S.angle.toFixed(1) + '°', X(0) + 64, Y(S.h0) - 12);
        // live projectiles + vectors
        for (const sh of shots) {
          if (!sh.live) continue;
          const px = X(sh.x), py = Y(sh.y);
          ctx.fillStyle = sh.pcol; ctx.beginPath(); ctx.arc(px, py, sh.r, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke();
          if (S.vecs) {
            accel(sh.vx, sh.vy, a1);
            const dax = a1[0], day = a1[1] + S.g;
            const va = 1.6;
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#4ade80'; ctx.beginPath(); U.arrow(ctx, px, py, px + sh.vx * va, py - sh.vy * va, 8); ctx.stroke();
            ctx.strokeStyle = '#f87171'; ctx.beginPath(); U.arrow(ctx, px, py, px, py + S.g * 4, 7); ctx.stroke();
            ctx.strokeStyle = '#fbbf24'; ctx.beginPath(); U.arrow(ctx, px, py, px + dax * 4, py - day * 4, 7); ctx.stroke();
          }
        }
        // legend / HUD
        U.panel(ctx, W - 214, 12, 202, S.vecs ? 98 : 46, PLANETS[S.planet].name);
        ctx.font = '11.5px Segoe UI, sans-serif'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#dbe5ff';
        ctx.fillText(`g = ${S.g.toFixed(2)} m/s²   ρ = ${S.rho.toFixed(3)}`, W - 204, 30);
        if (S.vecs) {
          ctx.fillStyle = '#4ade80'; ctx.fillText('━ velocity', W - 204, 50);
          ctx.fillStyle = '#f87171'; ctx.fillText('━ gravity (accel.)', W - 204, 66);
          ctx.fillStyle = '#fbbf24'; ctx.fillText('━ air drag (accel.)', W - 204, 82);
        }
        if (S.wind) {
          const wy = 128, wx = W - 110;
          ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
          ctx.beginPath(); U.arrow(ctx, wx - S.wind * 2, wy, wx + S.wind * 2, wy, 8); ctx.stroke();
          ctx.fillStyle = '#cbd5e1'; ctx.fillText(`wind ${S.wind.toFixed(1)} m/s`, wx - 40, wy + 8);
        }
      },
      pointerdown(p) { aiming = true; this.pointermove(p); },
      pointermove(p) {
        if (!aiming) return;
        const O = origin(), s = view.s;
        const cx = O.x, cy = O.y - S.h0 * s;
        const a = Math.atan2(cy - p.y, p.x - cx) / DEG;
        S.angle = Math.round(U.clamp(a, 0, 90) * 2) / 2;
        angSl.set(S.angle);
      },
      pointerup() { if (aiming) { aiming = false; fire(); } },
      key(e) { if (e.key === 'f' || e.key === 'F' || e.key === 'Enter') fire(); },
      reset() { shots = []; },
      readouts() {
        const sh = shots[shots.length - 1], vac = vacuum();
        const vt = S.rho > 0 && S.cd > 0 ? Math.sqrt((2 * S.m * S.g) / (S.rho * S.cd * area())) : Infinity;
        const out = [];
        if (sh) {
          out.push(['Flight time', sh.t.toFixed(2) + ' s'], [sh.live ? 'Distance' : 'Range', sh.x.toFixed(2) + ' m'], ['Max height', sh.maxH.toFixed(2) + ' m']);
          if (!sh.live) out.push(['Impact speed', sh.vImp.toFixed(1) + ' m/s'], ['Impact angle', sh.angImp.toFixed(1) + '°'], ['Energy lost to drag', (sh.Eloss * 100).toFixed(1) + ' %']);
          else out.push(['Speed', Math.hypot(sh.vx, sh.vy).toFixed(1) + ' m/s'], ['Height', sh.y.toFixed(1) + ' m']);
        }
        out.push(['Vacuum range', vac.R.toFixed(1) + ' m'], ['Vacuum apex', vac.H.toFixed(1) + ' m'], ['Terminal velocity', isFinite(vt) ? vt.toFixed(1) + ' m/s' : '∞ (no air)'],
          ['Drag / weight at v₀', S.rho ? ((0.5 * S.rho * S.cd * area() * S.v0 * S.v0) / (S.m * S.g)).toFixed(2) : '0']);
        return out;
      },
    };
  },
});

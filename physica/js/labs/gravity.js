'use strict';
/* LAB 02 — Orbital Mechanics: N-body gravity with leapfrog integration, merging, test-particle galaxies */
PhysLab.define({
  id: 'gravity',
  title: 'Orbital Mechanics',
  subtitle: 'N-body gravity: solar systems, binary stars, the figure-eight orbit and colliding galaxies.',
  color: '#fbbf24',
  tags: ['Gravitation', 'N-body', 'Chaos'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="32" cy="32" r="7" fill="currentColor"/><ellipse cx="32" cy="32" rx="27" ry="14" transform="rotate(-20 32 32)"/><circle cx="56" cy="23" r="3.5" fill="currentColor"/><ellipse cx="32" cy="32" rx="16" ry="8" transform="rotate(-20 32 32)" stroke-dasharray="3 3"/></svg>`,
  hint: 'Drag with the left mouse to launch a body (arrow = velocity, dashed line = predicted path) · right-drag pans · wheel zooms',
  howto: [
    '<b>Left drag</b> launches a new body; the dashed curve predicts its path.',
    '<b>Right drag</b> (or Shift + drag) pans the camera, the <b>mouse wheel</b> zooms.',
    'Set the new body\'s mass with the slider — try a black-hole-sized mass through a solar system.',
    '<b>Reverse time</b> flips every velocity: Newtonian gravity is time-reversible (until bodies merge).',
  ],
  theory: `
  <h3>Newton's law of gravitation</h3>
  <div class="eq">F = G m₁ m₂ / r²</div>
  <p>Every body attracts every other body. The acceleration of body i is the sum over all others:</p>
  <div class="eq">aᵢ = Σ G mⱼ (rⱼ − rᵢ) / (|rⱼ − rᵢ|² + ε²)^{3/2}</div>
  <h3>Leapfrog integrator</h3>
  <div class="eq">v += a·Δt/2 ;  x += v·Δt ;  v += a(x)·Δt/2</div>
  <p>This "kick-drift-kick" scheme is <b>symplectic</b>: it conserves energy to high accuracy over very long times, which is why orbits stay closed instead of spiralling. Watch the total-energy readout.</p>
  <h3>Kepler &amp; circular orbits</h3>
  <div class="eq">v_circ = √(G M / r)    T² ∝ r³</div>
  <p>Outer planets in the solar-system preset move slower and take longer — Kepler's third law.</p>
  <h3>Lagrange points &amp; rings</h3>
  <p><b>Trojan asteroids</b> gather 60° ahead of and behind a giant planet, at the stable L4 and L5 Lagrange points, and slowly "librate" around them. In the <b>rings</b> preset a small moon clears a gap and sculpts the ring edges — as moons do in Saturn's rings.</p>
  <h3>The three-body problem</h3>
  <p>There is no general closed-form solution for three bodies. The <b>figure-eight</b> (Chenciner &amp; Montgomery, 2000) is one of the rare periodic solutions; nudge it and it decays into chaos. In the <b>galaxy</b> preset, massless stars orbit two cores; tidal forces during the encounter pull out long tails and bridges like those seen in real interacting galaxies.</p>`,

  create(env) {
    const { ui } = env;
    const TAU = U.TAU, q = env.q;
    const TL = q >= 1 ? 260 : q >= 0.75 ? 180 : 110;
    const MAXT = Math.round(300 + 900 * q);
    const S = { G: 1, merge: true, trails: true, follow: 'com', newMass: 3000, pred: true, eps: 3 };
    let B = [];
    const TX = new Float32Array(MAXT), TY = new Float32Array(MAXT), TVX = new Float32Array(MAXT), TVY = new Float32Array(MAXT);
    const TAX = new Float32Array(MAXT), TAY = new Float32Array(MAXT), TC = new Uint8Array(MAXT);
    let tn = 0, simT = 0, subCount = 0;
    const cam = { x: 0, y: 0, z: 1 };
    let launch = null, pan = null, pred = null;
    const TCOL = ['#9ad1ff', '#ffb38a', '#c9a6ff'];
    const starSpr = U.glow([255, 200, 110], 32, 0.12);
    const stars = [];
    for (let i = 0; i < 260; i++) stars.push([Math.random(), Math.random(), Math.random() * 1.3 + 0.2, Math.random()]);

    const radius = (m) => 1.6 + Math.cbrt(m) * 0.085;
    function body(x, y, vx, vy, m, col) {
      const b = { x, y, vx, vy, ax: 0, ay: 0, m, r: radius(m), col: col || pickCol(m), tr: new Float32Array(TL * 2), ti: 0, tn: 0 };
      B.push(b);
      return b;
    }
    function pickCol(m) {
      if (m >= 1e6) return '#ffe8a8';
      const h = Math.random() * 360;
      const [r, g, b] = U.hsl2rgb(h, 0.65, 0.62);
      return `rgb(${r},${g},${b})`;
    }
    function addTest(x, y, vx, vy, c) {
      if (tn >= MAXT) return;
      TX[tn] = x; TY[tn] = y; TVX[tn] = vx; TVY[tn] = vy; TC[tn] = c; tn++;
    }
    function orbitTests(c, n, rmin, rmax, cIdx, dir = 1) {
      for (let i = 0; i < n; i++) {
        const r = Math.sqrt(U.rand(rmin * rmin, rmax * rmax)), a = Math.random() * TAU;
        const v = Math.sqrt((S.G * c.m) / r) * dir;
        addTest(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, c.vx - Math.sin(a) * v, c.vy + Math.cos(a) * v, cIdx);
      }
    }

    /* ---------- physics ---------- */
    function acc() {
      const n = B.length, G = S.G, e2 = S.eps * S.eps;
      for (const b of B) { b.ax = 0; b.ay = 0; }
      for (let i = 0; i < n; i++) {
        const a = B[i];
        for (let j = i + 1; j < n; j++) {
          const b = B[j], dx = b.x - a.x, dy = b.y - a.y;
          const r2 = dx * dx + dy * dy + e2, inv = G / (r2 * Math.sqrt(r2));
          a.ax += dx * inv * b.m; a.ay += dy * inv * b.m;
          b.ax -= dx * inv * a.m; b.ay -= dy * inv * a.m;
        }
      }
    }
    function accTests() {
      const G = S.G, e2 = 36;
      for (let k = 0; k < tn; k++) {
        let ax = 0, ay = 0;
        const x = TX[k], y = TY[k];
        for (const b of B) {
          const dx = b.x - x, dy = b.y - y, d2 = dx * dx + dy * dy;
          if (d2 < b.r * b.r) { ax = NaN; break; }
          const r2 = d2 + e2, inv = (G * b.m) / (r2 * Math.sqrt(r2));
          ax += dx * inv; ay += dy * inv;
        }
        TAX[k] = ax; TAY[k] = ay;
      }
      // swallow test particles that fell into a body
      for (let k = tn - 1; k >= 0; k--) {
        if (TAX[k] !== TAX[k]) {
          tn--;
          TX[k] = TX[tn]; TY[k] = TY[tn]; TVX[k] = TVX[tn]; TVY[k] = TVY[tn]; TC[k] = TC[tn]; TAX[k] = TAX[tn]; TAY[k] = TAY[tn];
        }
      }
    }
    function mergeCheck() {
      let merged = false;
      for (let i = 0; i < B.length; i++) {
        const a = B[i];
        if (a.dead) continue;
        for (let j = i + 1; j < B.length; j++) {
          const b = B[j];
          if (b.dead) continue;
          const dx = b.x - a.x, dy = b.y - a.y, rr = (a.r + b.r) * 0.75;
          if (dx * dx + dy * dy < rr * rr) {
            const big = a.m >= b.m ? a : b, sm = big === a ? b : a, M = a.m + b.m;
            big.x = (a.x * a.m + b.x * b.m) / M; big.y = (a.y * a.m + b.y * b.m) / M;
            big.vx = (a.vx * a.m + b.vx * b.m) / M; big.vy = (a.vy * a.m + b.vy * b.m) / M;
            big.m = M; big.r = radius(M); sm.dead = true; merged = true;
            if (big.m >= 1e6 && !big.col.startsWith('#ffe')) big.col = '#ffe8a8';
          }
        }
      }
      if (merged) B = B.filter((b) => !b.dead);
    }
    function substep(h) {
      const hh = h / 2;
      for (const b of B) { b.vx += b.ax * hh; b.vy += b.ay * hh; b.x += b.vx * h; b.y += b.vy * h; }
      for (let k = 0; k < tn; k++) { TVX[k] += TAX[k] * hh; TVY[k] += TAY[k] * hh; TX[k] += TVX[k] * h; TY[k] += TVY[k] * h; }
      if (S.merge) mergeCheck();
      acc();
      accTests();
      for (const b of B) { b.vx += b.ax * hh; b.vy += b.ay * hh; }
      for (let k = 0; k < tn; k++) { TVX[k] += TAX[k] * hh; TVY[k] += TAY[k] * hh; }
      simT += h;
      if (++subCount % 3 === 0) for (const b of B) { b.tr[b.ti * 2] = b.x; b.tr[b.ti * 2 + 1] = b.y; b.ti = (b.ti + 1) % TL; if (b.tn < TL) b.tn++; }
    }

    /* ---------- presets ---------- */
    function preset(name) {
      B = []; tn = 0; simT = 0; cam.x = 0; cam.y = 0;
      let extent = 400;
      if (name === 'solar') {
        const sun = body(0, 0, 0, 0, 5e6, '#ffe8a8');
        const rs = [62, 100, 148, 210, 300, 395], ms = [300, 2500, 2.0e4, 1500, 1.2e5, 5e4];
        const cols = ['#b9a89a', '#e8c27a', '#4aa3ff', '#e0663f', '#d9b48a', '#9fd3e6'];
        rs.forEach((r, i) => {
          const a = Math.random() * TAU, v = Math.sqrt((S.G * sun.m) / r);
          const p = body(Math.cos(a) * r, Math.sin(a) * r, -Math.sin(a) * v, Math.cos(a) * v, ms[i], cols[i]);
          if (i === 2) { const d = 9, vm = Math.sqrt((S.G * p.m) / d); body(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, p.vx - Math.sin(a) * vm, p.vy + Math.cos(a) * vm, 40, '#d6d6d6'); }
        });
        orbitTests(sun, Math.min(MAXT, Math.round(250 * q + 80)), 240, 268, 0);
        const ca = 2.4, rp = 70, ra = 470, a = (rp + ra) / 2, vp = Math.sqrt(S.G * sun.m * (2 / rp - 1 / a));
        body(Math.cos(ca) * rp, Math.sin(ca) * rp, -Math.sin(ca) * vp, Math.cos(ca) * vp, 20, '#bfefff');
        extent = 430;
      } else if (name === 'binary') {
        const m = 2.5e6, d = 120, v = Math.sqrt((S.G * m) / (2 * d));
        body(-d / 2, 0, 0, -v, m, '#ffd38a');
        body(d / 2, 0, 0, v, m, '#a8d4ff');
        const pv = Math.sqrt((S.G * 2 * m) / 330);
        body(330, 0, 0, pv, 3000, '#7ee0a0');
        const c = { x: 0, y: 0, vx: 0, vy: 0, m: 2 * m };
        orbitTests(c, Math.min(MAXT, Math.round(500 * q)), 240, 470, 2);
        extent = 480;
      } else if (name === 'eight') {
        S.merge = false; mergeT.set(false);
        const L = 180, m = 1e6, vs = Math.sqrt((S.G * m) / L);
        const x1 = 0.97000436, y1 = -0.24308753, vx3 = -0.93240737, vy3 = -0.86473146;
        body(x1 * L, y1 * L, (-vx3 / 2) * vs, (-vy3 / 2) * vs, m, '#ff9f7a');
        body(-x1 * L, -y1 * L, (-vx3 / 2) * vs, (-vy3 / 2) * vs, m, '#7ad0ff');
        body(0, 0, vx3 * vs, vy3 * vs, m, '#c7ff8a');
        extent = 230;
      } else if (name === 'galaxies') {
        S.merge = false; mergeT.set(false);
        const m = 3e6;
        const g1 = body(-380, -200, 45, 0, m, '#ffe1a0');
        const g2 = body(380, 200, -45, 0, m, '#cfe0ff');
        const n = Math.floor(MAXT / 2);
        orbitTests(g1, n, 28, 165, 0, 1);
        orbitTests(g2, n, 28, 165, 1, -1);
        extent = 480;
      } else if (name === 'cluster') {
        for (let i = 0; i < 90; i++) {
          const r = Math.sqrt(Math.random()) * 330, a = Math.random() * TAU, m = Math.pow(10, U.rand(3, 4.7));
          const v = 0.8 * Math.sqrt((S.G * 1.6e6 * (r / 330) ** 2) / Math.max(r, 20));
          body(Math.cos(a) * r, Math.sin(a) * r, -Math.sin(a) * v + U.randn() * 6, Math.cos(a) * v + U.randn() * 6, m);
        }
        extent = 380;
      } else if (name === 'trojans') {
        const sun = body(0, 0, 0, 0, 5e6, '#ffe8a8'), r = 260, v = Math.sqrt((S.G * sun.m) / r);
        const jup = body(r, 0, 0, v, 5e4, '#d9b48a');
        sun.vy = -(jup.m * v) / sun.m;
        for (const off of [Math.PI / 3, -Math.PI / 3]) for (let i = 0; i < Math.floor(MAXT / 2); i++) {
          const a = off + U.randn() * 0.12, rr = r + U.randn() * 7, vv = Math.sqrt((S.G * sun.m) / rr);
          addTest(Math.cos(a) * rr, Math.sin(a) * rr, -Math.sin(a) * vv, Math.cos(a) * vv, off > 0 ? 0 : 2);
        }
        extent = 380;
      } else if (name === 'rings') {
        const pl = body(0, 0, 0, 0, 4e6, '#e8c27a');
        orbitTests(pl, MAXT, 70, 210, 0);
        const r = 150, v = Math.sqrt((S.G * pl.m) / r);
        body(r, 0, 0, v, 6000, '#d6d6d6');
        const r2 = 300, v2 = Math.sqrt((S.G * pl.m) / r2);
        body(-r2, 0, 0, -v2, 3e4, '#9fd3e6');
        extent = 360;
      } else if (name === 'sun') {
        body(0, 0, 0, 0, 5e6, '#ffe8a8');
        extent = 380;
      }
      cam.z = Math.min(env.W, env.H) / (2 * extent);
      acc(); accTests();
    }

    /* ---------- prediction ---------- */
    function predict(x, y, vx, vy) {
      const pts = [x, y], h = 1 / 120, G = S.G, e2 = S.eps * S.eps;
      let ax = 0, ay = 0;
      const a = () => {
        ax = 0; ay = 0;
        for (const b of B) {
          const dx = b.x - x, dy = b.y - y, d2 = dx * dx + dy * dy;
          if (d2 < b.r * b.r) return false;
          const r2 = d2 + e2, inv = (G * b.m) / (r2 * Math.sqrt(r2));
          ax += dx * inv; ay += dy * inv;
        }
        return true;
      };
      a();
      for (let i = 0; i < 1200; i++) {
        vx += ax * h * 0.5; vy += ay * h * 0.5; x += vx * h; y += vy * h;
        if (!a()) { pts.push(x, y); break; }
        vx += ax * h * 0.5; vy += ay * h * 0.5;
        if (i % 4 === 0) pts.push(x, y);
      }
      return pts;
    }

    /* ---------- UI ---------- */
    ui.section('Scenarios');
    ui.buttons([
      { label: 'Solar system', onClick: () => preset('solar') },
      { label: 'Binary star', onClick: () => preset('binary') },
      { label: 'Figure-eight', onClick: () => preset('eight') },
      { label: 'Galaxy collision', onClick: () => preset('galaxies') },
      { label: 'Star cluster', onClick: () => preset('cluster') },
      { label: 'Trojan asteroids', onClick: () => preset('trojans') },
      { label: 'Planetary rings', onClick: () => preset('rings') },
      { label: 'Lone sun', onClick: () => preset('sun') },
    ]);
    ui.section('Launching');
    ui.slider('New body mass', { min: 10, max: 8e6, value: S.newMass, log: true, fmt: (v) => (v >= 1e6 ? (v / 1e6).toFixed(2) + ' M☉' : Math.round(v).toLocaleString()), onInput: (v) => (S.newMass = v) });
    ui.toggle('Show predicted path', S.pred, (v) => (S.pred = v));
    ui.section('Physics');
    ui.slider('Gravitational constant G', { min: 0.1, max: 4, value: S.G, log: true, fmt: (v) => v.toFixed(2) + '×', onInput: (v) => (S.G = v) });
    ui.slider('Softening ε', { min: 0.5, max: 25, value: S.eps, log: true, fmt: (v) => v.toFixed(1) + ' px', onInput: (v) => (S.eps = v) });
    const mergeT = ui.toggle('Merge on collision', S.merge, (v) => (S.merge = v));
    ui.section('View');
    const followSel = ui.select('Camera follows', [['com', 'Centre of mass'], ['heavy', 'Heaviest body'], ['none', 'Free camera']], S.follow, (v) => (S.follow = v));
    ui.toggle('Orbit trails', S.trails, (v) => (S.trails = v));
    ui.buttons([
      { label: 'Reverse time', onClick: () => { for (const b of B) { b.vx = -b.vx; b.vy = -b.vy; } for (let k = 0; k < tn; k++) { TVX[k] = -TVX[k]; TVY[k] = -TVY[k]; } env.toast('All velocities reversed'); } },
      { label: 'Clear trails', onClick: () => B.forEach((b) => { b.tn = 0; }) },
      { label: 'Remove all', onClick: () => { B = []; tn = 0; } },
    ]);

    preset('solar');

    const toWorld = (sx, sy) => [(sx - env.W / 2) / cam.z + cam.x, (sy - env.H / 2) / cam.z + cam.y];

    return {
      step(dt) {
        const n = Math.min(24, Math.max(1, Math.ceil(dt * 240)));
        for (let i = 0; i < n; i++) substep(dt / n);
      },
      draw(ctx) {
        const W = env.W, H = env.H;
        // camera follow
        if (S.follow !== 'none' && B.length) {
          let tx = 0, ty = 0;
          if (S.follow === 'com') { let M = 0; for (const b of B) { tx += b.x * b.m; ty += b.y * b.m; M += b.m; } tx /= M; ty /= M; }
          else { let hb = B[0]; for (const b of B) if (b.m > hb.m) hb = b; tx = hb.x; ty = hb.y; }
          cam.x += (tx - cam.x) * 0.12; cam.y += (ty - cam.y) * 0.12;
        }
        ctx.fillStyle = '#02040a';
        ctx.fillRect(0, 0, W, H);
        for (const s of stars) {
          const x = (((s[0] * W - cam.x * 0.03 * s[2]) % W) + W) % W, y = (((s[1] * H - cam.y * 0.03 * s[2]) % H) + H) % H;
          ctx.fillStyle = `rgba(200,215,255,${0.25 + s[3] * 0.5})`;
          ctx.fillRect(x, y, s[2], s[2]);
        }
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(cam.z, cam.z);
        ctx.translate(-cam.x, -cam.y);
        const lw = 1 / cam.z;
        // trails
        if (S.trails) {
          ctx.lineWidth = 1.3 * lw;
          for (const b of B) {
            if (b.tn < 2) continue;
            const start = b.tn < TL ? 0 : b.ti, chunks = 4, per = Math.ceil(b.tn / chunks);
            ctx.strokeStyle = b.col;
            for (let c = 0; c < chunks; c++) {
              ctx.globalAlpha = 0.1 + 0.18 * c;
              ctx.beginPath();
              const k0 = c * per, k1 = Math.min(b.tn - 1, (c + 1) * per);
              for (let k = k0; k <= k1; k++) {
                const idx = ((start + k) % TL) * 2;
                if (k === k0) ctx.moveTo(b.tr[idx], b.tr[idx + 1]); else ctx.lineTo(b.tr[idx], b.tr[idx + 1]);
              }
              if (c === chunks - 1) ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
          ctx.globalAlpha = 1;
        }
        // test particles
        const ps = Math.max(1.2, 1.6 / cam.z * 0.9);
        for (let c = 0; c < 3; c++) {
          ctx.fillStyle = TCOL[c];
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          for (let k = 0; k < tn; k++) if (TC[k] === c) ctx.rect(TX[k] - ps / 2, TY[k] - ps / 2, ps, ps);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        // bodies
        for (const b of B) {
          if (b.m >= 1e6) {
            const R = b.r * 4.2;
            ctx.globalCompositeOperation = 'lighter';
            ctx.drawImage(starSpr, b.x - R, b.y - R, R * 2, R * 2);
            ctx.globalCompositeOperation = 'source-over';
          }
          const rr = Math.max(b.r, 1.8 / cam.z);
          ctx.fillStyle = b.col;
          ctx.beginPath(); ctx.arc(b.x, b.y, rr, 0, TAU); ctx.fill();
          if (b.m < 1e6 && rr > 2.5 / cam.z) {
            const g = ctx.createRadialGradient(b.x - rr * 0.4, b.y - rr * 0.4, 0, b.x, b.y, rr);
            g.addColorStop(0, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
            ctx.fillStyle = g; ctx.fill();
          }
        }
        // launch arrow & prediction
        if (launch) {
          const [cx, cy] = toWorld(env.pointer.x, env.pointer.y);
          const r = radius(S.newMass);
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath(); ctx.arc(launch.x, launch.y, r, 0, TAU); ctx.fill();
          ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2 * lw;
          ctx.beginPath(); U.arrow(ctx, launch.x, launch.y, cx, cy, 10 * lw); ctx.stroke();
          if (S.pred) {
            if (!pred || pred.cx !== cx || pred.cy !== cy) pred = { cx, cy, pts: predict(launch.x, launch.y, (cx - launch.x) * 1.4, (cy - launch.y) * 1.4) };
            ctx.setLineDash([6 * lw, 6 * lw]);
            ctx.strokeStyle = 'rgba(251,191,36,0.7)'; ctx.lineWidth = 1.2 * lw;
            ctx.beginPath();
            for (let i = 0; i < pred.pts.length; i += 2) i ? ctx.lineTo(pred.pts[i], pred.pts[i + 1]) : ctx.moveTo(pred.pts[i], pred.pts[i + 1]);
            ctx.stroke(); ctx.setLineDash([]);
          }
        }
        ctx.restore();
        // scale bar
        const sb = U.niceStep(140 / cam.z, 1);
        ctx.strokeStyle = 'rgba(200,215,255,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(16, H - 40); ctx.lineTo(16 + sb * cam.z, H - 40); ctx.moveTo(16, H - 44); ctx.lineTo(16, H - 36); ctx.moveTo(16 + sb * cam.z, H - 44); ctx.lineTo(16 + sb * cam.z, H - 36); ctx.stroke();
        ctx.fillStyle = 'rgba(200,215,255,0.75)'; ctx.font = '11px Segoe UI, sans-serif'; ctx.textBaseline = 'bottom';
        ctx.fillText(sb + ' units', 16, H - 46);
      },
      pointerdown(p, e) {
        if (e.button === 2 || e.button === 1 || p.shift) { pan = { x: p.x, y: p.y, cx: cam.x, cy: cam.y }; return; }
        const [wx, wy] = toWorld(p.x, p.y);
        launch = { x: wx, y: wy };
        pred = null;
      },
      pointermove(p) {
        if (pan) {
          cam.x = pan.cx - (p.x - pan.x) / cam.z; cam.y = pan.cy - (p.y - pan.y) / cam.z;
          if (S.follow !== 'none') { S.follow = 'none'; followSel.set('none'); }
        }
      },
      pointerup(p) {
        if (launch) {
          const [cx, cy] = toWorld(p.x, p.y);
          body(launch.x, launch.y, (cx - launch.x) * 1.4, (cy - launch.y) * 1.4, S.newMass);
          acc();
          launch = null; pred = null;
        }
        pan = null;
      },
      wheel(p, dy) {
        const [bx, by] = toWorld(p.x, p.y);
        cam.z = U.clamp(cam.z * Math.exp(-dy * 0.0012), 0.05, 20);
        const [ax, ay] = toWorld(p.x, p.y);
        cam.x += bx - ax; cam.y += by - ay;
      },
      reset() { preset('solar'); },
      readouts() {
        let KE = 0, PE = 0, px = 0, py = 0;
        for (const b of B) { KE += 0.5 * b.m * (b.vx * b.vx + b.vy * b.vy); px += b.m * b.vx; py += b.m * b.vy; }
        const e2 = S.eps * S.eps;
        for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
          const dx = B[j].x - B[i].x, dy = B[j].y - B[i].y;
          PE -= (S.G * B[i].m * B[j].m) / Math.sqrt(dx * dx + dy * dy + e2);
        }
        return [
          ['Massive bodies', B.length], ['Test particles', tn], ['Total energy', U.fmt(KE + PE, 3)],
          ['Kinetic / |Potential|', PE ? (KE / -PE).toFixed(3) : '—'], ['|Momentum|', U.fmt(Math.hypot(px, py), 2)],
          ['Sim time', simT.toFixed(1) + ' s'], ['Zoom', cam.z.toFixed(2) + '×'], ['Trail length', TL],
        ];
      },
    };
  },
});

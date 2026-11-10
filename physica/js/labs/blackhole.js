'use strict';
/* LAB 12 — Black Hole: exact Schwarzschild geodesics for light and matter (photon sphere, ISCO, precession, lensing) */
PhysLab.define({
  id: 'blackhole',
  cat: 'Modern Physics',
  title: 'Black Hole',
  subtitle: 'General relativity near a black hole: bend light, find the photon sphere, and watch orbits precess and plunge.',
  color: '#f59e0b',
  tags: ['General relativity', 'Geodesics', 'Lensing'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="32" cy="32" r="10" fill="currentColor"/><ellipse cx="32" cy="32" rx="28" ry="9" /><path d="M2 14c18 0 22 8 30 8M2 50c18 0 22-8 30-8" stroke-dasharray="3 3"/><circle cx="32" cy="32" r="16" stroke-dasharray="2 4"/></svg>`,
  hint: 'Drag to fire light or matter at the black hole · use the tools and presets in the panel',
  howto: [
    '<b>Light beam</b>: drag to aim a bundle of parallel light rays. Rays that pass too close are captured.',
    '<b>Light source</b>: click to emit light in every direction and reveal the hole\'s "shadow".',
    '<b>Matter</b>: drag to launch a particle (drag length = speed). <b>Circular orbit</b>: click any radius.',
    'Inside the dotted <b>ISCO</b> ring no stable orbit exists; inside the dashed <b>photon sphere</b> even light must be aimed outward to escape.',
  ],
  theory: `
  <h3>Schwarzschild geometry</h3>
  <div class="eq">r_s = 2GM / c²   (event horizon)</div>
  <p>Paths are true geodesics of the Schwarzschild metric, integrated with RK4 from the exact orbit equation (u = 1/r):</p>
  <div class="eq">d²u/dφ² + u = GM/h²·[matter only] + 3GM u² / c²</div>
  <p>The last term is Einstein's correction to Newton. It is tiny far away, but dominates close in.</p>
  <h3>Light</h3>
  <div class="eq">photon sphere r = 1.5 r_s     critical impact parameter b_c = (3√3/2) r_s</div>
  <div class="eq">deflection α ≈ 4GM / (c² b) = 2 r_s / b   (weak field)</div>
  <p>Light with b &lt; b_c spirals in. Just outside, it can loop around the hole several times before escaping — the origin of the bright <b>photon ring</b> in the Event Horizon Telescope images.</p>
  <h3>Matter</h3>
  <div class="eq">ISCO r = 3 r_s     v_circ² = (GM/r) / (1 − 1.5 r_s/r)</div>
  <p>Elliptical orbits do not close: the perihelion advances each lap (Mercury's 43″ per century, enormous here). Below the innermost stable circular orbit, the slightest nudge sends matter spiralling in.</p>
  <h3>Time &amp; escape</h3>
  <div class="eq">dτ/dt = √(1 − r_s/r)     v_esc = c √(r_s/r)</div>
  <p>Move the cursor to read gravitational time dilation: clocks near the horizon tick slower as seen from far away, and stop at r = r_s.</p>
  <p><i>Note:</i> the picture uses Schwarzschild coordinates; motion is shown in the particle's own affine/proper time.</p>`,

  create(env) {
    const { ui } = env;
    const TAU = U.TAU, C = 240;
    const S = { M: 26, tool: 'beam', disc: true, rings: true, beamN: 25, pred: true };
    let photons = [], bodies = [], drag = null, simT = 0, captured = 0, escaped = 0, lastDef = null;
    const stars = Array.from({ length: 220 }, () => [Math.random(), Math.random(), Math.random() * 1.4 + 0.3, Math.random()]);
    const ND = Math.round(140 + 260 * env.q), disc = [];
    const cxy = () => [env.W / 2, env.H / 2];
    const rs = () => 2 * S.M;

    function seedDisc() {
      disc.length = 0;
      for (let i = 0; i < ND; i++) disc.push({ r: 6.1 + Math.pow(Math.random(), 1.6) * 5.5, a: Math.random() * TAU, z: U.rand(-1, 1) });
    }
    seedDisc();

    function accel(x, y, h2, mu, o) {
      const r2 = x * x + y * y, r = Math.sqrt(r2), M = S.M;
      const f = -(mu * M) / (r2 * r) - (3 * M * h2) / (r2 * r2 * r);
      o[0] = f * x; o[1] = f * y;
    }
    const A = [0, 0], B = [0, 0], Cc = [0, 0], D = [0, 0];
    function rk4(p, h, mu) {
      const h2 = p.h * p.h;
      accel(p.x, p.y, h2, mu, A);
      accel(p.x + p.vx * h / 2, p.y + p.vy * h / 2, h2, mu, B);
      accel(p.x + p.vx * h / 2 + A[0] * h * h / 4, p.y + p.vy * h / 2 + A[1] * h * h / 4, h2, mu, Cc);
      accel(p.x + p.vx * h + B[0] * h * h / 2, p.y + p.vy * h + B[1] * h * h / 2, h2, mu, D);
      p.x += h * p.vx + (h * h / 6) * (A[0] + B[0] + Cc[0]);
      p.y += h * p.vy + (h * h / 6) * (A[1] + B[1] + Cc[1]);
      p.vx += (h / 6) * (A[0] + 2 * B[0] + 2 * Cc[0] + D[0]);
      p.vy += (h / 6) * (A[1] + 2 * B[1] + 2 * Cc[1] + D[1]);
    }
    function photon(x, y, dx, dy, hue) {
      const l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      if (photons.length > 500) photons.splice(0, 60);
      photons.push({ x, y, vx: dx, vy: dy, h: x * dy - y * dx, d0: Math.atan2(dy, dx), path: [x, y], alive: true, born: simT, hue: hue === undefined ? 48 : hue, acc: 0 });
    }
    function body(x, y, vx, vy) {
      if (bodies.length > 40) bodies.shift();
      bodies.push({ x, y, vx, vy, h: x * vy - y * vx, tr: [], alive: true, hue: Math.random() * 360, acc: 0 });
    }
    const vcirc = (r) => Math.sqrt(S.M / r / (1 - (3 * S.M) / r));
    function beam(x, y, dx, dy, n, width) {
      const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      for (let k = 0; k < n; k++) { const o = (k / (n - 1) - 0.5) * width; photon(x - dy * o, y + dx * o, dx, dy, 30 + (k / n) * 40); }
    }

    function preset(name) {
      photons = []; bodies = []; captured = escaped = 0; lastDef = null;
      const W = env.W, H = env.H, R = rs();
      if (name === 'bend') beam(-W / 2 + 4, 0, 1, 0, Math.round(S.beamN * 1.4), H * 0.92);
      else if (name === 'sphere') { for (let k = 0; k < 11; k++) photon(0, -1.5 * R * (1 + (k - 5) * 0.0035), 1, 0, k * 30); }
      else if (name === 'precess') { const r = 13 * S.M; body(r, 0, 0, -vcirc(r) * 0.92); }
      else if (name === 'isco') { for (const f of [5.4, 6, 8, 11]) { const r = f * S.M; body(r, 0, 0, -vcirc(r) * (f < 6 ? 0.999 : 1)); } }
      else if (name === 'source') { for (let k = 0; k < 90; k++) { const a = (k / 90) * TAU; photon(-5 * R, 0, Math.cos(a), Math.sin(a), k * 4); } }
      else if (name === 'shadow') beam(-W / 2 + 4, 0, 1, 0, 61, 12 * R);
    }

    /* ---------- UI ---------- */
    ui.section('Experiments');
    ui.buttons([
      { label: 'Light bending', onClick: () => preset('bend') }, { label: 'Photon sphere', onClick: () => preset('sphere') },
      { label: 'Shadow (dense beam)', onClick: () => preset('shadow') }, { label: 'Point light source', onClick: () => preset('source') },
      { label: 'Precessing orbit', onClick: () => preset('precess') }, { label: 'ISCO test', onClick: () => preset('isco') },
    ]);
    ui.section('Tool');
    ui.tools([
      { id: 'beam', label: '☀ Light beam' }, { id: 'photon', label: '➶ Single photon' },
      { id: 'source', label: '✺ Light source' }, { id: 'mass', label: '● Matter (drag)' },
      { id: 'orbit', label: '◯ Circular orbit' },
    ], S.tool, (v) => (S.tool = v));
    ui.slider('Rays per beam', { min: 3, max: 61, step: 2, value: S.beamN, fmt: (v) => v + '', onInput: (v) => (S.beamN = v) });
    ui.section('Black hole');
    ui.slider('Mass M (sets r_s = 2M)', { min: 10, max: 60, step: 1, value: S.M, fmt: (v) => `r_s = ${2 * v} px`, onInput: (v) => (S.M = v) });
    ui.toggle('Accretion disc', S.disc, (v) => (S.disc = v));
    ui.toggle('Show photon sphere & ISCO', S.rings, (v) => (S.rings = v));
    ui.toggle('Predict path while aiming', S.pred, (v) => (S.pred = v));
    ui.buttons([{ label: 'Clear everything', onClick: () => { photons = []; bodies = []; captured = escaped = 0; } }]);

    preset('bend');

    function predict(x, y, vx, vy, mu) {
      const p = { x, y, vx, vy, h: x * vy - y * vx }, pts = [x, y], R = rs();
      for (let i = 0; i < 2600; i++) {
        const r = Math.hypot(p.x, p.y);
        rk4(p, U.clamp(r / R, 0.25, 3) * (mu ? 1.2 / Math.max(0.2, Math.hypot(p.vx, p.vy)) : 1.2), mu);
        if (i % 3 === 0) pts.push(p.x, p.y);
        if (r < R || r > 3000) break;
      }
      return pts;
    }
    const toSim = (p) => { const [cx, cy] = cxy(); return [p.x - cx, p.y - cy]; };

    /* ===== v3 extras ===== */
    const LV = { on: false, c: document.createElement('canvas'), key: '', gx: 150, gy: -60, drag: false };
    function renderLens() {
      const sc = env.q >= 1 ? 3 : 4, w = Math.ceil(env.W / sc), h = Math.ceil(env.H / sc), R = rs();
      LV.c.width = w; LV.c.height = h;
      const g = LV.c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
      const bc = 2.598 * R, tE2 = (3.4 * R) ** 2, cx = w / 2, cy = h / 2, gx = LV.gx, gy = LV.gy;
      const fr = (v) => v - Math.floor(v);
      let o = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++, o += 4) {
        const dx = (x - cx) * sc, dy = (y - cy) * sc, b2 = dx * dx + dy * dy, b = Math.sqrt(b2);
        d[o + 3] = 255;
        if (b < bc) { d[o] = d[o + 1] = d[o + 2] = 0; continue; }
        const f = 1 - tE2 / b2, sx = dx * f, sy = dy * f; // lens equation: source position seen at this pixel
        const qx = sx - gx, qy = sy - gy, r2 = qx * qx + qy * qy, rr = Math.sqrt(r2);
        const core = Math.exp(-r2 / 1500), arm = Math.exp(-rr / 85) * Math.pow(0.5 + 0.5 * Math.cos(2 * Math.atan2(qy, qx) - rr * 0.075), 3);
        let r = 255 * core + 110 * arm, gg = 215 * core + 130 * arm, bl = 160 * core + 255 * arm;
        const cs2 = 24, ix = Math.floor(sx / cs2), iy = Math.floor(sy / cs2), hs = fr(Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453);
        if (hs > 0.8) { const px = (ix + 0.2 + 0.6 * fr(hs * 17.3)) * cs2, py = (iy + 0.2 + 0.6 * fr(hs * 37.7)) * cs2, s = 300 * Math.exp(-((sx - px) ** 2 + (sy - py) ** 2) / (2 + (hs - 0.8) * 40)); r += s; gg += s; bl += s * 1.1; }
        const ring = 150 * Math.exp(-(((b - bc) / (0.07 * R)) ** 2));
        r += ring; gg += ring * 0.75; bl += ring * 0.45;
        d[o] = r > 255 ? 255 : r; d[o + 1] = gg > 255 ? 255 : gg; d[o + 2] = bl > 255 ? 255 : bl;
      }
      g.putImageData(img, 0, 0);
    }
    ui.section('Lensing camera');
    ui.toggle('📷 What a camera would see (gravitational lensing)', LV.on, (v) => (LV.on = v));
    ui.note('Shows a background galaxy and stars as distorted by the black hole. <b>Drag the galaxy</b>: as it slides behind the hole it stretches into arcs and finally a complete <b>Einstein ring</b>.');
    const ext = {
      draw(ctx) {
        if (!LV.on) return;
        const W = env.W, H = env.H, key = [rs(), W, H, LV.gx | 0, LV.gy | 0].join(',');
        if (key !== LV.key) { LV.key = key; renderLens(); }
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(LV.c, 0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '12px Segoe UI, sans-serif'; ctx.textBaseline = 'top';
        ctx.fillText('Lensing camera — drag to move the background galaxy behind the black hole', 14, 12);
        const d = Math.hypot(LV.gx, LV.gy);
        if (d < rs() * 0.6) { ctx.fillStyle = '#fde047'; ctx.font = '600 14px Segoe UI, sans-serif'; ctx.fillText('✦ Einstein ring!', 14, 32); }
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(W / 2 + LV.gx, H / 2 + LV.gy, 12, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '10px Segoe UI, sans-serif'; ctx.fillText('true position', W / 2 + LV.gx + 16, H / 2 + LV.gy - 5);
      },
      pointerdown(p) { if (!LV.on) return false; LV.drag = true; LV.gx = p.x - env.W / 2; LV.gy = p.y - env.H / 2; return true; },
      pointermove(p) { if (LV.on && LV.drag && env.pointer.down) { LV.gx = p.x - env.W / 2; LV.gy = p.y - env.H / 2; } },
      pointerup() { LV.drag = false; },
    };

    return {
      ext,
      probe() { return { captured, escaped, longOrbit: bodies.some((b) => b.alive && b.tr.length >= 1400), ring: LV.on && Math.hypot(LV.gx, LV.gy) < rs() * 0.6 }; },
      step(dt) {
        simT += dt;
        const R = rs(), far = Math.max(env.W, env.H) * 0.75, dist = C * dt;
        for (const p of photons) {
          if (!p.alive) continue;
          let left = dist;
          while (left > 0) {
            const r = Math.hypot(p.x, p.y), h = Math.min(left, U.clamp(r / R - 0.8, 0.15, 1.5));
            rk4(p, h, 0); left -= h; p.acc += h;
            if (p.acc > 3) { p.acc = 0; if (p.path.length < 3000) p.path.push(p.x, p.y); }
            const r2 = Math.hypot(p.x, p.y);
            if (r2 < R * 1.005) { p.alive = false; p.cap = true; p.dead = simT; captured++; break; }
            if (r2 > far && p.x * p.vx + p.y * p.vy > 0) {
              p.alive = false; p.dead = simT; escaped++;
              p.path.push(p.x + p.vx * 2000, p.y + p.vy * 2000);
              let d = Math.atan2(p.vy, p.vx) - p.d0; d = Math.atan2(Math.sin(d), Math.cos(d));
              lastDef = { meas: Math.abs(d), b: Math.abs(p.h) };
              break;
            }
          }
        }
        for (const b of bodies) {
          if (!b.alive) continue;
          let left = dist;
          while (left > 0) {
            const r = Math.hypot(b.x, b.y), h = Math.min(left, U.clamp(r / R - 0.8, 0.1, 1.5));
            rk4(b, h, 1); left -= h; b.acc += h;
            if (b.acc > 4) { b.acc = 0; b.tr.push(b.x, b.y); if (b.tr.length > 2400) b.tr.splice(0, 2); }
            if (Math.hypot(b.x, b.y) < R * 1.005) { b.alive = false; b.dead = simT; captured++; break; }
          }
          if (Math.hypot(b.x, b.y) > 4000) { b.alive = false; b.dead = simT - 20; }
        }
        photons = photons.filter((p) => p.alive || simT - p.dead < 14);
        bodies = bodies.filter((b) => b.alive || simT - b.dead < 6);
        for (const d of disc) d.a -= (vcirc(d.r * S.M) / (d.r * S.M)) * C * dt;
      },
      draw(ctx) {
        const W = env.W, H = env.H, [cx, cy] = cxy(), R = rs();
        ctx.fillStyle = '#020207'; ctx.fillRect(0, 0, W, H);
        for (const s of stars) { ctx.fillStyle = `rgba(210,220,255,${0.2 + s[3] * 0.5})`; ctx.fillRect(s[0] * W, s[1] * H, s[2], s[2]); }
        ctx.save(); ctx.translate(cx, cy);
        // glow
        const gl = ctx.createRadialGradient(0, 0, R, 0, 0, R * 4.5);
        gl.addColorStop(0, 'rgba(255,150,50,0.35)'); gl.addColorStop(0.35, 'rgba(255,110,30,0.10)'); gl.addColorStop(1, 'rgba(255,90,20,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, R * 4.5, 0, TAU); ctx.fill();
        // accretion disc (decorative circular orbits, Doppler-tinted)
        if (S.disc) {
          for (const d of disc) {
            const r = d.r * S.M, x = Math.cos(d.a) * r, y = Math.sin(d.a) * r + d.z * 1.5;
            const approach = -Math.sin(d.a); // moving toward +x side viewer cue
            const heat = U.clamp(1.6 - d.r / 10, 0.15, 1);
            ctx.fillStyle = `hsla(${28 + approach * 16 + heat * 14},100%,${52 + heat * 22 + approach * 8}%,${0.55 + heat * 0.35})`;
            ctx.fillRect(x - 1, y - 1, 2.2, 2.2);
          }
        }
        if (S.rings) {
          ctx.lineWidth = 1; ctx.font = '11px Segoe UI, sans-serif'; ctx.textBaseline = 'bottom';
          ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(253,224,71,0.6)';
          ctx.beginPath(); ctx.arc(0, 0, 1.5 * R, 0, TAU); ctx.stroke();
          ctx.setLineDash([2, 5]); ctx.strokeStyle = 'rgba(125,211,252,0.6)';
          ctx.beginPath(); ctx.arc(0, 0, 3 * R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(253,224,71,0.8)'; ctx.fillText('photon sphere 1.5 r_s', 1.5 * R * 0.72, -1.5 * R * 0.72);
          ctx.fillStyle = 'rgba(125,211,252,0.8)'; ctx.fillText('ISCO 3 r_s', 3 * R * 0.72, -3 * R * 0.72);
        }
        // light paths
        ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1.3;
        for (const p of photons) {
          const fade = p.alive ? 1 : Math.max(0, 1 - (simT - p.dead) / 14);
          ctx.strokeStyle = `hsla(${p.hue},100%,${p.cap ? 45 : 62}%,${0.75 * fade})`;
          ctx.beginPath(); ctx.moveTo(p.path[0], p.path[1]);
          for (let k = 2; k < p.path.length; k += 2) ctx.lineTo(p.path[k], p.path[k + 1]);
          if (p.alive) ctx.lineTo(p.x, p.y);
          ctx.stroke();
          if (p.alive) { ctx.fillStyle = '#fff'; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
        }
        ctx.globalCompositeOperation = 'source-over';
        // matter
        for (const b of bodies) {
          const fade = b.alive ? 1 : Math.max(0, 1 - (simT - b.dead) / 6);
          ctx.strokeStyle = `hsla(${b.hue},90%,65%,${0.7 * fade})`; ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (let k = 0; k < b.tr.length; k += 2) k ? ctx.lineTo(b.tr[k], b.tr[k + 1]) : ctx.moveTo(b.tr[0], b.tr[1]);
          if (b.alive) ctx.lineTo(b.x, b.y);
          ctx.stroke();
          if (b.alive) { ctx.fillStyle = `hsl(${b.hue},95%,75%)`; ctx.beginPath(); ctx.arc(b.x, b.y, 4.5, 0, TAU); ctx.fill(); }
        }
        // the hole
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,170,80,0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
        // aiming
        if (drag) {
          const [mx, my] = toSim(env.pointer), dx = mx - drag.x, dy = my - drag.y, len = Math.hypot(dx, dy);
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
          ctx.beginPath(); U.arrow(ctx, drag.x, drag.y, mx, my, 9); ctx.stroke();
          if (S.pred && len > 6) {
            const mu = S.tool === 'mass' ? 1 : 0, v = mu ? Math.min(0.95, len / 260) : 1;
            const pts = predict(drag.x, drag.y, (dx / len) * v, (dy / len) * v, mu);
            ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
            ctx.beginPath(); for (let k = 0; k < pts.length; k += 2) k ? ctx.lineTo(pts[k], pts[k + 1]) : ctx.moveTo(pts[0], pts[1]);
            ctx.stroke(); ctx.setLineDash([]);
          }
          if (S.tool === 'mass') { ctx.fillStyle = '#fff'; ctx.font = '12px Segoe UI, sans-serif'; ctx.fillText(`v = ${Math.min(0.95, len / 260).toFixed(2)} c`, mx + 10, my - 6); }
        }
        ctx.restore();
      },
      pointerdown(p) {
        const [x, y] = toSim(p);
        if (Math.hypot(x, y) < rs() * 1.02) return;
        if (S.tool === 'source') { for (let k = 0; k < 72; k++) { const a = (k / 72) * TAU; photon(x, y, Math.cos(a), Math.sin(a), k * 5); } }
        else if (S.tool === 'orbit') {
          const r = Math.hypot(x, y);
          if (r <= 3 * S.M * 1.02) { env.toast('No circular orbit exists inside the photon sphere (r < 1.5 r_s)'); return; }
          const v = vcirc(r);
          body(x, y, (-y / r) * v, (x / r) * v);
          if (r < 6 * S.M) env.toast('Inside the ISCO — this orbit is unstable, watch it fall or fly off');
        } else drag = { x, y };
      },
      pointerup(p) {
        if (!drag) return;
        const [mx, my] = toSim(p);
        let dx = mx - drag.x, dy = my - drag.y;
        const len = Math.hypot(dx, dy);
        if (len < 6) { dx = -drag.x; dy = -drag.y; if (S.tool !== 'mass') { const t = dx; dx = -dy * 0.5 + t; dy = t * 0.5 + dy; } }
        if (S.tool === 'beam') beam(drag.x, drag.y, dx, dy, S.beamN, Math.min(env.H * 0.8, 14 * rs()));
        else if (S.tool === 'photon') photon(drag.x, drag.y, dx, dy, Math.random() * 360);
        else if (S.tool === 'mass') { const v = Math.min(0.95, Math.max(len, 6) / 260), l = Math.hypot(dx, dy) || 1; body(drag.x, drag.y, (dx / l) * v, (dy / l) * v); }
        drag = null;
      },
      reset() { preset('bend'); },
      readouts() {
        const R = rs(), [mx, my] = toSim(env.pointer), r = Math.hypot(mx, my);
        const out = [
          ['Horizon r_s', R + ' px'], ['Photon sphere', (1.5 * R).toFixed(0) + ' px'], ['ISCO', 3 * R + ' px'],
          ['Critical b_c', (2.598 * R).toFixed(0) + ' px'], ['Rays in flight', photons.filter((p) => p.alive).length],
          ['Captured / escaped', captured + ' / ' + escaped],
        ];
        if (lastDef) out.push(['Last deflection', (lastDef.meas / U.DEG).toFixed(1) + '°'], ['Weak-field 2r_s/b', ((2 * R) / lastDef.b / U.DEG).toFixed(1) + '°']);
        if (r > R) out.push(['Cursor r / r_s', (r / R).toFixed(2)], ['Clock rate dτ/dt', Math.sqrt(1 - R / r).toFixed(3)], ['Escape velocity', Math.sqrt(R / r).toFixed(3) + ' c']);
        else out.push(['Cursor', 'inside the horizon']);
        return out;
      },
    };
  },
});

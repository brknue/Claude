'use strict';
/* LAB 06 — Lorentz Force: charged particles in E & B fields with the Boris pusher (cyclotron, drifts, selectors, spectrometers) */
PhysLab.define({
  id: 'lorentz',
  title: 'Magnetic Fields & Lorentz Force',
  subtitle: 'Charged particles in electric & magnetic fields: gyration, E×B drift, velocity selector, mass spectrometer, cyclotron.',
  color: '#a78bfa',
  tags: ['Electromagnetism', 'Plasma', 'Accelerators'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><path d="M32 32m-3 0a3 3 0 1 0 6 0a7 7 0 1 0 -14 0a11 11 0 1 0 22 0a15 15 0 1 0 -30 0a19 19 0 1 0 38 0a23 23 0 1 0 -46 0"/><circle cx="8" cy="8" r="2" fill="currentColor"/><circle cx="56" cy="8" r="2" fill="currentColor"/><circle cx="8" cy="56" r="2" fill="currentColor"/><circle cx="56" cy="56" r="2" fill="currentColor"/></svg>`,
  hint: 'Drag to fire a particle (arrow = velocity) · pick the particle type and scenario in the panel',
  howto: [
    '<b>Drag</b> on the canvas to launch the selected particle; a simple click launches it at rest.',
    '<b>⊙</b> dots mean B points out of the screen, <b>⊗</b> crosses into it. Amber arrows show E.',
    'Particles at rest in crossed E and B fields trace <b>cycloids</b> — they drift sideways at E/B.',
    'In the <b>cyclotron</b>, detune the RF frequency and watch the acceleration fail.',
  ],
  theory: `
  <h3>The Lorentz force</h3>
  <div class="eq">F = q (E + v × B)</div>
  <p>The magnetic part is always perpendicular to the velocity, so it bends paths but does no work.</p>
  <h3>Gyration</h3>
  <div class="eq">r_L = m v⊥ / |q|B    ω_c = |q|B / m    T = 2πm / |q|B</div>
  <p>The period does not depend on speed — the key to the <b>cyclotron</b>: an RF field at ω_c kicks the particle each half-turn and it spirals outward.</p>
  <h3>Drifts</h3>
  <div class="eq">v_E = E × B / B²     (independent of q and m!)</div>
  <p>With crossed fields every particle — electron or ion, fast or slow — drifts at the same velocity E/B. A field gradient (∇B) gives a drift that depends on charge sign, separating electrons and ions.</p>
  <h3>Velocity selector &amp; mass spectrometer</h3>
  <div class="eq">qE = qvB  ⇒  v = E / B         r = m v / qB</div>
  <p>Only particles with v = E/B fly straight through the crossed-field region and the slit. In the spectrometer, ions of equal speed curve with radii proportional to their mass and land at different positions on the detector.</p>
  <h3>Boris integrator</h3>
  <p>Particle motion is advanced with the Boris scheme (half E-kick, exact B rotation, half E-kick), used in real plasma codes because it conserves energy in a pure magnetic field — circles stay circles.</p>`,

  create(env) {
    const { ui } = env;
    const TAU = U.TAU;
    const TYPES = {
      e: { name: 'Electron e⁻', q: -1, m: 1, col: [80, 200, 255] },
      pos: { name: 'Positron e⁺', q: 1, m: 1, col: [255, 120, 200] },
      p: { name: 'Proton p⁺', q: 1, m: 6, col: [255, 160, 70] },
      a: { name: 'Alpha α²⁺', q: 2, m: 24, col: [140, 255, 140] },
    };
    const S = { preset: 'uniform', type: 'e', B: 2, Ex: 0, Ey: 0, grad: 0.8, v0: 140, rf: 1, E0: 220, source: true, field: true, trails: true };
    let parts = [], hits = [], t = 0, emitT = 0, launch = null, specIdx = 0;
    let TL = 900;
    const sprites = {};
    for (const k in TYPES) sprites[k] = U.glow(TYPES[k].col, 10);

    /* ---------- fields per scenario ---------- */
    function field(x, y, o) { field0(x, y, o); o.Bz += paintB(x, y); }
    function field0(x, y, o) {
      const W = env.W, H = env.H;
      o.Ex = 0; o.Ey = 0; o.Bz = 0;
      switch (S.preset) {
        case 'uniform': o.Bz = S.B; o.Ex = S.Ex; o.Ey = S.Ey; break;
        case 'exb': o.Bz = S.B; o.Ey = S.Ey; o.Ex = S.Ex; break;
        case 'gradb': o.Bz = S.B * (1 + S.grad * ((y - H / 2) / (H / 2))); break;
        case 'selector':
          if (x > W * 0.3 && x < W * 0.68 && y > H * 0.2 && y < H * 0.8) { o.Bz = S.B; o.Ey = S.Ey; }
          break;
        case 'spectro': if (x > W * 0.42) o.Bz = S.B; break;
        case 'cyclo': {
          const cx = W / 2, cy = H / 2, Rd = Math.min(W, H) * 0.44;
          if ((x - cx) ** 2 + (y - cy) ** 2 < Rd * Rd) {
            o.Bz = S.B;
            if (Math.abs(x - cx) < 14) {
              const tp = TYPES[S.type], w = (Math.abs(tp.q) * S.B) / tp.m * S.rf;
              o.Ex = S.E0 * Math.sign(tp.q) * Math.cos(w * t);
            }
          }
          break;
        }
      }
    }
    const F = { Ex: 0, Ey: 0, Bz: 0 };

    function spawn(x, y, vx, vy, type) {
      if (parts.length > 90) parts.shift();
      const tp = TYPES[type];
      const p = { x, y, vx, vy, q: tp.q, m: tp.m, type, tr: new Float32Array(TL * 2), ti: 0, tn: 0, k: 0, born: t };
      parts.push(p);
      return p;
    }

    function push(p, h) {
      field(p.x, p.y, F);
      const qm = (p.q / p.m) * h * 0.5;
      const vmx = p.vx + qm * F.Ex, vmy = p.vy + qm * F.Ey;
      const tt = qm * F.Bz, s = (2 * tt) / (1 + tt * tt);
      const vpx = vmx + vmy * tt, vpy = vmy - vmx * tt;
      const vx2 = vmx + vpy * s, vy2 = vmy - vpx * s;
      p.vx = vx2 + qm * F.Ex; p.vy = vy2 + qm * F.Ey;
      p.x += p.vx * h; p.y += p.vy * h;
    }

    function preset(name) {
      S.preset = name; parts = []; hits = []; t = 0; emitT = 0;
      TL = name === 'cyclo' ? 2400 : 900;
      const W = env.W, H = env.H;
      if (name === 'uniform') { S.Ex = 0; S.Ey = 0; S.B = 2; }
      if (name === 'exb') { S.B = 2; S.Ey = 120; S.Ex = 0; }
      if (name === 'gradb') { S.B = 2.5; }
      if (name === 'selector') { S.B = 2; S.Ey = 300; S.type = 'p'; }
      if (name === 'spectro') { S.B = 3; S.v0 = 110; }
      if (name === 'cyclo') { S.B = 3; S.type = 'e'; S.rf = 1; S.E0 = 380; }
      syncUI();
      if (name === 'uniform') {
        for (let i = 0; i < 6; i++) { const a = Math.random() * TAU, v = U.rand(60, 220); spawn(U.rand(W * 0.2, W * 0.8), U.rand(H * 0.2, H * 0.8), Math.cos(a) * v, Math.sin(a) * v, i % 2 ? 'e' : 'pos'); }
      } else if (name === 'exb') {
        for (let i = 0; i < 4; i++) spawn(W * 0.15, H * (0.25 + i * 0.17), 0, 0, i % 2 ? 'e' : 'pos');
      } else if (name === 'gradb') {
        for (let i = 0; i < 6; i++) spawn(W * (0.2 + 0.12 * i), H / 2, 0, 150, i % 2 ? 'e' : 'pos');
      } else if (name === 'cyclo') {
        spawn(W / 2, H / 2, 0, 0, S.type);
      }
    }

    function emit() {
      const W = env.W, H = env.H;
      if (S.preset === 'selector') {
        const v = U.rand(60, 320);
        spawn(W * 0.05, H / 2, v, 0, S.type);
      } else if (S.preset === 'spectro') {
        const masses = [4, 5, 6, 7, 8], m = masses[specIdx++ % masses.length];
        const p = spawn(W * 0.06, H * 0.84, S.v0, 0, 'p');
        p.m = m; p.q = 1; p.iso = m;
      }
    }

    /* ---------- UI ---------- */
    ui.section('Scenario');
    const presetSel = ui.select('Experiment', [['uniform', 'Uniform B (gyration)'], ['exb', 'Crossed E × B drift'], ['gradb', '∇B drift'], ['selector', 'Velocity selector'], ['spectro', 'Mass spectrometer'], ['cyclo', 'Cyclotron accelerator']], S.preset, (v) => preset(v));
    ui.section('Particle to launch');
    const typeTools = ui.tools(Object.keys(TYPES).map((k) => ({ id: k, label: TYPES[k].name })), S.type, (v) => (S.type = v));
    ui.section('Fields');
    const bSl = ui.slider('Magnetic field B_z', { min: -5, max: 5, step: 0.05, value: S.B, fmt: (v) => (v > 0 ? '⊗ ' : v < 0 ? '⊙ ' : '') + v.toFixed(2), onInput: (v) => (S.B = v) });
    const exSl = ui.slider('Electric field E_x', { min: -400, max: 400, step: 5, value: S.Ex, fmt: (v) => v + '', onInput: (v) => (S.Ex = v) });
    const eySl = ui.slider('Electric field E_y', { min: -400, max: 400, step: 5, value: S.Ey, fmt: (v) => v + '', onInput: (v) => (S.Ey = v) });
    ui.slider('∇B strength', { min: -1, max: 1, step: 0.05, value: S.grad, fmt: (v) => v.toFixed(2), onInput: (v) => (S.grad = v) });
    const v0Sl = ui.slider('Ion source speed (spectrometer)', { min: 40, max: 260, step: 5, value: S.v0, fmt: (v) => v + ' px/s', onInput: (v) => (S.v0 = v) });
    const rfSl = ui.slider('Cyclotron RF / ω_c', { min: 0.8, max: 1.2, step: 0.005, value: S.rf, fmt: (v) => v.toFixed(3), onInput: (v) => (S.rf = v) });
    const e0Sl = ui.slider('Cyclotron gap voltage', { min: 50, max: 800, step: 10, value: S.E0, fmt: (v) => v + '', onInput: (v) => (S.E0 = v) });
    ui.section('Display');
    ui.toggle('Auto-emit from source', S.source, (v) => (S.source = v));
    ui.toggle('Show field markers', S.field, (v) => (S.field = v));
    ui.toggle('Trails', S.trails, (v) => (S.trails = v));
    ui.buttons([
      { label: 'Spray 12', onClick: () => { for (let i = 0; i < 12; i++) { const a = Math.random() * TAU, v = U.rand(40, 240); spawn(U.rand(env.W * 0.15, env.W * 0.85), U.rand(env.H * 0.15, env.H * 0.85), Math.cos(a) * v, Math.sin(a) * v, S.type); } } },
      { label: 'Clear', onClick: () => { parts = []; hits = []; } },
    ]);
    function syncUI() { bSl.set(S.B); exSl.set(S.Ex); eySl.set(S.Ey); v0Sl.set(S.v0); rfSl.set(S.rf); e0Sl.set(S.E0); typeTools.set(S.type); presetSel.set(S.preset); }

    preset('uniform');

    /* ===== v3 extras ===== */
    const PG = { cell: 24, cols: 0, rows: 0, g: null, tool: 'launch', n: 0 };
    function pgSize() {
      const c = Math.ceil(env.W / PG.cell), r = Math.ceil(env.H / PG.cell);
      if (!PG.g || c !== PG.cols || r !== PG.rows) { PG.cols = c; PG.rows = r; PG.g = new Float32Array(c * r); PG.n = 0; }
    }
    function paintB(x, y) {
      if (!PG.g || !PG.n) return 0;
      const cx = (x / PG.cell) | 0, cy = (y / PG.cell) | 0;
      return cx >= 0 && cy >= 0 && cx < PG.cols && cy < PG.rows ? PG.g[cy * PG.cols + cx] : 0;
    }
    function paintAt(p) {
      pgSize();
      const v = PG.tool === 'in' ? 3 : PG.tool === 'out' ? -3 : 0, cx = (p.x / PG.cell) | 0, cy = (p.y / PG.cell) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < PG.cols && y < PG.rows) PG.g[y * PG.cols + x] = v; }
      PG.n = 0; for (let i = 0; i < PG.g.length; i++) if (PG.g[i]) PG.n++;
    }
    ui.section('Field brush — design your own magnets');
    ui.tools([{ id: 'launch', label: '➶ Launch particles' }, { id: 'in', label: '⊗ Paint B into screen' }, { id: 'out', label: '⊙ Paint B out of screen' }, { id: 'erase', label: '⌫ Erase painted field' }], PG.tool, (v) => (PG.tool = v));
    ui.buttons([{ label: 'Clear painted field', onClick: () => { if (PG.g) PG.g.fill(0); PG.n = 0; } }]);
    ui.note('Painted regions add to the scenario\'s own field. Try painting a row of magnets to steer a beam around a corner — that is how a synchrotron works.');
    const ext = {
      draw(ctx) {
        if (PG.g && PG.n) {
          for (let cy = 0; cy < PG.rows; cy++) for (let cx = 0; cx < PG.cols; cx++) {
            const v = PG.g[cy * PG.cols + cx];
            if (!v) continue;
            ctx.fillStyle = v > 0 ? 'rgba(167,139,250,0.16)' : 'rgba(45,212,191,0.16)';
            ctx.fillRect(cx * PG.cell, cy * PG.cell, PG.cell, PG.cell);
          }
        }
        if (PG.tool !== 'launch' && env.pointer.inside) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(((env.pointer.x / PG.cell) | 0) * PG.cell - PG.cell, ((env.pointer.y / PG.cell) | 0) * PG.cell - PG.cell, PG.cell * 3, PG.cell * 3); }
      },
      pointerdown(p) { if (PG.tool === 'launch') return false; paintAt(p); return true; },
      pointermove(p) { if (env.pointer.down && PG.tool !== 'launch') paintAt(p); },
    };

    return {
      ext,
      probe() { let vmax = 0; for (const p of parts) vmax = Math.max(vmax, Math.hypot(p.vx, p.vy)); return { preset: S.preset, hits: hits.length, vmax, painted: PG.n }; },
      _debug: () => ({ parts, t, S }),
      step(dt) {
        const n = Math.min(48, Math.max(1, Math.ceil(dt * 480))), h = dt / n;
        const W = env.W, H = env.H;
        for (let s = 0; s < n; s++) {
          t += h;
          for (const p of parts) {
            if (p.dead) continue;
            push(p, h);
            if (++p.k % 4 === 0) { p.tr[p.ti * 2] = p.x; p.tr[p.ti * 2 + 1] = p.y; p.ti = (p.ti + 1) % TL; if (p.tn < TL) p.tn++; }
            if (S.preset === 'selector' && Math.abs(p.x - W * 0.72) < 3 && Math.abs(p.y - H / 2) > 10) p.dead = 'hit';
            if (S.preset === 'spectro' && p.vx < 0 && p.x < W * 0.42 - 3) { hits.push({ y: p.y, m: p.iso }); p.dead = 'det'; }
          }
        }
        parts = parts.filter((p) => !(p.dead === 'det') && p.x > -300 && p.x < W + 300 && p.y > -300 && p.y < H + 300 && !(p.dead && t - p.born > 6));
        for (const p of parts) if (p.dead === 'hit' && !p.stop) { p.stop = true; p.vx = 0; p.vy = 0; }
        if (hits.length > 400) hits.splice(0, hits.length - 400);
        if (S.source && (S.preset === 'selector' || S.preset === 'spectro')) {
          emitT -= dt;
          if (emitT <= 0) { emitT = S.preset === 'selector' ? 0.22 : 0.35; emit(); }
        }
        if (S.preset === 'cyclo' && parts.length === 0) spawn(W / 2, H / 2, 0, 0, S.type);
        for (const p of parts) if (p.stop) { p.vx = 0; p.vy = 0; }
      },
      draw(ctx) {
        const W = env.W, H = env.H;
        ctx.fillStyle = '#07061a'; ctx.fillRect(0, 0, W, H);
        // regions
        ctx.fillStyle = 'rgba(167,139,250,0.07)';
        if (S.preset === 'selector') { ctx.fillRect(W * 0.3, H * 0.2, W * 0.38, H * 0.6); }
        if (S.preset === 'spectro') ctx.fillRect(W * 0.42, 0, W * 0.58, H);
        if (S.preset === 'cyclo') {
          const cx = W / 2, cy = H / 2, Rd = Math.min(W, H) * 0.44;
          ctx.fillStyle = 'rgba(167,139,250,0.1)';
          ctx.beginPath(); ctx.arc(cx, cy, Rd, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.arc(cx, cy, Rd, Math.PI / 2, (3 * Math.PI) / 2); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(200,180,255,0.45)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx - 14, cy, Rd, Math.PI / 2, (3 * Math.PI) / 2); ctx.lineTo(cx - 14, cy + Rd); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx + 14, cy, Rd, -Math.PI / 2, Math.PI / 2); ctx.lineTo(cx + 14, cy - Rd); ctx.stroke();
          field(cx, cy, F);
          ctx.fillStyle = `rgba(251,191,36,${Math.abs(F.Ex) / S.E0 * 0.35})`;
          ctx.fillRect(cx - 14, cy - Rd, 28, Rd * 2);
        }
        // field markers
        if (S.field) {
          const sp = 42;
          ctx.lineWidth = 1.2;
          for (let y = sp / 2; y < H; y += sp) for (let x = sp / 2; x < W; x += sp) {
            field(x, y, F);
            const b = F.Bz;
            if (Math.abs(b) > 0.02) {
              const a = Math.min(0.55, 0.12 + Math.abs(b) * 0.09);
              ctx.strokeStyle = `rgba(190,170,255,${a})`;
              ctx.fillStyle = `rgba(190,170,255,${a})`;
              ctx.beginPath();
              // screen y points down, so +z (= x × y) points INTO the screen: ⊗ for B_z > 0
              if (b < 0) { ctx.arc(x, y, 4, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 1.3, 0, TAU); ctx.fill(); }
              else { ctx.moveTo(x - 3.5, y - 3.5); ctx.lineTo(x + 3.5, y + 3.5); ctx.moveTo(x + 3.5, y - 3.5); ctx.lineTo(x - 3.5, y + 3.5); ctx.stroke(); }
            }
            const em = Math.hypot(F.Ex, F.Ey);
            if (em > 1 && S.preset !== 'cyclo') {
              const L = Math.min(16, 4 + em / 25);
              ctx.strokeStyle = 'rgba(251,191,36,0.45)';
              ctx.beginPath(); U.arrow(ctx, x + 8, y + 8, x + 8 + (F.Ex / em) * L, y + 8 + (F.Ey / em) * L, 4); ctx.stroke();
            }
          }
        }
        // apparatus
        if (S.preset === 'selector') {
          ctx.fillStyle = '#9aa3bd';
          ctx.fillRect(W * 0.72 - 3, 0, 6, H / 2 - 10); ctx.fillRect(W * 0.72 - 3, H / 2 + 10, 6, H / 2 - 10);
          ctx.fillStyle = '#fbbf24'; ctx.fillRect(W * 0.05 - 16, H / 2 - 8, 16, 16);
          ctx.fillStyle = '#dbe5ff'; ctx.font = '12px Segoe UI, sans-serif'; ctx.textBaseline = 'bottom';
          ctx.fillText(`only v = E/B = ${(S.Ey / Math.max(0.01, Math.abs(S.B))).toFixed(0)} px/s passes`, W * 0.3, H * 0.2 - 6);
          ctx.fillStyle = 'rgba(251,191,36,0.6)'; ctx.fillRect(W * 0.3, H * 0.2 - 4, W * 0.38, 3);
          ctx.fillStyle = 'rgba(96,165,250,0.6)'; ctx.fillRect(W * 0.3, H * 0.8 + 1, W * 0.38, 3);
        }
        if (S.preset === 'spectro') {
          const dx = W * 0.42;
          ctx.fillStyle = '#334155'; ctx.fillRect(dx - 8, 0, 6, H);
          ctx.fillStyle = '#fbbf24'; ctx.fillRect(W * 0.06 - 16, H * 0.84 - 8, 16, 16);
          const cols = { 4: '#60a5fa', 5: '#34d399', 6: '#fbbf24', 7: '#f472b6', 8: '#f87171' };
          for (const hh of hits) { ctx.fillStyle = cols[hh.m]; ctx.fillRect(dx - 22, hh.y - 1, 14, 2); }
          ctx.font = '11px Segoe UI, sans-serif'; ctx.textBaseline = 'middle';
          for (const m of [4, 5, 6, 7, 8]) {
            const r = (m * S.v0) / Math.abs(S.B), y = H * 0.84 - 2 * r * Math.sign(S.B);
            if (y > 0 && y < H) { ctx.fillStyle = cols[m]; ctx.fillText(`m=${m}`, dx - 60, y); }
          }
          ctx.fillStyle = '#dbe5ff'; ctx.textBaseline = 'top'; ctx.fillText('detector', dx - 62, 8);
        }
        // trails & particles
        if (S.trails) {
          ctx.lineWidth = 1.4;
          for (const p of parts) {
            if (p.tn < 2) continue;
            const [r, g, b] = TYPES[p.type].col;
            ctx.strokeStyle = `rgba(${r},${g},${b},0.7)`;
            ctx.beginPath();
            const start = p.tn < TL ? 0 : p.ti;
            for (let k = 0; k < p.tn; k++) { const i = ((start + k) % TL) * 2; k ? ctx.lineTo(p.tr[i], p.tr[i + 1]) : ctx.moveTo(p.tr[i], p.tr[i + 1]); }
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const p of parts) ctx.drawImage(sprites[p.type], p.x - 10, p.y - 10);
        ctx.globalCompositeOperation = 'source-over';
        if (launch) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
          ctx.beginPath(); U.arrow(ctx, launch.x, launch.y, env.pointer.x, env.pointer.y, 9); ctx.stroke();
          const v = Math.hypot(env.pointer.x - launch.x, env.pointer.y - launch.y) * 2;
          ctx.fillStyle = '#dbe5ff'; ctx.font = '12px Segoe UI, sans-serif'; ctx.textBaseline = 'bottom';
          ctx.fillText(`v = ${v.toFixed(0)} px/s`, env.pointer.x + 8, env.pointer.y - 6);
        }
      },
      pointerdown(p) { launch = { x: p.x, y: p.y }; },
      pointerup(p) {
        if (!launch) return;
        spawn(launch.x, launch.y, (p.x - launch.x) * 2, (p.y - launch.y) * 2, S.type);
        launch = null;
      },
      reset() { preset(S.preset); },
      readouts() {
        const p = parts[parts.length - 1];
        const tp = TYPES[S.type];
        field(env.pointer.x, env.pointer.y, F);
        const out = [['Particles', parts.length]];
        if (p) {
          field(p.x, p.y, F);
          const v = Math.hypot(p.vx, p.vy), B = Math.abs(F.Bz);
          out.push(['Last: |v|', v.toFixed(1) + ' px/s'], ['Kinetic energy', U.fmt(0.5 * p.m * v * v, 0)],
            ['Larmor radius r_L', B > 0.01 ? ((p.m * v) / (Math.abs(p.q) * B)).toFixed(1) + ' px' : '∞'],
            ['Gyro-period T', B > 0.01 ? ((TAU * p.m) / (Math.abs(p.q) * B)).toFixed(2) + ' s' : '∞']);
        }
        out.push(['E×B drift speed', Math.abs(S.B) > 0.01 ? (Math.hypot(S.Ex, S.Ey) / Math.abs(S.B)).toFixed(1) + ' px/s' : '—'],
          ['q/m (selected)', (tp.q / tp.m).toFixed(3)], ['B at cursor', F.Bz.toFixed(2)]);
        if (S.preset === 'spectro') out.push(['Ions detected', hits.length]);
        return out;
      },
    };
  },
});

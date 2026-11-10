'use strict';
/* LAB 01 — Electron Field: N-body Coulomb sandbox with potential map, field vectors & field lines */
PhysLab.define({
  id: 'electrons',
  title: 'Electron Field',
  subtitle: 'An empty chamber for electrons & protons — Coulomb forces, electric potential and field lines.',
  color: '#38bdf8',
  tags: ['Electrostatics', 'N-body', 'Fields'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="32" cy="32" r="5" fill="currentColor"/><ellipse cx="32" cy="32" rx="27" ry="10"/><ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(60 32 32)"/><ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(-60 32 32)"/><circle cx="59" cy="32" r="3" fill="currentColor"/><circle cx="18.5" cy="55.4" r="3" fill="currentColor"/></svg>`,
  hint: 'Hold the left mouse button to spray particles · right-drag moves any charge · pick tools & presets in the panel',
  howto: [
    '<b>Left mouse</b> uses the selected tool: spray electrons / protons, place fixed charges, move or erase.',
    '<b>Right mouse drag</b> always moves the nearest charge — great for dragging fixed charges around.',
    'Presets set up classic configurations: dipole, capacitor, conductor, plasma, atoms…',
    'Turn on <b>field lines</b> with only a few charges for the clearest pictures.',
  ],
  theory: `
  <h3>Coulomb's law</h3>
  <div class="eq">F = k · q₁ q₂ / r²</div>
  <p>Like charges repel, unlike charges attract. Every pair of particles interacts — an O(N²) N-body calculation integrated with a symplectic Euler scheme at 240 sub-steps per second.</p>
  <h3>Electric field &amp; potential</h3>
  <div class="eq">E(r) = Σ k qᵢ (r − rᵢ) / |r − rᵢ|³</div>
  <div class="eq">V(r) = Σ k qᵢ / |r − rᵢ| ,   E = −∇V</div>
  <p>The heat-map shows V: <b style="color:#ff9b6a">red</b> is positive, <b style="color:#5cc8ff">blue</b> negative, and the bright bands are <b>equipotentials</b>. Field lines leave positive charges and end on negative ones, always crossing equipotentials at right angles.</p>
  <h3>Things to try</h3>
  <ul>
    <li><b>Conductor</b> preset: free electrons rush to the walls — excess charge on a conductor lives on its surface.</li>
    <li><b>Capacitor</b>: the field between two charged plates is nearly uniform.</li>
    <li><b>Plasma</b> with zero damping: electrons and protons pair up into bound "atoms" and exchange energy.</li>
    <li>Raise the <b>mass ratio</b> and watch light electrons orbit nearly stationary protons.</li>
    <li>Switch on the <b>magnetic field</b> with zero damping: electrons gyrate in tight circles and the plasma is confined — the idea behind a tokamak.</li>
  </ul>
  <h3>Model notes</h3>
  <p>Potentials are softened (r² → r² + ε²) and a short-range repulsion stands in for Pauli exclusion, so particles never collapse to a point. Masses are scaled for visibility (the real m<sub>p</sub>/m<sub>e</sub> is 1836).</p>`,

  create(env) {
    const { ui } = env;
    const TAU = U.TAU;
    const SOFT2 = 36, REP = 2600, VMAX = 1600;
    const RAD = { e: 5, p: 6, 'F+': 15, 'F-': 15 };
    const MAXP = Math.round(220 + 380 * env.q);
    const S = { tool: 'electron', k: 2.2e5, damp: 0.15, mratio: 30, pot: true, contrast: 1, vec: true, lines: true, walls: 'bounce', B: 0, trails: false };
    let P = [];
    let spray = false, sprayT = 0, dragP = null, lastDrag = null;
    const sprE = U.glow([60, 190, 255], 11), sprP = U.glow([255, 120, 70], 13);

    /* ---------- potential grid ---------- */
    let res, gw, gh, pc, pctx, pimg, p32, frameNo = 0, linesCache = null, Vgrid = null;
    const LUT = new Uint32Array(512), LUTC = new Uint32Array(512);
    (function buildLUT() {
      const bg = [7, 11, 24], negM = [16, 70, 160], negH = [110, 215, 255], posM = [150, 38, 46], posH = [255, 178, 90];
      for (let i = 0; i < 512; i++) {
        const t = (i / 511) * 2 - 1, s = Math.abs(t);
        const mid = t < 0 ? negM : posM, hi = t < 0 ? negH : posH;
        const a = Math.min(1, s * 1.5), b = Math.max(0, (s - 0.62) / 0.38);
        const c = [0, 1, 2].map((k) => U.lerp(U.lerp(bg[k], mid[k], a), hi[k], b));
        const pack = (r, g, bb) => (255 << 24) | (Math.min(255, bb) << 16) | (Math.min(255, g) << 8) | Math.min(255, r);
        LUT[i] = pack(c[0] | 0, c[1] | 0, c[2] | 0);
        const l = 26 + 60 * s;
        LUTC[i] = pack((c[0] + l) | 0, (c[1] + l) | 0, (c[2] + l) | 0);
      }
    })();
    function setupGrid() {
      res = env.q >= 1 ? 7 : env.q >= 0.75 ? 9 : 12;
      gw = Math.ceil(env.W / res); gh = Math.ceil(env.H / res);
      pc = document.createElement('canvas'); pc.width = gw; pc.height = gh;
      pctx = pc.getContext('2d');
      pimg = pctx.createImageData(gw, gh);
      p32 = new Uint32Array(pimg.data.buffer);
    }
    setupGrid();

    /* ---------- particles ---------- */
    function add(x, y, type, vx = 0, vy = 0) {
      const fixed = type === 'F+' || type === 'F-';
      if (!fixed && P.length >= MAXP) return null;
      const p = {
        x, y, vx: fixed ? 0 : vx, vy: fixed ? 0 : vy, ax: 0, ay: 0, t: type, fixed,
        q: type === 'e' ? -1 : type === 'p' ? 1 : type === 'F+' ? 6 : -6,
        m: type === 'e' ? 1 : type === 'p' ? S.mratio : 1e12,
        r: RAD[type],
      };
      P.push(p);
      return p;
    }

    function forces() {
      const n = P.length, k = S.k;
      for (let i = 0; i < n; i++) { P[i].ax = 0; P[i].ay = 0; }
      for (let i = 0; i < n; i++) {
        const a = P[i];
        for (let j = i + 1; j < n; j++) {
          const b = P[j];
          if (a.fixed && b.fixed) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const d2 = dx * dx + dy * dy, r2 = d2 + SOFT2, r = Math.sqrt(r2);
          let f = (k * a.q * b.q) / (r2 * r);
          const rc = a.r + b.r;
          if (d2 < rc * rc && d2 > 1e-8) { const d = Math.sqrt(d2); f += (REP * (rc - d)) / d; }
          const fx = f * dx, fy = f * dy;
          if (!b.fixed) { b.ax += fx / b.m; b.ay += fy / b.m; }
          if (!a.fixed) { a.ax -= fx / a.m; a.ay -= fy / a.m; }
        }
      }
    }

    function integrate(h) {
      forces();
      const damp = Math.exp(-S.damp * h), W = env.W, H = env.H;
      for (const p of P) {
        if (p.fixed || p === dragP) continue;
        p.vx = (p.vx + p.ax * h) * damp;
        p.vy = (p.vy + p.ay * h) * damp;
        if (S.B) { // uniform magnetic field: exact rotation of the velocity (Lorentz force q v × B)
          const th = (p.q * S.B * h) / p.m, c = Math.cos(th), sn = Math.sin(th), vx = p.vx;
          p.vx = vx * c + p.vy * sn; p.vy = -vx * sn + p.vy * c;
        }
        const sp = p.vx * p.vx + p.vy * p.vy;
        if (sp > VMAX * VMAX) { const s = VMAX / Math.sqrt(sp); p.vx *= s; p.vy *= s; }
        p.x += p.vx * h; p.y += p.vy * h;
        const r = p.r;
        if (S.walls === 'bounce') {
          if (p.x < r) { p.x = r; p.vx = Math.abs(p.vx) * 0.85; }
          else if (p.x > W - r) { p.x = W - r; p.vx = -Math.abs(p.vx) * 0.85; }
          if (p.y < r) { p.y = r; p.vy = Math.abs(p.vy) * 0.85; }
          else if (p.y > H - r) { p.y = H - r; p.vy = -Math.abs(p.vy) * 0.85; }
        } else if (S.walls === 'wrap') {
          if (p.x < 0) p.x += W; else if (p.x >= W) p.x -= W;
          if (p.y < 0) p.y += H; else if (p.y >= H) p.y -= H;
        }
      }
      if (S.walls === 'open') P = P.filter((p) => p.fixed || p === dragP || (p.x > -40 && p.x < W + 40 && p.y > -40 && p.y < H + 40));
    }

    function fieldAt(x, y) {
      let ex = 0, ey = 0, V = 0;
      for (const p of P) {
        const dx = x - p.x, dy = y - p.y, r2 = dx * dx + dy * dy + SOFT2, r = Math.sqrt(r2);
        const inv = p.q / (r2 * r);
        ex += dx * inv; ey += dy * inv; V += p.q / r;
      }
      return [ex * S.k, ey * S.k, V * S.k];
    }

    /* ---------- presets ---------- */
    function preset(name) {
      P = [];
      dragP = null;
      const W = env.W, H = env.H, cx = W / 2, cy = H / 2;
      if (name === 'dipole') {
        add(cx - Math.min(160, W * 0.18), cy, 'F+');
        add(cx + Math.min(160, W * 0.18), cy, 'F-');
      } else if (name === 'capacitor') {
        const w = Math.min(W * 0.62, 640), n = Math.round(w / 34);
        for (let i = 0; i <= n; i++) {
          const x = cx - w / 2 + (w * i) / n;
          const a = add(x, cy - H * 0.22, 'F+'); a.q = 1.6;
          const b = add(x, cy + H * 0.22, 'F-'); b.q = -1.6;
        }
        for (let i = 0; i < 20; i++) add(U.rand(cx - w / 2, cx + w / 2), U.rand(cy - 20, cy + 20), 'e');
      } else if (name === 'conductor') {
        S.walls = 'bounce'; wallsSel.set('bounce');
        S.damp = 1.2; dampSl.set(1.2);
        for (let i = 0; i < Math.min(MAXP, 180); i++) add(U.rand(W * 0.3, W * 0.7), U.rand(H * 0.3, H * 0.7), 'e');
      } else if (name === 'plasma') {
        S.damp = 0; dampSl.set(0);
        const n = Math.min(MAXP / 2, 110);
        for (let i = 0; i < n; i++) {
          add(U.rand(20, W - 20), U.rand(20, H - 20), 'e', U.randn() * 120, U.randn() * 120);
          add(U.rand(20, W - 20), U.rand(20, H - 20), 'p', U.randn() * 20, U.randn() * 20);
        }
      } else if (name === 'atoms') {
        S.damp = 0; dampSl.set(0);
        const cols = Math.max(2, Math.floor(W / 190)), rows = Math.max(2, Math.floor(H / 170));
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          const x = ((i + 0.5) * W) / cols, y = ((j + 0.5) * H) / rows;
          add(x, y, 'p');
          const r = 34, v = Math.sqrt((S.k * 1) / (r * 1.0)) * 0.98;
          add(x + r, y, 'e', 0, v);
        }
      } else if (name === 'quadrupole') {
        const d = Math.min(W, H) * 0.2;
        add(cx - d, cy - d, 'F+'); add(cx + d, cy + d, 'F+');
        add(cx + d, cy - d, 'F-'); add(cx - d, cy + d, 'F-');
      } else if (name === 'cage') {
        const R = Math.min(W, H) * 0.32, n = 14;
        for (let i = 0; i < n; i++) { const a = (i / n) * TAU; const f = add(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 'F-'); f.q = -2; }
        add(cx, cy, 'F+');
        for (let i = 0; i < 40; i++) add(cx + U.randn() * 50, cy + U.randn() * 50, 'e', U.randn() * 60, U.randn() * 60);
      }
    }

    /* ---------- UI ---------- */
    ui.section('Tool');
    ui.tools([
      { id: 'electron', label: '<b style="color:#5cc8ff">e⁻</b> Spray electrons' },
      { id: 'proton', label: '<b style="color:#ff8a5c">p⁺</b> Spray protons' },
      { id: 'F+', label: '⊕ Fixed + charge' },
      { id: 'F-', label: '⊖ Fixed − charge' },
      { id: 'move', label: '✥ Move / fling' },
      { id: 'erase', label: '⌫ Erase' },
    ], S.tool, (v) => (S.tool = v));
    ui.section('Presets');
    ui.buttons([
      { label: 'Dipole', onClick: () => preset('dipole') },
      { label: 'Quadrupole', onClick: () => preset('quadrupole') },
      { label: 'Capacitor', onClick: () => preset('capacitor') },
      { label: 'Conductor', onClick: () => preset('conductor') },
      { label: 'Plasma', onClick: () => preset('plasma') },
      { label: 'Atoms', onClick: () => preset('atoms') },
      { label: 'Ion cage', onClick: () => preset('cage') },
      { label: 'Empty', onClick: () => preset('empty') },
    ]);
    ui.section('Physics');
    ui.slider('Coulomb constant k', { min: 2e4, max: 8e5, value: S.k, log: true, fmt: (v) => (v / 1e5).toFixed(2) + ' ×10⁵', onInput: (v) => (S.k = v) });
    const dampSl = ui.slider('Damping (friction)', { min: 0, max: 3, step: 0.01, value: S.damp, fmt: (v) => v.toFixed(2) + ' /s', onInput: (v) => (S.damp = v) });
    ui.slider('Proton / electron mass ratio', { min: 1, max: 400, value: S.mratio, log: true, fmt: (v) => Math.round(v) + ' : 1', onInput: (v) => { S.mratio = v; for (const p of P) if (p.t === 'p') p.m = v; } });
    ui.slider('Magnetic field B (into screen)', { min: -12, max: 12, step: 0.1, value: 0, fmt: (v) => (v === 0 ? 'off' : v.toFixed(1)), onInput: (v) => (S.B = v) });
    const wallsSel = ui.select('Boundaries', [['bounce', 'Reflecting walls'], ['wrap', 'Periodic (wrap)'], ['open', 'Open (escape)']], S.walls, (v) => (S.walls = v));
    ui.section('Visualisation');
    ui.toggle('Potential map + equipotentials', S.pot, (v) => (S.pot = v));
    ui.slider('Potential contrast', { min: 0.2, max: 5, value: S.contrast, log: true, fmt: (v) => v.toFixed(2) + '×', onInput: (v) => (S.contrast = v) });
    ui.toggle('Field vectors', S.vec, (v) => (S.vec = v));
    ui.toggle('Particle trails', S.trails, (v) => { S.trails = v; for (const p of P) p.tr = null; });
    ui.toggle('Field lines (≤ 90 charges)', S.lines, (v) => (S.lines = v));
    ui.buttons([
      { label: 'Freeze motion', onClick: () => P.forEach((p) => { p.vx = p.vy = 0; }) },
      { label: 'Clear all', onClick: () => { P = []; } },
    ]);
    ui.note(`Particle limit at this quality: <b>${MAXP}</b>.`);

    preset('dipole');
    for (let i = 0; i < 24; i++) add(U.rand(env.W * 0.2, env.W * 0.8), U.rand(env.H * 0.2, env.H * 0.8), 'e');

    /* ---------- rendering ---------- */
    function drawPotential(ctx) {
      const n = P.length;
      const xs = new Float32Array(n), ys = new Float32Array(n), qs = new Float32Array(n);
      for (let i = 0; i < n; i++) { xs[i] = P[i].x; ys[i] = P[i].y; qs[i] = P[i].q; }
      const s2 = SOFT2 * 2, NG = gw * gh;
      if (!Vgrid || Vgrid.length !== NG) Vgrid = new Float32Array(NG);
      let idx = 0, sum = 0, sum2 = 0;
      for (let gy = 0; gy < gh; gy++) {
        const y = (gy + 0.5) * res;
        for (let gx = 0; gx < gw; gx++, idx++) {
          const x = (gx + 0.5) * res;
          let V = 0;
          for (let i = 0; i < n; i++) { const dx = x - xs[i], dy = y - ys[i]; V += qs[i] / Math.sqrt(dx * dx + dy * dy + s2); }
          Vgrid[idx] = V; sum += V; sum2 += V * V;
        }
      }
      // V is only defined up to a constant: subtract the mean and scale by the spread
      const mean = sum / NG, sd = Math.sqrt(Math.max(1e-12, sum2 / NG - mean * mean));
      const k = S.contrast / Math.max(sd * 2.2, 0.004);
      for (idx = 0; idx < NG; idx++) {
        {
          const t = Math.tanh((Vgrid[idx] - mean) * k);
          const li = ((t * 0.5 + 0.5) * 511) | 0;
          const u = Math.abs(t) * 9, f = u - Math.floor(u);
          p32[idx] = f < 0.09 && Math.abs(t) > 0.04 ? LUTC[li] : LUT[li];
        }
      }
      pctx.putImageData(pimg, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(pc, 0, 0, gw * res, gh * res);
    }

    function drawVectors(ctx) {
      const sp = env.q >= 0.75 ? 34 : 44;
      const buckets = [[], [], [], []];
      for (let y = sp / 2; y < env.H; y += sp) {
        for (let x = sp / 2; x < env.W; x += sp) {
          const [ex, ey] = fieldAt(x, y);
          const m = Math.hypot(ex, ey);
          if (m < 1) continue;
          const L = Math.min(sp * 0.46, 3 + Math.log(1 + m / 25) * 4.2);
          const b = Math.min(3, (Math.log(1 + m / 20) * 0.9) | 0);
          buckets[b].push(x - (ex / m) * L * 0.5, y - (ey / m) * L * 0.5, x + (ex / m) * L * 0.5, y + (ey / m) * L * 0.5);
        }
      }
      ctx.lineWidth = 1.2;
      buckets.forEach((arr, b) => {
        if (!arr.length) return;
        ctx.strokeStyle = `rgba(200,225,255,${0.16 + b * 0.16})`;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i += 4) U.arrow(ctx, arr[i], arr[i + 1], arr[i + 2], arr[i + 3], 4);
        ctx.stroke();
      });
    }

    function computeLines() {
      const n = P.length;
      if (n === 0 || n > 90) return null;
      let src = P.filter((p) => p.fixed && p.q > 0), dir = 1;
      if (!src.length) {
        const prot = P.filter((p) => p.q > 0);
        if (prot.length && prot.length <= 24) src = prot;
      }
      if (!src.length) { src = P.filter((p) => p.fixed && p.q < 0); dir = -1; }
      if (!src.length) return null;
      const sinks = P.filter((p) => p.q * dir < 0);
      const path = new Path2D();
      const step = 5, maxSteps = 260, W = env.W, H = env.H;
      for (const s of src) {
        const nl = Math.min(24, Math.round(Math.abs(s.q) * (s.fixed ? 3 : 8)));
        for (let l = 0; l < nl; l++) {
          const a = ((l + 0.5) / nl) * TAU;
          let x = s.x + Math.cos(a) * (s.r + 2), y = s.y + Math.sin(a) * (s.r + 2);
          path.moveTo(x, y);
          for (let st = 0; st < maxSteps; st++) {
            let [ex, ey] = fieldAt(x, y);
            let m = Math.hypot(ex, ey) || 1;
            const mx = x + (dir * ex / m) * step * 0.5, my = y + (dir * ey / m) * step * 0.5;
            [ex, ey] = fieldAt(mx, my);
            m = Math.hypot(ex, ey) || 1;
            x += (dir * ex / m) * step; y += (dir * ey / m) * step;
            path.lineTo(x, y);
            if (x < -30 || y < -30 || x > W + 30 || y > H + 30) break;
            let hit = false;
            for (const k of sinks) { const dx = x - k.x, dy = y - k.y; if (dx * dx + dy * dy < k.r * k.r) { hit = true; break; } }
            if (hit) break;
          }
        }
      }
      return path;
    }

    return {
      step(dt) {
        if (spray && (S.tool === 'electron' || S.tool === 'proton')) {
          sprayT -= dt;
          while (sprayT <= 0) {
            sprayT += 0.03;
            const a = Math.random() * TAU, r = Math.random() * 14;
            add(env.pointer.x + Math.cos(a) * r, env.pointer.y + Math.sin(a) * r, S.tool === 'electron' ? 'e' : 'p', U.randn() * 30, U.randn() * 30);
          }
        }
        const n = Math.min(10, Math.max(1, Math.ceil(dt * 240)));
        for (let i = 0; i < n; i++) integrate(dt / n);
      },
      draw(ctx) {
        frameNo++;
        const W = env.W, H = env.H;
        if (S.pot) {
          if (P.length * gw * gh < 2.5e6 || frameNo % 2 === 0 || !pc._drawn) { drawPotential(ctx); pc._drawn = true; }
          else ctx.drawImage(pc, 0, 0, gw * res, gh * res);
        } else {
          ctx.fillStyle = '#070b18';
          ctx.fillRect(0, 0, W, H);
          ctx.strokeStyle = 'rgba(120,150,255,0.06)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let x = 0; x < W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
          for (let y = 0; y < H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
          ctx.stroke();
        }
        if (S.lines) {
          if (frameNo % 2 === 0 || !linesCache) linesCache = computeLines();
          if (linesCache) { ctx.strokeStyle = 'rgba(255,240,200,0.42)'; ctx.lineWidth = 1.1; ctx.stroke(linesCache); }
        }
        if (S.vec) drawVectors(ctx);

        if (S.trails) {
          const TLN = 26;
          for (const col of ['e', 'p']) {
            ctx.strokeStyle = col === 'e' ? 'rgba(120,210,255,0.45)' : 'rgba(255,150,100,0.45)'; ctx.lineWidth = 1.2; ctx.beginPath();
            for (const p of P) {
              if (p.t !== col) continue;
              if (!p.tr) p.tr = [];
              if (!env.paused && frameNo % 2 === 0) { p.tr.push(p.x, p.y); if (p.tr.length > TLN * 2) p.tr.splice(0, 2); }
              for (let k = 0; k < p.tr.length; k += 2) {
                if (k && Math.abs(p.tr[k] - p.tr[k - 2]) < 200 && Math.abs(p.tr[k + 1] - p.tr[k - 1]) < 200) ctx.lineTo(p.tr[k], p.tr[k + 1]); else ctx.moveTo(p.tr[k], p.tr[k + 1]);
              }
            }
            ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const p of P) {
          if (p.t === 'e') ctx.drawImage(sprE, p.x - 11, p.y - 11);
          else if (p.t === 'p') ctx.drawImage(sprP, p.x - 13, p.y - 13);
        }
        ctx.globalCompositeOperation = 'source-over';
        for (const p of P) {
          if (!p.fixed) continue;
          const pos = p.q > 0;
          const g = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, p.r);
          g.addColorStop(0, pos ? '#ffd2b0' : '#c8ecff');
          g.addColorStop(1, pos ? '#d9442b' : '#1f6fd1');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(p.x - 6, p.y); ctx.lineTo(p.x + 6, p.y);
          if (pos) { ctx.moveTo(p.x, p.y - 6); ctx.lineTo(p.x, p.y + 6); }
          ctx.stroke();
        }
        if (dragP) {
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(dragP.x, dragP.y, dragP.r + 7, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        }
        if (env.pointer.inside && S.tool === 'erase') {
          ctx.strokeStyle = 'rgba(255,120,120,0.7)';
          ctx.beginPath(); ctx.arc(env.pointer.x, env.pointer.y, 20, 0, TAU); ctx.stroke();
        }
      },
      pointerdown(p, e) {
        const nearest = () => {
          let best = null, bd = 26 * 26;
          for (const q of P) { const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2; if (d < bd + q.r * q.r) { bd = d; best = q; } }
          return best;
        };
        if (e.button === 2 || S.tool === 'move') { dragP = nearest(); lastDrag = { x: p.x, y: p.y, t: performance.now() }; return; }
        if (S.tool === 'electron' || S.tool === 'proton') { spray = true; sprayT = 0; add(p.x, p.y, S.tool === 'electron' ? 'e' : 'p'); }
        else if (S.tool === 'F+' || S.tool === 'F-') add(p.x, p.y, S.tool);
        else if (S.tool === 'erase') this.pointermove(p);
      },
      pointermove(p) {
        if (dragP) {
          const now = performance.now(), dt = Math.max(1, now - lastDrag.t) / 1000;
          dragP.x = p.x; dragP.y = p.y;
          if (!dragP.fixed) { dragP.vx = (p.x - lastDrag.x) / dt * 0.6; dragP.vy = (p.y - lastDrag.y) / dt * 0.6; }
          lastDrag = { x: p.x, y: p.y, t: now };
          linesCache = null;
        } else if (env.pointer.down && S.tool === 'erase') {
          P = P.filter((q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 > 20 * 20);
        }
      },
      pointerup() { spray = false; dragP = null; },
      resize() { setupGrid(); },
      reset() { preset('dipole'); },
      readouts() {
        let ne = 0, np = 0, nf = 0, Q = 0, KE = 0;
        for (const p of P) {
          if (p.t === 'e') ne++; else if (p.t === 'p') np++; else nf++;
          Q += p.q;
          if (!p.fixed) KE += 0.5 * p.m * (p.vx * p.vx + p.vy * p.vy);
        }
        const [ex, ey, V] = fieldAt(env.pointer.x, env.pointer.y);
        return [
          ['Electrons', ne], ['Protons', np], ['Fixed charges', nf], ['Net charge', (+Q.toFixed(1)) + ' e'],
          ['Kinetic energy', U.fmt(KE / 1000, 1) + ' k'], ['|E| at cursor', U.fmt(Math.hypot(ex, ey), 1)],
          ['V at cursor', U.fmt(V, 0)], ['Particle cap', MAXP],
        ];
      },
    };
  },
});

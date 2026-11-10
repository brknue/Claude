'use strict';
/* LAB 03 — Ripple Tank: finite-difference 2D wave equation with walls, refractive media and absorbing borders */
PhysLab.define({
  id: 'ripple',
  title: 'Ripple Tank',
  subtitle: 'The 2D wave equation: interference, double slits, diffraction, lenses, Doppler & shock cones.',
  color: '#22d3ee',
  tags: ['Waves', 'Optics', 'PDE solver'],
  icon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="16" cy="32" r="3" fill="currentColor"/><path d="M24 20a16 16 0 0 1 0 24M31 13a26 26 0 0 1 0 38M38 7a35 35 0 0 1 0 50"/><path d="M48 4v20M48 30v4M48 40v20" stroke-width="3"/></svg>`,
  hint: 'Click to add wave sources · use the tools to draw walls and glass · try the Double slit and Doppler presets',
  howto: [
    'Pick a <b>preset</b>, or build your own experiment with the tools.',
    '<b>Source</b>: click to add an oscillator, drag an existing one to move it.',
    '<b>Wall</b> / <b>Glass</b>: drag to paint. Glass slows the waves (refractive index n).',
    '<b>Drop</b>: click for a single splash. Switch the view to <b>Intensity</b> to see time-averaged energy — the classic fringe pattern.',
  ],
  theory: `
  <h3>The wave equation</h3>
  <div class="eq">∂²u/∂t² = c(x,y)² ∇²u</div>
  <p>Solved on a grid with an explicit second-order finite-difference scheme:</p>
  <div class="eq">uⁿ⁺¹ = 2uⁿ − uⁿ⁻¹ + (cΔt/Δx)² (u_E + u_W + u_N + u_S − 4u)</div>
  <p>The Courant number cΔt/Δx = 0.5 keeps it stable. A graded "sponge" layer at the borders absorbs outgoing waves so the tank looks infinite.</p>
  <h3>Interference</h3>
  <div class="eq">d · sin θ = m λ   (bright fringes)</div>
  <p>Two coherent sources produce hyperbolic nodal lines where crest meets trough. Through a double slit, the far-field fringes spread further apart as λ grows or slit spacing d shrinks.</p>
  <h3>Refraction</h3>
  <div class="eq">n = c₁ / c₂ ,   n₁ sin θ₁ = n₂ sin θ₂</div>
  <p>Inside glass the waves slow down and the wavelength shrinks; a lens-shaped region focuses a plane wave.</p>
  <h3>Doppler effect &amp; shock waves</h3>
  <div class="eq">f' = f / (1 − v/c)    sin α = c / v  (Mach cone)</div>
  <p>A moving source bunches up wavefronts ahead of it. Push the Mach number above 1 and the wavefronts pile up into a cone — a sonic boom.</p>`,

  create(env) {
    const { ui } = env;
    const TAU = U.TAU;
    const cs = env.q >= 1 ? 3 : env.q >= 0.75 ? 4 : 5;
    const BASE = 0.25, CW = Math.sqrt(BASE);
    const S = { tool: 'source', lam: 20, amp: 1, view: 'wave', spf: 2, bright: 1.3, brush: 2, nGlass: 1.6, mach: 0.6, preset: 'two' };
    let gw, gh, N, u, up, c2, damp, type, avg, B, img, u32, sources = [], steps = 0, last = null, dragSrc = null;
    const off = document.createElement('canvas'), octx = off.getContext('2d');

    /* ---------- colour tables ---------- */
    const pack = (r, g, b) => (255 << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
    const LW = new Uint32Array(256), LG = new Uint32Array(256), LI = new Uint32Array(256), LIG = new Uint32Array(256);
    (function () {
      const bg = [6, 12, 28], pM = [30, 150, 230], pH = [225, 250, 255], nM = [110, 40, 170], nH = [255, 120, 210];
      for (let i = 0; i < 256; i++) {
        const t = (i / 255) * 2 - 1, s = Math.abs(t);
        const M = t >= 0 ? pM : nM, Hh = t >= 0 ? pH : nH;
        const a = Math.min(1, s * 1.7), b = Math.max(0, (s - 0.55) / 0.45);
        const c = [0, 1, 2].map((k) => U.lerp(U.lerp(bg[k], M[k], a), Hh[k], b));
        LW[i] = pack(c[0], c[1], c[2]);
        LG[i] = pack(c[0] * 0.8 + 40, c[1] * 0.8 + 46, c[2] * 0.8 + 18);
      }
      const st = [[0, 0, 4], [40, 11, 84], [120, 28, 109], [187, 55, 84], [237, 105, 37], [251, 180, 26], [252, 255, 164]];
      for (let i = 0; i < 256; i++) {
        const f = (i / 255) * (st.length - 1), k = Math.min(st.length - 2, f | 0), t = f - k;
        const c = [0, 1, 2].map((j) => U.lerp(st[k][j], st[k + 1][j], t));
        LI[i] = pack(c[0], c[1], c[2]);
        LIG[i] = pack(c[0] * 0.8 + 30, c[1] * 0.8 + 40, c[2] * 0.8 + 18);
      }
    })();
    const WALL = pack(150, 162, 186);

    function alloc() {
      gw = Math.max(60, Math.ceil(env.W / cs)); gh = Math.max(40, Math.ceil(env.H / cs)); N = gw * gh;
      u = new Float32Array(N); up = new Float32Array(N); c2 = new Float32Array(N).fill(BASE);
      damp = new Float32Array(N); type = new Uint8Array(N); avg = new Float32Array(N);
      off.width = gw; off.height = gh;
      img = octx.createImageData(gw, gh); u32 = new Uint32Array(img.data.buffer);
      B = Math.round(Math.min(gw, gh) * 0.08) + 8;
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        const d = Math.min(x, y, gw - 1 - x, gh - 1 - y);
        damp[y * gw + x] = d < B ? 1 - 0.16 * Math.pow((B - d) / B, 2) : 1;
      }
    }

    const omega = () => (TAU * CW) / S.lam;
    function setCell(i, t, n) {
      type[i] = t;
      c2[i] = t === 1 ? 0 : t === 2 ? BASE / (n * n) : BASE;
      if (t === 1) { u[i] = 0; up[i] = 0; }
    }
    function paint(cx, cy, r, t) {
      const r2 = r * r;
      for (let y = Math.max(1, Math.floor(cy - r)); y <= Math.min(gh - 2, Math.ceil(cy + r)); y++)
        for (let x = Math.max(1, Math.floor(cx - r)); x <= Math.min(gw - 2, Math.ceil(cx + r)); x++)
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) setCell(y * gw + x, t, S.nGlass);
    }
    function paintLine(x0, y0, x1, y1, r, t) {
      const L = Math.max(1, Math.hypot(x1 - x0, y1 - y0));
      for (let s = 0; s <= L; s += 0.5) paint(x0 + ((x1 - x0) * s) / L, y0 + ((y1 - y0) * s) / L, r, t);
    }
    function wallRect(x0, y0, x1, y1) {
      for (let y = Math.max(1, y0); y <= Math.min(gh - 2, y1); y++) for (let x = Math.max(1, x0); x <= Math.min(gw - 2, x1); x++) setCell(y * gw + x, 1);
    }

    /* ---------- presets ---------- */
    function preset(name) {
      S.preset = name;
      u.fill(0); up.fill(0); avg.fill(0); type.fill(0); c2.fill(BASE);
      sources = []; steps = 0;
      const cx = gw / 2, cy = gh / 2, lam = S.lam;
      const line = () => sources.push({ kind: 'line', x: B + 2, ph: 0 });
      if (name === 'single') sources.push({ kind: 'pt', x: gw * 0.35, y: cy, ph: 0 });
      else if (name === 'two') {
        const d = lam * 3;
        sources.push({ kind: 'pt', x: gw * 0.28, y: cy - d / 2, ph: 0 }, { kind: 'pt', x: gw * 0.28, y: cy + d / 2, ph: 0 });
      } else if (name === 'double' || name === 'slit' || name === 'grating') {
        line();
        const xw = Math.round(gw * 0.3);
        wallRect(xw, 1, xw + 2, gh - 2);
        const open = (yc, w) => { for (let y = Math.round(yc - w / 2); y < Math.round(yc + w / 2); y++) for (let x = xw; x <= xw + 2; x++) setCell(y * gw + x, 0); };
        if (name === 'double') { const d = Math.round(lam * 2.6), w = Math.max(3, Math.round(lam * 0.35)); open(cy - d / 2, w); open(cy + d / 2, w); }
        else if (name === 'slit') open(cy, Math.round(lam * 1.6));
        else { const d = Math.round(lam * 1.5); for (let k = -4; k <= 4; k++) open(cy + k * d, 3); }
      } else if (name === 'lens') {
        line();
        const h = gh * 0.34, R = h * 1.7, t = 2 * (R - Math.sqrt(R * R - h * h)), xc = gw * 0.4;
        for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
          const a = (x - (xc + R - t / 2)) ** 2 + (y - cy) ** 2 < R * R, b = (x - (xc - R + t / 2)) ** 2 + (y - cy) ** 2 < R * R;
          if (a && b) setCell(y * gw + x, 2, 1.7);
        }
      } else if (name === 'refraction') {
        line();
        for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) if (x > gw * 0.45 + (y - cy) * 0.6) setCell(y * gw + x, 2, S.nGlass);
      } else if (name === 'doppler') {
        sources.push({ kind: 'pt', x: B + 12, y: cy, ph: 0, moving: true });
      } else if (name === 'mirror') {
        line();
        const xv = gw * 0.82, f = gw * 0.2;
        for (let y = 1; y < gh - 1; y++) {
          const dy = y - cy;
          if (Math.abs(dy) > gh * 0.4) continue;
          const x = Math.round(xv - (dy * dy) / (4 * f));
          for (let k = 0; k < 3; k++) if (x + k < gw - 1) setCell(y * gw + x + k, 1);
        }
      } else if (name === 'waveguide') {
        sources.push({ kind: 'pt', x: B + 6, y: cy, ph: 0 });
        wallRect(B, Math.round(cy - lam * 1.2) - 2, Math.round(gw * 0.55), Math.round(cy - lam * 1.2));
        wallRect(B, Math.round(cy + lam * 1.2), Math.round(gw * 0.55), Math.round(cy + lam * 1.2) + 2);
      }
    }

    /* ---------- simulation ---------- */
    function simStep() {
      const w = gw, om = omega(), t = steps;
      for (const s of sources) {
        const val = S.amp * Math.sin(om * t + s.ph);
        if (s.kind === 'line') {
          const x = s.x | 0;
          for (let y = 1; y < gh - 1; y++) { const i = y * w + x; if (type[i] !== 1) u[i] = val; }
        } else {
          if (s.moving) { s.x += S.mach * CW; if (s.x > gw - B - 4) s.x = B + 4; }
          const x0 = Math.floor(s.x), y0 = Math.floor(s.y), fx = s.x - x0, fy = s.y - y0;
          const ws = [(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy], id = [0, 1, w, w + 1];
          const base = y0 * w + x0;
          for (let k = 0; k < 4; k++) { const i = base + id[k]; if (i > 0 && i < N && type[i] !== 1) u[i] = U.lerp(u[i], val, Math.min(1, ws[k] * 2)); }
        }
      }
      for (let y = 1; y < gh - 1; y++) {
        let i = y * w + 1;
        for (let x = 1; x < w - 1; x++, i++) {
          const ui = u[i];
          up[i] = (2 * ui - up[i] + c2[i] * (u[i - 1] + u[i + 1] + u[i - w] + u[i + w] - 4 * ui)) * damp[i];
        }
      }
      const tmp = u; u = up; up = tmp;
      if (S.view === 'intensity') for (let i = 0; i < N; i++) avg[i] += (u[i] * u[i] - avg[i]) * 0.012;
      steps++;
    }

    function render() {
      const br = S.bright;
      if (S.view === 'wave') {
        for (let i = 0; i < N; i++) {
          const ty = type[i];
          if (ty === 1) { u32[i] = WALL; continue; }
          let k = (u[i] * br * 127.5 + 127.5) | 0;
          k = k < 0 ? 0 : k > 255 ? 255 : k;
          u32[i] = ty === 2 ? LG[k] : LW[k];
        }
      } else {
        for (let i = 0; i < N; i++) {
          const ty = type[i];
          if (ty === 1) { u32[i] = WALL; continue; }
          let k = (Math.sqrt(avg[i]) * br * 230) | 0;
          k = k > 255 ? 255 : k;
          u32[i] = ty === 2 ? LIG[k] : LI[k];
        }
      }
      octx.putImageData(img, 0, 0);
    }

    /* ---------- UI ---------- */
    ui.section('Experiments');
    ui.buttons([
      { label: 'Two sources', onClick: () => preset('two') },
      { label: 'Single source', onClick: () => preset('single') },
      { label: 'Double slit', onClick: () => preset('double') },
      { label: 'Single slit', onClick: () => preset('slit') },
      { label: 'Grating', onClick: () => preset('grating') },
      { label: 'Lens', onClick: () => preset('lens') },
      { label: 'Refraction', onClick: () => preset('refraction') },
      { label: 'Parabolic mirror', onClick: () => preset('mirror') },
      { label: 'Doppler / Mach', onClick: () => preset('doppler') },
      { label: 'Waveguide', onClick: () => preset('waveguide') },
      { label: 'Empty tank', onClick: () => preset('empty') },
    ]);
    ui.section('Tool');
    ui.tools([
      { id: 'source', label: '◉ Source' }, { id: 'drop', label: '💧 Drop' },
      { id: 'wall', label: '▮ Wall' }, { id: 'glass', label: '◈ Glass' },
      { id: 'erase', label: '⌫ Erase' },
    ], S.tool, (v) => (S.tool = v));
    ui.slider('Brush size', { min: 1, max: 8, step: 0.5, value: S.brush, fmt: (v) => v + ' cells', onInput: (v) => (S.brush = v) });
    ui.slider('Glass refractive index n', { min: 1.1, max: 3, step: 0.05, value: S.nGlass, fmt: (v) => v.toFixed(2), onInput: (v) => (S.nGlass = v) });
    ui.section('Waves');
    ui.slider('Wavelength λ', { min: 8, max: 48, step: 1, value: S.lam, fmt: (v) => (v * cs) + ' px', onInput: (v) => (S.lam = v), onChange: () => { if (['double', 'slit', 'grating', 'two', 'waveguide'].includes(S.preset)) preset(S.preset); } });
    ui.slider('Amplitude', { min: 0.2, max: 2, value: S.amp, fmt: (v) => v.toFixed(2), onInput: (v) => (S.amp = v) });
    ui.slider('Source speed (Mach)', { min: 0, max: 1.8, value: S.mach, fmt: (v) => 'M ' + v.toFixed(2), onInput: (v) => (S.mach = v) });
    ui.slider('Steps per frame', { min: 1, max: 6, step: 1, value: S.spf, fmt: (v) => v + '', onInput: (v) => (S.spf = v) });
    ui.section('Display');
    ui.select('View', [['wave', 'Displacement u'], ['intensity', 'Intensity ⟨u²⟩']], S.view, (v) => { S.view = v; avg.fill(0); });
    ui.slider('Brightness', { min: 0.3, max: 4, value: S.bright, log: true, fmt: (v) => v.toFixed(2) + '×', onInput: (v) => (S.bright = v) });
    ui.buttons([{ label: 'Calm water', onClick: () => { u.fill(0); up.fill(0); avg.fill(0); } }, { label: 'Remove sources', onClick: () => (sources = []) }]);
    ui.note('Moving sources only happen in the Doppler preset. Wavelength changes rebuild slit experiments so geometry matches λ.');

    alloc();
    preset('two');

    const toCell = (p) => [p.x / cs, p.y / cs];

    return {
      step(dt) {
        const n = Math.max(1, Math.round(S.spf * Math.min(4, dt * 60)));
        for (let i = 0; i < n; i++) simStep();
      },
      draw(ctx) {
        render();
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(off, 0, 0, gw * cs, gh * cs);
        const pulse = 0.5 + 0.5 * Math.sin(omega() * steps);
        for (const s of sources) {
          if (s.kind === 'line') {
            ctx.fillStyle = `rgba(120,220,255,${0.35 + pulse * 0.4})`;
            ctx.fillRect(s.x * cs - 2, 0, 4, env.H);
          } else {
            const x = s.x * cs, y = s.y * cs;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(x, y, 4, 0, U.TAU); ctx.fill();
            ctx.strokeStyle = `rgba(255,255,255,${0.3 + pulse * 0.5})`; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(x, y, 7 + pulse * 3, 0, U.TAU); ctx.stroke();
          }
        }
        if (env.pointer.inside && (S.tool === 'wall' || S.tool === 'glass' || S.tool === 'erase')) {
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(env.pointer.x, env.pointer.y, Math.max(3, S.brush * cs), 0, U.TAU); ctx.stroke();
        }
      },
      pointerdown(p) {
        const [x, y] = toCell(p);
        last = [x, y];
        if (S.tool === 'source') {
          dragSrc = sources.find((s) => s.kind === 'pt' && Math.hypot(s.x - x, s.y - y) < 5) || null;
          if (!dragSrc && sources.length < 12) sources.push({ kind: 'pt', x, y, ph: 0 });
        } else if (S.tool === 'drop') {
          for (let yy = -8; yy <= 8; yy++) for (let xx = -8; xx <= 8; xx++) {
            const X = Math.round(x) + xx, Y = Math.round(y) + yy;
            if (X < 1 || Y < 1 || X >= gw - 1 || Y >= gh - 1) continue;
            const i = Y * gw + X;
            if (type[i] !== 1) u[i] += 2.2 * Math.exp(-(xx * xx + yy * yy) / 6);
          }
        } else this.pointermove(p);
      },
      pointermove(p) {
        if (!env.pointer.down) return;
        const [x, y] = toCell(p);
        if (dragSrc) { dragSrc.x = U.clamp(x, 2, gw - 3); dragSrc.y = U.clamp(y, 2, gh - 3); }
        else if (S.tool === 'wall') paintLine(last[0], last[1], x, y, S.brush, 1);
        else if (S.tool === 'glass') paintLine(last[0], last[1], x, y, S.brush, 2);
        else if (S.tool === 'erase') {
          paintLine(last[0], last[1], x, y, S.brush + 1, 0);
          sources = sources.filter((s) => s.kind !== 'pt' || Math.hypot(s.x - x, s.y - y) > S.brush + 3);
        }
        last = [x, y];
      },
      pointerup() { dragSrc = null; },
      resize() { alloc(); preset(S.preset); },
      reset() { preset(S.preset); },
      readouts() {
        const lamPx = S.lam * cs;
        return [
          ['Grid', gw + ' × ' + gh], ['Cell size', cs + ' px'], ['Wavelength λ', lamPx + ' px'],
          ['Period', (S.lam / CW).toFixed(0) + ' steps'], ['Wave speed c', CW.toFixed(2) + ' cell/step'],
          ['Sources', sources.length], ['Source Mach', S.preset === 'doppler' ? S.mach.toFixed(2) : '—'], ['Time steps', steps],
        ];
      },
    };
  },
});

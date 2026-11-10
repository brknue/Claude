'use strict';
/* Menu metadata + tiny procedural animations shown as live previews on each lab card */
(function () {
  const TAU = Math.PI * 2;
  PhysLab.meta = {
    electrons: 'Electromagnetism', gravity: 'Mechanics', ripple: 'Waves & Optics', pendulum: 'Mechanics', gas: 'Thermal & Statistical',
    lorentz: 'Electromagnetism', optics: 'Waves & Optics', fluid: 'Mechanics', projectile: 'Mechanics', cloth: 'Mechanics',
    quantum: 'Modern Physics', blackhole: 'Modern Physics', matter: 'Thermal & Statistical', ising: 'Thermal & Statistical', string: 'Waves & Optics',
  };
  const dot = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

  PhysLab.thumbs = {
    electrons(g, w, h, t) {
      const ax = w * 0.36, bx = w * 0.64, y = h / 2;
      g.strokeStyle = 'rgba(255,240,200,.3)'; g.lineWidth = 1;
      for (let k = 1; k <= 5; k++) { g.beginPath(); g.ellipse(w / 2, y, (bx - ax) / 2 + k * 3, k * 9, 0, 0, TAU); g.stroke(); }
      dot(g, ax, y, 8, '#ff8a5c'); dot(g, bx, y, 8, '#3b9cff');
      for (let i = 0; i < 9; i++) { const a = t * (1.2 + (i % 3) * 0.4) + i * 2.1, r = 16 + (i % 4) * 7; dot(g, ax + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 0.8, 2, '#9fe0ff'); }
    },
    gravity(g, w, h, t) {
      const cx = w / 2, cy = h / 2;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 26); gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, '#ffd27a'); gr.addColorStop(1, 'rgba(255,200,100,0)');
      g.fillStyle = gr; g.fillRect(cx - 26, cy - 26, 52, 52);
      [[30, 1.9, '#9ad1ff'], [52, 1.1, '#e0663f'], [78, 0.6, '#c7ff8a'], [110, 0.35, '#d9b48a']].forEach(([r, s, c], i) => {
        g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.ellipse(cx, cy, r, r * 0.42, 0, 0, TAU); g.stroke();
        const a = t * s + i * 1.7; dot(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.42, 2.5 + (i === 3 ? 1.5 : 0), c);
      });
    },
    ripple(g, w, h, t) {
      for (const sy of [h * 0.32, h * 0.68]) for (let k = 0; k < 9; k++) {
        const r = ((t * 22 + k * 22) % 198);
        g.strokeStyle = `rgba(60,200,255,${0.5 * (1 - r / 198)})`; g.lineWidth = 2;
        g.beginPath(); g.arc(w * 0.22, sy, r, 0, TAU); g.stroke();
      }
      dot(g, w * 0.22, h * 0.32, 3, '#fff'); dot(g, w * 0.22, h * 0.68, 3, '#fff');
    },
    pendulum(g, w, h, t) {
      const px = w / 2, py = 8, L = h * 0.38;
      g.lineWidth = 1.5;
      for (let k = 30; k >= 0; k--) {
        const tt = t - k * 0.03, a1 = 1.3 * Math.sin(tt * 1.7) + 0.4 * Math.sin(tt * 2.9), a2 = 2.2 * Math.sin(tt * 2.3 + 1) + Math.sin(tt * 4.1);
        const x1 = px + L * Math.sin(a1), y1 = py + L * Math.cos(a1), x2 = x1 + L * Math.sin(a2), y2 = y1 + L * Math.cos(a2) * 0.9;
        if (k) dot(g, x2, y2, 1.4, `rgba(244,114,182,${1 - k / 30})`);
        else { g.strokeStyle = '#dbe5ff'; g.beginPath(); g.moveTo(px, py); g.lineTo(x1, y1); g.lineTo(x2, y2); g.stroke(); dot(g, x1, y1, 5, '#f9a8d4'); dot(g, x2, y2, 6, '#f472b6'); }
      }
    },
    gas(g, w, h, t) {
      const tri = (v, m) => { v = ((v % (2 * m)) + 2 * m) % (2 * m); return v < m ? v : 2 * m - v; };
      for (let i = 0; i < 46; i++) {
        const sp = 20 + hash(i) * 90;
        const x = tri(hash(i + 9) * w + t * sp * (hash(i + 3) - 0.5) * 2, w - 8) + 4, y = tri(hash(i + 5) * h + t * sp * (hash(i + 7) - 0.5) * 2, h - 8) + 4;
        dot(g, x, y, 3, `hsl(${220 - sp * 2},90%,60%)`);
      }
    },
    lorentz(g, w, h, t) {
      g.fillStyle = 'rgba(190,170,255,.25)';
      for (let y = 12; y < h; y += 24) for (let x = 14; x < w; x += 28) g.fillRect(x - 1, y - 1, 2, 2);
      const n = 220, ph = (t * 60) % n;
      g.strokeStyle = '#a78bfa'; g.lineWidth = 1.6; g.beginPath();
      for (let k = 0; k <= ph; k++) { const a = k * 0.16, r = 3 + k * 0.2; const x = w / 2 + Math.cos(a) * r * 1.6, y = h / 2 + Math.sin(a) * r; k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      const a = ph * 0.16, r = 3 + ph * 0.2; dot(g, w / 2 + Math.cos(a) * r * 1.6, h / 2 + Math.sin(a) * r, 3.5, '#fff');
    },
    optics(g, w, h, t) {
      const lx = w * 0.45, fx = w * 0.78, cy = h / 2;
      g.globalCompositeOperation = 'lighter';
      for (let k = -4; k <= 4; k++) {
        const y = cy + k * 9; const hue = (t * 40 + k * 30) % 360;
        g.strokeStyle = `hsla(${hue},100%,60%,.7)`; g.lineWidth = 1.3;
        g.beginPath(); g.moveTo(10, y); g.lineTo(lx, y); g.lineTo(fx, cy); g.lineTo(w, cy - k * 9 * ((w - fx) / (fx - lx))); g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(170,215,255,.2)'; g.strokeStyle = 'rgba(190,225,255,.7)';
      g.beginPath(); g.ellipse(lx, cy, 9, h * 0.42, 0, 0, TAU); g.fill(); g.stroke();
    },
    fluid(g, w, h, t) {
      const cx = w * 0.3, cy = h / 2, R = 13;
      g.lineWidth = 1.5;
      for (let k = 0; k < 9; k++) {
        const y0 = (k + 0.5) * (h / 9);
        g.strokeStyle = k % 2 ? 'rgba(96,165,250,.8)' : 'rgba(251,146,60,.8)'; g.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const dx = x - cx, dy = y0 - cy, d2 = dx * dx + dy * dy;
          let y = y0 + (dy * R * R * 1.6) / Math.max(d2, R * R);
          if (x > cx + R) y += Math.sin((x - cx) * 0.07 - t * 4 + k) * Math.min(9, (x - cx) * 0.06) * Math.exp(-Math.abs(dy) / 30);
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
      dot(g, cx, cy, R, '#475370');
    },
    projectile(g, w, h, t) {
      const gy = h - 12, T = (t % 2.4) / 2.4;
      g.strokeStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(0, gy); g.lineTo(w, gy); g.stroke();
      const P = (u, R, Hh) => [18 + u * R, gy - 4 * Hh * u * (1 - u)];
      g.setLineDash([4, 4]); g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath();
      for (let k = 0; k <= 30; k++) { const [x, y] = P(k / 30, w - 40, h * 0.75); k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke(); g.setLineDash([]);
      g.strokeStyle = '#fb923c'; g.lineWidth = 2; g.beginPath();
      for (let k = 0; k <= 30 * T; k++) { const u = k / 30, [x, y] = P(u, (w - 40) * (0.72 - 0.12 * u), h * 0.6); k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      const [bx, by] = P(T, (w - 40) * (0.72 - 0.12 * T), h * 0.6); dot(g, bx, by, 4, '#fff');
    },
    cloth(g, w, h, t) {
      const C = 14, Rr = 7, P = (i, j) => [w * 0.18 + (i / C) * w * 0.64 + Math.sin(t * 2 + j * 0.6 + i * 0.3) * j * 1.6, 8 + (j / Rr) * (h - 26) + Math.cos(t * 1.6 + i * 0.5) * j * 0.6];
      g.strokeStyle = 'rgba(45,212,191,.75)'; g.lineWidth = 1; g.beginPath();
      for (let j = 0; j <= Rr; j++) for (let i = 0; i <= C; i++) { const [x, y] = P(i, j); if (i < C) { const [a, b] = P(i + 1, j); g.moveTo(x, y); g.lineTo(a, b); } if (j < Rr) { const [a, b] = P(i, j + 1); g.moveTo(x, y); g.lineTo(a, b); } }
      g.stroke();
    },
    quantum(g, w, h, t) {
      const base = h - 16, bx = w * 0.6, T = (t % 4) / 4, c = 20 + T * (w - 40);
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(bx, 18, 9, base - 18);
      for (let x = 0; x < w; x += 2) {
        const refl = x < bx ? Math.exp(-((x - (2 * bx - c)) ** 2) / 500) * 0.55 * (c > bx ? 1 : 0) : 0;
        const inc = Math.exp(-((x - c) ** 2) / 500) * (x > bx ? 0.5 : c > bx ? 0 : 1);
        const a = inc + refl;
        if (a < 0.01) continue;
        g.fillStyle = `hsl(${(x * 9 - t * 300) % 360},95%,60%)`; g.fillRect(x, base - a * (h - 40), 2, a * (h - 40));
      }
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(0, base); g.lineTo(w, base); g.stroke();
    },
    blackhole(g, w, h, t) {
      const cx = w * 0.55, cy = h / 2, R = 17;
      for (let k = -5; k <= 5; k++) {
        const b = k * 9 + 4; g.strokeStyle = 'rgba(253,224,71,.55)'; g.lineWidth = 1.2; g.beginPath();
        const end = Math.abs(b) < 26 ? cx - 4 : w;
        for (let x = 0; x <= end; x += 4) { const dx = x - cx, d = Math.hypot(dx, b) + 6; const y = cy + b - Math.sign(b) * (900 / d) * (dx > 0 ? 1 + dx / 90 : Math.exp(dx / 70)) * 0.45; x ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
      }
      const gr = g.createRadialGradient(cx, cy, R, cx, cy, R * 2.6); gr.addColorStop(0, 'rgba(255,170,60,.9)'); gr.addColorStop(1, 'rgba(255,120,30,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * 2.6, 0, TAU); g.fill();
      dot(g, cx, cy, R, '#000');
      const a = t * 2; dot(g, cx + Math.cos(a) * R * 2.1, cy + Math.sin(a) * R * 0.7, 2.5, '#fff');
    },
    matter(g, w, h, t) {
      const a = 13, melt = 0.5 + 0.5 * Math.sin(t * 0.8);
      for (let j = 0; j < 7; j++) for (let i = 0; i < 12; i++) {
        const k = i + j * 12, amp = 0.6 + melt * (2 + (i / 12) * 12);
        const x = w / 2 + (i - 5.5 + (j % 2) * 0.5) * a + Math.sin(t * (3 + hash(k) * 4) + k) * amp, y = h / 2 + (j - 3) * a * 0.87 + Math.cos(t * (3 + hash(k + 1) * 4) + k) * amp;
        dot(g, x, y, 5, `hsl(${190 - melt * (i / 12) * 170},85%,58%)`);
      }
    },
    ising(g, w, h, t) {
      const s = 9, fr = Math.floor(t * 3);
      for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
        const big = Math.sin(x * 0.035 + Math.sin(y * 0.05 + t * 0.3) * 2) + Math.cos(y * 0.06 - t * 0.2) > 0;
        const flip = hash(x * 13 + y * 7 + fr) > 0.9;
        g.fillStyle = big !== flip ? '#f5b041' : '#152a66'; g.fillRect(x, y, s - 1, s - 1);
      }
    },
    string(g, w, h, t) {
      const cy = h / 2;
      [[1, 26, '#e879f9', 2.2], [3, 12, '#67e8f9', 1.3], [5, 7, '#fde68a', 1.1]].forEach(([n, A, c, lw], i) => {
        g.strokeStyle = c; g.lineWidth = lw; g.beginPath();
        for (let x = 0; x <= w - 30; x += 3) { const y = cy + A * Math.sin((n * Math.PI * x) / (w - 30)) * Math.cos(t * (3 + i * 2.5)); x ? g.lineTo(15 + x, y) : g.moveTo(15, y); }
        g.stroke();
      });
      dot(g, 15, cy, 4, '#cbd5e1'); dot(g, w - 15, cy, 4, '#cbd5e1');
    },
  };
})();

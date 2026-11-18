/* Genetik verstehen – interactive animations (SVG + canvas, no libraries). */
(function () {
  'use strict';
  var cleanups = [];
  var REG = {};
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function baseCol(b) { return css('--' + b); }
  var PAIR = { A: 'T', T: 'A', G: 'C', C: 'G' };
  var RPAIR = { A: 'U', U: 'A', G: 'C', C: 'G' };
  function rndSeq(n, abc) { var s = ''; for (var i = 0; i < n; i++) s += abc[Math.floor(Math.random() * abc.length)]; return s; }

  function canvas(el, W, H) {
    var c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2;
    c.setAttribute('role', 'img');
    el.appendChild(c);
    var x = c.getContext('2d'); x.setTransform(2, 0, 0, 2, 0, 0);
    x.font = '600 13px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    return { c: c, x: x, W: W, H: H };
  }
  // rAF loop that only runs while visible and not paused
  function looper(el, fn) {
    var id = 0, last = 0, vis = true, on = true, dead = false;
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (e) { vis = e[0].isIntersecting; if (vis) kick(); }) : null;
    if (io) io.observe(el);
    function frame(ts) {
      id = 0; if (dead) return;
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
      fn(on ? dt : 0);
      if (on && vis) id = requestAnimationFrame(frame); else last = 0;
    }
    function kick() { if (!id && !dead) id = requestAnimationFrame(frame); }
    kick();
    cleanups.push(function () { dead = true; if (id) cancelAnimationFrame(id); if (io) io.disconnect(); });
    return { play: function () { on = true; kick(); }, pause: function () { on = false; kick(); }, get on() { return on; }, redraw: kick };
  }
  function ctrlBar(el, items) {
    var d = document.createElement('div'); d.className = 'ctrl'; el.appendChild(d);
    items.forEach(function (it) {
      if (it.range) {
        var r = document.createElement('input'); r.type = 'range'; r.min = 0; r.max = 1000; r.value = it.value || 0; r.setAttribute('aria-label', it.label || '');
        r.oninput = function () { it.range(r.value / 1000); }; d.appendChild(r); it.el = r;
      } else {
        var b = document.createElement('button'); b.className = 'btn small soft'; b.textContent = it.t; b.onclick = function () { it.fn(b); }; d.appendChild(b); it.el = b;
      }
    });
    return d;
  }
  function cap(el) { var d = document.createElement('div'); d.className = 'cap'; d.setAttribute('aria-live', 'polite'); el.appendChild(d); return d; }
  function playBtn(lb, lp) {
    return { t: '⏸ ' + lb.pause, fn: function (b) { if (lp.on) { lp.pause(); b.textContent = '▶ ' + lb.play; } else { lp.play(); b.textContent = '⏸ ' + lb.pause; } } };
  }

  /* ===== 1. Cell with nucleus (clickable) ===== */
  REG.cell = function (el, lb) {
    var chrom = '', seed = 7;
    function r() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var k = 0; k < 7; k++) {
      var x = 300 + (r() - 0.5) * 110, y = 200 + (r() - 0.5) * 110, d = 'M' + x.toFixed(1) + ' ' + y.toFixed(1);
      for (var j = 0; j < 7; j++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; var dx = x - 300, dy = y - 200, m = Math.hypot(dx, dy); if (m > 85) { x = 300 + dx / m * 85; y = 200 + dy / m * 85; } d += ' Q' + (x + (r() - 0.5) * 30).toFixed(1) + ' ' + (y + (r() - 0.5) * 30).toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1); }
      chrom += '<path d="' + d + '" stroke="#8e5bd8" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    }
    var pores = '';
    for (var p = 0; p < 10; p++) { var a = p / 10 * Math.PI * 2 + 0.2; pores += '<rect x="-5" y="-10" width="10" height="20" rx="4" fill="#ffd66b" stroke="#a07800" transform="translate(' + (300 + Math.cos(a) * 113).toFixed(1) + ' ' + (200 + Math.sin(a) * 113).toFixed(1) + ') rotate(' + (a * 180 / Math.PI + 90).toFixed(1) + ')"/>'; }
    var ribo = '';
    for (var q = 0; q < 26; q++) { var ang = r() * 6.28, rad = 140 + r() * 90; var rx = 300 + Math.cos(ang) * rad * 1.45, ry = 200 + Math.sin(ang) * rad * 0.7; if (Math.abs(rx - 300) < 270) ribo += '<circle cx="' + rx.toFixed(1) + '" cy="' + ry.toFixed(1) + '" r="4" fill="#4b4b8f"/>'; }
    var fg = css('--fg');
    var parts = [
      ['cellmem', '<ellipse cx="300" cy="200" rx="285" ry="180" fill="none" stroke="#2bb3a6" stroke-width="7"/>', [40, 30, 90, 70]],
      ['cyto', '<ellipse cx="300" cy="200" rx="281" ry="176" fill="#2bb3a6" fill-opacity=".10"/>', [0, 0, 0, 0]],
      ['ribo', '<g>' + ribo + '</g>', [0, 0, 0, 0]],
      ['nuc', '<circle cx="300" cy="200" r="113" fill="#9b7bff" fill-opacity=".18" stroke="#6a3fd1" stroke-width="9"/><circle cx="300" cy="200" r="113" fill="none" stroke="#efe9ff" stroke-width="2.4"/>', [0, 0, 0, 0]],
      ['chromatin', '<g>' + chrom + '</g><rect x="210" y="110" width="180" height="180" fill="transparent"/>', [0, 0, 0, 0]],
      ['nucleolus', '<circle cx="335" cy="180" r="27" fill="#3b1f7a"/>', [0, 0, 0, 0]],
      ['pore', '<g>' + pores + '</g>', [0, 0, 0, 0]]
    ];
    var labels = [
      ['cellmem', 30, 28, 70, 70], ['cyto', 560, 40, 500, 110], ['ribo', 40, 380, 120, 300], ['nuc', 560, 380, 395, 260],
      ['pore', 575, 210, 413, 206], ['nucleolus', 575, 150, 360, 175], ['chromatin', 30, 205, 230, 200]
    ];
    var svg = '<svg class="v" viewBox="0 0 600 400" aria-label="' + esc(lb.c_nuc) + '">' +
      parts.map(function (pt) { return '<g class="hot" data-k="' + pt[0] + '" tabindex="0" role="button" aria-label="' + esc(lb['c_' + pt[0]]) + '">' + pt[1] + '</g>'; }).join('') +
      labels.map(function (l) {
        var anchor = l[1] > 300 ? 'end' : 'start';
        return '<g class="hot" data-k="' + l[0] + '"><line x1="' + l[1] + '" y1="' + (l[2] + 8) + '" x2="' + l[3] + '" y2="' + l[4] + '" stroke="' + fg + '" stroke-opacity=".5"/><text x="' + l[1] + '" y="' + l[2] + '" text-anchor="' + anchor + '" style="font:700 17px system-ui;fill:' + fg + ';paint-order:stroke;stroke:' + css('--bg') + ';stroke-width:4px">' + esc(lb['c_' + l[0]]) + '</text></g>';
      }).join('') + '</svg>';
    el.innerHTML = svg;
    var info = document.createElement('div'); info.className = 'info'; info.innerHTML = '👆 ' + esc(lb.tapPart); el.appendChild(info);
    el.querySelectorAll('.hot').forEach(function (g) {
      function pick() {
        var k = g.getAttribute('data-k');
        el.querySelectorAll('.hot').forEach(function (h) { h.classList.toggle('sel', h.getAttribute('data-k') === k); });
        info.innerHTML = '<b>' + esc(lb['c_' + k]) + ':</b> ' + esc(lb['cd_' + k]);
      }
      g.onclick = pick; g.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } };
    });
  };

  /* ===== 2. Chromatin -> chromosome condensation ===== */
  REG.condense = function (el, lb) {
    var cv = canvas(el, 600, 300), x = cv.x, N = 260, pts = [], p = 0;
    for (var s = 0; s < 2; s++) {
      var px = 300 + (s ? 120 : -120), py = 150, arr = [], dir = Math.random() * 6.28;
      for (var i = 0; i < N; i++) {
        dir += (Math.random() - 0.5) * 0.9;
        var nx = px + Math.cos(dir) * 7, ny = py + Math.sin(dir) * 7;
        if (nx < 50 + s * 260 || nx > 290 + s * 260 || ny < 25 || ny > 265) { dir += Math.PI * 0.7; nx = px; ny = py; }
        px = nx; py = ny;
        var t = i / (N - 1), ty = 40 + t * 220, dist = Math.abs(ty - 150) / 110;
        var cx = 300 + (s ? 1 : -1) * (9 + dist * 26);
        var tx = cx + Math.sin(i * 1.15) * 10, tyy = ty + Math.cos(i * 1.15) * 2;
        arr.push([px, py, tx, tyy]);
      }
      pts.push(arr);
    }
    var c = cap(el);
    function draw() {
      x.clearRect(0, 0, 600, 300);
      var e = ease(p);
      // rod outline
      if (e > 0.6) {
        x.globalAlpha = (e - 0.6) / 0.4;
        [-1, 1].forEach(function (sd) {
          x.fillStyle = sd < 0 ? 'rgba(240,138,93,.35)' : 'rgba(240,138,93,.35)';
          x.beginPath();
          for (var k = 0; k <= 40; k++) { var ty = 30 + k / 40 * 240, d = Math.abs(ty - 150) / 110, cx = 300 + sd * (9 + d * 26); if (k === 0) x.moveTo(cx - 13, ty); else x.lineTo(cx - 13, ty); }
          for (k = 40; k >= 0; k--) { ty = 30 + k / 40 * 240; d = Math.abs(ty - 150) / 110; cx = 300 + sd * (9 + d * 26); x.lineTo(cx + 13, ty); }
          x.closePath(); x.fill();
        });
        x.fillStyle = css('--fg'); x.beginPath(); x.arc(300, 150, 7, 0, 7); x.fill();
        x.globalAlpha = 1;
      }
      pts.forEach(function (arr, s) {
        x.strokeStyle = s ? '#d96a3a' : '#8e5bd8'; x.lineWidth = 2.2 + e * 1.2; x.lineJoin = 'round'; x.beginPath();
        arr.forEach(function (q, i) { var X = lerp(q[0], q[2], e), Y = lerp(q[1], q[3], e); if (i) x.lineTo(X, Y); else x.moveTo(X, Y); });
        x.stroke();
      });
      x.fillStyle = css('--fg'); x.font = '700 15px system-ui';
      x.fillText(e < 0.35 ? lb.workForm : e > 0.75 ? lb.transportForm : '…' + lb.condensing + '…', 300, 290);
      c.innerHTML = e < 0.35 ? lb.condCap0 : e > 0.75 ? lb.condCap2 : lb.condCap1;
    }
    var dir = 1, auto = !reduce, items = [];
    var lp = looper(el, function (dt) { if (auto) { p += dir * dt * 0.28; if (p > 1.25) { dir = -1; } if (p < -0.25) dir = 1; items[1].el.value = clamp(p, 0, 1) * 1000; } var keep = p; p = clamp(p, 0, 1); draw(); p = keep; });
    items = [
      { t: '⏸ ' + lb.pause, fn: function (b) { auto = !auto; b.textContent = auto ? '⏸ ' + lb.pause : '▶ ' + lb.play; lp.redraw(); } },
      { range: function (v) { auto = false; items[0].el.textContent = '▶ ' + lb.play; p = v; lp.redraw(); }, label: lb.condensing }
    ];
    ctrlBar(el, items);
    if (!auto) { items[0].el.textContent = '▶ ' + lb.play; }
  };

  /* ===== 3. Chromosome anatomy ===== */
  REG.chromosome = function (el, lb) {
    var two = true;
    function arm(cx, cy, len, ang, col, k) {
      return '<g class="hot" data-k="' + k + '" transform="translate(' + cx + ' ' + cy + ') rotate(' + ang + ')"><rect x="-17" y="' + (len < 0 ? len : 0) + '" width="34" height="' + Math.abs(len) + '" rx="17" fill="' + col + '"/>' +
        [0.3, 0.55, 0.8].map(function (f) { return '<rect x="-17" y="' + (len * f - 3) + '" width="34" height="6" fill="#000" fill-opacity=".18"/>'; }).join('') + '</g>';
    }
    function chromatid(cx, side, k) {
      var s = side * 14;
      return arm(cx, 170, -95, s, '#f08a5d', k) + arm(cx, 170, 140, -s, '#f08a5d', k);
    }
    function draw() {
      var fg = css('--fg'), st = 'font:700 17px system-ui;fill:' + fg;
      var body = two ? chromatid(281, -1, 'chromatid') + chromatid(319, 1, 'chromatid2') : chromatid(300, 0, 'chromatid');
      var svg = '<svg class="v" viewBox="0 0 690 340">' + body +
        '<g class="hot" data-k="centromere"><circle cx="300" cy="170" r="' + (two ? 15 : 12) + '" fill="#3b1f7a"/></g>' +
        // labels
        '<g class="hot" data-k="short"><path d="M380 75 h20 M390 75 V160" stroke="' + fg + '" fill="none"/><text x="410" y="80" style="' + st + '">' + esc(lb.shortArm) + '</text></g>' +
        '<g class="hot" data-k="long"><path d="M380 180 h20 M390 180 V315" stroke="' + fg + '" fill="none"/><text x="410" y="250" style="' + st + '">' + esc(lb.longArm) + '</text></g>' +
        '<g class="hot" data-k="centromere"><line x1="200" y1="170" x2="285" y2="170" stroke="' + fg + '"/><text x="195" y="175" text-anchor="end" style="' + st + '">' + esc(lb.centromere) + '</text></g>' +
        '<g class="hot" data-k="chromatid"><line x1="200" y1="270" x2="250" y2="262" stroke="' + fg + '"/><text x="195" y="275" text-anchor="end" style="' + st + '">' + esc(lb.chromatid) + (two ? ' 1' : '') + '</text></g>' +
        (two ? '<g class="hot" data-k="chromatid2"><line x1="200" y1="40" x2="315" y2="80" stroke="' + fg + '"/><text x="195" y="45" text-anchor="end" style="' + st + '">' + esc(lb.chromatid) + ' 2</text></g>' : '') +
        '</svg>';
      el.querySelector('.box').innerHTML = svg;
      el.querySelectorAll('.hot').forEach(function (g) {
        g.onclick = function () { var k = g.getAttribute('data-k'); if (k === 'chromatid2') k = 'chromatid'; info.innerHTML = '<b>' + esc({ chromatid: lb.chromatid, centromere: lb.centromere, short: lb.shortArm, long: lb.longArm }[k]) + ':</b> ' + esc(lb['chd_' + k]); };
      });
      info.innerHTML = '<b>' + esc(two ? lb.twoChromatid : lb.oneChromatid) + ':</b> ' + esc(two ? lb.twoChromatidD : lb.oneChromatidD);
    }
    el.innerHTML = '<div class="box"></div>';
    var info = document.createElement('div'); info.className = 'info'; el.appendChild(info);
    var items = [
      { t: lb.oneChromatid, fn: function () { two = false; draw(); } },
      { t: lb.twoChromatid, fn: function () { two = true; draw(); } }
    ];
    ctrlBar(el, items);
    draw();
  };

  /* ===== 4. Karyogram ===== */
  REG.karyo = function (el, lb) {
    var L = [248, 242, 198, 190, 181, 171, 159, 145, 138, 134, 135, 133, 114, 107, 102, 90, 83, 80, 59, 64, 47, 51];
    var CEN = [.5, .39, .47, .27, .27, .36, .38, .31, .35, .3, .4, .27, .14, .15, .17, .41, .33, .23, .46, .45, .27, .29];
    var male = false, hap = false, sel = -1;
    var rows = [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9, 10, 11], [12, 13, 14, 15, 16, 17], [18, 19, 20, 21, 22]];
    function chromo(x, y, len, cen, col) {
      var h = len * 0.42, c = y + h * cen, w = 7;
      var b = '';
      for (var i = 1; i < 6; i++) b += '<rect x="' + (x - w) + '" y="' + (y + h * i / 6.5).toFixed(1) + '" width="' + (2 * w) + '" height="2.5" fill="#000" fill-opacity=".2"/>';
      return '<rect x="' + (x - w) + '" y="' + y + '" width="' + (2 * w) + '" height="' + (c - y - 2).toFixed(1) + '" rx="6" fill="' + col + '"/>' +
        '<rect x="' + (x - w) + '" y="' + (c + 2).toFixed(1) + '" width="' + (2 * w) + '" height="' + (y + h - c - 2).toFixed(1) + '" rx="6" fill="' + col + '"/>' + b;
    }
    function draw() {
      var mat = css('--mat'), pat = css('--pat'), fg = css('--fg'), out = '', yb = [10, 135, 240, 320], count = 0;
      rows.forEach(function (row, ri) {
        var slot = 700 / (ri === 3 ? 6 : row.length);
        row.forEach(function (n, ci) {
          var cx = slot * ci + slot / 2, y = yb[ri], k = n;
          var isSex = n === 22, len, cen, cols;
          if (isSex) {
            cx = slot * 4 + slot;
            cols = male ? [[156, .39, mat], [57, .3, pat]] : [[156, .39, mat], [156, .39, pat]];
            if (hap) cols = [male && Math.random() < 0.5 ? [57, .3, pat] : [156, .39, mat]];
          } else {
            cols = hap ? [[L[n], CEN[n], mat]] : [[L[n], CEN[n], mat], [L[n], CEN[n], pat]];
          }
          var g = '<g class="hot' + (sel === k ? ' sel' : '') + '" data-k="' + k + '" tabindex="0" role="button">';
          g += '<rect x="' + (cx - 30) + '" y="' + (y - 4) + '" width="60" height="' + (isSex ? 82 : L[n] * 0.42 + 26) + '" fill="transparent"/>';
          cols.forEach(function (cc, i) { g += chromo(cx + (cols.length === 2 ? (i ? 10 : -10) : 0), y, cc[0], cc[1], cc[2]); count++; });
          g += '<text x="' + cx + '" y="' + (y + (isSex ? 82 : L[n] * 0.42 + 16)) + '" text-anchor="middle" style="font:700 15px system-ui;fill:' + fg + '">' + (isSex ? (hap ? (cols[0][0] === 57 ? 'Y' : 'X') : (male ? 'XY' : 'XX')) : (n + 1)) + '</text></g>';
          out += g;
        });
      });
      box.innerHTML = '<svg class="v" viewBox="0 0 700 420">' + out + '<line x1="' + (700 / 6 * 4 + 6) + '" y1="315" x2="' + (700 / 6 * 4 + 6) + '" y2="410" stroke="' + fg + '" stroke-dasharray="4 4" stroke-opacity=".4"/></svg>';
      head.innerHTML = '<b>' + (hap ? lb.haploid + ' (n = 23)' : lb.diploid + ' (2n = 46)') + '</b> · ' + (male ? '♂ ' + lb.male : '♀ ' + lb.female) + ' · ' + count + ' ' + lb.chromosomes;
      box.querySelectorAll('.hot').forEach(function (g) {
        g.onclick = function () {
          sel = +g.getAttribute('data-k'); draw();
          info.innerHTML = sel === 22 ? '<b>' + esc(lb.gonosomes) + ':</b> ' + esc(lb.gonoD) : '<b>' + esc(lb.pair) + ' ' + (sel + 1) + ' – ' + esc(lb.autosomes) + ':</b> ' + esc(hap ? lb.hapPairD : lb.homologD);
        };
      });
    }
    var head = document.createElement('div'); head.className = 'cap'; el.appendChild(head);
    var box = document.createElement('div'); el.appendChild(box);
    var lg = document.createElement('div'); lg.className = 'legend'; lg.innerHTML = '<span><i style="background:var(--mat)"></i>' + esc(lb.fromMother) + '</span><span><i style="background:var(--pat)"></i>' + esc(lb.fromFather) + '</span>'; el.appendChild(lg);
    var info = document.createElement('div'); info.className = 'info'; info.textContent = '👆 ' + lb.tapPair; el.appendChild(info);
    ctrlBar(el, [
      { t: '♀ XX', fn: function () { male = false; draw(); } }, { t: '♂ XY', fn: function () { male = true; draw(); } },
      { t: lb.diploid + ' 2n', fn: function () { hap = false; draw(); } }, { t: lb.haploid + ' n', fn: function () { hap = true; draw(); } }
    ]);
    draw();
  };

  /* ===== 5. DNA double helix / ladder ===== */
  REG.helix = function (el, lb) {
    var mini = el.getAttribute('data-mini');
    var N = 16, seq = rndSeq(N, 'ATGC'), t = 0, tw = mini ? 1 : 1, W = 600, H = 280;
    var cv = canvas(el, W, H), x = cv.x;
    cv.c.setAttribute('aria-label', lb.doubleHelix);
    function draw() {
      x.clearRect(0, 0, W, H);
      var fg = css('--fg'), acc = css('--accent');
      var P = [];
      for (var i = 0; i < N; i++) {
        var ph = tw * (i * 0.6 + t), X = 30 + i * (W - 60) / (N - 1);
        P.push({ X: X, y1: 140 - 95 * Math.cos(ph), y2: 140 + 95 * Math.cos(ph), z: Math.sin(ph) });
      }
      function strand(which, front) {
        x.lineWidth = 7; x.lineCap = 'round';
        for (var i = 0; i < N - 1; i++) {
          var a = P[i], b = P[i + 1], z = which ? -(a.z + b.z) / 2 : (a.z + b.z) / 2;
          if ((z >= -0.05) !== front) continue;
          x.strokeStyle = which ? '#3b6fd8' : acc; x.globalAlpha = front ? 1 : 0.35;
          x.beginPath(); x.moveTo(a.X, which ? a.y2 : a.y1); x.lineTo(b.X, which ? b.y2 : b.y1); x.stroke();
        }
        x.globalAlpha = 1;
      }
      strand(0, false); strand(1, false);
      P.forEach(function (p, i) {
        var b1 = seq[i], b2 = PAIR[b1], mid = (p.y1 + p.y2) / 2, al = 0.45 + 0.55 * (1 - Math.abs(p.z));
        x.globalAlpha = al; x.lineWidth = 9; x.lineCap = 'butt';
        x.strokeStyle = baseCol(b1); x.beginPath(); x.moveTo(p.X, p.y1); x.lineTo(p.X, mid - 2); x.stroke();
        x.strokeStyle = baseCol(b2); x.beginPath(); x.moveTo(p.X, mid + 2); x.lineTo(p.X, p.y2); x.stroke();
        if (Math.abs(p.y2 - p.y1) > 80 && !mini) {
          x.fillStyle = fg; x.font = '800 13px system-ui';
          var up = p.y1 < p.y2;
          x.fillText(b1, p.X + 13, lerp(p.y1, mid, 0.5)); x.fillText(b2, p.X + 13, lerp(mid, p.y2, 0.5));
          if (tw < 0.25) { x.strokeStyle = fg; x.lineWidth = 1; x.setLineDash([2, 3]); x.beginPath(); x.moveTo(p.X - 8, mid); x.lineTo(p.X + 8, mid); x.stroke(); x.setLineDash([]); }
        }
        x.globalAlpha = 1;
      });
      strand(0, true); strand(1, true);
      if (!mini && tw < 0.25) {
        // nucleotide parts on ladder
        P.forEach(function (p) {
          [p.y1, p.y2].forEach(function (yy, k) {
            x.fillStyle = '#f5c242'; x.beginPath(); x.arc(p.X - 10, yy + (k ? 8 : -8), 6, 0, 7); x.fill();
            x.fillStyle = '#c8b3ff'; x.beginPath(); for (var a = 0; a < 5; a++) { var an = a / 5 * 6.283 - 1.57; x.lineTo(p.X + Math.cos(an) * 7, yy + Math.sin(an) * 7); } x.closePath(); x.fill();
          });
        });
        x.fillStyle = fg; x.font = '700 13px system-ui'; x.textAlign = 'start';
        x.fillText('● ' + lb.phosphate + '  ⬟ ' + lb.sugar + '  ┄ ' + lb.hbond, 20, H - 10); x.textAlign = 'center';
      }
    }
    var lp = looper(el, function (dt) { if (!reduce) t += dt * 0.9 * (tw > 0.05 ? 1 : 0); draw(); });
    if (!mini) {
      var lg = document.createElement('div'); lg.className = 'legend';
      lg.innerHTML = ['A', 'T', 'G', 'C'].map(function (b) { return '<span><i style="background:var(--' + b + ')"></i>' + b + ' = ' + esc(lb['base' + b]) + '</span>'; }).join('');
      el.appendChild(lg);
      var items = [playBtn(lb, lp), { range: function (v) { tw = v; lp.redraw(); }, value: 1000, label: lb.twist }];
      var c = cap(el); c.textContent = lb.twistHint;
      ctrlBar(el, items);
      items[1].el.value = 1000;
    }
  };

  /* ===== 6. Nucleotide (static, labelled) ===== */
  REG.nucleotide = function (el, lb) {
    var fg = css('--fg'), st = 'font:700 16px system-ui;fill:' + fg;
    el.innerHTML = '<svg class="v" viewBox="0 0 600 220"><line x1="120" y1="110" x2="250" y2="110" stroke="' + fg + '" stroke-width="4"/><line x1="320" y1="110" x2="420" y2="110" stroke="' + fg + '" stroke-width="4"/>' +
      '<circle cx="110" cy="110" r="42" fill="#f5c242"/><text x="110" y="116" text-anchor="middle" style="font:800 26px system-ui;fill:#3a2e00">P</text>' +
      '<polygon points="285,62 330,95 313,148 257,148 240,95" fill="#c8b3ff"/><text x="285" y="112" text-anchor="middle" style="font:800 15px system-ui;fill:#2b1760">' + esc(lb.sugarShort) + '</text>' +
      '<rect x="420" y="80" width="130" height="60" rx="10" fill="var(--A)"/><text x="485" y="117" text-anchor="middle" style="font:800 22px system-ui;fill:#fff">A/T/G/C</text>' +
      '<text x="110" y="185" text-anchor="middle" style="' + st + '">' + esc(lb.phosphate) + '</text><text x="285" y="185" text-anchor="middle" style="' + st + '">' + esc(lb.sugar) + '</text><text x="485" y="185" text-anchor="middle" style="' + st + '">' + esc(lb.base) + '</text>' +
      '<path d="M60 30 H560" stroke="' + css('--accent') + '" stroke-width="3" stroke-dasharray="6 5"/><text x="300" y="22" text-anchor="middle" style="font:800 16px system-ui;fill:' + css('--accent') + '">' + esc(lb.nucleotide) + ' = ' + esc(lb.phosphate) + ' + ' + esc(lb.sugar) + ' + ' + esc(lb.base) + '</text></svg>';
  };

  /* ===== 7. Base pairing game ===== */
  REG.pairing = function (el, lb) {
    var seq, pos, score = 0;
    function newGame() { seq = rndSeq(8, 'ATGC'); pos = 0; draw(); }
    function draw(bad) {
      var top = seq.split('').map(function (b) { return '<span class="base b-' + b + '">' + b + '</span>'; }).join('');
      var bot = seq.split('').map(function (b, i) { var v = i < pos ? PAIR[b] : '_'; return '<span class="base b-' + v + '"' + (i === pos && bad ? ' style="outline:3px solid var(--bad)"' : i === pos ? ' style="outline:3px dashed var(--accent)"' : '') + '>' + (v === '_' ? '?' : v) + '</span>'; }).join('');
      box.innerHTML = '<div class="muted" style="text-align:center;font-size:.85rem">' + esc(lb.strand1) + '</div><div class="strand">' + top + '</div><div class="strand" style="color:var(--muted);font-size:.8rem">' + seq.split('').map(function () { return '<span style="width:38px;text-align:center">┆</span>'; }).join('') + '</div><div class="strand">' + bot + '</div><div class="muted" style="text-align:center;font-size:.85rem">' + esc(lb.strand2) + '</div>';
      c.innerHTML = pos >= seq.length ? '🎉 ' + esc(lb.pairDone) : bad ? '✗ ' + esc(lb.pairWrong) : esc(lb.pairHint);
    }
    var box = document.createElement('div'); el.appendChild(box);
    var c = cap(el);
    var keys = document.createElement('div'); keys.className = 'basekeys';
    keys.innerHTML = 'ATGC'.split('').map(function (b) { return '<button class="b-' + b + '" data-b="' + b + '" aria-label="' + b + '">' + b + '</button>'; }).join('');
    el.appendChild(keys);
    keys.querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        if (pos >= seq.length) return;
        if (b.getAttribute('data-b') === PAIR[seq[pos]]) { pos++; draw(); } else draw(true);
      };
    });
    ctrlBar(el, [{ t: '↻ ' + lb.newStrandBtn, fn: newGame }]);
    newGame();
  };

  /* ===== 8. Replication ===== */
  REG.replication = function (el, lb) {
    var N = 13, seq = rndSeq(N, 'ATGC'), p = 0, W = 640, H = 330, dx = 46, x0 = 40;
    var cv = canvas(el, W, H), x = cv.x, c = cap(el);
    var floats = [];
    for (var f = 0; f < 10; f++) floats.push({ x: Math.random() * W, y: Math.random() * H, b: 'ATGC'[f % 4], v: Math.random() * 6.28 });
    function base(X, y0, y1, b, alpha) {
      x.globalAlpha = alpha; x.strokeStyle = baseCol(b); x.lineWidth = 12; x.lineCap = 'butt';
      x.beginPath(); x.moveTo(X, y0); x.lineTo(X, y1); x.stroke();
      x.fillStyle = b === 'T' ? '#3a2e00' : '#fff'; x.font = '800 11px system-ui'; x.fillText(b, X, (y0 + y1) / 2); x.globalAlpha = 1;
    }
    function draw(dt) {
      x.clearRect(0, 0, W, H);
      var fg = css('--fg'), acc = css('--accent');
      var fx = x0 - 30 + p * (N * dx + 60), half = 26;
      // free nucleotides
      floats.forEach(function (o) { o.v += dt; o.x += Math.cos(o.v) * 0.3; o.y += Math.sin(o.v * 0.7) * 0.3; x.globalAlpha = 0.35; x.fillStyle = baseCol(o.b); x.fillRect(o.x, o.y, 8, 16); x.globalAlpha = 1; });
      var T = [], Bm = [];
      for (var i = 0; i < N; i++) {
        var X = x0 + i * dx, s = ease((fx - X) / 70);
        var yT = 140 - 56 * s, yB = 190 + 56 * s;
        var nw = ease((fx - 80 - X) / 40);
        T.push([X, yT]); Bm.push([X, yB]);
        base(X, yT, yT + half, seq[i], 1);
        base(X, yB - half, yB, PAIR[seq[i]], 1);
        if (nw > 0) {
          base(X, yT + half + 2, yT + 2 * half + 2, PAIR[seq[i]], nw);
          base(X, yB - 2 * half - 2, yB - half - 2, seq[i], nw);
          x.globalAlpha = nw; x.fillStyle = acc;
          x.fillRect(X - dx / 2, yT + 2 * half + 2, dx, 6); x.fillRect(X - dx / 2, yB - 2 * half - 8, dx, 6); x.globalAlpha = 1;
        }
      }
      [T, Bm].forEach(function (arr, k) {
        x.strokeStyle = fg; x.lineWidth = 6; x.lineJoin = 'round'; x.beginPath();
        arr.forEach(function (q, i) { var yy = k ? q[1] : q[1]; if (i) x.lineTo(q[0], yy); else x.moveTo(q[0] - dx / 2, yy); });
        x.lineTo(arr[N - 1][0] + dx / 2, arr[N - 1][1]); x.stroke();
      });
      // enzymes
      if (p > 0.02 && p < 1.02) {
        x.fillStyle = '#9b51e0'; x.globalAlpha = 0.9; x.beginPath(); x.ellipse(fx + 6, 165, 20, 34, 0, 0, 7); x.fill();
        x.globalAlpha = 1; x.fillStyle = fg; x.font = '700 13px system-ui'; x.fillText(lb.helicase, fx + 6, 215 + 8);
        var px = fx - 85;
        if (px > x0 - 20) {
          x.fillStyle = '#27ae60'; x.globalAlpha = 0.85;
          x.beginPath(); x.arc(px, 84 + 58, 17, 0, 7); x.fill(); x.beginPath(); x.arc(px, 246 - 58, 17, 0, 7); x.fill(); x.globalAlpha = 1;
          x.fillStyle = fg; x.fillText(lb.polymerase, px, 30);
          x.strokeStyle = fg; x.lineWidth = 1; x.beginPath(); x.moveTo(px, 38); x.lineTo(px, 122); x.stroke();
        }
      }
      // legend
      x.font = '600 12px system-ui'; x.textAlign = 'start';
      x.fillStyle = fg; x.fillRect(20, H - 22, 22, 5); x.fillText(lb.oldStrand, 48, H - 19);
      x.fillStyle = acc; x.fillRect(200, H - 22, 22, 5); x.fillStyle = fg; x.fillText(lb.newStrand, 228, H - 19);
      x.textAlign = 'center';
      var st = p < 0.04 ? 0 : p < 0.35 ? 1 : p < 1.02 ? 2 : 3;
      c.innerHTML = '<span class="pill">' + (st + 1) + '/4</span> ' + esc(lb.repCap[st]);
    }
    var items;
    var lp = looper(el, function (dt) { if (!reduce) { p += dt * 0.085; if (p > 1.35) { p = 0; seq = rndSeq(N, 'ATGC'); } if (items) items[1].el.value = clamp(p / 1.2, 0, 1) * 1000; } draw(dt); });
    items = [playBtn(lb, lp), { range: function (v) { p = v * 1.2; lp.pause(); items[0].el.textContent = '▶ ' + lb.play; lp.redraw(); }, label: lb.progress },
      { t: '↺', fn: function () { p = 0; seq = rndSeq(N, 'ATGC'); lp.redraw(); } }];
    ctrlBar(el, items);
    if (reduce) { p = 0.6; lp.pause(); items[0].el.textContent = '▶ ' + lb.play; }
  };

  /* ===== 9. Cell cycle ring ===== */
  REG.cycle = function (el, lb) {
    var seg = [['G1', 0.40, '#6fcf97'], ['S', 0.28, '#2f80ed'], ['G2', 0.18, '#f2c94c'], ['M', 0.14, '#eb5757']];
    var a0 = -Math.PI / 2, out = '', fg = css('--fg');
    seg.forEach(function (s) {
      var a1 = a0 + s[1] * Math.PI * 2, R = 150, r = 88, lg = s[1] > 0.5 ? 1 : 0;
      var p = function (rr, a) { return (200 + rr * Math.cos(a)).toFixed(1) + ' ' + (180 + rr * Math.sin(a)).toFixed(1); };
      var mid = (a0 + a1) / 2;
      out += '<g class="hot" data-k="' + s[0] + '" tabindex="0" role="button"><path d="M' + p(R, a0) + ' A' + R + ' ' + R + ' 0 ' + lg + ' 1 ' + p(R, a1) + ' L' + p(r, a1) + ' A' + r + ' ' + r + ' 0 ' + lg + ' 0 ' + p(r, a0) + 'Z" fill="' + s[2] + '" stroke="' + css('--bg') + '" stroke-width="4"/>' +
        '<text x="' + (200 + 119 * Math.cos(mid)).toFixed(1) + '" y="' + (186 + 119 * Math.sin(mid)).toFixed(1) + '" text-anchor="middle" style="font:800 20px system-ui;fill:#1d1b2e">' + s[0] + '</text></g>';
      a0 = a1;
    });
    var ia = -Math.PI / 2, ib = -Math.PI / 2 + 0.86 * Math.PI * 2;
    out += '<path d="M' + (200 + 165 * Math.cos(ia)).toFixed(1) + ' ' + (180 + 165 * Math.sin(ia)).toFixed(1) + ' A165 165 0 1 1 ' + (200 + 165 * Math.cos(ib)).toFixed(1) + ' ' + (180 + 165 * Math.sin(ib)).toFixed(1) + '" fill="none" stroke="' + fg + '" stroke-width="2" stroke-dasharray="5 5"/>';
    out += '<text x="200" y="175" text-anchor="middle" style="font:800 17px system-ui;fill:' + fg + '">' + esc(lb.cellCycle) + '</text><text x="200" y="198" text-anchor="middle" style="font:600 13px system-ui;fill:' + css('--muted') + '">' + esc(lb.interphase) + ' = G1+S+G2</text>';
    el.innerHTML = '<svg class="v" viewBox="0 0 400 360" style="max-width:420px;margin:auto">' + out + '</svg>';
    var info = document.createElement('div'); info.className = 'info'; info.textContent = '👆 ' + lb.tapPhase; el.appendChild(info);
    el.querySelectorAll('.hot').forEach(function (g) {
      g.onclick = function () { var k = g.getAttribute('data-k'); el.querySelectorAll('.hot').forEach(function (h) { h.classList.toggle('sel', h === g); }); info.innerHTML = '<b>' + esc(lb['cy_' + k]) + ':</b> ' + esc(lb['cyd_' + k]); };
    });
  };

  /* ===== 10. Mitosis ===== */
  REG.mitosis = function (el, lb) {
    var W = 640, H = 340, CX = 320, CY = 170;
    var cv = canvas(el, W, H), x = cv.x, c = cap(el);
    var CH = [{ len: 70, col: 'mat' }, { len: 70, col: 'pat' }, { len: 44, col: 'mat' }, { len: 44, col: 'pat' }];
    var proPos = [[-40, -35, 30], [38, -28, -40], [-30, 42, 80], [42, 40, -20]];
    var metaY = [-95, -22, 46, 98];
    function state(ph, j, k) {
      var sgn = k ? 1 : -1;
      if (ph <= 1) { var q = proPos[j], a = q[2] * Math.PI / 180; return [q[0] - Math.sin(a) * 5 * sgn, q[1] + Math.cos(a) * 5 * sgn, q[2]]; }
      if (ph === 2) return [5 * sgn, metaY[j], 90];
      if (ph === 3) return [125 * sgn, metaY[j] * 0.75, 90];
      return [168 * sgn, metaY[j] * 0.3, 90];
    }
    var A = {
      cond: [0, 1, 1, 1, 0.6, 0], nuc1: [1, 0.4, 0, 0, 0, 0], nuc2: [0, 0, 0, 0, 0.55, 1], spindle: [0, 0.45, 1, 1, 0.35, 0], split: [0, 0, 0, 0, 0.45, 1],
      cL: [[-12, -122], [-150, -112], [-232, 0], [-232, 0], [-222, 0], [-165, -95]], cR: [[12, -122], [150, -112], [232, 0], [232, 0], [222, 0], [165, -95]]
    };
    var ph = 0, from = 0, tt = 1, hold = 0, auto = !reduce, seed = 3;
    var squig = [];
    for (var s = 0; s < 6; s++) { var pts = [], a = s * 1.05, px = Math.cos(a) * 0.35, py = Math.sin(a) * 0.35, d = a; for (var i = 0; i < 40; i++) { d += Math.sin(i * 0.9 + s) * 0.8; px += Math.cos(d) * 0.07; py += Math.sin(d) * 0.07; var m = Math.hypot(px, py); if (m > 0.8) { px *= 0.8 / m; py *= 0.8 / m; d += 2; } pts.push([px, py]); } squig.push(pts); }
    function iv(arr) { var e = ease(tt); return lerp(arr[from], arr[ph], e); }
    function ivp(arr) { var e = ease(tt); return [lerp(arr[from][0], arr[ph][0], e), lerp(arr[from][1], arr[ph][1], e)]; }
    function chromatin(cx, cy, r, al) {
      if (al <= 0.01) return; x.globalAlpha = al; x.lineWidth = 2; x.strokeStyle = '#8e5bd8';
      squig.forEach(function (pts) { x.beginPath(); pts.forEach(function (p, i) { var X = cx + p[0] * r, Y = cy + p[1] * r; if (i) x.lineTo(X, Y); else x.moveTo(X, Y); }); x.stroke(); });
      x.globalAlpha = 1;
    }
    function rod(X, Y, ang, len, col, al) {
      x.save(); x.globalAlpha = al; x.translate(X, Y); x.rotate(ang * Math.PI / 180);
      x.fillStyle = css('--' + col); x.beginPath(); if (x.roundRect) x.roundRect(-len / 2, -5, len, 10, 5); else x.rect(-len / 2, -5, len, 10); x.fill();
      x.fillStyle = '#3b1f7a'; x.beginPath(); x.arc(0, 0, 3.5, 0, 7); x.fill(); x.restore();
    }
    function draw() {
      x.clearRect(0, 0, W, H);
      var fg = css('--fg'), w = iv(A.split);
      // cell(s)
      var cells = [[CX - 165 * w, CY, 255 - 115 * w, 145 - 15 * w], [CX + 165 * w, CY, 255 - 115 * w, 145 - 15 * w]];
      x.fillStyle = '#2bb3a6'; cells.forEach(function (e) { x.beginPath(); x.ellipse(e[0], e[1], e[2] + 3, e[3] + 3, 0, 0, 7); x.fill(); });
      x.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#1f3b3a' : '#e3f6f3';
      cells.forEach(function (e) { x.beginPath(); x.ellipse(e[0], e[1], e[2] - 2, e[3] - 2, 0, 0, 7); x.fill(); });
      // nuclei
      var n1 = iv(A.nuc1), n2 = iv(A.nuc2), cond = iv(A.cond);
      function nucleus(cx, cy, r, al, dash) {
        if (al <= 0.01) return; x.globalAlpha = al; x.fillStyle = 'rgba(155,123,255,.18)'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
        x.strokeStyle = '#6a3fd1'; x.lineWidth = 4; if (dash) x.setLineDash([10, 8]); x.stroke(); x.setLineDash([]);
        x.globalAlpha = 1;
      }
      nucleus(CX, CY, 100, n1, ph >= 1);
      nucleus(CX - 165, CY, 62, n2, ph === 4); nucleus(CX + 165, CY, 62, n2, ph === 4);
      if (n1 > 0.3 && ph <= 1) { x.globalAlpha = n1 * (1 - cond * 0.8); x.fillStyle = '#3b1f7a'; x.beginPath(); x.arc(CX + 40, CY - 30, 16, 0, 7); x.fill(); x.globalAlpha = 1; }
      if (n2 > 0.6) { x.globalAlpha = n2; x.fillStyle = '#3b1f7a'; [-1, 1].forEach(function (s) { x.beginPath(); x.arc(CX + s * 165 + 20, CY - 18, 10, 0, 7); x.fill(); }); x.globalAlpha = 1; }
      chromatin(CX, CY, 85, (1 - cond) * n1);
      chromatin(CX - 165, CY, 52, (1 - cond) * Math.max(n2, iv(A.split)));
      chromatin(CX + 165, CY, 52, (1 - cond) * Math.max(n2, iv(A.split)));
      // spindle
      var sp = iv(A.spindle), L = ivp(A.cL), R = ivp(A.cR);
      if (sp > 0.01) {
        x.globalAlpha = sp * 0.7; x.strokeStyle = fg; x.lineWidth = 1.2;
        CH.forEach(function (ch, j) {
          [0, 1].forEach(function (k) {
            var e = ease(tt), a = state(from, j, k), b = state(ph, j, k), X = CX + lerp(a[0], b[0], e), Y = CY + lerp(a[1], b[1], e);
            var pole = k ? R : L; x.beginPath(); x.moveTo(CX + pole[0], CY + pole[1]); x.lineTo(X, Y); x.stroke();
          });
        });
        for (var f = -2; f <= 2; f++) { x.beginPath(); x.moveTo(CX + L[0], CY + L[1]); x.quadraticCurveTo(CX, CY + f * 55, CX + R[0], CY + R[1]); x.stroke(); }
        x.globalAlpha = 1;
      }
      // centrioles
      [L, R].forEach(function (q) { x.fillStyle = '#e6b800'; x.save(); x.translate(CX + q[0], CY + q[1]); x.fillRect(-9, -3, 18, 6); x.fillRect(-3, -9, 6, 18); x.restore(); });
      // chromosomes
      if (cond > 0.01) {
        var e = ease(tt);
        CH.forEach(function (ch, j) {
          [0, 1].forEach(function (k) {
            var a = state(from, j, k), b = state(ph, j, k);
            rod(CX + lerp(a[0], b[0], e), CY + lerp(a[1], b[1], e), lerp(a[2], b[2], e), ch.len * (0.6 + 0.4 * cond), ch.col, cond);
          });
        });
      }
      // equator line
      if (ph === 2 || ph === 3) { x.globalAlpha = ph === 2 ? ease(tt) * 0.8 : (1 - ease(tt)) * 0.8; x.setLineDash([6, 6]); x.strokeStyle = css('--bad'); x.lineWidth = 2; x.beginPath(); x.moveTo(CX, 18); x.lineTo(CX, H - 18); x.stroke(); x.setLineDash([]); x.fillStyle = css('--bad'); x.font = '700 13px system-ui'; x.fillText(lb.equator, CX, 10); x.globalAlpha = 1; }
      x.fillStyle = fg; x.font = '800 18px system-ui'; x.textAlign = 'start'; x.fillText(lb.mitPh[ph], 10, 18); x.textAlign = 'center';
    }
    function go(n) { from = ph; ph = (n + 6) % 6; if (from === 5 && ph === 0) from = 0; tt = 0; hold = 0; upd(); }
    function upd() {
      c.innerHTML = '<b>' + esc(lb.mitPh[ph]) + ':</b> ' + esc(lb.mitCap[ph]);
      dots.querySelectorAll('button').forEach(function (b, i) { b.classList.toggle('on', i === ph); });
      lp.redraw();
    }
    var lp = looper(el, function (dt) {
      tt = Math.min(1, tt + dt / 1.4);
      if (auto && tt >= 1) { hold += dt; if (hold > 3.4) go(ph + 1); }
      draw();
    });
    var dots = document.createElement('div'); dots.className = 'dots';
    dots.innerHTML = lb.mitPh.map(function (n, i) { return '<button data-i="' + i + '">' + (i + 1) + '. ' + esc(n) + '</button>'; }).join('');
    el.appendChild(dots);
    dots.querySelectorAll('button').forEach(function (b) { b.onclick = function () { auto = false; pb.el.textContent = '▶ ' + lb.play; go(+b.getAttribute('data-i')); }; });
    var pb = { t: (auto ? '⏸ ' + lb.pause : '▶ ' + lb.play), fn: function (b) { auto = !auto; b.textContent = auto ? '⏸ ' + lb.pause : '▶ ' + lb.play; hold = 0; lp.redraw(); } };
    ctrlBar(el, [{ t: '◀ ' + lb.back, fn: function () { auto = false; pb.el.textContent = '▶ ' + lb.play; go(ph - 1); } }, pb, { t: lb.next + ' ▶', fn: function () { auto = false; pb.el.textContent = '▶ ' + lb.play; go(ph + 1); } }]);
    upd();
  };

  /* ===== 11. Transcription ===== */
  REG.transcription = function (el, lb) {
    var N = 14, W = 640, H = 300, dx = 42, x0 = 48, p = 0;
    var coding = 'ATG' + rndSeq(N - 3, 'ATGC'), tmpl = coding.split('').map(function (b) { return PAIR[b]; }).join('');
    var cv = canvas(el, W, H), x = cv.x, c = cap(el);
    function bar(X, y0, y1, b, al) {
      x.globalAlpha = al; x.strokeStyle = baseCol(b); x.lineWidth = 12; x.lineCap = 'butt'; x.beginPath(); x.moveTo(X, y0); x.lineTo(X, y1); x.stroke();
      x.fillStyle = b === 'T' ? '#3a2e00' : '#fff'; x.font = '800 11px system-ui'; x.fillText(b, X, (y0 + y1) / 2); x.globalAlpha = 1;
    }
    function draw() {
      x.clearRect(0, 0, W, H);
      var fg = css('--fg'), q = Math.min(p, 1), pos = x0 - 40 + q * (N * dx + 40), out = clamp((p - 1) / 0.3, 0, 1);
      var top = [], bot = [];
      for (var i = 0; i < N; i++) {
        var X = x0 + i * dx, open = ease(1 - Math.abs(X - pos) / 70) * (p < 1.02 ? 1 : 0), yT = 100 - 40 * open, yB = 150 + 40 * open;
        top.push([X, yT]); bot.push([X, yB]);
        bar(X, yT, yT + 24, coding[i], 1); bar(X, yB - 24, yB, tmpl[i], 1);
        if (X < pos - 6) {
          var my = 250 + out * 0, mx = X + out * 300, al = 1 - out;
          var m = { A: 'U', T: 'A', G: 'C', C: 'G' }[tmpl[i]];
          bar(mx, my - 24, my, m, al);
          x.globalAlpha = al; x.fillStyle = '#9b51e0'; x.fillRect(mx - dx / 2, my, dx, 6); x.globalAlpha = 1;
          if (Math.abs(X - pos) < 70 && p < 1) { x.strokeStyle = fg; x.setLineDash([2, 3]); x.lineWidth = 1; x.beginPath(); x.moveTo(X, yB + 2); x.lineTo(X, my - 26); x.stroke(); x.setLineDash([]); }
        }
      }
      x.lineWidth = 6; x.strokeStyle = fg;
      [top, bot].forEach(function (arr, k) { x.beginPath(); arr.forEach(function (q, i) { if (i) x.lineTo(q[0], q[1]); else x.moveTo(q[0] - dx / 2, q[1]); }); x.lineTo(arr[N - 1][0] + dx / 2, arr[N - 1][1]); x.stroke(); });
      if (p > 0.01 && p < 1.02) { x.fillStyle = 'rgba(39,174,96,.35)'; x.beginPath(); x.ellipse(pos, 160, 46, 70, 0, 0, 7); x.fill(); x.fillStyle = fg; x.font = '700 13px system-ui'; x.fillText(lb.rnaPol, pos, 22); }
      x.font = '700 12px system-ui'; x.textAlign = 'start'; x.fillStyle = fg;
      x.fillText(lb.codingStrand, 4, 60 - 0); x.fillText(lb.codogenic, 4, 210); x.fillStyle = '#9b51e0'; x.fillText('mRNA', 4, 288); x.textAlign = 'center';
      var st = p < 0.03 ? 0 : p < 0.5 ? 1 : p < 1.02 ? 2 : 3;
      c.innerHTML = '<span class="pill">' + (st + 1) + '/4</span> ' + esc(lb.trCap[st]);
    }
    var items;
    var lp = looper(el, function (dt) { if (!reduce) { p += dt * 0.09; if (p > 1.45) p = 0; if (items) items[1].el.value = clamp(p / 1.4, 0, 1) * 1000; } draw(); });
    items = [playBtn(lb, lp), { range: function (v) { p = v * 1.4; lp.pause(); items[0].el.textContent = '▶ ' + lb.play; lp.redraw(); }, label: lb.progress }];
    ctrlBar(el, items);
    if (reduce) { p = 0.7; lp.pause(); items[0].el.textContent = '▶ ' + lb.play; }
  };

  /* ===== 12. Translation ===== */
  REG.translation = function (el, lb) {
    var m = 'AUGGCUUUCAAAGGCUGA', cod = m.match(/.../g), aa = cod.map(function (k) { return window.BIOGEN.CODE[k]; });
    var W = 640, H = 330, bw = 24, x0 = 60, k = 0, f = 0, auto = !reduce;
    var cv = canvas(el, W, H), x = cv.x, c = cap(el);
    var aaCol = ['#eb5757', '#f2994a', '#27ae60', '#2f80ed', '#9b51e0'];
    function codonX(i) { return x0 + i * 3 * bw + 1.5 * bw; }
    function trna(X, Y, anti, a, i, al) {
      x.globalAlpha = al; x.fillStyle = '#c8b3ff'; x.strokeStyle = '#6a3fd1'; x.lineWidth = 2;
      x.beginPath(); if (x.roundRect) x.roundRect(X - 36, Y - 52, 72, 46, 14); else x.rect(X - 36, Y - 52, 72, 46); x.fill(); x.stroke();
      x.fillRect(X - 6, Y - 78, 12, 28);
      anti.split('').forEach(function (b, j) { x.fillStyle = baseCol(b); x.fillRect(X - 36 + j * 24, Y - 6, 24, 20); x.fillStyle = '#fff'; x.font = '800 12px system-ui'; x.fillText(b, X - 24 + j * 24, Y + 4); });
      if (a) { x.fillStyle = aaCol[i % 5]; x.beginPath(); x.arc(X, Y - 92, 17, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = '800 11px system-ui'; x.fillText(a, X, Y - 92); }
      x.fillStyle = '#2b1760'; x.font = '700 10px system-ui'; x.fillText('tRNA', X, Y - 30);
      x.globalAlpha = 1;
    }
    function draw() {
      x.clearRect(0, 0, W, H);
      var fg = css('--fg'), my = 250;
      // mRNA
      x.fillStyle = '#9b51e0'; x.fillRect(x0 - 20, my + 22, cod.length * 3 * bw + 40, 6);
      m.split('').forEach(function (b, i) { x.fillStyle = baseCol(b); x.fillRect(x0 + i * bw + 1, my, bw - 2, 22); x.fillStyle = '#fff'; x.font = '800 12px system-ui'; x.fillText(b, x0 + i * bw + bw / 2, my + 11); });
      cod.forEach(function (cc, i) { x.fillStyle = css('--muted'); x.font = '600 10px system-ui'; x.fillText(lb.codon + ' ' + (i + 1), codonX(i), my + 42); });
      x.fillStyle = fg; x.font = '700 12px system-ui'; x.textAlign = 'start'; x.fillText("mRNA 5'", 4, my + 60); x.textAlign = 'center';
      // ribosome position: covers codon k-1 (P) and k (A)
      var shift = k < cod.length - 1 && f > 0.75 ? ease((f - 0.75) / 0.25) : 0;
      var rx = codonX(Math.max(0.15, k - 0.5 + shift));
      x.globalAlpha = 0.5; x.fillStyle = '#7d8fb3';
      x.beginPath(); x.ellipse(rx, my - 40, 92, 50, 0, 0, 7); x.fill();
      x.beginPath(); x.ellipse(rx, my + 30, 88, 28, 0, 0, 7); x.fill(); x.globalAlpha = 1;
      x.fillStyle = fg; x.font = '700 12px system-ui'; x.fillText(lb.ribosome, rx, my + 72 - 6);
      // chain + tRNAs
      var isStop = aa[k] === 'Stop';
      var dock = my - 6;
      var chain = [];
      for (var i = 0; i < k; i++) chain.push(aa[i]);
      // previous tRNA (holding chain) at codon k-1
      if (k > 0) {
        var leave = f > 0.75 ? ease((f - 0.75) / 0.25) : 0;
        var px = codonX(k - 1) - leave * 60, py = dock - leave * 120;
        trna(px, py, cod[k - 1].split('').map(function (b) { return RPAIR[b]; }).join(''), f < 0.55 || isStop ? aa[k - 1] : '', k - 1, 1 - leave);
      }
      // incoming tRNA
      if (!isStop) {
        var arrive = ease(f / 0.5), ix = codonX(k), iy = lerp(-30, dock, arrive);
        trna(ix, iy, cod[k].split('').map(function (b) { return RPAIR[b]; }).join(''), aa[k], k, 1);
        if (f > 0.55) chain.push(aa[k]);
      }
      // draw peptide chain hanging from current carrier
      var holder = (!isStop && f > 0.55) ? [codonX(k) - (f > 0.75 ? 0 : 0), lerp(-30, dock, 1) - 92] : (k > 0 ? [codonX(k - 1) - (f > 0.75 && !isStop ? ease((f - 0.75) / 0.25) * 60 : 0), dock - 92 - (f > 0.75 && !isStop ? ease((f - 0.75) / 0.25) * 120 : 0)] : null);
      if (isStop && k > 0) holder = [codonX(k - 1) + f * 80, dock - 92 - f * 60];
      if (holder) {
        var cx0 = holder[0], cy0 = holder[1], n = isStop ? k : chain.length;
        var showChain = isStop ? aa.slice(0, k) : chain;
        for (var j = showChain.length - 1, s = 0; j >= 0; j--, s++) {
          var X = cx0 - s * 34, Y = cy0 - s * 6;
          if (s === 0 && !isStop) continue; // the newest is drawn on the tRNA
          if (s === 0 && isStop) { X = cx0; }
          x.strokeStyle = fg; x.lineWidth = 2; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + 34, Y + 6); if (s > 0) x.stroke();
          x.fillStyle = aaCol[j % 5]; x.beginPath(); x.arc(X, Y, 17, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = '800 11px system-ui'; x.fillText(showChain[j], X, Y);
        }
      }
      var st = k === 0 ? 0 : isStop ? 2 : 1;
      c.innerHTML = '<span class="pill">' + lb.codon + ' ' + (k + 1) + ': ' + cod[k] + ' → ' + aa[k] + '</span> ' + esc(lb.tlCap[st]);
    }
    var lp = looper(el, function (dt) {
      if (auto) { f += dt / 3.2; if (f >= 1) { f = 0; k++; if (k >= cod.length) k = 0; } }
      draw();
    });
    var pb = { t: (auto ? '⏸ ' + lb.pause : '▶ ' + lb.play), fn: function (b) { auto = !auto; b.textContent = auto ? '⏸ ' + lb.pause : '▶ ' + lb.play; lp.redraw(); } };
    ctrlBar(el, [pb, { t: lb.next + ' ▶', fn: function () { auto = false; pb.el.textContent = '▶ ' + lb.play; f = 0; k = (k + 1) % cod.length; lp.redraw(); } }, { t: '↺', fn: function () { k = 0; f = 0; lp.redraw(); } }]);
    if (reduce) { f = 0.6; }
  };

  /* ===== 13. Code-Sonne (genetic code wheel) ===== */
  var AANAME = {
    de: { Phe: 'Phenylalanin', Leu: 'Leucin', Ile: 'Isoleucin', Met: 'Methionin (Start)', Val: 'Valin', Ser: 'Serin', Pro: 'Prolin', Thr: 'Threonin', Ala: 'Alanin', Tyr: 'Tyrosin', His: 'Histidin', Gln: 'Glutamin', Asn: 'Asparagin', Lys: 'Lysin', Asp: 'Asparaginsäure', Glu: 'Glutaminsäure', Cys: 'Cystein', Trp: 'Tryptophan', Arg: 'Arginin', Gly: 'Glycin', Stop: 'Stopp' },
    en: { Phe: 'Phenylalanine', Leu: 'Leucine', Ile: 'Isoleucine', Met: 'Methionine (start)', Val: 'Valine', Ser: 'Serine', Pro: 'Proline', Thr: 'Threonine', Ala: 'Alanine', Tyr: 'Tyrosine', His: 'Histidine', Gln: 'Glutamine', Asn: 'Asparagine', Lys: 'Lysine', Asp: 'Aspartic acid', Glu: 'Glutamic acid', Cys: 'Cysteine', Trp: 'Tryptophan', Arg: 'Arginine', Gly: 'Glycine', Stop: 'Stop' }
  };
  REG.codesun = function (el, lb) {
    var G = window.BIOGEN, B = 'UCAG', fg = css('--fg');
    var names = AANAME[document.documentElement.lang] || AANAME.en;
    function arc(r0, r1, a0, a1) {
      var P = function (r, a) { a = (a - 90) * Math.PI / 180; return (r * Math.cos(a)).toFixed(2) + ' ' + (r * Math.sin(a)).toFixed(2); };
      var lg = a1 - a0 > 180 ? 1 : 0;
      return 'M' + P(r1, a0) + ' A' + r1 + ' ' + r1 + ' 0 ' + lg + ' 1 ' + P(r1, a1) + ' L' + P(r0, a1) + (r0 > 0 ? ' A' + r0 + ' ' + r0 + ' 0 ' + lg + ' 0 ' + P(r0, a0) : '') + 'Z';
    }
    function txt(r, a, s, size, rot, col) {
      var ra = (a - 90) * Math.PI / 180, X = r * Math.cos(ra), Y = r * Math.sin(ra);
      var rr = rot ? (a > 180 ? a + 90 : a - 90) : 0;
      return '<text x="' + X.toFixed(1) + '" y="' + Y.toFixed(1) + '" text-anchor="middle" dominant-baseline="central" transform="rotate(' + rr.toFixed(1) + ' ' + X.toFixed(1) + ' ' + Y.toFixed(1) + ')" style="font:800 ' + size + 'px system-ui;fill:' + (col || '#fff') + ';pointer-events:none">' + s + '</text>';
    }
    var out = '';
    for (var i = 0; i < 4; i++) out += '<path id="cs1-' + i + '" d="' + arc(0, 46, i * 90, (i + 1) * 90) + '" fill="var(--' + B[i] + ')" stroke="var(--bg)" stroke-width="2"/>' + txt(26, i * 90 + 45, B[i], 22);
    for (i = 0; i < 16; i++) out += '<path id="cs2-' + i + '" d="' + arc(46, 86, i * 22.5, (i + 1) * 22.5) + '" fill="var(--' + B[i & 3] + ')" fill-opacity=".85" stroke="var(--bg)" stroke-width="2"/>' + txt(66, i * 22.5 + 11.25, B[i & 3], 16);
    for (i = 0; i < 64; i++) out += '<path class="hot" data-c="' + i + '" id="cs3-' + i + '" d="' + arc(86, 116, i * 5.625, (i + 1) * 5.625) + '" fill="var(--' + B[i & 3] + ')" fill-opacity=".7" stroke="var(--bg)" stroke-width="1"/>' + txt(101, i * 5.625 + 2.81, B[i & 3], 10);
    // amino acid groups
    var g0 = 0;
    for (i = 1; i <= 64; i++) {
      if (i === 64 || G.AA[i] !== G.AA[g0]) {
        var a0 = g0 * 5.625, a1 = i * 5.625, isStop = G.AA[g0] === 'Stop', isMet = G.AA[g0] === 'Met';
        out += '<path class="hot" data-c="' + g0 + '" id="cs4-' + g0 + '" d="' + arc(116, 196, a0, a1) + '" fill="' + (isStop ? '#eb5757' : isMet ? '#27ae60' : 'var(--bg2)') + '" fill-opacity="' + (isStop || isMet ? '.35' : '1') + '" stroke="var(--line)" stroke-width="1.5"/>';
        out += txt(158, (a0 + a1) / 2, G.AA[g0], 13, true, fg);
        g0 = i;
      }
    }
    el.innerHTML = '<svg class="v" viewBox="-205 -205 410 410" style="max-width:520px;margin:auto">' + out + '<g id="csHi"></g></svg>';
    var info = document.createElement('div'); info.className = 'info'; el.appendChild(info);
    var row = document.createElement('div'); row.className = 'ctrl';
    row.innerHTML = '<label class="muted" for="csIn">' + esc(lb.codonInput) + '</label><input id="csIn" class="txt mono" maxlength="3" style="width:120px;text-align:center;font-size:1.2rem" placeholder="AUG" autocomplete="off" spellcheck="false">';
    el.appendChild(row);
    function show(idx) {
      var codon = B[idx >> 4] + B[(idx >> 2) & 3] + B[idx & 3], a = G.AA[idx];
      var hi = el.querySelector('#csHi');
      var s1 = idx >> 4, s2 = idx >> 2, st = 'fill="none" stroke="' + fg + '" stroke-width="3.5"';
      var gs = idx; while (gs > 0 && G.AA[gs - 1] === a) gs--;
      var ge = idx; while (ge < 63 && G.AA[ge + 1] === a) ge++;
      hi.innerHTML = '<path d="' + arc(0, 46, s1 * 90, s1 * 90 + 90) + '" ' + st + '/><path d="' + arc(46, 86, s2 * 22.5, s2 * 22.5 + 22.5) + '" ' + st + '/><path d="' + arc(86, 116, idx * 5.625, idx * 5.625 + 5.625) + '" ' + st + '/><path d="' + arc(116, 196, gs * 5.625, (ge + 1) * 5.625) + '" ' + st + '/>';
      info.innerHTML = '<span class="mono" style="font-size:1.2rem"><b>' + codon + '</b></span> → <b>' + a + '</b> (' + esc(names[a]) + ')' + (a === 'Stop' ? ' – ' + esc(lb.stopInfo) : codon === 'AUG' ? ' – ' + esc(lb.startInfo) : '') + '<br><span class="muted">' + esc(lb.readOrder) + ': ' + codon[0] + ' (' + esc(lb.inner) + ') → ' + codon[1] + ' → ' + codon[2] + ' (' + esc(lb.outer) + ')</span>';
    }
    el.querySelectorAll('.hot').forEach(function (p) { p.style.cursor = 'pointer'; p.onclick = function () { show(+p.getAttribute('data-c')); }; });
    var inp = row.querySelector('input');
    inp.oninput = function () {
      var v = inp.value.toUpperCase().replace(/T/g, 'U').replace(/[^UCAG]/g, ''); inp.value = v;
      if (v.length === 3) show(B.indexOf(v[0]) * 16 + B.indexOf(v[1]) * 4 + B.indexOf(v[2]));
    };
    show(B.indexOf('A') * 16 + B.indexOf('U') * 4 + B.indexOf('G'));
  };

  window.BIOANIM = {
    mountAll: function (root) {
      var lb = window.BIO.lab();
      root.querySelectorAll('[data-anim]').forEach(function (el) {
        var f = REG[el.getAttribute('data-anim')]; if (!f || el.getAttribute('data-on')) return;
        el.setAttribute('data-on', '1'); el.classList.add('anim');
        try { f(el, lb); } catch (e) { console.error(e); }
      });
    },
    stopAll: function () { cleanups.forEach(function (f) { try { f(); } catch (e) { } }); cleanups = []; }
  };
})();

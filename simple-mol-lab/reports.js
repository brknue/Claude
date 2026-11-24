'use strict';
/* Simple Mol Lab: PDF reports and measurement runs for the original parts of the app
   (molecule builder, gas lab table, DNA workbench). Uses globals of the main script
   (atoms, bonds, LAB, KSCALE, LTYPES, labVol, labState, isPi, WB, wbRender, wbDrawAll, toast, tab). */
(function () {
  const $ = (s) => document.querySelector(s);
  const S = window.SML;
  const say = (m) => { try { toast(m); } catch (e) { /* ignore */ } };
  const rowsOf = (root) => [...root.querySelectorAll('.row')].map((r) => { const k = r.children[0], v = r.children[1]; return [(k && k.textContent || '').trim(), (v && v.textContent || '').trim()]; }).filter((r) => r[0]);

  /* ---------------- molecule builder / table report ---------------- */
  function moleculeReport() {
    if (typeof LAB !== 'undefined' && LAB) return gasReport();
    const fm = ($('#fm').textContent || '').trim(), nm = ($('#nm').textContent || '').trim();
    const props = rowsOf($('#inf'));
    const shot = S.canvasJPEG($('#cv'));
    const spec = { kind: 'Molecule report', title: nm && nm !== '—' ? nm : fm && fm !== '—' ? fm : 'Molecule', subtitle: fm && fm !== nm ? 'Formula ' + fm : '', info: [['Formula', fm || '—'], ['Name', nm || '—']], images: [shot && Object.assign(shot, { caption: 'structure as drawn on the table (2-D layout, not to scale)' })], sections: [], sourceNote: 'properties computed from the drawn structure' };
    if (props.length) spec.sections.push({ h: 'Properties', rows: props });
    try {
      if (Array.isArray(atoms) && atoms.length && atoms.length <= 3000) {
        const idx = (a) => (typeof a === 'number' ? a : atoms.indexOf(a));
        const cnt = {}; atoms.forEach((a) => (cnt[a.e] = (cnt[a.e] || 0) + 1));
        spec.sections.push({ h: 'Atom count', rows: Object.entries(cnt).sort().map(([e, n]) => [e, String(n)]) });
        if (atoms.length <= 400) {
          spec.sections.push({ h: 'Atom table (table coordinates)', table: { head: ['#', 'Element', 'x', 'y', 'Bonds'], rows: atoms.map((a, i) => [i + 1, a.e, S.fmtN(a.x, 4), S.fmtN(a.y, 4), bonds.filter((b) => idx(b.a) === i || idx(b.b) === i).length]) } });
          spec.sections.push({ h: 'Bond table', table: { head: ['#', 'Atom 1', 'Atom 2', 'Order'], rows: bonds.map((b, i) => [i + 1, idx(b.a) + 1 + ' (' + (atoms[idx(b.a)] || {}).e + ')', idx(b.b) + 1 + ' (' + (atoms[idx(b.b)] || {}).e + ')', b.o]) } });
        }
      }
    } catch (e) { /* structure tables are optional */ }
    const p = S.report(spec);
    say('PDF report saved (' + p + ' pages)');
  }

  /* ---------------- gas lab: measurement runs ---------------- */
  const R = { on: null, runs: [] };
  const KS = () => (typeof KSCALE === 'number' ? KSCALE : 350);
  function sample(L) {
    const V = labVol(L), N = L.N, Z = N ? (L.P * V) / (N * Math.max(1e-6, L.Tm)) : NaN;
    return { P: L.P, T: L.Tm, TK: L.Tm * KS(), V, N, rho: N / Math.max(1, V), KE: L.Tm * N, Z, esc: L.esc || 0, h: isPi(L) ? L.yp : 0, Tw: L.Tw };
  }
  const QTY = [['P', 'Pressure', 'model'], ['T', 'Temperature', 'model'], ['TK', 'Temperature (approx.)', 'K'], ['V', 'Volume (area)', 'model'], ['N', 'Molecules', ''], ['rho', 'Number density', '1/area'], ['KE', 'Kinetic energy', 'model'], ['Z', 'Compressibility Z = PV/NkT', ''], ['esc', 'Escaped molecules', ''], ['h', 'Piston height', 'model'], ['Tw', 'Wall temperature', 'model']];
  const SWP = { heat: ['Tw', '#lbt', 'Wall temperature (heat)', 'model'], load: ['load', '#lbw', 'Piston load', 'model'], g: ['g', '#lbg', 'Gravity', 'model'] };
  function setParam(k, v) { const d = SWP[k]; LAB[d[0]] = v; const el = $(d[1]); if (el) el.value = v; }
  // sample every measurement step of the lab (wraps the main script's function)
  {
    const _m = labMeasure;
    labMeasure = function (L, steps) {
      _m(L, steps);
      const A = R.on;
      if (!A || !steps || L !== LAB || L !== A.L) return;
      const t = (L.time || 0) - A.t0;
      if (A.mode === 'time') {
        if (t + 1e-9 >= A.next) { const s = sample(L); s.t = t; A.rows.push(s); A.next += A.dt; if (A.next < t) A.next = t + A.dt; }
        if (t >= A.dur) finish();
      } else {
        if (A.phase === 'settle') { if (t >= A.settle) { A.phase = 'measure'; A.t0 = L.time; A.buf = []; } return; }
        A.buf.push(sample(L));
        if (t >= A.meas) {
          const row = { x: A.vals[A.i] }, sd = {};
          for (const [k] of QTY) { const st = S.stats(A.buf.map((b) => b[k])); row[k] = st.mean; sd[k] = st.sd; }
          row.sd = sd; A.rows.push(row);
          nextPoint();
        }
      }
    };
  }
  function nextPoint() {
    const A = R.on; A.i++;
    if (A.i >= A.vals.length) { setParam(A.key, A.orig); finish(); return; }
    setParam(A.key, A.vals[A.i]); A.phase = 'settle'; A.t0 = LAB.time || 0;
  }
  function startRun(mode) {
    const L = LAB; if (!L || !L.N) { say('Fill the container with molecules first'); return; }
    if (!L.run) { L.run = true; try { labUI(); } catch (e) { /* ignore */ } }
    const num = (id, d) => { const v = parseFloat($(id).value); return isFinite(v) ? v : d; };
    if (mode === 'time') R.on = { mode, L, t0: L.time || 0, next: 0, dt: Math.max(0.005, num('#smldt', 0.05)), dur: Math.max(0.05, num('#smldur', 20)), rows: [], started: new Date(), cfg: snapshotCfg(L) };
    else {
      const key = $('#smlsp').value, a = num('#smla', 0.3), b = num('#smlb', 2), n = Math.max(2, Math.round(num('#smln', 8)));
      const vals = []; for (let i = 0; i < n; i++) vals.push(a + ((b - a) * i) / (n - 1));
      R.on = { mode, L, key, vals, i: -1, orig: LAB[SWP[key][0]], settle: num('#smlse', 3), meas: num('#smlme', 3), rows: [], started: new Date(), cfg: snapshotCfg(L) };
      nextPoint();
    }
    ui(); say(mode === 'time' ? 'Recording…' : 'Sweep started');
  }
  function snapshotCfg(L) {
    return [['Container', (LTYPES[L.type] || {}).n || L.type], ['Size', L.size || '—'], ['Wall temperature (heat)', S.fmtN(L.Tw, 4) + ' (≈ ' + Math.round(L.Tw * KS()) + ' K)'], ['Gravity', S.fmtN(L.g, 4)], ...(isPi(L) ? [['Piston load', S.fmtN(L.load, 4)]] : []), ['Molecules', String(L.N)], ...L.sp.map((s) => ['  ' + s.name, String(s.n)])];
  }
  function finish(stopped) {
    const A = R.on; if (!A) return; R.on = null;
    if (A.mode === 'sweep' && A.i < A.vals.length) setParam(A.key, A.orig);
    if (!A.rows.length) { say('Stopped — no data'); ui(); return; }
    const cols = [];
    if (A.mode === 'time') { cols.push({ name: 'Time', unit: 'model', v: A.rows.map((r) => r.t) }); for (const [k, n, u] of QTY) cols.push({ name: n, unit: u, v: A.rows.map((r) => r[k]) }); }
    else { const d = SWP[A.key]; cols.push({ name: d[2], unit: d[3], v: A.rows.map((r) => r.x) }); for (const [k, n, u] of QTY) cols.push({ name: n, unit: u, v: A.rows.map((r) => r[k]), sd: A.rows.map((r) => r.sd[k]) }); }
    const run = { id: R.runs.length + 1, mode: A.mode, cols: cols.filter((c, i) => i === 0 || S.stats(c.v).n), started: A.started, finished: new Date(), cfg: A.cfg, stopped: !!stopped, sweep: A.mode === 'sweep' ? { key: A.key, a: A.vals[0], b: A.vals[A.vals.length - 1], n: A.vals.length, settle: A.settle, meas: A.meas } : null, dur: A.dur, dt: A.dt, shot: S.canvasJPEG($('#cv')) };
    R.runs.push(run); ui();
    say(`Run ${run.id} ${stopped ? 'stopped' : 'finished'}: ${run.cols[0].v.length} rows — press PDF report`);
  }
  function gasReport() {
    const L = LAB, run = R.runs[R.runs.length - 1];
    const info = [];
    let cols = [], x = '', y = '';
    if (run) {
      info.push(['Run', 'Run ' + run.id + (run.stopped ? ' (stopped early)' : '')], ['Type', run.mode === 'sweep' ? 'Parameter sweep' : 'Time series'], ['Started', S.stamp(run.started)], ['Finished', S.stamp(run.finished)]);
      if (run.mode === 'time') info.push(['Duration', `${run.dur} model time units, one sample every ${run.dt}`]);
      else info.push(['Swept', `${SWP[run.sweep.key][2]}: ${run.sweep.a} → ${run.sweep.b} in ${run.sweep.n} steps; settle ${run.sweep.settle}, measure ${run.sweep.meas} time units; mean ± SD`]);
      info.push(['Data', `${run.cols[0].v.length} rows × ${run.cols.length} columns`]);
      cols = run.cols; x = run.cols[0].name;
      y = run.mode === 'sweep' ? (run.sweep.key === 'load' ? 'Volume (area)' : 'Pressure') : 'Pressure';
    } else if (L.rec && L.rec.length) {
      info.push(['Data', 'continuous log of the table (no recorded run)']);
      const r = L.rec;
      cols = [{ name: 'Time', unit: 'model', v: r.map((q) => q.t) }, { name: 'Pressure', unit: 'model', v: r.map((q) => q.P) }, { name: 'Temperature', unit: 'model', v: r.map((q) => q.T) }, { name: 'Temperature (approx.)', unit: 'K', v: r.map((q) => q.T * KS()) }, { name: 'Volume (area)', unit: 'model', v: r.map((q) => q.V) }, { name: 'Molecules', unit: '', v: r.map((q) => q.N) }, { name: 'Number density', unit: '1/area', v: r.map((q) => q.rho) }, { name: 'Kinetic energy', unit: 'model', v: r.map((q) => q.KE) }];
      x = 'Time'; y = 'Pressure';
    }
    const cfg = run ? run.cfg : snapshotCfg(L);
    const fitSel = $('#smlfit') ? $('#smlfit').value : 'none';
    const ycol = cols.find((c) => c.name === ($('#smly') && $('#smly').value)) ;
    if (ycol) y = ycol.name;
    const cx = cols.find((c) => c.name === x), cy = cols.find((c) => c.name === y);
    const F = cx && cy && fitSel !== 'none' ? S.fit(fitSel, cx.v, cy.v) : null;
    const p = S.report({
      kind: 'Gas lab report', title: 'Gas lab: ' + ((LTYPES[L.type] || {}).n || L.type), subtitle: '2-D Lennard-Jones molecular dynamics in model units (temperature also shown on a rough kelvin scale)',
      info, sections: [{ h: 'Set-up', rows: cfg }], images: [(run && run.shot || S.canvasJPEG($('#cv'))) && Object.assign(run && run.shot || S.canvasJPEG($('#cv')), { caption: 'container at the end of the run' })],
      cols, x, y, fit: F, points: run && run.mode === 'sweep', runName: run ? 'Run ' + run.id : 'log',
      theory: [['h', 'Model'], ['p', 'Molecules are discs interacting through a Lennard-Jones potential, integrated with velocity-Verlet using cell lists. Walls exchange heat with the gas (metal conducts, glass insulates); the piston is a free body with an adjustable load. Pressure is the momentum transferred to the walls per unit length and time. All quantities are in reduced model units; the kelvin scale is a rough guide (T × ' + KS() + ').'], ['eq', 'Ideal gas (2-D): P·A = N·k·T,  Z = PA/(NkT) = 1 for an ideal gas'], ['p', 'Deviations of Z from 1 come from molecular size (raises Z) and attraction (lowers Z), as in the van der Waals equation.']],
      file: 'simple-mol-lab-gas-run',
    });
    say('PDF report saved (' + p + ' pages)');
  }
  function gasCSV() {
    const run = R.runs[R.runs.length - 1];
    if (!run) { say('Record a run first'); return; }
    S.download(new Blob([S.csv(run.cols, 'gas lab run ' + run.id)], { type: 'text/csv' }), 'simple-mol-lab-gas-run-' + run.id + '.csv');
  }
  function ui() {
    const box = $('#smlx'); if (!box) return;
    const on = !!R.on;
    $('#smlrec').textContent = on && R.on.mode === 'time' ? 'Stop' : 'Record';
    $('#smlswp').textContent = on && R.on.mode === 'sweep' ? 'Stop' : 'Run sweep';
    $('#smlrec').classList.toggle('on', on && R.on.mode === 'time');
    $('#smlswp').classList.toggle('on', on && R.on.mode === 'sweep');
    const run = R.runs[R.runs.length - 1], ys = $('#smly');
    if (run && ys && ys.dataset.run !== String(run.id)) { ys.dataset.run = run.id; ys.innerHTML = run.cols.slice(1).map((c) => `<option>${S.esc(c.name)}</option>`).join(''); ys.value = run.mode === 'sweep' && run.sweep.key === 'load' ? 'Volume (area)' : 'Pressure'; }
    $('#smlinfo').textContent = run ? `Run ${run.id}: ${run.cols[0].v.length} rows (${run.mode === 'sweep' ? 'sweep' : 'time series'})` : 'No run recorded yet — the PDF then uses the continuous log.';
  }
  function progress() {
    requestAnimationFrame(progress);
    const A = R.on, bar = $('#smlprog i'); if (!bar) return;
    if (!A) { bar.style.width = '0'; return; }
    if (!LAB || LAB !== A.L) { R.on = null; ui(); return; }
    const t = (LAB.time || 0) - A.t0;
    bar.style.width = (A.mode === 'time' ? Math.min(100, (t / A.dur) * 100) : ((A.i + (A.phase === 'measure' ? 0.5 : 0)) / A.vals.length) * 100) + '%';
  }
  function buildGasPanel() {
    const lab = $('#lab'); if (!lab || $('#smlx')) return;
    const d = document.createElement('div'); d.id = 'smlx';
    const fits = Object.entries(S.MODELS).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join('');
    d.innerHTML = `<b>Measure</b><div class="rw">Time series: <input type="number" id="smldur" value="20" step="any" title="Duration in model time units"> long, sample every <input type="number" id="smldt" value="0.05" step="any"><button id="smlrec">Record</button></div>
      <div class="rw">Sweep <select id="smlsp"><option value="heat">heat (wall temperature)</option><option value="load">piston load</option><option value="g">gravity</option></select> from <input type="number" id="smla" value="0.3" step="any"> to <input type="number" id="smlb" value="2" step="any"> in <input type="number" id="smln" value="8" step="1"> steps</div>
      <div class="rw">settle <input type="number" id="smlse" value="3" step="any"> measure <input type="number" id="smlme" value="3" step="any"> time units <button id="smlswp">Run sweep</button></div>
      <div id="smlprog"><i></i></div>
      <div class="rw">Report plot y: <select id="smly"><option>Pressure</option></select> fit <select id="smlfit">${fits}</select></div>
      <div class="rw"><button id="smlpdf" class="smlbtn">PDF report</button><button id="smlcsv">CSV</button><small id="smlinfo" style="color:var(--mt)"></small></div>`;
    lab.appendChild(d);
    $('#smlrec').onclick = () => (R.on ? finish(true) : startRun('time'));
    $('#smlswp').onclick = () => (R.on ? finish(true) : startRun('sweep'));
    $('#smlpdf').onclick = gasReport;
    $('#smlcsv').onclick = gasCSV;
    $('#smlsp').onchange = () => { const k = $('#smlsp').value; const def = { heat: [0.3, 2], load: [0.2, 3], g: [0, 0.1] }[k]; $('#smla').value = def[0]; $('#smlb').value = def[1]; };
    ui();
  }

  /* ---------------- DNA workbench report ---------------- */
  function dnaReport() {
    const seq = (typeof WB !== 'undefined' && WB.seq) || '';
    if (!seq) { say('Paste or generate a sequence first'); return; }
    const sections = [], images = [], keepTab = WB.tab;
    const tabs = [...document.querySelectorAll('#wbt button')];
    tabs.forEach((b, i) => {
      WB.tab = i; try { wbRender(); wbDrawAll(); } catch (e) { return; }
      const body = $('#wbb'), name = b.textContent.trim();
      const rows = [...body.querySelectorAll('.tr')].map((r) => [(r.children[0] || {}).textContent || '', (r.children[1] || {}).textContent || '']).map((r) => [r[0].trim(), r[1].trim()]).filter((r) => r[0] || r[1]);
      const pre = [...body.querySelectorAll('.alp, code.pr')].map((p) => p.textContent).join('\n\n');
      const txt = rows.length ? null : body.innerText.replace(/\n{3,}/g, '\n\n').trim().slice(0, 6000);
      sections.push({ h: name, rows: rows.length ? rows : null, text: rows.length ? (pre ? null : null) : txt, w1: 220 });
      if (pre) sections.push({ h: name + ' — details', text: pre.slice(0, 20000), mono: true });
      body.querySelectorAll('canvas').forEach((cv) => { const j = S.canvasJPEG(cv, 1200); const t = cv.parentElement && cv.parentElement.querySelector('.ct'); if (j && cv.width > 20) images.push(Object.assign(j, { caption: name + (t ? ': ' + t.textContent : ''), maxH: 200 })); });
    });
    WB.tab = keepTab; try { wbRender(); wbDrawAll(); tabs.forEach((b, i) => b.classList.toggle('on', i === keepTab)); } catch (e) { /* ignore */ }
    let fasta = '';
    for (let i = 0; i < seq.length; i += 60) fasta += String(i + 1).padStart(7) + '  ' + seq.slice(i, i + 60).replace(/(.{10})/g, '$1 ') + '\n';
    const p = S.report({ kind: 'DNA sequence report', title: 'DNA sequence analysis', subtitle: seq.length.toLocaleString('en') + ' bases', info: [['Length', seq.length + ' bases']], sections, images, mono: { h: 'Sequence (5′→3′)', text: fasta }, sourceNote: 'computed from the entered sequence', file: 'simple-mol-lab-dna' });
    say('PDF report saved (' + p + ' pages)');
  }

  /* ---------------- install buttons ---------------- */
  function install() {
    const aside = document.querySelector('#B aside:last-of-type');
    if (aside && !$('#smlmol')) { const b = document.createElement('button'); b.id = 'smlmol'; b.className = 'smlrep smlbtn'; b.textContent = 'PDF report of this table'; b.onclick = moleculeReport; aside.insertBefore(b, $('#chs') ? $('#chs').previousElementSibling : null); }
    buildGasPanel();
    const h = $('#wbh');
    if (h && !$('#smldna')) { const b = document.createElement('button'); b.id = 'smldna'; b.className = 'smlbtn'; b.textContent = 'PDF report'; b.onclick = dnaReport; h.insertBefore(b, $('#wbx')); }
  }
  install();
  new MutationObserver(() => { if (!$('#smldna') && $('#wbh')) install(); if (!$('#smlx') && $('#lab')) install(); }).observe(document.body, { childList: true, subtree: true });
  progress();
  window.SMLreports = { moleculeReport, gasReport, dnaReport, R, startRun, finish };
})();

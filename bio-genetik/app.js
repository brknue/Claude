/* Genetik verstehen – app shell: router, memory (localStorage), pages, quiz, flashcards, exam, lab. */
(function () {
  'use strict';
  var LANGS = [
    ['de', 'Deutsch'], ['en', 'English'], ['tr', 'Türkçe'], ['ar', 'العربية'],
    ['ru', 'Русский'], ['uk', 'Українська']
  ];
  var KEY = 'genetik-verstehen.v1';
  var app = document.getElementById('app');
  var I18N = window.BIO_I18N = window.BIO_I18N || {};

  /* ---------- memory ---------- */
  var mem = load();
  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { d = null; }
    d = d && typeof d === 'object' ? d : {};
    d.read = d.read || {}; d.quiz = d.quiz || {}; d.cards = d.cards || {}; d.exam = d.exam || {}; d.lab = d.lab || {};
    return d;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* storage full or blocked */ } }

  /* ---------- language ---------- */
  function guessLang() { return 'de'; } // default is German (exam language); user can switch
  var lang = mem.lang || guessLang();
  function L() { return I18N[lang] || I18N.de; }
  function ui(k) { var v = (L().ui || {})[k]; return v != null ? v : (I18N.de.ui[k] != null ? I18N.de.ui[k] : k); }
  function lab() { var o = {}, d = I18N.de.lab, c = L().lab || {}; for (var k in d) o[k] = c[k] != null ? c[k] : d[k]; return o; }
  window.BIO = { ui: ui, lab: lab };
  function loadLang(code) {
    return new Promise(function (res) {
      if (I18N[code]) return res();
      var s = document.createElement('script');
      s.src = 'i18n/' + code + '.js';
      s.onload = function () { res(); };
      s.onerror = function () { res(); };
      document.head.appendChild(s);
    });
  }
  function setLang(code) {
    loadLang(code).then(function () {
      lang = I18N[code] ? code : 'de'; mem.lang = lang; save(); applyLang(); render();
    });
  }
  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = (L().dir || 'ltr');
    document.title = ui('appName') + ' – ' + ui('tagline');
  }

  /* ---------- theme ---------- */
  function applyTheme() {
    var t = mem.theme || (matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
  }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function toast(msg) {
    var t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }
  function chapters() { return L().chapters || I18N.de.chapters; }
  function chById(id) { var c = chapters(); for (var i = 0; i < c.length; i++) if (c[i].id === id) return c[i]; return null; }
  function chProgress(ch) {
    var r = mem.read[ch.id] || {}, n = 0;
    for (var i = 0; i < ch.sections.length; i++) if (r[i]) n++;
    var q = mem.quiz[ch.id] ? Math.min(1, mem.quiz[ch.id].best / 100) : 0;
    return Math.round(((n / ch.sections.length) * 0.7 + q * 0.3) * 100);
  }
  function totalProgress() { var c = chapters(), s = 0; c.forEach(function (ch) { s += chProgress(ch); }); return Math.round(s / c.length); }
  function grade(p) { return p >= 92 ? 1 : p >= 81 ? 2 : p >= 67 ? 3 : p >= 50 ? 4 : p >= 30 ? 5 : 6; }
  function allTerms() {
    var out = [];
    chapters().forEach(function (ch) {
      (ch.terms || []).forEach(function (t, i) {
        var tr = t.length === 3; // [localTerm, germanTerm, def] or [germanTerm, def]
        out.push({ key: ch.id + ':' + i, t: t[0], de: tr ? t[1] : '', d: tr ? t[2] : t[1], ch: ch });
      });
    });
    return out;
  }
  function termHtml(x) { return esc(x.t) + (x.de && x.de !== x.t ? ' <span class="de">(' + esc(x.de) + ')</span>' : ''); }

  /* ---------- shell ---------- */
  var NAV = [
    ['#/', '🏠', 'home'], ['#/chapters', '📚', 'chapters'], ['#/cards', '🃏', 'cards'],
    ['#/lab', '🧪', 'lab'], ['#/exam', '📝', 'exam']
  ];
  function shell(inner, route) {
    var opts = LANGS.map(function (l) { return '<option value="' + l[0] + '"' + (l[0] === lang ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('');
    var nav = function (cls) {
      return NAV.map(function (n) {
        var on = (route === n[0].slice(2) || (n[0] === '#/' && route === '')) ? ' class="on"' : '';
        return '<a href="' + n[0] + '"' + on + '>' + (cls ? '<span class="i" aria-hidden="true">' + n[1] + '</span>' : '') + esc(ui(n[2])) + '</a>';
      }).join('');
    };
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return '<a class="skip" href="#main">' + esc(ui('skip')) + '</a>' +
      '<header class="top"><div class="top-in">' +
      '<a class="brand" href="#/">' + LOGO + '<span>' + esc(ui('appName')) + '</span></a>' +
      '<nav class="desk-nav" aria-label="' + esc(ui('menu')) + '">' + nav(false) + '<a href="#/glossary"' + (route === 'glossary' ? ' class="on"' : '') + '>' + esc(ui('glossary')) + '</a></nav>' +
      '<select class="lang" id="langSel" aria-label="' + esc(ui('language')) + '">' + opts + '</select>' +
      '<button class="icon-btn" id="themeBtn" aria-label="' + esc(ui('theme')) + '">' + (dark ? '☀️' : '🌙') + '</button>' +
      '</div></header>' +
      '<main id="main" tabindex="-1">' + inner + '</main>' +
      '<footer class="foot"><span>' + esc(ui('footer')) + '</span><span><a href="#/glossary">' + esc(ui('glossary')) + '</a> · <a href="#/legal">' + esc(ui('legal')) + '</a> · <a href="#/settings">' + esc(ui('settings')) + '</a></span></footer>' +
      '<nav class="bnav" aria-label="' + esc(ui('menu')) + '">' + nav(true) + '</nav>';
  }
  var LOGO = '<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#6a3fd1"/><path d="M13 6c0 9 14 10 14 18s-14 9-14 10M27 6c0 9-14 10-14 18s14 9 14 10" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M15 11h10M17 16h6M17 24h6M15 29h10" stroke="#ffd66b" stroke-width="2.2" stroke-linecap="round"/></svg>';

  /* ---------- router ---------- */
  window.addEventListener('hashchange', render);
  function render() {
    BIOANIM.stopAll();
    var h = (location.hash || '#/').slice(2).split('/');
    var r = h[0] || '', html;
    try {
      if (r === '') html = pHome();
      else if (r === 'chapters') html = pChapters();
      else if (r === 'ch') html = pLesson(h[1]);
      else if (r === 'quiz') html = pQuiz(h[1]);
      else if (r === 'cards') html = pCards();
      else if (r === 'glossary') html = pGlossary();
      else if (r === 'exam') html = pExam();
      else if (r === 'lab') html = pLab();
      else if (r === 'legal') html = pLegal();
      else if (r === 'settings') html = pSettings();
      else html = pHome();
    } catch (e) { console.error(e); html = '<p>Error</p>'; }
    app.innerHTML = shell(html, r === 'ch' || r === 'quiz' ? 'chapters' : r);
    $('#langSel').onchange = function (e) { setLang(e.target.value); };
    $('#themeBtn').onclick = function () {
      mem.theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; save(); applyTheme(); render();
    };
    if (after) { var f = after; after = null; f(); }
    BIOANIM.mountAll(app);
    if (r !== 'quiz' && r !== 'exam' && r !== 'cards') { mem.last = location.hash; save(); }
    if (!render.first) window.scrollTo(0, 0);
    render.first = false;
  }
  var after = null;

  /* ---------- pages ---------- */
  function pHome() {
    var p = totalProgress(), cont = mem.last && mem.last !== '#/' ? mem.last : '#/ch/' + chapters()[0].id;
    var due = dueCards().length;
    var hero = '<section class="hero"><div><span class="pill">' + esc(ui('badge')) + '</span><h1>' + esc(ui('heroTitle')) + '</h1><p class="muted">' + esc(ui('heroText')) + '</p>' +
      '<div class="row" style="margin:14px 0"><a class="btn" href="' + esc(cont) + '">▶ ' + esc(p > 0 ? ui('continue') : ui('start')) + '</a><a class="btn ghost" href="#/exam">📝 ' + esc(ui('exam')) + '</a></div>' +
      '<p style="margin-bottom:4px"><b>' + esc(ui('progress')) + ': ' + p + ' %</b></p><div class="bar"><i style="width:' + p + '%"></i></div>' +
      '<p class="muted" style="font-size:.85rem">💾 ' + esc(ui('memoryNote')) + '</p></div>' +
      '<div data-anim="helix" data-mini="1"></div></section>';
    var how = '<h2>' + esc(ui('howTitle')) + '</h2><div class="grid">' + (L().how || I18N.de.how).map(function (s, i) {
      return '<div class="card"><div class="big" style="font-size:1.8rem">' + (i + 1) + '</div><b>' + esc(s[0]) + '</b><p class="muted" style="margin:4px 0 0">' + esc(s[1]) + '</p></div>';
    }).join('') + '</div>';
    var stats = '<div class="grid" style="margin-top:14px">' +
      '<a class="card ch" href="#/cards"><div class="num">🃏</div><div><h3>' + esc(ui('cards')) + '</h3><p class="muted">' + esc(ui('cardsDue')) + ': ' + due + '</p></div></a>' +
      '<a class="card ch" href="#/lab"><div class="num">🧪</div><div><h3>' + esc(ui('lab')) + '</h3><p class="muted">' + esc(ui('labShort')) + '</p></div></a>' +
      '<a class="card ch" href="#/exam"><div class="num">📝</div><div><h3>' + esc(ui('exam')) + '</h3><p class="muted">' + (mem.exam.best != null ? esc(ui('best')) + ': ' + mem.exam.best + ' %' : esc(ui('examShort'))) + '</p></div></a></div>';
    return hero + stats + '<h2>' + esc(ui('chapters')) + '</h2>' + chapterGrid() + how;
  }
  function chapterGrid() {
    return '<div class="grid">' + chapters().map(function (ch, i) {
      var p = chProgress(ch);
      return '<a class="card ch' + (p >= 100 ? ' done' : '') + '" href="#/ch/' + ch.id + '"><div class="num">' + (p >= 100 ? '✓' : (i + 1)) + '</div><div style="flex:1;min-width:0"><h3>' + esc(ch.title) + '</h3><p class="muted">' + esc(ch.sub) + '</p><div class="bar"><i style="width:' + p + '%"></i></div></div></a>';
    }).join('') + '</div>';
  }
  function pChapters() { return '<h1>' + esc(ui('chapters')) + '</h1><p class="muted">' + esc(ui('chaptersIntro')) + '</p>' + chapterGrid(); }

  function pLesson(id) {
    var ch = chById(id); if (!ch) return pChapters();
    var cs = chapters(), idx = cs.indexOf(ch), r = mem.read[id] || {};
    var head = '<div class="lesson-head"><a href="#/chapters">← ' + esc(ui('chapters')) + '</a><span class="pill">' + esc(ui('chapter')) + ' ' + (idx + 1) + '/' + cs.length + ' · ' + chProgress(ch) + ' %</span></div>' +
      '<h1>' + esc(ch.title) + '</h1><p class="muted">' + esc(ch.sub) + '</p>';
    var secs = ch.sections.map(function (s, i) {
      return '<section class="card sec" id="s' + i + '"><h2>' + esc(s.h) + '</h2><div class="content">' + s.html + '</div>' +
        '<button class="btn small ghost readbtn' + (r[i] ? ' on' : '') + '" data-read="' + i + '">' + (r[i] ? '✓ ' + esc(ui('read')) : esc(ui('markRead'))) + '</button></section>';
    }).join('');
    var terms = '<section class="card sec"><h2>🔑 ' + esc(ui('keyTerms')) + '</h2><div class="gl">' + allTerms().filter(function (x) { return x.ch === ch; }).map(function (x) {
      return '<div><span class="term">' + termHtml(x) + '</span> – ' + esc(x.d) + '</div>';
    }).join('') + '</div></section>';
    var tasks = (ch.tasks || []).length ? '<section class="card sec"><h2>✍️ ' + esc(ui('examTasks')) + '</h2><p class="muted">' + esc(ui('examTasksIntro')) + '</p>' + ch.tasks.map(function (t, i) {
      return '<div style="margin:14px 0"><p><b>' + (i + 1) + '. ' + t.q + '</b></p><details><summary class="btn small soft">' + esc(ui('showSolution')) + '</summary><div class="tip">' + t.a + '</div></details></div>';
    }).join('') + '</section>' : '';
    var nav = '<div class="row" style="justify-content:space-between;margin-top:18px">' +
      (idx > 0 ? '<a class="btn ghost" href="#/ch/' + cs[idx - 1].id + '">← ' + esc(ui('prev')) + '</a>' : '<span></span>') +
      '<a class="btn" href="#/quiz/' + ch.id + '">🎯 ' + esc(ui('quizStart')) + '</a>' +
      (idx < cs.length - 1 ? '<a class="btn ghost" href="#/ch/' + cs[idx + 1].id + '">' + esc(ui('next')) + ' →</a>' : '<a class="btn ghost" href="#/exam">' + esc(ui('exam')) + ' →</a>') + '</div>';
    after = function () {
      $$('[data-read]').forEach(function (b) {
        b.onclick = function () {
          var i = +b.getAttribute('data-read'); mem.read[id] = mem.read[id] || {};
          mem.read[id][i] = !mem.read[id][i]; save();
          b.classList.toggle('on', !!mem.read[id][i]);
          b.textContent = mem.read[id][i] ? '✓ ' + ui('read') : ui('markRead');
          $('.lesson-head .pill').textContent = ui('chapter') + ' ' + (idx + 1) + '/' + cs.length + ' · ' + chProgress(ch) + ' %';
          if (mem.read[id][i]) { var n = $('#s' + (i + 1)); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        };
      });
    };
    return head + secs + terms + tasks + nav;
  }

  /* ---------- quiz ---------- */
  function runQuiz(root, qs, onDone) {
    var i = 0, score = 0, wrong = [];
    function show() {
      if (i >= qs.length) return onDone(score, qs.length, wrong);
      var q = qs[i], order = shuffle(q.o.map(function (_, k) { return k; }));
      root.innerHTML = '<div class="card"><div class="row" style="justify-content:space-between"><span class="pill">' + esc(ui('question')) + ' ' + (i + 1) + ' / ' + qs.length + '</span><span class="muted">✓ ' + score + '</span></div>' +
        '<div class="bar" style="margin:10px 0"><i style="width:' + Math.round(i / qs.length * 100) + '%"></i></div>' +
        '<p class="q">' + q.q + '</p><div class="opts">' + order.map(function (k) { return '<button class="opt" data-k="' + k + '">' + q.o[k] + '</button>'; }).join('') + '</div><div id="fb"></div></div>';
      $$('.opt', root).forEach(function (b) {
        b.onclick = function () {
          var k = +b.getAttribute('data-k'), ok = k === q.c;
          $$('.opt', root).forEach(function (x) { x.disabled = true; if (+x.getAttribute('data-k') === q.c) x.classList.add('ok'); });
          if (!ok) { b.classList.add('bad'); wrong.push(q); } else score++;
          $('#fb', root).innerHTML = '<div class="fb ' + (ok ? 'ok' : 'bad') + '"><b>' + esc(ok ? ui('correct') : ui('wrong')) + '</b> ' + (q.e || '') + '</div>' +
            '<div class="row" style="margin-top:12px"><button class="btn" id="nx">' + esc(i + 1 < qs.length ? ui('next') : ui('result')) + ' →</button></div>';
          $('#nx', root).onclick = function () { i++; show(); };
          $('#nx', root).focus();
        };
      });
    }
    show();
  }
  function resultHtml(score, n, wrong, retryHref) {
    var p = Math.round(score / n * 100);
    return '<div class="card" style="text-align:center"><div class="big">' + p + ' %</div><p>' + score + ' / ' + n + ' · ' + esc(ui('gradeApprox')) + ': <b>' + grade(p) + '</b></p><p>' + esc(p >= 90 ? ui('praise1') : p >= 70 ? ui('praise2') : ui('praise3')) + '</p></div>' +
      (wrong.length ? '<h2>' + esc(ui('reviewWrong')) + '</h2>' + wrong.map(function (q) { return '<div class="card" style="margin:8px 0"><b>' + q.q + '</b><p class="tip" style="margin:6px 0 0">✓ ' + q.o[q.c] + '<br><span class="muted">' + (q.e || '') + '</span></p></div>'; }).join('') : '') +
      '<div class="row" style="margin-top:14px"><a class="btn" href="' + retryHref + '" onclick="setTimeout(function(){dispatchEvent(new HashChangeEvent(\'hashchange\'))},0)">↻ ' + esc(ui('retry')) + '</a><a class="btn ghost" href="#/chapters">' + esc(ui('chapters')) + '</a></div>';
  }
  function pQuiz(id) {
    var ch = chById(id); if (!ch) return pChapters();
    after = function () {
      runQuiz($('#qz'), shuffle(ch.quiz), function (s, n, w) {
        var p = Math.round(s / n * 100);
        mem.quiz[id] = { best: Math.max(p, (mem.quiz[id] || {}).best || 0), last: p }; save();
        $('#qz').innerHTML = resultHtml(s, n, w, '#/quiz/' + id);
        window.scrollTo(0, 0);
      });
    };
    return '<a href="#/ch/' + id + '">← ' + esc(ch.title) + '</a><h1>🎯 ' + esc(ui('quiz')) + ': ' + esc(ch.title) + '</h1><div id="qz"></div>';
  }

  /* ---------- flashcards (Leitner boxes, saved) ---------- */
  var BOX_DAYS = [0, 1, 2, 4, 8, 16];
  function dueCards() {
    var now = Date.now();
    return allTerms().filter(function (x) { var c = mem.cards[x.key]; return !c || c.due <= now; });
  }
  function pCards() {
    var all = allTerms(), boxes = [0, 0, 0, 0, 0, 0];
    all.forEach(function (x) { var c = mem.cards[x.key]; boxes[c ? c.box : 0]++; });
    var queue = shuffle(dueCards());
    after = function () {
      var root = $('#fc');
      function show() {
        if (!queue.length) { root.innerHTML = '<div class="card" style="text-align:center"><div class="big">🎉</div><p>' + esc(ui('allDone')) + '</p><button class="btn soft" id="again">' + esc(ui('practiceAll')) + '</button></div>'; $('#again').onclick = function () { queue = shuffle(all); show(); }; return; }
        var x = queue[0], front = mem.cardDir ? x.d : null;
        root.innerHTML = '<p class="muted" style="text-align:center">' + esc(ui('cardsLeft')) + ': ' + queue.length + '</p>' +
          '<div class="flash" id="fl"><div class="in" tabindex="0" role="button" aria-label="' + esc(ui('flip')) + '">' +
          '<div class="face"><div class="t">' + (front ? esc(front) : termHtml(x)) + '</div><p class="muted">' + esc(ui('tapFlip')) + '</p></div>' +
          '<div class="face b"><div style="font-size:1.1rem">' + (front ? '<b>' + termHtml(x) + '</b>' : esc(x.d)) + '</div><p class="muted" style="font-size:.85rem">' + esc(x.ch.title) + '</p></div></div></div>' +
          '<div class="row" style="justify-content:center;margin-top:16px"><button class="btn ghost" id="no">✗ ' + esc(ui('dontKnow')) + '</button><button class="btn" id="yes">✓ ' + esc(ui('know')) + '</button></div>';
        var fl = $('#fl'), inn = $('.in', fl);
        inn.onclick = function () { fl.classList.toggle('flip'); };
        inn.onkeydown = function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); fl.classList.toggle('flip'); } };
        function grade(ok) {
          var c = mem.cards[x.key] || { box: 0 };
          c.box = ok ? Math.min(5, c.box + 1) : 0;
          c.due = Date.now() + BOX_DAYS[c.box] * 864e5 - (ok ? 0 : 1);
          mem.cards[x.key] = c; save(); queue.shift();
          if (!ok) queue.splice(Math.min(queue.length, 3), 0, x);
          show();
        }
        $('#yes').onclick = function () { grade(true); };
        $('#no').onclick = function () { grade(false); };
      }
      show();
      $('#dir').onclick = function () { mem.cardDir = !mem.cardDir; save(); render(); };
    };
    return '<h1>🃏 ' + esc(ui('cards')) + '</h1><p class="muted">' + esc(ui('cardsIntro')) + '</p>' +
      '<div class="boxes">' + boxes.map(function (n, i) { return '<span>' + esc(ui('box')) + ' ' + i + ': <b>' + n + '</b></span>'; }).join('') + '</div>' +
      '<div class="row" style="justify-content:center;margin:10px 0"><button class="btn small soft" id="dir">⇄ ' + esc(mem.cardDir ? ui('dirDefTerm') : ui('dirTermDef')) + '</button></div><div id="fc"></div>';
  }

  /* ---------- glossary ---------- */
  function pGlossary() {
    var t = allTerms().sort(function (a, b) { return a.t.localeCompare(b.t, lang); });
    after = function () {
      $('#gs').oninput = function (e) {
        var v = e.target.value.toLowerCase();
        $$('#gl > div').forEach(function (d) { d.style.display = d.textContent.toLowerCase().indexOf(v) >= 0 ? '' : 'none'; });
      };
    };
    return '<h1>📖 ' + esc(ui('glossary')) + '</h1><p class="muted">' + t.length + ' ' + esc(ui('termsCount')) + '</p><input class="search" id="gs" type="search" placeholder="' + esc(ui('search')) + '"><div class="gl" id="gl" style="margin-top:12px">' +
      t.map(function (x) { return '<div class="card"><span class="term">' + termHtml(x) + '</span><br>' + esc(x.d) + ' <a class="muted" style="font-size:.85rem" href="#/ch/' + x.ch.id + '">→ ' + esc(x.ch.title) + '</a></div>'; }).join('') + '</div>';
  }

  /* ---------- lab (generated practice, unlimited) ---------- */
  var G = window.BIOGEN;
  function pLab() {
    var tabs = [['comp', ui('labComp')], ['trans', ui('labTrans')], ['transl', ui('labTransl')], ['count', ui('labCount')]];
    var cur = mem.labTab || 'comp';
    after = function () {
      $$('.dots button').forEach(function (b) { b.onclick = function () { mem.labTab = b.getAttribute('data-t'); save(); render(); }; });
      labTask($('#lt'), cur);
    };
    var s = mem.lab;
    return '<h1>🧪 ' + esc(ui('lab')) + '</h1><p class="muted">' + esc(ui('labIntro')) + '</p>' +
      '<div class="dots" style="justify-content:flex-start">' + tabs.map(function (t) { return '<button data-t="' + t[0] + '"' + (t[0] === cur ? ' class="on"' : '') + '>' + esc(t[1]) + '</button>'; }).join('') + '</div>' +
      '<p class="muted" style="font-size:.85rem">✓ ' + (s.ok || 0) + ' · ✗ ' + (s.bad || 0) + '</p><div id="lt"></div>' +
      (cur === 'transl' ? '<div class="card" style="margin-top:14px"><h2 style="margin-top:0">' + esc(ui('codeSun')) + '</h2><div data-anim="codesun"></div></div>' : '');
  }
  function labTask(root, type) {
    var t = G.task(type, lang), lb = lab();
    root.innerHTML = '<div class="card"><p class="q">' + esc(t.prompt(ui, lb)) + '</p>' + t.show + '<label class="muted" for="ans" style="display:block;margin-top:12px">' + esc(ui('yourAnswer')) + '</label>' +
      '<input class="txt mono" id="ans" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' + esc(t.ph || '') + '">' +
      '<div class="row" style="margin-top:12px"><button class="btn" id="chk">' + esc(ui('check')) + '</button><button class="btn ghost" id="new">↻ ' + esc(ui('newTask')) + '</button></div><div id="fb"></div></div>';
    var inp = $('#ans', root);
    function check() {
      var ok = t.check(inp.value);
      inp.classList.toggle('ok', ok); inp.classList.toggle('bad', !ok);
      mem.lab[ok ? 'ok' : 'bad'] = (mem.lab[ok ? 'ok' : 'bad'] || 0) + 1; save();
      $('#fb', root).innerHTML = '<div class="fb ' + (ok ? 'ok' : 'bad') + '"><b>' + esc(ok ? ui('correct') : ui('wrong')) + '</b><br>' + esc(ui('solution')) + ': <span class="mono">' + esc(t.solution) + '</span>' + (t.explain ? '<br><span class="muted">' + esc(t.explain(ui, lb)) + '</span>' : '') + '</div>';
    }
    $('#chk', root).onclick = check;
    inp.onkeydown = function (e) { if (e.key === 'Enter') check(); };
    $('#new', root).onclick = function () { labTask(root, type); };
  }

  /* ---------- exam (Probearbeit) ---------- */
  function pExam() {
    after = function () {
      $('#go').onclick = function () {
        var pool = [];
        chapters().forEach(function (ch) { pool = pool.concat(shuffle(ch.quiz).slice(0, 3)); });
        var qs = shuffle(pool);
        var root = $('#ex'); $('#exIntro').style.display = 'none';
        runQuiz(root, qs, function (s, n, w) {
          // part 2: generated tasks
          var types = ['comp', 'trans', 'transl'], k = 0, s2 = 0;
          function gen() {
            if (k >= types.length) return part3();
            var t = G.task(types[k], lang), lb = lab();
            root.innerHTML = '<div class="card"><span class="pill">' + esc(ui('examPart2')) + ' ' + (k + 1) + '/3</span><p class="q">' + esc(t.prompt(ui, lb)) + '</p>' + t.show +
              '<input class="txt mono" id="ans" style="margin-top:10px" autocomplete="off" spellcheck="false" placeholder="' + esc(t.ph || '') + '"><div class="row" style="margin-top:12px"><button class="btn" id="chk">' + esc(ui('check')) + '</button></div><div id="fb"></div></div>';
            $('#chk').onclick = function () {
              var ok = t.check($('#ans').value); if (ok) s2++; else w.push({ q: t.prompt(ui, lb), o: [t.solution], c: 0, e: '' });
              $('#ans').disabled = true;
              $('#fb').innerHTML = '<div class="fb ' + (ok ? 'ok' : 'bad') + '"><b>' + esc(ok ? ui('correct') : ui('wrong')) + '</b> ' + esc(ui('solution')) + ': <span class="mono">' + esc(t.solution) + '</span></div><div class="row" style="margin-top:12px"><button class="btn" id="nx">' + esc(ui('next')) + ' →</button></div>';
              $('#chk').remove(); $('#nx').onclick = function () { k++; gen(); };
            };
          }
          function part3() {
            var open = [];
            chapters().forEach(function (ch) { if (ch.tasks && ch.tasks.length) open.push(ch.tasks[Math.floor(Math.random() * ch.tasks.length)]); });
            root.innerHTML = '<div class="card"><span class="pill">' + esc(ui('examPart3')) + '</span><p class="muted">' + esc(ui('examPart3Intro')) + '</p>' + open.map(function (t, i) {
              return '<div style="margin:16px 0;border-top:1px solid var(--line);padding-top:12px"><p><b>' + (i + 1) + '. ' + t.q + '</b></p><textarea class="txt" rows="3" style="width:100%" aria-label="' + esc(ui('yourAnswer')) + '"></textarea><details><summary class="btn small soft" style="margin-top:6px">' + esc(ui('showSolution')) + '</summary><div class="tip">' + t.a + '</div><label class="row" style="gap:6px"><input type="checkbox" class="self"> ' + esc(ui('iGotIt')) + '</label></details></div>';
            }).join('') + '<button class="btn" id="fin">' + esc(ui('result')) + '</button></div>';
            $('#fin').onclick = function () {
              var s3 = $$('.self').filter(function (c) { return c.checked; }).length;
              var tot = n + 3 + open.length * 2, got = s + s2 + s3 * 2;
              var p = Math.round(got / tot * 100);
              mem.exam = { best: Math.max(p, mem.exam.best || 0), last: p, date: Date.now() }; save();
              root.innerHTML = resultHtml(got, tot, w, '#/exam');
              window.scrollTo(0, 0);
            };
          }
          gen();
        });
      };
    };
    return '<h1>📝 ' + esc(ui('exam')) + '</h1><div id="exIntro" class="card"><p>' + esc(ui('examIntro')) + '</p><ul><li>' + esc(ui('examP1')) + '</li><li>' + esc(ui('examP2')) + '</li><li>' + esc(ui('examP3')) + '</li></ul>' +
      (mem.exam.best != null ? '<p><b>' + esc(ui('best')) + ': ' + mem.exam.best + ' %</b> · ' + esc(ui('last')) + ': ' + mem.exam.last + ' %</p>' : '') +
      '<button class="btn" id="go">▶ ' + esc(ui('examStart')) + '</button></div><div id="ex"></div>' +
      '<h2>📋 ' + esc(ui('checklist')) + '</h2><div class="card">' + (L().checklist || I18N.de.checklist).map(function (c, i) {
        var on = mem.check && mem.check[i];
        return '<label style="display:flex;gap:10px;align-items:flex-start;margin:8px 0"><input type="checkbox" data-c="' + i + '"' + (on ? ' checked' : '') + ' style="margin-top:6px;width:20px;height:20px;accent-color:var(--accent)"> <span>' + esc(c) + '</span></label>';
      }).join('') + '</div>' + checklistBind();
  }
  function checklistBind() {
    var prev = after;
    after = function () {
      if (prev) prev();
      $$('[data-c]').forEach(function (c) { c.onchange = function () { mem.check = mem.check || {}; mem.check[c.getAttribute('data-c')] = c.checked; save(); }; });
    };
    return '';
  }

  /* ---------- legal / settings ---------- */
  function pLegal() { return '<h1>' + esc(ui('legal')) + '</h1><div class="card">' + (L().legal || I18N.de.legal) + '</div>' + (lang !== 'de' ? '<h2>Deutsch (maßgeblich)</h2><div class="card">' + I18N.de.legal + '</div>' : ''); }
  function pSettings() {
    after = function () {
      $('#exp').onclick = function () {
        var b = new Blob([JSON.stringify(mem, null, 1)], { type: 'application/json' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'genetik-fortschritt.json'; a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      };
      $('#imp').onchange = function (e) {
        var f = e.target.files[0]; if (!f) return;
        var r = new FileReader();
        r.onload = function () { try { var d = JSON.parse(r.result); if (d && typeof d === 'object') { localStorage.setItem(KEY, JSON.stringify(d)); mem = load(); toast(ui('imported')); render(); } } catch (x) { toast('✗'); } };
        r.readAsText(f);
      };
      $('#rst').onclick = function () { if (confirm(ui('resetConfirm'))) { var l = mem.lang, t = mem.theme; localStorage.removeItem(KEY); mem = load(); mem.lang = l; mem.theme = t; save(); toast(ui('resetDone')); render(); } };
    };
    return '<h1>⚙️ ' + esc(ui('settings')) + '</h1><div class="card"><h2 style="margin-top:0">💾 ' + esc(ui('memory')) + '</h2><p>' + esc(ui('memoryText')) + '</p>' +
      '<div class="row"><button class="btn soft" id="exp">⬇ ' + esc(ui('export')) + '</button><label class="btn soft">⬆ ' + esc(ui('import')) + '<input type="file" id="imp" accept="application/json" hidden></label><button class="btn ghost" id="rst" style="border-color:var(--bad);color:var(--bad)">' + esc(ui('reset')) + '</button></div></div>';
  }

  /* ---------- boot ---------- */
  applyTheme();
  render.first = true;
  loadLang(lang).then(function () { if (!I18N[lang]) lang = 'de'; applyLang(); if (!location.hash && mem.last) { /* stay on home, offer continue */ } render(); });
})();

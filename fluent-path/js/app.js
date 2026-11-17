/* Fluent Path — interface. Renders every screen from the saved state. */
(function () {
  'use strict';
  var FP = window.FP, D = window.FP_DATA;
  var app = document.getElementById('app');
  var state = FP.load();
  var ui = { ob: null, s: null, summary: null, timer: null, toast: '', q: '' };

  function today() { return FP.dayNum(); }
  function save() { FP.save(state); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function L(code) { return D.langs[code]; }
  function badge(code) { return '<span class="lang-badge" aria-hidden="true">' + code.toUpperCase() + '</span>'; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function span(days) {
    if (days <= 0) return 'done';
    if (days < 14) return plural(days, 'day');
    if (days < 70) return 'about ' + Math.round(days / 7) + ' weeks';
    if (days < 365) return 'about ' + Math.round(days / 30.4) + ' months';
    return 'about ' + (Math.round(days / 36.5) / 10) + ' years';
  }
  function dateIn(days) {
    return new Date(Date.now() + days * 864e5).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function years(y) { return y < 1 ? 'about ' + Math.max(1, Math.round(y * 12)) + ' months' : 'about ' + (Math.round(y * 10) / 10) + ' years'; }

  /* ---------- speech: only voices installed on this device ---------- */
  var Speech = {
    voices: [],
    refresh: function () {
      try { Speech.voices = window.speechSynthesis.getVoices().filter(function (v) { return v.localService; }); } catch (e) { Speech.voices = []; }
    },
    voice: function (lang) {
      var tag = L(lang).tts.toLowerCase(), base = tag.slice(0, 2), exact = null, loose = null;
      Speech.voices.forEach(function (v) {
        var vl = v.lang.replace('_', '-').toLowerCase();
        if (vl === tag && !exact) exact = v;
        if (vl.slice(0, 2) === base && !loose) loose = v;
      });
      return exact || loose;
    },
    has: function (lang) { return !!Speech.voice(lang); },
    say: function (text, lang, slow, onend) {
      var v = Speech.voice(lang);
      if (!v) return;
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.voice = v; u.lang = v.lang; u.rate = slow || state.settings.slow ? 0.65 : 0.92;
        if (onend) { var t0 = Date.now(); u.onend = function () { onend(Date.now() - t0); }; }
        window.speechSynthesis.speak(u);
      } catch (e) { /* speech is optional */ }
    },
    stop: function () { try { window.speechSynthesis.cancel(); } catch (e) { /* optional */ } }
  };
  Speech.refresh();
  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.addEventListener('voiceschanged', function () {
        var had = Speech.voices.length;
        Speech.refresh();
        if (Speech.voices.length !== had && route() !== 'learn' && !ui.ob) render();
      });
    } catch (e) { /* older browsers */ }
  }

  /* ---------- optional self-recording, kept in memory only ---------- */
  var Rec = {
    rec: null, url: null, on: false, error: '',
    supported: function () { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder); },
    clear: function () { if (Rec.url) URL.revokeObjectURL(Rec.url); Rec.url = null; Rec.error = ''; },
    toggle: function (done) {
      if (Rec.on) { Rec.rec.stop(); return; }
      Rec.clear();
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        var chunks = [];
        Rec.rec = new MediaRecorder(stream);
        Rec.rec.ondataavailable = function (e) { chunks.push(e.data); };
        Rec.rec.onstop = function () {
          stream.getTracks().forEach(function (t) { t.stop(); });
          Rec.on = false;
          Rec.url = URL.createObjectURL(new Blob(chunks, { type: Rec.rec.mimeType || 'audio/webm' }));
          done();
        };
        Rec.rec.start(); Rec.on = true; done();
      }).catch(function () { Rec.error = 'Microphone not available. You can still practise out loud.'; done(); });
    }
  };

  /* ---------- routing ---------- */
  function route() { return (location.hash.replace(/^#\/?/, '') || 'today').split('/')[0]; }
  function routeArg() { return location.hash.replace(/^#\/?/, '').split('/')[1]; }
  function go(r) { if (location.hash === '#/' + r) render(); else location.hash = '#/' + r; }
  window.addEventListener('hashchange', function () { clearTimeout(ui.timer); if (ui.shadow) { ui.shadow = null; Speech.stop(); } render(); window.scrollTo(0, 0); });

  var NAV = [['today', 'Today', '☀️'], ['plan', 'Plan', '🗺️'], ['library', 'Library', '📖'], ['progress', 'Progress', '📈'], ['settings', 'Settings', '⚙️']];
  function shell(r, html) {
    var nav = NAV.map(function (n) {
      return '<a href="#/' + n[0] + '"' + (n[0] === r ? ' class="on" aria-current="page"' : '') + '><span class="nav-ico" aria-hidden="true">' + n[2] + '</span><span>' + n[1] + '</span></a>';
    }).join('');
    app.innerHTML = '<header class="top"><a class="brand" href="#/today"><img src="icon.svg" alt="" width="28" height="28">Fluent Path</a><nav aria-label="Main">' + nav + '</nav></header>' +
      '<main id="main" class="page" tabindex="-1">' + (FP.storageOk ? '' : '<p class="warn">Your browser is blocking storage, so progress cannot be saved here. Allow site data for this page to keep your lessons.</p>') + html + '</main>' +
      (ui.toast ? '<div class="toast" role="status">' + esc(ui.toast) + '</div>' : '');
    if (ui.toast) { ui.toast = ''; setTimeout(function () { var t = document.querySelector('.toast'); if (t) t.remove(); }, 3500); }
  }

  function render() {
    if (!state.profile || ui.ob) { renderOnboarding(); return; }
    var r = route();
    if (r === 'learn') { renderLearn(); return; }
    var pages = { today: pageToday, plan: pagePlan, library: pageLibrary, progress: pageProgress, settings: pageSettings };
    if (!pages[r]) r = 'today';
    shell(r, pages[r]());
    if (r === 'library' && ui.q) applySearch();
    if (r === 'library' && routeArg()) {
      var d = document.getElementById('unit-' + routeArg());
      if (d) { fillUnit(d); d.open = true; d.scrollIntoView(); }
    }
  }

  /* ================= ONBOARDING ================= */
  function guessLang() {
    var n = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return FP.WORLD.some(function (w) { return w[0] === n; }) ? n : 'en';
  }
  function startOnboarding(adding) {
    ui.ob = adding
      ? { step: 2, adding: true, known: state.profile.known, targets: [], support: state.profile.support, supportTouched: true, minutes: course().minutes, mode: course().mode }
      : { step: 0, known: [{ lang: guessLang(), level: 'native', write: true }], targets: [], support: null, minutes: 15, mode: 'both', modeTouched: false };
  }
  function obSupportChoices() {
    var o = ui.ob;
    return FP.courseLangs().filter(function (l) { return o.targets.indexOf(l) < 0 && !(o.adding && state.courses[l]); });
  }
  function obFix() {
    var o = ui.ob;
    if (!o.support || o.targets.indexOf(o.support) >= 0 || !o.supportTouched) o.support = FP.bestSupport(o.known, o.targets);
    var ch = obSupportChoices(); if (ch.length && ch.indexOf(o.support) < 0) o.support = ch[0];
    if (!o.modeTouched && !o.adding) o.mode = o.known.some(function (k) { return k.write; }) ? 'both' : 'speak';
  }
  var OB_TITLES = ['Welcome', 'Languages you know', 'Languages to learn', 'Your pace', 'Skills', 'Your plan'];

  function renderOnboarding() {
    if (!ui.ob) startOnboarding(false);
    var o = ui.ob, body = '', next = 'Continue', canNext = true, hint = '';
    obFix();
    if (o.step === 0) {
      body = '<div class="hero"><img src="icon.svg" alt="" width="72" height="72"><h1>Learn a language,<br>a little every day.</h1>' +
        '<p class="lead">Fluent Path builds a daily plan around you, teaches in short focused sessions and brings every word back just before you would forget it.</p>' +
        '<ul class="ticks"><li>Works offline — the whole course lives on this device</li><li>Your progress is saved automatically in this browser</li><li>No account, no ads, nothing sent anywhere</li></ul>' +
        '<p class="muted">Five quick questions first, about one minute.</p></div>';
      next = 'Get started';
    } else if (o.step === 1) {
      body = '<h1>Which languages can you speak?</h1><p class="lead">Include your native language. This sets the language used for explanations and lets us speed things up when languages are related.</p><div class="known">' +
        o.known.map(function (k, i) {
          return '<fieldset class="known-row"><legend class="sr">Language ' + (i + 1) + '</legend>' +
            '<label><span>Language</span><select data-on="known" data-i="' + i + '" data-f="lang">' + FP.WORLD.map(function (w) { return '<option value="' + w[0] + '"' + (w[0] === k.lang ? ' selected' : '') + '>' + w[1] + '</option>'; }).join('') + '</select></label>' +
            '<label><span>Level</span><select data-on="known" data-i="' + i + '" data-f="level">' + FP.LEVELS.map(function (l) { return '<option value="' + l.id + '"' + (l.id === k.level ? ' selected' : '') + '>' + l.label + '</option>'; }).join('') + '</select></label>' +
            '<label class="check"><input type="checkbox" data-on="known" data-i="' + i + '" data-f="write"' + (k.write ? ' checked' : '') + '><span>I can write it too</span></label>' +
            (o.known.length > 1 ? '<button class="icon-btn" data-act="ob-del" data-i="' + i + '" aria-label="Remove this language">✕</button>' : '') + '</fieldset>';
        }).join('') + '</div><button class="btn ghost" data-act="ob-add">＋ Add another language</button>';
      var dup = o.known.map(function (k) { return k.lang; }).filter(function (l, i, a) { return l !== 'other' && a.indexOf(l) !== i; });
      if (dup.length) { canNext = false; hint = FP.worldName(dup[0]) + ' is listed twice.'; }
    } else if (o.step === 2) {
      var have = o.adding ? Object.keys(state.courses) : [];
      body = '<h1>' + (o.adding ? 'Add a language' : 'What do you want to learn?') + '</h1><p class="lead">Pick one or more. Starting with one is the fastest route; you can add others later.</p><div class="cards pick-lang">' +
        FP.courseLangs().map(function (l) {
          var k = o.known.filter(function (x) { return x.lang === l; })[0], lvl = k ? FP.levelRank(k.level) : 0;
          var off = lvl >= 5 || have.indexOf(l) >= 0, on = o.targets.indexOf(l) >= 0;
          var sub = have.indexOf(l) >= 0 ? 'Already in your courses' : lvl >= 5 ? 'You already speak this' : lvl ? 'We will skip what you know' : L(l).native;
          return '<button class="card pick' + (on ? ' on' : '') + '" data-act="ob-target" data-l="' + l + '" aria-pressed="' + on + '" aria-label="' + L(l).name + ' — ' + sub + '"' + (off ? ' disabled' : '') + '>' + badge(l) + '<strong>' + L(l).name + '</strong><small>' + sub + '</small></button>';
        }).join('') + '</div>';
      if (o.targets.length) {
        var ch = obSupportChoices();
        body += '<label class="inline-field"><span>Show translations in</span><select data-on="ob-support">' + ch.map(function (l) { return '<option value="' + l + '"' + (l === o.support ? ' selected' : '') + '>' + L(l).name + '</option>'; }).join('') + '</select></label>';
      }
      if (o.targets.length > 1) body += '<p class="note">Learning ' + o.targets.length + ' languages at once splits your attention. Your daily time applies to each language.</p>';
      canNext = o.targets.length > 0; if (!canNext) hint = 'Choose at least one language.';
    } else if (o.step === 3) {
      var t0 = o.targets[0], hrs = FP.fluencyHours(t0, o.known), bst = FP.boost(t0, o.known);
      body = '<h1>How quickly do you want to learn?</h1><p class="lead">Choose the time you can keep up <em>every day</em>. A small daily habit beats long, irregular sessions.</p><div class="cards pace">' +
        FP.PACES.map(function (p) {
          var npd = FP.newPerDay(p.min, bst), on = o.minutes === p.min;
          return '<button class="card pick' + (on ? ' on' : '') + '" data-act="ob-pace" data-m="' + p.min + '" aria-pressed="' + on + '"><strong>' + p.min + ' min <span class="muted">a day</span></strong><span class="pace-name">' + p.label + '</span><small>' + npd + ' new items a day</small><small>Course: ' + span(Math.ceil(FP.totalItems() / npd)).replace('about ', '~') + '</small></button>';
        }).join('') + '</div>' +
        '<p class="note"><strong>Why 10 minutes is the minimum:</strong> below that, you forget faster than you learn, and reviews crowd out anything new.</p>' +
        '<p class="note">For scale: reaching confident conversation in ' + L(t0).name + ' takes roughly ' + hrs + ' hours of practice for someone with your background. At ' + o.minutes + ' minutes a day that is ' + years(hrs / (o.minutes / 60) / 365) + '. More minutes a day shortens it directly.' + (bst > 1 ? ' Because you already speak a related language, new material comes ' + Math.round((bst - 1) * 100) + '% faster.' : '') + '</p>';
    } else if (o.step === 4) {
      var noWrite = !o.known.some(function (k) { return k.write; });
      body = '<h1>Speaking only, or speaking and writing?</h1><p class="lead">Both include listening and understanding. You can change this at any time.</p><div class="cards mode">' +
        '<button class="card pick' + (o.mode === 'both' ? ' on' : '') + '" data-act="ob-mode" data-m="both" aria-pressed="' + (o.mode === 'both') + '"><span class="big-ico" aria-hidden="true">🗣️✍️</span><strong>Speak and write</strong><small>Adds spelling, typing answers and dictation. Slower per word, but you remember more and can read and message people.</small></button>' +
        '<button class="card pick' + (o.mode === 'speak' ? ' on' : '') + '" data-act="ob-mode" data-m="speak" aria-pressed="' + (o.mode === 'speak') + '"><span class="big-ico" aria-hidden="true">🗣️</span><strong>Speak only</strong><small>No typing at all. You listen, choose, build sentences by tapping, and say answers out loud.</small></button></div>' +
        (noWrite && !o.adding ? '<p class="note">You said you do not write in the languages you know, so “Speak only” is selected. Nothing in it needs a keyboard.</p>' : '');
    } else {
      body = obPlanHtml(); next = o.adding ? 'Add to my courses' : 'Start my first lesson';
    }
    var n = OB_TITLES.length, first = o.adding ? 2 : 0;
    app.innerHTML = '<main id="main" class="page onboarding" tabindex="-1">' +
      (o.step > first || o.adding ? '<div class="ob-top"><button class="btn ghost" data-act="ob-back">← ' + (o.step === first ? 'Cancel' : 'Back') + '</button>' +
        '<div class="steps" role="progressbar" aria-valuemin="1" aria-valuemax="' + n + '" aria-valuenow="' + (o.step + 1) + '" aria-label="Step ' + (o.step + 1) + ' of ' + n + '">' +
        OB_TITLES.map(function (t, i) { return '<i class="' + (i <= o.step ? 'on' : '') + '"></i>'; }).join('') + '</div></div>' : '') +
      body + '<div class="ob-actions">' + (hint ? '<p class="hint" role="alert">' + esc(hint) + '</p>' : '') +
      '<button class="btn primary big" data-act="ob-next"' + (canNext ? '' : ' disabled') + '>' + next + '</button></div></main>';
  }

  function obPlanHtml() {
    var o = ui.ob, html = '<h1>Your plan</h1>';
    o.targets.forEach(function (t) {
      var bst = FP.boost(t, o.known), npd = FP.newPerDay(o.minutes, bst), skip = FP.placementUnit(t, o.known);
      var left = FP.totalItems() - FP.itemsFrom(0, skip - 1), days = Math.ceil(left / npd), cur = 0;
      html += '<section class="card plan-card"><h2>' + badge(t) + ' ' + L(t).name + '</h2>' +
        '<p><strong>' + o.minutes + ' minutes every day</strong> · ' + npd + ' new items a day · ' + (o.mode === 'both' ? 'speaking and writing' : 'speaking only') + ' · explained in ' + L(o.support).name + '</p>' +
        (skip ? '<p class="note">You already know some ' + L(t).name + ', so you start at unit ' + (skip + 1) + ' (' + D.units[Math.min(skip, D.units.length - 1)].title + '). Earlier material returns as quick reviews to confirm it.</p>' : '') +
        '<ol class="phases">' + FP.PHASES.map(function (p) {
          var l = 0;
          for (var u = p.units[0]; u <= p.units[1]; u++) if (u >= skip) l += FP.unitSize(u);
          var len = Math.ceil(l / npd); cur += len;
          return '<li class="' + (l ? '' : 'done') + '"><strong>' + p.name + '</strong><span class="when">' + (l ? 'by ' + dateIn(cur) : 'already known') + '</span><p>' + p.can + '</p></li>';
        }).join('') +
        '<li><strong>Make it stick</strong><span class="when">ongoing</span><p>Short daily reviews move everything into long-term memory while you practise speaking and listening at full speed.</p></li></ol>' +
        '<p class="muted">Course complete in ' + span(days) + ' if you study every day.</p>' +
        (Speech.has(t) ? '' : voiceHelp(t)) + '</section>';
    });
    html += '<section class="card"><h2>What a daily session looks like</h2><ol class="routine"><li><strong>Review</strong> what is about to fade — the most valuable minutes of the day.</li><li><strong>Meet</strong> a few new words and sentences, with sound.</li><li><strong>Practise</strong> them: recognise, choose, build' + (o.mode === 'both' ? ', type' : '') + ' and say them out loud.</li><li><strong>Recall</strong> everything new from memory before you finish.</li></ol>' +
      '<p class="muted">Being honest about fluency: this course takes you through ' + FP.totalItems() + ' words and sentences, from first greetings to varied everyday conversation, and builds the habit to keep going. Full fluency takes hundreds of hours — the plan page always shows how far you are.</p></section>';
    return html;
  }
  function voiceHelp(t) {
    return '<details class="voice"' + (state.settings.voiceSeen ? '' : ' open') + '><summary>🔈 Audio is off: this device has no offline ' + L(t).name + ' voice yet</summary><p>Lessons still work without sound, but hearing the language helps a lot. Fluent Path never uses online voices, so add the ' + L(t).name + ' voice to your device once:</p><ul><li><strong>Windows:</strong> Settings → Time &amp; language → Speech → Add voices</li><li><strong>Mac:</strong> System Settings → Accessibility → Spoken Content → System voice → Manage voices</li><li><strong>iPhone / iPad:</strong> Settings → Accessibility → Spoken Content → Voices</li><li><strong>Android:</strong> Settings → Accessibility → Text-to-speech → install voice data</li></ul><p>Then close and reopen your browser.</p><p><button class="btn" data-act="voice-check">Check for the voice again</button> <button class="btn ghost" data-act="voice-hide">Continue without sound</button></p></details>';
  }

  function obFinish() {
    var o = ui.ob, t = today();
    if (!o.adding) state.profile = { known: o.known.map(function (k) { return { lang: k.lang, level: k.level, write: !!k.write }; }), support: o.support, created: t };
    else state.profile.support = o.support;
    o.targets.forEach(function (l) {
      var c = FP.newCourse(o.minutes, o.mode, t);
      FP.skipUnits(c, FP.placementUnit(l, state.profile.known), t);
      state.courses[l] = c;
    });
    state.active = o.targets[0];
    var adding = o.adding;
    ui.ob = null; save();
    if (adding) { ui.toast = 'Course added.'; go('today'); } else startSession(false);
  }

  /* ================= TODAY ================= */
  function course() { return state.courses[state.active]; }
  function courseDone(lang) { var d = state.days[today()]; return !!(d && d.c && d.c[lang]); }

  function pageToday() {
    var lang = state.active, c = course(), t = today(), st = FP.stats(c, t), sp = FP.sessionPlan(state, lang, t, false);
    var streak = FP.streak(state, t), ses = state.session && state.session.lang === lang && state.session.day === t ? state.session : null;
    var langs = Object.keys(state.courses), html = '';
    if (langs.length > 1) html += '<div class="course-tabs" role="tablist" aria-label="Your courses">' + langs.map(function (l) {
      return '<button role="tab" aria-selected="' + (l === lang) + '" class="' + (l === lang ? 'on' : '') + '" data-act="course" data-l="' + l + '">' + badge(l) + L(l).name + (courseDone(l) ? ' ✓' : '') + '</button>';
    }).join('') + '</div>';
    html += '<div class="today-head"><div><p class="eyebrow">' + new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) + '</p><h1>' + L(lang).name + '</h1></div>' +
      '<div class="streak" title="Days in a row with a finished session"><span aria-hidden="true">🔥</span><strong>' + streak + '</strong><small>day streak</small></div></div>';

    var done = courseDone(lang), cta = '';
    if (ses) {
      var pct = Math.round(ses.i / ses.steps.length * 100);
      cta = '<h2>Pick up where you stopped</h2><p>You are ' + pct + '% through ' + (ses.extra ? 'an extra practice' : "today's session") + '.</p><div class="bar"><i style="width:' + pct + '%"></i></div><button class="btn primary big" data-act="start">Continue</button>';
    } else if (done) {
      var more = FP.sessionPlan(state, lang, t, true);
      cta = '<h2>Done for today ✓</h2><p>Come back tomorrow — spacing your practice is what makes it stick.' + (st.remaining === 0 ? ' You have met every item in the course; reviews keep it alive.' : '') + '</p>' +
        (more.reviews.length || more.newIds.length ? '<button class="btn" data-act="extra">Extra practice (' + (more.newIds.length ? more.newIds.length + ' new' : more.reviews.length + ' reviews') + ', ~' + more.minutes + ' min)</button>' : '');
    } else if (!sp.reviews.length && !sp.newIds.length) {
      cta = '<h2>Nothing due today</h2><p>Everything is fresh in memory. A short practice of your weakest items still helps.</p><button class="btn primary big" data-act="extra">Practise anyway</button>';
    } else {
      var first = !st.learned;
      cta = '<h2>' + (first ? 'Your first lesson' : "Today's session") + '</h2><p class="session-meta"><span><strong>' + sp.reviews.length + '</strong> to review</span><span><strong>' + sp.newIds.length + '</strong> new</span><span>about <strong>' + sp.minutes + '</strong> min</span></p>' +
        (sp.backlog > FP.reviewCap(c.minutes) ? '<p class="note">You have ' + sp.backlog + ' reviews waiting, so today focuses on catching up' + (sp.newIds.length ? ' with fewer new items.' : ' — no new items until the pile shrinks.') + '</p>' : '') +
        '<button class="btn primary big" data-act="start">' + (first ? 'Start learning' : 'Start session') + '</button>' +
        (sp.reviews.length && sp.newIds.length ? '<button class="btn ghost wide" data-act="light">Short on time? Reviews only (~' + Math.max(1, Math.round(Math.min(20, sp.reviews.length) * 12 / 60)) + ' min)</button>' : '');
    }
    html += '<section class="card cta">' + cta + '</section>';
    if (!Speech.has(lang)) html += voiceHelp(lang);

    html += '<section class="tiles"><div class="tile"><strong>' + st.learned + '</strong><span>of ' + st.total + ' learned</span></div><div class="tile"><strong>' + st.mature + '</strong><span>in long-term memory</span></div><div class="tile"><strong>' + st.due + '</strong><span>due for review</span></div></section>';

    var cur = FP.currentUnit(c), n = D.units.length, from = Math.max(0, Math.min(cur - 1, n - 6)), to = Math.min(n - 1, from + 5);
    var ph = FP.PHASES[FP.phaseOf(Math.min(cur, n - 1))];
    html += '<h2 class="section-title">Your path <small class="muted">' + (cur < n ? 'unit ' + (cur + 1) + ' of ' + n + ' · ' + ph.name : 'all ' + n + ' units met') + '</small></h2><ol class="path">';
    for (var i = from; i <= to; i++) {
      var u = D.units[i], p = FP.unitProgress(c, i), pct = Math.round(p.learned / p.total * 100);
      var cls = p.learned === p.total ? 'done' : i === cur ? 'current' : p.learned ? 'started' : 'ahead';
      html += '<li class="' + cls + '"><a href="#/library/' + i + '"><span class="u-ico" aria-hidden="true">' + u.icon + '</span><span class="u-main"><strong>' + (i + 1) + '. ' + esc(u.title) + '</strong><small>' + esc(u.goal) + '</small><span class="bar thin"><i style="width:' + pct + '%"></i></span></span><span class="u-state">' + (cls === 'done' ? '✓' : cls === 'current' ? 'Now' : pct ? pct + '%' : '') + '</span></a></li>';
    }
    html += '</ol><p><a class="btn ghost wide" href="#/library">See all ' + n + ' units in the Library</a></p>';
    return html;
  }

  /* ================= PLAN ================= */
  function pagePlan() {
    var lang = state.active, c = course(), t = today(), p = FP.plan(state, lang, t);
    var html = '<h1>Your plan for ' + L(lang).name + '</h1><p class="lead">' + c.minutes + ' minutes every day · ' + p.newPerDay + ' new items a day · ' + (c.mode === 'both' ? 'speaking and writing' : 'speaking only') + '</p>';
    html += '<section class="card"><h2>The road to fluency</h2><ol class="phases">' + p.phases.map(function (ph) {
      var doneN = ph.total - ph.left, pct = Math.round(doneN / ph.total * 100);
      return '<li class="' + (ph.done ? 'done' : '') + '"><strong>' + ph.name + '</strong><span class="when">' + (ph.done ? 'complete ✓' : 'by ' + dateIn(ph.endIn)) + '</span><p>' + ph.can + '</p><div class="bar thin"><i style="width:' + pct + '%"></i></div><small class="muted">Units ' + (ph.units[0] + 1) + '–' + (ph.units[1] + 1) + ' · ' + doneN + ' of ' + ph.total + ' items</small></li>';
    }).join('') + '<li class="' + (p.stats.remaining === 0 && p.stats.young === 0 ? 'done' : '') + '"><strong>Make it stick</strong><span class="when">' + (p.stats.remaining ? 'from ' + dateIn(p.daysLeft) : 'now') + '</span><p>Daily reviews at growing intervals move every item into long-term memory, with speaking and listening at natural speed.</p><div class="bar thin"><i style="width:' + Math.round(p.stats.mature / p.stats.total * 100) + '%"></i></div><small class="muted">' + p.stats.mature + ' of ' + p.stats.total + ' items in long-term memory</small></li></ol>' +
      '<p>' + (p.stats.remaining ? 'At this pace you finish the course on <strong>' + dateIn(p.daysLeft) + '</strong> (' + span(p.daysLeft) + ' of daily study).' : 'You have met every item in the course.') + '</p></section>';

    html += '<section class="card"><h2>Change your pace</h2><p class="muted">Minimum ' + FP.MIN_MINUTES + ' minutes a day. Changes apply from your next session.</p><div class="cards pace small">' + FP.PACES.map(function (pc) {
      var npd = FP.newPerDay(pc.min, p.boost), on = c.minutes === pc.min;
      return '<button class="card pick' + (on ? ' on' : '') + '" data-act="pace" data-m="' + pc.min + '" aria-pressed="' + on + '"><strong>' + pc.min + ' min</strong><small>' + npd + ' new a day</small><small>' + (p.stats.remaining ? 'done ' + dateIn(Math.ceil(p.stats.remaining / npd)) : pc.label) + '</small></button>';
    }).join('') + '</div></section>';

    html += '<section class="card"><h2>How far is fluency?</h2><p>Reaching confident conversation in ' + L(lang).name + ' takes roughly <strong>' + p.fluencyHours + ' hours</strong> of practice for someone with your language background. At ' + c.minutes + ' minutes a day that is <strong>' + years(p.fluencyYears) + '</strong>; at 60 minutes a day, ' + years(p.fluencyHours / 365) + '.</p>' +
      '<p>This course holds ' + FP.totalItems() + ' words and sentences (about ' + p.libraryHours + ' hours of practice including reviews): a core of essential vocabulary, then thousands of real sentences written and translated by the Tatoeba community. After that, keep the daily reviews going and use extra practice to push speed and confidence.</p>' +
      '<p class="muted">These are estimates, not promises. Studying every day matters more than any number here.</p></section>';

    html += '<section class="card"><h2>Why this works</h2><ul class="ticks"><li><strong>Spaced repetition:</strong> each item returns after 1, 3, 7, 16, 37 … days — just before you would forget it.</li><li><strong>Recall, not re-reading:</strong> you produce answers from memory, which builds much stronger memories than recognising them.</li><li><strong>Mistakes come back:</strong> anything you miss returns in the same session and again the next day.</li><li><strong>Small steps:</strong> three new items at a time, used immediately in sentences.</li></ul></section>';
    return html;
  }

  /* ================= LIBRARY ================= */
  function strength(card) {
    if (!card) return '<span class="dot s0" title="Not started"></span>';
    var s = card.iv >= 21 ? 3 : card.iv >= 7 ? 2 : 1;
    return '<span class="dot s' + s + '" title="' + ['', 'Learning', 'Familiar', 'Long-term memory'][s] + '"></span>';
  }
  function noteHtml(n) {
    var html = '<div class="gnote"><h4>💡 ' + esc(n.title) + '</h4>', list = [];
    function flush() { if (list.length) { html += '<ul>' + list.join('') + '</ul>'; list = []; } }
    n.lines.forEach(function (line) {
      if (line.indexOf('• ') === 0) list.push('<li>' + esc(line.slice(2)) + '</li>');
      else if (line.indexOf(' = ') > 0) { flush(); var k = line.indexOf(' = '); html += '<p class="pair"><b>' + esc(line.slice(0, k)) + '</b><span>' + esc(line.slice(k + 3)) + '</span></p>'; }
      else { flush(); html += '<p>' + esc(line) + '</p>'; }
    });
    flush();
    return html + '</div>';
  }
  function pageLibrary() {
    var lang = state.active, sup = state.profile.support, c = course(), audio = Speech.has(lang);
    var html = '<h1>' + L(lang).name + ' library</h1><p class="lead">Everything in your course, stored on this device. ' + (audio ? 'Tap any line to hear it.' : '') + '</p>' +
      '<label class="search"><span class="sr">Search the library</span><input type="search" placeholder="Search words and sentences…" data-on="search" value="' + esc(ui.q) + '" autocomplete="off"></label>' +
      '<p class="legend"><span class="dot s0"></span>not started <span class="dot s1"></span>learning <span class="dot s2"></span>familiar <span class="dot s3"></span>long-term</p>';
    if (D.sounds[lang]) html += '<details class="unit"><summary><span class="u-ico" aria-hidden="true">👂</span><span class="u-main"><strong>How ' + L(lang).name + ' sounds</strong><small>Pronunciation rules worth knowing early</small></span></summary><div class="gnote">' + D.sounds[lang].map(function (r) { return '<p class="pair"><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></p>'; }).join('') + '</div></details>';
    FP.PHASES.forEach(function (ph) {
      html += '<h2 class="section-title lib-phase">' + esc(ph.name) + ' <small class="muted">units ' + (ph.units[0] + 1) + '–' + (ph.units[1] + 1) + '</small></h2>';
      for (var i = ph.units[0]; i <= ph.units[1]; i++) {
        var u = D.units[i], p = FP.unitProgress(c, i);
        html += '<details class="unit" id="unit-' + i + '" data-u="' + i + '"><summary><span class="u-ico" aria-hidden="true">' + u.icon + '</span><span class="u-main"><strong>' + (i + 1) + '. ' + esc(u.title) + '</strong><small>' + esc(u.goal) + ' · ' + p.learned + '/' + p.total + '</small></span></summary><div class="unit-body"></div></details>';
      }
    });
    html += '<p class="muted empty" hidden>No matches.</p>';
    if (D.credits && D.credits.length) html += '<section class="card credits"><h2>Where the material comes from</h2><p>Units 1–20 were written for Fluent Path. ' + D.credits.map(function (cr) {
      return 'The ' + cr.items + ' sentences in the later units come from <a href="' + cr.url + '" rel="noopener">' + cr.name + '</a>, a collection of sentences and translations written by volunteers, used under the <a href="' + cr.licenseUrl + '" rel="noopener">' + cr.license + '</a> licence. Each sentence’s Tatoeba number is listed in data/tatoeba/SOURCES.tsv.';
    }).join(' ') + ' Everything is stored on this device; nothing is fetched while you learn.</p></section>';
    return html;
  }
  function libRow(lang, sup, c, audio, id) {
    var it = FP.item(lang, id), me = FP.item(sup, id);
    return '<li><button class="row" data-act="say-item" data-id="' + id + '"' + (audio ? '' : ' disabled') + '><span class="t" lang="' + lang + '">' + esc(it.text) + '</span><span class="m">' + esc(me.text) + '</span>' + strength(c.cards[id]) + '</button></li>';
  }
  /* Unit contents are built only when a unit is opened (or matches a search), so the page stays light with 170 units. */
  function fillUnit(d, only) {
    var i = +d.getAttribute('data-u'), lang = state.active, sup = state.profile.support, c = course(), audio = Speech.has(lang), p = FP.unitProgress(c, i);
    var ids = only || FP.unitIds(i), body = d.querySelector('.unit-body');
    var w = ids.filter(function (id) { return id.charAt(0) === 'w'; }), s = ids.filter(function (id) { return id.charAt(0) === 's'; });
    var row = function (id) { return libRow(lang, sup, c, audio, id); };
    body.innerHTML = (!only && D.notes[lang] && D.notes[lang][i] ? noteHtml(D.notes[lang][i]) : '') +
      (w.length ? '<h4 class="list-h">Words</h4><ul class="items">' + w.map(row).join('') + '</ul>' : '') +
      (s.length ? '<h4 class="list-h">Sentences</h4>' + (audio && !only ? '<button class="btn" data-act="shadow" data-u="' + i + '">▶ Listen and repeat</button><p class="muted">Plays each sentence and leaves a pause for you to say it back.</p>' : '') + '<ul class="items">' + s.map(row).join('') + '</ul>' : '') +
      (!only && p.learned < p.total ? '<button class="btn ghost" data-act="skip-unit" data-u="' + i + '">I already know this unit</button>' : '');
    d.setAttribute('data-filled', only ? 'search' : 'all');
  }
  var searchIndex = null;
  function applySearch() {
    var q = FP.fold(ui.q), lang = state.active, sup = state.profile.support, any = false;
    if (q && (!searchIndex || searchIndex.key !== lang + sup)) {
      searchIndex = { key: lang + sup, rows: FP.order().map(function (id) { return [id, FP.fold(FP.item(lang, id).text + ' ' + FP.item(sup, id).text)]; }) };
    }
    var hits = {};
    if (q.length >= 2) searchIndex.rows.forEach(function (r) { if (r[1].indexOf(q) >= 0) { var u = +r[0].slice(1).split('_')[0]; (hits[u] = hits[u] || []).push(r[0]); } });
    document.querySelectorAll('details.unit[data-u]').forEach(function (d) {
      var u = +d.getAttribute('data-u'), h = hits[u];
      if (q.length < 2) {
        d.hidden = false;
        if (d.getAttribute('data-filled') === 'search') { d.open = false; d.querySelector('.unit-body').innerHTML = ''; d.removeAttribute('data-filled'); }
        return;
      }
      d.hidden = !h;
      if (h) { any = true; fillUnit(d, h); d.open = true; }
    });
    document.querySelectorAll('.lib-phase').forEach(function (hd) { hd.hidden = q.length >= 2; });
    var e = document.querySelector('.empty'); if (e) e.hidden = any || q.length < 2;
  }

  /* ================= PROGRESS ================= */
  function pageProgress() {
    var lang = state.active, c = course(), t = today(), st = FP.stats(c, t), streak = FP.streak(state, t);
    var totSec = 0, totSteps = 0, totRight = 0, daysDone = 0;
    Object.keys(state.days).forEach(function (k) { var d = state.days[k]; totSec += d.sec; totSteps += d.steps; totRight += d.right; if (d.done) daysDone++; });
    var acc = totSteps ? Math.round(totRight / totSteps * 100) : 0;
    var html = '<h1>Progress</h1><section class="tiles four"><div class="tile"><strong>🔥 ' + streak + '</strong><span>day streak</span></div><div class="tile"><strong>' + daysDone + '</strong><span>days studied</span></div><div class="tile"><strong>' + (totSec >= 3600 ? (Math.round(totSec / 360) / 10) + ' h' : Math.round(totSec / 60) + ' min') + '</strong><span>time practising</span></div><div class="tile"><strong>' + (totSteps ? acc + '%' : '–') + '</strong><span>answers right</span></div></section>';
    html += '<section class="card"><h2>Last 5 weeks</h2><div class="cal" role="img" aria-label="Study calendar for the last 35 days">';
    var start = t - 34 - ((FP.dayDate(t - 34).getDay() + 6) % 7);
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (d) { html += '<b>' + d + '</b>'; });
    for (var d = start; d <= t + (6 - (FP.dayDate(t).getDay() + 6) % 7); d++) {
      var day = state.days[d], cls = d > t ? 'future' : day && day.done ? 'full' : day && day.steps ? 'part' : '';
      html += '<i class="' + cls + (d === t ? ' now' : '') + '" title="' + FP.dayDate(d).toLocaleDateString() + (day ? ': ' + Math.round(day.sec / 60) + ' min' : '') + '">' + FP.dayDate(d).getDate() + '</i>';
    }
    html += '</div><p class="legend"><span class="sq full"></span>session finished <span class="sq part"></span>some practice</p></section>';
    html += '<section class="card"><h2>' + L(lang).name + ' memory</h2><div class="stack" role="img" aria-label="' + st.mature + ' long-term, ' + st.young + ' learning, ' + st.remaining + ' not started"><i class="s3" style="flex:' + st.mature + '"></i><i class="s1" style="flex:' + st.young + '"></i><i class="s0" style="flex:' + st.remaining + '"></i></div><p class="legend"><span class="dot s3"></span>' + st.mature + ' long-term <span class="dot s1"></span>' + st.young + ' learning <span class="dot s0"></span>' + st.remaining + ' not started</p>' +
      '<ul class="unit-bars">' + FP.PHASES.map(function (ph) {
        var n = 0, tot = 0;
        for (var i = ph.units[0]; i <= ph.units[1]; i++) { var p = FP.unitProgress(c, i); n += p.learned; tot += p.total; }
        return '<li><span>' + esc(ph.name) + '</span><span class="bar thin"><i style="width:' + Math.round(n / tot * 100) + '%"></i></span><small>' + n + '/' + tot + '</small></li>';
      }).join('') + '</ul></section>';
    return html;
  }

  /* ================= SETTINGS ================= */
  function pageSettings() {
    var lang = state.active, c = course(), s = state.settings, sup = state.profile.support;
    function tog(key, label, hint) { return '<label class="toggle"><input type="checkbox" data-on="set" data-k="' + key + '"' + (s[key] ? ' checked' : '') + '><span><strong>' + label + '</strong><small>' + hint + '</small></span></label>'; }
    var html = '<h1>Settings</h1><section class="card"><h2>' + L(lang).name + ' course</h2>' +
      '<label class="field"><span>Daily time</span><select data-on="minutes">' + FP.PACES.map(function (p) { return '<option value="' + p.min + '"' + (p.min === c.minutes ? ' selected' : '') + '>' + p.min + ' minutes — ' + p.label + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span>Skills</span><select data-on="mode"><option value="both"' + (c.mode === 'both' ? ' selected' : '') + '>Speak and write</option><option value="speak"' + (c.mode === 'speak' ? ' selected' : '') + '>Speak only (no typing)</option></select></label>' +
      '<label class="field"><span>Show translations in</span><select data-on="support">' + FP.courseLangs().filter(function (l) { return !state.courses[l]; }).map(function (l) { return '<option value="' + l + '"' + (l === sup ? ' selected' : '') + '>' + L(l).name + '</option>'; }).join('') + '</select></label></section>';
    html += '<section class="card"><h2>Lessons</h2>' + tog('autoAudio', 'Play audio automatically', 'Hear each new word and answer without tapping.') + tog('slow', 'Slower speech', 'Easier to follow while you are starting out.') + tog('autoNext', 'Move on automatically after a correct answer', 'Saves a tap. Wrong answers always wait for you.') +
      '<label class="field"><span>Appearance</span><select data-on="theme"><option value="auto"' + (s.theme === 'auto' ? ' selected' : '') + '>Match my device</option><option value="light"' + (s.theme === 'light' ? ' selected' : '') + '>Light</option><option value="dark"' + (s.theme === 'dark' ? ' selected' : '') + '>Dark</option></select></label>' +
      (Speech.has(lang) ? '<p class="muted">Audio uses the ' + L(lang).name + ' voice installed on this device.</p>' : voiceHelp(lang)) + '</section>';
    html += '<section class="card"><h2>Your courses</h2><ul class="course-list">' + Object.keys(state.courses).map(function (l) {
      var st = FP.stats(state.courses[l], today());
      return '<li>' + badge(l) + '<span><strong>' + L(l).name + '</strong><small>' + st.learned + ' of ' + st.total + ' learned</small></span>' + (l === lang ? '<em>Active</em>' : '<button class="btn ghost" data-act="course" data-l="' + l + '">Switch</button>') + '</li>';
    }).join('') + '</ul>' + (Object.keys(state.courses).length < FP.courseLangs().length - 1 ? '<button class="btn" data-act="add-course">＋ Add a language</button>' : '') + '</section>';
    html += '<section class="card"><h2>Your data</h2><p class="muted">Progress is saved automatically in this browser on this device. Download a backup to move it to another device or keep it safe.</p><div class="row-btns"><button class="btn" data-act="export">Download backup</button><label class="btn">Restore backup<input type="file" accept="application/json,.json" data-on="import" class="sr"></label><button class="btn danger" data-act="reset">Erase everything</button></div>' +
      '<p class="muted">Fluent Path works offline and never contacts any server. ' + (navigator.onLine === false ? 'You are offline right now — everything still works.' : '') + '</p></section>';
    return html;
  }

  /* ================= LESSON ================= */
  function startSession(extra, light) {
    var t = today(), lang = state.active;
    shadowStop();
    if (!(state.session && state.session.lang === lang && state.session.day === t)) {
      var ses = FP.buildSession(state, lang, t, { audio: Speech.has(lang), extra: extra, light: light });
      if (!ses.steps.length) { ui.toast = 'Nothing to practise right now.'; go('today'); return; }
      state.session = ses; save();
    }
    ui.summary = null; ui.s = null;
    go('learn');
  }
  function shadowStop() {
    if (!ui.shadow) return;
    ui.shadow = null; Speech.stop();
    document.querySelectorAll('.row.playing').forEach(function (r) { r.classList.remove('playing'); });
    document.querySelectorAll('[data-act="shadow"]').forEach(function (b) { b.textContent = '▶ Listen and repeat'; });
  }
  function initStep() {
    var ses = state.session, step = ses.steps[ses.i];
    ui.s = { phase: 'ask', t0: Date.now(), i: ses.i, picked: null, result: null, revealed: false, played: false };
    Rec.clear();
    if (step.t === 'build') {
      var it = FP.item(ses.lang, step.id), tiles = FP.tiles(it.text), extra = [];
      var other = FP.unitIds(it.unit).filter(function (id) { return id.charAt(0) === 's' && id !== step.id; });
      FP.shuffle(other).slice(0, 2).forEach(function (id) { FP.tiles(FP.item(ses.lang, id).text).forEach(function (w) { if (tiles.indexOf(w) < 0 && extra.indexOf(w) < 0 && extra.length < 3) extra.push(w); }); });
      ui.s.bank = FP.shuffle(tiles.concat(extra)); ui.s.built = [];
    }
    if (step.t === 'match') {
      ui.s.left = FP.shuffle(step.ids.slice()); ui.s.right = FP.shuffle(step.ids.slice()); ui.s.matched = {}; ui.s.sel = null; ui.s.bad = null;
    }
  }
  function sayStep(slow) {
    var ses = state.session; if (!ses) return;
    var step = ses.steps[ses.i]; if (!step || !step.id) return;
    Speech.say(FP.item(ses.lang, step.id).say, ses.lang, slow);
  }

  function exampleHtml(lang, sup, id) {
    var ex = FP.example(lang, id);
    return ex ? '<p class="example"><span lang="' + lang + '">' + esc(FP.item(lang, ex).text) + '</span><small>' + esc(FP.item(sup, ex).text) + '</small></p>' : '';
  }
  var ASK = { choose: 'What does this mean?', listen: 'Listen. What does it mean?', pick: 'How do you say this in {L}?', build: 'Build this sentence in {L}', type: 'Type this in {L}', dictate: 'Type what you hear', speak: 'Say this out loud in {L}', match: 'Match the pairs' };

  function renderLearn() {
    var ses = state.session;
    if (ui.summary) { renderSummary(); return; }
    if (!ses || ses.day !== today()) { state.session = null; go('today'); return; }
    if (!ui.s || ui.s.i !== ses.i) initStep();
    var step = ses.steps[ses.i], s = ui.s, lang = ses.lang, sup = state.profile.support, audio = Speech.has(lang);
    var it = step.id ? FP.item(lang, step.id) : null, me = step.id ? FP.item(sup, step.id) : null;
    var pct = Math.round(ses.i / ses.steps.length * 100), fb = s.phase === 'feedback';
    var tag = step.t === 'note' || step.t === 'tip' ? 'Tip' : step.retry ? 'Once more' : step.rev ? 'Review' : step.t === 'intro' ? 'New' : 'Practice';
    var sayBtn = audio ? '<button class="say" data-act="say" aria-label="Play audio" title="Play (Space)">🔊</button>' : '';
    var slowBtn = audio ? '<button class="say small" data-act="say-slow" aria-label="Play slowly" title="Play slowly">🐢</button>' : '';
    var body = '', foot = '';

    function options(field) {
      return '<div class="opts">' + step.opts.map(function (id, n) {
        var o = FP.item(field === 'm' ? sup : lang, id), cls = '';
        if (fb) cls = id === step.id ? ' right' : id === s.picked ? ' wrong' : ' dim';
        return '<button class="opt' + cls + '" data-act="opt" data-id="' + id + '"' + (fb ? ' disabled' : '') + (field === 't' ? ' lang="' + lang + '"' : '') + '><kbd>' + (n + 1) + '</kbd><span>' + esc(o.text) + '</span></button>';
      }).join('') + '</div>';
    }
    function keys() {
      var k = L(lang).keys; if (!k) return '';
      return '<div class="keys" aria-label="Special characters">' + k.map(function (ch) { return '<button type="button" data-act="key" data-ch="' + ch + '" tabindex="-1">' + ch + '</button>'; }).join('') + '</div>';
    }
    function input(ph) {
      return '<input class="answer"' + (fb ? '' : ' data-focus') + ' type="text" lang="' + lang + '" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="' + ph + '"' + (fb ? ' disabled value="' + esc(s.input || '') + '"' : '') + ' aria-label="Your answer">' + (fb ? '' : keys());
    }
    var ask = ASK[step.t] ? '<p class="ask">' + ASK[step.t].replace('{L}', L(lang).name) + '</p>' : '';

    if (step.t === 'tip') {
      body = step.key === 'welcome'
        ? noteHtml({ title: 'How lessons work', lines: ['• You meet a few new words, then use them straight away.', '• Say everything out loud. Speaking is what makes it stick.', '• Mistakes are useful: anything you miss comes back until you have it.', '• You can stop at any moment — your place is saved.', '• On a keyboard: 1–4 to choose, Enter to continue, Space to hear it again.'] })
        : '<div class="gnote"><h4>👂 How ' + L(lang).name + ' sounds</h4><p>' + (audio ? 'A few rules to listen for.' : 'There is no audio on this device yet, so these rules matter — read new words aloud using them.') + '</p>' + D.sounds[lang].slice(0, 6).map(function (r) { return '<p class="pair"><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></p>'; }).join('') + '</div><p class="muted">The full guide is always in the Library.</p>';
      foot = '<button class="btn primary big" data-act="next" data-focus>' + (step.key === 'welcome' ? 'Let’s start' : 'Continue') + '</button>';
    } else if (step.t === 'note') {
      body = noteHtml(D.notes[lang][step.unit]) + '<p class="muted">You can read this again any time in the Library.</p>';
      foot = '<button class="btn primary big" data-act="next" data-focus>Continue</button>';
    } else if (step.t === 'intro') {
      body = '<div class="card intro"><p class="kind">New ' + (it.kind === 'w' ? 'word' : 'sentence') + '</p><p class="target" lang="' + lang + '">' + esc(it.text) + '</p><p class="meaning">' + esc(me.text) + '</p><div class="say-row">' + sayBtn + slowBtn + '</div>' +
        (it.alts.length > 1 ? '<p class="muted">Also: ' + esc(it.alts.slice(1).join(', ')) + '</p>' : '') + exampleHtml(lang, sup, step.id) + '<p class="muted tip">' + (audio ? 'Listen, then say it out loud twice.' : 'Say it out loud twice.') + '</p></div>';
      foot = '<button class="btn primary big" data-act="next" data-focus>Got it</button>';
    } else if (step.t === 'choose') {
      body = ask + '<div class="prompt"><p class="target" lang="' + lang + '">' + esc(it.text) + '</p>' + sayBtn + '</div>' + options('m');
    } else if (step.t === 'listen') {
      body = ask + '<div class="prompt center"><button class="say huge" data-act="say" aria-label="Play audio">🔊</button>' + slowBtn + (fb ? '<p class="target" lang="' + lang + '">' + esc(it.text) + '</p>' : '') + '</div>' + options('m');
    } else if (step.t === 'pick') {
      body = ask + '<div class="prompt"><p class="meaning big">' + esc(me.text) + '</p></div>' + options('t');
    } else if (step.t === 'build') {
      body = ask + '<div class="prompt"><p class="meaning big">' + esc(me.text) + '</p></div>' +
        '<div class="built" aria-label="Your sentence" lang="' + lang + '">' + (s.built.length ? s.built.map(function (bi, n) { return '<button class="tile-w" data-act="unbuild" data-n="' + n + '"' + (fb ? ' disabled' : '') + '>' + esc(s.bank[bi]) + '</button>'; }).join('') : '<span class="muted">Tap the words in order</span>') + '</div>' +
        '<div class="bank" lang="' + lang + '">' + s.bank.map(function (w, bi) { var used = s.built.indexOf(bi) >= 0; return '<button class="tile-w' + (used ? ' used' : '') + '" data-act="build" data-b="' + bi + '"' + (used || fb ? ' disabled' : '') + '>' + esc(w) + '</button>'; }).join('') + '</div>';
      if (!fb) foot = '<button class="btn ghost" data-act="giveup">Show answer</button><button class="btn primary big" data-act="check"' + (s.built.length ? '' : ' disabled') + '>Check</button>';
    } else if (step.t === 'type') {
      body = ask + '<div class="prompt"><p class="meaning big">' + esc(me.text) + '</p></div>' + input('Type in ' + L(lang).name);
      if (!fb) foot = '<button class="btn ghost" data-act="giveup">I don’t know</button><button class="btn primary big" data-act="check">Check</button>';
    } else if (step.t === 'dictate') {
      body = ask + '<div class="prompt center"><button class="say huge" data-act="say" aria-label="Play audio">🔊</button>' + slowBtn + '</div>' + input('Type what you hear');
      if (!fb) foot = '<button class="btn ghost" data-act="giveup">I can’t make it out</button><button class="btn primary big" data-act="check">Check</button>';
    } else if (step.t === 'speak') {
      body = ask + '<div class="prompt"><p class="meaning big">' + esc(me.text) + '</p></div>';
      if (Rec.supported()) body += '<div class="rec"><button class="btn' + (Rec.on ? ' danger' : '') + '" data-act="rec">' + (Rec.on ? '■ Stop recording' : '● Record myself (optional)') + '</button>' + (Rec.url ? '<audio controls src="' + Rec.url + '" aria-label="Your recording"></audio>' : '') + (Rec.error ? '<p class="muted">' + Rec.error + '</p>' : '') + '</div>';
      if (!s.revealed) foot = '<button class="btn primary big" data-act="reveal" data-focus>I said it — show answer</button>';
      else {
        body += '<div class="card reveal"><p class="target" lang="' + lang + '">' + esc(it.text) + '</p><div class="say-row">' + sayBtn + slowBtn + '</div><p class="muted">' + (audio ? 'Compare with what you said, then repeat it once more.' : 'Compare with what you said.') + ' How did it go?</p></div>';
        foot = '<div class="grades"><button class="btn grade again" data-act="grade" data-g="again"><kbd>1</kbd>Didn’t know</button><button class="btn grade hard" data-act="grade" data-g="hard"><kbd>2</kbd>Hard</button><button class="btn grade good" data-act="grade" data-g="good" data-focus><kbd>3</kbd>Good</button><button class="btn grade easy" data-act="grade" data-g="easy"><kbd>4</kbd>Easy</button></div>';
      }
    } else if (step.t === 'match') {
      var col = function (ids, code, side) {
        return '<div class="mcol">' + ids.map(function (id) {
          var cls = s.matched[id] ? ' right' : s.sel && s.sel.side === side && s.sel.id === id ? ' sel' : s.bad && s.bad[side] === id ? ' wrong' : '';
          return '<button class="opt' + cls + '" data-act="match" data-side="' + side + '" data-id="' + id + '"' + (s.matched[id] ? ' disabled' : '') + (side === 'l' ? ' lang="' + lang + '"' : '') + '><span>' + esc(FP.item(code, id).text) + '</span></button>';
        }).join('') + '</div>';
      };
      body = ask + '<div class="match">' + col(s.left, lang, 'l') + col(s.right, sup, 'r') + '</div>';
    }

    if (fb) {
      var r = s.result, noteTxt = { article: 'Right — and remember the full form: ' + it.text, accents: 'Right — watch the accents: ' + it.text, typo: 'Accepted — the exact form is: ' + it.text }[r.note] || '';
      var canOverride = !r.ok && !s.gaveUp && (step.t === 'type' || step.t === 'dictate' || step.t === 'build');
      foot = '<div class="feedback ' + (r.ok ? 'ok' : 'bad') + '" role="status"><div class="fb-text"><strong>' + (r.ok ? (r.note ? 'Correct' : ['Correct!', 'Nice!', 'Exactly!', 'Well done!'][ses.i % 4]) : s.gaveUp ? 'Here it is' : 'Not quite') + '</strong>' +
        (r.ok && !noteTxt ? (step.t === 'choose' || step.t === 'listen' ? '<span lang="' + lang + '">' + esc(it.text) + ' = ' + esc(me.text) + '</span>' : '<span>' + esc(me.text) + '</span>') : '') +
        (noteTxt ? '<span>' + esc(noteTxt) + '</span>' : '') +
        (!r.ok ? '<span>Answer: <b lang="' + lang + '">' + esc(it.text) + '</b> — ' + esc(me.text) + '</span><span class="muted">It will come back in a moment.</span>' : '') + '</div>' +
        '<div class="fb-actions">' + (audio ? '<button class="say small" data-act="say" aria-label="Play audio">🔊</button>' : '') + (canOverride ? '<button class="btn ghost" data-act="override">My answer was right</button>' : '') + '<button class="btn primary big" data-act="next" data-focus>Continue</button></div></div>';
    }

    app.innerHTML = '<main id="main" class="lesson" tabindex="-1"><header class="lesson-top"><button class="icon-btn" data-act="quit" aria-label="Pause and leave the lesson" title="Pause (Esc)">✕</button><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="Lesson progress"><i style="width:' + pct + '%"></i></div><span class="tag ' + tag.toLowerCase().replace(' ', '-') + '">' + tag + '</span></header>' +
      '<section class="step step-' + step.t + '">' + body + '</section><footer class="lesson-foot">' + foot + '</footer></main>';
    var f = app.querySelector('[data-focus]'); if (f) f.focus({ preventScroll: true });
    if (!s.played) {
      s.played = true;
      if (step.t === 'listen' || step.t === 'dictate') sayStep();
      else if ((step.t === 'intro' || step.t === 'choose') && state.settings.autoAudio) sayStep();
    }
  }

  function showFeedback(ok, note) {
    var ses = state.session, step = ses.steps[ses.i], s = ui.s;
    s.phase = 'feedback'; s.result = { ok: ok, note: note || '' };
    var inp = app.querySelector('.answer'); if (inp) s.input = inp.value;
    renderLearn();
    if (state.settings.autoAudio && step.t !== 'choose' && step.t !== 'listen' && step.t !== 'dictate') sayStep();
    if (ok && !note && state.settings.autoNext) {
      var at = ses.i;
      clearTimeout(ui.timer);
      ui.timer = setTimeout(function () { if (state.session === ses && ses.i === at && ui.s.phase === 'feedback') advance(true, null); }, step.t === 'choose' || step.t === 'listen' ? 900 : 1500);
    }
  }
  function advance(ok, grade) {
    clearTimeout(ui.timer);
    var ses = state.session, t = today(), dt = Math.min(60, (Date.now() - ui.s.t0) / 1000);
    ses.sec += dt; FP.day(state, t).sec += dt;
    var done = FP.answer(state, ses, ok, grade, t);
    if (done) {
      var day = FP.day(state, t);
      if (!ses.extra) { day.c = day.c || {}; day.c[ses.lang] = 1; }
      var doneUnits = [];
      ses.fresh.forEach(function (id) {
        var u = FP.item(ses.lang, id).unit, p = FP.unitProgress(state.courses[ses.lang], u);
        if (p.learned === p.total && doneUnits.indexOf(u) < 0) doneUnits.push(u);
      });
      ui.summary = { lang: ses.lang, sec: ses.sec, right: ses.right, wrong: ses.wrong, fresh: ses.fresh.length, reviews: ses.reviews, missed: ses.missed.slice(0, 12), extra: ses.extra, units: doneUnits };
      state.session = null;
      try { window.speechSynthesis.cancel(); } catch (e) { /* optional */ }
    }
    save(); ui.s = null; renderLearn(); window.scrollTo(0, 0);
  }

  function renderSummary() {
    var m = ui.summary, t = today(), streak = FP.streak(state, t), sup = state.profile.support, total = m.right + m.wrong;
    var st = FP.stats(state.courses[m.lang], t);
    var html = '<main id="main" class="page summary" tabindex="-1"><div class="hero"><p class="big-ico" aria-hidden="true">🎉</p><h1>' + (m.extra ? 'Extra practice done' : 'Session complete') + '</h1><p class="lead">' + (streak > 1 ? streak + ' days in a row. ' : '') + 'See you tomorrow — that is when today’s words get their first review.</p></div>' +
      '<section class="tiles four"><div class="tile"><strong>' + Math.max(1, Math.round(m.sec / 60)) + ' min</strong><span>practised</span></div><div class="tile"><strong>' + m.fresh + '</strong><span>new learned</span></div><div class="tile"><strong>' + m.reviews + '</strong><span>reviewed</span></div><div class="tile"><strong>' + (total ? Math.round(m.right / total * 100) + '%' : '–') + '</strong><span>right first time</span></div></section>';
    (m.units || []).forEach(function (u) { html += '<p class="milestone">🏁 Unit ' + (u + 1) + ' complete: <strong>' + D.units[u].title + '</strong> — you can now ' + D.units[u].goal.charAt(0).toLowerCase() + D.units[u].goal.slice(1) + '.</p>'; });
    if (m.missed.length) html += '<section class="card"><h2>Worth another look</h2><p class="muted">These return tomorrow.</p><ul class="items">' + m.missed.map(function (id) { return '<li><button class="row" data-act="say-item" data-id="' + id + '"><span class="t" lang="' + m.lang + '">' + esc(FP.item(m.lang, id).text) + '</span><span class="m">' + esc(FP.item(sup, id).text) + '</span></button></li>'; }).join('') + '</ul></section>';
    html += '<p class="muted center">' + st.learned + ' of ' + st.total + ' items learned in ' + L(m.lang).name + '.</p><div class="ob-actions"><button class="btn primary big" data-act="home" data-focus>Done</button><button class="btn ghost" data-act="extra">Keep going with extra practice</button></div></main>';
    app.innerHTML = html;
    var f = app.querySelector('[data-focus]'); if (f) f.focus({ preventScroll: true });
  }

  /* ================= ACTIONS ================= */
  var act = {
    'ob-next': function () {
      var o = ui.ob;
      if (o.step === 5) { obFinish(); return; }
      o.step++; renderOnboarding(); window.scrollTo(0, 0); focusMain();
    },
    'ob-back': function () {
      var o = ui.ob;
      if (o.adding && o.step === 2) { ui.ob = null; go('settings'); return; }
      o.step--; renderOnboarding(); window.scrollTo(0, 0); focusMain();
    },
    'ob-add': function () { ui.ob.known.push({ lang: FP.WORLD.filter(function (w) { return !ui.ob.known.some(function (k) { return k.lang === w[0]; }); })[0][0], level: 'b1', write: true }); renderOnboarding(); },
    'ob-del': function (el) { ui.ob.known.splice(+el.dataset.i, 1); renderOnboarding(); },
    'ob-target': function (el) {
      var o = ui.ob, l = el.dataset.l, i = o.targets.indexOf(l);
      if (i >= 0) o.targets.splice(i, 1); else o.targets.push(l);
      renderOnboarding(); refocus('[data-l="' + l + '"]');
    },
    'ob-pace': function (el) { ui.ob.minutes = +el.dataset.m; renderOnboarding(); refocus('[data-m="' + el.dataset.m + '"]'); },
    'ob-mode': function (el) { ui.ob.mode = el.dataset.m; ui.ob.modeTouched = true; renderOnboarding(); refocus('[data-m="' + el.dataset.m + '"]'); },
    course: function (el) { state.active = el.dataset.l; save(); render(); },
    'voice-check': function () {
      var l = ui.ob ? ui.ob.targets[0] : state.active;
      Speech.refresh();
      var msg = Speech.has(l) ? 'Voice found — audio is on.' : 'No ' + L(l).name + ' voice found yet. A browser restart is often needed after installing one.';
      if (ui.ob) { render(); alert(msg); } else { ui.toast = msg; render(); }
    },
    'voice-hide': function () { state.settings.voiceSeen = true; save(); render(); },
    start: function () { startSession(false); },
    light: function () { startSession(false, true); },
    shadow: function (el) {
      var u = +el.dataset.u, lang = state.active;
      if (ui.shadow && ui.shadow.u === u) { shadowStop(); return; }
      shadowStop();
      var ids = FP.unitIds(u).filter(function (id) { return id.charAt(0) === 's'; }), token = ui.shadow = { u: u };
      el.textContent = '■ Stop';
      (function next(i) {
        if (ui.shadow !== token) return;
        document.querySelectorAll('.row.playing').forEach(function (r) { r.classList.remove('playing'); });
        if (i >= ids.length) { shadowStop(); return; }
        var row = document.querySelector('[data-act="say-item"][data-id="' + ids[i] + '"]');
        if (row) { row.classList.add('playing'); row.scrollIntoView({ block: 'nearest' }); }
        Speech.say(FP.item(lang, ids[i]).say, lang, false, function (ms) {
          setTimeout(function () { next(i + 1); }, Math.max(1500, ms * 1.3)); // a gap long enough to repeat it aloud
        });
      })(0);
    },
    extra: function () { ui.summary = null; state.session = null; startSession(true); },
    home: function () { ui.summary = null; go('today'); },
    quit: function () { clearTimeout(ui.timer); try { window.speechSynthesis.cancel(); } catch (e) { /* optional */ } ui.s = null; save(); ui.toast = 'Lesson paused — your place is saved.'; go('today'); },
    say: function () { sayStep(false); },
    'say-slow': function () { sayStep(true); },
    'say-item': function (el) { Speech.say(FP.item(ui.summary ? ui.summary.lang : state.active, el.dataset.id).say, ui.summary ? ui.summary.lang : state.active); },
    next: function () {
      var ses = state.session, step = ses.steps[ses.i], s = ui.s;
      if (s.phase === 'feedback') advance(s.result.ok, null); else advance(true, null);
      void step;
    },
    opt: function (el) {
      var step = state.session.steps[state.session.i];
      if (ui.s.phase !== 'ask') return;
      ui.s.picked = el.dataset.id;
      showFeedback(el.dataset.id === step.id);
    },
    build: function (el) { ui.s.built.push(+el.dataset.b); renderLearn(); var c = app.querySelector('[data-act="check"]'); if (c && ui.s.built.length === FP.tiles(FP.item(state.session.lang, state.session.steps[state.session.i].id).text).length) c.focus(); },
    unbuild: function (el) { ui.s.built.splice(+el.dataset.n, 1); renderLearn(); },
    key: function (el) {
      var inp = app.querySelector('.answer'); if (!inp) return;
      var a = inp.selectionStart, b = inp.selectionEnd, ch = el.dataset.ch;
      inp.value = inp.value.slice(0, a) + ch + inp.value.slice(b); inp.focus(); inp.setSelectionRange(a + 1, a + 1);
    },
    check: function () {
      var ses = state.session, step = ses.steps[ses.i], it = FP.item(ses.lang, step.id), val;
      if (ui.s.phase !== 'ask') return;
      if (step.t === 'build') { if (!ui.s.built.length) return; val = ui.s.built.map(function (b) { return ui.s.bank[b]; }).join(' '); }
      else { var inp = app.querySelector('.answer'); val = inp.value; if (!val.trim()) { inp.focus(); inp.classList.add('shake'); setTimeout(function () { inp.classList.remove('shake'); }, 400); return; } }
      var r = step.t === 'build' ? { ok: FP.norm(val) === FP.norm(it.say), note: '' } : FP.check(ses.lang, it, val);
      showFeedback(r.ok, r.note);
    },
    giveup: function () { ui.s.gaveUp = true; showFeedback(false); },
    override: function () { ui.s.result = { ok: true, note: '' }; advance(true, null); },
    reveal: function () { ui.s.revealed = true; if (Rec.on) Rec.rec.stop(); renderLearn(); if (state.settings.autoAudio) sayStep(); },
    grade: function (el) { var g = el.dataset.g; advance(g !== 'again', g === 'again' ? null : g); },
    rec: function () { Rec.toggle(function () { if (route() === 'learn' && state.session) renderLearn(); }); },
    match: function (el) {
      var s = ui.s, side = el.dataset.side, id = el.dataset.id;
      s.bad = null;
      if (!s.sel || s.sel.side === side) { s.sel = { side: side, id: id }; if (side === 'l' && state.settings.autoAudio) Speech.say(FP.item(state.session.lang, id).say, state.session.lang); renderLearn(); refocus('[data-side="' + side + '"][data-id="' + id + '"]'); return; }
      if (s.sel.id === id) {
        s.matched[id] = 1; s.sel = null;
        if (Object.keys(s.matched).length === s.left.length) { renderLearn(); ui.timer = setTimeout(function () { advance(true, null); }, 600); return; }
      } else { s.bad = { l: side === 'l' ? id : s.sel.id, r: side === 'r' ? id : s.sel.id }; s.sel = null; }
      renderLearn();
    },
    pace: function (el) { course().minutes = +el.dataset.m; save(); render(); refocus('[data-act="pace"][data-m="' + el.dataset.m + '"]'); },
    'skip-unit': function (el) {
      var u = +el.dataset.u;
      if (!confirm('Mark unit ' + (u + 1) + ' as already known? Its items will come back as reviews over the next days so you can confirm them.')) return;
      FP.skipUnit(course(), u, today());
      if (state.session && state.session.lang === state.active) state.session = null;
      save(); ui.toast = 'Unit marked as known.'; render();
    },
    'add-course': function () { startOnboarding(true); render(); window.scrollTo(0, 0); },
    export: function () {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(state)], { type: 'application/json' }));
      a.download = 'fluent-path-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    },
    reset: function () {
      if (!confirm('Erase all courses and progress on this device? This cannot be undone.')) return;
      state = FP.blank(); save(); ui.ob = null; location.hash = ''; applyTheme(); render();
    }
  };
  function focusMain() { var m = document.getElementById('main'); if (m) m.focus({ preventScroll: true }); }
  function refocus(sel) { var e = app.querySelector(sel); if (e) e.focus({ preventScroll: true }); }

  var onChange = {
    known: function (el) { var k = ui.ob.known[+el.dataset.i]; k[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value; renderOnboarding(); refocus('[data-i="' + el.dataset.i + '"][data-f="' + el.dataset.f + '"]'); },
    'ob-support': function (el) { ui.ob.support = el.value; ui.ob.supportTouched = true; },
    set: function (el) { state.settings[el.dataset.k] = el.checked; save(); },
    theme: function (el) { state.settings.theme = el.value; save(); applyTheme(); },
    minutes: function (el) { course().minutes = +el.value; save(); ui.toast = 'Daily time updated.'; render(); },
    mode: function (el) { var had = state.session && state.session.lang === state.active; course().mode = el.value; if (had) state.session = null; save(); ui.toast = had ? 'Skills updated. Today’s lesson restarts with the new setting.' : 'Skills updated.'; render(); },
    support: function (el) { state.profile.support = el.value; state.session = null; save(); ui.toast = 'Translations now in ' + L(el.value).name + '.'; render(); },
    import: function (el) {
      var f = el.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try { var s = FP.validate(JSON.parse(rd.result)); if (!s.profile) throw new Error('empty'); state = s; save(); applyTheme(); ui.toast = 'Backup restored.'; }
        catch (e) { ui.toast = 'That file is not a Fluent Path backup.'; }
        render();
      };
      rd.readAsText(f);
    }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    var fn = act[el.dataset.act]; if (fn) { e.preventDefault(); fn(el); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target.closest('[data-on]'); if (!el) return;
    var fn = onChange[el.dataset.on]; if (fn) fn(el);
  });
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d.matches && d.matches('details.unit[data-u]') && d.open && d.getAttribute('data-filled') !== 'all' && !(ui.q && FP.fold(ui.q).length >= 2)) fillUnit(d);
  }, true);
  document.addEventListener('input', function (e) {
    if (e.target.matches('[data-on="search"]')) { ui.q = e.target.value; applySearch(); }
  });
  document.addEventListener('keydown', function (e) {
    if (route() !== 'learn' || !state.session || ui.ob || ui.summary || e.ctrlKey || e.metaKey || e.altKey) return;
    var step = state.session.steps[state.session.i], s = ui.s, tgt = e.target && e.target.matches ? e.target : document.body, inField = tgt.matches('input, textarea, select');
    if (!step || !s) return;
    if (e.key === 'Escape') { act.quit(); return; }
    if (e.key === 'Enter') {
      if (tgt.matches('button')) return; // let the focused button act
      e.preventDefault();
      if (s.phase === 'feedback' || step.t === 'intro' || step.t === 'note' || step.t === 'tip') act.next();
      else if (step.t === 'type' || step.t === 'dictate' || step.t === 'build') act.check();
      else if (step.t === 'speak' && !s.revealed) act.reveal();
      return;
    }
    if (inField) return;
    if (e.key === ' ' && !tgt.matches('button')) { e.preventDefault(); sayStep(false); return; }
    if (e.key === 'Backspace' && step.t === 'build' && s.phase === 'ask' && s.built.length) { s.built.pop(); renderLearn(); return; }
    var n = +e.key;
    if (n >= 1 && n <= 4) {
      if (step.opts && s.phase === 'ask') { var b = app.querySelectorAll('.opt')[n - 1]; if (b) b.click(); }
      else if (step.t === 'speak' && s.revealed) { var g = app.querySelectorAll('.grade')[n - 1]; if (g) g.click(); }
    }
  });

  function applyTheme() { document.documentElement.setAttribute('data-theme', state.settings.theme || 'auto'); }

  /* ---------- start ---------- */
  if (state.session && state.session.day !== today()) { state.session = null; save(); }
  applyTheme();
  render();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* offline support is optional */ }); });
  }
})();

/* Fluent Path — learning engine. Pure logic, no DOM: content lookup, answer
   checking, spaced repetition, session building, planning and storage. */
(function (root) {
  'use strict';
  var D = root.FP_DATA;
  var FP = root.FP = {};

  FP.KEY = 'fluentpath.v1';
  FP.MIN_MINUTES = 10;
  FP.PACES = [
    { min: 10, label: 'Steady', hint: 'The minimum that still works' },
    { min: 15, label: 'Regular', hint: 'A comfortable daily habit' },
    { min: 20, label: 'Focused', hint: 'Noticeably faster progress' },
    { min: 30, label: 'Serious', hint: 'Recommended if you have a deadline' },
    { min: 45, label: 'Intensive', hint: 'Fast, needs real commitment' },
    { min: 60, label: 'Immersive', hint: 'The fastest this course goes' }
  ];
  FP.LEVELS = [
    { id: 'a1', label: 'Beginner', rank: 1 },
    { id: 'a2', label: 'Elementary', rank: 2 },
    { id: 'b1', label: 'Intermediate', rank: 3 },
    { id: 'b2', label: 'Upper intermediate', rank: 4 },
    { id: 'c1', label: 'Advanced', rank: 5 },
    { id: 'native', label: 'Native', rank: 6 }
  ];
  FP.WORLD = [
    ['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'], ['it', 'Italian'], ['pt', 'Portuguese'],
    ['ar', 'Arabic'], ['bn', 'Bengali'], ['bg', 'Bulgarian'], ['ca', 'Catalan'], ['zh', 'Chinese'], ['hr', 'Croatian'],
    ['cs', 'Czech'], ['da', 'Danish'], ['nl', 'Dutch'], ['fi', 'Finnish'], ['el', 'Greek'], ['he', 'Hebrew'],
    ['hi', 'Hindi'], ['hu', 'Hungarian'], ['id', 'Indonesian'], ['ja', 'Japanese'], ['ko', 'Korean'], ['ms', 'Malay'],
    ['no', 'Norwegian'], ['fa', 'Persian'], ['pl', 'Polish'], ['ro', 'Romanian'], ['ru', 'Russian'], ['sr', 'Serbian'],
    ['sk', 'Slovak'], ['sv', 'Swedish'], ['sw', 'Swahili'], ['tl', 'Tagalog'], ['ta', 'Tamil'], ['th', 'Thai'],
    ['tr', 'Turkish'], ['uk', 'Ukrainian'], ['ur', 'Urdu'], ['vi', 'Vietnamese'], ['other', 'Another language']
  ];
  var FAMILY = { es: 'romance', fr: 'romance', it: 'romance', pt: 'romance', ro: 'romance', ca: 'romance',
    en: 'germanic', de: 'germanic', nl: 'germanic', sv: 'germanic', no: 'germanic', da: 'germanic' };
  var BASE_HOURS = { es: 650, fr: 700, it: 650, pt: 650, de: 850, en: 800 };

  FP.courseLangs = function () { return Object.keys(D.langs); };
  FP.worldName = function (code) {
    for (var i = 0; i < FP.WORLD.length; i++) if (FP.WORLD[i][0] === code) return FP.WORLD[i][1];
    return code;
  };
  FP.levelRank = function (id) {
    for (var i = 0; i < FP.LEVELS.length; i++) if (FP.LEVELS[i].id === id) return FP.LEVELS[i].rank;
    return 0;
  };

  /* ---------- dates ---------- */
  FP.dayNum = function (d) {
    d = d || new Date();
    return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5);
  };
  FP.dayDate = function (n) { return new Date(n * 864e5 + new Date(n * 864e5).getTimezoneOffset() * 60000); };

  /* ---------- content ---------- */
  var W = 14, S = 9;
  FP.UNIT_SIZE = W + S;
  FP.unitCount = function () { return D.units.length; };
  FP.totalItems = function () { return D.units.length * (W + S); };

  FP.strip = function (s) { return s.replace(/\s*\([^)]*\)/g, '').trim(); };
  FP.item = function (lang, id) {
    var kind = id.charAt(0), parts = id.slice(1).split('_'), u = +parts[0], i = +parts[1];
    var raw = D.langs[lang].units[u][kind][i];
    var alts = raw.split('|');
    return { id: id, unit: u, kind: kind, index: i, text: alts[0], say: FP.strip(alts[0]), alts: alts.map(FP.strip) };
  };
  FP.unitIds = function (u) {
    // words and sentences interleaved so sentences reuse fresh words
    var ids = [], w = 0, s = 0, chunks = [[5, 3], [5, 3], [4, 3]];
    chunks.forEach(function (c) {
      for (var a = 0; a < c[0]; a++) ids.push('w' + u + '_' + (w++));
      for (var b = 0; b < c[1]; b++) ids.push('s' + u + '_' + (s++));
    });
    return ids;
  };
  var orderCache = null;
  FP.order = function () {
    if (!orderCache) {
      orderCache = [];
      for (var u = 0; u < D.units.length; u++) orderCache = orderCache.concat(FP.unitIds(u));
    }
    return orderCache;
  };

  /* ---------- answer checking ---------- */
  FP.norm = function (s) {
    return s.toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.,!?¿¡;:"“”«»()…]/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  };
  FP.fold = function (s) {
    return FP.norm(s).replace(/ß/g, 'ss').replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/'/g, '');
  };
  FP.lev = function (a, b) {
    if (a === b) return 0;
    var prev = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      var cur = [i];
      for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  };
  function dropArticle(lang, s) {
    var arts = D.langs[lang].articles || [];
    for (var i = 0; i < arts.length; i++) {
      var a = arts[i];
      if (a.slice(-1) === "'") { if (s.indexOf(a) === 0) return s.slice(a.length); }
      else if (s.indexOf(a + ' ') === 0) return s.slice(a.length + 1);
    }
    return s;
  }
  /* Returns { ok, note } where note is '', 'article', 'accents' or 'typo'. */
  FP.check = function (lang, item, input) {
    var n = FP.norm(input), f = FP.fold(input), i, c;
    if (!n) return { ok: false, note: '' };
    var cands = item.alts.map(FP.norm);
    for (i = 0; i < cands.length; i++) if (cands[i] === n) return { ok: true, note: '' };
    if (item.kind === 'w') {
      for (i = 0; i < cands.length; i++) {
        c = dropArticle(lang, cands[i]);
        if (c !== cands[i] && (c === n || FP.fold(c) === f)) return { ok: true, note: 'article' };
      }
    }
    for (i = 0; i < cands.length; i++) if (FP.fold(cands[i]) === f) return { ok: true, note: 'accents' };
    for (i = 0; i < cands.length; i++) {
      c = FP.fold(cands[i]);
      var allowed = item.kind === 's' ? Math.max(1, Math.floor(c.length / 8)) : c.length >= 14 ? 2 : c.length >= 5 ? 1 : 0;
      if (allowed && FP.lev(c, f) <= allowed) return { ok: true, note: 'typo' };
    }
    return { ok: false, note: '' };
  };
  /* A sentence from the same unit that uses this word, if there is one. */
  FP.example = function (lang, id) {
    var it = FP.item(lang, id);
    if (it.kind !== 'w') return null;
    var bare = ' ' + FP.fold(dropArticle(lang, FP.norm(it.say))) + ' ';
    if (bare.length < 5) return null;
    for (var i = 0; i < S; i++) {
      var sid = 's' + it.unit + '_' + i;
      if ((' ' + FP.fold(FP.item(lang, sid).say) + ' ').indexOf(bare) >= 0) return sid;
    }
    return null;
  };
  FP.tiles = function (text) {
    return text.replace(/[.,!?¿¡;:…]/g, ' ').split(/\s+/).filter(Boolean);
  };

  /* ---------- spaced repetition ---------- */
  FP.grade = function (card, q, today) {
    var c = card ? { r: card.r, iv: card.iv, ef: card.ef, due: card.due, l: card.l || 0 } : { r: 0, iv: 0, ef: 2.3, due: today, l: 0 };
    if (q === 'again') {
      if (card) c.l++;
      c.r = 0; c.iv = 1; c.ef = Math.max(1.3, c.ef - 0.2);
    } else if (q === 'hard') {
      c.iv = Math.max(1, Math.round(c.iv * 1.2)); c.ef = Math.max(1.3, c.ef - 0.15); c.r++;
    } else if (q === 'easy') {
      c.iv = c.r === 0 ? 3 : Math.max(c.iv + 2, Math.round(c.iv * c.ef * 1.3)); c.ef = Math.min(2.8, c.ef + 0.1); c.r++;
    } else {
      c.iv = c.r === 0 ? 1 : c.r === 1 ? 3 : Math.max(c.iv + 1, Math.round(c.iv * c.ef)); c.r++;
    }
    c.due = today + c.iv;
    return c;
  };

  /* ---------- pacing & planning ---------- */
  function related(target, known) {
    var fam = FAMILY[target], best = 0;
    (known || []).forEach(function (k) {
      if (k.lang !== target && FAMILY[k.lang] === fam && FP.levelRank(k.level) >= 3) best = Math.max(best, fam === 'romance' ? 2 : 1);
    });
    return best; // 0 none, 1 germanic cousin, 2 romance sibling
  }
  FP.boost = function (target, known) { var r = related(target, known); return r === 2 ? 1.25 : r === 1 ? 1.1 : 1; };
  FP.newPerDay = function (minutes, boost) { return Math.max(4, Math.round(minutes * 0.6 * (boost || 1))); };
  FP.reviewCap = function (minutes) { return Math.round(minutes * 4); };
  FP.fluencyHours = function (target, known) {
    var h = BASE_HOURS[target] || 750, r = related(target, known);
    if (r === 2) h *= 0.65; else if (r === 1) h *= 0.8;
    else {
      var anyClose = (known || []).some(function (k) { return FAMILY[k.lang] && FP.levelRank(k.level) >= 3; });
      if (!anyClose) h *= 1.4;
    }
    return Math.round(h / 10) * 10;
  };
  FP.placementUnit = function (target, known) {
    var u = 0;
    (known || []).forEach(function (k) {
      if (k.lang === target) u = { a1: 3, a2: 8, b1: 14, b2: 18, c1: 20, native: 20 }[k.level] || 0;
    });
    return Math.min(u, FP.unitCount());
  };
  FP.bestSupport = function (known, targets) {
    var best = 'en', rank = 0;
    (known || []).forEach(function (k) {
      var r = FP.levelRank(k.level);
      if (D.langs[k.lang] && targets.indexOf(k.lang) < 0 && r >= 3 && r > rank) { best = k.lang; rank = r; }
    });
    if (targets.indexOf(best) >= 0) best = FP.courseLangs().filter(function (l) { return targets.indexOf(l) < 0; })[0];
    return best;
  };

  FP.PHASES = [
    { name: 'Survival basics', units: [0, 4], can: 'Greet people, introduce yourself, count, order food and talk about your family.' },
    { name: 'Daily life', units: [5, 9], can: 'Talk about your home and your week, and find your way around a city.' },
    { name: 'Describing & asking', units: [10, 14], can: 'Describe things, shop, ask real questions and say how you feel.' },
    { name: 'Real conversation', units: [15, 19], can: 'Talk about work, routines, the past and your opinions.' }
  ];

  FP.stats = function (course, today) {
    var learned = 0, mature = 0, due = 0, young = 0, ids = Object.keys(course.cards);
    ids.forEach(function (id) {
      var c = course.cards[id];
      learned++;
      if (c.iv >= 21) mature++; else young++;
      if (c.due <= today) due++;
    });
    return { learned: learned, mature: mature, young: young, due: due, total: FP.totalItems(), remaining: FP.totalItems() - learned };
  };
  FP.unitProgress = function (course, u) {
    var ids = FP.unitIds(u), n = 0, strong = 0;
    ids.forEach(function (id) { var c = course.cards[id]; if (c) { n++; if (c.iv >= 7) strong++; } });
    return { learned: n, strong: strong, total: ids.length };
  };
  FP.currentUnit = function (course) {
    var o = FP.order();
    for (var i = 0; i < o.length; i++) if (!course.cards[o[i]]) return +o[i].slice(1).split('_')[0];
    return FP.unitCount();
  };

  FP.plan = function (state, lang, today) {
    var course = state.courses[lang], st = FP.stats(course, today);
    var boost = FP.boost(lang, state.profile.known), npd = FP.newPerDay(course.minutes, boost);
    var daysLeft = Math.ceil(st.remaining / npd), cursor = 0, o = FP.order();
    var phases = FP.PHASES.map(function (p) {
      var total = 0, left = 0;
      for (var u = p.units[0]; u <= p.units[1]; u++) FP.unitIds(u).forEach(function (id) { total++; if (!course.cards[id]) left++; });
      var start = cursor, len = Math.ceil(left / npd);
      cursor += len;
      return { name: p.name, can: p.can, units: p.units, total: total, left: left, startIn: start, endIn: cursor, done: left === 0 };
    });
    var hours = FP.fluencyHours(lang, state.profile.known);
    var libraryHours = Math.round(FP.totalItems() * 4.5 / 60); // ~4.5 min of total practice per item over its lifetime
    return {
      boost: boost, newPerDay: npd, reviewCap: FP.reviewCap(course.minutes), stats: st, daysLeft: daysLeft, phases: phases,
      consolidationDays: 45, fluencyHours: hours, libraryHours: libraryHours,
      fluencyYears: hours / (course.minutes / 60) / 365, order: o.length
    };
  };

  /* ---------- sessions ---------- */
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  FP.shuffle = shuffle;

  /* Three wrong options of the same kind, distinct in both languages. */
  FP.distractors = function (lang, support, id) {
    var it = FP.item(lang, id), me = FP.item(support, id), kind = it.kind, n = kind === 'w' ? W : S;
    var pool = [], far = [], u, i;
    for (u = 0; u < D.units.length; u++) for (i = 0; i < n; i++) {
      var oid = kind + u + '_' + i;
      if (oid === id) continue;
      if (u === it.unit) pool.push(oid); else if (Math.abs(u - it.unit) <= 2 || u < it.unit) far.push(oid);
    }
    shuffle(pool); shuffle(far);
    var out = [], seenT = {}, seenM = {};
    it.alts.forEach(function (a) { seenT[FP.fold(a)] = 1; });
    me.alts.forEach(function (a) { seenM[FP.fold(a)] = 1; });
    function tryAdd(cid, limit) {
      if (out.length >= limit) return;
      var a = FP.item(lang, cid), b = FP.item(support, cid), k;
      for (k = 0; k < a.alts.length; k++) if (seenT[FP.fold(a.alts[k])]) return;
      for (k = 0; k < b.alts.length; k++) if (seenM[FP.fold(b.alts[k])]) return;
      seenT[FP.fold(a.say)] = 1; seenM[FP.fold(b.say)] = 1; out.push(cid);
    }
    pool.forEach(function (c) { tryAdd(c, 3); });   // same unit first: the most confusable
    far.forEach(function (c) { tryAdd(c, 3); });
    return out;
  };

  function reviewType(kind, card, write, audio) {
    var r = card.r;
    // Recognition only right after a lapse; then cued recall; then full production.
    if (r === 0) return audio && Math.random() < 0.6 ? 'listen' : 'choose';
    if (r === 1) return audio && Math.random() < 0.3 ? 'listen' : kind === 'w' ? 'pick' : 'build';
    if (!write) return 'speak';
    if (r % 2 === 1) return 'speak';
    return kind === 'w' ? 'type' : (audio ? 'dictate' : 'build');
  }
  function withOpts(lang, support, step) {
    if (step.t === 'choose' || step.t === 'listen' || step.t === 'pick') step.opts = shuffle(FP.distractors(lang, support, step.id).concat([step.id]));
    return step;
  }

  FP.sessionPlan = function (state, lang, today, extra, light) {
    var course = state.courses[lang];
    var cap = FP.reviewCap(course.minutes), npd = FP.newPerDay(course.minutes, FP.boost(lang, state.profile.known));
    var due = Object.keys(course.cards).filter(function (id) { return course.cards[id].due <= today; });
    due.sort(function (a, b) { return course.cards[a].due - course.cards[b].due || (a < b ? -1 : 1); });
    var backlog = due.length;
    var nNew = npd;
    if (extra) nNew = Math.max(3, Math.round(npd / 2));
    if (backlog > cap * 2) nNew = 0; else if (backlog > cap) nNew = Math.round(nNew / 2);
    if (light) { nNew = 0; cap = Math.min(cap, 20); } // short on time: reviews only
    var newIds = FP.order().filter(function (id) { return !course.cards[id]; }).slice(0, nNew);
    var reviews = due.slice(0, cap);
    if (extra && !reviews.length && !newIds.length) {
      // nothing due and course finished: practise the weakest items
      reviews = Object.keys(course.cards).sort(function (a, b) { return course.cards[a].iv - course.cards[b].iv; }).slice(0, 15);
    }
    var steps = reviews.length + newIds.length * 4;
    return { reviews: reviews, newIds: newIds, backlog: backlog, minutes: Math.max(2, Math.round(steps * 12 / 60)) };
  };

  FP.buildSession = function (state, lang, today, opt) {
    opt = opt || {};
    var course = state.courses[lang], support = state.profile.support, write = course.mode === 'both', audio = !!opt.audio;
    var sp = FP.sessionPlan(state, lang, today, opt.extra, opt.light), steps = [];
    var revSteps = shuffle(sp.reviews.slice()).map(function (id) {
      return withOpts(lang, support, { t: reviewType(id.charAt(0), course.cards[id], write, audio), id: id, rev: 1 });
    });
    var groups = [], i;
    for (i = 0; i < sp.newIds.length; i += 3) groups.push(sp.newIds.slice(i, i + 3));
    var chunk = groups.length ? Math.ceil(revSteps.length / (groups.length + 1)) : revSteps.length;
    var notesSeen = course.notes || {};
    function takeReviews() { steps = steps.concat(revSteps.splice(0, chunk)); }
    // Recall: produce each new item from memory, a little while after meeting it.
    var prev = [], nRecall = 0;
    function recall(g) {
      shuffle(g.slice()).forEach(function (id) {
        var k = id.charAt(0), n = nRecall++, t;
        if (!write) t = 'speak';
        else if (k === 'w') t = n % 4 === 3 ? 'speak' : 'type';
        else t = audio && n % 2 ? 'dictate' : 'speak';
        steps.push({ t: t, id: id });
      });
    }
    if (groups.length && !notesSeen.welcome) {
      steps.push({ t: 'tip', key: 'welcome' });
      if (D.sounds[lang]) steps.push({ t: 'tip', key: 'sounds' });
    }
    takeReviews();
    groups.forEach(function (g) {
      g.forEach(function (id) {
        var u = FP.item(lang, id).unit;
        if (D.notes[lang] && D.notes[lang][u] && !notesSeen[u]) { steps.push({ t: 'note', unit: u }); notesSeen = Object.assign({}, notesSeen); notesSeen[u] = 1; }
        steps.push({ t: 'intro', id: id });
      });
      shuffle(g.slice()).forEach(function (id) {
        steps.push(withOpts(lang, support, { t: audio && Math.random() < 0.35 ? 'listen' : 'choose', id: id }));
      });
      shuffle(g.slice()).forEach(function (id) {
        steps.push(withOpts(lang, support, { t: id.charAt(0) === 'w' ? 'pick' : 'build', id: id }));
      });
      var words = g.filter(function (id) { return id.charAt(0) === 'w'; });
      if (words.length >= 3) steps.push({ t: 'match', ids: words });
      recall(prev);          // the previous group, now a few minutes old
      prev = g;
      takeReviews();
    });
    steps = steps.concat(revSteps);
    recall(prev);
    return { lang: lang, day: today, steps: steps, i: 0, sec: 0, right: 0, wrong: 0, miss: {}, sg: {}, fresh: sp.newIds.slice(),
      reviews: sp.reviews.length, extra: !!opt.extra, missed: [] };
  };

  /* Record the answer for the current step; grades the item once it has no
     steps left in this session. Returns true when the session is finished. */
  FP.answer = function (state, session, ok, selfGrade, today) {
    var step = session.steps[session.i], course = state.courses[session.lang], id = step.id;
    var day = FP.day(state, today);
    var graded = id && step.t !== 'intro';
    if (graded) day.steps++;
    if (id) {
      if (ok) { if (graded) { session.right++; day.right++; } if (selfGrade) session.sg[id] = selfGrade; }
      else {
        session.wrong++;
        session.miss[id] = (session.miss[id] || 0) + 1;
        if (session.missed.indexOf(id) < 0) session.missed.push(id);
        if (session.miss[id] <= 3) {
          var again = { t: step.t, id: id, retry: 1 };
          if (step.opts) again.opts = shuffle(step.opts.slice());
          if (step.rev) again.rev = 1;
          session.steps.splice(Math.min(session.i + 4, session.steps.length), 0, again);
        }
      }
    }
    if (step.t === 'note') { course.notes = course.notes || {}; course.notes[step.unit] = 1; }
    if (step.t === 'tip') { course.notes = course.notes || {}; course.notes.welcome = 1; }
    session.i++;
    if (id) {
      var later = false;
      for (var j = session.i; j < session.steps.length; j++) if (session.steps[j].id === id) { later = true; break; }
      if (!later) {
        var isNew = !course.cards[id];
        var q = session.miss[id] ? (isNew ? 'hard' : 'again') : (session.sg[id] || 'good');
        course.cards[id] = FP.grade(course.cards[id], q, today);
        if (isNew) day.fresh++; else day.rev++;
      }
    }
    var done = session.i >= session.steps.length;
    if (done && !session.extra) day.done = 1;
    return done;
  };

  FP.day = function (state, today) {
    if (!state.days[today]) state.days[today] = { sec: 0, steps: 0, right: 0, fresh: 0, rev: 0, done: 0 };
    return state.days[today];
  };
  FP.streak = function (state, today) {
    var n = 0, d = today;
    if (!(state.days[d] && state.days[d].done)) d--;
    while (state.days[d] && state.days[d].done) { n++; d--; }
    return n;
  };

  /* ---------- state ---------- */
  FP.blank = function () {
    return { v: 1, profile: null, courses: {}, active: null, days: {}, session: null,
      settings: { autoAudio: true, slow: false, autoNext: true, theme: 'auto' } };
  };
  FP.newCourse = function (minutes, mode, today) {
    return { minutes: Math.max(FP.MIN_MINUTES, minutes), mode: mode, started: today, cards: {}, notes: {} };
  };
  /* Mark the first `n` units as already known; they come back as spaced reviews to verify. */
  FP.skipUnits = function (course, n, today) {
    var k = 0;
    for (var u = 0; u < n; u++) FP.unitIds(u).forEach(function (id) {
      if (!course.cards[id]) { course.cards[id] = { r: 2, iv: 4, ef: 2.3, due: today + 1 + (k % 12), l: 0 }; k++; }
    });
    return k;
  };
  FP.skipUnit = function (course, u, today) {
    var k = 0;
    FP.unitIds(u).forEach(function (id) {
      if (!course.cards[id]) { course.cards[id] = { r: 2, iv: 4, ef: 2.3, due: today + 2 + (k % 6), l: 0 }; k++; }
    });
    return k;
  };

  var mem = null;
  FP.storageOk = true;
  FP.load = function () {
    var raw = null;
    try { raw = root.localStorage.getItem(FP.KEY); } catch (e) { FP.storageOk = false; raw = mem; }
    if (!raw) return FP.blank();
    try { return FP.validate(JSON.parse(raw)); } catch (e) { return FP.blank(); }
  };
  FP.save = function (state) {
    var raw = JSON.stringify(state);
    try { root.localStorage.setItem(FP.KEY, raw); FP.storageOk = true; } catch (e) { FP.storageOk = false; mem = raw; }
  };
  FP.validate = function (s) {
    if (!s || s.v !== 1 || typeof s.courses !== 'object' || typeof s.days !== 'object') throw new Error('Not a Fluent Path backup');
    var b = FP.blank();
    s.settings = Object.assign(b.settings, s.settings || {});
    Object.keys(s.courses).forEach(function (l) {
      if (!D.langs[l]) { delete s.courses[l]; return; }
      var c = s.courses[l];
      c.cards = c.cards || {}; c.notes = c.notes || {};
      c.minutes = Math.max(FP.MIN_MINUTES, +c.minutes || FP.MIN_MINUTES);
      if (c.mode !== 'speak') c.mode = 'both';
    });
    if (s.profile && !D.langs[s.profile.support]) s.profile.support = 'en';
    if (!s.courses[s.active]) s.active = Object.keys(s.courses)[0] || null;
    if (s.session && !s.courses[s.session.lang]) s.session = null;
    return s;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = FP;
})(typeof window !== 'undefined' ? window : globalThis);

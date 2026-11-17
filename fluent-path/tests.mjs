// Run with: node tests.mjs
// Checks the learning library and the engine, and simulates learners over time.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ctx = { console, Math, JSON, Date, Object, Array, String };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['data/en.js', 'data/es.js', 'data/fr.js', 'data/de.js', 'data/it.js', 'data/pt.js', 'data/notes.js', 'js/engine.js'])
  vm.runInContext(readFileSync(new URL(f, import.meta.url), 'utf8'), ctx, { filename: f });
const { FP, FP_DATA: D } = ctx;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('ok  ' + name); };

test('every language has 20 units of 14 words and 9 sentences', () => {
  assert.equal(D.units.length, 20);
  for (const [code, lang] of Object.entries(D.langs)) {
    assert.equal(lang.units.length, 20, code);
    lang.units.forEach((u, i) => {
      assert.equal(u.w.length, 14, `${code} unit ${i} words`);
      assert.equal(u.s.length, 9, `${code} unit ${i} sentences`);
      [...u.w, ...u.s].forEach(x => assert.ok(x && x.trim() === x && !/\|\||^\||\|$/.test(x), `${code} unit ${i}: "${x}"`));
    });
  }
});

test('no two items in a language share the same text (would make answers ambiguous)', () => {
  for (const [code, lang] of Object.entries(D.langs)) {
    for (const kind of ['w', 's']) {
      const seen = new Map();
      lang.units.forEach((u, ui) => u[kind].forEach((raw, i) => {
        const key = FP.norm(raw.split('|')[0]);
        assert.ok(!seen.has(key), `${code}: "${raw}" (${kind}${ui}_${i}) duplicates ${seen.get(key)}`);
        seen.set(key, `${kind}${ui}_${i}`);
      }));
    }
  }
});

test('course order covers every item exactly once', () => {
  const o = FP.order();
  assert.equal(o.length, 460);
  assert.equal(new Set(o).size, 460);
  for (const id of o) assert.ok(FP.item('es', id).text);
});

test('distractors are three distinct, unambiguous options for every item and language pair', () => {
  for (const lang of FP.courseLangs()) for (const sup of FP.courseLangs()) {
    if (lang === sup) continue;
    for (const id of FP.order()) {
      const d = FP.distractors(lang, sup, id);
      assert.equal(d.length, 3, `${lang}/${sup} ${id}`);
      const texts = [id, ...d].map(x => FP.fold(FP.item(lang, x).say));
      const means = [id, ...d].map(x => FP.fold(FP.item(sup, x).say));
      assert.equal(new Set(texts).size, 4, `${lang}/${sup} ${id} targets`);
      assert.equal(new Set(means).size, 4, `${lang}/${sup} ${id} meanings`);
    }
  }
});

test('answer checking is strict on meaning, lenient on slips', () => {
  const agua = FP.item('es', 'w3_0'), eau = FP.item('fr', 'w3_0'), coche = FP.item('es', 'w9_8');
  assert.equal(JSON.stringify(FP.check('es', agua, 'el agua')), '{"ok":true,"note":""}');
  assert.equal(FP.check('es', agua, '  El Agua. ').note, '');
  assert.equal(FP.check('es', agua, 'agua').note, 'article');
  assert.equal(FP.check('fr', eau, "l'eau").ok, true);
  assert.equal(FP.check('fr', eau, 'eau').note, 'article');
  assert.equal(FP.check('es', coche, 'el carro').ok, true);
  assert.equal(FP.check('es', FP.item('es', 'w0_1'), 'adios').note, 'accents');
  assert.equal(FP.check('es', FP.item('es', 'w3_6'), 'la cervesa').note, 'typo');
  assert.equal(FP.check('es', agua, 'el pan').ok, false);
  assert.equal(FP.check('es', FP.item('es', 'w0_4'), 'no').ok, false); // sí vs no: short words get no typo allowance
  assert.equal(FP.check('es', agua, '').ok, false);
  assert.equal(FP.check('de', FP.item('de', 'w1_3'), 'sie').ok, true);
  assert.equal(FP.check('es', FP.item('es', 's0_0'), 'hola como estas').note, 'accents');
  assert.equal(FP.check('en', FP.item('en', 'w3_12'), 'eat').ok, true);
});

test('sentence tiles rebuild the sentence', () => {
  for (const lang of FP.courseLangs()) for (const id of FP.order()) {
    if (id[0] !== 's') continue;
    const it = FP.item(lang, id), t = FP.tiles(it.text);
    assert.ok(t.length >= 1 && t.length <= 10, `${lang} ${id}: ${t.length} tiles`);
    assert.equal(FP.check(lang, it, t.join(' ')).ok, true, `${lang} ${id}`);
  }
});

test('spaced repetition intervals grow and lapses reset', () => {
  let c = FP.grade(undefined, 'good', 100);
  assert.equal(c.due, 101);
  const ivs = [c.iv];
  for (let i = 0; i < 5; i++) { c = FP.grade(c, 'good', c.due); ivs.push(c.iv); }
  assert.equal(ivs.join(), '1,3,7,16,37,85');
  const lapsed = FP.grade(c, 'again', c.due);
  assert.equal(lapsed.iv, 1); assert.equal(lapsed.l, 1); assert.ok(lapsed.ef < c.ef);
  assert.ok(FP.grade(c, 'easy', c.due).iv > FP.grade(c, 'good', c.due).iv);
  assert.ok(FP.grade(c, 'hard', c.due).iv < FP.grade(c, 'good', c.due).iv);
});

test('pace: minimum is enforced and more minutes means more new items', () => {
  assert.equal(FP.newCourse(3, 'both', 0).minutes, 10);
  const n = FP.PACES.map(p => FP.newPerDay(p.min, 1));
  assert.equal(n.join(), '6,9,12,18,27,36');
  assert.ok(FP.newPerDay(10, FP.boost('it', [{ lang: 'es', level: 'native' }])) > 6);
  assert.ok(FP.fluencyHours('it', [{ lang: 'es', level: 'native' }]) < FP.fluencyHours('it', [{ lang: 'en', level: 'native' }]));
  assert.equal(FP.bestSupport([{ lang: 'ja', level: 'native' }, { lang: 'fr', level: 'b2' }], ['es']), 'fr');
  assert.equal(FP.bestSupport([{ lang: 'en', level: 'native' }], ['en']), 'es');
});

function makeState(minutes, mode, known = [{ lang: 'en', level: 'native', write: true }]) {
  const s = FP.blank();
  s.profile = { known, support: 'en' };
  s.courses.es = FP.newCourse(minutes, mode, 1000);
  s.active = 'es';
  return s;
}

/* A simulated learner: answers correctly with a probability that depends on how
   well-practised the item is. Returns per-day workload and the end state. */
function simulate(minutes, mode, days, skill, skipEvery = 0) {
  const s = makeState(minutes, mode);
  const log = [];
  let rng = 12345;
  const rand = () => (rng = (rng * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let d = 0; d < days; d++) {
    const today = 1000 + d;
    if (skipEvery && d % skipEvery === skipEvery - 1) { log.push({ steps: 0, skipped: true }); continue; }
    const ses = FP.buildSession(s, 'es', today, { audio: true });
    let guard = 0;
    while (ses.i < ses.steps.length) {
      const st = ses.steps[ses.i];
      assert.ok(++guard < 5000, 'session must terminate');
      if (!st.id) { FP.answer(s, ses, true, null, today); continue; }
      const card = s.courses.es.cards[st.id];
      const p = st.t === 'intro' ? 1 : Math.min(0.98, skill + (card ? Math.min(card.r, 4) * 0.03 : 0));
      FP.answer(s, ses, rand() < p, null, today);
    }
    log.push({ steps: ses.steps.length, fresh: ses.fresh.length, reviews: ses.reviews });
  }
  return { s, log };
}

test('a session teaches each new item several times and ends with recall', () => {
  const s = makeState(10, 'both');
  const ses = FP.buildSession(s, 'es', 1000, { audio: true });
  assert.equal(ses.fresh.length, 6);
  for (const id of ses.fresh) {
    const types = ses.steps.filter(x => x.id === id).map(x => x.t);
    assert.equal(types[0], 'intro', id);
    assert.ok(types.length >= 4, `${id}: ${types}`);
    assert.ok(['type', 'dictate', 'speak'].includes(types.at(-1)), `${id}: ${types}`);
  }
  const speakOnly = FP.buildSession(makeState(10, 'speak'), 'es', 1000, { audio: true });
  assert.ok(!speakOnly.steps.some(x => x.t === 'type' || x.t === 'dictate'), 'speak-only never asks for typing');
  const noAudio = FP.buildSession(makeState(10, 'both'), 'es', 1000, { audio: false });
  assert.ok(!noAudio.steps.some(x => x.t === 'listen' || x.t === 'dictate'), 'no listening steps without a voice');
});

test('wrong answers come back in the same session and the item is rescheduled sooner', () => {
  const s = makeState(10, 'both');
  const ses = FP.buildSession(s, 'es', 1000, { audio: false });
  const n = ses.steps.length;
  while (ses.steps[ses.i].t !== 'choose') FP.answer(s, ses, true, null, 1000);
  const id = ses.steps[ses.i].id;
  FP.answer(s, ses, false, null, 1000);
  assert.equal(ses.steps.length, n + 1);
  assert.ok(ses.steps.slice(ses.i).some(x => x.id === id && x.retry));
  while (ses.i < ses.steps.length) FP.answer(s, ses, true, null, 1000);
  assert.ok(s.courses.es.cards[id].ef < 2.3);
  assert.equal(Object.keys(s.courses.es.cards).length, 6);
  assert.equal(s.days[1000].done, 1);
  assert.equal(FP.streak(s, 1000), 1);
  assert.equal(FP.streak(s, 1001), 1);
  assert.equal(FP.streak(s, 1002), 0);
});

test('progress survives a save and reload, including a half-finished session', () => {
  const store = {};
  ctx.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
  const s = makeState(15, 'both');
  s.session = FP.buildSession(s, 'es', 1000, { audio: true });
  for (let i = 0; i < 7; i++) FP.answer(s, s.session, true, null, 1000);
  FP.save(s);
  const back = FP.load();
  assert.equal(back.session.i, 7);
  assert.equal(back.session.steps.length, s.session.steps.length);
  assert.deepEqual(JSON.parse(JSON.stringify(back.courses)), JSON.parse(JSON.stringify(s.courses)));
  assert.throws(() => FP.validate({ hello: 1 }));
});

test('simulated learners: daily workload stays near the chosen time and the course completes', () => {
  for (const [minutes, skill] of [[10, 0.85], [20, 0.8], [30, 0.9], [60, 0.85], [10, 0.6]]) {
    const days = Math.ceil(460 / FP.newPerDay(minutes, 1)) + 30;
    const { s, log } = simulate(minutes, 'both', days, skill);
    const st = FP.stats(s.courses.es, 1000 + days);
    const active = log.filter(l => l.steps);
    const avg = active.reduce((a, l) => a + l.steps, 0) / active.length;
    const max = Math.max(...active.map(l => l.steps));
    const estMin = avg * 12 / 60;
    console.log(`    ${minutes} min/day, skill ${skill}: learned ${st.learned}/460 in ${days} days, avg ${avg.toFixed(0)} steps (~${estMin.toFixed(1)} min), max ${max} steps`);
    if (skill >= 0.8) assert.equal(st.learned, 460, `${minutes} min plan should finish the course`);
    else assert.ok(st.learned >= 200, 'a struggling learner is slowed down, not stopped');
    assert.ok(estMin <= minutes * 1.5, `avg session ${estMin.toFixed(1)} min is too long for a ${minutes} min plan`);
    assert.ok(max * 12 / 60 <= minutes * 2.2, `longest session ${(max * 12 / 60).toFixed(1)} min is too long for ${minutes} min plan`);
  }
});

test('missing days builds a backlog that slows new material instead of burying the learner', () => {
  const { s, log } = simulate(15, 'both', 80, 0.8, 3);
  const max = Math.max(...log.map(l => l.steps));
  console.log(`    skipping every 3rd day at 15 min: max ${max} steps, learned ${FP.stats(s.courses.es, 1080).learned}`);
  assert.ok(max * 12 / 60 <= 15 * 2.5);
});

test('placement and plan', () => {
  const s = makeState(20, 'both', [{ lang: 'en', level: 'native' }, { lang: 'es', level: 'a2' }]);
  const n = FP.skipUnits(s.courses.es, FP.placementUnit('es', s.profile.known), 1000);
  assert.equal(n, 8 * 23);
  assert.equal(FP.currentUnit(s.courses.es), 8);
  const p = FP.plan(s, 'es', 1000);
  assert.equal(p.phases[0].done, true);
  assert.equal(p.daysLeft, Math.ceil((460 - n) / 12));
  assert.ok(p.fluencyHours > 300 && p.fluencyYears > 1);
});

console.log(`\n${passed} test groups passed`);

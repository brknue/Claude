// Content validation: run with `node tests.mjs`
import fs from 'node:fs';
import vm from 'node:vm';
const ctx = { window: {} };
vm.createContext(ctx);
const langs = ['de', 'en', 'tr', 'ar', 'ru', 'uk'];
for (const l of langs) vm.runInContext(fs.readFileSync(new URL(`./i18n/${l}.js`, import.meta.url), 'utf8'), ctx, { filename: l });
vm.runInContext(fs.readFileSync(new URL('./gen.js', import.meta.url), 'utf8'), ctx);
const I = ctx.window.BIO_I18N, G = ctx.window.BIOGEN;
let fails = 0;
const fail = (m) => { fails++; console.error('FAIL', m); };
const de = I.de;
for (const l of langs) {
  const L = I[l];
  if (!L) { fail(l + ' missing'); continue; }
  for (const k of Object.keys(de.ui)) if (L.ui[k] == null) fail(`${l} ui.${k}`);
  for (const k of Object.keys(de.lab)) if (L.lab[k] == null) fail(`${l} lab.${k}`);
  for (const k of ['mitPh', 'mitCap', 'repCap', 'trCap', 'tlCap']) if (L.lab[k] && L.lab[k].length !== de.lab[k].length) fail(`${l} lab.${k} length`);
  if (L.chapters.length !== de.chapters.length) fail(`${l} chapter count`);
  L.chapters.forEach((ch, i) => {
    const d = de.chapters[i];
    if (ch.id !== d.id) fail(`${l} chapter id ${ch.id}`);
    const anims = (s) => (s.match(/data-anim="(\w+)"/g) || []).join();
    if (ch.sections.map((s) => anims(s.html)).join('|') !== d.sections.map((s) => anims(s.html)).join('|')) fail(`${l}/${ch.id} animations differ`);
    if (ch.quiz.length < 7) fail(`${l}/${ch.id} quiz too short`);
    ch.quiz.forEach((q, j) => { if (!(q.o.length === 4 && q.c >= 0 && q.c < 4)) fail(`${l}/${ch.id} q${j}`); if (new Set(q.o).size !== 4) fail(`${l}/${ch.id} q${j} duplicate options`); });
    if (ch.terms.length !== d.terms.length) fail(`${l}/${ch.id} terms ${ch.terms.length}/${d.terms.length}`);
    if (l !== 'de') ch.terms.forEach((t) => { if (t.length !== 3) fail(`${l}/${ch.id} term without German: ${t[0]}`); });
    if ((ch.tasks || []).length !== (d.tasks || []).length) fail(`${l}/${ch.id} tasks`);
  });
  if (L.checklist.length !== de.checklist.length) fail(`${l} checklist`);
}
// Genetic code sanity
const exp = { AUG: 'Met', UUU: 'Phe', UAA: 'Stop', UAG: 'Stop', UGA: 'Stop', UGG: 'Trp', GCU: 'Ala', AAA: 'Lys', GGC: 'Gly', UUC: 'Phe', CAU: 'His', AGA: 'Arg', AGU: 'Ser', GAU: 'Asp', GAA: 'Glu', CAA: 'Gln', AAU: 'Asn', UGU: 'Cys', AUA: 'Ile', CCC: 'Pro', ACG: 'Thr', GUA: 'Val', CUG: 'Leu', UAU: 'Tyr' };
for (const [c, a] of Object.entries(exp)) if (G.CODE[c] !== a) fail(`code ${c}=${G.CODE[c]} expected ${a}`);
if (Object.keys(G.CODE).length !== 64) fail('code size');
// Worked example used in tasks
const t = 'TACCGAAAGTTTACT', m = G.transcribe(t);
if (m !== 'AUGGCUUUCAAAUGA') fail('transcribe ' + m);
if (G.translate(m).join('-') !== 'Met-Ala-Phe-Lys-Stop') fail('translate');
if (G.comp('ATGCCTAGGTTA') !== 'TACGGATCCAAT') fail('comp');
// Generated tasks: the solution must be accepted
for (const type of ['comp', 'trans', 'transl', 'count']) for (let i = 0; i < 300; i++) {
  const k = G.task(type);
  if (!k.check(k.solution.replace(/\(.*\)/, ''))) fail(`task ${type} rejects own solution ${k.solution}`);
  if (k.check('xyz')) fail(`task ${type} accepts garbage`);
}
console.log(fails ? `${fails} failures` : 'All content checks passed');
process.exit(fails ? 1 : 0);

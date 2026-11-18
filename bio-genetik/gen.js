/* Genetik verstehen – genetic code + unlimited generated practice tasks. */
(function () {
  'use strict';
  var B = 'UCAG';
  // Standard genetic code, order: 1st base U,C,A,G / 2nd U,C,A,G / 3rd U,C,A,G
  var AA = ('Phe Phe Leu Leu Ser Ser Ser Ser Tyr Tyr Stop Stop Cys Cys Stop Trp ' +
    'Leu Leu Leu Leu Pro Pro Pro Pro His His Gln Gln Arg Arg Arg Arg ' +
    'Ile Ile Ile Met Thr Thr Thr Thr Asn Asn Lys Lys Ser Ser Arg Arg ' +
    'Val Val Val Val Ala Ala Ala Ala Asp Asp Glu Glu Gly Gly Gly Gly').split(' ');
  var CODE = {};
  for (var i = 0; i < 64; i++) CODE[B[i >> 4] + B[(i >> 2) & 3] + B[i & 3]] = AA[i];
  var DNA_COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
  var TO_RNA = { A: 'U', T: 'A', G: 'C', C: 'G' }; // template DNA base -> mRNA base

  function rnd(n) { return Math.floor(Math.random() * n); }
  function randDNA(n) { var s = ''; for (var i = 0; i < n; i++) s += 'ATGC'[rnd(4)]; return s; }
  function comp(s) { return s.split('').map(function (c) { return DNA_COMP[c] || c; }).join(''); }
  function transcribe(t) { return t.split('').map(function (c) { return TO_RNA[c] || c; }).join(''); }
  function translate(m) {
    var out = [];
    for (var i = 0; i + 2 < m.length; i += 3) { var a = CODE[m.substr(i, 3)]; out.push(a); if (a === 'Stop') break; }
    return out;
  }
  function triplets(s) { return s.replace(/(.{3})(?=.)/g, '$1 '); }
  function norm(v) { return String(v || '').toUpperCase().replace(/[^ACGTU]/g, ''); }
  function strandHtml(s, label) {
    return '<div class="muted" style="text-align:center;font-size:.85rem;margin-top:6px">' + label + '</div><div class="strand">' +
      s.split('').map(function (c, i) { return '<span class="base b-' + c + '"' + (i % 3 === 2 ? ' style="margin-inline-end:10px"' : '') + '>' + c + '</span>'; }).join('') + '</div>';
  }
  function randomMRNA(codons) {
    var senses = Object.keys(CODE).filter(function (k) { return CODE[k] !== 'Stop' && k !== 'AUG'; });
    var stops = ['UAA', 'UAG', 'UGA'];
    var m = 'AUG';
    for (var i = 0; i < codons; i++) m += senses[rnd(senses.length)];
    return m + stops[rnd(3)];
  }
  var SPECIES = [['human', 46], ['dog', 78], ['chimp', 48], ['potato', 48], ['fly', 8], ['horse', 64], ['cat', 38], ['maize', 20]];

  function task(type) {
    if (type === 'comp') {
      var s = randDNA(9 + 3 * rnd(2)), sol = comp(s);
      return {
        prompt: function (ui) { return ui('tComp'); }, show: strandHtml(s, "5' → 3'"), ph: 'ATG…',
        solution: triplets(sol) + "  (3' → 5')", check: function (v) { return norm(v) === sol; },
        explain: function (ui) { return ui('tCompX'); }
      };
    }
    if (type === 'trans') {
      var m = randomMRNA(2 + rnd(2)), t = m.split('').map(function (c) { return { A: 'T', U: 'A', G: 'C', C: 'G' }[c]; }).join('');
      return {
        prompt: function (ui) { return ui('tTrans'); }, show: strandHtml(t, "DNA (codogen) 3' → 5'"), ph: 'AUG…',
        solution: triplets(m) + "  (5' → 3')", check: function (v) { return norm(v) === m; },
        explain: function (ui) { return ui('tTransX'); }
      };
    }
    if (type === 'transl') {
      var mr = randomMRNA(2 + rnd(3)), aa = translate(mr), core = aa.filter(function (a) { return a !== 'Stop'; });
      return {
        prompt: function (ui) { return ui('tTransl'); }, show: strandHtml(mr, "mRNA 5' → 3'"), ph: 'Met-…',
        solution: aa.join(' – '),
        check: function (v) {
          var p = String(v || '').toLowerCase().split(/[^a-zäöü]+/).filter(Boolean).filter(function (x) { return x !== 'stop' && x !== 'stopp'; });
          return p.join(',') === core.map(function (a) { return a.toLowerCase(); }).join(',');
        },
        explain: function (ui) { return ui('tTranslX'); }
      };
    }
    // count
    var sp = SPECIES[rnd(SPECIES.length)], kind = rnd(4), ans, n2 = sp[1];
    ans = [n2 / 2, n2, n2 * 2, n2 / 2][kind];
    return {
      prompt: function (ui, lb) { return ui('tCount' + kind).replace('{sp}', lb['sp_' + sp[0]]).replace('{n}', n2); },
      show: '', ph: '123', solution: String(ans),
      check: function (v) { return parseInt(String(v).replace(/\D/g, ''), 10) === ans; },
      explain: function (ui) { return ui('tCountX'); }
    };
  }
  window.BIOGEN = { CODE: CODE, AA: AA, BASES: B, task: task, comp: comp, translate: translate, transcribe: transcribe, norm: norm };
})();

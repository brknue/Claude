/* Verity (browser edition): claims -> Wikipedia evidence, no server, no key.
 * Optional on-device AI (WebLLM, WebGPU) reads the found passages and gives a verdict.
 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const store = { get: k => { try { return localStorage.getItem('verity.' + k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem('verity.' + k, v); } catch (e) {} } };

  /* ---------------- texts ---------------- */
  const I = {
    en: { headline: 'Before you believe it, <em>follow the evidence.</em>', lead: 'Paste a post, an article or a link. Know finds the factual claims, looks each one up in Wikipedia and shows you the passages, so you can judge for yourself.',
      tabText: '≡ Text', tabLink: '↗ Link', textLabel: 'Paste the words you want to check', textHint: 'Posts, captions, transcripts or articles. Up to 30,000 characters.', linkLabel: 'Public article link',
      linkHint: 'The page is read through Jina Reader (a free public service). Logins, paywalls and video sites can’t be read: paste the text instead.', evLang: 'Look up evidence in', find: 'Find the claims',
      claimsTitle: 'Claims found', claimsHint: 'Untick anything that isn’t a factual claim, or add your own.', addPh: 'Add a claim…', add: 'Add', check: 'Check the evidence', report: 'Evidence report',
      copy: 'Copy', download: 'Download', print: 'Print / PDF', aiTitle: 'Optional: let an on-device AI read the evidence',
      aiHint: 'Runs entirely in your browser (no key, nothing sent to an AI company). Downloads a small model once (about 1 GB) and needs WebGPU: current Chrome or Edge, or Safari 26+. It only reads the passages shown below, so it can still be wrong.',
      aiRun: 'Ask the on-device AI', howTitle: 'How it works',
      how1: '1. Know splits the text into sentences and keeps those that state checkable facts (numbers, dates, names, “is/was/has”). You can edit the list.',
      how2: '2. For each claim it searches Wikipedia and reads the best matching articles, then picks the sentences that share the most words and numbers with the claim.',
      how3: '3. Labels: <b>Numbers match</b> = the passage talks about the same thing and contains the claim’s numbers. <b>Numbers differ</b> = the same topic with other numbers, read carefully. <b>Related</b> = on topic, but not decisive. <b>Nothing clear</b> = no good passage found. These are automatic text matches, not verdicts.',
      how4: 'Limits: Wikipedia can be incomplete or out of date, recent news is often missing, and word matching can miss meaning. Open the sources before you rely on anything.',
      privacy: 'Privacy: no account, no tracking. Search words go to Wikipedia; links go to Jina Reader; the optional AI model is downloaded from Hugging Face. Nothing is stored except your theme and language.',
      foot: 'Curiosity over certainty.', more: 'More projects',
      needText: 'Paste some text first (at least one full sentence).', badUrl: 'Enter a full public link starting with https://', reading: 'Reading the page…', readFail: 'This page could not be read. Open it, copy the text and paste it in the Text tab.',
      noClaims: 'No checkable factual claims found. Try sentences with names, numbers or dates, or add a claim yourself.', found: '{n} claims found.', searching: 'Looking up claim {i} of {n}…', done: 'Done.', netFail: 'Wikipedia could not be reached. Check your connection and try again.',
      l_match: 'Numbers match', l_differ: 'Numbers differ', l_related: 'Related', l_none: 'Nothing clear', from: 'from', noEv: 'No matching passage found in Wikipedia for this claim.',
      ai_supported: 'AI: supported', ai_contradicted: 'AI: contradicted', ai_unclear: 'AI: not enough evidence', aiNoGPU: 'This browser has no WebGPU, so the on-device AI can’t run here. The evidence above still works.',
      aiLoading: 'Loading the model… {p}% (only the first time)', aiReading: 'AI is reading claim {i} of {n}…', aiDone: 'AI finished. Check the passages yourself, the AI can be wrong.', aiFail: 'The AI could not run: {e}',
      copied: 'Copied.', maxClaims: 'Only the first 10 claims are checked.', theme: 'Dark mode', themeL: 'Light mode' },
    de: { headline: 'Bevor du es glaubst, <em>folge den Belegen.</em>', lead: 'Füge einen Beitrag, einen Artikel oder einen Link ein. Know findet die Tatsachenbehauptungen, schlägt jede in Wikipedia nach und zeigt dir die Stellen, damit du selbst urteilen kannst.',
      tabText: '≡ Text', tabLink: '↗ Link', textLabel: 'Füge den Text ein, den du prüfen willst', textHint: 'Beiträge, Untertitel, Transkripte oder Artikel. Bis zu 30.000 Zeichen.', linkLabel: 'Öffentlicher Artikel-Link',
      linkHint: 'Die Seite wird über Jina Reader gelesen (ein kostenloser öffentlicher Dienst). Logins, Bezahlschranken und Videoseiten gehen nicht: dann den Text einfügen.', evLang: 'Belege suchen in', find: 'Behauptungen finden',
      claimsTitle: 'Gefundene Behauptungen', claimsHint: 'Entferne den Haken bei allem, was keine Tatsachenbehauptung ist, oder füge eigene hinzu.', addPh: 'Behauptung hinzufügen…', add: 'Hinzufügen', check: 'Belege prüfen', report: 'Belegbericht',
      copy: 'Kopieren', download: 'Herunterladen', print: 'Drucken / PDF', aiTitle: 'Optional: eine KI auf deinem Gerät die Belege lesen lassen',
      aiHint: 'Läuft komplett in deinem Browser (kein Schlüssel, nichts geht an eine KI-Firma). Lädt einmalig ein kleines Modell (etwa 1 GB) und braucht WebGPU: aktuelles Chrome oder Edge oder Safari 26+. Sie liest nur die unten gezeigten Stellen und kann sich trotzdem irren.',
      aiRun: 'KI auf dem Gerät fragen', howTitle: 'So funktioniert es',
      how1: '1. Know zerlegt den Text in Sätze und behält die, die prüfbare Fakten nennen (Zahlen, Daten, Namen, „ist/war/hat“). Du kannst die Liste bearbeiten.',
      how2: '2. Für jede Behauptung sucht es in Wikipedia, liest die passendsten Artikel und wählt die Sätze, die die meisten Wörter und Zahlen mit der Behauptung teilen.',
      how3: '3. Markierungen: <b>Zahlen passen</b> = die Stelle behandelt dasselbe und enthält die Zahlen der Behauptung. <b>Zahlen weichen ab</b> = gleiches Thema, andere Zahlen, genau lesen. <b>Verwandt</b> = zum Thema, aber nicht entscheidend. <b>Nichts Eindeutiges</b> = keine gute Stelle gefunden. Das sind automatische Textvergleiche, keine Urteile.',
      how4: 'Grenzen: Wikipedia kann unvollständig oder veraltet sein, aktuelle Nachrichten fehlen oft, und Wortvergleiche können Bedeutungen übersehen. Öffne die Quellen, bevor du dich auf etwas verlässt.',
      privacy: 'Datenschutz: kein Konto, kein Tracking. Suchwörter gehen an Wikipedia, Links an Jina Reader, das optionale KI-Modell kommt von Hugging Face. Gespeichert werden nur Design und Sprache.',
      foot: 'Neugier vor Gewissheit.', more: 'Weitere Projekte',
      needText: 'Füge zuerst Text ein (mindestens einen ganzen Satz).', badUrl: 'Gib einen vollständigen öffentlichen Link mit https:// ein.', reading: 'Seite wird gelesen…', readFail: 'Diese Seite konnte nicht gelesen werden. Öffne sie, kopiere den Text und füge ihn im Tab Text ein.',
      noClaims: 'Keine prüfbaren Tatsachenbehauptungen gefunden. Versuche Sätze mit Namen, Zahlen oder Daten oder füge selbst eine hinzu.', found: '{n} Behauptungen gefunden.', searching: 'Schlage Behauptung {i} von {n} nach…', done: 'Fertig.', netFail: 'Wikipedia ist nicht erreichbar. Prüfe deine Verbindung und versuche es erneut.',
      l_match: 'Zahlen passen', l_differ: 'Zahlen weichen ab', l_related: 'Verwandt', l_none: 'Nichts Eindeutiges', from: 'aus', noEv: 'Keine passende Stelle in Wikipedia gefunden.',
      ai_supported: 'KI: gestützt', ai_contradicted: 'KI: widerlegt', ai_unclear: 'KI: zu wenig Belege', aiNoGPU: 'Dieser Browser hat kein WebGPU, die KI kann hier nicht laufen. Die Belege oben funktionieren trotzdem.',
      aiLoading: 'Modell wird geladen… {p} % (nur beim ersten Mal)', aiReading: 'KI liest Behauptung {i} von {n}…', aiDone: 'KI fertig. Prüfe die Stellen selbst, die KI kann sich irren.', aiFail: 'Die KI konnte nicht laufen: {e}',
      copied: 'Kopiert.', maxClaims: 'Nur die ersten 10 Behauptungen werden geprüft.', theme: 'Dunkelmodus', themeL: 'Hellmodus' },
    tr: { headline: 'İnanmadan önce <em>kanıtların izini sür.</em>', lead: 'Bir gönderi, makale ya da bağlantı yapıştır. Know olgusal iddiaları bulur, her birini Vikipedi’de arar ve ilgili bölümleri gösterir; kararı sen verirsin.',
      tabText: '≡ Metin', tabLink: '↗ Bağlantı', textLabel: 'Kontrol etmek istediğin metni yapıştır', textHint: 'Gönderiler, altyazılar, dökümler veya makaleler. En fazla 30.000 karakter.', linkLabel: 'Herkese açık makale bağlantısı',
      linkHint: 'Sayfa Jina Reader (ücretsiz, herkese açık bir hizmet) ile okunur. Giriş gerektiren, ücretli ve video sitelerinde metni yapıştır.', evLang: 'Kanıtları şurada ara', find: 'İddiaları bul',
      claimsTitle: 'Bulunan iddialar', claimsHint: 'Olgusal iddia olmayanların işaretini kaldır ya da kendin ekle.', addPh: 'İddia ekle…', add: 'Ekle', check: 'Kanıtları kontrol et', report: 'Kanıt raporu',
      copy: 'Kopyala', download: 'İndir', print: 'Yazdır / PDF', aiTitle: 'İsteğe bağlı: kanıtları cihazındaki yapay zekâ okusun',
      aiHint: 'Tamamen tarayıcında çalışır (anahtar yok, hiçbir şey bir yapay zekâ şirketine gitmez). Bir kez küçük bir model indirir (yaklaşık 1 GB) ve WebGPU gerekir: güncel Chrome veya Edge ya da Safari 26+. Yalnızca aşağıdaki bölümleri okur; yine de yanılabilir.',
      aiRun: 'Cihazdaki yapay zekâya sor', howTitle: 'Nasıl çalışır',
      how1: '1. Know metni cümlelere ayırır ve doğrulanabilir bilgi içerenleri (sayılar, tarihler, isimler) tutar. Listeyi düzenleyebilirsin.',
      how2: '2. Her iddia için Vikipedi’de arar, en uygun makaleleri okur ve iddiayla en çok sözcük ve sayıyı paylaşan cümleleri seçer.',
      how3: '3. Etiketler: <b>Sayılar uyuşuyor</b> = bölüm aynı konudan söz ediyor ve iddiadaki sayıları içeriyor. <b>Sayılar farklı</b> = aynı konu, başka sayılar; dikkatle oku. <b>İlgili</b> = konuyla ilgili ama belirleyici değil. <b>Net bir şey yok</b> = iyi bir bölüm bulunamadı. Bunlar otomatik metin eşleşmeleridir, hüküm değildir.',
      how4: 'Sınırlar: Vikipedi eksik ya da eski olabilir, güncel haberler çoğu zaman yoktur ve sözcük eşleşmesi anlamı kaçırabilir. Bir şeye güvenmeden önce kaynakları aç.',
      privacy: 'Gizlilik: hesap yok, izleme yok. Arama sözcükleri Vikipedi’ye, bağlantılar Jina Reader’a gider; isteğe bağlı yapay zekâ modeli Hugging Face’ten indirilir. Yalnızca tema ve dil saklanır.',
      foot: 'Kesinlikten önce merak.', more: 'Diğer projeler',
      needText: 'Önce metin yapıştır (en az bir tam cümle).', badUrl: 'https:// ile başlayan tam bir bağlantı gir.', reading: 'Sayfa okunuyor…', readFail: 'Bu sayfa okunamadı. Sayfayı aç, metni kopyala ve Metin sekmesine yapıştır.',
      noClaims: 'Doğrulanabilir olgusal iddia bulunamadı. İsim, sayı veya tarih içeren cümleler dene ya da kendin iddia ekle.', found: '{n} iddia bulundu.', searching: '{n} iddiadan {i}. aranıyor…', done: 'Bitti.', netFail: 'Vikipedi’ye ulaşılamadı. Bağlantını kontrol edip tekrar dene.',
      l_match: 'Sayılar uyuşuyor', l_differ: 'Sayılar farklı', l_related: 'İlgili', l_none: 'Net bir şey yok', from: 'kaynak', noEv: 'Bu iddia için Vikipedi’de uygun bölüm bulunamadı.',
      ai_supported: 'YZ: destekleniyor', ai_contradicted: 'YZ: çelişiyor', ai_unclear: 'YZ: yeterli kanıt yok', aiNoGPU: 'Bu tarayıcıda WebGPU yok, yapay zekâ burada çalışamaz. Yukarıdaki kanıtlar yine de geçerli.',
      aiLoading: 'Model yükleniyor… %{p} (yalnızca ilk sefer)', aiReading: 'Yapay zekâ {n} iddiadan {i}. okuyor…', aiDone: 'Yapay zekâ bitirdi. Bölümleri kendin de kontrol et; yapay zekâ yanılabilir.', aiFail: 'Yapay zekâ çalışamadı: {e}',
      copied: 'Kopyalandı.', maxClaims: 'Yalnızca ilk 10 iddia kontrol edilir.', theme: 'Koyu mod', themeL: 'Açık mod' }
  };
  let lang = store.get('lang') || ((navigator.language || 'en').slice(0, 2));
  if (!I[lang]) lang = 'en';
  const t = (k, v) => { let s = (I[lang] && I[lang][k]) || I.en[k] || k; if (v) for (const x in v) s = s.split('{' + x + '}').join(v[x]); return s; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const WIKIS = [['en', 'English'], ['de', 'Deutsch'], ['tr', 'Türkçe'], ['es', 'Español'], ['fr', 'Français'], ['it', 'Italiano'], ['pt', 'Português'], ['nl', 'Nederlands'], ['pl', 'Polski'], ['ru', 'Русский'], ['uk', 'Українська'], ['ar', 'العربية'], ['fa', 'فارسی'], ['hi', 'हिन्दी'], ['zh', '中文'], ['ja', '日本語'], ['ko', '한국어'], ['id', 'Indonesia'], ['vi', 'Tiếng Việt'], ['sv', 'Svenska']];

  function applyLang() {
    document.documentElement.lang = lang; $('lang').value = lang;
    document.querySelectorAll('[data-i]').forEach(el => { el.innerHTML = t(el.getAttribute('data-i')); }); // texts above are our own, trusted
    document.querySelectorAll('[data-ph]').forEach(el => { el.placeholder = t(el.getAttribute('data-ph')); });
    themeLabel(); if (lastReport) renderReport(lastReport);
  }
  function themeLabel() { const d = document.documentElement.getAttribute('data-theme') === 'dark'; $('theme').textContent = d ? '☀' : '☾'; $('theme').setAttribute('aria-label', d ? t('themeL') : t('theme')); }
  $('theme').onclick = () => { const n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); store.set('theme', n); themeLabel(); };
  $('lang').onchange = e => { lang = e.target.value; store.set('lang', lang); if (!store.get('wlang')) $('wlang').value = lang; applyLang(); };
  $('wlang').innerHTML = WIKIS.map(([c, n]) => `<option value="${c}">${esc(n)} — ${c}.wikipedia.org</option>`).join('');
  $('wlang').value = store.get('wlang') || lang;
  $('wlang').onchange = e => store.set('wlang', e.target.value);

  // tabs
  let mode = 'text';
  function tab(m) { mode = m; $('tText').setAttribute('aria-selected', m === 'text'); $('tLink').setAttribute('aria-selected', m === 'link'); $('pText').hidden = m !== 'text'; $('pLink').hidden = m !== 'link'; }
  $('tText').onclick = () => tab('text'); $('tLink').onclick = () => tab('link');
  const status = (msg, busy) => { $('status').innerHTML = (busy ? '<span class="spin"></span>' : '') + esc(msg || ''); };

  /* ---------------- text tools ---------------- */
  const STOP = new Set(('a an the and or but if of to in on at by for with from as is are was were be been being has have had do does did this that these those it its it\'s they them their there here which who whom whose what when where why how not no than then so such very more most also just only about into over after before between during under again further once all any both each few other some own same can will would should could may might must shall i you he she we me my your his her our us one two three said says say according new' +
    ' der die das ein eine einer eines einem einen und oder aber wenn von zu im in am an auf bei für mit aus als ist sind war waren sein wurde wurden hat haben hatte nicht kein keine dass auch nur noch schon sehr mehr über nach vor zwischen während unter wieder alle jede jeder sich es er sie wir ihr ich du man dem den des zum zur vom' +
    ' bir ve veya ama eğer ile için de da bu şu o olan olarak gibi daha çok en her hem ise ki mi mı mu mü ne değil var yok sonra önce kadar göre').split(/\s+/));
  const normW = w => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  const words = s => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []);
  const stem = w => { w = normW(w); return w.length > 5 ? w.slice(0, Math.max(5, Math.ceil(w.length * 0.75))) : w; };
  function keyTerms(s) { return words(s).filter(w => !STOP.has(w.toLowerCase()) && (w.length > 2 || /\d/.test(w))); }
  function numbers(s) {
    const out = []; const rx = /(\d{1,3}(?:[.,  ]\d{3})+|\d+(?:[.,]\d+)?)\s*(%|percent|prozent|yüzde|million|millionen|milyon|billion|milliarden|milyar|thousand|tausend|bin)?/gi; let m;
    while ((m = rx.exec(s))) {
      let raw = m[1], v;
      if (/^\d{1,3}([.,  ]\d{3})+$/.test(raw)) v = +raw.replace(/[.,  ]/g, ''); else v = +raw.replace(',', '.');
      const u = (m[2] || '').toLowerCase();
      if (/^(million|millionen|milyon)$/.test(u)) v *= 1e6; else if (/^(billion|milliarden|milyar)$/.test(u)) v *= 1e9; else if (/^(thousand|tausend|bin)$/.test(u)) v *= 1e3;
      if (isFinite(v)) out.push({ v, pct: /%|percent|prozent|yüzde/i.test(u), year: /^\d{4}$/.test(raw) && v >= 1000 && v <= 2100 });
    }
    return out;
  }
  const sameNum = (a, b) => a.v === b.v || (a.v && Math.abs(a.v - b.v) / Math.abs(a.v) < 0.015);

  function sentences(text) {
    return String(text).replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+(?=[\p{Lu}\d"“„«])/u).map(s => s.trim()).filter(Boolean);
  }
  function extractClaims(text) {
    const OPINION = /\b(i think|i believe|in my opinion|should|must|beautiful|amazing|terrible|best|worst|love|hate|ich finde|meiner meinung|sollte|schön|bence|bence|güzel|berbat|en iyi)\b/i;
    const out = [];
    for (let s of sentences(text)) {
      if (s.length < 25 || s.length > 400) continue;
      if (/\?\s*$/.test(s)) continue;
      const w = words(s); if (w.length < 5) continue;
      let score = 0;
      if (/\d/.test(s)) score += 2;
      const caps = w.slice(1).filter(x => /^\p{Lu}/u.test(x)).length; score += Math.min(3, caps) * 0.8;
      if (/\b(is|was|are|were|has|had|have|became|founded|born|died|built|won|killed|discovered|invented|located|largest|smallest|first|highest|ist|war|sind|hat|wurde|gegründet|geboren|gestorben|größte|erste|höchste|dır|dir|dur|dür|tır|tir|tur|tür|oldu|kuruldu|doğdu|öldü|en büyük|ilk)\b/i.test(s)) score += 1;
      if (OPINION.test(s)) score -= 2;
      if (score >= 2) out.push({ text: s, score, on: true });
    }
    return out.slice(0, 12);
  }

  /* ---------------- evidence ---------------- */
  const wikiApi = (L, params) => `https://${L}.wikipedia.org/w/api.php?` + new URLSearchParams(Object.assign({ format: 'json', origin: '*', formatversion: '2' }, params));
  async function getJSON(url) { const r = await fetch(url, { referrerPolicy: 'no-referrer' }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }
  const pageCache = new Map();
  async function pageText(L, title) {
    const key = L + ':' + title; if (pageCache.has(key)) return pageCache.get(key);
    const j = await getJSON(wikiApi(L, { action: 'query', prop: 'extracts', explaintext: '1', exsectionformat: 'plain', redirects: '1', titles: title }));
    const p = (j.query && j.query.pages && j.query.pages[0]) || {}; const txt = (p.extract || '').slice(0, 120000);
    const res = { title: p.title || title, text: txt }; pageCache.set(key, res); return res;
  }
  async function search(L, q) {
    if (!q.trim()) return [];
    const j = await getJSON(wikiApi(L, { action: 'query', list: 'search', srsearch: q, srlimit: '3', srprop: '' }));
    return ((j.query && j.query.search) || []).map(x => x.title);
  }
  function queries(claim) {
    const w = keyTerms(claim);
    const caps = w.filter((x, i) => /^\p{Lu}/u.test(x) && !(i === 0 && claim.startsWith(x) && STOP.has(x.toLowerCase())));
    const longest = w.filter(x => !/^\d+$/.test(x)).sort((a, b) => b.length - a.length).slice(0, 4);
    const qs = [];
    if (caps.length) qs.push(caps.slice(0, 4).join(' ') + ' ' + longest.filter(x => !caps.includes(x)).slice(0, 2).join(' '));
    if (caps.length) qs.push(caps.slice(0, 3).join(' '));
    qs.push(longest.slice(0, 3).join(' '));
    return [...new Set(qs.map(q => q.trim()).filter(Boolean))];
  }
  function scoreSentence(claimTerms, claimNums, sent) {
    const st = new Set(keyTerms(sent).map(stem)); let hit = 0;
    claimTerms.forEach(x => { if (st.has(x)) hit++; });
    const overlap = claimTerms.length ? hit / claimTerms.length : 0;
    const sn = numbers(sent);
    const numHits = claimNums.filter(a => sn.some(b => sameNum(a, b))).length;
    return { overlap, numHits, sn, score: overlap + numHits * 0.35 };
  }
  async function checkClaim(claim, L) {
    const cTerms = [...new Set(keyTerms(claim).filter(x => !/^\d+$/.test(x)).map(stem))];
    const cNums = numbers(claim);
    let titles = [];
    for (const q of queries(claim)) { titles = await search(L, q); if (titles.length) break; }
    const cands = [];
    for (const title of titles.slice(0, 3)) {
      const pg = await pageText(L, title);
      for (const s of sentences(pg.text)) {
        if (s.length < 20 || s.length > 600) continue;
        const sc = scoreSentence(cTerms, cNums, s);
        if (sc.overlap > 0.15 || sc.numHits) cands.push(Object.assign({ s, title: pg.title }, sc));
      }
    }
    cands.sort((a, b) => b.score - a.score);
    const ev = []; const seen = new Set();
    for (const c of cands) { if (seen.has(c.s)) continue; seen.add(c.s); ev.push(c); if (ev.length >= 3) break; }
    let label = 'none';
    const best = ev[0];
    if (best) {
      const allNums = cNums.length && cNums.every(a => ev.some(e => e.overlap >= 0.3 && e.sn.some(b => sameNum(a, b))));
      const kindClash = cNums.length && ev.some(e => e.overlap >= 0.45 && e.sn.length && cNums.some(a => e.sn.some(b => b.year === a.year && b.pct === a.pct)) && !cNums.every(a => e.sn.some(b => sameNum(a, b))));
      if (allNums && best.overlap >= 0.3) label = 'match';
      else if (kindClash) label = 'differ';
      else if (best.overlap >= 0.4) label = 'related';
    }
    return { claim, label, ev: ev.map(e => ({ s: e.s, title: e.title, url: `https://${L}.wikipedia.org/wiki/${encodeURIComponent(e.title.replace(/ /g, '_'))}` })), titles, wiki: L, cNums };
  }

  /* ---------------- flow ---------------- */
  let claims = [], lastReport = null;
  function renderClaims() {
    $('claims').innerHTML = claims.map((c, i) => `<li><input type="checkbox" id="c${i}" ${c.on ? 'checked' : ''} aria-label="✓"><label class="ct" for="c${i}" style="font-weight:400;margin:0">${esc(c.text)}</label></li>`).join('');
    claims.forEach((c, i) => { $('c' + i).onchange = e => { c.on = e.target.checked; }; });
    $('claimBox').hidden = false;
  }
  async function readLink(u) {
    const r = await fetch('https://r.jina.ai/' + u, { headers: { 'Accept': 'text/plain', 'X-Return-Format': 'text' }, referrerPolicy: 'no-referrer' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const txt = await r.text(); if (!txt || txt.length < 80) throw new Error('empty'); return txt.slice(0, 30000);
  }
  $('find').onclick = async () => {
    $('report').hidden = true; let text = '';
    if (mode === 'link') {
      const u = $('url').value.trim();
      if (!/^https:\/\/[^\s/$.?#][^\s]*$/i.test(u)) return status(t('badUrl'));
      status(t('reading'), true); $('find').disabled = true;
      try { text = await readLink(u); } catch (e) { status(t('readFail')); $('find').disabled = false; return; }
      $('find').disabled = false;
    } else text = $('text').value.trim();
    if (!text || text.length < 20) return status(t('needText'));
    claims = extractClaims(text);
    if (!claims.length && mode === 'text' && text.length <= 400) claims = [{ text, on: true }];
    if (!claims.length) { $('claimBox').hidden = false; claims = []; renderClaims(); return status(t('noClaims')); }
    renderClaims(); status(t('found', { n: claims.length }));
    $('claimBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $('addBtn').onclick = () => { const v = $('addClaim').value.trim(); if (v.length < 5) return; claims.push({ text: v.slice(0, 400), on: true }); $('addClaim').value = ''; renderClaims(); };
  $('addClaim').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('addBtn').click(); } };
  $('check').onclick = async () => {
    let list = claims.filter(c => c.on).map(c => c.text);
    if (!list.length) return;
    if (list.length > 10) { list = list.slice(0, 10); }
    const L = $('wlang').value; $('check').disabled = true; $('find').disabled = true;
    const results = [];
    try {
      for (let i = 0; i < list.length; i++) {
        status(t('searching', { i: i + 1, n: list.length }), true);
        results.push(await checkClaim(list[i], L));
      }
      status(t('done') + (claims.filter(c => c.on).length > 10 ? ' ' + t('maxClaims') : ''));
      lastReport = { results, L, date: new Date() }; renderReport(lastReport);
      $('report').hidden = false; $('report').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { status(t('netFail')); }
    finally { $('check').disabled = false; $('find').disabled = false; }
  };

  function highlight(s, nums) {
    let h = esc(s);
    nums.forEach(n => { const variants = [String(n.v), n.v.toLocaleString('en'), n.v.toLocaleString('de')]; variants.forEach(v => { if (v.length > 0) h = h.split(esc(v)).join('<mark>' + esc(v) + '</mark>'); }); });
    return h;
  }
  function renderReport(rep) {
    const counts = { match: 0, differ: 0, related: 0, none: 0 }; rep.results.forEach(r => counts[r.label]++);
    $('summary').innerHTML = Object.keys(counts).filter(k => counts[k]).map(k => `<span class="badge b-${k}">${esc(t('l_' + k))}: ${counts[k]}</span>`).join('');
    $('results').innerHTML = rep.results.map((r, i) => `<article class="result" id="r${i}">
      <h3>${esc(r.claim)}</h3>
      <span class="badge b-${r.label}">${esc(t('l_' + r.label))}</span>${r.ai ? `<span class="badge b-${r.ai.verdict}">${esc(t('ai_' + r.ai.verdict))}</span>` : ''}
      ${r.ai && r.ai.reason ? `<div class="ai">${esc(r.ai.reason)}</div>` : ''}
      ${r.ev.length ? r.ev.map(e => `<blockquote>${highlight(e.s, r.cNums)}<cite>${esc(t('from'))} <a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.title)} · ${esc(r.wiki)}.wikipedia.org ↗</a></cite></blockquote>`).join('') : `<p class="hint">${esc(t('noEv'))}</p>`}
    </article>`).join('');
  }
  function reportText(rep) {
    return 'Know — ' + t('report') + ' (' + rep.date.toLocaleString(lang) + ')\n\n' + rep.results.map((r, i) =>
      `${i + 1}. ${r.claim}\n   [${t('l_' + r.label)}]${r.ai ? ' [' + t('ai_' + r.ai.verdict) + '] ' + (r.ai.reason || '') : ''}\n` + r.ev.map(e => `   • "${e.s}"\n     ${e.url}`).join('\n')).join('\n\n') + '\n';
  }
  $('copy').onclick = () => { if (!lastReport) return; navigator.clipboard.writeText(reportText(lastReport)).then(() => status(t('copied'))).catch(() => {}); };
  $('dl').onclick = () => { if (!lastReport) return; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([reportText(lastReport)], { type: 'text/plain' })); a.download = 'know-report.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); };
  $('print').onclick = () => window.print();

  /* ---------------- optional on-device AI ---------------- */
  let engine = null;
  const MODEL = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
  $('aiRun').onclick = async () => {
    const st = m => { $('aiStatus').textContent = m; };
    if (!lastReport) return;
    if (!navigator.gpu) return st(t('aiNoGPU'));
    $('aiRun').disabled = true;
    try {
      if (!engine) {
        const webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/+esm');
        engine = await webllm.CreateMLCEngine(MODEL, { initProgressCallback: p => st(t('aiLoading', { p: Math.round((p.progress || 0) * 100) })) });
      }
      const rs = lastReport.results;
      for (let i = 0; i < rs.length; i++) {
        st(t('aiReading', { i: i + 1, n: rs.length }));
        const r = rs[i];
        if (!r.ev.length) { r.ai = { verdict: 'unclear', reason: '' }; continue; }
        const ev = r.ev.map((e, k) => `[${k + 1}] ${e.s}`).join('\n');
        const langName = { en: 'English', de: 'German', tr: 'Turkish' }[lang] || 'English';
        const out = await engine.chat.completions.create({ temperature: 0, max_tokens: 160, messages: [
          { role: 'system', content: 'You check one claim against evidence passages. Use ONLY the passages. Reply with JSON only: {"verdict":"supported"|"contradicted"|"unclear","reason":"one short sentence in ' + langName + '"}. Say "unclear" when the passages do not clearly settle the claim.' },
          { role: 'user', content: 'CLAIM: ' + r.claim + '\n\nPASSAGES:\n' + ev } ] });
        const txt = (out.choices && out.choices[0] && out.choices[0].message.content) || '';
        let v = 'unclear', reason = '';
        try { const j = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)); if (['supported', 'contradicted', 'unclear'].includes(j.verdict)) v = j.verdict; reason = String(j.reason || '').slice(0, 300); } catch (e) {}
        r.ai = { verdict: v, reason }; renderReport(lastReport);
      }
      st(t('aiDone'));
    } catch (e) { st(t('aiFail', { e: (e && e.message) || e })); }
    finally { $('aiRun').disabled = false; }
  };

  applyLang();
  window.VerityLocal = { extractClaims, numbers, queries, checkClaim };
})();

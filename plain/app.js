/* plain — app logic. Data lives in projects.js; this file normally never needs editing. */
(function () {
  'use strict';
  var REPO = 'https://github.com/brknue/claude/tree/main/';
  var I18N = window.PLAIN_I18N, P = window.PLAIN_PROJECTS || [], FILES = window.PLAIN_FILES || {};
  var $ = function (id) { return document.getElementById(id); };
  var store = {
    get: function (k) { try { return localStorage.getItem('plain.' + k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('plain.' + k, v); } catch (e) {} }
  };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- language ---------- */
  function pickLang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q && I18N[q]) return q;
    var s = store.get('lang'); if (s && I18N[s]) return s;
    var nav = (navigator.languages || [navigator.language || 'en']);
    for (var i = 0; i < nav.length; i++) { var c = String(nav[i]).toLowerCase().split('-')[0]; if (c === 'nb' || c === 'nn') c = 'no'; if (I18N[c]) return c; }
    return 'en';
  }
  var lang = pickLang();
  function t(k, vars) { var s = (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k; if (vars) for (var v in vars) s = s.replace('{' + v + '}', vars[v]); return s; }
  function desc(p) { return (p.desc && (p.desc[lang] || p.desc.en)) || ''; }

  function fillLangSelect() {
    var sel = $('lang'), html = '';
    Object.keys(I18N).forEach(function (c) { html += '<option value="' + c + '"' + (c === lang ? ' selected' : '') + '>' + esc(I18N[c]._n) + '</option>'; });
    html += '<optgroup label="' + esc(t('more')) + '">';
    (window.PLAIN_MORE_LANGS || []).forEach(function (l) { html += '<option value="gt:' + l[0] + '">' + esc(l[1]) + '</option>'; });
    html += '</optgroup>';
    sel.innerHTML = html;
  }
  function googleTranslate(code) {
    var host = location.hostname.replace(/-/g, '--').replace(/\./g, '-') + '.translate.goog';
    var url = 'https://' + host + location.pathname + '?lang=en&_x_tr_sl=en&_x_tr_tl=' + encodeURIComponent(code) + '&_x_tr_hl=' + encodeURIComponent(code);
    location.href = url;
  }
  function applyLang() {
    var d = I18N[lang] || I18N.en;
    document.documentElement.lang = lang;
    document.documentElement.dir = d._rtl ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
    $('q').placeholder = t('search');
    $('dClose').setAttribute('aria-label', t('close'));
    $('pClose').setAttribute('aria-label', t('close'));
    $('lang').setAttribute('aria-label', t('language'));
    applyThemeLabel();
    render();
    if (current) fillDialog(current);
  }

  /* ---------- theme ---------- */
  function theme() { return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function applyThemeLabel() {
    var dark = theme() === 'dark', b = $('theme');
    b.textContent = dark ? '☀' : '☾';
    b.setAttribute('aria-label', dark ? t('light') : t('dark'));
    b.title = dark ? t('light') : t('dark');
    $('themeColor').setAttribute('content', dark ? '#000000' : '#ffffff');
  }

  /* ---------- view ---------- */
  var view = store.get('view') === 'grid' ? 'grid' : 'list';
  function applyView() {
    document.body.classList.toggle('grid', view === 'grid');
    $('vList').setAttribute('aria-pressed', String(view === 'list'));
    $('vGrid').setAttribute('aria-pressed', String(view === 'grid'));
  }

  /* ---------- list ---------- */
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function haystack(p) {
    var parts = [p.name, p.id].concat(Object.keys(p.desc || {}).map(function (k) { return p.desc[k]; }));
    (p.tags || []).forEach(function (g) { parts.push(t('t_' + g), I18N.en['t_' + g]); });
    return norm(parts.join(' '));
  }
  function metaLine(p) { return (p.tags || []).map(function (g) { return t('t_' + g); }).join(' · '); }
  function render() {
    var words = norm($('q').value).split(/\s+/).filter(Boolean);
    var list = P.filter(function (p) { var h = haystack(p); return words.every(function (w) { return h.indexOf(w) >= 0; }); });
    $('items').innerHTML = list.map(function (p) {
      return '<li class="item"><button type="button" data-id="' + esc(p.id) + '"><span class="name">' + esc(p.name) + '</span><span class="desc">' + esc(desc(p)) + '</span><span class="meta">' + esc(metaLine(p)) + '</span></button></li>';
    }).join('');
    $('empty').hidden = list.length > 0;
    $('count').textContent = list.length === 1 ? t('count1') : t('count', { n: list.length });
  }

  /* ---------- detail ---------- */
  var current = null;
  function openUrl(p) { return p.open || null; }
  function size(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function fillDialog(p) {
    $('dName').textContent = p.name;
    $('dDesc').textContent = desc(p);
    var meta = metaLine(p);
    if (p.lang) { var ln = (window.Intl && Intl.DisplayNames) ? (function () { try { return new Intl.DisplayNames([lang], { type: 'language' }).of(p.lang); } catch (e) { return p.lang; } })() : p.lang; meta += (meta ? ' · ' : '') + t('content') + ': ' + ln; }
    $('dMeta').textContent = meta;
    var f = FILES[p.id] || { files: [], bytes: 0 }, a = [];
    var u = openUrl(p);
    a.push(u ? '<a class="primary" href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(t('open')) + ' ↗</a>'
             : '<span class="off" aria-disabled="true">' + esc(t('offline')) + '</span>');
    var entryName = p.entry.split('/').pop();
    if (f.files.length > 1) a.push('<button type="button" id="zipBtn">' + esc(t('zip')) + ' · ' + size(f.bytes) + '</button>');
    a.push('<a href="' + esc(p.entry) + '" download="' + esc(p.id + '-' + entryName) + '">' + esc(t('html')) + '</a>');
    a.push('<a href="' + esc(REPO + p.id) + '" target="_blank" rel="noopener">' + esc(t('github')) + ' ↗</a>');
    a.push('<button type="button" id="shareBtn">' + esc(t('share')) + '</button>');
    $('dActions').innerHTML = a.join('');
    $('dNotes').textContent = (p.notes || []).map(function (n) { return t('n_' + n); }).join(' ');
    if ($('zipBtn')) $('zipBtn').onclick = function () { downloadZip(p, this); };
    $('shareBtn').onclick = function () { copyLink(p); };
  }
  function openDialog(id, push) {
    var p = P.find(function (x) { return x.id === id; }); if (!p) return;
    current = p; fillDialog(p);
    if (push && location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    var d = $('dlg'); if (!d.open) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  }
  function closeDialog() {
    var d = $('dlg'); if (d.open) { if (d.close) d.close(); else d.removeAttribute('open'); }
  }
  $('dlg').addEventListener('close', function () {
    var id = current && current.id; current = null;
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    var b = id && document.querySelector('[data-id="' + id + '"]'); if (b) b.focus();
  });
  $('dlg').addEventListener('click', function (e) { if (e.target === this) closeDialog(); });
  $('dClose').onclick = closeDialog;

  function toast(msg) { var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2200); }
  function copyLink(p) {
    var url = location.origin + location.pathname + '#' + p.id;
    if (navigator.share && matchMedia('(pointer:coarse)').matches) { navigator.share({ title: p.name, url: url }).catch(function () {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast(t('copied')); }, function () { prompt('', url); });
  }
  function downloadZip(p, btn) {
    var f = FILES[p.id]; if (!f || btn.disabled) return;
    var label = btn.textContent; btn.disabled = true; btn.textContent = t('zipping');
    Promise.all(f.files.map(function (path) {
      return fetch(path, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(path); return r.arrayBuffer(); })
        .then(function (b) { return { name: path, data: new Uint8Array(b) }; });
    })).then(function (files) {
      var blob = window.PlainZip.make(files), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = p.id + '.zip'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    }).catch(function () { toast(t('zipfail')); })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  }

  /* ---------- events ---------- */
  $('items').addEventListener('click', function (e) { var b = e.target.closest('button[data-id]'); if (b) openDialog(b.getAttribute('data-id'), true); });
  $('q').addEventListener('input', render);
  $('q').addEventListener('keydown', function (e) { if (e.key === 'Escape') { this.value = ''; render(); } });
  $('vList').onclick = function () { view = 'list'; store.set('view', view); applyView(); };
  $('vGrid').onclick = function () { view = 'grid'; store.set('view', view); applyView(); };
  $('theme').onclick = function () { var n = theme() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); store.set('theme', n); applyThemeLabel(); };
  $('lang').onchange = function () {
    var v = this.value;
    if (v.indexOf('gt:') === 0) { if (confirm(t('moreNote'))) googleTranslate(v.slice(3)); this.value = lang; return; }
    lang = v; store.set('lang', v); applyLang();
  };
  $('privacyBtn').onclick = function () { var d = $('pdlg'); if (d.showModal) d.showModal(); else d.setAttribute('open', ''); };
  $('pClose').onclick = function () { var d = $('pdlg'); if (d.close) d.close(); else d.removeAttribute('open'); };
  $('pdlg').addEventListener('click', function (e) { if (e.target === this) this.close(); });
  window.addEventListener('popstate', function () { var id = location.hash.slice(1); if (id) openDialog(id, false); else closeDialog(); });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!store.get('theme')) { document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light'); applyThemeLabel(); }
  });

  fillLangSelect(); applyView(); applyLang();
  if (location.hash.length > 1) openDialog(decodeURIComponent(location.hash.slice(1)), false);
})();

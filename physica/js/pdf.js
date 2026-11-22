'use strict';
/* ==========================================================================
   PHYSICA mini PDF writer — no libraries. A4 pages, the three standard fonts
   (Helvetica, Helvetica-Bold, Courier), lines, rectangles and JPEG images.
   API uses a top-left origin in PDF points (1 pt = 1/72 inch).
   ========================================================================== */
(function () {
  // Helvetica advance widths for ASCII 32..126 (from the standard AFM)
  const HW = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
  // Helvetica-Bold advance widths for ASCII 32..126
  const HBW = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];

  /* ---- Unicode -> WinAnsi (the standard fonts only know this code page) ---- */
  const GREEK = { α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ε: 'eps', ζ: 'zeta', η: 'eta', θ: 'theta', ι: 'iota', κ: 'kappa', λ: 'lambda', μ: 'µ', ν: 'nu', ξ: 'xi', π: 'pi', ρ: 'rho', σ: 'sigma', ς: 'sigma', τ: 'tau', υ: 'upsilon', φ: 'phi', ϕ: 'phi', χ: 'chi', ψ: 'psi', ω: 'omega', Γ: 'Gamma', Δ: 'Delta', Θ: 'Theta', Λ: 'Lambda', Ξ: 'Xi', Π: 'Pi', Σ: 'Sigma', Φ: 'Phi', Ψ: 'Psi', Ω: 'Ohm' };
  const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+', 'ⁿ': 'n' };
  const SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '₊': '+', '₋': '-', 'ₑ': 'e', 'ₓ': 'x', 'ₙ': 'n', 'ₘ': 'm', 'ₚ': 'p', 'ₛ': 's', 'ₜ': 't' };
  const MISC = { '−': '-', '‐': '-', '‑': '-', '→': '->', '←': '<-', '↔': '<->', '⇒': '=>', '≈': '~', '≃': '~', '∼': '~', '≤': '<=', '≥': '>=', '≠': '!=', '≡': '==', '∞': 'inf', '√': 'sqrt', '∫': 'int', '∂': 'd', '∇': 'nabla', '∑': 'sum', '∏': 'prod', '∝': '~', '⟨': '<', '⟩': '>', '〈': '<', '〉': '>', 'ħ': 'hbar', '∈': 'in', '∠': 'angle', '⊥': 'perp', '∥': '||', '½': '½', '★': '*', '☆': '*', '✓': 'ok', '✗': 'x', '⋅': '·', '∙': '·', '′': "'", '″': '"', '✦': '*', '✥': '', '✋': '', '❄': '', '✂': '', '⇄': '<->', ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ', 'ℓ': 'l', 'Å': 'Å', '⊙': 'sun', '☉': 'sun', '⨁': 'earth', '⊕': 'earth' };
  const WIN = { '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f };

  /** returns a "binary string" (each char code 0..255) in WinAnsi encoding */
  function winAnsi(s) {
    s = String(s == null ? '' : s);
    // runs of superscripts: keep a lone ² ³ ¹ (they exist in WinAnsi), otherwise write ^…
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿ]+/g, (r) => (r.length === 1 && '²³¹'.includes(r) ? r : '^' + [...r].map((c) => SUP[c]).join('')));
    let out = '';
    for (const ch of s) {
      const c = ch.codePointAt(0);
      if (c >= 32 && c < 127) { out += ch; continue; }
      if (c === 10 || c === 9) { out += ' '; continue; }
      if (WIN[ch] !== undefined) { out += String.fromCharCode(WIN[ch]); continue; }
      if (c >= 0xa0 && c <= 0xff) { out += ch; continue; }
      if (GREEK[ch] !== undefined) { out += GREEK[ch]; continue; }
      if (SUB[ch] !== undefined) { out += SUB[ch]; continue; }
      if (MISC[ch] !== undefined) { out += MISC[ch]; continue; }
      if (c >= 0x1f000 || (c >= 0x2600 && c <= 0x27bf) || (c >= 0xfe00 && c <= 0xfe0f)) continue; // emoji, dingbats, variation selectors
      const n = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
      out += n && n.codePointAt(0) < 256 ? n : '?';
    }
    return out;
  }
  function charW(code, font) {
    if (font === 'F3') return 600;
    const T = font === 'F2' ? HBW : HW;
    if (code >= 32 && code <= 126) return T[code - 32];
    return code === 0xb7 ? 278 : 556;
  }
  function esc(bin) { return bin.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  const num = (v) => (Math.round(v * 100) / 100).toString();
  function rgb(c) {
    if (!c) return [0, 0, 0];
    if (Array.isArray(c)) return c.map((v) => v / 255);
    const h = c.replace('#', '');
    const f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
    return [0, 2, 4].map((i) => parseInt(f.substr(i, 2), 16) / 255);
  }

  class PDF {
    constructor(opts = {}) {
      this.W = opts.landscape ? 841.89 : 595.28;
      this.H = opts.landscape ? 595.28 : 841.89;
      this.pages = [];
      this.images = [];
      this.title = opts.title || 'Document';
      this.addPage();
    }
    addPage() { this.cur = { ops: [], imgs: new Set() }; this.pages.push(this.cur); return this; }
    get pageCount() { return this.pages.length; }
    _op(s) { this.cur.ops.push(s); }
    width(str, size = 10, font = 'F1') {
      const b = winAnsi(str);
      let w = 0;
      for (let i = 0; i < b.length; i++) w += charW(b.charCodeAt(i), font);
      return (w / 1000) * size;
    }
    text(x, y, str, o = {}) {
      const size = o.size || 10, font = o.font || 'F1', [r, g, b] = rgb(o.color || '#111111');
      let tx = x;
      if (o.align === 'right') tx = x - this.width(str, size, font);
      else if (o.align === 'center') tx = x - this.width(str, size, font) / 2;
      // y is the baseline measured from the top of the page
      this._op(`BT /${font} ${num(size)} Tf ${num(r)} ${num(g)} ${num(b)} rg ${num(tx)} ${num(this.H - y)} Td (${esc(winAnsi(str))}) Tj ET`);
    }
    /** wraps text to lines that fit maxW */
    wrap(str, size, font, maxW) {
      const words = String(str).split(/\s+/).filter(Boolean), lines = [];
      let line = '';
      for (const w of words) {
        const t = line ? line + ' ' + w : w;
        if (this.width(t, size, font) <= maxW || !line) line = t;
        else { lines.push(line); line = w; }
        while (this.width(line, size, font) > maxW && line.length > 4) {
          // a single very long word: hard-break it
          let k = line.length - 1;
          while (k > 1 && this.width(line.slice(0, k), size, font) > maxW) k--;
          lines.push(line.slice(0, k)); line = line.slice(k);
        }
      }
      if (line) lines.push(line);
      return lines;
    }
    line(x1, y1, x2, y2, o = {}) {
      const [r, g, b] = rgb(o.color || '#000000');
      this._op(`q ${num(o.width || 0.6)} w ${num(r)} ${num(g)} ${num(b)} RG ${o.dash ? `[${o.dash.join(' ')}] 0 d ` : ''}${num(x1)} ${num(this.H - y1)} m ${num(x2)} ${num(this.H - y2)} l S Q`);
    }
    polyline(pts, o = {}) {
      if (pts.length < 2) return;
      const [r, g, b] = rgb(o.color || '#000000');
      let s = `q ${num(o.width || 0.8)} w 1 j 1 J ${num(r)} ${num(g)} ${num(b)} RG ${o.dash ? `[${o.dash.join(' ')}] 0 d ` : ''}`;
      let pen = false;
      for (const p of pts) {
        if (!p || !isFinite(p[0]) || !isFinite(p[1])) { pen = false; continue; }
        s += `${num(p[0])} ${num(this.H - p[1])} ${pen ? 'l' : 'm'} `;
        pen = true;
      }
      this._op(s + 'S Q');
    }
    rect(x, y, w, h, o = {}) {
      let s = 'q ';
      if (o.fill) { const [r, g, b] = rgb(o.fill); s += `${num(r)} ${num(g)} ${num(b)} rg `; }
      if (o.stroke) { const [r, g, b] = rgb(o.stroke); s += `${num(o.width || 0.6)} w ${num(r)} ${num(g)} ${num(b)} RG `; }
      s += `${num(x)} ${num(this.H - y - h)} ${num(w)} ${num(h)} re ${o.fill && o.stroke ? 'B' : o.fill ? 'f' : 'S'} Q`;
      this._op(s);
    }
    circle(x, y, r, o = {}) {
      const k = 0.5523 * r, Y = this.H - y;
      const [cr, cg, cb] = rgb(o.fill || '#000000');
      this._op(`q ${num(cr)} ${num(cg)} ${num(cb)} rg ${num(x + r)} ${num(Y)} m ${num(x + r)} ${num(Y + k)} ${num(x + k)} ${num(Y + r)} ${num(x)} ${num(Y + r)} c ${num(x - k)} ${num(Y + r)} ${num(x - r)} ${num(Y + k)} ${num(x - r)} ${num(Y)} c ${num(x - r)} ${num(Y - k)} ${num(x - k)} ${num(Y - r)} ${num(x)} ${num(Y - r)} c ${num(x + k)} ${num(Y - r)} ${num(x + r)} ${num(Y - k)} ${num(x + r)} ${num(Y)} c f Q`);
    }
    /** jpeg: Uint8Array of a baseline JPEG, pw/ph its pixel size */
    image(jpeg, pw, ph, x, y, w, h) {
      const id = 'Im' + (this.images.length + 1);
      this.images.push({ id, data: jpeg, pw, ph });
      this.cur.imgs.add(id);
      this._op(`q ${num(w)} 0 0 ${num(h)} ${num(x)} ${num(this.H - y - h)} cm /${id} Do Q`);
    }
    /** builds the file; returns a Blob */
    output() {
      const chunks = [], offs = [];
      let pos = 0;
      const put = (s) => { if (typeof s === 'string') { const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 255; chunks.push(b); pos += b.length; } else { chunks.push(s); pos += s.length; } };
      const nObjFixed = 5; // 1 catalog, 2 pages, 3-5 fonts
      const imgBase = nObjFixed + 1;
      const pageBase = imgBase + this.images.length;
      const total = pageBase + this.pages.length * 2 - 1 + 1; // +1 info dictionary
      const infoId = total;
      const obj = (id, body) => { offs[id] = pos; put(`${id} 0 obj\n`); if (typeof body === 'string') put(body); else body(); put('\nendobj\n'); };
      put('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n');
      obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
      const kids = this.pages.map((p, i) => `${pageBase + i * 2} 0 R`).join(' ');
      obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${this.pages.length} >>`);
      obj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
      obj(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
      obj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');
      const imgId = {};
      this.images.forEach((im, i) => {
        const id = imgBase + i;
        imgId[im.id] = id;
        obj(id, () => {
          put(`<< /Type /XObject /Subtype /Image /Width ${im.pw} /Height ${im.ph} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.data.length} >>\nstream\n`);
          put(im.data);
          put('\nendstream');
        });
      });
      this.pages.forEach((p, i) => {
        const pid = pageBase + i * 2, cid = pid + 1;
        const xo = [...p.imgs].map((k) => `/${k} ${imgId[k]} 0 R`).join(' ');
        obj(pid, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(this.W)} ${num(this.H)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >>${xo ? ` /XObject << ${xo} >>` : ''} >> /Contents ${cid} 0 R >>`);
        const content = p.ops.join('\n');
        obj(cid, () => { put(`<< /Length ${content.length} >>\nstream\n`); put(content); put('\nendstream'); });
      });
      const d = new Date(), pad = (v) => String(v).padStart(2, '0');
      const pdfDate = `D:${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
      obj(infoId, `<< /Title (${esc(winAnsi(this.title))}) /Producer (Physica) /Creator (Physica virtual physics laboratory) /CreationDate (${pdfDate}) >>`);
      const xref = pos;
      let x = `xref\n0 ${infoId + 1}\n0000000000 65535 f \n`;
      for (let i = 1; i <= infoId; i++) x += String(offs[i] || 0).padStart(10, '0') + ' 00000 n \n';
      put(x);
      put(`trailer\n<< /Size ${infoId + 1} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
      return new Blob(chunks, { type: 'application/pdf' });
    }
  }
  PDF.winAnsi = winAnsi;
  window.PhysPDF = PDF;
})();

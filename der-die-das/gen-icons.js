// Writes icon.svg and the PNG app icons (no libraries): a dark tile with a blue, red and green bar for der, die, das.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const out = process.argv[2] || __dirname;
const BG = [21, 32, 51], BARS = [[[116, 167, 255], 0.62], [[255, 132, 150], 0.78], [[95, 211, 154], 0.50]];
// geometry in a 0..1 box: bars start at x=.2, height .12, centred rows
const ROWS = [0.30, 0.50, 0.70], BH = 0.12, X0 = 0.2;

fs.writeFileSync(path.join(out, 'icon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#152033"/>` +
  BARS.map(([c, w], i) => `<rect x="${X0 * 100}" y="${(ROWS[i] - BH / 2) * 100}" width="${w * 100}" height="${BH * 100}" rx="${BH * 50}" fill="rgb(${c})"/>`).join('') + `</svg>\n`);

function inRound(x, y, x0, y0, w, h, r) { // point inside rounded rect
  if (x < x0 || y < y0 || x > x0 + w || y > y0 + h) return false;
  const cx = Math.min(Math.max(x, x0 + r), x0 + w - r), cy = Math.min(Math.max(y, y0 + r), y0 + h - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}
function png(size, rounded) {
  const SS = 4, raw = Buffer.alloc(size * (size * 4 + 1));
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const x = (px + (sx + 0.5) / SS) / size, y = (py + (sy + 0.5) / SS) / size;
        if (rounded && !inRound(x, y, 0, 0, 1, 1, 0.22)) continue;
        let c = BG;
        BARS.forEach(([col, w], i) => { if (inRound(x, y, X0, ROWS[i] - BH / 2, w, BH, BH / 2)) c = col; });
        r += c[0]; g += c[1]; b += c[2]; a += 255;
      }
      const n = SS * SS, o = py * (size * 4 + 1) + 1 + px * 4, k = a ? a / 255 : 1;
      raw[o] = Math.round(r / k); raw[o + 1] = Math.round(g / k); raw[o + 2] = Math.round(b / k); raw[o + 3] = Math.round(a / n);
    }
  }
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = buf => { let c = 0xffffffff; for (const v of buf) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
// iOS rounds the corners itself, so the Apple icon is a full square; Android icons are full squares too (maskable)
fs.writeFileSync(path.join(out, 'apple-touch-icon.png'), png(180, false));
fs.writeFileSync(path.join(out, 'icon-192.png'), png(192, false));
fs.writeFileSync(path.join(out, 'icon-512.png'), png(512, false));
console.log('icons written to', out);

// Minimal ICO generator: 32x32 RGBA -> PNG -> ICO container.
// Uses only Node built-ins (zlib + crypto).
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 32, H = 32;
// Brand greens (must visually match FinniceLogo gradient).
const TOP    = [0x3F, 0xCF, 0xA5];
const MID    = [0x0F, 0xA0, 0x79];
const BOTTOM = [0x0C, 0x7A, 0x58];
const WHITE  = [0xFF, 0xFF, 0xFF];

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
function gradColor(y) {
  // 3-stop linear gradient top→mid→bottom along Y.
  const t = y / (H - 1);
  if (t < 0.55) {
    const u = t / 0.55;
    return [lerp(TOP[0], MID[0], u), lerp(TOP[1], MID[1], u), lerp(TOP[2], MID[2], u)];
  }
  const u = (t - 0.55) / 0.45;
  return [lerp(MID[0], BOTTOM[0], u), lerp(MID[1], BOTTOM[1], u), lerp(MID[2], BOTTOM[2], u)];
}

// 32x32 buffer with rounded-square background + white "F" glyph.
const px = Buffer.alloc(W * H * 4);
const radius = 6;
function inRoundedRect(x, y) {
  if (x >= radius && x < W - radius) return y >= 0 && y < H;
  if (y >= radius && y < H - radius) return x >= 0 && x < W;
  // corners
  const cx = x < radius ? radius : W - 1 - radius;
  const cy = y < radius ? radius : H - 1 - radius;
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

// Glyph "F" — three filled rectangles, scaled to 32×32 canvas.
// Stem: x=10..14, y=6..26.  Top bar: x=10..24, y=6..10.  Mid bar: x=10..20, y=14..17.
function inGlyph(x, y) {
  const stem    = x >= 10 && x <= 14 && y >= 6 && y <= 26;
  const topBar  = x >= 10 && x <= 24 && y >= 6 && y <= 10;
  const midBar  = x >= 10 && x <= 20 && y >= 14 && y <= 17;
  return stem || topBar || midBar;
}

for (let y = 0; y < H; y++) {
  const [gr, gg, gb] = gradColor(y);
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (!inRoundedRect(x, y)) {
      // transparent outside the rounded square
      px[i] = 0; px[i + 1] = 0; px[i + 2] = 0; px[i + 3] = 0;
      continue;
    }
    if (inGlyph(x, y)) {
      px[i] = WHITE[0]; px[i + 1] = WHITE[1]; px[i + 2] = WHITE[2]; px[i + 3] = 0xFF;
    } else {
      px[i] = gr; px[i + 1] = gg; px[i + 2] = gb; px[i + 3] = 0xFF;
    }
  }
}

// ── Encode PNG (filter type 0 = None per row) ───────────────────────
function crc32(buf) {
  let c, table = crc32._t;
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    crc32._t = table;
  }
  c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;        // bit depth
ihdr[9] = 6;        // colour type RGBA
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

// Apply filter byte 0 to each scanline.
const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 4)] = 0;
  px.copy(raw, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4);
}
const idat = deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  sig,
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", Buffer.alloc(0)),
]);

// ── Wrap PNG in ICO container ───────────────────────────────────────
// ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) + PNG payload.
const dir = Buffer.alloc(6);
dir.writeUInt16LE(0, 0);   // reserved
dir.writeUInt16LE(1, 2);   // type 1 = icon
dir.writeUInt16LE(1, 4);   // 1 image

const entry = Buffer.alloc(16);
entry[0] = 32;             // width  (0 = 256)
entry[1] = 32;             // height (0 = 256)
entry[2] = 0;              // colour palette
entry[3] = 0;              // reserved
entry.writeUInt16LE(1, 4); // colour planes
entry.writeUInt16LE(32, 6); // bits per pixel
entry.writeUInt32LE(png.length, 8);   // image data size
entry.writeUInt32LE(6 + 16, 12);      // offset to image data

const ico = Buffer.concat([dir, entry, png]);
writeFileSync("app/favicon.ico", ico);
console.log(`wrote app/favicon.ico (${ico.length} bytes, png=${png.length})`);

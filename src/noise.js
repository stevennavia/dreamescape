// Simple 3D Perlin noise implementation (no dependencies)
// Adapted from https://gist.github.com/banksean/304522

const perm = new Uint8Array(512);
const grad3 = [
  [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
  [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
  [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
];

function initPerm() {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}
initPerm();

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + t * (b - a); }
function dot3(g, x, y, z) { return g[0] * x + g[1] * y + g[2] * z; }

export function noise3D(x, y, z) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);
  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);
  const a = perm[X] + Y;
  const aa = perm[a] + Z;
  const ab = perm[a + 1] + Z;
  const b = perm[X + 1] + Y;
  const ba = perm[b] + Z;
  const bb = perm[b + 1] + Z;
  return lerp(
    lerp(
      lerp(dot3(grad3[perm[aa] % 12], xf, yf, zf), dot3(grad3[perm[ba] % 12], xf - 1, yf, zf), u),
      lerp(dot3(grad3[perm[ab] % 12], xf, yf - 1, zf), dot3(grad3[perm[bb] % 12], xf - 1, yf - 1, zf), u), v),
    lerp(
      lerp(dot3(grad3[perm[aa + 1] % 12], xf, yf, zf - 1), dot3(grad3[perm[ba + 1] % 12], xf - 1, yf, zf - 1), u),
      lerp(dot3(grad3[perm[ab + 1] % 12], xf, yf - 1, zf - 1), dot3(grad3[perm[bb + 1] % 12], xf - 1, yf - 1, zf - 1), u), v), w);
}

export function noise2D(x, y) {
  return noise3D(x, y, 0);
}

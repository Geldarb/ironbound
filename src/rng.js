// Small seedable RNG + helpers. Game code takes an `rng` function so tests are deterministic.
export function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];
export const randInt = (lo, hi, rng = Math.random) => lo + Math.floor(rng() * (hi - lo + 1));
export function weightedIndex(weights, rng = Math.random) {
  let total = 0;
  for (const w of weights) total += w;
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}
export function uid(rng = Math.random) {
  return Math.floor(rng() * 0xffffffff).toString(36) + Date.now().toString(36).slice(-3);
}

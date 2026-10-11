// RuneScape experience curve (levels 1-99).
export const MAX_LEVEL = 99;
export const MAX_XP = 200000000;
const TABLE = [0, 0]; // TABLE[L] = total xp required to reach level L
{
  let points = 0;
  for (let l = 1; l <= 100; l++) {
    points += Math.floor(l + 300 * Math.pow(2, l / 7));
    TABLE[l + 1] = Math.floor(points / 4);
  }
}
export function xpForLevel(level) {
  const l = Math.max(1, Math.min(100, Math.floor(level)));
  return TABLE[l];
}
export function levelForXp(xp) {
  let l = 1;
  while (l < MAX_LEVEL && xp >= TABLE[l + 1]) l++;
  return l;
}
/** progress through the current level, 0..1 (1 at max level) */
export function levelProgress(xp) {
  const l = levelForXp(xp);
  if (l >= MAX_LEVEL) return 1;
  const a = TABLE[l], b = TABLE[l + 1];
  return Math.max(0, Math.min(1, (xp - a) / (b - a)));
}
export function xpToNext(xp) {
  const l = levelForXp(xp);
  return l >= MAX_LEVEL ? 0 : TABLE[l + 1] - xp;
}

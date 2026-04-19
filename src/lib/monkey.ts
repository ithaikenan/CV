/**
 * Monkey auto-guess logic.
 *
 * Goal: plausible-but-dumb baseline. Beats half the humans on a good night.
 *
 * Winner:
 *   P(higher-seed wins) = 0.50 + 0.05 * seedGap + 0.04 * isHomeCourtHigherSeed
 *   Clamped to [0.5, 0.85]. If seeds unknown, 50/50 with +0.04 for home team.
 *
 * Score (regulation):
 *   winnerPts ~ round(N(mu=112, sigma=7))  clamped to [95, 135]
 *   margin    ~ round(|N(mu=8,  sigma=6)|) clamped to [1, 25]
 *   loserPts  = winnerPts - margin
 */

export interface MonkeyInput {
  homeTeam: string;
  awayTeam: string;
  homeSeed?: number | null;
  awaySeed?: number | null;
  // deterministic seed (e.g., gameId) so the same game yields the same guess
  // across retries/runs
  rngSeed: string;
}

export interface MonkeyGuess {
  homeScore: number;
  awayScore: number;
}

// --- deterministic PRNG ---------------------------------------------------
function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussian(rand: () => number, mu = 0, sigma = 1) {
  // Box-Muller
  const u1 = Math.max(rand(), 1e-9);
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mu + sigma * z;
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function monkeyGuess(i: MonkeyInput): MonkeyGuess {
  const seedFn = xmur3(`monkey:${i.rngSeed}`);
  const rand = mulberry32(seedFn());

  // Who's the "higher seed"? lower seed-number is higher-seed.
  let higherIsHome: boolean;
  if (i.homeSeed != null && i.awaySeed != null) {
    higherIsHome = i.homeSeed <= i.awaySeed;
  } else {
    higherIsHome = rand() < 0.5 + 0.04; // mild home bias
  }

  const gap = i.homeSeed != null && i.awaySeed != null ? Math.abs(i.homeSeed - i.awaySeed) : 0;
  const homeAdv = higherIsHome ? 0.04 : -0.04;
  const pHigher = clamp(0.5 + 0.05 * gap + homeAdv, 0.5, 0.85);
  const higherSeedWins = rand() < pHigher;
  const homeWins = higherIsHome ? higherSeedWins : !higherSeedWins;

  const winnerPts = clamp(Math.round(gaussian(rand, 112, 7)), 95, 135);
  const margin = clamp(Math.round(Math.abs(gaussian(rand, 8, 6))), 1, 25);
  const loserPts = winnerPts - margin;

  return homeWins
    ? { homeScore: winnerPts, awayScore: loserPts }
    : { homeScore: loserPts, awayScore: winnerPts };
}

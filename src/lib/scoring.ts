import { ROUND_POINTS } from "./rounds";

export interface ScoreInputs {
  round: number;
  actualHome: number;
  actualAway: number;
  guessHome: number;
  guessAway: number;
}

/**
 * Points for a single guess against a regulation-time result.
 * Award rule: credit the single highest-tier award reached.
 *   - exact score => tier-3 points
 *   - exact point difference => tier-2 points
 *   - correct winner => tier-1 points
 * (Tiers are cumulative in value, not additive.)
 */
export function scoreGuess(i: ScoreInputs): number {
  const pts = ROUND_POINTS[i.round];
  if (!pts) return 0;
  const [winPts, diffPts, exactPts] = pts;

  if (i.guessHome === i.actualHome && i.guessAway === i.actualAway) return exactPts;

  const actualDiff = i.actualHome - i.actualAway;
  const guessDiff = i.guessHome - i.guessAway;
  if (actualDiff === guessDiff && actualDiff !== 0) return diffPts;

  const actualWinner = Math.sign(actualDiff);
  const guessWinner = Math.sign(guessDiff);
  if (actualWinner !== 0 && actualWinner === guessWinner) return winPts;

  return 0;
}

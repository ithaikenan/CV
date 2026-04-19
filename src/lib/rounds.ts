// Scoring table per round. Index 0 unused (rounds are 1..4).
// [winnerPts, exactDiffPts, exactScorePts]
export const ROUND_POINTS: Record<number, [number, number, number]> = {
  1: [1, 2, 5],
  2: [2, 4, 10],
  3: [3, 6, 15],
  4: [4, 8, 20],
};

export const ROUND_NAME: Record<number, string> = {
  1: "First Round",
  2: "Conference Semifinals",
  3: "Conference Finals",
  4: "NBA Finals",
};

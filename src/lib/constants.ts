// Key date constants for Playoff Monkey 2026.
//
// "This coming Saturday" (April 25, 2026) serves two purposes:
//  1. SEASON_START_AT — the first day whose games count for real. Games
//     played before this date are treated as a "trial run" and award 0
//     points. This lets late joiners catch up without falling behind.
//  2. RULES_LOCK_AT — the deadline for league admins to edit their house
//     rules. After this cutoff, rules are locked.
//
// Interpreted as end-of-Saturday US Eastern = 04:00 UTC Sunday, so the
// entire Saturday slate of East Coast games falls before the lock.
//
// Season start: take the opening tipoff of Saturday ET (earliest day games
// start around noon ET = 16:00 UTC). Any game tipping off earlier is trial.
export const SEASON_START_AT = new Date("2026-04-25T00:00:00Z");
export const RULES_LOCK_AT = new Date("2026-04-26T04:00:00Z");

export function isTrialGame(tipoffAt: Date): boolean {
  return tipoffAt.getTime() < SEASON_START_AT.getTime();
}

export function areRulesLocked(now = new Date()): boolean {
  return now.getTime() >= RULES_LOCK_AT.getTime();
}

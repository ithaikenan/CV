export interface ProviderGame {
  id: string;                 // stable external id
  round: number;              // 1..4
  seriesId?: string;
  homeTeam: string;
  awayTeam: string;
  homeSeed?: number | null;
  awaySeed?: number | null;
  tipoffAt: Date;
  status: "scheduled" | "live" | "final";
  homeScore?: number | null;
  awayScore?: number | null;
  // regulation-only scores (exclude OT)
  homeRegScore?: number | null;
  awayRegScore?: number | null;
  period?: number | null;
  clock?: string | null;
}

export interface GameProvider {
  name: string;
  // Fetch schedule for the current playoffs (all rounds available).
  fetchSchedule(): Promise<ProviderGame[]>;
  // Fetch current live/final state for games in progress or recently finished.
  fetchLive(gameIds: string[]): Promise<ProviderGame[]>;
}

import { EspnProvider } from "./espn";
import { BallDontLieProvider } from "./balldontlie";

export function getProvider(): GameProvider {
  const name = process.env.NBA_PROVIDER ?? "espn";
  if (name === "balldontlie") return new BallDontLieProvider();
  return new EspnProvider();
}

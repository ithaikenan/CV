import type { GameProvider, ProviderGame } from "./index";

/**
 * balldontlie.io provider (paid "ALL-STAR" tier recommended for live box
 * scores). Requires BDL_API_KEY. This is a thin stub that mirrors the free
 * provider shape; fill in when you wire the real endpoints.
 *
 * Docs: https://docs.balldontlie.io/
 */
export class BallDontLieProvider implements GameProvider {
  name = "balldontlie";
  private base = "https://api.balldontlie.io/v1";
  private key = process.env.BDL_API_KEY ?? "";

  private headers() {
    return { Authorization: this.key } as Record<string, string>;
  }

  async fetchSchedule(): Promise<ProviderGame[]> {
    if (!this.key) return [];
    // TODO: GET /games?postseason=true&seasons[]=<season>
    return [];
  }

  async fetchLive(_gameIds: string[]): Promise<ProviderGame[]> {
    if (!this.key) return [];
    // TODO: GET /box_scores/live  (ALL-STAR tier)
    return [];
  }
}

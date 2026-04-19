import type { GameProvider, ProviderGame } from "./index";

/**
 * ESPN hidden (public) NBA scoreboard. No auth required.
 * Endpoints used:
 *   https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD
 *   https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event={id}
 *
 * Notes:
 *  - Playoff round is reported via season.slug / competition notes; we infer
 *    from event.competitions[0].notes[0].headline when present (e.g., "East
 *    First Round - ..."). This is a best-effort inference.
 *  - Regulation-time score: we look at linescores entries 1..4 and sum.
 */

const SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
const SUMMARY = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary";

function inferRoundFromText(text?: string | null): number | null {
  if (!text) return null;
  const t = text.toLowerCase();
  if (t.includes("nba finals") || t.includes("the finals")) return 4;
  if (t.includes("conference final")) return 3;
  if (t.includes("semifinal") || t.includes("second round")) return 2;
  if (t.includes("first round")) return 1;
  return null;
}

function mapStatus(state?: string): ProviderGame["status"] {
  if (state === "post") return "final";
  if (state === "in") return "live";
  return "scheduled";
}

function regulationSum(lineScores: Array<{ value: number }> | undefined): number | null {
  if (!Array.isArray(lineScores) || lineScores.length === 0) return null;
  const firstFour = lineScores.slice(0, 4).map((x) => Number(x.value ?? 0));
  return firstFour.reduce((a, b) => a + b, 0);
}

interface RawEvent {
  id: string;
  date: string;
  status?: { type?: { state?: string; completed?: boolean } };
  competitions?: Array<{
    notes?: Array<{ headline?: string }>;
    competitors?: Array<{
      homeAway: "home" | "away";
      score?: string;
      curatedRank?: { current?: number };
      team?: { displayName?: string; abbreviation?: string };
      linescores?: Array<{ value: number }>;
    }>;
    status?: { period?: number; displayClock?: string };
  }>;
}

function toProviderGame(ev: RawEvent): ProviderGame | null {
  const comp = ev.competitions?.[0];
  if (!comp || !comp.competitors || comp.competitors.length < 2) return null;
  const home = comp.competitors.find((c) => c.homeAway === "home");
  const away = comp.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const round = inferRoundFromText(comp.notes?.[0]?.headline);
  if (round == null) return null; // not a playoff game

  const tipoffAt = new Date(ev.date);
  const status = mapStatus(ev.status?.type?.state);
  const homeScore = home.score != null ? Number(home.score) : null;
  const awayScore = away.score != null ? Number(away.score) : null;

  const homeReg = status === "final" ? regulationSum(home.linescores) : null;
  const awayReg = status === "final" ? regulationSum(away.linescores) : null;

  return {
    id: `espn:${ev.id}`,
    round,
    homeTeam: home.team?.displayName ?? home.team?.abbreviation ?? "Home",
    awayTeam: away.team?.displayName ?? away.team?.abbreviation ?? "Away",
    homeSeed: home.curatedRank?.current ?? null,
    awaySeed: away.curatedRank?.current ?? null,
    tipoffAt,
    status,
    homeScore,
    awayScore,
    homeRegScore: homeReg,
    awayRegScore: awayReg,
    period: comp.status?.period ?? null,
    clock: comp.status?.displayClock ?? null,
  };
}

function datesRange(daysBack = 1, daysAhead = 30): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let d = -daysBack; d <= daysAhead; d++) {
    const x = new Date(today);
    x.setUTCDate(today.getUTCDate() + d);
    const yyyy = x.getUTCFullYear();
    const mm = String(x.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(x.getUTCDate()).padStart(2, "0");
    out.push(`${yyyy}${mm}${dd}`);
  }
  return out;
}

export class EspnProvider implements GameProvider {
  name = "espn";

  async fetchSchedule(): Promise<ProviderGame[]> {
    const dates = datesRange(1, 45);
    const results: ProviderGame[] = [];
    // Pull in small batches; ESPN accepts comma-separated dates? Safer to loop.
    for (const d of dates) {
      const r = await fetch(`${SCOREBOARD}?dates=${d}&limit=50`, { cache: "no-store" });
      if (!r.ok) continue;
      const j = (await r.json()) as { events?: RawEvent[] };
      for (const ev of j.events ?? []) {
        const pg = toProviderGame(ev);
        if (pg) results.push(pg);
      }
    }
    return results;
  }

  async fetchLive(gameIds: string[]): Promise<ProviderGame[]> {
    const results: ProviderGame[] = [];
    const espnIds = gameIds.filter((id) => id.startsWith("espn:")).map((id) => id.slice(5));
    for (const id of espnIds) {
      const r = await fetch(`${SUMMARY}?event=${id}`, { cache: "no-store" });
      if (!r.ok) continue;
      const j = (await r.json()) as { header?: { competitions?: RawEvent["competitions"]; id?: string; competitions0?: unknown } };
      // header.competitions shape ~= scoreboard's competitions
      const evLike: RawEvent = {
        id,
        date: (j as any).header?.competitions?.[0]?.date ?? new Date().toISOString(),
        status: (j as any).header?.competitions?.[0]?.status,
        competitions: j.header?.competitions,
      };
      const pg = toProviderGame(evLike);
      if (pg) results.push(pg);
    }
    return results;
  }
}

import { PrismaClient } from "@prisma/client";
import { ensureCoreRows } from "../src/lib/sync";

const prisma = new PrismaClient();

async function main() {
  await ensureCoreRows();
  // A handful of placeholder playoff games so the UI has something to show
  // before the real schedule sync runs.
  const now = Date.now();
  const samples = [
    { id: "seed:1", round: 1, awayTeam: "Celtics", homeTeam: "Heat", awaySeed: 1, homeSeed: 8, tipMinutes: 60 },
    { id: "seed:2", round: 1, awayTeam: "Knicks", homeTeam: "76ers", awaySeed: 2, homeSeed: 7, tipMinutes: 150 },
    { id: "seed:3", round: 1, awayTeam: "Thunder", homeTeam: "Pelicans", awaySeed: 1, homeSeed: 8, tipMinutes: 240 },
  ];
  for (const s of samples) {
    await prisma.game.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        round: s.round,
        homeTeam: s.homeTeam,
        awayTeam: s.awayTeam,
        homeSeed: s.homeSeed,
        awaySeed: s.awaySeed,
        tipoffAt: new Date(now + s.tipMinutes * 60 * 1000),
        status: "scheduled",
      },
    });
  }
  console.log("seeded");
}

main().finally(() => prisma.$disconnect());

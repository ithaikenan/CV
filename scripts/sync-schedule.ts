import { syncSchedule } from "../src/lib/sync";

syncSchedule()
  .then((n) => {
    console.log(`synced ${n} games`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

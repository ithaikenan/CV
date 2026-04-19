import { runFullSyncTick } from "../src/lib/sync";

runFullSyncTick()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

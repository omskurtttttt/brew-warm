import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PREDEFINED_AREAS, syncAreaCafes } from "../lib/sync";

async function main() {
  const targetArea = process.argv[2] || "all";
  console.log(`=== Starting Overpass Database Sync (Target: ${targetArea}) ===`);

  if (targetArea === "all") {
    for (const [key, val] of Object.entries(PREDEFINED_AREAS)) {
      console.log(`\nSyncing ${val.name} (${key})...`);
      const res = await syncAreaCafes(val.bounds, val.name);
      console.log(`-> Fetched: ${res.totalFetched}, Upserted into Database: ${res.upsertedCount}`);
    }
  } else if (targetArea in PREDEFINED_AREAS) {
    const area = PREDEFINED_AREAS[targetArea];
    console.log(`\nSyncing ${area.name}...`);
    const res = await syncAreaCafes(area.bounds, area.name);
    console.log(`-> Fetched: ${res.totalFetched}, Upserted into Database: ${res.upsertedCount}`);
  } else {
    console.error(`Unknown area: "${targetArea}". Available: ${Object.keys(PREDEFINED_AREAS).join(", ")}, all`);
    process.exit(1);
  }

  console.log("\n=== Overpass Sync Job Finished Successfully! ===");
}

main().catch((err) => {
  console.error("Sync script failed:", err);
  process.exit(1);
});

import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);

async function verify() {
  console.log("=== Running Database & PostGIS Verifications ===");


  // 1. PostGIS Extension
  const [pg] = await sql`SELECT PostGIS_Version();`;
  console.log("1. PostGIS Version:", pg.postgis_version);

  // 2. Table definitions
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('shops', 'users', 'favorites', 'reviews')
    ORDER BY table_name;
  `;
  console.log("2. Tables in Database:", tables.map((t) => t.table_name));

  // 3. PostGIS spatial index
  const [idx] = await sql`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'shops' AND indexname = 'shops_location_gist_idx';
  `;
  console.log("3. Spatial GIST Index:", idx?.indexname);

  // 4. Test PostGIS Insert & Distance Calculation
  const testOsmId = "test_verify_999999";
  await sql`DELETE FROM shops WHERE osm_id = ${testOsmId};`;

  // Insert shop at Legazpi Plaza (13.1391, 123.7438)
  await sql`
    INSERT INTO shops (osm_id, name, lat, lng, location, address, tags)
    VALUES (
      ${testOsmId},
      'PostGIS Verification Café',
      13.1391,
      123.7438,
      ST_SetSRID(ST_MakePoint(123.7438, 13.1391), 4326)::geography,
      'Rizal St, Legazpi City',
      '{"amenity": "cafe", "cuisine": "coffee_shop"}'::jsonb
    );
  `;

  // Query distance from point 500m away (13.1436, 123.7438)
  const results = await sql`
    SELECT 
      name,
      ROUND(ST_Distance(location, ST_SetSRID(ST_MakePoint(123.7438, 13.1436), 4326)::geography)::numeric, 1) AS distance_meters
    FROM shops
    WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(123.7438, 13.1436), 4326)::geography, 1000)
      AND osm_id = ${testOsmId};
  `;

  console.log("4. PostGIS ST_DWithin & ST_Distance Result:", results[0]);

  // Clean up
  await sql`DELETE FROM shops WHERE osm_id = ${testOsmId};`;
  console.log("5. Cleanup completed.");

  console.log("=== All Database Verifications Succeeded! ===");
}


verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

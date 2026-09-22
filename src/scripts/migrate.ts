import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runMigration() {
  console.log("=== Database Schema Migration Starting ===");


  // 1. PostGIS extension
  await sql`CREATE EXTENSION IF NOT EXISTS postgis;`;

  // 2. Shops table columns & spatial index
  await sql`
    ALTER TABLE shops 
    ADD COLUMN IF NOT EXISTS location geography(Point, 4326);
  `;
  await sql`
    ALTER TABLE shops 
    ADD COLUMN IF NOT EXISTS tags jsonb;
  `;
  await sql`
    ALTER TABLE shops 
    ALTER COLUMN osm_id TYPE text USING osm_id::text;
  `;
  await sql`
    ALTER TABLE shops 
    DROP CONSTRAINT IF EXISTS shops_osm_id_key;
  `;
  await sql`
    ALTER TABLE shops 
    ADD CONSTRAINT shops_osm_id_key UNIQUE (osm_id);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS shops_location_gist_idx ON shops USING GIST (location);
  `;
  await sql`
    UPDATE shops 
    SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography 
    WHERE location IS NULL AND lat IS NOT NULL AND lng IS NOT NULL;
  `;

  // 3. Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  // 4. Favorites table (with user_id, shop_id, optional session_id)
  await sql`DROP TABLE IF EXISTS favorites CASCADE;`;
  await sql`
    CREATE TABLE favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      session_id TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites (user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS favorites_session_id_idx ON favorites (session_id);`;

  // 5. Reviews table
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS reviews_shop_id_idx ON reviews (shop_id);`;
  await sql`CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews (user_id);`;

  console.log("=== Database Schema Migration Succeeded! ===");
}


runMigration().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

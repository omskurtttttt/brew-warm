import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Create a Neon HTTP connection and Drizzle instance.
 * Uses the DATABASE_URL environment variable.
 */
function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string."
    );
  }

  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export const db = createDb();

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;

  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.STORAGE_URL ||
    process.env.NEON_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Database connection string is not set. Please set DATABASE_URL (or POSTGRES_URL) in your environment variables."
    );
  }


  const sql = neon(databaseUrl);
  _db = drizzle(sql, { schema });
  return _db;
}

// Proxy wrapper for backward compatibility with `import { db } from "@/db"`
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});


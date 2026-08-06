import { pgTable, serial, text, real, timestamp, integer } from "drizzle-orm/pg-core";

/* ============================================================
   Shops Table
   Stores both OSM-sourced and user-submitted coffee shops.
   Uses lat/lng columns with a bounding-box query approach
   for "nearby" searches (simple, no PostGIS extension needed
   for basic usage — upgrade to geography column if precision
   matters at scale).
   ============================================================ */
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  address: text("address"),
  openingHours: text("opening_hours"),
  cuisine: text("cuisine"),
  phone: text("phone"),
  website: text("website"),
  wheelchair: text("wheelchair"),
  internetAccess: text("internet_access"),
  outdoorSeating: text("outdoor_seating"),
  source: text("source").notNull().default("user"), // "osm" | "user"
  osmId: integer("osm_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ============================================================
   Favorites Table
   Session-based favorites (no auth required).
   ============================================================ */
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

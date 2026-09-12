import {
  pgTable,
  serial,
  text,
  real,
  timestamp,
  integer,
  jsonb,
  customType,
} from "drizzle-orm/pg-core";


/* ============================================================
   Custom PostGIS geography(Point, 4326) column type
   ============================================================ */
export const postgisPoint = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return "geography(Point, 4326)";
  },
});

/* ============================================================
   1. Shops Table
   Cached Overpass data & community spots. Source of truth for app.
   ============================================================ */
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  osmId: text("osm_id").unique(), // Overpass/OSM ID for sync matching & deduplication
  name: text("name").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  location: postgisPoint("location"), // PostGIS Point (geography 4326)
  address: text("address"),
  tags: jsonb("tags").$type<Record<string, string | undefined>>(), // Raw Overpass tags
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ============================================================
   2. Users Table
   Stage 2 Auth pattern (bcrypt password hash, JWT, roles)
   ============================================================ */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // "user" | "admin"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ============================================================
   3. Favorites Join Table
   Supports authenticated user_id and transitional session_id
   ============================================================ */
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


/* ============================================================
   4. Reviews Table
   User reviews & ratings (1-5) per café
   ============================================================ */
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1 to 5
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ============================================================
   Type Inferences
   ============================================================ */
export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

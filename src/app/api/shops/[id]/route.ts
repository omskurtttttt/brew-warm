import type { NextRequest } from "next/server";
import { db } from "@/db";
import { shops, reviews } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * GET /api/shops/[id]
 *
 * Fetch a single shop by ID including its computed average rating and review count.
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/shops/[id]">
) {
  const { id } = await ctx.params;
  const shopId = parseInt(id, 10);

  if (isNaN(shopId)) {
    return Response.json({ error: "Invalid shop ID" }, { status: 400 });
  }

  try {
    const avgRatingSql = sql<number>`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 1), 0)`;
    const reviewCountSql = sql<number>`COUNT(${reviews.id})::int`;

    const [shop] = await db
      .select({
        id: shops.id,
        osmId: shops.osmId,
        name: shops.name,
        lat: shops.lat,
        lng: shops.lng,
        address: shops.address,
        tags: shops.tags,
        updatedAt: shops.updatedAt,
        createdAt: shops.createdAt,
        avgRating: avgRatingSql,
        reviewCount: reviewCountSql,
      })
      .from(shops)
      .leftJoin(reviews, eq(shops.id, reviews.shopId))
      .where(eq(shops.id, shopId))
      .groupBy(shops.id)
      .limit(1);

    if (!shop) {
      return Response.json({ error: "Shop not found" }, { status: 404 });
    }

    return Response.json(
      {
        shop: {
          ...shop,
          avg_rating: shop.avgRating,
          review_count: shop.reviewCount,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("Failed to fetch shop:", err);
    return Response.json({ error: "Failed to fetch shop" }, { status: 500 });
  }
}

/**
 * PATCH /api/shops/[id]
 *
 * Update a shop's details.
 */
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/shops/[id]">
) {
  const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (adminSecret) {
    if (authHeader !== `Bearer ${adminSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "Unauthorized: Shop modifications require authentication" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const shopId = parseInt(id, 10);

  if (isNaN(shopId)) {
    return Response.json({ error: "Invalid shop ID" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const directUpdates: Record<string, string | null> = {};
  if ("name" in body) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return Response.json({ error: "name must be a non-empty string (max 150 chars)" }, { status: 400 });
    }
    directUpdates.name = body.name.trim().slice(0, 150);
  }
  if ("address" in body) {
    directUpdates.address = typeof body.address === "string" && body.address.trim().length > 0
      ? body.address.trim().slice(0, 300)
      : null;
  }

  const tagFieldMapping: Record<string, { tagKey: string; maxLen: number }> = {
    openingHours: { tagKey: "opening_hours", maxLen: 200 },
    opening_hours: { tagKey: "opening_hours", maxLen: 200 },
    cuisine: { tagKey: "cuisine", maxLen: 100 },
    phone: { tagKey: "phone", maxLen: 50 },
    website: { tagKey: "website", maxLen: 300 },
    internetAccess: { tagKey: "internet_access", maxLen: 20 },
    internet_access: { tagKey: "internet_access", maxLen: 20 },
    outdoorSeating: { tagKey: "outdoor_seating", maxLen: 20 },
    outdoor_seating: { tagKey: "outdoor_seating", maxLen: 20 },
  };

  const tagUpdates: Record<string, string | undefined> = {};

  for (const [key, { tagKey, maxLen }] of Object.entries(tagFieldMapping)) {
    if (key in body) {
      const value = body[key];
      if (typeof value === "string" && value.trim().length > 0) {
        const trimmed = value.trim();
        if (tagKey === "website" && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
          return Response.json({ error: "website must begin with http:// or https://" }, { status: 400 });
        }
        tagUpdates[tagKey] = trimmed.slice(0, maxLen);
      }
    }
  }

  if (Object.keys(directUpdates).length === 0 && Object.keys(tagUpdates).length === 0) {
    return Response.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  try {
    // If updating tags, fetch existing shop first to merge
    let mergedTags: Record<string, string | undefined> | undefined = undefined;
    if (Object.keys(tagUpdates).length > 0) {
      const [current] = await db.select({ tags: shops.tags }).from(shops).where(eq(shops.id, shopId)).limit(1);
      mergedTags = { ...(current?.tags || {}), ...tagUpdates };
    }

    const [updated] = await db
      .update(shops)
      .set({
        ...directUpdates,
        ...(mergedTags ? { tags: mergedTags } : {}),
        updatedAt: new Date(),
      })
      .where(eq(shops.id, shopId))
      .returning();

    if (!updated) {
      return Response.json({ error: "Shop not found" }, { status: 404 });
    }

    return Response.json({ shop: updated });
  } catch (err) {
    console.error("Failed to update shop:", err);
    return Response.json(
      { error: "Failed to update shop" },
      { status: 500 }
    );
  }

}

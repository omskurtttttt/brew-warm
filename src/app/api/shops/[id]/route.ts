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

    return Response.json({
      shop: {
        ...shop,
        avg_rating: shop.avgRating,
        review_count: shop.reviewCount,
      },
    });
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

  const maxLengths: Record<string, number> = {

    name: 150,
    address: 300,
    openingHours: 200,
    cuisine: 100,
    phone: 50,
    website: 300,
    internetAccess: 20,
    outdoorSeating: 20,
  };

  const directFields = ["name", "address"] as const;
  const tagFields = ["openingHours", "cuisine", "phone", "website", "internetAccess", "outdoorSeating"] as const;

  const directUpdates: Record<string, string | null> = {};
  const tagUpdates: Record<string, string | undefined> = {};

  for (const field of directFields) {
    if (field in body) {
      const value = body[field];
      directUpdates[field] = typeof value === "string" && value.trim().length > 0 
        ? value.trim().slice(0, maxLengths[field] ?? 200) 
        : null;
    }
  }

  for (const field of tagFields) {
    if (field in body) {
      const value = body[field];
      if (typeof value === "string" && value.trim().length > 0) {
        const trimmed = value.trim();
        if (field === "website" && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
          return Response.json({ error: "website must begin with http:// or https://" }, { status: 400 });
        }
        tagUpdates[field] = trimmed.slice(0, maxLengths[field] ?? 200);
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

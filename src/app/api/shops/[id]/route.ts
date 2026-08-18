import type { NextRequest } from "next/server";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/shops/[id]
 *
 * Fetch a single shop by ID.
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
    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.id, shopId))
      .limit(1);

    if (!shop) {
      return Response.json({ error: "Shop not found" }, { status: 404 });
    }

    return Response.json({ shop });
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

  const allowedFields = [
    "name",
    "address",
    "openingHours",
    "cuisine",
    "phone",
    "website",
    "internetAccess",
    "outdoorSeating",
  ] as const;

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

  const updates: Record<string, string | null> = {};
  for (const field of allowedFields) {
    if (field in body) {
      const value = body[field];
      if (typeof value === "string" && value.trim().length > 0) {
        const trimmed = value.trim();
        if (field === "website" && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
          return Response.json({ error: "website must begin with http:// or https://" }, { status: 400 });
        }
        updates[field] = trimmed.slice(0, maxLengths[field] ?? 200);
      } else {
        updates[field] = null;
      }
    }
  }


  if (Object.keys(updates).length === 0) {
    return Response.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  // Always update the timestamp
  const updateData = { ...updates, updatedAt: new Date() };

  try {
    const [updated] = await db
      .update(shops)
      .set(updateData)
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

import type { NextRequest } from "next/server";
import { db } from "@/db";
import { favorites, shops } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * GET /api/favorites?sessionId=X
 *
 * List all favorites for a session.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId || sessionId.length > 100) {
    return Response.json(
      { error: "Valid sessionId query parameter is required (max 100 chars)" },
      { status: 400 }
    );
  }


  try {
    const results = await db
      .select({
        id: favorites.id,
        shopId: favorites.shopId,
        createdAt: favorites.createdAt,
        shop: shops,
      })
      .from(favorites)
      .leftJoin(shops, eq(favorites.shopId, shops.id))
      .where(eq(favorites.sessionId, sessionId))
      .orderBy(favorites.createdAt);


    return Response.json({ favorites: results });
  } catch (err) {
    console.error("Failed to fetch favorites:", err);
    return Response.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites
 *
 * Add a shop to favorites.
 * Body: { shopId: number, sessionId: string }
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { shopId, sessionId } = body as {
    shopId?: number;
    sessionId?: string;
  };

  if (typeof shopId !== "number" || !sessionId || sessionId.length > 100) {
    return Response.json(
      { error: "Valid shopId (number) and sessionId (string <= 100 chars) are required" },
      { status: 400 }
    );
  }

  try {
    // Check if already favorited
    const [existing] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.shopId, shopId),
          eq(favorites.sessionId, sessionId)
        )
      )
      .limit(1);

    if (existing) {
      return Response.json({ favorite: existing }, { status: 200 });
    }

    const [inserted] = await db
      .insert(favorites)
      .values({ shopId, sessionId })
      .returning();

    return Response.json({ favorite: inserted }, { status: 201 });
  } catch (err) {
    console.error("Failed to add favorite:", err);
    return Response.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/favorites?id=X&sessionId=Y
 *
 * Remove a favorite by ID (with session ownership check).
 */
export async function DELETE(request: NextRequest) {
  const id = parseInt(
    request.nextUrl.searchParams.get("id") ?? "",
    10
  );
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (isNaN(id) || !sessionId || sessionId.length > 100) {
    return Response.json(
      { error: "Valid id and sessionId query parameters are required" },
      { status: 400 }
    );
  }


  try {
    const [deleted] = await db
      .delete(favorites)
      .where(
        and(eq(favorites.id, id), eq(favorites.sessionId, sessionId))
      )
      .returning();

    if (!deleted) {
      return Response.json({ error: "Favorite not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Failed to delete favorite:", err);
    return Response.json(
      { error: "Failed to delete favorite" },
      { status: 500 }
    );
  }
}

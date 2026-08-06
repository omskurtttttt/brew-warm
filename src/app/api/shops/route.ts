import { NextRequest } from "next/server";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { and, gte, lte, sql } from "drizzle-orm";

/**
 * GET /api/shops?lat=X&lng=Y&radius=Z
 *
 * Fetch nearby shops from the database using a bounding-box query.
 * Radius is in kilometers (default 2km).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radius = parseFloat(searchParams.get("radius") ?? "2");

  if (isNaN(lat) || isNaN(lng)) {
    return Response.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 }
    );
  }

  // Approximate bounding box from radius in km
  // 1 degree latitude ≈ 111km
  // 1 degree longitude ≈ 111km * cos(lat)
  const latDelta = radius / 111;
  const lngDelta = radius / (111 * Math.cos((lat * Math.PI) / 180));

  try {
    const results = await db
      .select()
      .from(shops)
      .where(
        and(
          gte(shops.lat, lat - latDelta),
          lte(shops.lat, lat + latDelta),
          gte(shops.lng, lng - lngDelta),
          lte(shops.lng, lng + lngDelta)
        )
      )
      .orderBy(
        // Sort by approximate distance (Euclidean, good enough at city scale)
        sql`(${shops.lat} - ${lat})*(${shops.lat} - ${lat}) + (${shops.lng} - ${lng})*(${shops.lng} - ${lng})`
      )
      .limit(100);

    return Response.json({ shops: results });
  } catch (err) {
    console.error("Failed to fetch shops:", err);
    return Response.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shops
 *
 * Submit a new user-contributed shop.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, lat, lng, address, openingHours, cuisine, phone, website, internetAccess, outdoorSeating } =
    body as {
      name?: string;
      lat?: number;
      lng?: number;
      address?: string;
      openingHours?: string;
      cuisine?: string;
      phone?: string;
      website?: string;
      internetAccess?: string;
      outdoorSeating?: string;
    };

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }
  if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
    return Response.json({ error: "lat and lng are required numbers" }, { status: 400 });
  }

  try {
    const [inserted] = await db
      .insert(shops)
      .values({
        name: name.trim(),
        lat,
        lng,
        address: address?.trim() || null,
        openingHours: openingHours?.trim() || null,
        cuisine: cuisine?.trim() || null,
        phone: phone?.trim() || null,
        website: website?.trim() || null,
        internetAccess: internetAccess?.trim() || null,
        outdoorSeating: outdoorSeating?.trim() || null,
        source: "user",
      })
      .returning();

    return Response.json({ shop: inserted }, { status: 201 });
  } catch (err) {
    console.error("Failed to create shop:", err);
    return Response.json(
      { error: "Failed to create shop" },
      { status: 500 }
    );
  }
}

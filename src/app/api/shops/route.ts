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

  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");
  const rawRadius = searchParams.get("radius");

  const lat = parseFloat(rawLat ?? "");
  const lng = parseFloat(rawLng ?? "");
  const unconstrainedRadius = parseFloat(rawRadius ?? "2");

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return Response.json(
      { error: "Valid lat (-90 to 90) and lng (-180 to 180) query parameters are required" },
      { status: 400 }
    );
  }

  // Clamp radius between 0.1km and 50km
  const radius = Math.min(Math.max(isNaN(unconstrainedRadius) ? 2 : unconstrainedRadius, 0.1), 50);

  // Approximate bounding box from radius in km
  // 1 degree latitude ≈ 111km
  // Safeguard against cos(lat) approaching 0 near poles
  const cosLat = Math.max(Math.abs(Math.cos((lat * Math.PI) / 180)), 0.0001);
  const latDelta = radius / 111;
  const lngDelta = radius / (111 * cosLat);

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
        // Sort by approximate distance (Euclidean)
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
    return Response.json({ error: "name is required (max 150 characters)" }, { status: 400 });
  }
  if (name.trim().length > 150) {
    return Response.json({ error: "name cannot exceed 150 characters" }, { status: 400 });
  }

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    isNaN(lat) ||
    isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return Response.json({ error: "lat and lng must be valid numbers within map bounds" }, { status: 400 });
  }

  // Validate website protocol if provided
  let cleanWebsite: string | null = null;
  if (typeof website === "string" && website.trim().length > 0) {
    const trimmed = website.trim();
    if (trimmed.length > 300) {
      return Response.json({ error: "website URL is too long (max 300 characters)" }, { status: 400 });
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return Response.json({ error: "website must begin with http:// or https://" }, { status: 400 });
    }
    cleanWebsite = trimmed;
  }

  try {
    const [inserted] = await db
      .insert(shops)
      .values({
        name: name.trim().slice(0, 150),
        lat,
        lng,
        address: typeof address === "string" ? address.trim().slice(0, 300) || null : null,
        openingHours: typeof openingHours === "string" ? openingHours.trim().slice(0, 200) || null : null,
        cuisine: typeof cuisine === "string" ? cuisine.trim().slice(0, 100) || null : null,
        phone: typeof phone === "string" ? phone.trim().slice(0, 50) || null : null,
        website: cleanWebsite,
        internetAccess: typeof internetAccess === "string" ? internetAccess.trim().slice(0, 20) || null : null,
        outdoorSeating: typeof outdoorSeating === "string" ? outdoorSeating.trim().slice(0, 20) || null : null,
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


import { NextRequest } from "next/server";
import { db } from "@/db";
import { shops, reviews } from "@/db/schema";
import { eq, sql, desc, asc } from "drizzle-orm";

/**
 * GET /api/shops?near=lat,lng&radius=2000&sort=rating|distance
 *
 * Spatially query coffee shops from the PostGIS database.
 * Uses PostGIS ST_DWithin and ST_Distance for geodetic distance calculations.
 * Computes average rating and review count per shop.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Accept ?near=lat,lng or legacy ?lat=X&lng=Y
  const nearParam = searchParams.get("near");
  let lat: number;
  let lng: number;

  if (nearParam) {
    const parts = nearParam.split(",").map((p) => parseFloat(p.trim()));
    lat = parts[0];
    lng = parts[1];
  } else {
    lat = parseFloat(searchParams.get("lat") ?? "");
    lng = parseFloat(searchParams.get("lng") ?? "");
  }

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return Response.json(
      { error: "Valid location coordinates required. Use ?near=lat,lng or ?lat=X&lng=Y" },
      { status: 400 }
    );
  }

  // Parse radius in meters (default 2000m / 2km)
  const rawRadius = parseFloat(searchParams.get("radius") ?? "2000");
  let radiusMeters = isNaN(rawRadius) ? 2000 : rawRadius;
  // If radius was passed as small number <= 50, assume kilometers and convert to meters
  if (radiusMeters > 0 && radiusMeters <= 50) {
    radiusMeters = radiusMeters * 1000;
  }
  // Clamp radius between 100m and 100,000m (100km)
  radiusMeters = Math.min(Math.max(radiusMeters, 100), 100000);

  const sort = searchParams.get("sort")?.toLowerCase() || "distance";
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "100", 10) || 100, 1), 500);

  try {
    const userLocation = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
    const distanceSql = sql<number>`ROUND(ST_Distance(${shops.location}, ${userLocation})::numeric, 1)`;
    const avgRatingSql = sql<number>`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 1), 0)`;
    const reviewCountSql = sql<number>`COUNT(${reviews.id})::int`;

    const baseQuery = db
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
        distanceMeters: distanceSql,
        avgRating: avgRatingSql,
        reviewCount: reviewCountSql,
      })
      .from(shops)
      .leftJoin(reviews, eq(shops.id, reviews.shopId))
      .where(sql`ST_DWithin(${shops.location}, ${userLocation}, ${radiusMeters})`)
      .groupBy(shops.id);

    const results = await (sort === "rating"
      ? baseQuery.orderBy(desc(avgRatingSql), asc(distanceSql)).limit(limit)
      : baseQuery.orderBy(asc(distanceSql)).limit(limit));

    return Response.json({
      total: results.length,
      center: { lat, lng },
      radiusMeters,
      sort,
      shops: results.map((s) => ({
        ...s,
        distance_meters: s.distanceMeters,
        distance_km: s.distanceMeters != null ? Math.round((s.distanceMeters / 1000) * 10) / 10 : null,
        avg_rating: s.avgRating,
        review_count: s.reviewCount,
      })),
    });
  } catch (err) {
    console.error("Failed to perform spatial search for shops:", err);
    return Response.json({ error: "Failed to fetch nearby shops" }, { status: 500 });
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
        location: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`,
        address: typeof address === "string" ? address.trim().slice(0, 300) || null : null,
        tags: {
          opening_hours: typeof openingHours === "string" ? openingHours.trim().slice(0, 200) || undefined : undefined,
          cuisine: typeof cuisine === "string" ? cuisine.trim().slice(0, 100) || undefined : undefined,
          phone: typeof phone === "string" ? phone.trim().slice(0, 50) || undefined : undefined,
          website: cleanWebsite || undefined,
          internet_access: typeof internetAccess === "string" ? internetAccess.trim().slice(0, 20) || undefined : undefined,
          outdoor_seating: typeof outdoorSeating === "string" ? outdoorSeating.trim().slice(0, 20) || undefined : undefined,
        },
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


import { NextRequest } from "next/server";
import { PREDEFINED_AREAS, syncAreaCafes, SyncResult } from "@/lib/sync";

/**
 * GET /api/admin/sync
 * Returns list of predefined sync areas.
 */
export async function GET() {
  return Response.json({
    message: "Brew Warm Background Sync Endpoint",
    availableAreas: Object.entries(PREDEFINED_AREAS).map(([key, val]) => ({
      key,
      name: val.name,
      bounds: val.bounds,
    })),
  });
}

/**
 * POST /api/admin/sync
 *
 * Sync cafés from Overpass into the database.
 * Request body:
 *   { "area": "legazpi" | "bgc" | "makati" | "cebu" | "all" }
 *   OR
 *   { "bounds": { "south": 13.1, "west": 123.7, "north": 13.2, "east": 123.8 }, "name": "Custom Area" }
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const results: SyncResult[] = [];

  // Case 1: Predefined area or 'all'
  if (typeof body.area === "string") {
    const areaKey = body.area.toLowerCase().trim();

    if (areaKey === "all") {
      for (const val of Object.values(PREDEFINED_AREAS)) {
        const result = await syncAreaCafes(val.bounds, val.name);
        results.push(result);
      }
    } else if (areaKey in PREDEFINED_AREAS) {
      const area = PREDEFINED_AREAS[areaKey];
      const result = await syncAreaCafes(area.bounds, area.name);
      results.push(result);
    } else {
      return Response.json(
        {
          error: `Unknown area '${body.area}'. Supported areas: ${Object.keys(PREDEFINED_AREAS).join(", ")}, all`,
        },
        { status: 400 }
      );
    }
  } else if (body.bounds && typeof body.bounds === "object") {
    // Case 2: Custom bounding box
    const b = body.bounds as { south?: number; west?: number; north?: number; east?: number };
    if (
      typeof b.south !== "number" ||
      typeof b.west !== "number" ||
      typeof b.north !== "number" ||
      typeof b.east !== "number"
    ) {
      return Response.json(
        { error: "bounds must contain numeric south, west, north, and east properties" },
        { status: 400 }
      );
    }

    const customName = typeof body.name === "string" ? body.name : "Custom Bounding Box";
    const result = await syncAreaCafes(
      { south: b.south, west: b.west, north: b.north, east: b.east },
      customName
    );
    results.push(result);
  } else {
    return Response.json(
      {
        error: "Please specify either 'area' (e.g. 'legazpi', 'all') or 'bounds' in the request body.",
      },
      { status: 400 }
    );
  }

  const totalUpserted = results.reduce((sum, r) => sum + r.upsertedCount, 0);

  return Response.json({
    success: true,
    totalUpserted,
    results,
  });
}

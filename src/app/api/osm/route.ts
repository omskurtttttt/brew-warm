import { NextRequest } from "next/server";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { and, gte, lte } from "drizzle-orm";

export interface CafeData {
  id: number;
  name: string;
  lat: number;
  lng: number;
  tags: {
    opening_hours?: string;
    cuisine?: string;
    phone?: string;
    website?: string;
    wheelchair?: string;
    internet_access?: string;
    outdoor_seating?: string;
    address?: string;
    name?: string;
    [key: string]: string | undefined;
  };
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const south = parseFloat(searchParams.get("south") ?? "");
  const west = parseFloat(searchParams.get("west") ?? "");
  const north = parseFloat(searchParams.get("north") ?? "");
  const east = parseFloat(searchParams.get("east") ?? "");

  if (
    isNaN(south) ||
    isNaN(west) ||
    isNaN(north) ||
    isNaN(east) ||
    south < -90 ||
    north > 90 ||
    west < -180 ||
    east > 180
  ) {
    return Response.json(
      { error: "Invalid bounding box coordinates (south, west, north, east required)" },
      { status: 400 }
    );
  }

  // Overpass QL query: nodes & ways for amenity=cafe within bounding box
  const query = `[out:json][timeout:25];(node(${south.toFixed(5)},${west.toFixed(5)},${north.toFixed(5)},${east.toFixed(5)})["amenity"="cafe"];way(${south.toFixed(5)},${west.toFixed(5)},${north.toFixed(5)},${east.toFixed(5)})["amenity"="cafe"];);out center;`;

  let osmCafes: CafeData[] = [];

  // Try Overpass servers sequentially with OSM-compliant User-Agent
  for (const serverUrl of OVERPASS_SERVERS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(serverUrl, {
        method: "POST",
        headers: {
          "User-Agent": "BrewWarmApp/1.0 (https://brew-warm.vercel.app; lumibaokurtnivlha@gmail.com)",
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json, */*",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.elements)) {
          osmCafes = parseElements(data.elements);
          break; // Success, exit server loop
        }
      }
    } catch {
      clearTimeout(timeoutId);
      // Continue to next mirror on timeout/failure
    }
  }

  // Fetch local user-submitted community cafes from our database within the bounding box
  let localCafes: CafeData[] = [];
  try {
    const dbRows = await db
      .select()
      .from(shops)
      .where(
        and(
          gte(shops.lat, south),
          lte(shops.lat, north),
          gte(shops.lng, west),
          lte(shops.lng, east)
        )
      )
      .limit(50);

    localCafes = dbRows.map((s) => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      tags: {
        opening_hours: s.openingHours || undefined,
        cuisine: s.cuisine || undefined,
        phone: s.phone || undefined,
        website: s.website || undefined,
        internet_access: s.internetAccess || undefined,
        outdoor_seating: s.outdoorSeating || undefined,
        address: s.address || undefined,
      },
    }));
  } catch {
    // Database query error: fail soft so OSM cafes are still returned
  }

  // Combine and deduplicate cafes by latitude/longitude proximity
  const seen = new Set<string>();
  const combined: CafeData[] = [];

  for (const cafe of [...localCafes, ...osmCafes]) {
    const key = `${cafe.lat.toFixed(4)},${cafe.lng.toFixed(4)}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(cafe);
    }
  }

  return Response.json(
    { cafes: combined },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    }
  );
}

function parseElements(elements: OverpassElement[]): CafeData[] {
  const cafes: CafeData[] = [];

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;

    if (lat == null || lng == null) continue;

    cafes.push({
      id: el.id,
      name: el.tags?.name ?? "Unnamed Café",
      lat,
      lng,
      tags: el.tags ?? {},
    });
  }

  return cafes;
}

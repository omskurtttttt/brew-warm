import { db } from "@/db";
import { shops } from "@/db/schema";
import { sql } from "drizzle-orm";

export interface SyncBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export const PREDEFINED_AREAS: Record<string, { name: string; bounds: SyncBounds }> = {
  legazpi: {
    name: "Legazpi City",
    bounds: { south: 13.12, west: 123.71, north: 13.16, east: 123.77 },
  },
  bgc: {
    name: "Bonifacio Global City (BGC)",
    bounds: { south: 14.54, west: 121.03, north: 14.56, east: 121.07 },
  },
  makati: {
    name: "Makati (Poblacion / Legazpi Village)",
    bounds: { south: 14.54, west: 121.00, north: 14.57, east: 121.04 },
  },
  cebu: {
    name: "Cebu City (IT Park / Lahug)",
    bounds: { south: 10.30, west: 123.88, north: 10.34, east: 123.93 },
  },
};

const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
];

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface SyncResult {
  areaName: string;
  totalFetched: number;
  upsertedCount: number;
  success: boolean;
  error?: string;
}

/**
 * Fetch cafés from Overpass and upsert into the shops database table.
 */
export async function syncAreaCafes(bounds: SyncBounds, areaName = "Custom Area"): Promise<SyncResult> {
  const query = `[out:json][timeout:25];(node(${bounds.south.toFixed(5)},${bounds.west.toFixed(5)},${bounds.north.toFixed(5)},${bounds.east.toFixed(5)})["amenity"="cafe"];way(${bounds.south.toFixed(5)},${bounds.west.toFixed(5)},${bounds.north.toFixed(5)},${bounds.east.toFixed(5)})["amenity"="cafe"];);out center;`;

  let elements: OverpassElement[] = [];
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_SERVERS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(endpoint, {
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

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.elements)) {
          elements = data.elements;
          break;
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error("Failed to query Overpass server");
    }
  }

  if (elements.length === 0 && lastError) {
    return {
      areaName,
      totalFetched: 0,
      upsertedCount: 0,
      success: false,
      error: lastError.message,
    };
  }

  let upsertedCount = 0;

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;

    if (lat == null || lng == null) continue;

    const osmId = String(el.id);
    const name = el.tags?.name || "Unnamed Café";
    const addressParts = [
      el.tags?.["addr:housenumber"],
      el.tags?.["addr:street"],
      el.tags?.["addr:district"],
      el.tags?.["addr:city"],
    ].filter(Boolean);
    const address = addressParts.length > 0 ? addressParts.join(", ") : el.tags?.["addr:full"] || null;

    try {
      await db
        .insert(shops)
        .values({
          osmId,
          name,
          lat,
          lng,
          location: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`,
          address,
          tags: el.tags || {},
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: shops.osmId,
          set: {
            name: sql`EXCLUDED.name`,
            lat: sql`EXCLUDED.lat`,
            lng: sql`EXCLUDED.lng`,
            location: sql`EXCLUDED.location`,
            address: sql`EXCLUDED.address`,
            tags: sql`EXCLUDED.tags`,
            updatedAt: sql`NOW()`,
          },
        });

      upsertedCount++;
    } catch (err) {
      console.error(`Failed to upsert shop ${osmId} (${name}):`, err);
    }
  }

  return {
    areaName,
    totalFetched: elements.length,
    upsertedCount,
    success: true,
  };
}

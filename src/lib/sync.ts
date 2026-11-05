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
  baguio: {
    name: "Baguio City (Session Road / John Hay)",
    bounds: { south: 16.39, west: 120.58, north: 16.43, east: 120.62 },
  },
  quezon_city: {
    name: "Quezon City (Tomas Morato / Diliman)",
    bounds: { south: 14.62, west: 121.02, north: 14.66, east: 121.06 },
  },
  tokyo: {
    name: "Tokyo (Shibuya / Omotesando)",
    bounds: { south: 35.65, west: 139.69, north: 35.68, east: 139.73 },
  },
  london: {
    name: "London (Soho / Covent Garden)",
    bounds: { south: 51.50, west: -0.15, north: 51.53, east: -0.11 },
  },
};

const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
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
export async function syncAreaCafes(
  bounds: SyncBounds,
  areaName = "Custom Area",
  timeoutMs = 60000
): Promise<SyncResult> {
  const overpassTimeoutSec = Math.max(Math.floor(timeoutMs / 1000) - 2, 5);
  const query = `[out:json][timeout:${overpassTimeoutSec}];(node["amenity"="cafe"](${bounds.south.toFixed(5)},${bounds.west.toFixed(5)},${bounds.north.toFixed(5)},${bounds.east.toFixed(5)});way["amenity"="cafe"](${bounds.south.toFixed(5)},${bounds.west.toFixed(5)},${bounds.north.toFixed(5)},${bounds.east.toFixed(5)}););out center;`;

  let elements: OverpassElement[] = [];
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_SERVERS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "User-Agent": "BrewWarmApp/1.0",
          "Accept": "*/*",
          "Content-Type": "application/x-www-form-urlencoded",
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
      } else {
        const errText = `${endpoint} returned HTTP ${response.status} ${response.statusText}`;
        console.error(errText);
        lastError = new Error(errText);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(`Mirror failed (${endpoint}):`, err);
      lastError = err instanceof Error ? err : new Error(`Failed to query ${endpoint}`);
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

  // Deduplicate fetched elements by OSM ID before batching
  const uniqueRecordsMap = new Map<
    string,
    {
      osmId: string;
      name: string;
      lat: number;
      lng: number;
      location: ReturnType<typeof sql>;
      address: string | null;
      tags: Record<string, string>;
      updatedAt: Date;
    }
  >();

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

    uniqueRecordsMap.set(osmId, {
      osmId,
      name,
      lat,
      lng,
      location: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`,
      address,
      tags: el.tags || {},
      updatedAt: new Date(),
    });
  }

  const records = Array.from(uniqueRecordsMap.values());
  const BATCH_SIZE = 50;
  let upsertedCount = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    try {
      await db
        .insert(shops)
        .values(chunk)
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

      upsertedCount += chunk.length;
    } catch (err) {
      console.error(`Failed to batch-upsert chunk of ${chunk.length} shops:`, err);
    }
  }

  return {
    areaName,
    totalFetched: elements.length,
    upsertedCount,
    success: true,
  };
}

/* ============================================================
   Overpass API Client & Spatial Database Consumer
   ============================================================ */

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
  avgRating?: number;
  reviewCount?: number;
  distanceMeters?: number;
}

export interface OverpassBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const OVERPASS_CLIENT_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function parseOverpassElements(elements: OverpassElement[]): CafeData[] {
  const cafes: CafeData[] = [];
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;

    const addressParts = [
      el.tags?.["addr:housenumber"],
      el.tags?.["addr:street"],
      el.tags?.["addr:city"],
    ].filter(Boolean);
    const address = addressParts.length > 0 ? addressParts.join(", ") : el.tags?.["addr:full"];

    cafes.push({
      id: el.id,
      name: el.tags?.name ?? "Unnamed Café",
      lat,
      lng,
      tags: {
        ...(el.tags || {}),
        address,
      },
    });
  }
  return cafes;
}

async function fetchFromOverpassLive(bounds: OverpassBounds): Promise<CafeData[]> {
  const query = `[out:json][timeout:20];(node["amenity"="cafe"](${bounds.south.toFixed(5)},${bounds.west.toFixed(5)},${bounds.north.toFixed(5)},${bounds.east.toFixed(5)});way["amenity"="cafe"](${bounds.south.toFixed(5)},${bounds.west.toFixed(5)},${bounds.north.toFixed(5)},${bounds.east.toFixed(5)}););out center;`;

  for (const endpoint of OVERPASS_CLIENT_MIRRORS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    try {
      const res = await fetch(endpoint, {
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

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.elements)) {
          return parseOverpassElements(data.elements);
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }
  }

  return [];
}

/**
 * Fetch cafes:
 * 1. Queries our PostGIS database first (/api/shops).
 * 2. If the database has cafes for this area, returns them instantly (<50ms).
 * 3. If the area is unvisited/uncached, gracefully falls back to live Overpass API
 *    so users can explore any city worldwide without empty screens.
 */
export async function fetchCafes(bounds: OverpassBounds): Promise<CafeData[]> {
  const centerLat = (bounds.south + bounds.north) / 2;
  const centerLng = (bounds.west + bounds.east) / 2;

  // Approximate radius in meters from the bounding box
  const latDeltaKm = Math.abs(bounds.north - bounds.south) * 111;
  const lngDeltaKm =
    Math.abs(bounds.east - bounds.west) *
    111 *
    Math.cos((centerLat * Math.PI) / 180);
  const radiusMeters = Math.round(
    Math.min(Math.max((Math.max(latDeltaKm, lngDeltaKm) / 2) * 1000, 1000), 100000)
  );

  const url = `/api/shops?near=${centerLat.toFixed(5)},${centerLng.toFixed(5)}&radius=${radiusMeters}`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.shops) && data.shops.length > 0) {
        return data.shops.map((s: {
          id: number;
          name: string;
          lat: number;
          lng: number;
          address?: string | null;
          tags?: Record<string, string | undefined> | null;
          distance_meters?: number | null;
          avg_rating?: number;
          review_count?: number;
        }) => ({
          id: s.id,
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          tags: {
            ...(s.tags || {}),
            address: s.address || s.tags?.address || undefined,
          },
          avgRating: s.avg_rating,
          reviewCount: s.review_count,
          distanceMeters: s.distance_meters ?? undefined,
        }));
      }
    }
  } catch (err) {
    console.error("Failed to fetch shops from spatial database:", err);
  }

  // Fallback to Overpass live data if PostGIS database has no shops for this area yet
  try {
    return await fetchFromOverpassLive(bounds);
  } catch (err) {
    console.error("Live Overpass fallback failed:", err);
    return [];
  }
}

/* ============================================================
   Overpass API Client
   Queries OpenStreetMap for coffee shops (amenity=cafe)
   within a bounding box.
   ============================================================ */

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

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

export interface OverpassBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

/**
 * Build an Overpass QL query for cafes within a bounding box.
 */
function buildQuery(bounds: OverpassBounds): string {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  return `
    [out:json][timeout:10];
    (
      node["amenity"="cafe"](${bbox});
      way["amenity"="cafe"](${bbox});
      relation["amenity"="cafe"](${bbox});
    );
    out center body;
  `;
}

/**
 * Fetch cafes from Overpass API with multi-endpoint fallback,
 * and merge with local community-submitted cafes from /api/shops.
 */
export async function fetchCafes(bounds: OverpassBounds): Promise<CafeData[]> {
  const query = buildQuery(bounds);
  let osmCafes: CafeData[] = [];
  let fetchError: Error | null = null;

  // Try each Overpass mirror sequentially
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.elements)) {
          osmCafes = parseElements(data.elements);
          fetchError = null;
          break; // Success, exit loop
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      fetchError = err instanceof Error ? err : new Error("Failed to fetch Overpass data");
    }
  }

  // Fetch local user-submitted shops from our database
  let localCafes: CafeData[] = [];
  try {
    const centerLat = (bounds.south + bounds.north) / 2;
    const centerLng = (bounds.west + bounds.east) / 2;
    const latDelta = Math.abs(bounds.north - bounds.south);
    const radiusKm = Math.min(Math.max(latDelta * 55, 1), 30);

    const localRes = await fetch(
      `/api/shops?lat=${centerLat.toFixed(5)}&lng=${centerLng.toFixed(5)}&radius=${radiusKm.toFixed(1)}`
    );
    if (localRes.ok) {
      const localData = await localRes.json();
      if (Array.isArray(localData.shops)) {
        localCafes = localData.shops.map((s: {
          id: number;
          name: string;
          lat: number;
          lng: number;
          address?: string | null;
          openingHours?: string | null;
          cuisine?: string | null;
          phone?: string | null;
          website?: string | null;
          internetAccess?: string | null;
          outdoorSeating?: string | null;
        }) => ({
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
      }
    }
  } catch {
    // Ignore local fetch errors if offline or misconfigured
  }

  // Merge OSM + Local Community Cafes (deduplicating by ID/coordinates)
  const combined = [...localCafes, ...osmCafes];
  const seen = new Set<string>();
  const uniqueCafes: CafeData[] = [];

  for (const cafe of combined) {
    const key = `${cafe.lat.toFixed(4)},${cafe.lng.toFixed(4)}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCafes.push(cafe);
    }
  }

  // If both OSM failed and local is empty, throw a readable error
  if (fetchError && uniqueCafes.length === 0) {
    throw new Error("Temporary network timeout fetching OpenStreetMap data. Try panning the map.");
  }

  return uniqueCafes;
}


interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/**
 * Parse raw Overpass elements into our CafeData shape.
 * Nodes have lat/lon directly; ways/relations use the `center` field.
 */
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

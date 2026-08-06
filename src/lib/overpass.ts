/* ============================================================
   Overpass API Client
   Queries OpenStreetMap for coffee shops (amenity=cafe)
   within a bounding box.
   ============================================================ */

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

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
    [out:json][timeout:15];
    (
      node["amenity"="cafe"](${bbox});
      way["amenity"="cafe"](${bbox});
      relation["amenity"="cafe"](${bbox});
    );
    out center body;
  `;
}

/**
 * Fetch cafes from the Overpass API for a given bounding box.
 */
export async function fetchCafes(bounds: OverpassBounds): Promise<CafeData[]> {
  const query = buildQuery(bounds);

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = await response.json();

  return parseElements(data.elements);
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

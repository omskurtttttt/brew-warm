/* ============================================================
   Overpass API Client
   Queries OpenStreetMap for coffee shops (amenity=cafe)
   within a bounding box.
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
}

export interface OverpassBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}


/**
 * Fetch cafes via our server-side proxy route (/api/osm).
 * The server attaches an OSM-compliant User-Agent, handles multi-mirror fallback,
 * queries both OpenStreetMap and the local database, and caches results.
 */
export async function fetchCafes(bounds: OverpassBounds): Promise<CafeData[]> {
  const url = `/api/osm?south=${bounds.south.toFixed(5)}&west=${bounds.west.toFixed(5)}&north=${bounds.north.toFixed(5)}&east=${bounds.east.toFixed(5)}`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.cafes)) {
        return data.cafes;
      }
    }
  } catch {
    // Network error on /api/osm: try direct /api/shops fallback
  }

  // Fallback to local community database directly
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
        return localData.shops.map((s: {
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
    // Fail soft
  }

  return [];
}


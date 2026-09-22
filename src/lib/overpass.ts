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

/**
 * Fetch cafes from our spatial PostGIS database (/api/shops).
 * The database acts as the single source of truth for all reads.
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
      if (Array.isArray(data.shops)) {
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

  return [];
}


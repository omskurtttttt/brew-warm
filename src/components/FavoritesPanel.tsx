"use client";

import { useEffect, useState, useCallback } from "react";
import type { CafeData } from "@/lib/overpass";
import ShopCard from "./ShopCard";

interface FavoriteItem {
  id: number;
  shopId: number;
  createdAt: string;
  shop: {
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
  };
}

interface FavoritesPanelProps {
  sessionId: string;
  onSelectShop: (cafe: CafeData) => void;
  favoriteIds: Set<number | string>;
  onToggleFavorite: (cafeId: number | string) => void;
}

export default function FavoritesPanel({
  sessionId,
  onSelectShop,
  favoriteIds,
  onToggleFavorite,
}: FavoritesPanelProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/favorites?sessionId=${encodeURIComponent(sessionId)}`);
      if (!res.ok) throw new Error("Failed to load favorites");
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <div style={{ marginTop: "1rem" }}>
      <div style={{ marginBottom: "0.75rem" }}>
        <p className="section-header" style={{ marginBottom: "0.25rem" }}>
          02 — saved
        </p>
        <h2 className="text-h1" style={{ fontSize: "var(--text-h2)" }}>
          your favorite spots
        </h2>
      </div>

      {loading ? (
        <p className="text-micro">loading favorites...</p>
      ) : favorites.length === 0 ? (
        <div className="empty-state" style={{ padding: "1.5rem 1rem" }}>
          <p className="text-accent-script" style={{ marginBottom: "0.5rem" }}>
            no favorites saved yet
          </p>
          <p className="text-micro">
            click the heart icon on any café card to save it to your personal collection
          </p>
        </div>
      ) : (
        <div className="cafe-list">
          {favorites.map((fav, i) => {
            const cafeData: CafeData = {
              id: fav.shop.id,
              name: fav.shop.name,
              lat: fav.shop.lat,
              lng: fav.shop.lng,
              tags: {
                opening_hours: fav.shop.openingHours || undefined,
                cuisine: fav.shop.cuisine || undefined,
                phone: fav.shop.phone || undefined,
                website: fav.shop.website || undefined,
                internet_access: fav.shop.internetAccess || undefined,
                outdoor_seating: fav.shop.outdoorSeating || undefined,
              },
            };

            return (
              <ShopCard
                key={fav.id}
                cafe={cafeData}
                index={i}
                isActive={false}
                onSelect={onSelectShop}
                isFavorite={favoriteIds.has(fav.shop.id)}
                onToggleFavorite={onToggleFavorite}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

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
  onHoverShop?: (cafeId: number | string | null) => void;
  hoveredCafeId?: number | string | null;
  favoriteIds: Set<number | string>;
  onToggleFavorite: (cafeId: number | string) => void;
  onExploreCafes?: () => void;
}

export default function FavoritesPanel({
  sessionId,
  onSelectShop,
  onHoverShop,
  hoveredCafeId,
  favoriteIds,
  onToggleFavorite,
  onExploreCafes,
}: FavoritesPanelProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  const [loading, setLoading] = useState(() => Boolean(sessionId));

  useEffect(() => {
    if (!sessionId) return;

    let isCancelled = false;

    fetch(`/api/favorites?sessionId=${encodeURIComponent(sessionId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load favorites");
        return res.json();
      })
      .then((data) => {
        if (!isCancelled) {
          setFavorites(data.favorites || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setFavorites([]);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [sessionId]);

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
        <div
          className="empty-state"
          style={{
            padding: "2rem 1rem",
            backgroundColor: "var(--color-surface)",
            border: "1px dashed var(--color-border)",
            borderRadius: "var(--radius-md)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>☕🤍</div>
          <p className="text-accent-script" style={{ fontSize: "1.25rem", marginBottom: "0.35rem" }}>
            no favorites saved yet
          </p>
          <p
            className="text-micro"
            style={{ maxWidth: "260px", margin: "0 auto 1.25rem", lineHeight: 1.4 }}
          >
            click the heart icon on any café card to save it to your personal passport collection
          </p>
          {onExploreCafes && (
            <button
              type="button"
              onClick={onExploreCafes}
              className="pill pill--filter-active"
              style={{
                cursor: "pointer",
                padding: "8px 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                fontWeight: 600,
              }}
            >
              <span>🧭 explore nearby cafés</span>
            </button>
          )}
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
                isHovered={hoveredCafeId === fav.shop.id}
                onSelect={onSelectShop}
                onHover={onHoverShop}
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


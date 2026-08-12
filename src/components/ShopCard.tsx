"use client";

import type { CafeData } from "@/lib/overpass";
import { HeartIcon } from "./Icons";

interface ShopCardProps {
  cafe: CafeData;
  index: number;
  isActive: boolean;
  onSelect: (cafe: CafeData) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (cafeId: number | string) => void;
}

export default function ShopCard({
  cafe,
  index,
  isActive,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
}: ShopCardProps) {
  const hasHours = !!cafe.tags.opening_hours;
  const hasWifi = cafe.tags.internet_access === "wlan" || cafe.tags.internet_access === "yes";
  const hasOutdoor = cafe.tags.outdoor_seating === "yes";
  const cuisine = cafe.tags.cuisine;

  return (
    <div
      className={`shop-card entrance-stagger ${isActive ? "shop-card--active" : ""}`}
      style={{ animationDelay: `${50 + index * 60}ms` }}
      onClick={() => onSelect(cafe)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${cafe.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(cafe);
        }
      }}
    >
      {/* Header row */}
      <div className="shop-card__header">
        <h3 className="shop-card__name">{cafe.name}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {onToggleFavorite && (
            <button
              type="button"
              className={`shop-card__favorite-btn ${isFavorite ? "shop-card__favorite-btn--active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(cafe.id);
              }}
              aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
              title={isFavorite ? "Remove from favorites" : "Save to favorites"}
            >
              <HeartIcon size={16} filled={isFavorite} color={isFavorite ? "var(--color-accent)" : "var(--color-text-secondary)"} />
            </button>
          )}
          <span className={`status-dot ${hasHours ? "" : "status-dot--closed"}`} />
        </div>
      </div>

      {/* Hours */}
      {hasHours && (
        <p className="text-micro" style={{ marginTop: "4px" }}>
          {cafe.tags.opening_hours}
        </p>
      )}

      {/* Tags */}
      <div className="shop-card__tags">
        {cuisine && <span className="pill">{cuisine}</span>}
        {hasWifi && <span className="pill">wifi</span>}
        {hasOutdoor && <span className="pill">outdoor</span>}
      </div>
    </div>
  );
}

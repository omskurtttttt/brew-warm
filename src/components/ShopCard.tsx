"use client";

import type { CafeData } from "@/lib/overpass";

interface ShopCardProps {
  cafe: CafeData;
  index: number;
  isActive: boolean;
  onSelect: (cafe: CafeData) => void;
}

export default function ShopCard({ cafe, index, isActive, onSelect }: ShopCardProps) {
  const hasHours = !!cafe.tags.opening_hours;
  const hasWifi = cafe.tags.internet_access === "wlan" || cafe.tags.internet_access === "yes";
  const hasOutdoor = cafe.tags.outdoor_seating === "yes";
  const cuisine = cafe.tags.cuisine;

  return (
    <button
      className={`shop-card entrance-stagger ${isActive ? "shop-card--active" : ""}`}
      style={{ animationDelay: `${50 + index * 60}ms` }}
      onClick={() => onSelect(cafe)}
      aria-label={`View details for ${cafe.name}`}
    >
      {/* Header row */}
      <div className="shop-card__header">
        <h3 className="shop-card__name">{cafe.name}</h3>
        <span className={`status-dot ${hasHours ? "" : "status-dot--closed"}`} />
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
    </button>
  );
}

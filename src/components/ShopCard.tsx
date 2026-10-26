"use client";

import type { CafeData } from "@/lib/overpass";
import {
  HeartIcon,
  StarIcon,
  WifiIcon,
  OutdoorIcon,
  WheelchairIcon,
  ClockIcon,
  MapPinIcon,
} from "./Icons";

interface ShopCardProps {
  cafe: CafeData;
  index: number;
  isActive: boolean;
  isHovered?: boolean;
  onSelect: (cafe: CafeData) => void;
  onHover?: (cafeId: number | string | null) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (cafeId: number | string) => void;
}

function formatDistance(meters?: number): string | null {
  if (meters == null || isNaN(meters)) return null;
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function ShopCard({
  cafe,
  index,
  isActive,
  isHovered = false,
  onSelect,
  onHover,
  isFavorite = false,
  onToggleFavorite,
}: ShopCardProps) {
  const hasHours = !!cafe.tags.opening_hours;
  const hasWifi = cafe.tags.internet_access === "wlan" || cafe.tags.internet_access === "yes";
  const hasOutdoor = cafe.tags.outdoor_seating === "yes";
  const hasWheelchair = cafe.tags.wheelchair === "yes";
  const cuisine = cafe.tags.cuisine;
  const distance = formatDistance(cafe.distanceMeters);

  return (
    <article
      className={`shop-card entrance-stagger ${isActive ? "shop-card--active" : ""} ${isHovered ? "shop-card--hovered" : ""}`}
      style={{ animationDelay: `${Math.min(50 + index * 45, 350)}ms` }}
      onClick={() => onSelect(cafe)}
      onMouseEnter={() => onHover?.(cafe.id)}
      onMouseLeave={() => onHover?.(null)}
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
      {/* Top row: Name & Favorite Button */}
      <div className="shop-card__header">
        <h3 className="shop-card__name">{cafe.name}</h3>
        {onToggleFavorite && (
          <button
            type="button"
            className={`shop-card__favorite-btn ${isFavorite ? "shop-card__favorite-btn--active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(cafe.id);
            }}
            aria-label={isFavorite ? `Remove ${cafe.name} from favorites` : `Save ${cafe.name} to favorites`}
            title={isFavorite ? "Remove from favorites" : "Save to favorites"}
          >
            <HeartIcon
              size={15}
              filled={isFavorite}
              color={isFavorite ? "var(--color-accent)" : "currentColor"}
            />
          </button>
        )}
      </div>

      {/* Meta sub-row: Distance badge & Status pill & Rating */}
      <div className="shop-card__meta-row">
        {distance && (
          <span className="shop-card__distance-badge" title="Distance from center">
            <MapPinIcon size={11} color="var(--color-accent)" />
            <span>{distance} away</span>
          </span>
        )}
        <span
          className={`shop-card__status-pill ${hasHours ? "shop-card__status-pill--listed" : "shop-card__status-pill--unverified"}`}
          role="status"
          aria-label={hasHours ? "Operating hours listed" : "Hours unverified"}
        >
          <span className={`status-dot ${hasHours ? "" : "status-dot--closed"}`} />
          <span>{hasHours ? "Hours listed" : "Unverified"}</span>
        </span>
        {cafe.avgRating && cafe.avgRating > 0 ? (
          <span className="shop-card__rating-badge">
            <StarIcon size={11} filled={true} color="var(--color-accent)" />
            <span>{cafe.avgRating.toFixed(1)}</span>
            {cafe.reviewCount ? (
              <span className="shop-card__rating-count">({cafe.reviewCount})</span>
            ) : null}
          </span>
        ) : null}
      </div>

      {/* Structured hours preview */}
      {hasHours && (
        <div className="shop-card__hours-row">
          <ClockIcon size={12} color="var(--color-text-tertiary)" />
          <span className="shop-card__hours-text">{cafe.tags.opening_hours}</span>
        </div>
      )}

      {/* Amenities & Cuisine Chips with SVG icons */}
      <div className="shop-card__tags">
        {cuisine && <span className="pill pill--cuisine">{cuisine}</span>}
        {hasWifi && (
          <span className="pill pill--amenity">
            <WifiIcon size={10} />
            <span>wifi</span>
          </span>
        )}
        {hasOutdoor && (
          <span className="pill pill--amenity">
            <OutdoorIcon size={10} />
            <span>outdoor</span>
          </span>
        )}
        {hasWheelchair && (
          <span className="pill pill--amenity">
            <WheelchairIcon size={10} />
            <span>accessible</span>
          </span>
        )}
      </div>
    </article>
  );
}

"use client";

import { useEffect, useCallback, useState } from "react";
import type { CafeData } from "@/lib/overpass";

interface ShopDetailProps {
  cafe: CafeData;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number | string) => void;
}

export default function ShopDetail({
  cafe,
  onClose,
  isFavorite = false,
  onToggleFavorite,
}: ShopDetailProps) {
  const [copied, setCopied] = useState(false);

  const hasHours = !!cafe.tags.opening_hours;
  const hasWifi =
    cafe.tags.internet_access === "wlan" || cafe.tags.internet_access === "yes";
  const hasOutdoor = cafe.tags.outdoor_seating === "yes";
  const hasWheelchair = cafe.tags.wheelchair === "yes";

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Directions URL (Google Maps)
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}`;

  // Share handler
  function handleShare() {
    const text = `${cafe.name} - Coffee Shop Finder\n${cafe.lat}, ${cafe.lng}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="shop-detail-panel entrance-stagger">
      {/* Top Navigation Bar */}
      <div className="shop-detail-panel__header">
        <button
          onClick={onClose}
          className="shop-detail-panel__back-btn"
          aria-label="Back to café list"
        >
          ← back to list
        </button>
        <button
          onClick={onClose}
          className="shop-detail-panel__close-btn"
          aria-label="Close details"
        >
          ×
        </button>
      </div>

      {/* Hero Cover Banner */}
      <div className="shop-detail-panel__hero">
        <img
          src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"
          alt={cafe.name}
          className="shop-detail-panel__hero-img"
        />
        <div className="shop-detail-panel__hero-overlay" />
        <span className="pill shop-detail-panel__hero-badge">
          {cafe.tags.cuisine || "Specialty Coffee"}
        </span>
      </div>

      {/* Main Title & Status */}
      <div style={{ marginTop: "1rem", marginBottom: "0.75rem" }}>
        <h1 className="text-h1" style={{ fontSize: "1.65rem", lineHeight: 1.15 }}>
          {cafe.name}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "0.375rem",
          }}
        >
          <span className={`status-dot ${hasHours ? "" : "status-dot--closed"}`} />
          <span className="text-micro" style={{ letterSpacing: "0.06em" }}>
            {hasHours ? "open now" : "hours unconfirmed"}
          </span>
        </div>
      </div>

      {/* Google Maps Style Action Buttons Row */}
      <div className="shop-detail-panel__actions">
        {/* Directions */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shop-detail-panel__action-btn"
        >
          <span style={{ fontSize: "1.1rem" }}>🧭</span>
          <span>directions</span>
        </a>

        {/* Save / Favorite */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(cafe.id)}
            className={`shop-detail-panel__action-btn ${
              isFavorite ? "shop-detail-panel__action-btn--active" : ""
            }`}
          >
            <span style={{ fontSize: "1.1rem" }}>{isFavorite ? "♥" : "♡"}</span>
            <span>{isFavorite ? "saved" : "save"}</span>
          </button>
        )}

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="shop-detail-panel__action-btn"
        >
          <span style={{ fontSize: "1.1rem" }}>🔗</span>
          <span>{copied ? "copied!" : "share"}</span>
        </button>
      </div>

      <hr className="divider" style={{ margin: "1.25rem 0" }} />

      {/* Section: Overview Details */}
      <p className="section-header" style={{ marginBottom: "0.75rem" }}>
        01 — overview
      </p>

      <div className="shop-detail__grid" style={{ gap: "0.875rem" }}>
        {/* Address / Location */}
        <div className="shop-detail__row">
          <span className="text-micro">location</span>
          <span className="shop-detail__value" style={{ fontSize: "var(--text-small)" }}>
            📍 {cafe.tags.address || `${cafe.lat.toFixed(5)}, ${cafe.lng.toFixed(5)}`}
          </span>
        </div>

        {/* Cuisine / Specialty */}
        {cafe.tags.cuisine && (
          <div className="shop-detail__row">
            <span className="text-micro">specialty</span>
            <span className="shop-detail__value">☕ {cafe.tags.cuisine}</span>
          </div>
        )}

        {/* Phone */}
        {cafe.tags.phone && (
          <div className="shop-detail__row">
            <span className="text-micro">phone</span>
            <span className="shop-detail__value">
              📞 <a href={`tel:${cafe.tags.phone}`}>{cafe.tags.phone}</a>
            </span>
          </div>
        )}

        {/* Website */}
        {cafe.tags.website && (
          <div className="shop-detail__row">
            <span className="text-micro">website</span>
            <span className="shop-detail__value">
              🌐{" "}
              <a href={cafe.tags.website} target="_blank" rel="noopener noreferrer">
                {new URL(cafe.tags.website).hostname}
              </a>
            </span>
          </div>
        )}
      </div>

      {/* Section: Opening Hours */}
      {hasHours && (
        <>
          <hr className="divider" style={{ margin: "1.25rem 0" }} />
          <p className="section-header" style={{ marginBottom: "0.75rem" }}>
            02 — hours
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-small)",
              color: "var(--color-text-primary)",
              lineHeight: 1.5,
            }}
          >
            ⏰ {cafe.tags.opening_hours}
          </p>
        </>
      )}

      {/* Section: Amenities */}
      <hr className="divider" style={{ margin: "1.25rem 0" }} />
      <p className="section-header" style={{ marginBottom: "0.75rem" }}>
        {hasHours ? "03" : "02"} — amenities
      </p>
      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
        {hasWifi && <span className="pill">📶 wifi</span>}
        {hasOutdoor && <span className="pill">🌿 outdoor seating</span>}
        {hasWheelchair && <span className="pill">♿ wheelchair accessible</span>}
        {!hasWifi && !hasOutdoor && !hasWheelchair && (
          <span className="text-micro">no amenity data available</span>
        )}
      </div>

      {/* Coordinates Receipt Footer */}
      <hr className="divider" style={{ marginTop: "1.5rem" }} />
      <p
        className="text-micro"
        style={{ marginTop: "0.75rem", textAlign: "center", opacity: 0.7 }}
      >
        {cafe.lat.toFixed(5)}, {cafe.lng.toFixed(5)} · osm id {cafe.id}
      </p>
    </div>
  );
}

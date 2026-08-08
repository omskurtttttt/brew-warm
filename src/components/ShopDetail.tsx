"use client";

import { useEffect, useCallback } from "react";
import type { CafeData } from "@/lib/overpass";

interface ShopDetailProps {
  cafe: CafeData;
  onClose: () => void;
}

export default function ShopDetail({ cafe, onClose }: ShopDetailProps) {
  const hasHours = !!cafe.tags.opening_hours;
  const hasWifi =
    cafe.tags.internet_access === "wlan" || cafe.tags.internet_access === "yes";
  const hasOutdoor = cafe.tags.outdoor_seating === "yes";
  const hasWheelchair = cafe.tags.wheelchair === "yes";

  // Close on Escape
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

  return (
    <>
      {/* Overlay */}
      <div className="overlay" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${cafe.name}`}
      >
        {/* Close button */}
        <button
          className="shop-detail__close"
          onClick={onClose}
          aria-label="Close details"
        >
          ×
        </button>

        {/* Name */}
        <h2 className="text-h1" style={{ marginBottom: "0.25rem" }}>
          {cafe.name}
        </h2>

        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <span className={`status-dot ${hasHours ? "" : "status-dot--closed"}`} />
          <span className="text-micro">{hasHours ? "open" : "hours unknown"}</span>
        </div>

        <hr className="divider" />

        {/* Section: Details */}
        <p className="section-header" style={{ margin: "1rem 0 0.75rem" }}>
          01 — details
        </p>

        <div className="shop-detail__grid">
          {cafe.tags.cuisine && (
            <div className="shop-detail__row">
              <span className="text-micro">cuisine</span>
              <span className="shop-detail__value">{cafe.tags.cuisine}</span>
            </div>
          )}
          {cafe.tags.phone && (
            <div className="shop-detail__row">
              <span className="text-micro">phone</span>
              <span className="shop-detail__value">
                <a href={`tel:${cafe.tags.phone}`}>{cafe.tags.phone}</a>
              </span>
            </div>
          )}
          {cafe.tags.website && (
            <div className="shop-detail__row">
              <span className="text-micro">website</span>
              <span className="shop-detail__value">
                <a href={cafe.tags.website} target="_blank" rel="noopener noreferrer">
                  {new URL(cafe.tags.website).hostname}
                </a>
              </span>
            </div>
          )}
        </div>

        {/* Section: Hours */}
        {hasHours && (
          <>
            <hr className="divider" />
            <p className="section-header" style={{ margin: "1rem 0 0.75rem" }}>
              02 — hours
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-small)" }}>
              {cafe.tags.opening_hours}
            </p>
          </>
        )}

        {/* Section: Amenities */}
        <hr className="divider" />
        <p className="section-header" style={{ margin: "1rem 0 0.75rem" }}>
          {hasHours ? "03" : "02"} — amenities
        </p>
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {hasWifi && <span className="pill">wifi</span>}
          {hasOutdoor && <span className="pill">outdoor seating</span>}
          {hasWheelchair && <span className="pill">wheelchair accessible</span>}
          {!hasWifi && !hasOutdoor && !hasWheelchair && (
            <span className="text-micro">no amenity data available</span>
          )}
        </div>

        {/* Coordinates (micro-label receipt style) */}
        <hr className="divider" style={{ marginTop: "1.25rem" }} />
        <p className="text-micro" style={{ marginTop: "0.75rem", textAlign: "center" }}>
          {cafe.lat.toFixed(5)}, {cafe.lng.toFixed(5)} · osm id {cafe.id}
        </p>
      </div>
    </>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { CafeData } from "@/lib/overpass";

/* Dynamic import — Leaflet requires browser APIs */
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="map-skeleton">
      <div className="map-skeleton__pulse" />
      <span className="text-micro" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
        loading map...
      </span>
    </div>
  ),
});

export default function MapView() {
  const [cafes, setCafes] = useState<CafeData[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<CafeData | null>(null);

  return (
    <div className="split-layout">
      {/* Side panel — cafe list (desktop) / bottom sheet (mobile) */}
      <aside className="split-layout__panel" aria-label="Cafe list">
        <div style={{ marginBottom: "var(--space-md)" }}>
          <p className="section-header" style={{ marginBottom: "0.5rem" }}>
            01 — nearby
          </p>
          <h1 className="text-h1">cafés near you</h1>
        </div>

        {cafes.length === 0 ? (
          <div className="empty-state">
            <p className="text-accent-script" style={{ marginBottom: "0.5rem" }}>
              pan the map to discover cafés
            </p>
            <p className="text-micro">
              we&apos;ll search openstreetmap as you explore
            </p>
          </div>
        ) : (
          <div className="cafe-list">
            {cafes.map((cafe, i) => (
              <button
                key={cafe.id}
                className={`cafe-list-item entrance-stagger ${
                  selectedCafe?.id === cafe.id ? "cafe-list-item--active" : ""
                }`}
                style={{ animationDelay: `${50 + i * 60}ms` }}
                onClick={() => setSelectedCafe(cafe)}
              >
                <div className="cafe-list-item__header">
                  <span className="cafe-list-item__name">{cafe.name}</span>
                  <span className={`status-dot ${
                    cafe.tags.opening_hours ? "" : "status-dot--closed"
                  }`} />
                </div>
                {cafe.tags.cuisine && (
                  <span className="pill" style={{ marginTop: "4px" }}>
                    {cafe.tags.cuisine}
                  </span>
                )}
                {cafe.tags.opening_hours && (
                  <p className="text-micro" style={{ marginTop: "4px" }}>
                    {cafe.tags.opening_hours}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Map area */}
      <div className="split-layout__map">
        <Map
          onCafesLoaded={setCafes}
          onCafeSelect={setSelectedCafe}
          selectedCafeId={selectedCafe?.id ?? null}
        />
      </div>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useCallback, useRef } from "react";
import type { CafeData } from "@/lib/overpass";
import ShopCard from "@/components/ShopCard";
import ShopDetail from "@/components/ShopDetail";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";

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
  const [showDetail, setShowDetail] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const flyKeyRef = useRef(0);

  // Filter cafes based on active filters
  const filteredCafes = useMemo(() => {
    if (activeFilters.size === 0) return cafes;

    return cafes.filter((cafe) => {
      if (activeFilters.has("wifi") && cafe.tags.internet_access !== "wlan" && cafe.tags.internet_access !== "yes") {
        return false;
      }
      if (activeFilters.has("outdoor") && cafe.tags.outdoor_seating !== "yes") {
        return false;
      }
      if (activeFilters.has("wheelchair") && cafe.tags.wheelchair !== "yes") {
        return false;
      }
      if (activeFilters.has("has_hours") && !cafe.tags.opening_hours) {
        return false;
      }
      return true;
    });
  }, [cafes, activeFilters]);

  const handleFilterToggle = useCallback((filter: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  }, []);

  function handleCafeSelect(cafe: CafeData) {
    setSelectedCafe(cafe);
    setShowDetail(true);
  }

  function handleSearchSelect(lat: number, lng: number, _label: string) {
    flyKeyRef.current += 1;
    setFlyTo({ lat, lng, key: flyKeyRef.current });
  }

  return (
    <div className="split-layout">
      {/* Side panel */}
      <aside className="split-layout__panel" aria-label="Cafe list">
        {/* Search */}
        <div style={{ marginBottom: "var(--space-sm)" }}>
          <SearchBar onLocationSelect={handleSearchSelect} />
        </div>

        {/* Heading */}
        <div style={{ marginBottom: "var(--space-sm)" }}>
          <p className="section-header" style={{ marginBottom: "0.25rem" }}>
            01 — nearby
          </p>
          <h1 className="text-h1">cafés near you</h1>
        </div>

        {/* Filters */}
        <FilterBar
          activeFilters={activeFilters}
          onToggle={handleFilterToggle}
          cafeCount={filteredCafes.length}
        />

        {/* Cafe list */}
        {filteredCafes.length === 0 ? (
          <div className="empty-state">
            <p className="text-accent-script" style={{ marginBottom: "0.5rem" }}>
              {cafes.length === 0
                ? "pan the map to discover cafés"
                : "no cafés match your filters"}
            </p>
            <p className="text-micro">
              {cafes.length === 0
                ? "we'll search openstreetmap as you explore"
                : `${cafes.length} total — try removing a filter`}
            </p>
          </div>
        ) : (
          <div className="cafe-list">
            {filteredCafes.map((cafe, i) => (
              <ShopCard
                key={cafe.id}
                cafe={cafe}
                index={i}
                isActive={selectedCafe?.id === cafe.id}
                onSelect={handleCafeSelect}
              />
            ))}
          </div>
        )}
      </aside>

      {/* Map area */}
      <div className="split-layout__map">
        <Map
          onCafesLoaded={setCafes}
          onCafeSelect={handleCafeSelect}
          selectedCafeId={selectedCafe?.id ?? null}
          flyTo={flyTo}
        />
      </div>

      {/* Detail modal */}
      {showDetail && selectedCafe && (
        <ShopDetail
          cafe={selectedCafe}
          onClose={() => setShowDetail(false)}
        />
      )}
    </div>
  );
}

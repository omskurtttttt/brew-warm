"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { CafeData } from "@/lib/overpass";
import ShopCard from "@/components/ShopCard";
import ShopDetail from "@/components/ShopDetail";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import AddShopForm from "@/components/AddShopForm";
import FavoritesPanel from "@/components/FavoritesPanel";
import ThemeToggle from "@/components/ThemeToggle";
import CoffeeStain from "@/components/CoffeeStain";
import { getOrCreateSessionId } from "@/lib/session";

/* Dynamic import — Leaflet requires browser APIs */
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="map-skeleton">
      <div className="map-skeleton__pulse" />
      <span
        className="text-micro"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
        }}
      >
        loading map...
      </span>
    </div>
  ),
});

export default function MapView() {
  const [cafes, setCafes] = useState<CafeData[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<CafeData | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"nearby" | "saved">("nearby");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; key: number } | null>(null);
  
  // Session & Favorites state
  const [sessionId, setSessionId] = useState<string>("");
  const [favoriteIds, setFavoriteIds] = useState<Set<number | string>>(new Set());
  const flyKeyRef = useRef(0);

  // Initialize session ID & load existing favorites
  useEffect(() => {
    const sessId = getOrCreateSessionId();
    setSessionId(sessId);

    if (sessId) {
      fetch(`/api/favorites?sessionId=${encodeURIComponent(sessId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.favorites && Array.isArray(data.favorites)) {
            const ids = new Set<number | string>(
              data.favorites.map((f: { shopId: number }) => f.shopId)
            );
            setFavoriteIds(ids);
          }
        })
        .catch(() => {
          // Fallback silences errors
        });
    }
  }, []);

  // Filter cafes based on active filters
  const filteredCafes = useMemo(() => {
    if (activeFilters.size === 0) return cafes;

    return cafes.filter((cafe) => {
      if (
        activeFilters.has("wifi") &&
        cafe.tags.internet_access !== "wlan" &&
        cafe.tags.internet_access !== "yes"
      ) {
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
    flyKeyRef.current += 1;
    setFlyTo({ lat: cafe.lat, lng: cafe.lng, key: flyKeyRef.current });
  }

  function handleSearchSelect(lat: number, lng: number, _label: string) {
    flyKeyRef.current += 1;
    setFlyTo({ lat, lng, key: flyKeyRef.current });
  }

  // Toggle favorite shop with optimistic UI update
  async function handleToggleFavorite(cafeId: number | string) {
    if (!sessionId) return;

    const isFav = favoriteIds.has(cafeId);
    // Optimistic state update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) {
        next.delete(cafeId);
      } else {
        next.add(cafeId);
      }
      return next;
    });

    try {
      if (isFav) {
        // Find favorite entry ID to delete
        const res = await fetch(`/api/favorites?sessionId=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        const entry = data.favorites?.find((f: { shopId: number }) => f.shopId === Number(cafeId));
        if (entry) {
          await fetch(`/api/favorites?id=${entry.id}&sessionId=${encodeURIComponent(sessionId)}`, {
            method: "DELETE",
          });
        }
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId: Number(cafeId),
            sessionId,
          }),
        });
      }
    } catch {
      // Revert on error
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) {
          next.add(cafeId);
        } else {
          next.delete(cafeId);
        }
        return next;
      });
    }
  }

  // Handle user shop submission
  function handleShopAdded(newShop: {
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
  }) {
    const cafeData: CafeData = {
      id: newShop.id,
      name: newShop.name,
      lat: newShop.lat,
      lng: newShop.lng,
      tags: {
        opening_hours: newShop.openingHours || undefined,
        cuisine: newShop.cuisine || undefined,
        phone: newShop.phone || undefined,
        website: newShop.website || undefined,
        internet_access: newShop.internetAccess || undefined,
        outdoor_seating: newShop.outdoorSeating || undefined,
      },
    };

    setCafes((prev) => [cafeData, ...prev]);
    setSelectedCafe(cafeData);
    setShowDetail(true);
    // Fly map to newly added shop
    flyKeyRef.current += 1;
    setFlyTo({ lat: newShop.lat, lng: newShop.lng, key: flyKeyRef.current });
  }

  return (
    <div className="split-layout">
      {/* Side panel */}
      <aside className="split-layout__panel" aria-label="Cafe list" style={{ position: "relative" }}>
        <CoffeeStain position="top-right" opacity={0.06} size={220} />

        {/* Render Google Maps style detail view inside sidebar when a shop is selected */}
        {showDetail && selectedCafe ? (
          <ShopDetail
            cafe={selectedCafe}
            onClose={() => {
              setShowDetail(false);
              setSelectedCafe(null);
            }}
            isFavorite={favoriteIds.has(selectedCafe.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <>
            {/* Search */}
            <div style={{ marginBottom: "var(--space-sm)", position: "relative", zIndex: 100 }}>
              <SearchBar onLocationSelect={handleSearchSelect} />
            </div>

            {/* Navigation & Add Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "var(--space-sm)",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <button
                  className={`pill ${activeTab === "nearby" ? "pill--filter-active" : ""}`}
                  onClick={() => setActiveTab("nearby")}
                  style={{ cursor: "pointer" }}
                >
                  nearby
                </button>
                <button
                  className={`pill ${activeTab === "saved" ? "pill--filter-active" : ""}`}
                  onClick={() => setActiveTab("saved")}
                  style={{ cursor: "pointer" }}
                >
                  saved ({favoriteIds.size})
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ThemeToggle />
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-accent)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-micro)",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  + add café
                </button>
              </div>
            </div>

            {/* Tab content */}
            {activeTab === "nearby" ? (
              <>
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
                        isFavorite={favoriteIds.has(cafe.id)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <FavoritesPanel
                sessionId={sessionId}
                onSelectShop={handleCafeSelect}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
              />
            )}
          </>
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

      {/* Add shop modal */}
      {showAddForm && (
        <AddShopForm
          initialLat={selectedCafe?.lat || 14.5995}
          initialLng={selectedCafe?.lng || 120.9842}
          onClose={() => setShowAddForm(false)}
          onShopAdded={handleShopAdded}
        />
      )}
    </div>
  );
}

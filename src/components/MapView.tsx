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
import AmbientPlayer from "@/components/AmbientPlayer";
import OnboardingModal from "@/components/OnboardingModal";
import { SparklesIcon } from "@/components/Icons";
import { getOrCreateSessionId } from "@/lib/session";
import { ToastProvider, useToast } from "@/components/Toast";

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

function MapViewContent() {
  const { showToast } = useToast();
  const [cafes, setCafes] = useState<CafeData[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<CafeData | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"nearby" | "saved">("nearby");

  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hoveredCafeId, setHoveredCafeId] = useState<number | string | null>(null);
  
  // Session & Favorites state initialized lazily
  const [sessionId] = useState<string>(() =>
    typeof window !== "undefined" ? getOrCreateSessionId() : ""
  );
  const [favoriteIds, setFavoriteIds] = useState<Set<number | string>>(new Set());
  const flyKeyRef = useRef(0);

  // Show onboarding for first-time visitors (after hydration, via rAF to satisfy React 19 lint)
  useEffect(() => {
    requestAnimationFrame(() => {
      try {
        if (!localStorage.getItem("bw_onboarding_completed")) {
          setShowOnboarding(true);
        }
      } catch {
        // Ignore storage errors
      }
    });
  }, []);

  // Check URL deep-links and load existing favorites
  useEffect(() => {
    // Check URL search parameters for shared café links
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const rawLat = parseFloat(params.get("lat") || "");
      const rawLng = parseFloat(params.get("lng") || "");
      const shopName = params.get("shop");

      if (!isNaN(rawLat) && !isNaN(rawLng)) {
        flyKeyRef.current += 1;
        setFlyTo({ lat: rawLat, lng: rawLng, key: flyKeyRef.current });

        if (shopName) {
          setSelectedCafe({
            id: Date.now(),
            name: shopName,
            lat: rawLat,
            lng: rawLng,
            tags: { name: shopName },
          });
          setShowDetail(true);
        }
      }
    }

    const sessId = sessionId || (typeof window !== "undefined" ? getOrCreateSessionId() : "");
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
  }, [sessionId]);

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

  function handleSearchSelect(lat: number, lng: number) {
    flyKeyRef.current += 1;
    setFlyTo({ lat, lng, key: flyKeyRef.current });
  }

  // Surprise / Random cafe picker
  function handleSurpriseMe() {
    const list = filteredCafes.length > 0 ? filteredCafes : cafes;
    if (list.length === 0) return;
    const randomIndex = Math.floor(Math.random() * list.length);
    const chosen = list[randomIndex];
    handleCafeSelect(chosen);
    showToast(`Serendipity pick: ${chosen.name}! ☕`, "sparkle");
  }

  // Toggle favorite shop with optimistic UI update
  async function handleToggleFavorite(cafeId: number | string) {
    if (!sessionId) return;

    const isFav = favoriteIds.has(cafeId);
    showToast(
      isFav ? "Removed from saved spots" : "Saved to your café passport! ♥️",
      isFav ? "info" : "heart"
    );

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
    showToast(`Added "${newShop.name}" to the community map! ✨`, "sparkle");
    // Fly map to newly added shop
    flyKeyRef.current += 1;
    setFlyTo({ lat: newShop.lat, lng: newShop.lng, key: flyKeyRef.current });
  }

  return (
    <div className={`split-layout ${isSidebarOpen ? "" : "split-layout--collapsed"}`}>
      {/* Side panel */}
      <aside
        suppressHydrationWarning
        className="split-layout__panel"
        aria-label="Cafe list"
        style={{ position: "relative" }}
      >

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
            {/* Header with Search & Navigation */}
            <div className="sidebar-header">
              {/* 1. App Brand & Utility Toolbar */}
              <div className="sidebar-brand-row">
                <div className="sidebar-brand">
                  <div className="sidebar-brand__logo">☕</div>
                  <div className="sidebar-brand__text">
                    <span className="sidebar-brand__name">brew warm</span>
                    <span className="sidebar-brand__tagline">café radar</span>
                  </div>
                </div>

                <div className="sidebar-utility-actions">
                  <AmbientPlayer />
                  <ThemeToggle />
                  <button
                    type="button"
                    onClick={() => setShowOnboarding(true)}
                    className="sidebar-utility-btn"
                    title="Welcome Guide & Tour (?)"
                    aria-label="Open Welcome Guide"
                  >
                    ?
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="sidebar-add-btn"
                    title="Add a café to the community map"
                    aria-label="Add a café"
                  >
                    + add
                  </button>
                </div>
              </div>

              {/* 2. Sleek Search Bar */}
              <SearchBar onLocationSelect={handleSearchSelect} />

              {/* 3. Segmented Navigation Tabs & Serendipity Surprise */}
              <div className="sidebar-nav-row">
                <div className="sidebar-segmented-control" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "nearby"}
                    className={`sidebar-tab ${activeTab === "nearby" ? "sidebar-tab--active" : ""}`}
                    onClick={() => setActiveTab("nearby")}
                  >
                    <span>nearby</span>
                    <span className="sidebar-tab__badge">{filteredCafes.length}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "saved"}
                    className={`sidebar-tab ${activeTab === "saved" ? "sidebar-tab--active" : ""}`}
                    onClick={() => setActiveTab("saved")}
                  >
                    <span>saved</span>
                    <span className="sidebar-tab__badge">{favoriteIds.size}</span>
                  </button>
                </div>

                {activeTab === "nearby" && (
                  <button
                    type="button"
                    onClick={handleSurpriseMe}
                    className="sidebar-surprise-btn"
                    title="Pick a random coffee spot nearby"
                  >
                    <SparklesIcon size={12} color="var(--color-accent)" />
                    <span>surprise me</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab content in dedicated scroll container */}
            <div className="sidebar-scroll-content">
              {activeTab === "nearby" ? (
                <>
                  {/* Filter tags toolbar */}
                  <FilterBar
                    activeFilters={activeFilters}
                    onToggle={handleFilterToggle}
                    cafeCount={filteredCafes.length}
                  />

                  {/* Café list */}
                  <div className="cafe-list">
                    {filteredCafes.map((cafe, i) => (
                      <ShopCard
                        key={cafe.id}
                        cafe={cafe}
                        index={i}
                        isActive={selectedCafe?.id === cafe.id}
                        isHovered={hoveredCafeId === cafe.id}
                        onSelect={handleCafeSelect}
                        onHover={setHoveredCafeId}
                        isFavorite={favoriteIds.has(cafe.id)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}

                    {filteredCafes.length === 0 && (
                      <div
                        className="empty-state"
                        style={{
                          padding: "2rem 1.25rem",
                          backgroundColor: "var(--color-surface)",
                          border: "1px dashed var(--color-border)",
                          borderRadius: "var(--radius-md)",
                          textAlign: "center",
                          marginTop: "0.5rem",
                        }}
                      >
                        {activeFilters.size > 0 ? (
                          <>
                            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>☕🔍</div>
                            <p className="text-accent-script" style={{ fontSize: "1.25rem", marginBottom: "0.35rem" }}>
                              no cafés match your filters
                            </p>
                            <p className="text-micro" style={{ maxWidth: "260px", margin: "0 auto 1.25rem", lineHeight: 1.4 }}>
                              {cafes.length} total cafés found in this area, but none match your active filters.
                            </p>
                            <button
                              type="button"
                              onClick={() => setActiveFilters(new Set())}
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
                              <span>↺ clear all filters</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🗺️☕</div>
                            <p className="text-accent-script" style={{ fontSize: "1.25rem", marginBottom: "0.35rem" }}>
                              quiet corner of the map
                            </p>
                            <p className="text-micro" style={{ maxWidth: "260px", margin: "0 auto 1rem", lineHeight: 1.4 }}>
                              Pan the map to explore new areas, or jump directly to popular café hubs:
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginBottom: "1.25rem" }}>
                              <button
                                type="button"
                                onClick={() => handleSearchSelect(13.1391, 123.7438)}
                                className="pill"
                                style={{ cursor: "pointer", fontSize: "0.68rem" }}
                              >
                                🌋 Legazpi
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSearchSelect(14.5547, 121.0494)}
                                className="pill"
                                style={{ cursor: "pointer", fontSize: "0.68rem" }}
                              >
                                🏙️ BGC
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSearchSelect(14.5547, 121.0244)}
                                className="pill"
                                style={{ cursor: "pointer", fontSize: "0.68rem" }}
                              >
                                ☕ Makati
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSearchSelect(10.3157, 123.8854)}
                                className="pill"
                                style={{ cursor: "pointer", fontSize: "0.68rem" }}
                              >
                                🌴 Cebu
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAddForm(true)}
                              className="pill pill--filter-active"
                              style={{
                                cursor: "pointer",
                                padding: "6px 14px",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                              }}
                            >
                              <span>+ add a café here</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <FavoritesPanel
                  sessionId={sessionId}
                  onSelectShop={handleCafeSelect}
                  onHoverShop={setHoveredCafeId}
                  hoveredCafeId={hoveredCafeId}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  onExploreCafes={() => setActiveTab("nearby")}
                />
              )}
            </div>


          </>
        )}
      </aside>

      {/* Map area */}
      <div className="split-layout__map">
        {/* Sidebar Toggle — compact café-styled pill */}
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          style={{
            position: "absolute",
            top: "14px",
            left: "14px",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "7px 14px 7px 10px",
            backgroundColor: "rgba(var(--rgb-bg), 0.85)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid var(--color-border)",
            borderRadius: "100px",
            cursor: "pointer",
            boxShadow: "0 2px 12px -3px rgba(0,0,0,0.18)",
            transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-accent)";
            e.currentTarget.style.boxShadow = "0 4px 18px -4px rgba(var(--rgb-accent), 0.3)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.boxShadow = "0 2px 12px -3px rgba(0,0,0,0.18)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {/* Animated chevron */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
              transform: isSidebarOpen ? "rotate(0deg)" : "rotate(180deg)",
            }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.68rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "var(--color-text-secondary)",
              whiteSpace: "nowrap",
              transition: "color 200ms ease",
            }}
          >
            {isSidebarOpen ? "hide" : "show"}
          </span>
        </button>

        <Map
          onCafesLoaded={setCafes}
          onCafeSelect={handleCafeSelect}
          selectedCafeId={selectedCafe?.id ?? null}
          hoveredCafeId={hoveredCafeId}
          flyTo={flyTo}
          isSidebarOpen={isSidebarOpen}
        />

      </div>

      {/* Add shop modal */}
      {showAddForm && (
        <AddShopForm
          initialLat={selectedCafe?.lat || 13.1391}
          initialLng={selectedCafe?.lng || 123.7438}
          onClose={() => setShowAddForm(false)}
          onShopAdded={handleShopAdded}
        />
      )}

      {/* First-time onboarding guide modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          try {
            localStorage.setItem("bw_onboarding_completed", "true");
          } catch {
            // Ignore storage errors
          }
        }}
      />
    </div>
  );
}

export default function MapView() {
  return (
    <ToastProvider>
      <MapViewContent />
    </ToastProvider>
  );
}

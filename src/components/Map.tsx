"use client";

import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import type { CafeData, OverpassBounds } from "@/lib/overpass";
import { fetchCafes } from "@/lib/overpass";
import { CompassIcon } from "./Icons";


/* -------------------------------------------------------
   Custom Marker Icons — brew-warm terracotta pins
   ------------------------------------------------------- */

function createCafeIcon() {
  return L.divIcon({
    className: "cafe-marker",
    html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.268 21.732 0 14 0z" fill="var(--color-accent, #C1682F)"/>
      <circle cx="14" cy="13" r="6" fill="var(--color-bg, #FBF6EE)" opacity="0.9"/>
      <text x="14" y="16" text-anchor="middle" font-size="10" fill="var(--color-accent, #C1682F)">☕</text>
    </svg>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  });
}

function createActiveCafeIcon() {
  return L.divIcon({
    className: "cafe-marker cafe-marker--active",
    html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.268 21.732 0 14 0z" fill="var(--color-accent, #C1682F)"/>
      <circle cx="14" cy="13" r="6.5" fill="#FFFFFF"/>
      <text x="14" y="16.5" text-anchor="middle" font-size="10.5" font-weight="bold" fill="var(--color-accent, #C1682F)">☕</text>
    </svg>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  });
}

function createHoveredCafeIcon() {
  return L.divIcon({
    className: "cafe-marker cafe-marker--hovered",
    html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.268 21.732 0 14 0z" fill="var(--color-accent, #C1682F)"/>
      <circle cx="14" cy="13" r="6.5" fill="#FFFFFF"/>
      <text x="14" y="16.5" text-anchor="middle" font-size="10.5" font-weight="bold" fill="var(--color-accent, #C1682F)">☕</text>
    </svg>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  });
}



function createUserIcon() {
  return L.divIcon({
    className: "user-marker",
    html: `<div style="
      width: 16px;
      height: 16px;
      background: var(--color-accent, #C1682F);
      border: 3px solid var(--color-bg, #FBF6EE);
      border-radius: 50%;
      box-shadow: 0 0 8px 3px rgba(193,104,47,0.35);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

/* -------------------------------------------------------
   Map event listener — fires on move/zoom end
   ------------------------------------------------------- */
function MapEventHandler({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: OverpassBounds) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      onBoundsChange({
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      });
    },
  });
  return null;
}

/* -------------------------------------------------------
   Fly to user location when obtained
   ------------------------------------------------------- */
function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const hasFlown = useRef(false);

  useEffect(() => {
    if (!hasFlown.current) {
      map.flyTo([lat, lng], 15, { duration: 1.5 });
      hasFlown.current = true;
    }
  }, [map, lat, lng]);

  return null;
}

/* -------------------------------------------------------
   Main Map Component
   ------------------------------------------------------- */

interface FlyToTarget {
  lat: number;
  lng: number;
  key: number; // incrementing counter to force re-fly
}

interface MapProps {
  onCafesLoaded?: (cafes: CafeData[]) => void;
  onCafeSelect?: (cafe: CafeData) => void;
  selectedCafeId?: number | null;
  hoveredCafeId?: number | string | null;
  flyTo?: FlyToTarget | null;
  isSidebarOpen?: boolean;
}

/* -------------------------------------------------------
   Resize map canvas when sidebar is collapsed/expanded
   ------------------------------------------------------- */
function MapResizeNotifier({ isSidebarOpen }: { isSidebarOpen?: boolean }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 360);
    return () => clearTimeout(timer);
  }, [map, isSidebarOpen]);

  return null;
}

/* -------------------------------------------------------
   Fly to a target location (triggered by search)
   ------------------------------------------------------- */
function FlyToSearch({ flyTo }: { flyTo: FlyToTarget | null }) {
  const map = useMap();
  const prevKeyRef = useRef<number>(-1);

  useEffect(() => {
    if (!flyTo || flyTo.key === prevKeyRef.current) return;
    prevKeyRef.current = flyTo.key;
    map.flyTo([flyTo.lat, flyTo.lng], 15, { duration: 1.5 });
  }, [map, flyTo]);

  return null;
}

export default function Map({
  onCafesLoaded,
  onCafeSelect,
  selectedCafeId,
  hoveredCafeId,
  flyTo,
  isSidebarOpen,
}: MapProps) {

  const [cafes, setCafes] = useState<CafeData[]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locateFly, setLocateFly] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const locateKeyRef = useRef(0);

  // Memoized marker icons
  const cafeIcon = useMemo(() => createCafeIcon(), []);
  const activeCafeIcon = useMemo(() => createActiveCafeIcon(), []);
  const hoveredCafeIcon = useMemo(() => createHoveredCafeIcon(), []);
  const userIcon = useMemo(() => createUserIcon(), []);


  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Default center (Legazpi City, Albay, Philippines)
  const defaultCenter: [number, number] = [13.1391, 123.7438];

  // Request user geolocation on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // Geolocation denied or unavailable, fallback to default center
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }
  }, []);

  // Manual locate handler on click
  function handleManualLocate() {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(coords);
          setIsLocating(false);
          locateKeyRef.current += 1;
          setLocateFly({ lat: coords[0], lng: coords[1], key: locateKeyRef.current });
        },
        () => {
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }

  // Fetch cafes with debounce when bounds change
  const handleBoundsChange = useCallback(
    (bounds: OverpassBounds) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchCafes(bounds);
          setCafes(data);
          onCafesLoaded?.(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to fetch cafes");
        } finally {
          setLoading(false);
        }
      }, 600);
    },
    [onCafesLoaded]
  );

  return (

    <div className="map-wrapper">
      {/* Loading / error indicator */}
      {loading && (
        <div className="map-status map-status--loading">
          <span className="text-micro">loading cafés...</span>
        </div>
      )}
      {error && (
        <div className="map-status map-status--error">
          <span className="text-micro">{error}</span>
        </div>
      )}

      {/* Floating GPS Locate Me Button */}
      <button
        type="button"
        onClick={handleManualLocate}
        className="map-locate-btn"
        aria-label="Center on my location"
        title="Center on my location"

        style={{
          position: "absolute",
          bottom: "1.25rem",
          right: "1.25rem",
          zIndex: 999,
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 4px 14px rgba(43, 27, 18, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--color-accent)",
          transition: "all 150ms ease",
        }}
      >
        <CompassIcon size={20} color={isLocating ? "var(--color-text-secondary)" : "var(--color-accent)"} />
      </button>

      <MapContainer
        center={userPos ?? defaultCenter}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler onBoundsChange={handleBoundsChange} />
        <MapResizeNotifier isSidebarOpen={isSidebarOpen} />

        {flyTo && <FlyToSearch flyTo={flyTo} />}
        {locateFly && <FlyToSearch flyTo={locateFly} />}
        {userPos && !locateFly && <FlyToLocation lat={userPos[0]} lng={userPos[1]} />}

        {/* User location marker */}
        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                your location
              </span>
            </Popup>
          </Marker>
        )}

        {/* Cafe markers */}
        {cafes.map((cafe) => {
          const isSelected = cafe.id === selectedCafeId;
          const isHovered = cafe.id === hoveredCafeId;
          const icon = isSelected ? activeCafeIcon : isHovered ? hoveredCafeIcon : cafeIcon;
          const zOffset = isSelected ? 1000 : isHovered ? 900 : 0;

          return (
            <Marker
              key={cafe.id}
              position={[cafe.lat, cafe.lng]}
              icon={icon}
              zIndexOffset={zOffset}
              eventHandlers={{
                click: () => onCafeSelect?.(cafe),
              }}
            >

              <Popup>
                <div className="cafe-popup">
                  <strong
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "14px",
                    }}
                  >
                    {cafe.name}
                  </strong>

                {cafe.tags.opening_hours && (
                  <p
                    className="text-micro"
                    style={{ marginTop: "4px" }}
                  >
                    {cafe.tags.opening_hours}
                  </p>
                )}
                {cafe.tags.cuisine && (
                  <p
                    className="text-micro"
                    style={{ marginTop: "2px" }}
                  >
                    {cafe.tags.cuisine}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>



      {/* Cafe count badge */}
      <div className="map-cafe-count">
        <span className="text-micro">
          {cafes.length} {cafes.length === 1 ? "café" : "cafés"} found
        </span>
      </div>
    </div>
  );
}


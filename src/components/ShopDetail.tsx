"use client";

import { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import type { CafeData } from "@/lib/overpass";
import { useToast } from "@/components/Toast";

import {
  CompassIcon,
  HeartIcon,
  ShareIcon,
  MapPinIcon,
  CoffeeIcon,
  PhoneIcon,
  GlobeIcon,
  ClockIcon,
  WifiIcon,
  OutdoorIcon,
  WheelchairIcon,
  ArrowLeftIcon,
} from "./Icons";

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
  const { showToast } = useToast();

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

  // Safe website parser
  const safeWebsiteUrl = (() => {
    if (!cafe.tags.website) return null;
    try {
      const url = new URL(
        cafe.tags.website.startsWith("http://") || cafe.tags.website.startsWith("https://")
          ? cafe.tags.website
          : `https://${cafe.tags.website}`
      );
      if (url.protocol === "http:" || url.protocol === "https:") {
        return { href: url.href, host: url.hostname };
      }
    } catch {
      // Invalid URL
    }
    return null;
  })();

  // Share handler with deep link
  async function handleShare() {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://brew-warm.vercel.app";
    const shareUrl = `${origin}/?lat=${cafe.lat.toFixed(5)}&lng=${cafe.lng.toFixed(5)}&shop=${encodeURIComponent(cafe.name)}`;
    const shareText = `Check out ${cafe.name} on Brew Warm ☕\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cafe.name} — Brew Warm`,
          text: `Check out ${cafe.name} on Brew Warm ☕`,
          url: shareUrl,
        });
        showToast("Link shared! ☕", "coffee");
        return;
      } catch {
        // Fallback to clipboard if share cancelled
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      showToast("Café link copied to clipboard! 📋", "copy");
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
          <ArrowLeftIcon size={14} />
          <span>back to list</span>
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
      <div className="shop-detail-panel__hero" style={{ position: "relative", width: "100%", height: "180px", overflow: "hidden" }}>
        <Image
          src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"
          alt={cafe.name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 420px"
          style={{ objectFit: "cover" }}
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

      {/* Action Buttons Row */}
      <div className="shop-detail-panel__actions">
        {/* Directions */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shop-detail-panel__action-btn"
        >
          <CompassIcon size={18} color="var(--color-accent)" />
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
            <HeartIcon
              size={18}
              filled={isFavorite}
              color={isFavorite ? "#ffffff" : "var(--color-accent)"}
            />
            <span>{isFavorite ? "saved" : "save"}</span>
          </button>
        )}

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="shop-detail-panel__action-btn"
        >
          <ShareIcon size={18} color="var(--color-accent)" />
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
        <div className="shop-detail__row" style={{ alignItems: "flex-start" }}>
          <span
            className="text-micro"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <MapPinIcon size={13} color="var(--color-accent)" />
            location
          </span>
          <span className="shop-detail__value" style={{ fontSize: "var(--text-small)" }}>
            {cafe.tags.address || `${cafe.lat.toFixed(5)}, ${cafe.lng.toFixed(5)}`}
          </span>
        </div>

        {/* Cuisine / Specialty */}
        {cafe.tags.cuisine && (
          <div className="shop-detail__row">
            <span
              className="text-micro"
              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <CoffeeIcon size={13} color="var(--color-accent)" />
              specialty
            </span>
            <span className="shop-detail__value">{cafe.tags.cuisine}</span>
          </div>
        )}

        {/* Phone */}
        {cafe.tags.phone && (
          <div className="shop-detail__row">
            <span
              className="text-micro"
              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <PhoneIcon size={13} color="var(--color-accent)" />
              phone
            </span>
            <span className="shop-detail__value">
              <a href={`tel:${cafe.tags.phone}`}>{cafe.tags.phone}</a>
            </span>
          </div>
        )}

        {/* Website */}
        {safeWebsiteUrl && (
          <div className="shop-detail__row">
            <span
              className="text-micro"
              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <GlobeIcon size={13} color="var(--color-accent)" />
              website
            </span>
            <span className="shop-detail__value">
              <a href={safeWebsiteUrl.href} target="_blank" rel="noopener noreferrer">
                {safeWebsiteUrl.host}
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ClockIcon size={15} color="var(--color-accent)" />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-small)",
                color: "var(--color-text-primary)",
              }}
            >
              {cafe.tags.opening_hours}
            </span>
          </div>
        </>
      )}

      {/* Section: Amenities */}
      <hr className="divider" style={{ margin: "1.25rem 0" }} />
      <p className="section-header" style={{ marginBottom: "0.75rem" }}>
        {hasHours ? "03" : "02"} — amenities
      </p>
      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
        {hasWifi && (
          <span
            className="pill"
            style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            <WifiIcon size={13} />
            wifi
          </span>
        )}
        {hasOutdoor && (
          <span
            className="pill"
            style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            <OutdoorIcon size={13} />
            outdoor seating
          </span>
        )}
        {hasWheelchair && (
          <span
            className="pill"
            style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            <WheelchairIcon size={13} />
            wheelchair accessible
          </span>
        )}
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

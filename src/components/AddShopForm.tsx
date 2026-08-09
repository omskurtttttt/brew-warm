"use client";

import { useState, useCallback, useEffect } from "react";

interface AddShopFormProps {
  initialLat?: number;
  initialLng?: number;
  onClose: () => void;
  onShopAdded: (shop: {
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
    source: string;
  }) => void;
}

export default function AddShopForm({
  initialLat = 14.5995,
  initialLng = 120.9842,
  onClose,
  onShopAdded,
}: AddShopFormProps) {
  const [name, setName] = useState("");
  const [lat, setLat] = useState(initialLat.toFixed(5));
  const [lng, setLng] = useState(initialLng.toFixed(5));
  const [address, setAddress] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [hasWifi, setHasWifi] = useState(false);
  const [hasOutdoor, setHasOutdoor] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (!name.trim()) {
      setError("Please enter a café name");
      return;
    }
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setError("Please enter valid numeric latitude and longitude");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          lat: parsedLat,
          lng: parsedLng,
          address: address.trim() || undefined,
          openingHours: openingHours.trim() || undefined,
          cuisine: cuisine.trim() || undefined,
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          internetAccess: hasWifi ? "wlan" : undefined,
          outdoorSeating: hasOutdoor ? "yes" : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit café");
      }

      onShopAdded(data.shop);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />

      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Add a Coffee Shop"
      >
        <button
          className="shop-detail__close"
          onClick={onClose}
          aria-label="Close form"
        >
          ×
        </button>

        <p className="section-header" style={{ marginBottom: "0.25rem" }}>
          01 — submission
        </p>
        <h2 className="text-h1" style={{ marginBottom: "1.25rem" }}>
          add a coffee shop
        </h2>

        {error && (
          <div
            style={{
              padding: "0.75rem",
              marginBottom: "1rem",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "rgba(193, 104, 47, 0.15)",
              border: "1px solid var(--color-accent)",
              color: "var(--color-accent)",
              fontSize: "var(--text-small)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          {/* Name */}
          <div>
            <label className="text-micro" style={{ display: "block", marginBottom: "0.25rem" }}>
              café name *
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Craft Coffee Revolution"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Location coordinates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <div>
              <label className="text-micro" style={{ display: "block", marginBottom: "0.25rem" }}>
                latitude *
              </label>
              <input
                className="input"
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-micro" style={{ display: "block", marginBottom: "0.25rem" }}>
                longitude *
              </label>
              <input
                className="input"
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-micro" style={{ display: "block", marginBottom: "0.25rem" }}>
              street address
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. 66 Broadway Ave, Cubao"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Opening Hours */}
          <div>
            <label className="text-micro" style={{ display: "block", marginBottom: "0.25rem" }}>
              opening hours
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Mo-Su 08:00-22:00"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
            />
          </div>

          {/* Cuisine / Specialty */}
          <div>
            <label className="text-micro" style={{ display: "block", marginBottom: "0.25rem" }}>
              specialty / cuisine
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Espresso, Pour Over, Pastries"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
            />
          </div>

          {/* Phone & Website */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <div>
              <label className="text-micro" style={{ display: "block", marginBottom: "0.25rem" }}>
                phone
              </label>
              <input
                className="input"
                type="text"
                placeholder="+63 917 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-micro" style={{ display: "block", marginBottom: "0.25rem" }}>
                website
              </label>
              <input
                className="input"
                type="url"
                placeholder="https://..."
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          {/* Amenities checkboxes */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer", fontSize: "var(--text-small)" }}>
              <input
                type="checkbox"
                checked={hasWifi}
                onChange={(e) => setHasWifi(e.target.checked)}
              />
              <span>Has Wi-Fi</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer", fontSize: "var(--text-small)" }}>
              <input
                type="checkbox"
                checked={hasOutdoor}
                onChange={(e) => setHasOutdoor(e.target.checked)}
              />
              <span>Outdoor Seating</span>
            </label>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-bg)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-small)",
                fontWeight: 600,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "submitting..." : "submit café"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.75rem 1.25rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-small)",
                cursor: "pointer",
              }}
            >
              cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  function cycleTheme() {
    const next =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);

    if (next === "system") {
      localStorage.removeItem("bw-theme");
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem("bw-theme", next);
      document.documentElement.setAttribute("data-theme", next);
    }

    // Crossfade transition
    document.documentElement.classList.add("theme-transitioning");
    setTimeout(
      () => document.documentElement.classList.remove("theme-transitioning"),
      600
    );
  }

  return (
    <div className="page-container" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
      {/* Page title */}
      <header style={{ marginBottom: "3rem" }}>
        <p className="section-header" style={{ marginBottom: "0.5rem" }}>
          01 — design preview
        </p>
        <h1 className="text-page-title">your next favorite spot</h1>
        <p
          className="text-body-long"
          style={{ marginTop: "1rem", maxWidth: "32rem", color: "var(--color-text-secondary)" }}
        >
          Brew Warm helps you discover nearby coffee shops on an interactive
          map — free, open-source, powered by OpenStreetMap.
        </p>
      </header>

      {/* Theme toggle */}
      <div style={{ marginBottom: "2rem" }}>
        <button className="btn-primary" onClick={cycleTheme}>
          theme: {theme}
        </button>
      </div>

      {/* Cards */}
      <p className="section-header" style={{ marginBottom: "1rem" }}>
        02 — shop cards
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "var(--card-gap)",
          marginBottom: "3rem",
        }}
      >
        {[
          {
            name: "The Warm Corner",
            distance: "0.3 km",
            open: true,
            tags: ["wifi", "outdoor"],
            featured: false,
          },
          {
            name: "Roast & Rest",
            distance: "0.8 km",
            open: true,
            tags: ["quiet", "$$"],
            featured: true,
          },
          {
            name: "Midnight Brew",
            distance: "1.2 km",
            open: false,
            tags: ["late night", "cozy"],
            featured: false,
          },
        ].map((shop, i) => (
          <div
            key={shop.name}
            className="card entrance-stagger"
            style={{ animationDelay: `${50 + i * 60}ms` }}
          >
            {/* Photo placeholder */}
            <div
              style={{
                height: "120px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-neutral-100)",
                marginBottom: "var(--space-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="text-micro"
                style={{ color: "var(--color-neutral-400)" }}
              >
                photo
              </span>
            </div>

            {/* Header row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.25rem",
              }}
            >
              <h2 className="text-h2">{shop.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span
                  className={`status-dot ${shop.open ? "" : "status-dot--closed"}`}
                />
                <span className="text-micro">
                  {shop.open ? "open" : "closed"}
                </span>
              </div>
            </div>

            {/* Distance */}
            <p className="text-micro" style={{ marginBottom: "0.75rem" }}>
              {shop.distance}
            </p>

            {/* Tags */}
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {shop.featured && (
                <span className="pill pill--featured">barista&apos;s pick</span>
              )}
              {shop.tags.map((tag) => (
                <span key={tag} className="pill">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Typography showcase */}
      <p className="section-header" style={{ marginBottom: "1rem" }}>
        03 — typography
      </p>
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h2 className="text-h1" style={{ marginBottom: "0.5rem" }}>
          Fraunces Display
        </h2>
        <p className="text-body-long" style={{ marginBottom: "1rem" }}>
          Inter body text — A cozy neighborhood café with handmade pastries,
          single-origin pour-overs, and a reading nook tucked behind the
          espresso bar.
        </p>
        <p className="text-micro" style={{ marginBottom: "0.75rem" }}>
          ibm plex mono · micro-label · 0.3 km · open until 10:00 pm
        </p>
        <p className="text-accent-script">closes soon — grab your cup!</p>
      </div>

      {/* Buttons & Inputs */}
      <p className="section-header" style={{ marginBottom: "1rem" }}>
        04 — controls
      </p>
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "1.25rem",
          }}
        >
          <button className="btn-primary">find cafés nearby</button>
          <button className="btn-secondary">view all</button>
        </div>
        <input
          className="input"
          type="text"
          placeholder="search for a neighborhood or address..."
        />
      </div>

      {/* Color palette */}
      <p className="section-header" style={{ marginBottom: "1rem" }}>
        05 — palette
      </p>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "3rem",
        }}
      >
        {[
          { label: "bg", color: "var(--color-bg)" },
          { label: "ink", color: "var(--color-ink)" },
          { label: "accent", color: "var(--color-accent)" },
          { label: "accent muted", color: "var(--color-accent-muted)" },
          { label: "n-50", color: "var(--color-neutral-50)" },
          { label: "n-100", color: "var(--color-neutral-100)" },
          { label: "n-200", color: "var(--color-neutral-200)" },
          { label: "n-300", color: "var(--color-neutral-300)" },
          { label: "n-400", color: "var(--color-neutral-400)" },
          { label: "n-500", color: "var(--color-neutral-500)" },
        ].map((swatch) => (
          <div key={swatch.label} style={{ textAlign: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: swatch.color,
                border: "1px solid var(--color-border)",
              }}
            />
            <span
              className="text-micro"
              style={{ marginTop: "4px", display: "block", fontSize: "8px" }}
            >
              {swatch.label}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <hr className="divider" />
      <p
        className="text-micro"
        style={{ textAlign: "center", paddingTop: "1rem" }}
      >
        brew warm · design system preview · day 1
      </p>
    </div>
  );
}

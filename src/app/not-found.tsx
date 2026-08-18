import Link from "next/link";
import CoffeeStain from "@/components/CoffeeStain";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        backgroundColor: "var(--color-bg)",
        color: "var(--color-ink)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <CoffeeStain position="top-right" opacity={0.08} size={280} />
      <CoffeeStain position="bottom-left" opacity={0.06} size={240} />

      <div
        style={{
          maxWidth: "480px",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <span
          style={{
            fontSize: "4rem",
            lineHeight: 1,
            filter: "drop-shadow(0 4px 12px rgba(193, 104, 47, 0.2))",
          }}
        >
          ☕
        </span>
        <p className="section-header">404 — cup is empty</p>
        <h1 className="text-h1" style={{ fontSize: "2.5rem" }}>
          this café doesn&apos;t exist yet
        </h1>
        <p
          className="text-body"
          style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}
        >
          The page or coffee shop you were looking for seems to have closed down
          or spilled off the map.
        </p>

        <div style={{ marginTop: "1rem" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-bg)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-small)",
              fontWeight: 600,
              textDecoration: "none",
              transition: "transform 150ms ease, opacity 150ms ease",
            }}
          >
            ← return to coffee map
          </Link>
        </div>
      </div>
    </div>
  );
}

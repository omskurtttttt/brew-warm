"use client";

import { useEffect } from "react";
import Link from "next/link";
import CoffeeStain from "@/components/CoffeeStain";


export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Brew Warm Application Error:", error);
  }, [error]);

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
      <CoffeeStain position="top-left" opacity={0.07} size={260} />
      <div
        style={{
          maxWidth: "460px",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "3.5rem" }}>☕💥</span>
        <p className="section-header">something spilled</p>
        <h1 className="text-h1" style={{ fontSize: "2rem" }}>
          an unexpected error occurred
        </h1>
        <p
          className="text-body"
          style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}
        >
          We encountered an issue loading the coffee map. Don&apos;t worry, your
          saved spots are safe.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-bg)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-small)",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            ↻ try again
          </button>
          <Link
            href="/"
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-ink)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-small)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            reload app
          </Link>

        </div>
      </div>
    </div>
  );
}
